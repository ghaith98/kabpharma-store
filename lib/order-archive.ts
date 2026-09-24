import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getArchiveAdmin, isArchiveConfigured } from "@/lib/supabase-archive";

const ARCHIVABLE_STATUSES = [
  "rejected",
  "cancelled_by_customer",
];

const ARCHIVE_AFTER_DAYS = 90;
const BATCH_SIZE = 50;

type LiveOrder = Record<string, unknown> & {
  id: number;
  customer_name?: string | null;
  phone?: string | null;
  status?: string | null;
  created_at?: string | null;
  finalized_at?: string | null;
  order_items?: Record<string, unknown>[] | null;
};

type ArchivedOrderRow = {
  source_order_id: number;
  customer_name: string | null;
  phone: string | null;
  status: string | null;
  created_at: string | null;
  finalized_at: string | null;
  archived_at: string;
  order_data: Record<string, unknown>;
  items_data: Record<string, unknown>[];
};

function cutoffDate() {
  return new Date(
    Date.now() - ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
}

function toArchiveRow(order: LiveOrder): ArchivedOrderRow {
  const { order_items, ...orderData } = order;

  return {
    source_order_id: order.id,
    customer_name: order.customer_name || null,
    phone: order.phone || null,
    status: order.status || null,
    created_at: order.created_at || null,
    finalized_at: order.finalized_at || null,
    archived_at: new Date().toISOString(),
    order_data: orderData,
    items_data: Array.isArray(order_items) ? order_items : [],
  };
}

/**
 * Copies rejected/cancelled orders to the separate archive first. A source
 * order is removed only after the archive upsert succeeds. The source database
 * RPC removes its child rows and parent row in one transaction.
 */
export async function archiveEligibleOrders() {
  if (!isArchiveConfigured()) {
    throw new Error("Order archive is not configured");
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items (*)")
    .in("status", ARCHIVABLE_STATUSES)
    .not("finalized_at", "is", null)
    .lt("finalized_at", cutoffDate())
    .order("finalized_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) throw error;

  const archive = getArchiveAdmin();
  let archived = 0;
  const failures: Array<{ id: number; message: string }> = [];

  for (const rawOrder of (data || []) as LiveOrder[]) {
    try {
      const archiveRow = toArchiveRow(rawOrder);
      const { error: archiveError } = await archive
        .from("archived_orders")
        .upsert(archiveRow, { onConflict: "source_order_id" });

      if (archiveError) throw archiveError;

      const { error: removeError } = await supabaseAdmin.rpc(
        "remove_order_after_archive",
        {
          p_order_id: rawOrder.id,
          p_finalized_at: rawOrder.finalized_at,
        }
      );

      if (removeError) throw removeError;
      archived += 1;
    } catch (error) {
      failures.push({
        id: rawOrder.id,
        message:
          error instanceof Error ? error.message : "Unknown archive error",
      });
    }
  }

  return {
    eligible: (data || []).length,
    archived,
    failures,
  };
}

export async function getArchivedOrders(options?: {
  search?: string;
  limit?: number;
}) {
  if (!isArchiveConfigured()) {
    throw new Error("Order archive is not configured");
  }

  const archive = getArchiveAdmin();
  const limit = Math.min(Math.max(options?.limit || 100, 1), 250);
  let query = archive
    .from("archived_orders")
    .select(
      "source_order_id, customer_name, phone, status, created_at, finalized_at, archived_at, order_data, items_data"
    )
    .order("finalized_at", { ascending: false })
    .limit(limit);

  const search = options?.search?.trim();
  if (search) {
    const safeSearch = search.replace(/[,%()]/g, " ").trim();
    if (safeSearch) {
      query = query.or(
        `source_order_id.eq.${safeSearch},customer_name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%`
      );
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getArchivedOrderForCustomer(
  sourceOrderId: string,
  phone: string
) {
  if (!isArchiveConfigured()) return null;

  const numericId = Number(sourceOrderId);
  if (!Number.isSafeInteger(numericId) || numericId < 1) return null;

  const { data, error } = await getArchiveAdmin()
    .from("archived_orders")
    .select("order_data")
    .eq("source_order_id", numericId)
    .eq("phone", phone)
    .maybeSingle();

  if (error || !data?.order_data || typeof data.order_data !== "object") {
    return null;
  }

  return data.order_data as Record<string, unknown>;
}

export async function getArchivedOrderSummariesForCustomer(phone: string) {
  if (!isArchiveConfigured()) return [];

  const { data, error } = await getArchiveAdmin()
    .from("archived_orders")
    .select("source_order_id, customer_name, phone, status, created_at, order_data")
    .eq("phone", phone)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => {
    const orderData =
      row.order_data && typeof row.order_data === "object"
        ? (row.order_data as Record<string, unknown>)
        : {};

    return {
      id: row.source_order_id,
      customer_name: row.customer_name,
      phone: row.phone,
      address: orderData.address || null,
      total_price: orderData.total_price || null,
      status: row.status,
      created_at: row.created_at,
    };
  });
}
