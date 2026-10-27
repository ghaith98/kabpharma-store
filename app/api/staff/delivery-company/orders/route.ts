import { NextResponse } from "next/server";

import { hasTrustedOrigin, jsonError } from "@/lib/http";
import { getActiveStaffAccount } from "@/lib/staff-account";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

async function getActiveCompany() {
  const account = await getActiveStaffAccount();
  return account?.role === "delivery_company" ? { ...account, company_name: account.name } : null;
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
      .or(`and(status.eq.accepted,delivery_handler_type.is.null,driver_name.is.null),and(delivery_handler_type.eq.delivery_company,delivery_handler_id.eq.${company.id})`)
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

  let updateQuery = supabaseAdmin
    .from("orders")
    .update({
      status: newStatus,
      ...timestamps,
      ...(newStatus === "out_for_delivery" ? {
        delivery_handler_type: "delivery_company",
        delivery_handler_id: company.id,
        delivery_handler_name: company.company_name,
        delivery_claimed_at: new Date().toISOString(),
        driver_name: null,
      } : {}),
    })
    .eq("id", orderId)
    .eq("status", currentStatus);
  if (newStatus === "out_for_delivery") {
    updateQuery = updateQuery.is("delivery_handler_type", null).is("driver_name", null);
  } else {
    updateQuery = updateQuery.eq("delivery_handler_type", "delivery_company").eq("delivery_handler_id", company.id);
  }
  const { data, error } = await updateQuery.select("id")
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
