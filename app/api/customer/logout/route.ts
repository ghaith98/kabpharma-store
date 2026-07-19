import { NextResponse } from "next/server";

import {
  CUSTOMER_SESSION_COOKIE,
  customerSessionCookieOptions,
} from "@/lib/customer-session";
import {
  hasTrustedOrigin,
  jsonError,
} from "@/lib/http";

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }

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
