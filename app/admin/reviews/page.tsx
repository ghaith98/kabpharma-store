"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FaStar, FaTrash } from "react-icons/fa";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReviews() {
    const { data, error } = await supabase
      .from("product_reviews")
      .select(`
        *,
        products (
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (!error) {
      setReviews(data || []);
    }

    setLoading(false);
  }

  async function deleteReview(id: number) {
    const confirmDelete = confirm("Delete this review?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setReviews((prev) => prev.filter((review) => review.id !== id));
  }

  useEffect(() => {
    loadReviews();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl mb-6">
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
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Product Reviews
        </h1>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow">
            No reviews yet.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl bg-white p-6 shadow"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-green-700">
                      {review.products?.name || "Unknown product"}
                    </p>

                    <h2 className="mt-1 text-xl font-extrabold text-gray-900">
                      {review.customer_name}
                    </h2>

                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          className={
                            star <= review.rating
                              ? "text-yellow-400"
                              : "text-gray-200"
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteReview(review.id)}
                    className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 font-bold text-red-600 transition hover:bg-red-100"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>

                <p className="leading-7 text-gray-700">
                  {review.review}
                </p>

                <p className="mt-4 text-xs font-semibold text-gray-400">
                  {new Date(review.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}