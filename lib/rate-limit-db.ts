import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Distributed fixed-window rate limiter backed by Postgres
 * (take_rate_limit RPC). Shared across all Vercel instances.
 *
 * Fail closed: a request must not bypass abuse controls merely because
 * the limiter is unavailable. A short retry window keeps the response
 * recoverable while protecting OTP, sign-in and order endpoints.
 */
export async function takeRateLimitDb({
  key,
  limit,
  windowSeconds,
}: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<{
  allowed: boolean;
  retryAfterSeconds: number;
  unavailable: boolean;
}> {
  const { data, error } = await supabaseAdmin.rpc(
    "take_rate_limit",
    {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    }
  );

  if (error) {
    console.error("Rate limit check failed:", error);
    return {
      allowed: false,
      retryAfterSeconds: 30,
      unavailable: true,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    allowed: Boolean(row?.allowed ?? false),
    retryAfterSeconds: Number(
      row?.retry_after_seconds ?? 0
    ),
    unavailable: false,
  };
}

/**
 * Escalating (exponential-backoff) limiter for OTP sends.
 * First send is immediate; each subsequent send within the hour must
 * wait longer (60s, 120s, 300s, then 600s), capped at maxPerHour total.
 * Reset by calling resetOtpBackoff on successful verification.
 *
 * Fail closed on limiter error, matching the fixed-window limiter.
 */
export async function takeOtpBackoff({
  key,
  maxPerHour = 6,
}: {
  key: string;
  maxPerHour?: number;
}): Promise<{
  allowed: boolean;
  retryAfterSeconds: number;
  unavailable: boolean;
}> {
  const { data, error } = await supabaseAdmin.rpc(
    "take_otp_backoff",
    {
      p_key: key,
      p_max_per_hour: maxPerHour,
    }
  );

  if (error) {
    console.error("OTP backoff check failed:", error);
    return {
      allowed: false,
      retryAfterSeconds: 30,
      unavailable: true,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    allowed: Boolean(row?.allowed ?? false),
    retryAfterSeconds: Number(
      row?.retry_after_seconds ?? 0
    ),
    unavailable: false,
  };
}

/**
 * Clears an OTP backoff counter (call after a successful verification
 * so a returning user isn't stuck in a cooldown next time).
 */
export async function resetOtpBackoff(key: string) {
  const { error } = await supabaseAdmin
    .from("rate_limits")
    .delete()
    .eq("key", key);

  if (error) {
    console.error("OTP backoff reset failed:", error);
  }
}
