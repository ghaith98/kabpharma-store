    "use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { FaStar } from "react-icons/fa";

export default function ReviewsSection({
  productId,
  initialReviews,
}: {
  productId: number;
  initialReviews: any[];
}) {
  const [reviews, setReviews] = useState(initialReviews);

  const [name, setName] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);

  const [loading, setLoading] = useState(false);

  const reviewsPerPage = 5;
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(
    reviews.length / reviewsPerPage
  );

  const paginatedReviews = reviews.slice(
    (page - 1) * reviewsPerPage,
    page * reviewsPerPage
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !review) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("product_reviews")
      .insert({
        product_id: productId,
        customer_name: name,
        review,
        rating,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      alert("Something went wrong");
      return;
    }

    setReviews([data, ...reviews]);

    setName("");
    setReview("");
    setRating(5);

    setPage(1);
  }

  return (
    <section className="mt-12 rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-extrabold text-gray-900">
        Customer Reviews
      </h2>

      <form
        onSubmit={handleSubmit}
        className="mb-10 space-y-4"
      >
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600"
        />

        <textarea
          placeholder="Write your review..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600"
        />

        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
            >
              <FaStar
                className={
                  star <= rating
                    ? "text-yellow-400"
                    : "text-gray-300"
                }
              />
            </button>
          ))}
        </div>

        <button
          disabled={loading}
          className="rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>

      <div className="space-y-4">
        {paginatedReviews.map((review) => (
          <div
            key={review.id}
            className="rounded-2xl border border-gray-100 p-5"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {review.customer_name}
              </h3>

              <div className="flex gap-1">
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

            <p className="text-gray-600">
              {review.review}
            </p>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from(
            { length: totalPages },
            (_, i) => i + 1
          ).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-10 w-10 rounded-full font-bold ${
                page === p
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}