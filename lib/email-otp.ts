import "server-only";

import { randomInt } from "node:crypto";

import { Resend } from "resend";

import { getRequestIp } from "@/lib/rate-limit";
import { takeRateLimitDb } from "@/lib/rate-limit-db";
import { supabaseAdmin } from "@/lib/supabase-admin";

/*
  Shared by the email sign-up, "resend code" and "forgot password"
  endpoints: making a code, saving it, emailing it, and limiting how often
  that can happen.
*/

const CODE_LIFETIME_MS = 10 * 60 * 1000;

export function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** A 6-digit code from the system's secure random source. */
export function generateEmailCode() {
  return String(randomInt(100000, 1000000));
}

/** Text typed by a visitor, made safe to place inside the email's HTML. */
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type EmailLimit =
  | { ok: true }
  | { ok: false; unavailable: boolean; retryAfter: number };

/**
 * At most 3 code emails per address and 10 per device in 10 minutes.
 * Counted in the database, so it holds across all server instances.
 */
export async function takeEmailSendLimit(
  request: Request,
  email: string
): Promise<EmailLimit> {
  const [emailLimit, ipLimit] = await Promise.all([
    takeRateLimitDb({
      key: `email-code-send:${email}`,
      limit: 3,
      windowSeconds: 600,
    }),
    takeRateLimitDb({
      key: `email-code-send-ip:${getRequestIp(request)}`,
      limit: 10,
      windowSeconds: 600,
    }),
  ]);

  if (emailLimit.unavailable || ipLimit.unavailable) {
    return { ok: false, unavailable: true, retryAfter: 30 };
  }

  if (!emailLimit.allowed || !ipLimit.allowed) {
    return {
      ok: false,
      unavailable: false,
      retryAfter: Math.max(
        1,
        emailLimit.allowed ? 0 : emailLimit.retryAfterSeconds,
        ipLimit.allowed ? 0 : ipLimit.retryAfterSeconds
      ),
    };
  }

  return { ok: true };
}

/** Database time, so a server with a wrong clock cannot shorten a code. */
export async function databaseNow() {
  const { data } = await supabaseAdmin.rpc("now");
  const time = data ? new Date(String(data)).getTime() : NaN;

  return Number.isFinite(time) ? time : Date.now();
}

/** Cancels older codes for this address and saves a new one. */
export async function saveEmailCode(email: string) {
  const code = generateEmailCode();
  const expiresAt = new Date(
    (await databaseNow()) + CODE_LIFETIME_MS
  ).toISOString();

  await supabaseAdmin
    .from("email_verification_codes")
    .update({ used: true })
    .eq("email", email)
    .eq("used", false);

  const { error } = await supabaseAdmin
    .from("email_verification_codes")
    .insert({ email, code, expires_at: expiresAt });

  if (error) {
    console.error("Email code could not be saved:", error);
    return null;
  }

  return code;
}

export async function sendCodeEmail(options: {
  to: string;
  name: string;
  code: string;
  purpose: "verify" | "reset";
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("RESEND_API_KEY is missing in this environment.");
    return false;
  }

  const reset = options.purpose === "reset";
  const safeName = escapeHtml(options.name.slice(0, 80));

  const heading = reset ? "Reset your password" : "Verify your email";
  const intro = reset
    ? `Hi ${safeName}, use the code below to choose a new password. It expires in 10 minutes.`
    : `Hi ${safeName}, use the code below to verify your email address. It expires in 10 minutes.`;
  const footer = reset
    ? "If you didn't ask to reset your password, you can safely ignore this email. Your password stays the same."
    : "If you didn't request this, you can safely ignore this email.";

  const { error } = await new Resend(apiKey).emails.send({
    from: "KAB Pharma <noreply@mail.kabpharma.com>",
    to: options.to,
    // The code is not put in the subject: subjects show on lock screens.
    subject: reset
      ? "KAB Pharma – Reset your password"
      : "KAB Pharma – Confirm your account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff">
        <p style="font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#0a583b;margin:0">KAB Pharma</p>
        <h1 style="font-size:28px;font-weight:800;color:#142019;margin:16px 0 8px;letter-spacing:-0.03em">${heading}</h1>
        <p style="font-size:14px;color:#647168;line-height:1.7;margin:0 0 28px">${intro}</p>
        <div style="background:#f5f6f3;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px">
          <p style="font-size:42px;font-weight:800;letter-spacing:0.15em;color:#0a583b;margin:0">${options.code}</p>
        </div>
        <p style="font-size:12px;color:#9aaa9e;line-height:1.6;margin:0">${footer}</p>
      </div>
    `,
  });

  if (error) {
    console.error("Verification email could not be sent:", error);
    return false;
  }

  return true;
}
