import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
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
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 422 });
  }

  const rl = checkRateLimit(email);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfter}s.`, retryAfter: rl.retryAfter },
      { status: 429 }
    );
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email_verified")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "No account found for this email." }, { status: 404 });
  }

  if (profile.email_verified) {
    return NextResponse.json({ error: "Email already verified." }, { status: 409 });
  }

  await supabaseAdmin
    .from("email_verification_codes")
    .update({ used: true })
    .eq("email", email)
    .eq("used", false);

  // ── Use Supabase time to avoid server clock issues ───────────────────────────
  const { data: nowData } = await supabaseAdmin.rpc("now") as { data: string };
  const expiresAt = new Date(new Date(nowData).getTime() + 10 * 60 * 1000).toISOString();

  const otp = generateOtp();

  await supabaseAdmin
    .from("email_verification_codes")
    .insert({ email, code: otp, expires_at: expiresAt });

  const { error: emailError } = await resend.emails.send({
    from: "KAB Pharma <noreply@mail.kabpharma.com>",
    to: email,
    subject: "Your KAB Pharma verification code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff">
        <p style="font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#0a583b;margin:0">KAB Pharma</p>
        <h1 style="font-size:28px;font-weight:800;color:#142019;margin:16px 0 8px;letter-spacing:-0.03em">Verify your email</h1>
        <p style="font-size:14px;color:#647168;line-height:1.7;margin:0 0 28px">Hi ${profile.full_name}, here is your new verification code. It expires in 10 minutes.</p>
        <div style="background:#f5f6f3;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px">
          <p style="font-size:42px;font-weight:800;letter-spacing:0.15em;color:#0a583b;margin:0">${otp}</p>
        </div>
        <p style="font-size:12px;color:#9aaa9e;line-height:1.6;margin:0">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (emailError) {
    return NextResponse.json({ error: "Could not send verification email." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}