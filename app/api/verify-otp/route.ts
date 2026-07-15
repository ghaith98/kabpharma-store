import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

import {
  CUSTOMER_SESSION_COOKIE,
  createCustomerSessionToken,
  customerSessionCookieOptions,
} from "@/lib/customer-session";

export const dynamic = "force-dynamic";

type VerificationMode = "login" | "signup";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const phone = String(body?.phone || "").trim();
    const code = String(body?.code || "").trim();
    const mode = String(body?.mode || "") as VerificationMode;

    const fullName = String(body?.fullName || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!/^9639\d{8}$/.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid phone number",
        },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification code",
        },
        { status: 400 }
      );
    }

    if (mode !== "login" && mode !== "signup") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification mode",
        },
        { status: 400 }
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
        { status: 400 }
      );
    }

    const apiUrl = "https://api.nabdaotp.com";
    const apiKey = process.env.NABDA_API_KEY;

    if (!apiKey) {
      console.error("Missing NABDA_API_KEY");

      return NextResponse.json(
        {
          success: false,
          error: "OTP service is unavailable",
        },
        { status: 500 }
      );
    }

    /*
      Important:
      - Same API URL used in send-otp
      - Same Authorization format
      - Same phone format: +963...
    */
    const otpResponse = await fetch(
      `${apiUrl}/api/v1/messages/otp/verify`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },

        body: JSON.stringify({
          phone: `+${phone}`,
          code,
        }),

        cache: "no-store",
      }
    );

    const providerText = await otpResponse.text();

    let providerResult: any = null;

    try {
      providerResult = JSON.parse(providerText);
    } catch {
      providerResult = null;
    }

    console.log(
      "NABDA OTP verify response:",
      otpResponse.status,
      providerText
    );

    if (
      !otpResponse.ok ||
      providerResult?.success === false
    ) {
      console.error(
        "NABDA OTP verification failed:",
        otpResponse.status,
        providerText
      );

      return NextResponse.json(
        {
          success: false,
          error:
            providerResult?.message ||
            "Invalid or expired verification code",
        },
        {
          status: 401,
        }
      );
    }

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
          error: "Could not access customer account",
        },
        { status: 500 }
      );
    }

    let profile = existingProfile;

    if (mode === "login" && !profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Account does not exist",
        },
        { status: 404 }
      );
    }

    if (mode === "signup") {
      if (profile) {
        return NextResponse.json(
          {
            success: false,
            error: "Phone number is already registered",
          },
          { status: 409 }
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
            error: "Could not create customer account",
          },
          { status: 500 }
        );
      }

      profile = newProfile;
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer account is unavailable",
        },
        { status: 500 }
      );
    }

    const token = await createCustomerSessionToken({
      profileId: Number(profile.id),
      phone: profile.phone,
    });

    const response = NextResponse.json({
      success: true,

      user: {
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
      },
    });

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
      { status: 500 }
    );
  }
}