"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { CustomerDetails, CustomerOrder } from "@/lib/admin-customer-details";
import { buildOrderItemPresentation, splitOrderDiscounts } from "@/lib/order-promotion-display";
import { deliveryHandlerLabel } from "@/lib/delivery-handler";
import { deliveryLocationUrl } from "@/lib/delivery-location";

function date(value: string | null) {
  return value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString() : "—";
}
function money(value: number | null | undefined) {
  return `${Number(value || 0).toLocaleString()} SYP`;
}
const statuses: Record<string, string> = {
  pending: "Pending payment review", accepted: "Accepted", out_for_delivery: "Out for delivery",
  delivered: "Delivered", rejected: "Rejected", cancelled_by_customer: "Cancelled by customer",
};
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs font-semibold text-gray-500">{label}</dt>
    <dd className="mt-1 break-words text-sm font-medium text-gray-900" dir="auto">{children || "—"}</dd></div>;
}
function OrderDetails({ order }: { order: CustomerOrder }) {
  const { items, giftValue } = buildOrderItemPresentation(order.order_items, order.promotion_details, "en");
  const discounts = splitOrderDiscounts(order, giftValue);
  const location = deliveryLocationUrl(order.delivery_location);
  const subtotal = order.products_subtotal ?? order.order_items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
  return <details className="group overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 focus-visible:outline-2 focus-visible:outline-green-600 sm:p-5">
      <div><p className="font-bold text-gray-900">Order #{order.id} {order.archived && <span className="ml-2 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">Archived</span>}</p>
        <p className="mt-1 text-xs text-gray-500">{date(order.created_at)}</p></div>
      <div className="flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${order.status === "delivered" ? "bg-green-50 text-green-800" : "bg-gray-100 text-gray-700"}`}>{statuses[order.status || ""] || order.status || "Unknown status"}</span>
        <span className="text-sm font-bold">{money(order.total_price)}</span><span className="text-xs font-semibold text-green-700 group-open:hidden">Details +</span><span className="hidden text-xs font-semibold text-green-700 group-open:inline">Close −</span></div>
    </summary>
    <div className="space-y-5 border-t border-gray-100 p-4 sm:p-5">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Delivery handled by">{deliveryHandlerLabel(order)}</Field>
        <Field label="Collected at">{date(order.delivery_claimed_at || null)}</Field>
        <Field label="Recipient">{order.customer_name}</Field><Field label="Phone">{order.phone}</Field>
        <Field label="Governorate">{order.governorate}</Field><Field label="Area">{order.delivery_area}</Field>
        <Field label="Delivery address">{order.address}</Field>
        <Field label="Map location">{location ? <a href={location} target="_blank" rel="noopener noreferrer" className="font-bold text-green-700 underline">Open Google Maps ↗</a> : "Not recorded"}</Field>
        <Field label="Payment method">{order.payment_method === "cod" ? "Cash on delivery" : order.payment_method === "transfer" ? "ShamCash" : order.payment_method}</Field>
        <Field label="ShamCash transaction">{order.shamcash_transaction_id}</Field>
        <Field label="Delivered at">{date(order.delivered_at)}</Field>
        <Field label="Finalized at">{date(order.finalized_at)}</Field>
      </dl>
      <div><h3 className="mb-3 text-sm font-bold">Products · {order.order_items.reduce((sum, item) => sum + Number(item.quantity), 0)} items</h3>
        {items.length === 0 ? <p className="text-sm text-gray-500">No product details were saved for this order.</p> :
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 px-3">{items.map((item, index) => <li key={`${item.id}-${index}`} className="flex justify-between gap-3 py-3 text-sm">
            <div className="min-w-0"><p className="break-words font-semibold" dir="auto">{item.product_name || "Product"}</p>
              {(item.variant_label_en || item.variant_label_ar) && <p className="mt-1 text-xs text-gray-500" dir="auto">{item.variant_label_en || item.variant_label_ar}</p>}
              <p className="mt-1 text-xs text-gray-500">{item.quantity} × {money(item.unit_price)}</p>
              {item.isPromotionGift && <p className="mt-1 text-xs font-semibold text-green-700">Free gift · {item.promotionName}</p>}
              {!item.isPromotionGift && Number(item.promotionDiscount || 0) > 0 && <p className="mt-1 text-xs text-green-700">{item.promotionName || "Promotion"}: −{money(item.promotionDiscount)}</p>}
            </div><p className="shrink-0 font-semibold">{money(Number(item.quantity) * Number(item.unit_price))}</p>
          </li>)}</ul>}
      </div>
      <dl className="ml-auto grid max-w-md grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-gray-50 p-4 text-sm">
        <dt>Products subtotal</dt><dd className="text-right">{money(subtotal)}</dd>
        {giftValue > 0 && <><dt>Free gifts included</dt><dd className="text-right text-green-700">−{money(giftValue)}</dd></>}
        {discounts.promotionDiscount > 0 && <><dt>Promotion{order.promotion_name ? ` · ${order.promotion_name}` : ""}</dt><dd className="text-right text-green-700">−{money(discounts.promotionDiscount)}</dd></>}
        {order.coupon_code && <><dt>Coupon · {order.coupon_code}</dt><dd className="text-right text-green-700">−{money(discounts.couponDiscount)}</dd></>}
        {discounts.otherDiscount > 0 && <><dt>Other discount</dt><dd className="text-right text-green-700">−{money(discounts.otherDiscount)}</dd></>}
        <dt>Delivery</dt><dd className="text-right">{money(order.delivery_fee)}</dd>
        {Number(order.cod_fee) > 0 && <><dt>Cash on delivery fee</dt><dd className="text-right">{money(order.cod_fee)}</dd></>}
        <dt className="border-t border-gray-200 pt-3 font-bold">Order total</dt><dd className="border-t border-gray-200 pt-3 text-right font-bold">{money(order.total_price)}</dd>
      </dl>
    </div>
  </details>;
}

export default function AdminCustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<(CustomerDetails & { forId: string }) | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const sessionIdentity = useRef<string | null>(null);
  const active = useRef<AbortController | null>(null);
  const load = useCallback(async (before?: number) => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    try {
      const { data } = await supabase.auth.getSession();
      if (controller.signal.aborted) return;
      setBusy(true); setError("");
      sessionIdentity.current = data.session?.user.id || null;
      if (!data.session) { setState(null); throw new Error("Please sign in with an admin account to view this customer."); }
      const response = await fetch(`/api/admin/customers/${encodeURIComponent(id)}${before ? `?before=${before}` : ""}`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: "no-store", signal: controller.signal,
      });
      const result = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || !result.success) {
        if (response.status === 403 || response.status === 404) setState(null);
        throw new Error(result.error || "Could not load customer details.");
      }
      setState(previous => {
        const orders = before && previous?.forId === id
          ? [...new Map([...previous.orders, ...result.orders].map((order: CustomerOrder) => [String(order.id), order])).values()]
          : result.orders;
        return { ...result, forId: id, orders };
      });
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not load customer details.");
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }, [id]);
  useEffect(() => {
    // Schedule the initial request so a discarded Strict Mode mount can cancel it.
    const start = window.setTimeout(() => void load(), 0);
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event === "SIGNED_IN" && sessionIdentity.current !== null && session?.user.id !== sessionIdentity.current)) { active.current?.abort(); setState(null); setError("Your session changed. Refresh to continue."); setBusy(false); }
    });
    return () => { window.clearTimeout(start); active.current?.abort(); listener.subscription.unsubscribe(); };
  }, [load]);
  const details = state?.forId === id ? state : null;
  return <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 sm:py-8">
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between gap-3"><Link href="/admin/users" className="text-sm font-bold text-green-700 hover:underline">← Customers</Link>
        <button type="button" onClick={() => void load()} disabled={busy} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy ? "Loading…" : "Refresh"}</button></div>
      <h1 className="text-2xl font-extrabold text-gray-900">Customer details</h1>
      {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {!details && busy && <p role="status" className="text-sm text-gray-500">Loading customer and order history…</p>}
      {details && <>
        <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="break-words text-xl font-bold" dir="auto">{details.customer.full_name || "Unnamed customer"}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${details.restriction?.is_banned ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-700"}`}>{details.restriction ? details.restriction.is_banned ? "Purchases restricted" : "Active" : "Restriction status unavailable"}</span></div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Customer ID">#{details.customer.id}</Field><Field label="Phone">{details.customer.phone}</Field>
            <Field label="Email">{details.customer.email}</Field><Field label="Registered">{date(details.customer.created_at)}</Field>
            {details.restriction?.is_banned && <Field label="Internal restriction reason">{details.restriction.reason}</Field>}
          </dl>
        </section>
        {details.warning && <div role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{details.warning}</div>}
        <section className="space-y-3"><div><h2 className="text-lg font-bold">Order history</h2><p className="mt-1 text-sm text-gray-500">Newest first · {details.orders.length} loaded. Open an order for its full details.</p></div>
          {details.orders.length === 0 ? <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">{details.warning ? "No orders available to display right now." : "This customer has no orders yet."}</div> : details.orders.map(order => <OrderDetails key={order.id} order={order} />)}
          {details.nextBefore && <button type="button" onClick={() => void load(details.nextBefore!)} disabled={busy} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-green-700 disabled:opacity-50">{busy ? "Loading…" : "Load older orders"}</button>}
        </section>
      </>}
    </div>
  </main>;
}
