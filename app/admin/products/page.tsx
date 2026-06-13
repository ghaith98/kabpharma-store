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
  const [ingredients, setIngredients] = useState("");
  const [price, setPrice] = useState("");
  const [salePercent, setSalePercent] = useState("0");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingFeaturedId, setUpdatingFeaturedId] = useState<number | null>(
    null
  );
  const [updatingNewArrivalId, setUpdatingNewArrivalId] =
  useState<number | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIngredients, setEditIngredients] = useState("");
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
  ingredients,
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
    setIngredients("");
    setPrice("");
    setSalePercent("0");
    setCategoryId("");
    setImageFile(null);
    setLoading(false);

    loadProducts();
  }

  function startEdit(product: any) {
    setEditIngredients(product.ingredients || "");
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
  ingredients: editIngredients,
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
  async function toggleNewArrival(product: any) {
  setUpdatingNewArrivalId(product.id);

  const { error } = await supabase
    .from("products")
    .update({
      is_new_arrival: !product.is_new_arrival,
    })
    .eq("id", product.id);

  if (error) {
    alert(error.message);
    setUpdatingNewArrivalId(null);
    return;
  }

  await loadProducts();
  setUpdatingNewArrivalId(null);
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
  <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-10">
    <div className="mx-auto max-w-6xl">
      <section className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100">
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

        <h1 className="mt-5 text-4xl font-extrabold text-gray-900">
          Products
        </h1>

        <p className="mt-2 text-gray-600">
          Add, edit, organize and manage all store products.
        </p>
      </section>

      <form
        onSubmit={addProduct}
        className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100"
      >
        <h2 className="mb-5 text-2xl font-extrabold text-gray-900">
          Add Product
        </h2>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
          />

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
          />

          <input
            type="number"
            placeholder="Sale %"
            value={salePercent}
            onChange={(e) => setSalePercent(e.target.value)}
            min="0"
            max="100"
            className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
          />

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
          >
            <option value="">Select Category</option>

            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="mt-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
        />

        <textarea
          placeholder="Ingredients"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          className="mt-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          required
          className="mt-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black file:mr-4 file:rounded-xl file:border-0 file:bg-green-600 file:px-4 file:py-2 file:font-bold file:text-white"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-5 rounded-2xl bg-green-600 px-6 py-4 font-extrabold text-white shadow-sm transition hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "Uploading..." : "Add Product"}
        </button>
      </form>

      <div className="space-y-5">
        {products.map((product) => (
          <div
            key={product.id}
            className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100"
          >
            <div className="grid gap-6 md:grid-cols-[180px_1fr]">
              <div>
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-44 w-full rounded-3xl bg-gray-50 object-cover"
                  />
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {productImages
                    .filter((img) => img.product_id === product.id)
                    .map((img) => (
                      <div key={img.id} className="relative">
                        <img
                          src={img.image_url}
                          alt=""
                          className="h-20 w-20 rounded-2xl object-cover"
                        />

                        <button
                          onClick={() => deleteExtraImage(img.id)}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>

                <label className="mt-4 inline-block cursor-pointer rounded-2xl bg-gray-100 px-4 py-3 text-sm font-extrabold text-gray-700 transition hover:bg-gray-200">
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
                  <p className="mt-3 text-sm font-bold text-green-700">
                    Uploading...
                  </p>
                )}
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-gray-900">
                    {product.name}
                  </h2>

                  {product.featured && (
                    <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-extrabold text-yellow-700">
                      ⭐ Featured
                    </span>
                  )}

                  {product.is_new_arrival && (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold text-green-700">
                      🆕 New Arrival
                    </span>
                  )}

                  {product.is_out_of_stock && (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-extrabold text-red-700">
                      Out of Stock
                    </span>
                  )}
                </div>

                <p className="leading-7 text-gray-600">
                  {product.description}
                </p>

                <p className="mt-3 text-xl font-extrabold text-green-700">
                  {Number(product.price).toLocaleString()} SYP
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => startEdit(product)}
                    className="rounded-2xl bg-blue-600 px-4 py-3 font-extrabold text-white transition hover:bg-blue-700"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => toggleStockStatus(product)}
                    className={`rounded-2xl px-4 py-3 font-extrabold text-white transition ${
                      product.is_out_of_stock
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    {product.is_out_of_stock
                      ? "Mark Available"
                      : "Mark Out of Stock"}
                  </button>

                  <button
                    onClick={() => toggleFeatured(product)}
                    disabled={updatingFeaturedId === product.id}
                    className={`rounded-2xl px-4 py-3 font-extrabold transition disabled:opacity-60 ${
                      product.featured
                        ? "bg-yellow-500 text-white hover:bg-yellow-600"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {updatingFeaturedId === product.id
                      ? "Updating..."
                      : product.featured
                      ? "Remove Featured"
                      : "Make Featured"}
                  </button>

                  <button
                    onClick={() => toggleNewArrival(product)}
                    disabled={updatingNewArrivalId === product.id}
                    className={`rounded-2xl px-4 py-3 font-extrabold transition ${
                      product.is_new_arrival
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {updatingNewArrivalId === product.id
                      ? "Updating..."
                      : product.is_new_arrival
                      ? "Remove New Arrival"
                      : "Make New Arrival"}
                  </button>

                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="rounded-2xl bg-red-600 px-4 py-3 font-extrabold text-white transition hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {editingId && (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-6">
        <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="mb-5 text-2xl font-extrabold text-gray-900">
            Edit Product
          </h2>

          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="mb-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
          />

          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="mb-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
          />

          <textarea
            value={editIngredients}
            onChange={(e) => setEditIngredients(e.target.value)}
            className="mb-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
          />

          <input
            type="number"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            className="mb-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
          />

          <input
            type="number"
            placeholder="Sale %"
            value={editSalePercent}
            onChange={(e) => setEditSalePercent(e.target.value)}
            min="0"
            max="100"
            className="mb-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
          />

          <select
            value={editCategoryId}
            onChange={(e) => setEditCategoryId(e.target.value)}
            className="mb-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
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
            className="mb-5 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black file:mr-4 file:rounded-xl file:border-0 file:bg-green-600 file:px-4 file:py-2 file:font-bold file:text-white"
          />

          <div className="flex gap-3">
            <button
              onClick={updateProduct}
              className="flex-1 rounded-2xl bg-green-600 px-4 py-3 font-extrabold text-white transition hover:bg-green-700"
            >
              Save
            </button>

            <button
              onClick={() => setEditingId(null)}
              className="flex-1 rounded-2xl bg-gray-200 px-4 py-3 font-extrabold text-gray-800 transition hover:bg-gray-300"
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