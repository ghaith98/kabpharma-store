import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  createCustomerSessionToken,
  customerSessionCookieOptions,
  CUSTOMER_SESSION_COOKIE,
} from "@/lib/customer-session";
import { cookies } from "next/headers";

// Simple in-memory brute-force protection: max 10 attempts per email per 15 min
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(email: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = email.toLowerCase();
  const entry = loginAttempts.get(key);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return { allowed: true };
  }

  if (entry.count >= 10) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

export async function POST(req: NextRequest) {
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

  // ── Rate limit ───────────────────────────────────────────────────────────────
  const rl = checkLoginRateLimit(email);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfter}s.`, retryAfter: rl.retryAfter },
      { status: 429 }
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