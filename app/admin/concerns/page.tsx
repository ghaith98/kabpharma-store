"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Concern = {
  id: number;
  name_ar: string;
  name_en: string;
  image_url: string | null;
  sort_order: number;
};

type ProductOption = {
  id: number;
  name: string | null;
  name_ar: string | null;
  name_en: string | null;
};

export default function AdminConcernsPage() {
  const router = useRouter();

  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [linksByConcern, setLinksByConcern] = useState<
    Map<number, Set<number>>
  >(new Map());

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNameAr, setEditNameAr] = useState("");
  const [editNameEn, setEditNameEn] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("0");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

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

  async function uploadConcernImage(file: File) {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = `concerns/${crypto.randomUUID()}-${safeFileName}`;

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

    setLoading(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        imageUrl = await uploadConcernImage(imageFile);
      }

      const { error } = await supabase.from("concerns").insert({
        name_ar: nameAr.trim(),
        name_en: nameEn.trim(),
        image_url: imageUrl,
        sort_order: Number(sortOrder) || 0,
      });

      if (error) {
        alert(error.message);
        return;
      }

      setNameAr("");
      setNameEn("");
      setSortOrder("0");
      setImageFile(null);
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
    setEditSortOrder(String(concern.sort_order ?? 0));
    setEditImageFile(null);
  }

  async function updateConcern() {
    if (!editingId) return;
    if (!editNameAr.trim() || !editNameEn.trim()) return;

    try {
      let imageUrl: string | undefined;

      if (editImageFile) {
        imageUrl = await uploadConcernImage(editImageFile);
      }

      const { error } = await supabase
        .from("concerns")
        .update({
          name_ar: editNameAr.trim(),
          name_en: editNameEn.trim(),
          sort_order: Number(editSortOrder) || 0,
          ...(imageUrl ? { image_url: imageUrl } : {}),
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
        concern needs a name in both languages, an image, and at least
        one linked product to appear on the homepage.
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

        <input
          type="number"
          placeholder="Sort order (0 = first)"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
        />

        <label className="mb-4 block text-sm font-semibold text-gray-700">
          Image
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="mt-2 block w-full text-sm text-gray-600"
          />
        </label>

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
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {concern.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={concern.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
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
                    {linkedCount === 0 && (
                      <span className="ml-1 font-semibold text-amber-600">
                        (hidden on homepage until you link products)
                      </span>
                    )}
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

      {editingId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
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

            <input
              type="number"
              value={editSortOrder}
              onChange={(e) => setEditSortOrder(e.target.value)}
              placeholder="Sort order"
              className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
            />

            <label className="mb-4 block text-sm font-semibold text-gray-700">
              Replace image (optional)
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setEditImageFile(e.target.files?.[0] || null)
                }
                className="mt-2 block w-full text-sm text-gray-600"
              />
            </label>

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
