import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "send-otp exists",
  });
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!process.env.NABDA_API_URL || !process.env.NABDA_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "Missing NABDA env variables",
        hasUrl: !!process.env.NABDA_API_URL,
        hasKey: !!process.env.NABDA_API_KEY,
      });
    }

    const response = await fetch(
      `${process.env.NABDA_API_URL}/api/v1/messages/otp/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.NABDA_API_KEY!,
        },
        body: JSON.stringify({ phone }),
      }
    );

    const text = await response.text();

    return NextResponse.json({
      success: response.ok,
      nabdaStatus: response.status,
      sentPhone: phone,
      nabdaResponse: text,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || "Unknown server error",
    });
  }
}