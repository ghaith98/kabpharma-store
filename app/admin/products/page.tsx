"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type VariantInput = {
  label_ar: string;
  label_en: string;
  price: string;
  imageFiles: File[];
  existingImageUrls?: string[];
};

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [productImages, setProductImages] = useState<any[]>([]);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [productVariantImages, setProductVariantImages] = useState<any[]>([]);

  const [categoryId, setCategoryId] = useState("");

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [ingredientsAr, setIngredientsAr] = useState("");
  const [ingredientsEn, setIngredientsEn] = useState("");

  const [price, setPrice] = useState("");
  const [salePercent, setSalePercent] = useState("0");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [variants, setVariants] = useState<VariantInput[]>([]);

  const [loading, setLoading] = useState(false);

  const [updatingFeaturedId, setUpdatingFeaturedId] = useState<number | null>(
    null
  );

  const [updatingNewArrivalId, setUpdatingNewArrivalId] = useState<
    number | null
  >(null);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [editNameAr, setEditNameAr] = useState("");
  const [editNameEn, setEditNameEn] = useState("");
  const [editDescriptionAr, setEditDescriptionAr] = useState("");
  const [editDescriptionEn, setEditDescriptionEn] = useState("");
  const [editIngredientsAr, setEditIngredientsAr] = useState("");
  const [editIngredientsEn, setEditIngredientsEn] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editSalePercent, setEditSalePercent] = useState("0");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  const [editVariants, setEditVariants] = useState<VariantInput[]>([]);

  const [uploadingImageProductId, setUploadingImageProductId] = useState<
    number | null
  >(null);

  async function checkAdmin() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/admin/login");
      return;
    }

    await loadProducts();
    await loadCategories();
    await loadProductImages();
    await loadProductVariants();
    await loadProductVariantImages();
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

  async function loadCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      alert(error.message);
      return;
    }

    setCategories(data || []);
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

  async function loadProductVariants() {
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setProductVariants(data || []);
  }

  async function loadProductVariantImages() {
    const { data, error } = await supabase
      .from("product_variant_images")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setProductVariantImages(data || []);
  }

  async function uploadProductImage(file: File) {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}-${safeFileName}`;

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

  function addVariantRow() {
    setVariants([
      ...variants,
      {
        label_ar: "",
        label_en: "",
        price: "",
        imageFiles: [],
      },
    ]);
  }

  function updateVariantRow(
    index: number,
    field: "label_ar" | "label_en" | "price",
    value: string
  ) {
    const copy = [...variants];
    copy[index] = { ...copy[index], [field]: value };
    setVariants(copy);
  }

  function updateVariantImages(index: number, files: FileList | null) {
    const selectedFiles = Array.from(files || []);

    if (selectedFiles.length > 3) {
      alert("Maximum 3 images per option");
      return;
    }

    const copy = [...variants];
    copy[index] = {
      ...copy[index],
      imageFiles: selectedFiles,
    };

    setVariants(copy);
  }

  function removeVariantRow(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  function addEditVariantRow() {
    setEditVariants([
      ...editVariants,
      {
        label_ar: "",
        label_en: "",
        price: "",
        imageFiles: [],
        existingImageUrls: [],
      },
    ]);
  }

  function updateEditVariantRow(
    index: number,
    field: "label_ar" | "label_en" | "price",
    value: string
  ) {
    const copy = [...editVariants];
    copy[index] = { ...copy[index], [field]: value };
    setEditVariants(copy);
  }

  function updateEditVariantImages(index: number, files: FileList | null) {
    const selectedFiles = Array.from(files || []);
    const existingCount = editVariants[index].existingImageUrls?.length || 0;

    if (existingCount + selectedFiles.length > 3) {
      alert("Maximum 3 images per option");
      return;
    }

    const copy = [...editVariants];
    copy[index] = {
      ...copy[index],
      imageFiles: selectedFiles,
    };

    setEditVariants(copy);
  }

  function removeExistingEditVariantImage(variantIndex: number, imageUrl: string) {
    const copy = [...editVariants];

    copy[variantIndex] = {
      ...copy[variantIndex],
      existingImageUrls: (copy[variantIndex].existingImageUrls || []).filter(
        (url) => url !== imageUrl
      ),
    };

    setEditVariants(copy);
  }

  function removeEditVariantRow(index: number) {
    setEditVariants(editVariants.filter((_, i) => i !== index));
  }

  function getVariantsForProduct(productId: number) {
    return productVariants.filter((variant) => variant.product_id === productId);
  }

  function getImagesForVariant(variant: any) {
    const images = productVariantImages
      .filter((img) => img.variant_id === variant.id)
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map((img) => img.image_url);

    if (images.length > 0) return images.slice(0, 3);
    if (variant.image_url) return [variant.image_url];

    return [];
  }

  async function addProduct(e: FormEvent) {
    e.preventDefault();

    const cleanedVariants = variants.filter(
      (v) =>
        v.label_ar.trim() ||
        v.label_en.trim() ||
        v.price.trim() ||
        v.imageFiles.length > 0
    );

    const invalidVariant = cleanedVariants.some(
      (v) =>
        !v.label_ar.trim() ||
        !v.label_en.trim() ||
        !v.price.trim() ||
        v.imageFiles.length === 0 ||
        v.imageFiles.length > 3
    );

    if (invalidVariant) {
      alert(
        "Please fill Arabic option, English option, price and 1-3 images for every option"
      );
      return;
    }

    if (cleanedVariants.length === 0 && !price.trim()) {
      alert("Please enter base price or add product options");
      return;
    }

    if (cleanedVariants.length === 0 && !imageFile) {
      alert("Please upload product image");
      return;
    }

    setLoading(true);

    try {
      let productImageUrl = "";
      let basePrice = Number(price);
      const uploadedVariants: any[] = [];

      if (cleanedVariants.length > 0) {
        for (let index = 0; index < cleanedVariants.length; index++) {
          const variant = cleanedVariants[index];

          const imageUrls: string[] = [];

          for (const file of variant.imageFiles.slice(0, 3)) {
            const imageUrl = await uploadProductImage(file);
            imageUrls.push(imageUrl);
          }

          uploadedVariants.push({
            label_ar: variant.label_ar.trim(),
            label_en: variant.label_en.trim(),
            price: Number(variant.price),
            image_url: imageUrls[0],
            image_urls: imageUrls,
            sort_order: index,
          });
        }

        const cheapestVariant = [...uploadedVariants].sort(
          (a, b) => Number(a.price) - Number(b.price)
        )[0];

        basePrice = Number(cheapestVariant.price);
        productImageUrl = cheapestVariant.image_url;
      } else {
        productImageUrl = await uploadProductImage(imageFile!);
        basePrice = Number(price);
      }

      const { data: insertedProduct, error } = await supabase
        .from("products")
        .insert({
          name: nameEn || nameAr,
          description: descriptionEn || descriptionAr,
          ingredients: ingredientsEn || ingredientsAr,

          name_ar: nameAr,
          name_en: nameEn,
          description_ar: descriptionAr,
          description_en: descriptionEn,
          ingredients_ar: ingredientsAr,
          ingredients_en: ingredientsEn,

          price: basePrice,
          sale_percent: Number(salePercent),
          image_url: productImageUrl,
          category_id: Number(categoryId),
          featured: false,
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (uploadedVariants.length > 0 && insertedProduct) {
        for (const variant of uploadedVariants) {
          const { data: insertedVariant, error: variantError } = await supabase
            .from("product_variants")
            .insert({
              product_id: insertedProduct.id,
              label_ar: variant.label_ar,
              label_en: variant.label_en,
              price: variant.price,
              image_url: variant.image_url,
              sort_order: variant.sort_order,
            })
            .select("id")
            .single();

          if (variantError) {
            throw new Error(variantError.message);
          }

          const { error: imagesError } = await supabase
            .from("product_variant_images")
            .insert(
              variant.image_urls
                .slice(0, 3)
                .map((imageUrl: string, index: number) => ({
                  product_id: insertedProduct.id,
                  variant_id: insertedVariant.id,
                  image_url: imageUrl,
                  sort_order: index,
                }))
            );

          if (imagesError) {
            throw new Error(imagesError.message);
          }
        }
      }

      setNameAr("");
      setNameEn("");
      setDescriptionAr("");
      setDescriptionEn("");
      setIngredientsAr("");
      setIngredientsEn("");
      setPrice("");
      setSalePercent("0");
      setCategoryId("");
      setImageFile(null);
      setVariants([]);

      await loadProducts();
      await loadProductVariants();
      await loadProductVariantImages();
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(product: any) {
    setEditingId(product.id);

    setEditNameAr(product.name_ar || "");
    setEditNameEn(product.name_en || product.name || "");

    setEditDescriptionAr(product.description_ar || "");
    setEditDescriptionEn(product.description_en || product.description || "");

    setEditIngredientsAr(product.ingredients_ar || "");
    setEditIngredientsEn(product.ingredients_en || product.ingredients || "");

    setEditCategoryId(String(product.category_id || ""));
    setEditPrice(String(product.price || ""));
    setEditSalePercent(String(product.sale_percent || 0));
    setEditImageFile(null);

    const existingVariants = getVariantsForProduct(product.id).map((variant) => {
      const imagesForVariant = getImagesForVariant(variant);

      return {
        label_ar: variant.label_ar || "",
        label_en: variant.label_en || "",
        price: String(variant.price || ""),
        imageFiles: [],
        existingImageUrls: imagesForVariant,
      };
    });

    setEditVariants(existingVariants);
  }

  async function updateProduct() {
    if (!editingId) return;

    const cleanedEditVariants = editVariants.filter(
      (v) =>
        v.label_ar.trim() ||
        v.label_en.trim() ||
        v.price.trim() ||
        v.imageFiles.length > 0 ||
        (v.existingImageUrls || []).length > 0
    );

    const invalidEditVariant = cleanedEditVariants.some(
      (v) =>
        !v.label_ar.trim() ||
        !v.label_en.trim() ||
        !v.price.trim() ||
        v.imageFiles.length + (v.existingImageUrls || []).length === 0 ||
        v.imageFiles.length + (v.existingImageUrls || []).length > 3
    );

    if (invalidEditVariant) {
      alert(
        "Please fill Arabic option, English option, price and 1-3 images for every option"
      );
      return;
    }

    if (cleanedEditVariants.length === 0 && !editPrice.trim()) {
      alert("Please enter base price or add product options");
      return;
    }

    try {
      let normalProductImageUrl: string | undefined;

      if (editImageFile) {
        normalProductImageUrl = await uploadProductImage(editImageFile);
      }

      const uploadedEditVariants: any[] = [];

      if (cleanedEditVariants.length > 0) {
        for (let index = 0; index < cleanedEditVariants.length; index++) {
          const variant = cleanedEditVariants[index];

          const imageUrls: string[] = [...(variant.existingImageUrls || [])];

          for (const file of variant.imageFiles) {
            const imageUrl = await uploadProductImage(file);
            imageUrls.push(imageUrl);
          }

          const finalImageUrls = imageUrls.slice(0, 3);

          uploadedEditVariants.push({
            label_ar: variant.label_ar.trim(),
            label_en: variant.label_en.trim(),
            price: Number(variant.price),
            image_url: finalImageUrls[0],
            image_urls: finalImageUrls,
            sort_order: index,
          });
        }
      }

      let finalBasePrice = Number(editPrice);
      let finalProductImageUrl: string | undefined = normalProductImageUrl;

      if (uploadedEditVariants.length > 0) {
        const cheapestVariant = [...uploadedEditVariants].sort(
          (a, b) => Number(a.price) - Number(b.price)
        )[0];

        finalBasePrice = Number(cheapestVariant.price);
        finalProductImageUrl = cheapestVariant.image_url;
      }

      const updateData: any = {
        name: editNameEn || editNameAr,
        description: editDescriptionEn || editDescriptionAr,
        ingredients: editIngredientsEn || editIngredientsAr,

        name_ar: editNameAr,
        name_en: editNameEn,
        description_ar: editDescriptionAr,
        description_en: editDescriptionEn,
        ingredients_ar: editIngredientsAr,
        ingredients_en: editIngredientsEn,

        category_id: Number(editCategoryId),
        price: finalBasePrice,
        sale_percent: Number(editSalePercent),
      };

      if (finalProductImageUrl) {
        updateData.image_url = finalProductImageUrl;
      }

      const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", editingId);

      if (error) {
        throw new Error(error.message);
      }

      const { error: deleteVariantsError } = await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", editingId);

      if (deleteVariantsError) {
        throw new Error(deleteVariantsError.message);
      }

      if (uploadedEditVariants.length > 0) {
        for (const variant of uploadedEditVariants) {
          const { data: insertedVariant, error: insertVariantError } =
            await supabase
              .from("product_variants")
              .insert({
                product_id: editingId,
                label_ar: variant.label_ar,
                label_en: variant.label_en,
                price: variant.price,
                image_url: variant.image_url,
                sort_order: variant.sort_order,
              })
              .select("id")
              .single();

          if (insertVariantError) {
            throw new Error(insertVariantError.message);
          }

          const { error: insertImagesError } = await supabase
            .from("product_variant_images")
            .insert(
              variant.image_urls
                .slice(0, 3)
                .map((imageUrl: string, index: number) => ({
                  product_id: editingId,
                  variant_id: insertedVariant.id,
                  image_url: imageUrl,
                  sort_order: index,
                }))
            );

          if (insertImagesError) {
            throw new Error(insertImagesError.message);
          }
        }
      }

      setEditingId(null);
      setEditImageFile(null);
      setEditVariants([]);

      await loadProducts();
      await loadProductVariants();
      await loadProductVariantImages();
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    }
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

    await loadProducts();
  }

  async function deleteProduct(id: number) {
    const confirmDelete = confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadProducts();
    await loadProductVariants();
    await loadProductVariantImages();
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

    try {
      const imageUrl = await uploadProductImage(file);

      const { error } = await supabase.from("product_images").insert({
        product_id: productId,
        image_url: imageUrl,
        sort_order: currentImages.length,
      });

      if (error) {
        throw new Error(error.message);
      }

      await loadProductImages();
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setUploadingImageProductId(null);
    }
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

    await loadProductImages();
  }

  useEffect(() => {
    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="mb-6 flex gap-2">
            <a
              href="/admin"
              className="hidden rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 lg:inline-flex"
            >
              ← Desktop Dashboard
            </a>

            <a
              href="/admin-mobile"
              className="inline-flex rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 lg:hidden"
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
              placeholder="Product Name Arabic"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              dir="rtl"
              required
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
            />

            <input
              type="text"
              placeholder="Product Name English"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              dir="ltr"
              required
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
            />

            <input
              type="number"
              placeholder="Base Price - only if no options"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
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

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:col-span-2">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-gray-900">
                    Product Options
                  </h3>
                  <p className="text-sm text-gray-500">
                    Example: 50g / 100g. Each option has its own price and up to
                    3 images. First image is the main image.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addVariantRow}
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-green-700"
                >
                  Add Option
                </button>
              </div>

              <div className="space-y-3">
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-2xl bg-white p-3 md:grid-cols-[1fr_1fr_150px_1fr_auto]"
                  >
                    <input
                      type="text"
                      placeholder="Arabic Option, e.g. ٥٠ غ"
                      value={variant.label_ar}
                      onChange={(e) =>
                        updateVariantRow(index, "label_ar", e.target.value)
                      }
                      dir="rtl"
                      className="rounded-xl border border-gray-200 bg-white p-3 text-black outline-none focus:border-green-600"
                    />

                    <input
                      type="text"
                      placeholder="English Option, e.g. 50g"
                      value={variant.label_en}
                      onChange={(e) =>
                        updateVariantRow(index, "label_en", e.target.value)
                      }
                      dir="ltr"
                      className="rounded-xl border border-gray-200 bg-white p-3 text-black outline-none focus:border-green-600"
                    />

                    <input
                      type="number"
                      placeholder="Option Price"
                      value={variant.price}
                      onChange={(e) =>
                        updateVariantRow(index, "price", e.target.value)
                      }
                      className="rounded-xl border border-gray-200 bg-white p-3 text-black outline-none focus:border-green-600"
                    />

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => updateVariantImages(index, e.target.files)}
                      className="rounded-xl border border-gray-200 bg-white p-3 text-black file:mr-2 file:rounded-lg file:border-0 file:bg-green-600 file:px-3 file:py-1 file:text-sm file:font-bold file:text-white"
                    />

                    <button
                      type="button"
                      onClick={() => removeVariantRow(index)}
                      className="rounded-xl bg-red-600 px-4 py-2 font-extrabold text-white hover:bg-red-700"
                    >
                      ×
                    </button>

                    {variant.imageFiles.length > 0 && (
                      <p className="text-xs font-bold text-green-700 md:col-span-5">
                        {variant.imageFiles.length}/3 images selected
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <textarea
            placeholder="Description Arabic"
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            dir="rtl"
            required
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
          />

          <textarea
            placeholder="Description English"
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            dir="ltr"
            required
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
          />

          <textarea
            placeholder="Ingredients Arabic"
            value={ingredientsAr}
            onChange={(e) => setIngredientsAr(e.target.value)}
            dir="rtl"
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
          />

          <textarea
            placeholder="Ingredients English"
            value={ingredientsEn}
            onChange={(e) => setIngredientsEn(e.target.value)}
            dir="ltr"
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
          />

          <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 text-sm font-bold text-gray-600">
              Main Product Image — required only if there are no options.
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              required={variants.length === 0}
              className="w-full text-black file:mr-4 file:rounded-xl file:border-0 file:bg-green-600 file:px-4 file:py-2 file:font-bold file:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 rounded-2xl bg-green-600 px-6 py-4 font-extrabold text-white shadow-sm transition hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Uploading..." : "Add Product"}
          </button>
        </form>

        <div className="space-y-5">
          {products.map((product) => {
            const variantsForThisProduct = getVariantsForProduct(product.id);

            return (
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
                              type="button"
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
                        {product.name_en || product.name_ar || product.name}
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
                      {product.description_en ||
                        product.description_ar ||
                        product.description}
                    </p>

                    <p className="mt-3 text-xl font-extrabold text-green-700">
                      {Number(product.price).toLocaleString()} SYP
                    </p>

                    {variantsForThisProduct.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {variantsForThisProduct.map((variant) => {
                          const images = getImagesForVariant(variant);

                          return (
                            <div
                              key={variant.id}
                              className="rounded-2xl bg-gray-100 p-3"
                            >
                              <div className="flex items-center gap-2">
                                {images[0] && (
                                  <img
                                    src={images[0]}
                                    alt={variant.label_en}
                                    className="h-10 w-10 rounded-xl object-cover"
                                  />
                                )}

                                <span className="text-sm font-bold text-gray-700">
                                  {variant.label_en} / {variant.label_ar}:{" "}
                                  {Number(variant.price).toLocaleString()} SYP
                                </span>
                              </div>

                              {images.length > 1 && (
                                <div className="mt-2 flex gap-2">
                                  {images.slice(1).map((imageUrl) => (
                                    <img
                                      key={imageUrl}
                                      src={imageUrl}
                                      alt=""
                                      className="h-12 w-12 rounded-xl object-cover"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="rounded-2xl bg-blue-600 px-4 py-3 font-extrabold text-white transition hover:bg-blue-700"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
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
                        type="button"
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
                        type="button"
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
                        type="button"
                        onClick={() => deleteProduct(product.id)}
                        className="rounded-2xl bg-red-600 px-4 py-3 font-extrabold text-white transition hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editingId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-6">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-2xl font-extrabold text-gray-900">
              Edit Product
            </h2>

            <input
              value={editNameAr}
              onChange={(e) => setEditNameAr(e.target.value)}
              placeholder="Product Name Arabic"
              dir="rtl"
              className="mb-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
            />

            <input
              value={editNameEn}
              onChange={(e) => setEditNameEn(e.target.value)}
              placeholder="Product Name English"
              dir="ltr"
              className="mb-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
            />

            <textarea
              value={editDescriptionAr}
              onChange={(e) => setEditDescriptionAr(e.target.value)}
              placeholder="Description Arabic"
              dir="rtl"
              className="mb-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
            />

            <textarea
              value={editDescriptionEn}
              onChange={(e) => setEditDescriptionEn(e.target.value)}
              placeholder="Description English"
              dir="ltr"
              className="mb-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
            />

            <textarea
              value={editIngredientsAr}
              onChange={(e) => setEditIngredientsAr(e.target.value)}
              placeholder="Ingredients Arabic"
              dir="rtl"
              className="mb-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
            />

            <textarea
              value={editIngredientsEn}
              onChange={(e) => setEditIngredientsEn(e.target.value)}
              placeholder="Ingredients English"
              dir="ltr"
              className="mb-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600 focus:bg-white"
            />

            <input
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              placeholder="Base Price - only if no options"
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

            <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-gray-900">
                    Product Options
                  </h3>
                  <p className="text-sm text-gray-500">
                    Max 3 images per option. First image is the main image.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addEditVariantRow}
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-green-700"
                >
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {editVariants.map((variant, index) => (
                  <div key={index} className="rounded-xl bg-white p-3">
                    {(variant.existingImageUrls || []).length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {(variant.existingImageUrls || []).map((imageUrl) => (
                          <div key={imageUrl} className="relative">
                            <img
                              src={imageUrl}
                              alt={variant.label_en}
                              className="h-20 w-20 rounded-2xl object-cover"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                removeExistingEditVariantImage(index, imageUrl)
                              }
                              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      value={variant.label_ar}
                      onChange={(e) =>
                        updateEditVariantRow(index, "label_ar", e.target.value)
                      }
                      placeholder="Arabic Option, e.g. ٥٠ غ"
                      dir="rtl"
                      className="mb-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-black outline-none focus:border-green-600"
                    />

                    <input
                      value={variant.label_en}
                      onChange={(e) =>
                        updateEditVariantRow(index, "label_en", e.target.value)
                      }
                      placeholder="English Option, e.g. 50g"
                      dir="ltr"
                      className="mb-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-black outline-none focus:border-green-600"
                    />

                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) =>
                        updateEditVariantRow(index, "price", e.target.value)
                      }
                      placeholder="Option Price"
                      className="mb-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-black outline-none focus:border-green-600"
                    />

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) =>
                        updateEditVariantImages(index, e.target.files)
                      }
                      className="mb-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-black file:mr-2 file:rounded-lg file:border-0 file:bg-green-600 file:px-3 file:py-1 file:text-sm file:font-bold file:text-white"
                    />

                    <p className="mb-2 text-xs font-bold text-gray-500">
                      {((variant.existingImageUrls || []).length +
                        variant.imageFiles.length)}
                      /3 images
                    </p>

                    <button
                      type="button"
                      onClick={() => removeEditVariantRow(index)}
                      className="rounded-xl bg-red-600 px-4 py-2 font-extrabold text-white hover:bg-red-700"
                    >
                      Remove Option
                    </button>
                  </div>
                ))}
              </div>
            </div>

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

            <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-sm font-bold text-gray-600">
                Main image — used only if product has no options.
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                className="w-full text-black file:mr-4 file:rounded-xl file:border-0 file:bg-green-600 file:px-4 file:py-2 file:font-bold file:text-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={updateProduct}
                className="flex-1 rounded-2xl bg-green-600 px-4 py-3 font-extrabold text-white transition hover:bg-green-700"
              >
                Save
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setEditImageFile(null);
                  setEditVariants([]);
                }}
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