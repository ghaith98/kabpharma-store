import { NextRequest, NextResponse } from "next/server";

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
  Emails a new 6-digit code.

  purpose "verify" (default)  finish an email sign-up
  purpose "reset"             forgot password, for a verified email account

  The answer is the same whether or not the address has an account, so
  this cannot be used to find out which emails are registered.
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
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const purpose = b.purpose === "reset" ? "reset" : "verify";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 422 });
  }

  const limit = await takeEmailSendLimit(req, email);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: limit.unavailable
          ? "This is temporarily unavailable. Please try again shortly."
          : `Too many attempts. Try again in ${limit.retryAfter}s.`,
        retryAfter: limit.retryAfter,
      },
      { status: limit.unavailable ? 503 : 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email_verified")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Email code lookup failed:", error);
    return NextResponse.json({ error: "Could not send the code. Please try again." }, { status: 500 });
  }

  // A sign-up code is for accounts still waiting to be verified; a reset
  // code is for accounts that are. Anything else: say "sent" and do nothing.
  const eligible =
    profile != null &&
    (purpose === "reset"
      ? profile.email_verified === true
      : profile.email_verified !== true);

  if (!eligible) {
    return NextResponse.json({ success: true });
  }

  const code = await saveEmailCode(email);

  if (!code) {
    return NextResponse.json({ error: "Could not send the code. Please try again." }, { status: 500 });
  }

  const sent = await sendCodeEmail({
    to: email,
    name: String(profile.full_name || ""),
    code,
    purpose,
  });

  if (!sent) {
    return NextResponse.json({ error: "Could not send the email. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
