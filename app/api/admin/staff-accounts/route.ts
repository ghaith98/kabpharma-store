import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import { hasTrustedOrigin, jsonError } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function clean(value: unknown, maxLength: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }

  const admin = await getAdminFromRequest(request);

  if (!admin) {
    return jsonError("Admin access required", 403);
  }

  let body: {
    role?: unknown;
    name?: unknown;
    username?: unknown;
    password?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid account data", 400);
  }

  const role = clean(body.role, 30);
  const name = clean(body.name, 150);
  const username = clean(body.username, 100);
  const password = String(body.password || "");

  if (
    (role !== "driver" &&
      role !== "delivery_company") ||
    name.length < 2 ||
    (role === "delivery_company" &&
      username.length < 2) ||
    password.length < 10 ||
    password.length > 200
  ) {
    return jsonError(
      "Use a valid name and a password of at least 10 characters",
      400
    );
  }

  const rpcName =
    role === "driver"
      ? "create_delivery_driver_admin"
      : "create_delivery_company_admin";
  const rpcArguments =
    role === "driver"
      ? {
          p_name: name,
          p_password: password,
        }
      : {
          p_company_name: name,
          p_username: username,
          p_password: password,
        };

  const { data, error } = await supabaseAdmin.rpc(
    rpcName,
    rpcArguments
  );

  if (error) {
    console.error("Staff account creation failed:", {
      role,
      adminId: admin.id,
      code: error.code,
      message: error.message,
    });

    return jsonError(
      error.code === "23505"
        ? "That username is already in use"
        : "Could not create staff account",
      error.code === "23505" ? 409 : 500
    );
  }

  const row = Array.isArray(data) ? data[0] : data;

  return NextResponse.json(
    {
      success: true,
      account: row || null,
    },
    {
      status: 201,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
