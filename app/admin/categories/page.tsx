"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Category = {
  id: number;
  name: string;
  name_ar?: string | null;
  name_en?: string | null;
};

export default function AdminCategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNameAr, setEditNameAr] = useState("");
  const [editNameEn, setEditNameEn] = useState("");

  const [loading, setLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setCategories(data || []);
  }, []);

  const checkAdmin = useCallback(async () => {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/admin/login");
      return;
    }

    await loadCategories();
  }, [loadCategories, router]);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();

    if (!nameAr.trim() && !nameEn.trim()) return;

    setLoading(true);

    const { error } = await supabase.from("categories").insert({
      name: nameEn.trim() || nameAr.trim(),
      name_ar: nameAr.trim(),
      name_en: nameEn.trim(),
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setNameAr("");
    setNameEn("");
    setLoading(false);
    loadCategories();
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditNameAr(category.name_ar || "");
    setEditNameEn(category.name_en || category.name || "");
  }

  async function updateCategory() {
    if (!editingId) return;
    if (!editNameAr.trim() && !editNameEn.trim()) return;

    const { error } = await supabase
      .from("categories")
      .update({
        name: editNameEn.trim() || editNameAr.trim(),
        name_ar: editNameAr.trim(),
        name_en: editNameEn.trim(),
      })
      .eq("id", editingId);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingId(null);
    setEditNameAr("");
    setEditNameEn("");
    loadCategories();
  }

  async function deleteCategory(id: number) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadCategories();
  }

  useEffect(() => {
    window.queueMicrotask(() => {
      void checkAdmin();
    });
  }, [checkAdmin]);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto mb-8 flex max-w-5xl items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>

        <div className="mb-6 flex gap-2">
          <Link
            href="/admin"
            className="hidden rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 lg:inline-flex"
          >
            ← Desktop Dashboard
          </Link>

          <Link
            href="/admin-mobile"
            className="inline-flex rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 lg:hidden"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      <form
        onSubmit={addCategory}
        className="mx-auto mb-8 max-w-5xl rounded-2xl bg-white p-6 shadow-sm"
      >
        <h2 className="mb-5 text-xl font-bold text-gray-900">Add Category</h2>

        <input
          type="text"
          placeholder="Category name Arabic"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          dir="rtl"
          required
          className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
        />

        <input
          type="text"
          placeholder="Category name English"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          dir="ltr"
          required
          className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "Adding..." : "Add Category"}
        </button>
      </form>

      <div className="mx-auto max-w-5xl space-y-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Category
              </p>

              <h2 className="mt-1 text-xl font-bold text-gray-900">
                {category.name_en || category.name_ar || category.name}
              </h2>

              <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                <p dir="rtl">
                  Arabic: {category.name_ar || "-"}
                </p>
                <p>
                  English: {category.name_en || "-"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => startEdit(category)}
                className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white transition hover:bg-blue-700"
              >
                Edit
              </button>

              <button
                onClick={() => deleteCategory(category.id)}
                className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Edit Category
            </h2>

            <input
              value={editNameAr}
              onChange={(e) => setEditNameAr(e.target.value)}
              placeholder="Category name Arabic"
              dir="rtl"
              className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
            />

            <input
              value={editNameEn}
              onChange={(e) => setEditNameEn(e.target.value)}
              placeholder="Category name English"
              dir="ltr"
              className="mb-4 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
            />

            <div className="flex flex-wrap gap-3">
              <button
                onClick={updateCategory}
                className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white transition hover:bg-green-700"
              >
                Save
              </button>

              <button
                onClick={() => setEditingId(null)}
                className="rounded-xl bg-gray-400 px-4 py-2 font-bold text-white transition hover:bg-gray-500"
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
