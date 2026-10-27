import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getArchiveAdmin, isArchiveConfigured } from "@/lib/supabase-archive";
import { presentCustomerOrder } from "@/lib/admin-customer-details";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;
const headers = { "Cache-Control": "private, no-store" };
function fail(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status, headers });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getAdminFromRequest(request)) return fail("Admin access required", 403);
  const { id } = await context.params;
  const beforeValue = new URL(request.url).searchParams.get("before");
  const profileId = Number(id);
  const before = beforeValue === null ? null : Number(beforeValue);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(profileId) || profileId < 1 ||
    (before !== null && (!Number.isSafeInteger(before) || before < 1))) {
    return fail("Invalid customer or order cursor", 400);
  }
  try {
    const { data: customer, error } = await supabaseAdmin.from("profiles")
      .select("id, full_name, phone, email, created_at").eq("id", profileId).maybeSingle();
    if (error) throw error;
    if (!customer) return fail("Customer not found", 404);

    // Prefer the durable profile ID. Only legacy unlinked orders fall back
    // to the exact phone, bounded by signup date to avoid a reused account.
    const phone = typeof customer.phone === "string" ? customer.phone.trim() : "";
    const since = typeof customer.created_at === "string" && Number.isFinite(Date.parse(customer.created_at))
      ? new Date(customer.created_at).toISOString() : null;
    const safePhone = /^\+?\d+$/.test(phone) ? phone : null;
    function ownership(prefix = "") {
      const field = prefix ? "order_data->>customer_profile_id" : "customer_profile_id";
      return `${field}.eq.${profileId}${safePhone && since
        ? `,and(${field}.is.null,phone.eq.${safePhone},created_at.gte.${since})` : ""}`;
    }
    let liveQuery = supabaseAdmin.from("orders")
      .select("*, order_items(id, product_id, variant_id, product_name, variant_label_ar, variant_label_en, quantity, unit_price)")
      .or(ownership()).order("id", { ascending: false }).limit(PAGE_SIZE + 1);
    if (before !== null) liveQuery = liveQuery.lt("id", before);
    const livePromise = liveQuery;
    const archivePromise = (async () => {
      if (!isArchiveConfigured()) return { orders: [], warning: null };
      try {
        let query = getArchiveAdmin().from("archived_orders")
          .select("source_order_id, order_data, items_data")
          .or(ownership("archive")).order("source_order_id", { ascending: false }).limit(PAGE_SIZE + 1);
        if (before !== null) query = query.lt("source_order_id", before);
        const { data, error: archiveError } = await query;
        if (archiveError) throw archiveError;
        return { orders: (data || []).map(row => presentCustomerOrder({
          ...row.order_data, id: row.source_order_id, order_items: row.items_data,
        }, true)), warning: null };
      } catch (archiveError) {
        console.error("Customer archive lookup failed:", archiveError);
        return { orders: [], warning: "Archived orders could not be loaded. Refresh to retry; this history is incomplete." };
      }
    })();
    const [live, archive, ban] = await Promise.all([
      livePromise, archivePromise,
      phone ? supabaseAdmin.rpc("check_user_ban", { p_phone: phone }) : Promise.resolve({ data: null, error: null }),
    ]);
    if (live.error) throw live.error;
    const orders = new Map(archive.orders.map(order => [String(order.id), order]));
    for (const row of live.data || []) orders.set(String(row.id), presentCustomerOrder(row, false));
    const sorted = [...orders.values()].sort((a, b) => Number(b.id) - Number(a.id));
    const page = sorted.slice(0, PAGE_SIZE);
    const restriction = Array.isArray(ban.data) ? ban.data[0] : ban.data;
    return NextResponse.json({ success: true, customer,
      restriction: ban.error || !restriction ? null : {
        is_banned: restriction.is_banned === true, reason: restriction.reason || null,
      },
      orders: page, nextBefore: sorted.length > PAGE_SIZE ? Number(page.at(-1)!.id) : null,
      warning: [archive.warning, ban.error ? "Purchase restriction status could not be loaded." : null].filter(Boolean).join(" ") || null,
    }, { headers });
  } catch (error) {
    console.error("Admin customer details lookup failed:", error);
    return fail("Could not load customer details. Please try again.", 500);
  }
}
