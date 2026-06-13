"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Category = {
  id: number;
  name: string;
};

export default function AdminCategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setCategories(data || []);
  }

  async function checkAdmin() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/admin/login");
      return;
    }

    loadCategories();
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) return;

    setLoading(true);

    const { error } = await supabase.from("categories").insert({
      name: name.trim(),
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setName("");
    setLoading(false);
    loadCategories();
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
  }

  async function updateCategory() {
    if (!editingId || !editName.trim()) return;

    const { error } = await supabase
      .from("categories")
      .update({ name: editName.trim() })
      .eq("id", editingId);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingId(null);
    setEditName("");
    loadCategories();
  }

  async function deleteCategory(id: number) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadCategories();
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  return (
  <main className="min-h-screen bg-gray-50 px-6 py-10">
    <div className="mx-auto mb-8 flex max-w-5xl items-center justify-between">
      <h1 className="text-3xl font-bold text-gray-900">Categories</h1>

      <div className="flex gap-3">
       <div className="mb-6 flex gap-2">
  {/* Desktop */}
  <a
    href="/admin"
    className="hidden lg:inline-flex rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
  >
    ← Desktop Dashboard
  </a>

  {/* Mobile */}
  <a
    href="/admin-mobile"
    className="inline-flex lg:hidden rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
  >
    ← Dashboard
  </a>
</div>
      </div>
    </div>

    <form
      onSubmit={addCategory}
      className="mx-auto mb-8 max-w-5xl rounded-2xl bg-white p-6 shadow-sm"
    >
      <h2 className="mb-5 text-xl font-bold text-gray-900">Add Category</h2>

      <input
        type="text"
        placeholder="Category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
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
              {category.name}
            </h2>
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
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
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