"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminBannersPage() {
  const router = useRouter();

  const [banners, setBanners] = useState<any[]>([]);
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [textAr, setTextAr] = useState("");
  const [textEn, setTextEn] = useState("");
  const [linkUrl, setLinkUrl] = useState("/products");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkAdmin() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/admin/login");
      return;
    }

    loadBanners();
  }

  async function loadBanners() {
    const { data, error } = await supabase
      .from("home_banners")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setBanners(data || []);
  }

  async function addBanner(e: React.FormEvent) {
    e.preventDefault();

    if (!imageFile) {
      alert("Please upload banner image");
      return;
    }

    setLoading(true);

    const filePath = `${Date.now()}-${imageFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from("home-banners")
      .upload(filePath, imageFile);

    if (uploadError) {
      alert(uploadError.message);
      setLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("home-banners")
      .getPublicUrl(filePath);

    const { error } = await supabase.from("home_banners").insert({
      image_url: publicUrlData.publicUrl,

      title: titleEn || titleAr,
      text: textEn || textAr,

      title_ar: titleAr,
      title_en: titleEn,
      text_ar: textAr,
      text_en: textEn,

      link_url: linkUrl || "/products",
      sort_order: banners.length,
      is_active: true,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setTitleAr("");
    setTitleEn("");
    setTextAr("");
    setTextEn("");
    setLinkUrl("/products");
    setImageFile(null);
    setLoading(false);
    loadBanners();
  }

  async function toggleActive(banner: any) {
    const { error } = await supabase
      .from("home_banners")
      .update({ is_active: !banner.is_active })
      .eq("id", banner.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadBanners();
  }

  async function deleteBanner(id: number) {
    const confirmDelete = confirm("Delete this banner?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("home_banners")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadBanners();
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <section className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="mb-6 flex gap-2">
            <a
              href="/admin"
              className="hidden rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 lg:inline-flex"
            >
              ← Desktop Dashboard
            </a>

            <a
              href="/admin-mobile"
              className="inline-flex rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 lg:hidden"
            >
              ← Dashboard
            </a>
          </div>

          <h1 className="mt-5 text-4xl font-extrabold text-gray-900">
            Homepage Banners
          </h1>

          <p className="mt-2 text-gray-600">
            Manage homepage banners and promotional slides.
          </p>
        </section>

        <form
          onSubmit={addBanner}
          className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100"
        >
          <h2 className="mb-5 text-2xl font-extrabold text-gray-900">
            Add Banner
          </h2>

          <input
            type="text"
            placeholder="Banner Title Arabic"
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            dir="rtl"
            required
            className="mb-3 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-black outline-none transition focus:border-green-600 focus:bg-white"
          />

          <input
            type="text"
            placeholder="Banner Title English"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            dir="ltr"
            required
            className="mb-3 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-black outline-none transition focus:border-green-600 focus:bg-white"
          />

          <textarea
            placeholder="Banner Text Arabic"
            value={textAr}
            onChange={(e) => setTextAr(e.target.value)}
            dir="rtl"
            className="mb-3 min-h-28 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-black outline-none transition focus:border-green-600 focus:bg-white"
          />

          <textarea
            placeholder="Banner Text English"
            value={textEn}
            onChange={(e) => setTextEn(e.target.value)}
            dir="ltr"
            className="mb-3 min-h-28 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-black outline-none transition focus:border-green-600 focus:bg-white"
          />

          <input
            type="text"
            placeholder="Link URL, example: /products"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="mb-3 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-black outline-none transition focus:border-green-600 focus:bg-white"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            required
            className="mb-4 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-black file:mr-4 file:rounded-xl file:border-0 file:bg-green-600 file:px-4 file:py-2 file:font-bold file:text-white"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-green-600 px-6 py-4 font-extrabold text-white shadow-sm transition hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Uploading..." : "Add Banner"}
          </button>
        </form>

        <div className="space-y-5">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-100"
            >
              <img
                src={banner.image_url}
                alt={banner.title_en || banner.title_ar || banner.title}
                className="h-64 w-full object-cover"
              />

              <div className="p-6">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-gray-900">
                    {banner.title_en || banner.title_ar || banner.title}
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                      banner.is_active
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {banner.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div dir="rtl" className="rounded-2xl bg-gray-50 p-4">
                    <p className="font-bold text-gray-900">Arabic</p>
                    <p className="mt-2 leading-7 text-gray-600">
                      {banner.title_ar}
                    </p>
                    <p className="mt-2 leading-7 text-gray-600">
                      {banner.text_ar}
                    </p>
                  </div>

                  <div dir="ltr" className="rounded-2xl bg-gray-50 p-4">
                    <p className="font-bold text-gray-900">English</p>
                    <p className="mt-2 leading-7 text-gray-600">
                      {banner.title_en}
                    </p>
                    <p className="mt-2 leading-7 text-gray-600">
                      {banner.text_en}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm font-bold text-gray-500">
                  Link: {banner.link_url}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => toggleActive(banner)}
                    className={`rounded-2xl px-5 py-3 font-extrabold text-white transition ${
                      banner.is_active
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {banner.is_active ? "Deactivate" : "Activate"}
                  </button>

                  <button
                    onClick={() => deleteBanner(banner.id)}
                    className="rounded-2xl bg-red-600 px-5 py-3 font-extrabold text-white transition hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}