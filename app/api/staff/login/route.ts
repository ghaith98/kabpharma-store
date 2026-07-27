import { NextResponse } from "next/server";

import { hasTrustedOrigin, jsonError } from "@/lib/http";
import { getRequestIp } from "@/lib/rate-limit";
import { takeRateLimitDb } from "@/lib/rate-limit-db";
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

    const rateLimit = await takeRateLimitDb({
      key: `staff-login:${getRequestIp(request)}:${role}:${identifier.toLowerCase()}`,
      limit: 10,
      windowSeconds: 15 * 60,
    });

    if (rateLimit.unavailable) {
      return jsonError(
        "Sign-in is temporarily unavailable. Please retry shortly.",
        503
      );
    }

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

    // Password is verified against its bcrypt hash inside the database
    // (verify_staff_login). We never receive or compare the stored hash here.
    const { data: accounts, error: loginError } =
      await supabaseAdmin.rpc("verify_staff_login", {
        p_role: role,
        p_identifier: identifier,
        p_password: password,
      });

    if (loginError) {
      console.error(
        "Staff login verification failed:",
        loginError
      );
      return jsonError("Could not sign in", 500);
    }

    const account = Array.isArray(accounts)
      ? accounts[0]
      : null;

    if (!account) {
      return jsonError("Invalid credentials", 401);
    }

    const accountId = String(account.id);
    const displayName = String(
      account.display_name || ""
    ).trim();

    if (!accountId || !displayName) {
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
