"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type PromotionType = "buy_2_get_1" | "buy_1_second_50";
type Product = { id: number; name: string | null; name_ar: string | null; name_en: string | null; price: number | null; sale_percent: number | null; is_out_of_stock: boolean | null; brand_id: number | null };
type Brand = { id: number; name: string | null; name_ar: string | null; name_en: string | null };
type ProductVariant = { id: number; product_id: number; label_ar: string | null; label_en: string | null; price: number | null; image_url: string | null; sort_order: number | null };
type Promotion = { id: string; type: PromotionType; product_id: number; variant_id: number | null; is_active: boolean; products: Product | null; product_variants: ProductVariant | null };
type PromotionGroup = { key: string; product: Product | null; type: PromotionType; rows: Promotion[] };

const offerLabel = (type: PromotionType) => type === "buy_2_get_1" ? "Buy 2+1 Free" : "اشتري 1، والثاني بنصف السعر";

export default function PromotionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [brandId, setBrandId] = useState("");
  const [productId, setProductId] = useState("");
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantIds, setVariantIds] = useState<number[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [type, setType] = useState<PromotionType>("buy_2_get_1");
  const [saving, setSaving] = useState(false);
  const [workingKey, setWorkingKey] = useState<string | null>(null);

  const headers = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` };
  }, []);

  const load = useCallback(async () => {
    const [productsResult, brandsResult, headersValue] = await Promise.all([
      supabase.from("products").select("id,name,name_ar,name_en,price,sale_percent,is_out_of_stock,brand_id").order("name_en"),
      supabase.from("brands").select("id,name,name_ar,name_en").order("id"),
      headers(),
    ]);
    if (!productsResult.error) setProducts(productsResult.data || []);
    if (!brandsResult.error) {
      const loadedBrands = brandsResult.data || [];
      setBrands(loadedBrands);
      setBrandId((current) => {
        if (current || loadedBrands.length === 0) return current;
        const kabBrand = loadedBrands.find((brand) => `${brand.name || ""} ${brand.name_en || ""}`.toLowerCase().includes("kab"));
        return String((kabBrand || loadedBrands[0]).id);
      });
    }
    const response = await fetch("/api/admin/promotions", { headers: headersValue, cache: "no-store" });
    const result = await response.json().catch(() => null);
    if (response.ok) setPromotions(result?.promotions || []);
  }, [headers]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setVariantIds([]);
      if (!productId) { setVariants([]); setLoadingVariants(false); return; }
      setLoadingVariants(true);
      void headers().then((headersValue) => fetch(`/api/admin/promotions?productId=${Number(productId)}`, { headers: headersValue, cache: "no-store" }))
        .then(async (response) => ({ response, result: await response.json().catch(() => null) }))
        .then(({ response, result }) => { if (!cancelled) { setVariants(response.ok ? result?.variants || [] : []); setLoadingVariants(false); } })
        .catch(() => { if (!cancelled) { setVariants([]); setLoadingVariants(false); } });
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [headers, productId]);

  const eligibleProducts = products.filter((product) =>
    !product.is_out_of_stock &&
    Number(product.sale_percent || 0) <= 0 &&
    (brandId === "all" || !brandId || String(product.brand_id) === brandId)
  );
  const productName = (product: Product | null) => product?.name_ar || product?.name || product?.name_en || "منتج";
  const brandName = (id: number | null) => {
    const brand = brands.find((item) => item.id === id);
    return brand?.name_ar || brand?.name_en || brand?.name || "";
  };
  const variantName = (variant: ProductVariant) => variant.label_ar || variant.label_en || `خيار ${variant.id}`;
  const hasOptions = variants.length > 0;
  const toggleVariant = (id: number) => setVariantIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const groups = useMemo<PromotionGroup[]>(() => {
    const grouped = new Map<string, PromotionGroup>();
    for (const row of promotions) {
      const key = `${row.product_id}-${row.type}`;
      const current = grouped.get(key) || { key, product: row.products, type: row.type, rows: [] };
      current.rows.push(row);
      grouped.set(key, current);
    }
    return [...grouped.values()];
  }, [promotions]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!productId || (hasOptions && variantIds.length === 0)) return;
    setSaving(true);
    const response = await fetch("/api/admin/promotions", { method: "POST", headers: await headers(), body: JSON.stringify({ productId: Number(productId), variantIds, type }) });
    const result = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) { alert(result?.error || "تعذر حفظ العرض"); return; }
    setProductId(""); setVariantIds([]); await load();
  }

  async function changeStatus(group: PromotionGroup, isActive: boolean) {
    setWorkingKey(group.key);
    const response = await fetch("/api/admin/promotions", { method: "PATCH", headers: await headers(), body: JSON.stringify({ ids: group.rows.map((row) => row.id), isActive }) });
    setWorkingKey(null);
    if (!response.ok) { alert("تعذر تحديث حالة العرض"); return; }
    await load();
  }

  async function remove(group: PromotionGroup) {
    if (!window.confirm(`حذف عرض «${offerLabel(group.type)}» من ${productName(group.product)}؟\nسيُحذف العرض فقط، ولن يتغير أي منتج أو طلب سابق.`)) return;
    setWorkingKey(group.key);
    const response = await fetch("/api/admin/promotions", { method: "DELETE", headers: await headers(), body: JSON.stringify({ ids: group.rows.map((row) => row.id) }) });
    setWorkingKey(null);
    if (!response.ok) { alert("تعذر حذف العرض"); return; }
    await load();
  }

  return <main dir="rtl" className="mx-auto max-w-5xl p-4 sm:p-8">
    <p className="text-xs font-extrabold tracking-[.16em] text-green-700">التسويق</p>
    <h1 className="mt-1 text-3xl font-extrabold text-[#142019]">العروض التلقائية</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">اختاري المنتج ثم الأحجام المشمولة. العرض يطبّق على نفس الحجم فقط، ولا يطبّق على منتج عليه تخفيض أو غير متوفر.</p>
    <form onSubmit={save} className="mt-7 rounded-3xl border border-[#e4ece6] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-[#142019]">إضافة عرض</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => { setBrandId("all"); setProductId(""); }} className={`rounded-xl px-3 py-2 text-xs font-extrabold ${brandId === "all" ? "bg-[#0a583b] text-white" : "bg-[#f1f6f2] text-[#40614d]"}`}>كل الماركات</button>
        {brands.map((brand) => <button key={brand.id} type="button" onClick={() => { setBrandId(String(brand.id)); setProductId(""); }} className={`rounded-xl px-3 py-2 text-xs font-extrabold ${brandId === String(brand.id) ? "bg-[#0a583b] text-white" : "bg-[#f1f6f2] text-[#40614d]"}`}>{brand.name_ar || brand.name_en || brand.name}</button>)}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_280px]">
        <select required value={productId} onChange={(event) => setProductId(event.target.value)} className="rounded-xl border border-[#d7e0d9] bg-white p-3 text-sm"><option value="">اختاري المنتج</option>{eligibleProducts.map((product) => <option key={product.id} value={product.id}>{productName(product)}{brandId === "all" ? ` — ${brandName(product.brand_id)}` : ""}</option>)}</select>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#f5f8f5] p-1.5">{(["buy_2_get_1", "buy_1_second_50"] as PromotionType[]).map((offerType) => <button key={offerType} type="button" onClick={() => setType(offerType)} className={`rounded-lg px-3 py-2 text-xs font-extrabold leading-5 transition ${type === offerType ? "bg-[#0a583b] text-white shadow-sm" : "text-[#536158] hover:bg-white"}`}>{offerType === "buy_2_get_1" ? "Buy 2+1 Free" : "اشتري 1، والثاني بنصف السعر"}</button>)}</div>
      </div>
      {loadingVariants && <p className="mt-4 text-sm text-gray-500">جارٍ تحميل الأحجام…</p>}
      {!loadingVariants && hasOptions && <fieldset className="mt-4 rounded-2xl border border-[#dfe7e1] bg-[#fafcfb] p-4"><legend className="px-1 text-sm font-extrabold">الأحجام المشمولة</legend><p className="mb-3 text-xs text-gray-500">يمكنك اختيار أكثر من حجم، مثل 50g و100g. كل حجم يُحسب وحده في السلة.</p><div className="grid gap-2 sm:grid-cols-2">{variants.map((variant) => <label key={variant.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e1e8e3] bg-white p-3"><input type="checkbox" checked={variantIds.includes(variant.id)} onChange={() => toggleVariant(variant.id)} className="h-4 w-4 accent-[#0a583b]" /><span className="font-bold text-[#142019]">{variantName(variant)}</span></label>)}</div></fieldset>}
      {productId && !loadingVariants && !hasOptions && <p className="mt-4 rounded-xl bg-[#f5f8f5] p-3 text-sm text-gray-600">لا توجد أحجام لهذا المنتج؛ سيطبّق العرض على المنتج نفسه.</p>}
      <button disabled={saving || loadingVariants || !productId || (hasOptions && variantIds.length === 0)} className="mt-5 rounded-xl bg-[#0a583b] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#073f2c] disabled:bg-gray-400">{saving ? "جارٍ الحفظ…" : "حفظ العرض"}</button>
    </form>
    <section className="mt-8 overflow-hidden rounded-3xl border border-[#e4ece6] bg-white">
      <div className="border-b border-[#e4ece6] px-5 py-4 sm:px-6"><h2 className="font-extrabold text-[#142019]">العروض الحالية</h2></div>
      {groups.length === 0 ? <p className="p-6 text-sm text-gray-600">لا توجد عروض مضافة بعد.</p> : groups.map((group) => {
        const active = group.rows.every((row) => row.is_active); const paused = group.rows.every((row) => !row.is_active); const busy = workingKey === group.key; const sizes = group.rows.map((row) => row.product_variants ? variantName(row.product_variants) : "كل المنتج");
        return <div key={group.key} className="flex flex-wrap items-center justify-between gap-4 border-b border-[#edf1ee] p-5 last:border-0 sm:px-6"><div><p className="font-extrabold text-[#142019]">{productName(group.product)}</p><p className="mt-1 text-sm font-bold text-[#0a583b]">{offerLabel(group.type)}</p><div className="mt-2 flex flex-wrap gap-1.5">{sizes.map((size) => <span key={size} className="rounded-full bg-[#f1f6f2] px-2.5 py-1 text-xs font-semibold text-[#40614d]">{size}</span>)}</div></div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${active ? "bg-emerald-50 text-emerald-700" : paused ? "bg-gray-100 text-gray-600" : "bg-amber-50 text-amber-700"}`}>{active ? "مفعّل" : paused ? "موقوف" : "حالة مختلطة"}</span><button disabled={busy} onClick={() => void changeStatus(group, !active)} className={`rounded-xl border px-3 py-2 text-xs font-extrabold disabled:opacity-50 ${active ? "border-gray-300 text-gray-700" : "border-[#0a583b] bg-[#0a583b] text-white"}`}>{active ? "إيقاف العرض" : "تفعيل العرض"}</button><button disabled={busy} onClick={() => void remove(group)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-extrabold text-red-600 disabled:opacity-50">حذف</button></div></div>;
      })}
    </section>
  </main>;
}
