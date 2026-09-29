"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ArchivedOrder = {
  source_order_id: number;
  customer_name: string | null;
  phone: string | null;
  status: string | null;
  created_at: string | null;
  finalized_at: string | null;
  archived_at: string;
  order_data: Record<string, unknown>;
  items_data: Array<Record<string, unknown>>;
};

const statusLabels: Record<string, string> = {
  delivered: "Delivered",
  rejected: "Rejected",
  cancelled_by_customer: "Cancelled",
};

function dateText(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function ArchivedOrdersPage() {
  const [orders, setOrders] = useState<ArchivedOrder[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders(nextSearch = "") {
    setLoading(true);
    setError("");

    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set("search", nextSearch.trim());

    const response = await fetch(
      `/api/admin/archive/orders${params.size ? `?${params}` : ""}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }
    );

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error || "Could not load archived orders.");
      setOrders([]);
    } else {
      setOrders(payload?.orders || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadOrders(search);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
            Order storage
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            Archived Orders
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Final orders move here automatically 90 days after completion.
          </p>
        </div>
        <form onSubmit={submitSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Order #, customer or phone"
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none ring-emerald-600 focus:ring-2"
          />
          <button
            type="submit"
            className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">Loading archived orders…</p>
      ) : orders.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
          No archived orders found.
        </p>
      ) : (
        <div className="mt-6 grid gap-4">
          {orders.map((order) => (
            <article
              key={order.source_order_id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Order #{order.source_order_id}
                  </p>
                  <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                    {order.customer_name || "Unknown customer"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{order.phone || "—"}</p>
                </div>
                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {statusLabels[order.status || ""] || order.status || "Final"}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <p><strong className="text-slate-900">Completed:</strong> {dateText(order.finalized_at)}</p>
                <p><strong className="text-slate-900">Archived:</strong> {dateText(order.archived_at)}</p>
                <p><strong className="text-slate-900">Total:</strong> {String(order.order_data.total_price || "—")} SYP</p>
              </div>
              {order.items_data.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-700">
                  <strong>Items:</strong>{" "}
                  {order.items_data
                    .map((item) => `${String(item.product_name || "Product")} × ${String(item.quantity || 1)}`)
                    .join(" · ")}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
