import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    if (!process.env.NABDA_API_URL || !process.env.NABDA_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing NABDA env variables",
          hasUrl: !!process.env.NABDA_API_URL,
          hasKey: !!process.env.NABDA_API_KEY,
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${process.env.NABDA_API_URL}/api/v1/messages/otp/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NABDA_API_KEY}`,
        },
        body: JSON.stringify({ phone, code }),
      }
    );

    const text = await response.text();

    return NextResponse.json(
      {
        success: response.ok,
        status: response.status,
        response: text,
      },
      { status: response.ok ? 200 : response.status }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown server error",
      },
      { status: 500 }
    );
  }
}