"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Brand = {
  id: number;
  slug: string;
  name: string;
  name_ar: string | null;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  banner_image_url: string | null;
  banner_image_url_mobile: string | null;
  side_banner_image_url: string | null;
  side_banner_image_url_mobile: string | null;
};

const imageFields = [
  ["banner_image_url", "Main banner (desktop)", "1600 × 620 px"],
  ["banner_image_url_mobile", "Main banner (mobile)", "800 × 400 px"],
  ["side_banner_image_url", "Side banner (desktop)", "1200 × 576 px"],
  ["side_banner_image_url_mobile", "Side banner (mobile)", "800 × 1000 px"],
] as const;

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadBrands() {
    const { data, error } = await supabase.from("brands").select("*").order("id");
    if (error) return alert(error.message);
    setBrands((data || []) as Brand[]);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBrands(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function uploadImage(event: ChangeEvent<HTMLInputElement>, field: keyof Brand) {
    const file = event.target.files?.[0];
    if (!file || !editing) return;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `brands/${editing.slug}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) return alert(error.message);
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setEditing({ ...editing, [field]: data.publicUrl });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("brands").update({
      name: editing.name.trim(), name_ar: editing.name_ar?.trim() || null, name_en: editing.name_en?.trim() || null,
      description_ar: editing.description_ar?.trim() || null, description_en: editing.description_en?.trim() || null,
      banner_image_url: editing.banner_image_url, banner_image_url_mobile: editing.banner_image_url_mobile,
      side_banner_image_url: editing.side_banner_image_url, side_banner_image_url_mobile: editing.side_banner_image_url_mobile,
    }).eq("id", editing.id);
    setSaving(false);
    if (error) return alert(error.message);
    setEditing(null);
    await loadBrands();
  }

  return <main className="min-h-screen bg-[#f7f8f6] p-4 sm:p-7"><div className="mx-auto max-w-6xl">
    <section className="mb-7"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a583b]">Catalog</p><h1 className="mt-2 text-3xl font-extrabold text-[#142019]">Brands</h1><p className="mt-2 text-sm text-[#647168]">Manage the brand pages and their main and side banners.</p><div className="mt-4 grid gap-3 rounded-2xl border border-[#dce8df] bg-[#eef6f0] p-4 text-sm text-[#385342] sm:grid-cols-2"><p><strong>Main banner:</strong> desktop 1600 × 620 px · mobile 800 × 400 px</p><p><strong>Side banner:</strong> desktop 1200 × 576 px · mobile 800 × 1000 px</p></div></section>
    <div className="grid gap-4 md:grid-cols-3">{brands.map((brand) => <button key={brand.id} type="button" onClick={() => setEditing({ ...brand })} className="overflow-hidden rounded-[1.5rem] border border-[#e1e8e3] bg-white text-left shadow-sm transition hover:border-[#8eb19d] hover:shadow-md"><div className="aspect-[16/9] bg-[#eaf1ed]">{brand.banner_image_url ? <img src={brand.banner_image_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm font-bold text-[#53705f]">No main banner yet</div>}</div><div className="p-5"><h2 className="font-extrabold text-[#142019]">{brand.name_en || brand.name}</h2><p dir="rtl" className="mt-1 text-sm font-bold text-[#0a583b]">{brand.name_ar}</p><p className="mt-3 text-xs font-bold text-[#738078]">Edit brand & banners →</p></div></button>)}</div>
    {editing && <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#07130d]/50 p-4 backdrop-blur-sm"><div className="mx-auto my-6 max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a583b]">{editing.slug}</p><h2 className="mt-1 text-2xl font-extrabold text-[#142019]">Edit brand</h2></div><button type="button" onClick={() => setEditing(null)} className="rounded-xl px-3 py-2 font-bold text-[#647168] hover:bg-[#f1f4f1]">Close</button></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Brand name" className="rounded-xl border border-[#d9e2dc] p-3 font-bold text-[#142019] outline-none focus:border-[#0a583b]" />
        <input dir="rtl" value={editing.name_ar || ""} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} placeholder="الاسم بالعربية" className="rounded-xl border border-[#d9e2dc] p-3 font-bold text-[#142019] outline-none focus:border-[#0a583b]" />
        <textarea dir="rtl" value={editing.description_ar || ""} onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })} placeholder="الوصف بالعربية" className="min-h-24 rounded-xl border border-[#d9e2dc] p-3 outline-none focus:border-[#0a583b]" />
        <textarea value={editing.description_en || ""} onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} placeholder="English description" className="min-h-24 rounded-xl border border-[#d9e2dc] p-3 outline-none focus:border-[#0a583b]" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">{imageFields.map(([field, label, dimensions]) => <div key={field} className="overflow-hidden rounded-2xl border border-[#dfe7e1] bg-[#f8faf8]"><div className="aspect-[16/8] bg-[#eaf1ed]">{editing[field] ? <img src={editing[field] || ""} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs font-bold text-[#748278]">No image</div>}</div><div className="p-3"><p className="text-sm font-extrabold text-[#142019]">{label}</p><p className="mt-1 text-xs font-bold text-[#53705f]">Recommended size: {dimensions}</p><input type="file" accept="image/*" onChange={(event) => void uploadImage(event, field)} className="mt-2 w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[#0a583b] file:px-3 file:py-2 file:font-bold file:text-white" /></div></div>)}</div>
      <div className="mt-7 flex justify-end gap-3"><button type="button" onClick={() => setEditing(null)} className="rounded-xl px-5 py-3 text-sm font-extrabold text-[#526057] hover:bg-[#f1f4f1]">Cancel</button><button type="button" disabled={saving} onClick={() => void save()} className="rounded-xl bg-[#0a583b] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">{saving ? "Saving..." : "Save brand"}</button></div>
    </div></div>}
  </div></main>;
}
