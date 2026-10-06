"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

/*
  Admin > Coupons.

  A coupon is a code the customer types on the payment page. Three kinds:
    percent        10% off (with an optional maximum)
    fixed          a fixed amount off, e.g. 20,000 SYP
    free_delivery  delivery is free for this order

  A coupon never discounts an item that already got an automatic promotion
  (unless that promotion allows coupons), and each coupon chooses whether
  it also applies to items that are on sale.
*/

type CouponType = "percent" | "fixed" | "free_delivery";

type Coupon = {
  id: number;
  code: string;
  discount_type: CouponType | null;
  discount_percent: number | null;
  discount_amount: number | null;
  maximum_discount: number | null;
  minimum_order_amount: number | null;
  applies_to_sale_items: boolean | null;
  one_use_per_customer: boolean;
  is_active: boolean;
  expires_at: string | null;
};

const TYPE_OPTIONS: Array<{ type: CouponType; title: string; example: string }> = [
  { type: "percent", title: "Percentage", example: "10% off" },
  { type: "fixed", title: "Fixed amount", example: "20,000 SYP off" },
  { type: "free_delivery", title: "Free delivery", example: "No delivery fee" },
];

const initialForm = {
  code: "",
  type: "percent" as CouponType,
  discount_percent: "",
  discount_amount: "",
  maximum_discount: "",
  minimum_order_amount: "",
  expires_at: "",
  one_use_per_customer: false,
  applies_to_sale_items: true,
};

const FIELD =
  "mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600";

function money(value: number | null | undefined) {
  return `${Math.round(Number(value || 0)).toLocaleString("en-US")} SYP`;
}

function couponType(coupon: Coupon): CouponType {
  return coupon.discount_type === "fixed" ||
    coupon.discount_type === "free_delivery"
    ? coupon.discount_type
    : "percent";
}

function couponSummary(coupon: Coupon) {
  const type = couponType(coupon);
  const minimum = Number(coupon.minimum_order_amount || 0);
  const parts: string[] = [];

  if (type === "percent") {
    parts.push(`${coupon.discount_percent}% off`);
    if (Number(coupon.maximum_discount || 0) > 0) {
      parts.push(`max ${money(coupon.maximum_discount)}`);
    }
  } else if (type === "fixed") {
    parts.push(`${money(coupon.discount_amount)} off`);
  } else {
    parts.push("Free delivery");
  }

  if (minimum > 0) parts.push(`orders from ${money(minimum)}`);

  return parts.join(" · ");
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const loadCoupons = useCallback(async () => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("id", { ascending: false });

    if (error) return alert(error.message);

    setCoupons((data || []) as Coupon[]);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCoupons(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCoupons]);

  async function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const code = form.code.trim().toUpperCase().replace(/\s+/g, "");
    if (!code) {
      alert("Enter a coupon code.");
      return;
    }

    const percent = Number(form.discount_percent);
    const amount = Number(form.discount_amount);

    if (
      form.type === "percent" &&
      (!Number.isFinite(percent) || percent <= 0 || percent > 100)
    ) {
      alert("Enter a discount between 0.01% and 100%.");
      return;
    }

    if (
      form.type === "fixed" &&
      (!Number.isFinite(amount) || amount <= 0)
    ) {
      alert("Enter the amount to take off, in SYP.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("coupons").insert({
      code,
      discount_type: form.type,
      discount_percent: form.type === "percent" ? percent : 0,
      discount_amount: form.type === "fixed" ? Math.round(amount) : null,
      maximum_discount:
        form.type === "percent" && form.maximum_discount
          ? Number(form.maximum_discount)
          : null,
      minimum_order_amount: Number(form.minimum_order_amount || 0),
      expires_at: form.expires_at
        ? new Date(form.expires_at).toISOString()
        : null,
      one_use_per_customer: form.one_use_per_customer,
      // Free delivery is about the order, not about items.
      applies_to_sale_items:
        form.type === "free_delivery" ? true : form.applies_to_sale_items,
      is_active: true,
    });

    setSaving(false);

    if (error) return alert(error.message);

    setForm(initialForm);
    void loadCoupons();
  }

  async function toggleCoupon(coupon: Coupon) {
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !coupon.is_active })
      .eq("id", coupon.id);

    if (error) return alert(error.message);

    void loadCoupons();
  }

  async function toggleSaleItems(coupon: Coupon) {
    const { error } = await supabase
      .from("coupons")
      .update({
        applies_to_sale_items: coupon.applies_to_sale_items === false,
      })
      .eq("id", coupon.id);

    if (error) return alert(error.message);

    void loadCoupons();
  }

  return (
    <main className="mx-auto max-w-6xl p-5 sm:p-8">
      <p className="text-xs font-extrabold uppercase tracking-[.16em] text-green-700">
        Marketing
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
        Coupons
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
        Codes customers enter on the payment page. A coupon discounts only the
        items that did not get an automatic promotion, unless that promotion
        allows coupons on top.
      </p>

      <form
        onSubmit={createCoupon}
        className="mt-7 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {TYPE_OPTIONS.map((option) => {
            const selected = form.type === option.type;

            return (
              <button
                key={option.type}
                type="button"
                aria-pressed={selected}
                onClick={() => setForm({ ...form, type: option.type })}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-green-700 bg-green-50"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <span className="block text-sm font-extrabold text-gray-900">
                  {option.title}
                </span>
                <span className="mt-1 block text-xs text-gray-600">
                  {option.example}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-bold text-gray-700">
            Coupon code
            <input
              value={form.code}
              onChange={(event) =>
                setForm({ ...form, code: event.target.value })
              }
              placeholder="WELCOME5"
              type="text"
              maxLength={40}
              className={`${FIELD} font-mono uppercase`}
            />
          </label>

          {form.type === "percent" && (
            <>
              <label className="text-xs font-bold text-gray-700">
                Discount (%)
                <input
                  value={form.discount_percent}
                  onChange={(event) =>
                    setForm({ ...form, discount_percent: event.target.value })
                  }
                  placeholder="10"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className={FIELD}
                />
              </label>

              <label className="text-xs font-bold text-gray-700">
                Maximum discount (SYP)
                <input
                  value={form.maximum_discount}
                  onChange={(event) =>
                    setForm({ ...form, maximum_discount: event.target.value })
                  }
                  placeholder="Optional"
                  type="number"
                  min="0"
                  step="1"
                  className={FIELD}
                />
              </label>
            </>
          )}

          {form.type === "fixed" && (
            <label className="text-xs font-bold text-gray-700">
              Amount off (SYP)
              <input
                value={form.discount_amount}
                onChange={(event) =>
                  setForm({ ...form, discount_amount: event.target.value })
                }
                placeholder="20000"
                type="number"
                min="0"
                step="1"
                className={FIELD}
              />
            </label>
          )}

          <label className="text-xs font-bold text-gray-700">
            Minimum order (SYP)
            <input
              value={form.minimum_order_amount}
              onChange={(event) =>
                setForm({
                  ...form,
                  minimum_order_amount: event.target.value,
                })
              }
              placeholder="Optional"
              type="number"
              min="0"
              step="1"
              className={FIELD}
            />
          </label>

          <label className="text-xs font-bold text-gray-700">
            Expiry (optional)
            <input
              value={form.expires_at}
              onChange={(event) =>
                setForm({ ...form, expires_at: event.target.value })
              }
              type="datetime-local"
              className={FIELD}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-300 px-3 py-3 text-sm font-bold text-gray-800">
            <input
              checked={form.one_use_per_customer}
              onChange={(event) =>
                setForm({
                  ...form,
                  one_use_per_customer: event.target.checked,
                })
              }
              type="checkbox"
              className="mt-1 h-4 w-4 accent-green-700"
            />
            <span>
              One use per customer
              <span className="block text-xs font-normal text-gray-500">
                Otherwise valid on every order
              </span>
            </span>
          </label>

          {form.type !== "free_delivery" && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-300 px-3 py-3 text-sm font-bold text-gray-800">
              <input
                checked={form.applies_to_sale_items}
                onChange={(event) =>
                  setForm({
                    ...form,
                    applies_to_sale_items: event.target.checked,
                  })
                }
                type="checkbox"
                className="mt-1 h-4 w-4 accent-green-700"
              />
              <span>
                Also applies to items on sale
                <span className="block text-xs font-normal text-gray-500">
                  Off = skips items with a sale or flash-sale price
                </span>
              </span>
            </label>
          )}
        </div>

        {form.type === "fixed" && (
          <p className="mt-3 text-xs leading-5 text-gray-500">
            The amount is taken off the items the coupon applies to. If they
            cost less than the amount, only their price is taken off.
          </p>
        )}

        <button
          disabled={saving}
          className="mt-5 w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-extrabold text-white hover:bg-green-800 disabled:bg-gray-400"
        >
          {saving ? "Saving…" : "Create coupon"}
        </button>
      </form>

      <div className="mt-7 overflow-hidden rounded-3xl border border-gray-200 bg-white">
        {coupons.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">No coupons yet.</p>
        ) : (
          coupons.map((coupon) => {
            const type = couponType(coupon);

            return (
              <div
                key={coupon.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5 last:border-0"
              >
                <div>
                  <p className="font-mono text-lg font-extrabold text-gray-900">
                    {coupon.code}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {couponSummary(coupon)}
                  </p>
                  <p className="mt-1 text-xs font-bold text-gray-500">
                    {coupon.one_use_per_customer
                      ? "One use per customer"
                      : "Reusable on every order"}
                    {type !== "free_delivery" &&
                      (coupon.applies_to_sale_items === false
                        ? " · skips items on sale"
                        : " · also on sale items")}
                    {coupon.expires_at
                      ? ` · expires ${new Date(coupon.expires_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                      : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                      coupon.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {coupon.is_active ? "Active" : "Inactive"}
                  </span>

                  {type !== "free_delivery" && (
                    <button
                      type="button"
                      onClick={() => void toggleSaleItems(coupon)}
                      className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-extrabold text-gray-700"
                    >
                      {coupon.applies_to_sale_items === false
                        ? "Allow on sale items"
                        : "Skip sale items"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void toggleCoupon(coupon)}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-extrabold text-gray-700"
                  >
                    {coupon.is_active ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
