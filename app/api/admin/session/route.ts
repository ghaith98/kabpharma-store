import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);

  if (!admin) {
    return jsonError("Admin access required", 403);
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: admin.id,
        email: admin.email,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
