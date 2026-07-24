"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Concern = {
  id: number;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  image_url: string | null;
  banner_image_url: string | null;
  banner_image_url_mobile: string | null;
  sort_order: number;
};

type ProductOption = {
  id: number;
  name: string | null;
  name_ar: string | null;
  name_en: string | null;
};

type ConcernImageFieldProps = {
  title: string;
  description: string;
  dimensions: string;
  file: File | null;
  currentUrl?: string | null;
  required?: boolean;
  onChange: (file: File | null) => void;
};

function ConcernImageField({
  title,
  description,
  dimensions,
  file,
  currentUrl,
  required = false,
  onChange,
}: ConcernImageFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentUrl || null
  );
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function handleFileChange(nextFile: File | null) {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (nextFile) {
      objectUrlRef.current = URL.createObjectURL(nextFile);
      setPreviewUrl(objectUrlRef.current);
    } else {
      setPreviewUrl(currentUrl || null);
    }

    onChange(nextFile);
  }

  return (
    <label className="block overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-gray-900">{title}</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            {dimensions}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>

      <div className="p-4">
        <div className="mb-3 aspect-[8/3.1] overflow-hidden rounded-xl border border-gray-200 bg-white">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-semibold text-gray-400">
              No image selected
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={required}
          onChange={(event) =>
            handleFileChange(event.target.files?.[0] || null)
          }
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:font-bold file:text-white hover:file:bg-emerald-800"
        />

        {file && (
          <p className="mt-2 truncate text-xs font-semibold text-gray-500">
            Selected: {file.name}
          </p>
        )}
      </div>
    </label>
  );
}

function validateImageDimensions(
  file: File,
  expectedWidth: number,
  expectedHeight: number,
  label: string
) {
  return new Promise<void>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      if (
        image.naturalWidth !== expectedWidth ||
        image.naturalHeight !== expectedHeight
      ) {
        reject(
          new Error(
            `${label} must be exactly ${expectedWidth} × ${expectedHeight} px. Selected image is ${image.naturalWidth} × ${image.naturalHeight} px.`
          )
        );
        return;
      }

      resolve();
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Could not read ${label.toLowerCase()} dimensions.`));
    };

    image.src = objectUrl;
  });
}

export default function AdminConcernsPage() {
  const router = useRouter();

  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [linksByConcern, setLinksByConcern] = useState<
    Map<number, Set<number>>
  >(new Map());

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [tileImageFile, setTileImageFile] = useState<File | null>(null);
  const [desktopBannerFile, setDesktopBannerFile] =
    useState<File | null>(null);
  const [mobileBannerFile, setMobileBannerFile] =
    useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNameAr, setEditNameAr] = useState("");
  const [editNameEn, setEditNameEn] = useState("");
  const [editDescriptionAr, setEditDescriptionAr] = useState("");
  const [editDescriptionEn, setEditDescriptionEn] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("0");
  const [editTileImageFile, setEditTileImageFile] =
    useState<File | null>(null);
  const [editDesktopBannerFile, setEditDesktopBannerFile] =
    useState<File | null>(null);
  const [editMobileBannerFile, setEditMobileBannerFile] =
    useState<File | null>(null);

  const [managingId, setManagingId] = useState<number | null>(null);
  const [managingSelection, setManagingSelection] = useState<Set<number>>(
    new Set()
  );
  const [productSearch, setProductSearch] = useState("");

  const loadAll = useCallback(async () => {
    const [concernsRes, productsRes, linksRes] = await Promise.all([
      supabase
        .from("concerns")
        .select("*")
        .order("sort_order", { ascending: true }),

      supabase
        .from("products")
        .select("id, name, name_ar, name_en")
        .order("id", { ascending: false }),

      supabase.from("product_concerns").select("concern_id, product_id"),
    ]);

    if (concernsRes.error) {
      alert(concernsRes.error.message);
      return;
    }

    if (productsRes.error) {
      alert(productsRes.error.message);
      return;
    }

    if (linksRes.error) {
      alert(linksRes.error.message);
      return;
    }

    setConcerns(concernsRes.data || []);
    setProducts(productsRes.data || []);

    const map = new Map<number, Set<number>>();

    (linksRes.data || []).forEach((link) => {
      const concernId = Number(link.concern_id);
      const productId = Number(link.product_id);
      const set = map.get(concernId) || new Set<number>();
      set.add(productId);
      map.set(concernId, set);
    });

    setLinksByConcern(map);
  }, []);

  const checkAdmin = useCallback(async () => {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/admin/login");
      return;
    }

    await loadAll();
  }, [loadAll, router]);

  useEffect(() => {
    window.queueMicrotask(() => {
      void checkAdmin();
    });
  }, [checkAdmin]);

  async function uploadConcernImage(
    file: File,
    variant: "tile" | "desktop" | "mobile"
  ) {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = `concerns/${variant}/${crypto.randomUUID()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  async function addConcern(e: React.FormEvent) {
    e.preventDefault();

    if (!nameAr.trim() || !nameEn.trim()) return;

    if (!tileImageFile || !desktopBannerFile || !mobileBannerFile) {
      alert(
        "Please upload the homepage tile (800 × 800 px), desktop banner (1600 × 620 px), and mobile banner (800 × 400 px)."
      );
      return;
    }

    setLoading(true);

    try {
      await Promise.all([
        validateImageDimensions(
          tileImageFile,
          800,
          800,
          "Homepage tile"
        ),
        validateImageDimensions(
          desktopBannerFile,
          1600,
          620,
          "Desktop banner"
        ),
        validateImageDimensions(
          mobileBannerFile,
          800,
          400,
          "Mobile banner"
        ),
      ]);

      const [tileImageUrl, desktopBannerUrl, mobileBannerUrl] =
        await Promise.all([
          uploadConcernImage(tileImageFile, "tile"),
          uploadConcernImage(desktopBannerFile, "desktop"),
          uploadConcernImage(mobileBannerFile, "mobile"),
      ]);

      const { error } = await supabase.from("concerns").insert({
        name_ar: nameAr.trim(),
        name_en: nameEn.trim(),
        description_ar: descriptionAr.trim() || null,
        description_en: descriptionEn.trim() || null,
        image_url: tileImageUrl,
        banner_image_url: desktopBannerUrl,
        banner_image_url_mobile: mobileBannerUrl,
        sort_order: Number(sortOrder) || 0,
      });

      if (error) {
        alert(error.message);
        return;
      }

      setNameAr("");
      setNameEn("");
      setDescriptionAr("");
      setDescriptionEn("");
      setSortOrder("0");
      setTileImageFile(null);
      setDesktopBannerFile(null);
      setMobileBannerFile(null);
      await loadAll();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to add concern"
      );
    } finally {
      setLoading(false);
    }
  }

  function startEdit(concern: Concern) {
    setEditingId(concern.id);
    setEditNameAr(concern.name_ar);
    setEditNameEn(concern.name_en);
    setEditDescriptionAr(concern.description_ar || "");
    setEditDescriptionEn(concern.description_en || "");
    setEditSortOrder(String(concern.sort_order ?? 0));
    setEditTileImageFile(null);
    setEditDesktopBannerFile(null);
    setEditMobileBannerFile(null);
  }

  async function updateConcern() {
    if (!editingId) return;
    if (!editNameAr.trim() || !editNameEn.trim()) return;

    try {
      if (editTileImageFile) {
        await validateImageDimensions(
          editTileImageFile,
          800,
          800,
          "Homepage tile"
        );
      }

      if (editDesktopBannerFile) {
        await validateImageDimensions(
          editDesktopBannerFile,
          1600,
          620,
          "Desktop banner"
        );
      }

      if (editMobileBannerFile) {
        await validateImageDimensions(
          editMobileBannerFile,
          800,
          400,
          "Mobile banner"
        );
      }

      const [tileImageUrl, desktopBannerUrl, mobileBannerUrl] =
        await Promise.all([
          editTileImageFile
            ? uploadConcernImage(editTileImageFile, "tile")
            : Promise.resolve(undefined),
          editDesktopBannerFile
            ? uploadConcernImage(editDesktopBannerFile, "desktop")
            : Promise.resolve(undefined),
          editMobileBannerFile
            ? uploadConcernImage(editMobileBannerFile, "mobile")
            : Promise.resolve(undefined),
        ]);

      const { error } = await supabase
        .from("concerns")
        .update({
          name_ar: editNameAr.trim(),
          name_en: editNameEn.trim(),
          description_ar: editDescriptionAr.trim() || null,
          description_en: editDescriptionEn.trim() || null,
          sort_order: Number(editSortOrder) || 0,
          ...(tileImageUrl ? { image_url: tileImageUrl } : {}),
          ...(desktopBannerUrl
            ? { banner_image_url: desktopBannerUrl }
            : {}),
          ...(mobileBannerUrl
            ? { banner_image_url_mobile: mobileBannerUrl }
            : {}),
        })
        .eq("id", editingId);

      if (error) {
        alert(error.message);
        return;
      }

      setEditingId(null);
      await loadAll();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to update concern"
      );
    }
  }

  async function deleteConcern(id: number) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this concern?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from("concerns").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadAll();
  }

  function openManageProducts(concern: Concern) {
    setManagingId(concern.id);
    setManagingSelection(
      new Set(linksByConcern.get(concern.id) || [])
    );
    setProductSearch("");
  }

  function toggleProduct(productId: number) {
    setManagingSelection((current) => {
      const next = new Set(current);

      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }

      return next;
    });
  }

  async function saveProductAssignments() {
    if (!managingId) return;

    const existing = linksByConcern.get(managingId) || new Set<number>();

    const toAdd = [...managingSelection].filter(
      (id) => !existing.has(id)
    );

    const toRemove = [...existing].filter(
      (id) => !managingSelection.has(id)
    );

    if (toAdd.length > 0) {
      const { error } = await supabase.from("product_concerns").insert(
        toAdd.map((productId) => ({
          concern_id: managingId,
          product_id: productId,
        }))
      );

      if (error) {
        alert(error.message);
        return;
      }
    }

    if (toRemove.length > 0) {
      const { error } = await supabase
        .from("product_concerns")
        .delete()
        .eq("concern_id", managingId)
        .in("product_id", toRemove);

      if (error) {
        alert(error.message);
        return;
      }
    }

    setManagingId(null);
    await loadAll();
  }

  const filteredProducts = useMemo(() => {
    const cleanSearch = productSearch.trim().toLocaleLowerCase();

    if (!cleanSearch) return products;

    return products.filter((product) => {
      const label = `${product.name_ar || ""} ${product.name_en || ""} ${
        product.name || ""
      }`.toLocaleLowerCase();

      return label.includes(cleanSearch);
    });
  }, [products, productSearch]);

  const managingConcern = concerns.find(
    (concern) => concern.id === managingId
  );
  const editingConcern = concerns.find(
    (concern) => concern.id === editingId
  );

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto mb-8 flex max-w-5xl items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Concerns</h1>

        <Link
          href="/admin"
          className="hidden rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 lg:inline-flex"
        >
          ← Desktop Dashboard
        </Link>
      </div>

      <p className="mx-auto mb-6 max-w-5xl text-sm text-gray-600">
        Concerns power the &quot;Shop by need&quot; row on the homepage
        (e.g. Acne, Dandruff, or a broader need like Hair Care). Each
        concern has one independent homepage tile and two page banners.
        It appears on the homepage immediately; linked products only
        control what appears inside its page.
      </p>

      <form
        onSubmit={addConcern}
        className="mx-auto mb-8 max-w-5xl rounded-2xl bg-white p-6 shadow-sm"
      >
        <h2 className="mb-5 text-xl font-bold text-gray-900">Add Concern</h2>

        <input
          type="text"
          placeholder="Concern name Arabic (e.g. حب الشباب)"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          dir="rtl"
          required
          className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
        />

        <input
          type="text"
          placeholder="Concern name English (e.g. Acne)"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          dir="ltr"
          required
          className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
        />

        <textarea
          placeholder="Description Arabic (shown on the concern page, optional)"
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
          dir="rtl"
          rows={3}
          className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
        />

        <textarea
          placeholder="Description English (shown on the concern page, optional)"
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          dir="ltr"
          rows={3}
          className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
        />

        <input
          type="number"
          placeholder="Sort order (0 = first)"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
        />

        <div className="mb-5 grid gap-4 lg:grid-cols-3">
          <ConcernImageField
            title="Homepage tile"
            description="Independent square image shown in Shop by Need on the customer homepage."
            dimensions="800 × 800 px"
            file={tileImageFile}
            required
            onChange={setTileImageFile}
          />

          <ConcernImageField
            title="Desktop page banner"
            description="Full-width hero used only inside this concern page."
            dimensions="1600 × 620 px"
            file={desktopBannerFile}
            required
            onChange={setDesktopBannerFile}
          />

          <ConcernImageField
            title="Mobile page banner"
            description="Dedicated hero used only inside this concern page on phones."
            dimensions="800 × 400 px"
            file={mobileBannerFile}
            required
            onChange={setMobileBannerFile}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "Adding..." : "Add Concern"}
        </button>
      </form>

      <div className="mx-auto max-w-5xl space-y-4">
        {concerns.map((concern) => {
          const linkedCount = linksByConcern.get(concern.id)?.size || 0;

          return (
            <div
              key={concern.id}
              className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="grid shrink-0 grid-cols-3 gap-1">
                  <div className="h-14 w-14 overflow-hidden rounded-lg bg-gray-100">
                    {concern.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={concern.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="h-14 w-20 overflow-hidden rounded-lg bg-gray-100">
                    {concern.banner_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={concern.banner_image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="h-14 w-14 overflow-hidden rounded-lg bg-gray-100">
                    {concern.banner_image_url_mobile ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={concern.banner_image_url_mobile}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Concern · order {concern.sort_order}
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-gray-900">
                    {concern.name_en}
                  </h2>

                  <p dir="rtl" className="mt-1 text-sm text-gray-600">
                    {concern.name_ar}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    {linkedCount} product{linkedCount === 1 ? "" : "s"} linked
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => openManageProducts(concern)}
                  className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white transition hover:bg-emerald-800"
                >
                  Manage products
                </button>

                <button
                  onClick={() => startEdit(concern)}
                  className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white transition hover:bg-blue-700"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteConcern(concern.id)}
                  className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white transition hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}

        {concerns.length === 0 && (
          <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            No concerns yet. Add your first one above.
          </p>
        )}
      </div>

      {editingId && editingConcern && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-8 sm:px-6">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Edit Concern
            </h2>

            <input
              value={editNameAr}
              onChange={(e) => setEditNameAr(e.target.value)}
              placeholder="Concern name Arabic"
              dir="rtl"
              className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
            />

            <input
              value={editNameEn}
              onChange={(e) => setEditNameEn(e.target.value)}
              placeholder="Concern name English"
              dir="ltr"
              className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
            />

            <textarea
              value={editDescriptionAr}
              onChange={(e) => setEditDescriptionAr(e.target.value)}
              placeholder="Description Arabic"
              dir="rtl"
              rows={3}
              className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
            />

            <textarea
              value={editDescriptionEn}
              onChange={(e) => setEditDescriptionEn(e.target.value)}
              placeholder="Description English"
              dir="ltr"
              rows={3}
              className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
            />

            <input
              type="number"
              value={editSortOrder}
              onChange={(e) => setEditSortOrder(e.target.value)}
              placeholder="Sort order"
              className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
            />

            <div className="mb-5 grid gap-4 lg:grid-cols-3">
              <ConcernImageField
                title="Replace homepage tile"
                description="Leave empty to keep the current independent homepage image."
                dimensions="800 × 800 px"
                file={editTileImageFile}
                currentUrl={editingConcern.image_url}
                onChange={setEditTileImageFile}
              />

              <ConcernImageField
                title="Replace desktop banner"
                description="Leave empty to keep the current page banner."
                dimensions="1600 × 620 px"
                file={editDesktopBannerFile}
                currentUrl={
                  editingConcern.banner_image_url ||
                  editingConcern.image_url
                }
                onChange={setEditDesktopBannerFile}
              />

              <ConcernImageField
                title="Replace mobile banner"
                description="Leave empty to keep the current page banner."
                dimensions="800 × 400 px"
                file={editMobileBannerFile}
                currentUrl={
                  editingConcern.banner_image_url_mobile ||
                  editingConcern.banner_image_url ||
                  editingConcern.image_url
                }
                onChange={setEditMobileBannerFile}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={updateConcern}
                className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white transition hover:bg-green-700"
              >
                Save
              </button>

              <button
                onClick={() => setEditingId(null)}
                className="rounded-xl bg-gray-200 px-4 py-2 font-bold text-gray-800 transition hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {managingId && managingConcern && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-6">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-1 text-xl font-bold text-gray-900">
              Products for &quot;{managingConcern.name_en}&quot;
            </h2>

            <p className="mb-4 text-sm text-gray-500">
              {managingSelection.size} selected
            </p>

            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-3 text-black shadow-sm outline-none transition focus:border-green-600"
            />

            <div className="mb-4 flex-1 overflow-y-auto rounded-xl border border-gray-100">
              {filteredProducts.map((product) => {
                const label =
                  product.name_en || product.name_ar || product.name || `#${product.id}`;

                return (
                  <label
                    key={product.id}
                    className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm text-gray-800 last:border-b-0 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={managingSelection.has(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      className="h-4 w-4"
                    />

                    {label}
                  </label>
                );
              })}

              {filteredProducts.length === 0 && (
                <p className="p-4 text-sm text-gray-400">No products found.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveProductAssignments}
                className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white transition hover:bg-green-700"
              >
                Save
              </button>

              <button
                onClick={() => setManagingId(null)}
                className="rounded-xl bg-gray-200 px-4 py-2 font-bold text-gray-800 transition hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

