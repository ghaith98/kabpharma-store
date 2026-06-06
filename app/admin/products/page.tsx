"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  async function checkAdmin() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/admin/login");
      return;
    }

    loadProducts();
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setProducts(data || []);
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();

    if (!imageFile) {
      alert("Please upload product image");
      return;
    }

    setLoading(true);

    const filePath = `${Date.now()}-${imageFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, imageFile);

    if (uploadError) {
      alert(uploadError.message);
      setLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    const { error } = await supabase.from("products").insert({
      name,
      description,
      price: Number(price),
      image_url: publicUrlData.publicUrl,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setName("");
    setDescription("");
    setPrice("");
    setImageFile(null);
    setLoading(false);

    loadProducts();
  }

  function startEdit(product: any) {
    setEditingId(product.id);
    setEditName(product.name);
    setEditDescription(product.description || "");
    setEditPrice(String(product.price));
  }

  async function updateProduct() {
  if (!editingId) return;

  let imageUrl: string | undefined;

  if (editImageFile) {
    const filePath = `${Date.now()}-${editImageFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, editImageFile);

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    imageUrl = publicUrlData.publicUrl;
  }

  const updateData: any = {
    name: editName,
    description: editDescription,
    price: Number(editPrice),
  };

  if (imageUrl) {
    updateData.image_url = imageUrl;
  }

  const { error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", editingId);

  if (error) {
    alert(error.message);
    return;
  }

  setEditingId(null);
  setEditImageFile(null);

  loadProducts();
}

  async function deleteProduct(id: number) {
    const confirmDelete = confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadProducts();
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-3xl font-bold">Admin Products</h1>

        <form onSubmit={addProduct} className="mb-8 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">Add Product</h2>

          <input
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mb-3 w-full rounded-xl border p-3"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="mb-3 w-full rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="mb-3 w-full rounded-xl border p-3"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            required
            className="mb-4 w-full rounded-xl border p-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-black px-5 py-3 text-white disabled:bg-gray-400"
          >
            {loading ? "Uploading..." : "Add Product"}
          </button>
        </form>

        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="rounded-2xl bg-white p-6 shadow">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="mb-4 h-40 w-40 rounded-xl object-cover"
                />
              )}

              <h2 className="text-xl font-bold">{product.name}</h2>
              <p className="text-gray-600">{product.description}</p>
              <p className="font-bold">
                {Number(product.price).toLocaleString()} SYP
              </p>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => startEdit(product)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-white"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteProduct(product.id)}
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
            <h2 className="mb-4 text-xl font-bold">Edit Product</h2>

            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mb-3 w-full rounded-xl border p-3"
            />

            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="mb-3 w-full rounded-xl border p-3"
            />

            <input
  type="number"
  value={editPrice}
  onChange={(e) => setEditPrice(e.target.value)}
  className="mb-4 w-full rounded-xl border p-3"
/>

<input
  type="file"
  accept="image/*"
  onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
  className="mb-4 w-full rounded-xl border p-3"
/>

            <div className="flex gap-3">
              <button
                onClick={updateProduct}
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