"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminBannersPage() {
  const router = useRouter();

  const [banners, setBanners] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
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
      title,
      text,
      link_url: linkUrl || "/products",
      sort_order: banners.length,
      is_active: true,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setTitle("");
    setText("");
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
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Homepage Banners
          </h1>

          <a
            href="/admin"
            className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Back to Dashboard
          </a>
        </div>

        <form
          onSubmit={addBanner}
          className="mb-8 rounded-2xl bg-white p-6 shadow"
        >
          <h2 className="mb-4 text-xl font-bold">Add Banner</h2>

          <input
            type="text"
            placeholder="Banner Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mb-3 w-full rounded-xl border p-3 text-black"
          />

          <textarea
            placeholder="Banner Text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mb-3 w-full rounded-xl border p-3 text-black"
          />

          <input
            type="text"
            placeholder="Link URL, example: /products"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="mb-3 w-full rounded-xl border p-3 text-black"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            required
            className="mb-4 w-full rounded-xl border p-3 text-black"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-black px-5 py-3 text-white disabled:bg-gray-400"
          >
            {loading ? "Uploading..." : "Add Banner"}
          </button>
        </form>

        <div className="space-y-4">
          {banners.map((banner) => (
            <div key={banner.id} className="rounded-2xl bg-white p-6 shadow">
              <img
                src={banner.image_url}
                alt={banner.title}
                className="mb-4 h-48 w-full rounded-2xl object-cover"
              />

              <h2 className="text-xl font-bold text-gray-900">
                {banner.title}
              </h2>

              <p className="mt-2 text-gray-600">{banner.text}</p>

              <p className="mt-2 text-sm font-semibold text-gray-500">
                Link: {banner.link_url}
              </p>

              <p
                className={`mt-2 font-bold ${
                  banner.is_active ? "text-green-700" : "text-red-600"
                }`}
              >
                {banner.is_active ? "Active" : "Inactive"}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => toggleActive(banner)}
                  className={`rounded-xl px-4 py-2 font-semibold text-white ${
                    banner.is_active
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {banner.is_active ? "Deactivate" : "Activate"}
                </button>

                <button
                  onClick={() => deleteBanner(banner.id)}
                  className="rounded-xl bg-red-600 px-4 py-2 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}