"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [salePercent, setSalePercent] = useState("0");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingFeaturedId, setUpdatingFeaturedId] = useState<number | null>(
    null
  );

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editSalePercent, setEditSalePercent] = useState("0");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [productImages, setProductImages] = useState<any[]>([]);
const [uploadingImageProductId, setUploadingImageProductId] =
  useState<number | null>(null);

  async function checkAdmin() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/admin/login");
      return;
    }
    await loadProducts();
await loadCategories();
await loadProductImages();
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
  async function loadProductImages() {
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    alert(error.message);
    return;
  }

  setProductImages(data || []);
}

  async function loadCategories() {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    setCategories(data || []);
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
sale_percent: Number(salePercent),
      image_url: publicUrlData.publicUrl,
      category_id: Number(categoryId),
      featured: false,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setName("");
    setDescription("");
    setPrice("");
    setSalePercent("0");
    setCategoryId("");
    setImageFile(null);
    setLoading(false);

    loadProducts();
  }

  function startEdit(product: any) {
    setEditCategoryId(String(product.category_id || ""));
    setEditingId(product.id);
    setEditName(product.name);
    setEditDescription(product.description || "");
    setEditPrice(String(product.price));
    setEditSalePercent(String(product.sale_percent || 0));
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
      category_id: Number(editCategoryId),
      price: Number(editPrice),
      sale_percent: Number(editSalePercent),
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

  async function toggleFeatured(product: any) {
    setUpdatingFeaturedId(product.id);

    const { error } = await supabase
      .from("products")
      .update({ featured: !product.featured })
      .eq("id", product.id);

    if (error) {
      alert(error.message);
      setUpdatingFeaturedId(null);
      return;
    }

    await loadProducts();
    setUpdatingFeaturedId(null);
  }
  async function toggleStockStatus(product: any) {
  const { error } = await supabase
    .from("products")
    .update({ is_out_of_stock: !product.is_out_of_stock })
    .eq("id", product.id);

  if (error) {
    alert(error.message);
    return;
  }

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
  async function uploadExtraImage(productId: number, file: File) {
  const currentImages = productImages.filter(
    (img) => img.product_id === productId
  );

  if (currentImages.length >= 5) {
    alert("Maximum 5 images per product");
    return;
  }

  setUploadingImageProductId(productId);

  const filePath = `${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filePath, file);

  if (uploadError) {
    alert(uploadError.message);
    setUploadingImageProductId(null);
    return;
  }

  const { data: publicUrlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    image_url: publicUrlData.publicUrl,
    sort_order: currentImages.length,
  });

  if (error) {
    alert(error.message);
    setUploadingImageProductId(null);
    return;
  }

  await loadProductImages();
  setUploadingImageProductId(null);
} 
async function deleteExtraImage(imageId: number) {
  const confirmDelete = confirm("Delete this image?");
  if (!confirmDelete) return;

  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (error) {
    alert(error.message);
    return;
  }

  loadProductImages();
}
  

  useEffect(() => {
    checkAdmin();
    
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Products</h1>

          <a
            href="/admin"
            className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Back to Dashboard
          </a>
        </div>

        <form
          onSubmit={addProduct}
          className="mb-8 rounded-2xl bg-white p-6 shadow"
        >
          <h2 className="mb-4 text-xl font-bold">Add Product</h2>
          

          <input
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mb-3 w-full rounded-xl border p-3 text-black"
          />
          

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="mb-3 w-full rounded-xl border p-3 text-black"
          />

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="mb-3 w-full rounded-xl border p-3 text-black"
          />
          <input
  type="number"
  placeholder="Sale %"
  value={salePercent}
  onChange={(e) => setSalePercent(e.target.value)}
  min="0"
  max="100"
  className="mb-3 w-full rounded-xl border p-3 text-black"
/>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="mb-3 w-full rounded-xl border p-3 text-black"
          >
            <option value="">Select Category</option>

            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

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
              <div className="mb-4 flex flex-wrap gap-2">
  {productImages
    .filter((img) => img.product_id === product.id)
    .map((img) => (
      <div key={img.id} className="relative">
        <img
          src={img.image_url}
          alt=""
          className="h-20 w-20 rounded-lg object-cover"
        />

        <button
          onClick={() => deleteExtraImage(img.id)}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white"
        >
          ×
        </button>
      </div>
    ))}
</div>

<label className="mb-4 inline-block cursor-pointer rounded-xl bg-gray-100 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-200">
  Add Extra Image

  <input
    type="file"
    accept="image/*"
    className="hidden"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadExtraImage(product.id, file);
      }
    }}
  />
</label>

{uploadingImageProductId === product.id && (
  <p className="mb-4 text-sm font-semibold text-green-700">
    Uploading...
  </p>
)}

              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold">{product.name}</h2>

                {product.featured && (
                  <span className="rounded-full bg-yellow-50 px-3 py-1 text-sm font-bold text-yellow-700">
                    ⭐ Featured
                  </span>
                )}
              </div>

              <p className="text-gray-600">{product.description}</p>
              <p className="font-bold">
                {Number(product.price).toLocaleString()} SYP
              </p>
              {product.is_out_of_stock && (
  <p className="mt-2 font-bold text-red-600">
    Out of Stock
  </p>
)}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => startEdit(product)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-white"
                >
                  Edit
                </button>
                <button
  onClick={() => toggleStockStatus(product)}
  className={`rounded-xl px-4 py-2 font-semibold text-white ${
    product.is_out_of_stock
      ? "bg-green-600 hover:bg-green-700"
      : "bg-orange-500 hover:bg-orange-600"
  }`}
>
  {product.is_out_of_stock ? "Mark Available" : "Mark Out of Stock"}
</button>

                <button
                  onClick={() => toggleFeatured(product)}
                  disabled={updatingFeaturedId === product.id}
                  className={`rounded-xl px-4 py-2 font-semibold transition disabled:opacity-60 ${
                    product.featured
                      ? "bg-yellow-500 text-white hover:bg-yellow-600"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  {updatingFeaturedId === product.id
                    ? "Updating..."
                    : product.featured
                    ? "Remove Featured"
                    : "Make Featured"}
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
              className="mb-3 w-full rounded-xl border p-3 text-black"
            />
            

            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="mb-3 w-full rounded-xl border p-3 text-black"
            />

           <input
  type="number"
  value={editPrice}
  onChange={(e) => setEditPrice(e.target.value)}
  className="mb-4 w-full rounded-xl border p-3 text-black"
/>

<input
  type="number"
  placeholder="Sale %"
  value={editSalePercent}
  onChange={(e) => setEditSalePercent(e.target.value)}
  min="0"
  max="100"
  className="mb-4 w-full rounded-xl border p-3 text-black"
/>

            <select
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
              className="mb-4 w-full rounded-xl border p-3 text-black"
            >
              <option value="">Select Category</option>

              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
              className="mb-4 w-full rounded-xl border p-3 text-black"
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