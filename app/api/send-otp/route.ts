import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { phone } = await req.json();

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

  const data = await response.text();

  return NextResponse.json(
    { success: response.ok, data },
    { status: response.status }
  );
}