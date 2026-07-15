import { NextResponse } from "next/server";
import { getNabdaInstanceToken } from "@/lib/nabda";

export const dynamic = "force-dynamic";

const NABDA_API_URL =
  "https://api.nabdaotp.com";

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const phone = String(
      body?.phone || ""
    ).trim();

    if (!/^9639\d{8}$/.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid phone number",
        },
        {
          status: 400,
        }
      );
    }

    /*
      نأخذ access token خاص بالـInstance
      باستخدام NABDA_API_KEY و
      NABDA_INSTANCE_ID.
    */
    const instanceToken =
      await getNabdaInstanceToken();

    const response = await fetch(
      `${NABDA_API_URL}/api/v1/messages/otp/send`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${instanceToken}`,
        },

        body: JSON.stringify({
          phone: `+${phone}`,
        }),

        cache: "no-store",
      }
    );

    if (!response.ok) {
      const providerResponse =
        await response.text();

      console.error(
        "NABDA OTP send failed:",
        response.status,
        providerResponse
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Could not send verification code",
        },
        {
          status:
            response.status >= 400 &&
            response.status < 500
              ? response.status
              : 502,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Send OTP error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Could not send verification code",
      },
      {
        status: 500,
      }
    );
  }
}