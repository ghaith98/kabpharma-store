import { NextResponse } from "next/server";

import {
  CUSTOMER_SESSION_COOKIE,
  customerSessionCookieOptions,
} from "@/lib/customer-session";

export async function POST() {
  const response =
    NextResponse.json({
      success: true,
    });

  response.cookies.set(
    CUSTOMER_SESSION_COOKIE,
    "",
    {
      ...customerSessionCookieOptions,
      maxAge: 0,
    }
  );

  return response;
}