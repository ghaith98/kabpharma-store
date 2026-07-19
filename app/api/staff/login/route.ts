import { NextResponse } from "next/server";

import { hasTrustedOrigin, jsonError } from "@/lib/http";
import {
  getRequestIp,
  takeRateLimit,
} from "@/lib/rate-limit";
import {
  createStaffSessionToken,
  STAFF_SESSION_COOKIE,
  staffSessionCookieOptions,
} from "@/lib/staff-session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!hasTrustedOrigin(request)) {
      return jsonError("Invalid request origin", 403);
    }

    const body = await request.json();
    const role = String(body?.role || "");
    const identifier = String(
      body?.identifier || ""
    ).trim();
    const password = String(body?.password || "");

    if (
      (role !== "driver" &&
        role !== "delivery_company") ||
      identifier.length < 2 ||
      identifier.length > 100 ||
      password.length < 1 ||
      password.length > 200
    ) {
      return jsonError("Invalid credentials", 400);
    }

    const rateLimit = takeRateLimit({
      key: `staff-login:${getRequestIp(request)}:${role}:${identifier.toLowerCase()}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Too many sign-in attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              rateLimit.retryAfterSeconds
            ),
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const accountResult =
      role === "driver"
        ? await supabaseAdmin
            .from("delivery_drivers")
            .select("id, name, is_active")
            .eq("name", identifier)
            .eq("password", password)
            .eq("is_active", true)
            .is("deleted_at", null)
            .maybeSingle()
        : await supabaseAdmin
            .from("delivery_companies")
            .select("id, company_name, is_active")
            .eq("username", identifier)
            .eq("password", password)
            .eq("is_active", true)
            .maybeSingle();

    if (accountResult.error || !accountResult.data) {
      return jsonError("Invalid credentials", 401);
    }

    const accountId = Number(accountResult.data.id);
    const displayName =
      role === "driver"
        ? String(
            "name" in accountResult.data
              ? accountResult.data.name
              : ""
          ).trim()
        : String(
            "company_name" in accountResult.data
              ? accountResult.data.company_name
              : ""
          ).trim();

    if (!Number.isInteger(accountId) || !displayName) {
      return jsonError("Invalid staff account", 500);
    }

    if (role === "delivery_company") {
      await supabaseAdmin
        .from("delivery_companies")
        .update({
          is_online: true,
          last_seen: new Date().toISOString(),
        })
        .eq("id", accountId)
        .eq("is_active", true);
    }

    const token = await createStaffSessionToken({
      role,
      accountId,
      displayName,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: accountId,
          name: displayName,
          role,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

    response.cookies.set(
      STAFF_SESSION_COOKIE,
      token,
      staffSessionCookieOptions
    );

    return response;
  } catch (error) {
    console.error("Staff sign-in failed:", error);
    return jsonError("Could not sign in", 500);
  }
}
