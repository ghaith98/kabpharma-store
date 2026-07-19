import { NextResponse } from "next/server";

import { hasTrustedOrigin, jsonError } from "@/lib/http";
import { getStaffSession } from "@/lib/staff-session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

async function getActiveCompany() {
  const session = await getStaffSession();

  if (!session || session.role !== "delivery_company") {
    return null;
  }

  const { data } = await supabaseAdmin
    .from("delivery_companies")
    .select("id, company_name, is_active")
    .eq("id", session.accountId)
    .eq("company_name", session.displayName)
    .eq("is_active", true)
    .maybeSingle();

  return data || null;
}

export async function GET() {
  const company = await getActiveCompany();

  if (!company) {
    return jsonError("Authentication required", 401);
  }

  const [ordersResult] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select(`
        id,
        customer_name,
        phone,
        governorate,
        delivery_area,
        address,
        delivery_fee,
        total_price,
        status,
        order_items (
          id,
          product_name,
          quantity,
          unit_price
        )
      `)
      .in("status", [
        "accepted",
        "out_for_delivery",
        "delivered",
      ])
      .order("id", { ascending: false }),
    supabaseAdmin
      .from("delivery_companies")
      .update({
        is_online: true,
        last_seen: new Date().toISOString(),
      })
      .eq("id", company.id),
  ]);

  if (ordersResult.error) {
    console.error(
      "Could not load delivery company orders:",
      ordersResult.error
    );
    return jsonError("Could not load orders", 502);
  }

  return NextResponse.json(
    {
      success: true,
      company: {
        id: company.id,
        company_name: company.company_name,
      },
      orders: ordersResult.data || [],
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }

  const company = await getActiveCompany();

  if (!company) {
    return jsonError("Authentication required", 401);
  }

  const body = await request.json().catch(() => null);
  const orderId = Number(body?.orderId);
  const newStatus = String(body?.status || "");
  const currentStatus =
    newStatus === "out_for_delivery"
      ? "accepted"
      : newStatus === "delivered"
        ? "out_for_delivery"
        : "";

  if (
    !Number.isInteger(orderId) ||
    orderId <= 0 ||
    !currentStatus
  ) {
    return jsonError("Invalid order action", 400);
  }

  const timestamps =
    newStatus === "delivered"
      ? { delivered_at: new Date().toISOString() }
      : { accepted_at: new Date().toISOString() };

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({
      status: newStatus,
      ...timestamps,
    })
    .eq("id", orderId)
    .eq("status", currentStatus)
    .select("id")
    .maybeSingle();

  if (error) {
    return jsonError("Could not update order", 502);
  }

  if (!data) {
    return jsonError(
      "Order status changed; refresh and try again",
      409
    );
  }

  return NextResponse.json(
    { success: true },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
