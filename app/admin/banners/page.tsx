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

  const [buttonTextAr, setButtonTextAr] =
    useState("تسوق الآن");

  const [buttonTextEn, setButtonTextEn] =
    useState("Shop now");

  const [linkUrl, setLinkUrl] =
    useState("/products");

  const [desktopImageFile, setDesktopImageFile] =
    useState<File | null>(null);

  const [mobileImageFile, setMobileImageFile] =
    useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  const [formKey, setFormKey] = useState(0);

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

  async function checkAdmin() {
    const { data, error } =
      await supabase.auth.getUser();

    if (error || !data.user) {
      router.push("/admin/login");
      return;
    }

    await loadBanners();
  }

  function createSafeFileName(fileName: string) {
    return fileName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9.\-_]/g, "");
  }

  async function uploadBannerImage(
    file: File,
    folder: "desktop" | "mobile"
  ) {
    const safeFileName = createSafeFileName(file.name);

    const uniqueId = `${Date.now()}-${crypto.randomUUID()}`;

    const filePath = `${folder}/${uniqueId}-${safeFileName}`;

    const { error: uploadError } =
      await supabase.storage
        .from("home-banners")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("home-banners")
      .getPublicUrl(filePath);

    return {
      publicUrl: data.publicUrl,
      filePath,
    };
  }

  async function removeUploadedFile(
    filePath: string | null
  ) {
    if (!filePath) return;

    await supabase.storage
      .from("home-banners")
      .remove([filePath]);
  }

  function resetForm() {
    setTitleAr("");
    setTitleEn("");

    setTextAr("");
    setTextEn("");

    setButtonTextAr("تسوق الآن");
    setButtonTextEn("Shop now");

    setLinkUrl("/products");

    setDesktopImageFile(null);
    setMobileImageFile(null);

    // Reset file input fields
    setFormKey((current) => current + 1);
  }

  async function addBanner(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!desktopImageFile) {
      alert("Please upload the desktop banner image");
      return;
    }

    if (!mobileImageFile) {
      alert("Please upload the mobile banner image");
      return;
    }

    setLoading(true);

    let uploadedDesktopPath: string | null = null;
    let uploadedMobilePath: string | null = null;

    try {
      const desktopUpload = await uploadBannerImage(
        desktopImageFile,
        "desktop"
      );

      uploadedDesktopPath = desktopUpload.filePath;

      const mobileUpload = await uploadBannerImage(
        mobileImageFile,
        "mobile"
      );

      uploadedMobilePath = mobileUpload.filePath;

      const nextSortOrder =
        banners.length > 0
          ? Math.max(
              ...banners.map((banner) =>
                Number(banner.sort_order || 0)
              )
            ) + 1
          : 1;

      const { error: insertError } = await supabase
        .from("home_banners")
        .insert({
          image_url: desktopUpload.publicUrl,
          image_url_mobile: mobileUpload.publicUrl,

          title: titleEn || titleAr,
          text: textEn || textAr,

          title_ar: titleAr,
          title_en: titleEn,

          text_ar: textAr,
          text_en: textEn,

          button_text: buttonTextEn || "Shop now",
          button_text_ar:
            buttonTextAr || "تسوق الآن",

          link_url: linkUrl || "/products",

          sort_order: nextSortOrder,
          is_active: true,
        });

      if (insertError) {
        throw insertError;
      }

      resetForm();
      await loadBanners();

      alert("Banner added successfully");
    } catch (error: any) {
      // Remove uploaded files if database insertion fails
      await Promise.all([
        removeUploadedFile(uploadedDesktopPath),
        removeUploadedFile(uploadedMobilePath),
      ]);

      alert(
        error?.message ||
          "Something went wrong while adding the banner"
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(banner: any) {
    const { error } = await supabase
      .from("home_banners")
      .update({
        is_active: !banner.is_active,
      })
      .eq("id", banner.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadBanners();
  }

  async function deleteBanner(id: number) {
    const confirmDelete = window.confirm(
      "Delete this banner?"
    );

    if (!confirmDelete) return;

    const banner = banners.find(
      (item) => Number(item.id) === Number(id)
    );

    const { error } = await supabase
      .from("home_banners")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    if (banner) {
      const storagePaths = [
        getStoragePathFromPublicUrl(banner.image_url),
        getStoragePathFromPublicUrl(
          banner.image_url_mobile
        ),
      ].filter(Boolean) as string[];

      if (storagePaths.length > 0) {
        await supabase.storage
          .from("home-banners")
          .remove(storagePaths);
      }
    }

    await loadBanners();
  }

  function getStoragePathFromPublicUrl(
    publicUrl?: string | null
  ) {
    if (!publicUrl) return null;

    const marker =
      "/storage/v1/object/public/home-banners/";

    const markerIndex = publicUrl.indexOf(marker);

    if (markerIndex === -1) return null;

    return decodeURIComponent(
      publicUrl.substring(
        markerIndex + marker.length
      )
    );
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f8f7] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Page heading */}
        <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex gap-2">
            <a
              href="/admin"
              className="hidden rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700 lg:inline-flex"
            >
              ← Desktop Dashboard
            </a>

            <a
              href="/admin-mobile"
              className="inline-flex rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700 lg:hidden"
            >
              ← Dashboard
            </a>
          </div>

          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-700">
            Website Content
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
            Homepage Banners
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
            Add separate desktop and mobile campaign
            images, localized text and destination links.
          </p>
        </section>

        {/* Add banner form */}
        <form
          key={formKey}
          onSubmit={addBanner}
          className="mb-10 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-gray-950">
              Add Campaign Banner
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Both desktop and mobile images are required.
            </p>
          </div>

          {/* Titles */}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-gray-800">
                Arabic title
              </span>

              <input
                type="text"
                placeholder="عنوان الإعلان بالعربي"
                value={titleAr}
                onChange={(event) =>
                  setTitleAr(event.target.value)
                }
                dir="rtl"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-gray-800">
                English title
              </span>

              <input
                type="text"
                placeholder="Campaign title"
                value={titleEn}
                onChange={(event) =>
                  setTitleEn(event.target.value)
                }
                dir="ltr"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-50"
              />
            </label>
          </div>

          {/* Descriptions */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-gray-800">
                Arabic description
              </span>

              <textarea
                placeholder="وصف مختصر للإعلان"
                value={textAr}
                onChange={(event) =>
                  setTextAr(event.target.value)
                }
                dir="rtl"
                className="min-h-28 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-gray-800">
                English description
              </span>

              <textarea
                placeholder="Short campaign description"
                value={textEn}
                onChange={(event) =>
                  setTextEn(event.target.value)
                }
                dir="ltr"
                className="min-h-28 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-50"
              />
            </label>
          </div>

          {/* Button text */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-gray-800">
                Arabic button text
              </span>

              <input
                type="text"
                placeholder="تسوق الآن"
                value={buttonTextAr}
                onChange={(event) =>
                  setButtonTextAr(event.target.value)
                }
                dir="rtl"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-gray-800">
                English button text
              </span>

              <input
                type="text"
                placeholder="Shop now"
                value={buttonTextEn}
                onChange={(event) =>
                  setButtonTextEn(event.target.value)
                }
                dir="ltr"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-50"
              />
            </label>
          </div>

          {/* Link */}
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-extrabold text-gray-800">
              Destination URL
            </span>

            <input
              type="text"
              placeholder="/products"
              value={linkUrl}
              onChange={(event) =>
                setLinkUrl(event.target.value)
              }
              dir="ltr"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-50"
            />
          </label>

          {/* Images */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 transition hover:border-green-400 hover:bg-green-50/30">
              <span className="block text-sm font-extrabold text-gray-900">
                Desktop image
              </span>

              <span className="mt-1 block text-xs leading-5 text-gray-500">
                Recommended wide campaign image.
              </span>

              <input
                type="file"
                accept="image/*"
                required
                onChange={(event) =>
                  setDesktopImageFile(
                    event.target.files?.[0] || null
                  )
                }
                className="mt-4 block w-full text-sm text-gray-600 file:me-3 file:rounded-xl file:border-0 file:bg-green-700 file:px-4 file:py-2.5 file:text-sm file:font-extrabold file:text-white hover:file:bg-green-800"
              />

              {desktopImageFile && (
                <p className="mt-3 truncate text-xs font-bold text-green-700">
                  {desktopImageFile.name}
                </p>
              )}
            </label>

            <label className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 transition hover:border-green-400 hover:bg-green-50/30">
              <span className="block text-sm font-extrabold text-gray-900">
                Mobile image
              </span>

              <span className="mt-1 block text-xs leading-5 text-gray-500">
                Recommended portrait campaign image.
              </span>

              <input
                type="file"
                accept="image/*"
                required
                onChange={(event) =>
                  setMobileImageFile(
                    event.target.files?.[0] || null
                  )
                }
                className="mt-4 block w-full text-sm text-gray-600 file:me-3 file:rounded-xl file:border-0 file:bg-green-700 file:px-4 file:py-2.5 file:text-sm file:font-extrabold file:text-white hover:file:bg-green-800"
              />

              {mobileImageFile && (
                <p className="mt-3 truncate text-xs font-bold text-green-700">
                  {mobileImageFile.name}
                </p>
              )}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-green-700 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading
              ? "Uploading campaign..."
              : "Add Campaign Banner"}
          </button>
        </form>

        {/* Existing banners */}
        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-extrabold text-gray-950">
              Existing Banners
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {banners.length} banner
              {banners.length === 1 ? "" : "s"}
            </p>
          </div>

          {banners.length === 0 ? (
            <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
              <p className="font-bold text-gray-700">
                No homepage banners yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {banners.map((banner) => (
                <article
                  key={banner.id}
                  className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
                >
                  {/* Images preview */}
                  <div className="grid bg-gray-100 md:grid-cols-[1fr_260px]">
                    <div>
                      <div className="border-b border-white/50 bg-gray-900/70 px-4 py-2 text-xs font-extrabold text-white">
                        Desktop
                      </div>

                      <img
                        src={banner.image_url}
                        alt={
                          banner.title_en ||
                          banner.title_ar ||
                          banner.title
                        }
                        className="h-64 w-full object-cover sm:h-80"
                      />
                    </div>

                    <div className="border-t border-white md:border-l md:border-t-0">
                      <div className="border-b border-white/50 bg-gray-900/70 px-4 py-2 text-xs font-extrabold text-white">
                        Mobile
                      </div>

                      {banner.image_url_mobile ? (
                        <img
                          src={banner.image_url_mobile}
                          alt={
                            banner.title_en ||
                            banner.title_ar ||
                            banner.title
                          }
                          className="h-80 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-80 items-center justify-center bg-gray-200 px-5 text-center text-sm font-bold text-gray-500">
                          No mobile image
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Banner information */}
                  <div className="p-6 sm:p-7">
                    <div className="mb-5 flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-extrabold text-gray-950 sm:text-2xl">
                        {banner.title_en ||
                          banner.title_ar ||
                          banner.title}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                          banner.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {banner.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                        Order: {banner.sort_order}
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div
                        dir="rtl"
                        className="rounded-2xl bg-gray-50 p-5 text-right"
                      >
                        <p className="text-xs font-extrabold uppercase tracking-wider text-green-700">
                          Arabic
                        </p>

                        <h4 className="mt-3 text-lg font-extrabold text-gray-950">
                          {banner.title_ar || "—"}
                        </h4>

                        <p className="mt-2 text-sm leading-7 text-gray-600">
                          {banner.text_ar || "—"}
                        </p>

                        <p className="mt-3 text-sm font-extrabold text-green-700">
                          {banner.button_text_ar ||
                            "تسوق الآن"}
                        </p>
                      </div>

                      <div
                        dir="ltr"
                        className="rounded-2xl bg-gray-50 p-5 text-left"
                      >
                        <p className="text-xs font-extrabold uppercase tracking-wider text-green-700">
                          English
                        </p>

                        <h4 className="mt-3 text-lg font-extrabold text-gray-950">
                          {banner.title_en || "—"}
                        </h4>

                        <p className="mt-2 text-sm leading-7 text-gray-600">
                          {banner.text_en || "—"}
                        </p>

                        <p className="mt-3 text-sm font-extrabold text-green-700">
                          {banner.button_text ||
                            "Shop now"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 break-all text-sm font-bold text-gray-500">
                      Link: {banner.link_url || "/products"}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          toggleActive(banner)
                        }
                        className={`rounded-xl px-5 py-3 text-sm font-extrabold text-white transition ${
                          banner.is_active
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-green-700 hover:bg-green-800"
                        }`}
                      >
                        {banner.is_active
                          ? "Deactivate"
                          : "Activate"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteBanner(banner.id)
                        }
                        className="rounded-xl bg-red-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}