import { NextResponse } from "next/server";

import {
  hasTrustedOrigin,
  jsonError,
} from "@/lib/http";
import {
  getRequestIp,
  takeRateLimit,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "send-otp exists",
  });
}

export async function POST(req: Request) {
  try {
    if (!hasTrustedOrigin(req)) {
      return jsonError("Invalid request origin", 403);
    }

    const { phone } = await req.json();

    if (!/^9639\d{8}$/.test(String(phone || ""))) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid phone number",
        },
        { status: 400 }
      );
    }

    const ip = getRequestIp(req);
    const phoneLimit = takeRateLimit({
      key: `send-otp:phone:${phone}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    const ipLimit = takeRateLimit({
      key: `send-otp:ip:${ip}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });

    if (!phoneLimit.allowed || !ipLimit.allowed) {
      const retryAfter = Math.max(
        phoneLimit.retryAfterSeconds,
        ipLimit.retryAfterSeconds
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Too many verification requests. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const apiUrl = process.env.NABDA_API_URL;
    const apiKey = process.env.NABDA_API_KEY;

    if (!apiUrl || !apiKey) {
      console.error("Missing NABDA environment variables");

      return NextResponse.json(
        {
          success: false,
          error: "OTP service is unavailable",
        },
        { status: 500 }
      );
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

    await response.text();

    if (!response.ok) {
      console.error(
        "NABDA OTP send failed:",
        response.status
      );

      return NextResponse.json(
        {
          success: false,
          error: "Could not send verification code",
        },
        {
          status:
            response.status >= 400 && response.status < 500
              ? response.status
              : 502,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not send verification code",
      },
      { status: 500 }
    );
  }
}
