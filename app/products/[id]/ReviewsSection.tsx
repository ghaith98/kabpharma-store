"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiX,
} from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";

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

const REVIEWS_PER_PAGE = 4;

export default function ReviewsSection({
  productId,
  initialReviews,
}: {
  productId: number;
  initialReviews: Review[];
}) {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";

  const [reviews, setReviews] = useState<Review[]>(() =>
    [...(initialReviews || [])].sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
  );

  const [user, setUser] = useState<KabUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [showName, setShowName] = useState(true);
  const [manualName, setManualName] = useState("");

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const savedUser = window.localStorage.getItem("kab_user");

    if (!savedUser) return;

    try {
      setUser(JSON.parse(savedUser));
    } catch {
      window.localStorage.removeItem("kab_user");
    }
  }, []);

  useEffect(() => {
    if (!modalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [modalOpen]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;

    const total = reviews.reduce(
      (sum, item) => sum + Number(item.rating || 0),
      0
    );

    return total / reviews.length;
  }, [reviews]);

  const ratingDistribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter(
        (review) => Number(review.rating) === star
      ).length;

      const percentage =
        reviews.length > 0 ? (count / reviews.length) * 100 : 0;

      return {
        star,
        count,
        percentage,
      };
    });
  }, [reviews]);

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);

  const paginatedReviews = reviews.slice(
    (page - 1) * REVIEWS_PER_PAGE,
    page * REVIEWS_PER_PAGE
  );

  function formatReviewDate(value: string) {
    if (!value) return "";

    try {
      return new Intl.DateTimeFormat(
        isArabic ? "ar-SY" : "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      ).format(new Date(value));
    } catch {
      return "";
    }
  }

  function getReviewerName() {
    if (!showName) {
      return isArabic ? "مجهول" : "Anonymous";
    }

    if (user?.full_name) return user.full_name;
    if (manualName.trim()) return manualName.trim();

    return isArabic ? "عميل" : "Customer";
  }

  function resetForm() {
    setReviewText("");
    setRating(5);
    setManualName("");
    setShowName(true);
  }

  function closeModal() {
    if (loading) return;
    setModalOpen(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const cleanReview = reviewText.trim();

    if (!cleanReview) {
      alert(
        isArabic
          ? "يرجى كتابة تقييمك قبل الإرسال."
          : "Please write your review before submitting."
      );
      return;
    }

    if (showName && !user?.full_name && !manualName.trim()) {
      alert(
        isArabic
          ? "يرجى إدخال الاسم أو إلغاء خيار إظهار الاسم."
          : "Please enter your name or turn off the name option."
      );
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("product_reviews")
      .insert({
        product_id: productId,
        customer_name: getReviewerName(),
        review: cleanReview,
        rating,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error("Failed to submit review:", error);

      alert(
        isArabic
          ? "تعذر إرسال التقييم. يرجى المحاولة مرة أخرى."
          : "Could not submit your review. Please try again."
      );
      return;
    }

    setReviews((currentReviews) =>
      [data as Review, ...currentReviews].sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
    );

    resetForm();
    setModalOpen(false);
    setPage(1);
  }

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="mt-14 border-t border-[#e7ebe8] pt-10 sm:mt-16 sm:pt-14"
    >
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className={isArabic ? "text-right" : "text-left"}>
          <p
            className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
              isArabic ? "tracking-normal" : "tracking-[0.18em]"
            }`}
          >
            {isArabic ? "آراء حقيقية" : "Customer feedback"}
          </p>

          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#142019] sm:text-3xl">
            {isArabic ? "تقييمات العملاء" : "Customer reviews"}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#0a583b] bg-white px-6 text-sm font-extrabold text-[#0a583b] transition hover:bg-[#0a583b] hover:text-white active:scale-[0.98]"
        >
          <FiStar className="text-base" />

          {isArabic ? "اكتب تقييماً" : "Write a review"}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
        <aside className="h-fit rounded-[1.5rem] bg-[#f7f8f6] p-6 sm:p-7">
          {reviews.length > 0 ? (
            <>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-extrabold tracking-tight text-[#142019]">
                  {averageRating.toFixed(1)}
                </span>

                <span className="pb-1 text-sm font-bold text-[#647168]">
                  / 5
                </span>
              </div>

              <div
                dir="ltr"
                className="mt-4 flex items-center gap-1"
                aria-label={`${averageRating.toFixed(1)} out of 5`}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={
                      star <= Math.round(averageRating)
                        ? "text-[#e4aa00]"
                        : "text-[#dfe4e0]"
                    }
                  />
                ))}
              </div>

              <p className="mt-2 text-sm text-[#647168]">
                {isArabic
                  ? `بناءً على ${reviews.length} ${
                      reviews.length === 1 ? "تقييم" : "تقييمات"
                    }`
                  : `Based on ${reviews.length} ${
                      reviews.length === 1 ? "review" : "reviews"
                    }`}
              </p>

              <div className="mt-7 space-y-3">
                {ratingDistribution.map((item) => (
                  <div
                    key={item.star}
                    dir="ltr"
                    className="grid grid-cols-[20px_1fr_24px] items-center gap-3"
                  >
                    <span className="text-xs font-bold text-[#647168]">
                      {item.star}
                    </span>

                    <div className="h-1.5 overflow-hidden rounded-full bg-[#dfe4e0]">
                      <div
                        className="h-full rounded-full bg-[#0a583b] transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                        }}
                      />
                    </div>

                    <span className="text-right text-xs font-bold text-[#647168]">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                <FiStar className="text-xl" />
              </div>

              <h3 className="mt-5 text-lg font-extrabold text-[#142019]">
                {isArabic
                  ? "لا توجد تقييمات بعد"
                  : "No reviews yet"}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#647168]">
                {isArabic
                  ? "شارك تجربتك وكن أول من يقيّم هذا المنتج."
                  : "Share your experience and be the first to review this product."}
              </p>
            </div>
          )}
        </aside>

        <div>
          {reviews.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#dce3de] px-6 text-center">
              <h3 className="text-xl font-extrabold text-[#142019]">
                {isArabic
                  ? "كن أول من يشارك تجربته"
                  : "Be the first to share your experience"}
              </h3>

              <p className="mt-2 max-w-md text-sm leading-7 text-[#647168]">
                {isArabic
                  ? "يساعد تقييمك العملاء الآخرين على اختيار المنتج المناسب لهم."
                  : "Your feedback can help other customers choose the right product."}
              </p>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-6 rounded-full bg-[#0a583b] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
              >
                {isArabic ? "اكتب أول تقييم" : "Write the first review"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
  {paginatedReviews.map((item) => (
    <article
      key={item.id}
      className={`rounded-[1.5rem] border border-[#e7ebe8] bg-white p-5 transition hover:border-[#d3dfd7] sm:p-6 ${
        paginatedReviews.length === 1
          ? "lg:min-h-[290px]"
          : ""
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-sm font-extrabold uppercase text-[#0a583b]">
            {(item.customer_name || "?")
              .trim()
              .charAt(0)}
          </div>

          <div>
            <h3 className="font-extrabold text-[#142019]">
              {item.customer_name ||
                (isArabic ? "مجهول" : "Anonymous")}
            </h3>

            <p className="mt-1 text-xs text-[#7a857e]">
              {formatReviewDate(item.created_at)}
            </p>
          </div>
        </div>

        <div
          dir="ltr"
          className="flex items-center gap-1"
          aria-label={`${item.rating} out of 5`}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              className={
                star <= Number(item.rating)
                  ? "text-[#e4aa00]"
                  : "text-[#dfe4e0]"
              }
            />
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-[#edf0ed] pt-5">
        <p className="whitespace-pre-line text-[15px] leading-7 text-[#4f5d54]">
          {item.review}
        </p>
      </div>
    </article>
  ))}
</div>
          )}

          {totalPages > 1 && (
            <div
              dir="ltr"
              className="mt-8 flex items-center justify-center gap-2"
            >
              <button
                type="button"
                onClick={() => {
                  setPage((currentPage) =>
                    Math.max(1, currentPage - 1)
                  );
                }}
                disabled={page === 1}
                aria-label="Previous reviews"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe4e0] text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <FiChevronLeft />
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`h-10 min-w-10 rounded-full px-3 text-sm font-extrabold transition ${
                    page === pageNumber
                      ? "bg-[#0a583b] text-white"
                      : "text-[#647168] hover:bg-[#edf5f0] hover:text-[#0a583b]"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setPage((currentPage) =>
                    Math.min(totalPages, currentPage + 1)
                  );
                }}
                disabled={page === totalPages}
                aria-label="Next reviews"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe4e0] text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <FiChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-end justify-center bg-[#07130d]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            dir={isArabic ? "rtl" : "ltr"}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-[2rem] sm:p-8"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p
                  className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                    isArabic ? "tracking-normal" : "tracking-[0.18em]"
                  }`}
                >
                  KAB Pharma
                </p>

                <h3
                  id="review-modal-title"
                  className="mt-2 text-2xl font-extrabold tracking-tight text-[#142019]"
                >
                  {isArabic ? "شاركنا تجربتك" : "Share your experience"}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#647168]">
                  {isArabic
                    ? "رأيك يساعدنا ويساعد العملاء الآخرين."
                    : "Your feedback helps us and other customers."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                aria-label={isArabic ? "إغلاق" : "Close"}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f5f3] text-[#526057] transition hover:bg-[#e7ebe8] disabled:opacity-50"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <fieldset>
                <legend className="mb-3 text-sm font-extrabold text-[#142019]">
                  {isArabic ? "كيف تقيّم المنتج؟" : "How would you rate it?"}
                </legend>

                <div dir="ltr" className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`${star} stars`}
                      className="p-1 text-3xl transition hover:scale-110 active:scale-95"
                    >
                      <FaStar
                        className={
                          star <= rating
                            ? "text-[#e4aa00]"
                            : "text-[#dfe4e0]"
                        }
                      />
                    </button>
                  ))}
                </div>
              </fieldset>

              {!user?.full_name && showName && (
                <div>
                  <label
                    htmlFor="review-name"
                    className="mb-2 block text-sm font-extrabold text-[#142019]"
                  >
                    {isArabic ? "الاسم" : "Your name"}
                  </label>

                  <input
                    id="review-name"
                    type="text"
                    value={manualName}
                    onChange={(event) =>
                      setManualName(event.target.value)
                    }
                    placeholder={isArabic ? "اكتب اسمك" : "Enter your name"}
                    maxLength={80}
                    className="w-full rounded-2xl border border-[#dfe4e0] bg-white px-4 py-3.5 text-base text-[#142019] outline-none transition placeholder:text-[#99a29c] focus:border-[#0a583b] focus:ring-4 focus:ring-[#edf5f0]"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="review-text"
                  className="mb-2 block text-sm font-extrabold text-[#142019]"
                >
                  {isArabic ? "تقييمك" : "Your review"}
                </label>

                <textarea
                  id="review-text"
                  value={reviewText}
                  onChange={(event) =>
                    setReviewText(event.target.value)
                  }
                  placeholder={
                    isArabic
                      ? "أخبرنا عن تجربتك مع المنتج..."
                      : "Tell us about your experience with the product..."
                  }
                  rows={5}
                  maxLength={1500}
                  className="w-full resize-none rounded-2xl border border-[#dfe4e0] bg-white px-4 py-3.5 text-base leading-7 text-[#142019] outline-none transition placeholder:text-[#99a29c] focus:border-[#0a583b] focus:ring-4 focus:ring-[#edf5f0]"
                />

                <p className="mt-1.5 text-end text-xs text-[#99a29c]">
                  {reviewText.length}/1500
                </p>
              </div>

              <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-[#526057]">
                <input
                  type="checkbox"
                  checked={showName}
                  onChange={() => setShowName((current) => !current)}
                  className="h-4 w-4 accent-[#0a583b]"
                />

                {isArabic
                  ? "إظهار اسمي مع التقييم"
                  : "Show my name with this review"}
              </label>

              {user?.full_name && showName && (
                <div className="flex items-center gap-3 rounded-2xl bg-[#edf5f0] px-4 py-3 text-sm font-bold text-[#0a583b]">
                  <FiCheck className="shrink-0 text-lg" />

                  <span>
                    {isArabic
                      ? `سيظهر التقييم باسم ${user.full_name}.`
                      : `Your review will appear as ${user.full_name}.`}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !reviewText.trim()}
                className="flex min-h-13 w-full items-center justify-center rounded-full bg-[#0a583b] px-6 py-3.5 font-extrabold text-white shadow-sm transition hover:bg-[#073f2c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? isArabic
                    ? "جاري الإرسال..."
                    : "Submitting..."
                  : isArabic
                  ? "إرسال التقييم"
                  : "Submit review"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}