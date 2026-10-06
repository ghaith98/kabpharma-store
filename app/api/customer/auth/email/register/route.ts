import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { isValidPassword } from "@/lib/customer-password";
import {
  isValidEmail,
  saveEmailCode,
  sendCodeEmail,
  takeEmailSendLimit,
} from "@/lib/email-otp";
import { hasTrustedOrigin, jsonError } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/*
  Email sign-up, step 1: save the details and email a 6-digit code.
  The account can sign in only after the code is entered (verify-otp).

  The answers never include database or mail-provider error text.
*/

export async function POST(req: NextRequest) {
  if (!hasTrustedOrigin(req)) return jsonError("Invalid request origin", 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const b = (body || {}) as Record<string, unknown>;

  const email    = typeof b.email    === "string" ? b.email.trim().toLowerCase() : "";
  const fullName = typeof b.fullName === "string" ? b.fullName.replace(/\s+/g, " ").trim() : "";
  const rawPhone = typeof b.phone    === "string" ? b.phone.replace(/[\s-]/g, "").trim() : "";
  const password = typeof b.password === "string" ? b.password : "";

  // ── Validation ───────────────────────────────────────────────────────────────
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 422 });
  }
  if (fullName.length < 2 || fullName.length > 80) {
    return NextResponse.json({ error: "Name must be between 2 and 80 characters." }, { status: 422 });
  }
  // Country code and number: digits only, with an optional leading +.
  if (!/^\+?\d{6,20}$/.test(rawPhone)) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 422 });
  }

  /*
    Always saved with a leading "+". Accounts created with a WhatsApp code
    store their number without one (9639...), and that number was proven.
    This one was only typed in, so it must never be the same text: otherwise
    someone could attach another person's number to their own email account
    and later share that person's orders.
  */
  const phone = `+${rawPhone.replace(/^\+/, "")}`;
  if (!isValidPassword(password)) {
    return NextResponse.json({ error: "Password must be 8 to 72 characters." }, { status: 422 });
  }

  // ── Rate limit (shared across all server instances) ─────────────────────────
  const limit = await takeEmailSendLimit(req, email);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: limit.unavailable
          ? "Sign-up is temporarily unavailable. Please try again shortly."
          : `Too many attempts. Try again in ${limit.retryAfter}s.`,
        retryAfter: limit.retryAfter,
      },
      { status: limit.unavailable ? 503 : 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  // ── Check if email already verified ─────────────────────────────────────────
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("profiles")
    .select("id, email_verified")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error("Email sign-up lookup failed:", lookupError);
    return NextResponse.json({ error: "Could not create the account. Please try again." }, { status: 500 });
  }

  if (existing?.email_verified) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please sign in." },
      { status: 409 }
    );
  }

  // ── Hash password ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, 12);

  // ── Save the (still unverified) account ──────────────────────────────────────
  const saveResult = existing
    ? await supabaseAdmin
        .from("profiles")
        .update({ full_name: fullName, phone, password_hash: passwordHash, email_verified: false })
        .eq("id", existing.id)
        // Never touch an account that got verified in the meantime.
        .eq("email_verified", false)
    : await supabaseAdmin
        .from("profiles")
        .insert({ full_name: fullName, email, phone, password_hash: passwordHash, email_verified: false });

  if (saveResult.error) {
    console.error("Email sign-up save failed:", saveResult.error);

    if (saveResult.error.code === "23505") {
      return NextResponse.json(
        { error: "This phone number is already linked to another account." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Could not create the account. Please try again." }, { status: 500 });
  }

  // ── Generate, store and send the code ────────────────────────────────────────
  const code = await saveEmailCode(email);

  if (!code) {
    return NextResponse.json({ error: "Could not create a verification code. Please try again." }, { status: 500 });
  }

  const sent = await sendCodeEmail({ to: email, name: fullName, code, purpose: "verify" });

  if (!sent) {
    return NextResponse.json({ error: "Could not send the verification email. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
