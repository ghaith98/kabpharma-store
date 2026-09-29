import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  createCustomerSessionToken,
  customerSessionCookieOptions,
  CUSTOMER_SESSION_COOKIE,
} from "@/lib/customer-session";
import { cookies } from "next/headers";
import { hasTrustedOrigin, jsonError } from "@/lib/http";
import { getRequestIp } from "@/lib/rate-limit";
import { takeRateLimitDb } from "@/lib/rate-limit-db";

export async function POST(req: NextRequest) {
  if (!hasTrustedOrigin(req)) return jsonError("Invalid request origin", 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const code = typeof b.code === "string" ? b.code.trim() : "";

  if (!email || !code || code.length !== 6) {
    return NextResponse.json({ error: "Invalid request." }, { status: 422 });
  }

  // ── Brute-force protection ───────────────────────────────────────────────────
  // A 6-digit code has 1,000,000 combinations. Without a limit an attacker
  // can request a code for any email and try them all, then receive a valid
  // session for that account. 5 tries per email / 20 per IP per 15 minutes.
  const [emailLimit, ipLimit] = await Promise.all([
    takeRateLimitDb({ key: `email-otp-verify:${email}`, limit: 5, windowSeconds: 900 }),
    takeRateLimitDb({ key: `email-otp-verify-ip:${getRequestIp(req)}`, limit: 20, windowSeconds: 900 }),
  ]);
  const blocked = !emailLimit.allowed ? emailLimit : !ipLimit.allowed ? ipLimit : null;
  if (blocked) {
    const retryAfter = Math.max(1, blocked.retryAfterSeconds);
    return NextResponse.json(
      {
        error: blocked.unavailable
          ? "Verification is temporarily unavailable. Please try again shortly."
          : `Too many attempts. Please wait ${retryAfter}s and request a new code.`,
        retryAfter,
      },
      { status: blocked.unavailable ? 503 : 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  // ── Get Supabase current time to avoid server clock issues ───────────────────
  const { data: nowData } = await supabaseAdmin.rpc("now") as { data: string };
  const now = new Date(nowData);

  // ── Look up the most recent valid OTP ────────────────────────────────────────
  const { data: otpRow } = await supabaseAdmin
    .from("email_verification_codes")
    .select("id, code, expires_at, used")
    .eq("email", email)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otpRow) {
    return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
  }

  if (new Date(otpRow.expires_at) < now) {
    return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
  }

  if (otpRow.code !== code) {
    return NextResponse.json({ error: "Incorrect verification code." }, { status: 400 });
  }

  await supabaseAdmin
    .from("email_verification_codes")
    .update({ used: true })
    .eq("id", otpRow.id);

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ email_verified: true })
    .eq("email", email)
    .select("id, full_name, phone, email")
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const token = await createCustomerSessionToken({
  method: "email",
  profileId: profile.id,
  email: profile.email,
  phone: profile.phone,
});

  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, customerSessionCookieOptions);

  return NextResponse.json({
    success: true,
    user: {
      id: profile.id,
      full_name: profile.full_name,
      phone: profile.phone,
      email: profile.email,
    },
  });
}