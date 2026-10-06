import { timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { isValidPassword } from "@/lib/customer-password";
import {
  createCustomerSessionToken,
  customerSessionCookieOptions,
  CUSTOMER_SESSION_COOKIE,
} from "@/lib/customer-session";
import { databaseNow, isValidEmail } from "@/lib/email-otp";
import { hasTrustedOrigin, jsonError } from "@/lib/http";
import { getRequestIp } from "@/lib/rate-limit";
import { takeRateLimitDb } from "@/lib/rate-limit-db";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/*
  Checks the 6-digit code that was emailed, then signs the customer in.

  mode "verify" (default)  finish an email sign-up.
      The password chosen at sign-up is sent again and must match. This
      stops someone who re-submits the sign-up form with the same email and
      THEIR password from getting an account that the real owner then
      verifies: the owner's password would no longer match, and the sign-up
      simply has to be started again.

  mode "reset"             forgot password.
      The code proves the email belongs to the customer; `newPassword`
      replaces the old one.

  Codes sent back with a failure:
    BAD_CODE       wrong, used or expired code
    PASSWORD       the password does not match the one from sign-up
    BAD_PASSWORD   the new password is not 8 to 72 characters
    TOO_MANY       too many tries
*/

function fail(
  code: string,
  error: string,
  status: number,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) {
  return NextResponse.json(
    { success: false, code, error, ...extra },
    { status, headers: { "Cache-Control": "no-store", ...headers } }
  );
}

function sameText(first: string, second: string) {
  const a = Buffer.from(first);
  const b = Buffer.from(second);

  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!hasTrustedOrigin(req)) return jsonError("Invalid request origin", 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("BAD_CODE", "Invalid request body.", 400);
  }

  const b = (body || {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const code = typeof b.code === "string" ? b.code.trim() : "";
  const mode = b.mode === "reset" ? "reset" : "verify";
  const password = typeof b.password === "string" ? b.password : "";
  const newPassword = typeof b.newPassword === "string" ? b.newPassword : "";

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return fail("BAD_CODE", "Invalid or expired verification code.", 422);
  }

  // Checked before the code is spent.
  if (mode === "reset" && !isValidPassword(newPassword)) {
    return fail("BAD_PASSWORD", "Password must be 8 to 72 characters.", 422);
  }

  // ── Brute-force protection ───────────────────────────────────────────────────
  // A 6-digit code has 1,000,000 combinations: 5 tries per email and 20 per
  // device in 15 minutes.
  const [emailLimit, ipLimit] = await Promise.all([
    takeRateLimitDb({ key: `email-otp-verify:${email}`, limit: 5, windowSeconds: 900 }),
    takeRateLimitDb({ key: `email-otp-verify-ip:${getRequestIp(req)}`, limit: 20, windowSeconds: 900 }),
  ]);

  if (emailLimit.unavailable || ipLimit.unavailable) {
    return fail(
      "TOO_MANY",
      "Verification is temporarily unavailable. Please try again shortly.",
      503
    );
  }

  if (!emailLimit.allowed || !ipLimit.allowed) {
    const retryAfter = Math.max(
      1,
      emailLimit.allowed ? 0 : emailLimit.retryAfterSeconds,
      ipLimit.allowed ? 0 : ipLimit.retryAfterSeconds
    );

    return fail(
      "TOO_MANY",
      `Too many attempts. Please wait ${retryAfter}s and request a new code.`,
      429,
      { retryAfter },
      { "Retry-After": String(retryAfter) }
    );
  }

  // ── The account ──────────────────────────────────────────────────────────────
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, phone, email, password_hash, email_verified")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    console.error("Email verification lookup failed:", profileError);
    return fail("BAD_CODE", "Could not verify the code. Please try again.", 500);
  }

  // The same answer as a wrong code, so this does not reveal which emails
  // have an account.
  const invalid = () =>
    fail("BAD_CODE", "Invalid or expired verification code.", 400);

  if (!profile) return invalid();

  // A reset is for an account that already finished sign-up.
  if (mode === "reset" && profile.email_verified !== true) return invalid();

  // ── The most recent unused code ──────────────────────────────────────────────
  const { data: otpRow } = await supabaseAdmin
    .from("email_verification_codes")
    .select("id, code, expires_at, used")
    .eq("email", email)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otpRow) return invalid();

  if (new Date(otpRow.expires_at).getTime() < (await databaseNow())) {
    return fail(
      "BAD_CODE",
      "Verification code has expired. Please request a new one.",
      400
    );
  }

  if (!sameText(String(otpRow.code), code)) return invalid();

  // ── Sign-up: the password must be the one this sign-up was started with ─────
  if (mode === "verify") {
    const matches =
      Boolean(password) &&
      Boolean(profile.password_hash) &&
      (await bcrypt.compare(password, String(profile.password_hash)));

    if (!matches) {
      return fail(
        "PASSWORD",
        "This sign-up could not be confirmed. Please start again.",
        409
      );
    }
  }

  // The code is used up only now, by a request that fully succeeded so far.
  // The filter makes sure two requests cannot both use the same code.
  const { data: spent, error: spendError } = await supabaseAdmin
    .from("email_verification_codes")
    .update({ used: true })
    .eq("id", otpRow.id)
    .eq("used", false)
    .select("id");

  if (spendError || !spent || spent.length === 0) return invalid();

  const update: Record<string, unknown> = { email_verified: true };

  if (mode === "reset") {
    update.password_hash = await bcrypt.hash(newPassword, 12);
  }

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update(update)
    .eq("id", profile.id)
    .eq("email", email);

  if (updateError) {
    console.error("Email verification update failed:", updateError);
    return fail("BAD_CODE", "Could not complete this. Please try again.", 500);
  }

  // ── Sign in ──────────────────────────────────────────────────────────────────
  const token = await createCustomerSessionToken({
    method: "email",
    profileId: Number(profile.id),
    email: String(profile.email),
    phone: String(profile.phone),
  });

  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, customerSessionCookieOptions);

  return NextResponse.json(
    {
      success: true,
      user: {
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        email: profile.email,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
