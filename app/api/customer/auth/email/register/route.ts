import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = email.toLowerCase();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return { allowed: true };
  }
  if (entry.count >= 3) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  entry.count++;
  return { allowed: true };
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  const email    = typeof b.email    === "string" ? b.email.trim().toLowerCase() : "";
  const fullName = typeof b.fullName === "string" ? b.fullName.trim() : "";
  const phone    = typeof b.phone    === "string" ? b.phone.trim() : "";
  const password = typeof b.password === "string" ? b.password : "";

  // ── Validation ───────────────────────────────────────────────────────────────
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 422 });
  }
  if (!fullName || fullName.length < 2 || fullName.length > 80) {
    return NextResponse.json({ error: "Name must be between 2 and 80 characters." }, { status: 422 });
  }
  if (!phone || phone.length < 4 || phone.length > 20) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 422 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 422 });
  }

  // ── Rate limit ───────────────────────────────────────────────────────────────
  const rl = checkRateLimit(email);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfter}s.`, retryAfter: rl.retryAfter },
      { status: 429 }
    );
  }

  // ── Check if email already verified ─────────────────────────────────────────
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id, email_verified")
    .eq("email", email)
    .maybeSingle();

  if (existing?.email_verified) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please sign in." },
      { status: 409 }
    );
  }

  // ── Hash password ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, 12);

  // ── Upsert profile ───────────────────────────────────────────────────────────
  if (existing) {
    await supabaseAdmin
      .from("profiles")
      .update({ full_name: fullName, phone, password_hash: passwordHash, email_verified: false })
      .eq("id", existing.id);
  } else {
    const { error: insertError } = await supabaseAdmin
      .from("profiles")
      .insert({ full_name: fullName, email, phone, password_hash: passwordHash, email_verified: false });

    if (insertError) {
      console.error("Insert error:", insertError);
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "This phone number is already linked to another account." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `Could not create account: ${insertError.message}` },
        { status: 500 }
      );
    }
  }

  // ── Generate & store OTP ─────────────────────────────────────────────────────
  const otp = generateOtp();
  const { data: timeData } = await supabaseAdmin.rpc("now");
const expiresAt = new Date(new Date(timeData).getTime() + 10 * 60 * 1000).toISOString();

  await supabaseAdmin
    .from("email_verification_codes")
    .update({ used: true })
    .eq("email", email)
    .eq("used", false);

  const { error: otpError } = await supabaseAdmin
    .from("email_verification_codes")
    .insert({ email, code: otp, expires_at: expiresAt });

  if (otpError) {
    console.error("OTP insert error:", otpError);
    return NextResponse.json({ error: `Could not generate verification code: ${otpError.message}` }, { status: 500 });
  }

  // ── Send email via Resend ────────────────────────────────────────────────────
  const { error: emailError } = await resend.emails.send({
    from: "KAB Pharma <noreply@mail.kabpharma.com>",
    to: email,
    subject: "Your KAB Pharma verification code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff">
        <p style="font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#0a583b;margin:0">KAB Pharma</p>
        <h1 style="font-size:28px;font-weight:800;color:#142019;margin:16px 0 8px;letter-spacing:-0.03em">Verify your email</h1>
        <p style="font-size:14px;color:#647168;line-height:1.7;margin:0 0 28px">Hi ${fullName}, use the code below to verify your email address. It expires in 10 minutes.</p>
        <div style="background:#f5f6f3;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px">
          <p style="font-size:42px;font-weight:800;letter-spacing:0.15em;color:#0a583b;margin:0">${otp}</p>
        </div>
        <p style="font-size:12px;color:#9aaa9e;line-height:1.6;margin:0">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (emailError) {
    console.error("Resend error:", emailError);
    return NextResponse.json({ error: `Could not send verification email: ${(emailError as Error).message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}