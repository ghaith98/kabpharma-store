import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import { getArchivedOrders } from "@/lib/order-archive";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return jsonError("Admin access required", 403);

  try {
    const url = new URL(request.url);
    const orders = await getArchivedOrders({
      search: url.searchParams.get("search") || undefined,
    });

    return NextResponse.json(
      { success: true, orders },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Archived orders lookup failed:", error);
    return jsonError("Archived orders are not configured yet", 503);
  }
}
