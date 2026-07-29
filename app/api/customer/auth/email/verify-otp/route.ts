import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  createCustomerSessionToken,
  customerSessionCookieOptions,
  CUSTOMER_SESSION_COOKIE,
} from "@/lib/customer-session";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
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