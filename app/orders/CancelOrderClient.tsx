"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";
import { useDialogFocus } from "@/lib/use-dialog-focus";

export default function CancelOrderClient({ orderId }: { orderId: number }) {
  const { lang } = useLanguage();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const confirmDialogRef =
    useRef<HTMLDivElement>(null);

  useDialogFocus(showConfirm, confirmDialogRef);

  useEffect(() => {
    if (!showConfirm) return;

    const previousOverflow =
      document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        setShowConfirm(false);
      }
    }

    window.addEventListener("keydown", closeWithEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener(
        "keydown",
        closeWithEscape
      );
    };
  }, [loading, showConfirm]);

  async function cancelOrder() {
    setLoading(true);
    setError("");

    const response = await fetch(
      `/api/customer/orders/${orderId}/cancel`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    setLoading(false);

    if (!response.ok) {
      setError(
        lang === "ar"
          ? "حدث خطأ أثناء إلغاء الطلب. يرجى المحاولة مرة أخرى."
          : "An error occurred while cancelling the order. Please try again."
      );
      return;
    }

    setCancelled(true);
    setShowConfirm(false);

    setTimeout(() => {
      router.refresh();
    }, 900);
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading || cancelled}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#e1bcb6] bg-white px-5 text-sm font-extrabold text-[#9a4036] transition hover:border-[#c9877e] hover:bg-[#fff7f5] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cancelled
          ? lang === "ar"
            ? "تم إلغاء الطلب"
            : "Order Cancelled"
          : lang === "ar"
            ? "إلغاء الطلب"
            : "Cancel Order"}
      </button>

      {error && (
        <p className="mt-3 rounded-2xl border border-[#e8c7c2] bg-[#fff7f5] px-4 py-3 text-sm font-bold text-[#9a4036]">
          {error}
        </p>
      )}

      {showConfirm && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-[#07130d]/55 px-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowConfirm(false);
            }
          }}
        >
          <div
            ref={confirmDialogRef}
            dir={lang === "ar" ? "rtl" : "ltr"}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-order-title"
            aria-describedby="cancel-order-description"
            tabIndex={-1}
            className="w-full max-w-md rounded-[1.75rem] border border-white/50 bg-white p-6 text-center shadow-[0_28px_80px_rgba(7,19,13,0.22)] sm:p-8"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#fff3f1] text-2xl">
              ⚠️
            </div>

            <h2
              id="cancel-order-title"
              className="text-2xl font-extrabold tracking-[-0.02em] text-[#142019]"
            >
              {lang === "ar" ? "إلغاء الطلب؟" : "Cancel order?"}
            </h2>

            <p
              id="cancel-order-description"
              className="mt-3 text-sm leading-7 text-[#647168]"
            >
              {lang === "ar"
                ? "هل أنت متأكد من إلغاء هذا الطلب؟ سيتم إرجاع المبلغ المدفوع خلال 24 ساعة."
                : "Are you sure you want to cancel this order? The paid amount will be refunded within 24 hours."}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="min-h-12 rounded-full border border-[#cbd3cd] px-5 text-sm font-extrabold text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b]"
              >
                {lang === "ar" ? "لا، تراجع" : "No, go back"}
              </button>

              <button
                onClick={cancelOrder}
                disabled={loading}
                className="min-h-12 rounded-full bg-[#9a4036] px-5 text-sm font-extrabold text-white transition hover:bg-[#7f332b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? lang === "ar"
                    ? "جاري الإلغاء..."
                    : "Cancelling..."
                  : lang === "ar"
                    ? "نعم، إلغاء الطلب"
                    : "Yes, cancel order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
