"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Coupon = {
  id: number;
  code: string;
  discount_percent: number;
  maximum_discount: number | null;
  minimum_order_amount: number;
  one_use_per_customer: boolean;
  is_active: boolean;
  expires_at: string | null;
};

const initialForm = {
  code: "", discount_percent: "", maximum_discount: "",
  minimum_order_amount: "", expires_at: "", one_use_per_customer: false,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const loadCoupons = useCallback(async () => {
    const { data, error } = await supabase.from("coupons")
      .select("id, code, discount_percent, maximum_discount, minimum_order_amount, one_use_per_customer, is_active, expires_at")
      .order("id", { ascending: false });
    if (error) return alert(error.message);
    setCoupons(data || []);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadCoupons(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCoupons]);

  async function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = form.code.trim().toUpperCase().replace(/\s+/g, "");
    const percent = Number(form.discount_percent);
    if (!code || !Number.isFinite(percent) || percent <= 0 || percent > 100) {
      alert("Enter a code and a discount between 0.01% and 100%."); return;
    }
    setSaving(true);
    const { error } = await supabase.from("coupons").insert({
      code, discount_percent: percent,
      maximum_discount: form.maximum_discount ? Number(form.maximum_discount) : null,
      minimum_order_amount: Number(form.minimum_order_amount || 0),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      one_use_per_customer: form.one_use_per_customer,
      is_active: true,
    });
    setSaving(false);
    if (error) return alert(error.message);
    setForm(initialForm); void loadCoupons();
  }
  async function toggleCoupon(coupon: Coupon) {
    const { error } = await supabase.from("coupons").update({ is_active: !coupon.is_active }).eq("id", coupon.id);
    if (error) return alert(error.message);
    void loadCoupons();
  }

  return <main className="mx-auto max-w-6xl p-5 sm:p-8">
    <p className="text-xs font-extrabold uppercase tracking-[.16em] text-green-700">Marketing</p>
    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">Coupons</h1>
    <p className="mt-2 text-sm text-gray-600">Create percentage discounts with an optional maximum discount amount and usage rule.</p>
    <form onSubmit={createCoupon} className="mt-7 grid gap-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
      {([ ["code", "Coupon code", "WELCOME5"], ["discount_percent", "Discount (%)", "5"], ["maximum_discount", "Maximum discount (SYP)", "30"], ["minimum_order_amount", "Minimum order (SYP)", "Optional"] ] as const).map(([key, label, placeholder]) => <label key={key} className="text-xs font-bold text-gray-700">{label}<input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} type={key === "code" ? "text" : "number"} min={key === "code" ? undefined : "0"} step={key === "discount_percent" ? "0.01" : "1"} className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600" /></label>)}
      <label className="text-xs font-bold text-gray-700">Expiry (optional)<input value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} type="datetime-local" className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600" /></label>
      <label className="flex min-h-[78px] cursor-pointer items-center gap-3 rounded-xl border border-gray-300 px-3 text-sm font-bold text-gray-800"><input checked={form.one_use_per_customer} onChange={(e) => setForm({ ...form, one_use_per_customer: e.target.checked })} type="checkbox" className="h-4 w-4 accent-green-700" /><span>One use per customer<br /><span className="text-xs font-normal text-gray-500">Otherwise valid on every order</span></span></label>
      <button disabled={saving} className="rounded-xl bg-green-700 px-4 py-3 text-sm font-extrabold text-white hover:bg-green-800 disabled:bg-gray-400 sm:col-span-2 lg:col-span-6">{saving ? "Saving…" : "Create coupon"}</button>
    </form>
    <div className="mt-7 overflow-hidden rounded-3xl border border-gray-200 bg-white">
      {coupons.length === 0 ? <p className="p-6 text-sm text-gray-600">No coupons yet.</p> : coupons.map((coupon) => <div key={coupon.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5 last:border-0"><div><p className="font-mono text-lg font-extrabold text-gray-900">{coupon.code}</p><p className="mt-1 text-sm text-gray-600">{coupon.discount_percent}% · max {coupon.maximum_discount ?? "—"} SYP · minimum {coupon.minimum_order_amount || 0} SYP</p><p className="mt-1 text-xs font-bold text-gray-500">{coupon.one_use_per_customer ? "One use per customer" : "Reusable on every order"}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${coupon.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{coupon.is_active ? "Active" : "Inactive"}</span><button onClick={() => void toggleCoupon(coupon)} className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-extrabold text-gray-700">{coupon.is_active ? "Disable" : "Enable"}</button></div></div>)}
    </div>
  </main>;
}
