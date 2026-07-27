import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  hasTrustedOrigin,
  jsonError,
} from "@/lib/http";
import {
  getRequestIp,
} from "@/lib/rate-limit";
import {
  resetOtpBackoff,
  takeRateLimitDb,
} from "@/lib/rate-limit-db";

import {
  CUSTOMER_SESSION_COOKIE,
  createCustomerSessionToken,
  customerSessionCookieOptions,
} from "@/lib/customer-session";

export const dynamic = "force-dynamic";

type VerificationMode = "login" | "signup";

export async function POST(request: Request) {
  try {
    if (!hasTrustedOrigin(request)) {
      return jsonError("Invalid request origin", 403);
    }

    const body = await request.json();

    const phone = String(body?.phone || "").trim();

    const code = String(body?.code || "").trim();

    const mode = String(
      body?.mode || ""
    ) as VerificationMode;

    const fullName = String(body?.fullName || "")
      .replace(/\s+/g, " ")
      .trim();

    /*
      Validate Syrian phone number:
      963 + 9 digits starting with 9
      Example: 963964376659
    */
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
      NABDA OTP code contains 6 digits.
    */
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification code",
        },
        {
          status: 400,
        }
      );
    }

    if (mode !== "login" && mode !== "signup") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification mode",
        },
        {
          status: 400,
        }
      );
    }

    if (
      mode === "signup" &&
      (fullName.length < 2 || fullName.length > 100)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid full name",
        },
        {
          status: 400,
        }
      );
    }

    const verificationLimit = await takeRateLimitDb({
      key: `verify-otp:${getRequestIp(request)}:${phone}`,
      limit: 10,
      windowSeconds: 10 * 60,
    });

    if (verificationLimit.unavailable) {
      return jsonError(
        "Verification service is temporarily unavailable. Please retry shortly.",
        503
      );
    }

    if (!verificationLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Too many verification attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              verificationLimit.retryAfterSeconds
            ),
            "Cache-Control": "no-store",
          },
        }
      );
    }

    /*
      NABDA credentials.

      This uses the same URL and API-key format
      as the previously working implementation.
    */
    const apiUrl = process.env.NABDA_API_URL;
    const apiKey = process.env.NABDA_API_KEY;

    if (!apiUrl || !apiKey) {
      console.error(
        "Missing NABDA environment variables"
      );

      return NextResponse.json(
        {
          success: false,
          error: "OTP service is unavailable",
        },
        {
          status: 500,
        }
      );
    }

    /*
      Verify the OTP through NABDA.

      Important:
      Do not add "+" before the phone.
      Send the exact same phone format used
      by the send-otp route.
    */
    const otpResponse = await fetch(
      `${apiUrl.replace(
        /\/$/,
        ""
      )}/api/v1/messages/otp/verify`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },

        body: JSON.stringify({
          phone,
          code,
        }),

        cache: "no-store",
      }
    );

    await otpResponse.text();

    if (!otpResponse.ok) {
      console.error(
        "NABDA OTP verification failed:",
        otpResponse.status
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid or expired verification code",
        },
        {
          status:
            otpResponse.status >= 400 &&
            otpResponse.status < 500
              ? otpResponse.status
              : 502,
        }
      );
    }

    /*
      OTP verification succeeded.
      Clear the send-backoff for this phone so a returning user
      isn't stuck in a cooldown next time.
    */
    await resetOtpBackoff(`otp:send:${phone}`);

    /*
      Now find the customer profile.
    */
    const {
      data: existingProfile,
      error: profileLookupError,
    } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone")
      .eq("phone", phone)
      .maybeSingle();

    if (profileLookupError) {
      console.error(
        "Profile lookup failed:",
        profileLookupError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Could not access customer account",
        },
        {
          status: 500,
        }
      );
    }

    let profile = existingProfile;

    /*
      Login mode:
      the customer account must already exist.
    */
    if (mode === "login") {
      if (!profile) {
        return NextResponse.json(
          {
            success: false,
            error: "Account does not exist",
          },
          {
            status: 404,
          }
        );
      }
    }

    /*
      Signup mode:
      create a new profile after OTP verification.
    */
    if (mode === "signup") {
      if (profile) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Phone number is already registered",
          },
          {
            status: 409,
          }
        );
      }

      const {
        data: newProfile,
        error: profileCreationError,
      } = await supabaseAdmin
        .from("profiles")
        .insert({
          full_name: fullName,
          phone,
        })
        .select("id, full_name, phone")
        .single();

      if (profileCreationError || !newProfile) {
        console.error(
          "Profile creation failed:",
          profileCreationError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Could not create customer account",
          },
          {
            status: 500,
          }
        );
      }

      profile = newProfile;
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Customer account is unavailable",
        },
        {
          status: 500,
        }
      );
    }

    /*
      Create the secure signed customer session.
    */
    const token =
      await createCustomerSessionToken({
        profileId: Number(profile.id),
        phone: String(profile.phone),
      });

    const response = NextResponse.json({
      success: true,

      user: {
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
      },
    });

    /*
      Save the session in an HttpOnly cookie.
    */
    response.cookies.set(
      CUSTOMER_SESSION_COOKIE,
      token,
      customerSessionCookieOptions
    );

    return response;
  } catch (error) {
    console.error("Verify OTP error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not verify the code",
      },
      {
        status: 500,
      }
    );
  }
}
