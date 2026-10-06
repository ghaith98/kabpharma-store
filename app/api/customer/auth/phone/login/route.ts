import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import {
  createCustomerSessionToken,
  customerSessionCookieOptions,
  CUSTOMER_SESSION_COOKIE,
} from "@/lib/customer-session";
import { hasTrustedOrigin } from "@/lib/http";
import { getRequestIp } from "@/lib/rate-limit";
import { takeRateLimitDb } from "@/lib/rate-limit-db";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/*
  Sign in with a Syrian mobile number and a password (no WhatsApp code).

  Only for accounts that were created with a phone number: the number was
  proven with a WhatsApp code at sign-up, and the password was set either
  then or later through "forgot password", which also needs a code.

  Accounts created with an email sign in on the Email tab. Their phone
  number was typed in, never proven, so it cannot be used to sign in here.

  Codes sent back with a failure:
    INVALID       wrong number or password (the same answer for both)
    NO_PASSWORD   the account exists but has no password yet
    TOO_MANY      too many attempts; wait `retryAfter` seconds
    UNAVAILABLE   the rate limiter or the database could not be reached
*/

const NO_STORE = { "Cache-Control": "no-store" };

// Compared against when there is no account, so "no such number" takes as
// long as "wrong password" and cannot be told apart by timing.
const DUMMY_HASH =
  "$2b$12$CwTycUXWue0Thq9StjUM0uJ8rA0VqgkP0aP5gOdFDoWQqgU3jYkOu";

function fail(
  code: string,
  error: string,
  status: number,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) {
  return NextResponse.json(
    { success: false, code, error, ...extra },
    { status, headers: { ...NO_STORE, ...headers } }
  );
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return fail("INVALID", "Invalid request origin", 403);
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail("INVALID", "Invalid request body", 400);
  }

  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!/^9639\d{8}$/.test(phone) || !password || password.length > 200) {
    return fail("INVALID", "Incorrect phone number or password.", 401);
  }

  // 10 tries per number and 30 per device in 15 minutes.
  const [phoneLimit, ipLimit] = await Promise.all([
    takeRateLimitDb({
      key: `phone-login:${phone}`,
      limit: 10,
      windowSeconds: 900,
    }),
    takeRateLimitDb({
      key: `phone-login-ip:${getRequestIp(request)}`,
      limit: 30,
      windowSeconds: 900,
    }),
  ]);

  if (phoneLimit.unavailable || ipLimit.unavailable) {
    return fail(
      "UNAVAILABLE",
      "Sign-in is temporarily unavailable. Please try again shortly.",
      503
    );
  }

  if (!phoneLimit.allowed || !ipLimit.allowed) {
    const retryAfter = Math.max(
      1,
      phoneLimit.allowed ? 0 : phoneLimit.retryAfterSeconds,
      ipLimit.allowed ? 0 : ipLimit.retryAfterSeconds
    );

    return fail(
      "TOO_MANY",
      "Too many attempts. Please try again later.",
      429,
      { retryAfter },
      { "Retry-After": String(retryAfter) }
    );
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, phone, email, password_hash")
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    console.error("Phone sign-in lookup failed:", error);

    return fail(
      "UNAVAILABLE",
      "Sign-in is temporarily unavailable. Please try again shortly.",
      503
    );
  }

  // A phone account: created with a WhatsApp code, so it has no email.
  const phoneAccount = profile && !profile.email ? profile : null;

  if (phoneAccount && !phoneAccount.password_hash) {
    return fail(
      "NO_PASSWORD",
      "This account does not have a password yet.",
      409
    );
  }

  const passwordMatches = await bcrypt.compare(
    password,
    phoneAccount?.password_hash || DUMMY_HASH
  );

  if (!phoneAccount || !passwordMatches) {
    return fail("INVALID", "Incorrect phone number or password.", 401);
  }

  const token = await createCustomerSessionToken({
    method: "phone",
    profileId: Number(phoneAccount.id),
    phone: String(phoneAccount.phone),
  });

  const cookieStore = await cookies();

  cookieStore.set(
    CUSTOMER_SESSION_COOKIE,
    token,
    customerSessionCookieOptions
  );

  return NextResponse.json(
    {
      success: true,
      user: {
        id: phoneAccount.id,
        full_name: phoneAccount.full_name,
        phone: phoneAccount.phone,
      },
    },
    { headers: NO_STORE }
  );
}
