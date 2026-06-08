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
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Categories
          </h1>

          <a
            href="/admin"
            className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Back to Dashboard
          </a>
        </div>

        <form
          onSubmit={addCategory}
          className="mb-8 rounded-2xl bg-white p-6 shadow"
        >
          <h2 className="mb-4 text-xl font-bold">Add Category</h2>

          <input
            type="text"
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mb-4 w-full rounded-xl border p-3 text-black"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-black px-5 py-3 text-white disabled:bg-gray-400"
          >
            {loading ? "Adding..." : "Add Category"}
          </button>
        </form>

        <div className="space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-2xl bg-white p-5 shadow"
            >
              <h2 className="text-xl font-bold text-gray-900">
                {category.name}
              </h2>

              <div className="flex gap-3">
                <button
                  onClick={() => startEdit(category)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-white"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteCategory(category.id)}
                  className="rounded-xl bg-red-600 px-4 py-2 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Edit Category
            </h2>

            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mb-4 w-full rounded-xl border p-3 text-black"
            />

            <div className="flex gap-3">
              <button
                onClick={updateCategory}
                className="rounded-xl bg-green-600 px-4 py-2 text-white"
              >
                Save
              </button>

              <button
                onClick={() => setEditingId(null)}
                className="rounded-xl bg-gray-400 px-4 py-2 text-white"
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