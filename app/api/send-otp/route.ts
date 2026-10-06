import { NextResponse } from "next/server";

import { hasTrustedOrigin } from "@/lib/http";
import {
  getRequestIp,
} from "@/lib/rate-limit";
import {
  takeOtpBackoff,
  takeRateLimitDb,
} from "@/lib/rate-limit-db";

export const dynamic = "force-dynamic";

/*
  Every failure carries a short code. The sign-up and login pages show it
  next to the error message, so a problem can be traced without guessing:

    S1  request did not come from this website
    S2  phone number is not a valid Syrian mobile number
    S3  rate limiter could not be reached (database)
    S4  too many codes requested for this phone or from this device
    S5  NABDA_API_URL / NABDA_API_KEY missing in this environment
    S6  the OTP provider (NABDA) refused to send. The number after the dash
        is the provider's answer, e.g. S6-401 = key refused, S6-402/403 =
        account or balance problem. The provider's full answer is in the
        server log line "NABDA OTP send failed".
    S7  the OTP provider could not be reached, or an unexpected error
*/
function fail(
  code: string,
  error: string,
  status: number,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) {
  return NextResponse.json(
    { success: false, error, code, ...extra },
    { status, headers: { "Cache-Control": "no-store", ...headers } }
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "send-otp exists",
  });
}

export async function POST(req: Request) {
  try {
    if (!hasTrustedOrigin(req)) {
      return fail("S1", "Invalid request origin", 403);
    }

    const { phone } = await req.json();

    if (!/^9639\d{8}$/.test(String(phone || ""))) {
      return fail("S2", "Invalid phone number", 400);
    }

    const ip = getRequestIp(req);
    // Per-phone: escalating backoff (1st immediate, then 60s, 120s, 300s, 600s;
    // max 6/hour). Per-IP: fixed hourly cap so one IP can't hammer many phones.
    const [phoneLimit, ipLimit] = await Promise.all([
      takeOtpBackoff({
        key: `otp:send:${phone}`,
        maxPerHour: 6,
      }),
      takeRateLimitDb({
        key: `otp:send:ip:${ip}`,
        limit: 20,
        windowSeconds: 60 * 60,
      }),
    ]);

    if (phoneLimit.unavailable || ipLimit.unavailable) {
      return fail(
        "S3",
        "Verification service is temporarily unavailable. Please retry shortly.",
        503
      );
    }

    if (!phoneLimit.allowed || !ipLimit.allowed) {
      const retryAfter = Math.max(
        phoneLimit.retryAfterSeconds,
        ipLimit.retryAfterSeconds
      );

      return fail(
        "S4",
        "Too many verification requests. Please try again later.",
        429,
        { retryAfter },
        { "Retry-After": String(retryAfter) }
      );
    }

    const apiUrl = process.env.NABDA_API_URL;
    const apiKey = process.env.NABDA_API_KEY;

    if (!apiUrl || !apiKey) {
      console.error("Missing NABDA environment variables");

      return fail("S5", "OTP service is unavailable", 500);
    }

    const response = await fetch(
      `${apiUrl.replace(/\/$/, "")}/api/v1/messages/otp/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({ phone }),
        cache: "no-store",
      }
    );

    const providerAnswer = await response.text();

    if (!response.ok) {
      // The provider's own words say why (key refused, balance, WhatsApp
      // line disconnected, number not reachable...). No customer data
      // beyond the phone number is in it.
      console.error(
        "NABDA OTP send failed:",
        response.status,
        providerAnswer.slice(0, 500)
      );

      // Always 502: the provider's own status (it may answer 429 or 404)
      // must not be mistaken by the page for this site's own answers.
      return fail("S6", "Could not send verification code", 502, {
        providerStatus: response.status,
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    return fail("S7", "Could not send verification code", 500);
  }
}
