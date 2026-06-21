import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { phone, code } = await req.json();

  const response = await fetch(
    `${process.env.NABDA_API_URL}/api/v1/messages/otp/verify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.NABDA_API_KEY!,
      },
      body: JSON.stringify({ phone, code }),
    }
  );

  const data = await response.text();

  return NextResponse.json(
    { success: response.ok, data },
    { status: response.status }
  );
}