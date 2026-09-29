import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
  const password = typeof b.password === "string" ? b.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 422 });
  }

  // ── Rate limit (shared across all server instances) ───────────────────────
  // 10 attempts per email and 30 per IP in 15 minutes. The old in-memory
  // Map reset on every cold start and was per-instance on Vercel.
  const [emailLimit, ipLimit] = await Promise.all([
    takeRateLimitDb({ key: `email-login:${email}`, limit: 10, windowSeconds: 900 }),
    takeRateLimitDb({ key: `email-login-ip:${getRequestIp(req)}`, limit: 30, windowSeconds: 900 }),
  ]);
  const blocked = !emailLimit.allowed ? emailLimit : !ipLimit.allowed ? ipLimit : null;
  if (blocked) {
    const retryAfter = Math.max(1, blocked.retryAfterSeconds);
    return NextResponse.json(
      {
        error: blocked.unavailable
          ? "Sign-in is temporarily unavailable. Please try again shortly."
          : `Too many attempts. Try again in ${retryAfter}s.`,
        retryAfter,
      },
      { status: blocked.unavailable ? 503 : 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  // ── Fetch profile ─────────────────────────────────────────────────────────────
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, phone, email, password_hash, email_verified")
    .eq("email", email)
    .maybeSingle();

  // Generic error — don't reveal whether email exists
  const invalidCredentials = NextResponse.json(
    { error: "Incorrect email or password." },
    { status: 401 }
  );

  if (!profile || !profile.password_hash) return invalidCredentials;

  if (!profile.email_verified) {
    return NextResponse.json(
      { error: "Please verify your email before signing in.", needsVerification: true, email },
      { status: 403 }
    );
  }

  // ── Check password ────────────────────────────────────────────────────────────
  const passwordMatch = await bcrypt.compare(password, profile.password_hash);
  if (!passwordMatch) return invalidCredentials;

  // ── Issue session cookie ──────────────────────────────────────────────────────
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