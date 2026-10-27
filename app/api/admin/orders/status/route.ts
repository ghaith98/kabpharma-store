import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { hasTrustedOrigin, jsonError } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase-admin";
export const dynamic = "force-dynamic";
const STATUSES = ["pending", "accepted", "out_for_delivery", "delivered", "rejected"];
export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return jsonError("Invalid request origin", 403);
  const admin = await getAdminFromRequest(request);
  if (!admin) return jsonError("Admin access required", 403);
  const body = await request.json().catch(() => null);
  const id = Number(body?.orderId);
  const status = String(body?.status || "");
  const previousStatus = String(body?.previousStatus || "");
  if (!Number.isSafeInteger(id) || id < 1 || !STATUSES.includes(status) || !STATUSES.includes(previousStatus)) {
    return jsonError("Invalid order action", 400);
  }
  const update: Record<string, unknown> = { status };
  const now = new Date().toISOString();
  if (status !== previousStatus && status === "out_for_delivery") {
    Object.assign(update, { delivery_handler_type: "admin", delivery_handler_id: admin.id,
      delivery_handler_name: "Admin", delivery_claimed_at: now, driver_name: null, accepted_at: now });
  } else if (status !== previousStatus && ["pending", "accepted"].includes(status)) {
    Object.assign(update, { delivery_handler_type: null, delivery_handler_id: null,
      delivery_handler_name: null, delivery_claimed_at: null, driver_name: null,
      ...(status === "pending" ? { accepted_at: null } : {}) });
  }
  if (status === "delivered" && status !== previousStatus) update.delivered_at = now;
  if (status !== "delivered") update.delivered_at = null;
  const { data, error } = await supabaseAdmin.from("orders").update(update)
    .eq("id", id).eq("status", previousStatus).select("id").maybeSingle();
  if (error) { console.error("Admin order status update failed:", error); return jsonError("Could not update order", 502); }
  if (!data) return jsonError("Order changed. The list has been refreshed; please check it again.", 409);
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}
