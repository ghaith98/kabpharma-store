"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FaStar, FaTimes } from "react-icons/fa";

type Review = {
  id: number;
  product_id: number;
  customer_name: string;
  rating: number;
  review: string;
  created_at: string;
};

type KabUser = {
  full_name: string;
  phone: string;
};

export default function ReviewsSection({
  productId,
  initialReviews,
}: {
  productId: number;
  initialReviews: Review[];
}) {
  const sortedInitialReviews = [...initialReviews].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const [reviews, setReviews] = useState<Review[]>(sortedInitialReviews);
  const [user, setUser] = useState<KabUser | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [showName, setShowName] = useState(true);
  const [manualName, setManualName] = useState("");

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const reviewsPerPage = 5;

  useEffect(() => {
    const savedUser = localStorage.getItem("kab_user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("kab_user");
      }
    }
  }, []);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
        reviews.length
      : 0;

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const paginatedReviews = reviews.slice(
    (page - 1) * reviewsPerPage,
    page * reviewsPerPage
  );

  function getReviewerName() {
    if (!showName) return "Anonymous";

    if (user?.full_name) return user.full_name;

    if (manualName.trim()) return manualName.trim();

    return "Customer";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!reviewText.trim()) return;

    if (showName && !user?.full_name && !manualName.trim()) {
      alert("Please enter your name or uncheck Show my name.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("product_reviews")
      .insert({
        product_id: productId,
        customer_name: getReviewerName(),
        review: reviewText,
        rating,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      alert("Something went wrong");
      return;
    }

    const updatedReviews = [data, ...reviews].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    setReviews(updatedReviews);
    setReviewText("");
    setRating(5);
    setManualName("");
    setShowName(true);
    setModalOpen(false);
    setPage(1);
  }

  return (
    <section className="mt-12 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Customer Reviews
          </h2>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={
                    star <= Math.round(averageRating)
                      ? "text-yellow-400"
                      : "text-gray-200"
                  }
                />
              ))}
            </div>

            <p className="text-sm font-bold text-gray-700">
              {reviews.length > 0
                ? `${averageRating.toFixed(1)} / 5 · ${reviews.length} reviews`
                : "No reviews yet"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
        >
          Write a Review
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl bg-gray-50 p-6 text-center">
          <h3 className="font-extrabold text-gray-900">
            Be the first to review this product
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Share your experience with other customers.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedReviews.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-100 bg-white p-5"
            >
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-extrabold text-gray-900">
                    {item.customer_name}
                  </h3>

                  <p className="mt-1 text-xs font-semibold text-gray-500">
                    Verified customer
                  </p>
                </div>

                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={
                        star <= item.rating
                          ? "text-yellow-400"
                          : "text-gray-200"
                      }
                    />
                  ))}
                </div>
              </div>

              <p className="leading-7 text-gray-700">{item.review}</p>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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

      {modalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-gray-900">
                Write a Review
              </h3>

              <button
                onClick={() => setModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200"
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="mb-3 font-bold text-gray-900">Your Rating</p>

                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-2xl transition hover:scale-110"
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
              </div>

              {!user?.full_name && showName && (
                <input
                  type="text"
                  placeholder="Your name"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-black outline-none focus:border-green-600"
                />
              )}

              <textarea
                placeholder="Write your review..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-black outline-none focus:border-green-600"
              />

              <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={showName}
                  onChange={() => setShowName(!showName)}
                  className="h-4 w-4"
                />
                Show my name publicly
              </label>

              {user?.full_name && showName && (
                <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                  Your review will appear as {user.full_name}.
                </p>
              )}

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-green-600 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}