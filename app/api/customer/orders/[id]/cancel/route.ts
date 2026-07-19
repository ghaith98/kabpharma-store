import { NextResponse } from "next/server";

import { getCustomerSession } from "@/lib/customer-session";
import {
  hasTrustedOrigin,
  jsonError,
} from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  if (!hasTrustedOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }

  const session = await getCustomerSession();
  const { id } = await context.params;
  const orderId = Number(id);

  if (!session) {
    return jsonError(
      "Authentication required",
      401
    );
  }

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return jsonError("Invalid order", 400);
  }

  const { data: order, error } =
    await supabaseAdmin
      .from("orders")
      .update({
        status: "cancelled_by_customer",
      })
      .eq("id", orderId)
      .eq("phone", session.phone)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

  if (error) {
    console.error("Order cancellation failed:", error);
    return jsonError(
      "Could not cancel order",
      500
    );
  }

  if (!order) {
    return jsonError(
      "Order is not cancellable",
      409
    );
  }

  return NextResponse.json(
    {
      success: true,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
