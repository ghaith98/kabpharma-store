import { NextResponse } from "next/server";

import { hasTrustedOrigin, jsonError } from "@/lib/http";
import {
  getStaffSession,
  STAFF_SESSION_COOKIE,
  staffSessionCookieOptions,
} from "@/lib/staff-session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }

  const session = await getStaffSession();

  if (session?.role === "delivery_company") {
    await supabaseAdmin
      .from("delivery_companies")
      .update({
        is_online: false,
        last_seen: new Date().toISOString(),
      })
      .eq("id", session.accountId);
  }

  const response = NextResponse.json(
    { success: true },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );

  response.cookies.set(
    STAFF_SESSION_COOKIE,
    "",
    {
      ...staffSessionCookieOptions,
      maxAge: 0,
    }
  );

  return response;
}
