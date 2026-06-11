        "use client";
        
        import { useState } from "react";
        import { addToCart } from "@/lib/cart";
        
        type Product = {
  id: number;
  name: string;
  price: number;
  original_price?: number;
  sale_percent?: number;
  image_url: string | null;
};
        
        export default function ProductDetailsAddToCart ({ product }: { product: Product }) {
        const [showModal, setShowModal] = useState(false);
        
        function handleAdd() {
            addToCart(product);
            window.dispatchEvent(new Event("cartUpdated"));
        
            setShowModal(true);
        }
        
        return (
            <>
            <button
                onClick={handleAdd}
                className="mt-5 w-full rounded-2xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700"
            >
                Add to Cart
            </button>
        
            {showModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-6">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
                    <div className="mb-4 text-5xl text-green-600">
                    ✓
                    </div>
        
                    <h2 className="text-2xl font-extrabold text-gray-900">
                    Added to Cart
                    </h2>
        
                    <p className="mt-3 text-gray-600">
                    {product.name} has been added successfully.
                    </p>
        
                    <div className="mt-6 flex flex-col gap-3">
                    <a
                        href="/cart"
                        className="rounded-2xl bg-green-600 py-3 font-bold text-white transition hover:bg-green-700"
                    >
                        Go to Cart
                    </a>
        
                    <button
                        onClick={() => setShowModal(false)}
                        className="rounded-2xl border border-gray-300 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
                    >
                        Continue Shopping
                    </button>
                    </div>
                </div>
                </div>
            )}
            </>
        );
        }