"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  is_anonymous?: boolean;
};

type KabUser = {
  id: number;
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

  const isArabic =
    lang === "ar";

  const [reviews, setReviews] =
    useState<Review[]>(() =>
      [...(initialReviews || [])].sort(
        (firstReview, secondReview) =>
          new Date(
            secondReview.created_at
          ).getTime() -
          new Date(
            firstReview.created_at
          ).getTime()
      )
    );

  const [user, setUser] =
    useState<KabUser | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [reviewText, setReviewText] =
    useState("");

  const [rating, setRating] =
    useState(5);

  const [
    isAnonymous,
    setIsAnonymous,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [page, setPage] =
    useState(1);

  /*
    نتحقق من الـHttpOnly Session،
    وليس من localStorage.
  */
  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const response = await fetch(
          "/api/customer/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
          }

          return;
        }

        const result =
          await response.json();

        if (
          !cancelled &&
          result.authenticated &&
          result.user
        ) {
          setUser(result.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
    إغلاق الـModal بزر Escape
    ومنع الصفحة من التحرك خلفه.
  */
  useEffect(() => {
    if (!modalOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setModalOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [modalOpen]);

  const averageRating =
    useMemo(() => {
      if (reviews.length === 0) {
        return 0;
      }

      const total =
        reviews.reduce(
          (sum, item) =>
            sum +
            Number(
              item.rating || 0
            ),
          0
        );

      return (
        total / reviews.length
      );
    }, [reviews]);

  const ratingDistribution =
    useMemo(() => {
      return [5, 4, 3, 2, 1].map(
        (star) => {
          const count =
            reviews.filter(
              (review) =>
                Number(
                  review.rating
                ) === star
            ).length;

          const percentage =
            reviews.length > 0
              ? (count /
                  reviews.length) *
                100
              : 0;

          return {
            star,
            count,
            percentage,
          };
        }
      );
    }, [reviews]);

  const totalPages = Math.ceil(
    reviews.length /
      REVIEWS_PER_PAGE
  );

  const paginatedReviews =
    reviews.slice(
      (page - 1) *
        REVIEWS_PER_PAGE,

      page * REVIEWS_PER_PAGE
    );

  function formatReviewDate(
    value: string
  ) {
    if (!value) return "";

    try {
      return new Intl.DateTimeFormat(
        isArabic
          ? "ar-SY"
          : "en-US",
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

  function getDisplayedName(
    item: Review
  ) {
    if (
      item.is_anonymous ||
      item.customer_name ===
        "Anonymous"
    ) {
      return isArabic
        ? "مجهول"
        : "Anonymous";
    }

    return (
      item.customer_name ||
      (isArabic
        ? "عميل"
        : "Customer")
    );
  }

  function resetForm() {
    setReviewText("");
    setRating(5);
    setIsAnonymous(false);
  }

  function closeModal() {
    if (loading) return;

    setModalOpen(false);
  }

  function openReviewModal() {
    if (authLoading) return;

    /*
      إذا Guest، نحفظ صفحة المنتج
      حتى نرجعه إليها بعد Login.
    */
    if (!user) {
      localStorage.setItem(
        "redirect_after_login",
        `${window.location.pathname}${window.location.search}`
      );

      window.location.href =
        "/login";

      return;
    }

    setModalOpen(true);
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!user) {
      openReviewModal();
      return;
    }

    const cleanReview =
      reviewText.trim();

    if (
      cleanReview.length < 2
    ) {
      alert(
        isArabic
          ? "يرجى كتابة تقييمك قبل الإرسال."
          : "Please write your review before submitting."
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/product-reviews",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            productId,
            rating,
            review:
              cleanReview,
            isAnonymous,
          }),
        }
      );

      const result =
        await response.json();

      if (response.status === 401) {
        setModalOpen(false);

        localStorage.setItem(
          "redirect_after_login",
          `${window.location.pathname}${window.location.search}`
        );

        window.location.href =
          "/login";

        return;
      }

      if (
        !response.ok ||
        !result.success ||
        !result.review
      ) {
        console.error(
          "Failed to save review:",
          result
        );

        alert(
          isArabic
            ? "تعذر حفظ التقييم. يرجى المحاولة مرة أخرى."
            : "Could not save your review. Please try again."
        );

        return;
      }

      const savedReview =
        result.review as Review;

      /*
        إذا المستخدم قيّم المنتج سابقاً،
        الـAPI تعدّل نفس التقييم،
        لذلك نحذف النسخة القديمة ثم
        نضيف النسخة الجديدة.
      */
      setReviews(
        (currentReviews) =>
          [
            savedReview,

            ...currentReviews.filter(
              (item) =>
                item.id !==
                savedReview.id
            ),
          ].sort(
            (
              firstReview,
              secondReview
            ) =>
              new Date(
                secondReview.created_at
              ).getTime() -
              new Date(
                firstReview.created_at
              ).getTime()
          )
      );

      resetForm();
      setModalOpen(false);
      setPage(1);
    } catch (error) {
      console.error(
        "Review submission error:",
        error
      );

      alert(
        isArabic
          ? "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى."
          : "Could not connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const reviewButtonText =
    authLoading
      ? isArabic
        ? "جاري التحقق..."
        : "Checking..."
      : !user
      ? isArabic
        ? "سجّل دخولك للتقييم"
        : "Sign in to review"
      : isArabic
      ? "اكتب تقييماً"
      : "Write a review";

  return (
    <section
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
       className="mt-14 pt-10 sm:mt-16 sm:pt-14"
    >
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div
          className={
            isArabic
              ? "text-right"
              : "text-left"
          }
        >
          <p
            className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
              isArabic
                ? "tracking-normal"
                : "tracking-[0.18em]"
            }`}
          >
            {isArabic
              ? "آراء العملاء"
              : "Customer feedback"}
          </p>

          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#142019] sm:text-3xl">
            {isArabic
              ? "تقييمات العملاء"
              : "Customer reviews"}
          </h2>
        </div>

        <button
          type="button"
          onClick={
            openReviewModal
          }
          disabled={
            authLoading
          }
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#0a583b] bg-white px-6 text-sm font-extrabold text-[#0a583b] transition hover:bg-[#0a583b] hover:text-white active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        >
          <FiStar className="text-base" />

          {reviewButtonText}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
        <aside className="h-fit rounded-[1.5rem] bg-[#f7f8f6] p-6 sm:p-7">
          {reviews.length >
          0 ? (
            <>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-extrabold tracking-tight text-[#142019]">
                  {averageRating.toFixed(
                    1
                  )}
                </span>

                <span className="pb-1 text-sm font-bold text-[#647168]">
                  / 5
                </span>
              </div>

              <div
                dir="ltr"
                className="mt-4 flex items-center gap-1"
                aria-label={`${averageRating.toFixed(
                  1
                )} out of 5`}
              >
                {[
                  1, 2, 3, 4, 5,
                ].map((star) => (
                  <FaStar
                    key={star}
                    className={
                      star <=
                      Math.round(
                        averageRating
                      )
                        ? "text-[#e4aa00]"
                        : "text-[#dfe4e0]"
                    }
                  />
                ))}
              </div>

              <p className="mt-2 text-sm text-[#647168]">
                {isArabic
                  ? `بناءً على ${
                      reviews.length
                    } ${
                      reviews.length ===
                      1
                        ? "تقييم"
                        : "تقييمات"
                    }`
                  : `Based on ${
                      reviews.length
                    } ${
                      reviews.length ===
                      1
                        ? "review"
                        : "reviews"
                    }`}
              </p>

              <div className="mt-7 space-y-3">
                {ratingDistribution.map(
                  (item) => (
                    <div
                      key={
                        item.star
                      }
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
                  )
                )}
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
          {reviews.length ===
          0 ? (
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
                onClick={
                  openReviewModal
                }
                disabled={
                  authLoading
                }
                className="mt-6 rounded-full bg-[#0a583b] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#073f2c] disabled:cursor-wait disabled:opacity-60"
              >
                {authLoading
                  ? isArabic
                    ? "جاري التحقق..."
                    : "Checking..."
                  : !user
                  ? isArabic
                    ? "سجّل دخولك لكتابة تقييم"
                    : "Sign in to write a review"
                  : isArabic
                  ? "اكتب أول تقييم"
                  : "Write the first review"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedReviews.map(
                (item) => {
                  const displayedName =
                    getDisplayedName(
                      item
                    );

                  return (
                    <article
                      key={
                        item.id
                      }
                      className={`rounded-[1.5rem] border border-[#e7ebe8] bg-white p-5 transition hover:border-[#d3dfd7] sm:p-6 ${
                        paginatedReviews.length ===
                        1
                          ? "lg:min-h-[290px]"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-sm font-extrabold uppercase text-[#0a583b]">
                            {displayedName
                              .trim()
                              .charAt(
                                0
                              )}
                          </div>

                          <div>
                            <h3 className="font-extrabold text-[#142019]">
                              {
                                displayedName
                              }
                            </h3>

                            <p className="mt-1 text-xs text-[#7a857e]">
                              {formatReviewDate(
                                item.created_at
                              )}
                            </p>
                          </div>
                        </div>

                        <div
                          dir="ltr"
                          className="flex items-center gap-1"
                          aria-label={`${item.rating} out of 5`}
                        >
                          {[
                            1, 2, 3,
                            4, 5,
                          ].map(
                            (
                              star
                            ) => (
                              <FaStar
                                key={
                                  star
                                }
                                className={
                                  star <=
                                  Number(
                                    item.rating
                                  )
                                    ? "text-[#e4aa00]"
                                    : "text-[#dfe4e0]"
                                }
                              />
                            )
                          )}
                        </div>
                      </div>

                      <div className="mt-6 border-t border-[#edf0ed] pt-5">
                        <p className="whitespace-pre-line text-[15px] leading-7 text-[#4f5d54]">
                          {
                            item.review
                          }
                        </p>
                      </div>
                    </article>
                  );
                }
              )}
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
                  setPage(
                    (
                      currentPage
                    ) =>
                      Math.max(
                        1,
                        currentPage -
                          1
                      )
                  );
                }}
                disabled={
                  page === 1
                }
                aria-label="Previous reviews"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe4e0] text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <FiChevronLeft />
              </button>

              {Array.from(
                {
                  length:
                    totalPages,
                },
                (_, index) =>
                  index + 1
              ).map(
                (
                  pageNumber
                ) => (
                  <button
                    key={
                      pageNumber
                    }
                    type="button"
                    onClick={() =>
                      setPage(
                        pageNumber
                      )
                    }
                    className={`h-10 min-w-10 rounded-full px-3 text-sm font-extrabold transition ${
                      page ===
                      pageNumber
                        ? "bg-[#0a583b] text-white"
                        : "text-[#647168] hover:bg-[#edf5f0] hover:text-[#0a583b]"
                    }`}
                  >
                    {
                      pageNumber
                    }
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => {
                  setPage(
                    (
                      currentPage
                    ) =>
                      Math.min(
                        totalPages,
                        currentPage +
                          1
                      )
                  );
                }}
                disabled={
                  page ===
                  totalPages
                }
                aria-label="Next reviews"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe4e0] text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <FiChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>

      {modalOpen && user && (
        <div
          className="fixed inset-0 z-[999] flex items-end justify-center bg-[#07130d]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            dir={
              isArabic
                ? "rtl"
                : "ltr"
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-[2rem] sm:p-8"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p
                  className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                    isArabic
                      ? "tracking-normal"
                      : "tracking-[0.18em]"
                  }`}
                >
                  KAB Pharma
                </p>

                <h3
                  id="review-modal-title"
                  className="mt-2 text-2xl font-extrabold tracking-tight text-[#142019]"
                >
                  {isArabic
                    ? "شاركنا تجربتك"
                    : "Share your experience"}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#647168]">
                  {isArabic
                    ? "رأيك يساعدنا ويساعد العملاء الآخرين."
                    : "Your feedback helps us and other customers."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  loading
                }
                aria-label={
                  isArabic
                    ? "إغلاق"
                    : "Close"
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f5f3] text-[#526057] transition hover:bg-[#e7ebe8] disabled:opacity-50"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-7 space-y-5"
            >
              <fieldset>
                <legend className="mb-3 text-sm font-extrabold text-[#142019]">
                  {isArabic
                    ? "كيف تقيّم المنتج؟"
                    : "How would you rate it?"}
                </legend>

                <div
                  dir="ltr"
                  className="flex gap-2"
                >
                  {[
                    1, 2, 3, 4, 5,
                  ].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setRating(
                          star
                        )
                      }
                      aria-label={`${star} stars`}
                      className="p-1 text-3xl transition hover:scale-110 active:scale-95"
                    >
                      <FaStar
                        className={
                          star <=
                          rating
                            ? "text-[#e4aa00]"
                            : "text-[#dfe4e0]"
                        }
                      />
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="review-text"
                  className="mb-2 block text-sm font-extrabold text-[#142019]"
                >
                  {isArabic
                    ? "تقييمك"
                    : "Your review"}
                </label>

                <textarea
                  id="review-text"
                  value={
                    reviewText
                  }
                  onChange={(
                    event
                  ) =>
                    setReviewText(
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    isArabic
                      ? "أخبرنا عن تجربتك مع المنتج..."
                      : "Tell us about your experience with the product..."
                  }
                  rows={5}
                  maxLength={
                    1500
                  }
                  className="w-full resize-none rounded-2xl border border-[#dfe4e0] bg-white px-4 py-3.5 text-base leading-7 text-[#142019] outline-none transition placeholder:text-[#99a29c] focus:border-[#0a583b] focus:ring-4 focus:ring-[#edf5f0]"
                />

                <p className="mt-1.5 text-end text-xs text-[#99a29c]">
                  {
                    reviewText.length
                  }
                  /1500
                </p>
              </div>

              <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-[#526057]">
                <input
                  type="checkbox"
                  checked={
                    isAnonymous
                  }
                  onChange={() =>
                    setIsAnonymous(
                      (
                        current
                      ) =>
                        !current
                    )
                  }
                  className="h-4 w-4 accent-[#0a583b]"
                />

                {isArabic
                  ? "نشر التقييم بشكل مجهول"
                  : "Post this review anonymously"}
              </label>

              <div className="flex items-center gap-3 rounded-2xl bg-[#edf5f0] px-4 py-3 text-sm font-bold text-[#0a583b]">
                <FiCheck className="shrink-0 text-lg" />

                <span>
                  {isAnonymous
                    ? isArabic
                      ? "سيظهر تقييمك باسم مجهول."
                      : "Your review will appear as Anonymous."
                    : isArabic
                    ? `سيظهر تقييمك باسم ${user.full_name}.`
                    : `Your review will appear as ${user.full_name}.`}
                </span>
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  reviewText.trim()
                    .length < 2
                }
                className="flex min-h-13 w-full items-center justify-center rounded-full bg-[#0a583b] px-6 py-3.5 font-extrabold text-white shadow-sm transition hover:bg-[#073f2c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? isArabic
                    ? "جاري الحفظ..."
                    : "Saving..."
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