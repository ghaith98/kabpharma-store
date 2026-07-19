import { NextResponse } from "next/server";

import { hasTrustedOrigin, jsonError } from "@/lib/http";
import { getStaffSession } from "@/lib/staff-session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const DRIVER_ORDER_FIELDS = `
  id,
  customer_name,
  phone,
  delivery_area,
  address,
  total_price,
  status,
  driver_name
`;

async function getActiveDriver() {
  const session = await getStaffSession();

  if (!session || session.role !== "driver") {
    return null;
  }

  const { data } = await supabaseAdmin
    .from("delivery_drivers")
    .select("id, name, is_active")
    .eq("id", session.accountId)
    .eq("name", session.displayName)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  return data || null;
}

export async function GET() {
  const driver = await getActiveDriver();

  if (!driver) {
    return jsonError("Authentication required", 401);
  }

  const [availableResult, mineResult] =
    await Promise.all([
      supabaseAdmin
        .from("orders")
        .select(DRIVER_ORDER_FIELDS)
        .eq("status", "accepted")
        .is("driver_name", null)
        .order("id", { ascending: false }),
      supabaseAdmin
        .from("orders")
        .select(DRIVER_ORDER_FIELDS)
        .eq("driver_name", driver.name)
        .eq("status", "out_for_delivery")
        .order("id", { ascending: false }),
    ]);

  if (availableResult.error || mineResult.error) {
    console.error(
      "Could not load driver orders:",
      availableResult.error || mineResult.error
    );
    return jsonError("Could not load orders", 502);
  }

  return NextResponse.json(
    {
      success: true,
      driver: {
        id: driver.id,
        name: driver.name,
      },
      availableOrders: availableResult.data || [],
      myOrders: mineResult.data || [],
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

  const driver = await getActiveDriver();

  if (!driver) {
    return jsonError("Authentication required", 401);
  }

  const body = await request.json().catch(() => null);
  const action = String(body?.action || "");
  const orderId = Number(body?.orderId);

  if (
    !Number.isInteger(orderId) ||
    orderId <= 0 ||
    (action !== "accept" && action !== "deliver")
  ) {
    return jsonError("Invalid order action", 400);
  }

  if (action === "accept") {
    const { data: activeOrder, error: activeError } =
      await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("driver_name", driver.name)
        .eq("status", "out_for_delivery")
        .limit(1)
        .maybeSingle();

    if (activeError) {
      return jsonError("Could not check current orders", 502);
    }

    if (activeOrder) {
      return jsonError(
        "A delivery is already in progress",
        409
      );
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({
        status: "out_for_delivery",
        driver_name: driver.name,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "accepted")
      .is("driver_name", null)
      .select("id")
      .maybeSingle();

    if (error) {
      return jsonError("Could not accept order", 502);
    }

    if (!data) {
      return jsonError(
        "This order is no longer available",
        409
      );
    }
  } else {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "out_for_delivery")
      .eq("driver_name", driver.name)
      .select("id")
      .maybeSingle();

    if (error) {
      return jsonError("Could not complete order", 502);
    }

    if (!data) {
      return jsonError(
        "Order not found or not assigned to this driver",
        409
      );
    }
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
