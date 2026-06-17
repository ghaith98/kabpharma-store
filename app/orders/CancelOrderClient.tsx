"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CancelOrderClient({ orderId }: { orderId: number }) {
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  async function cancelOrder() {
    setLoading(true);
    setError("");

    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled_by_customer" })
      .eq("id", orderId)
      .eq("status", "pending");

    setLoading(false);

    if (error) {
      setError("حدث خطأ أثناء إلغاء الطلب. يرجى المحاولة مرة أخرى.");
      return;
    }

    setCancelled(true);
    setShowConfirm(false);

    setTimeout(() => {
      window.location.reload();
    }, 900);
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading || cancelled}
        className="mt-4 w-full rounded-2xl border border-red-300 bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
      >
        {cancelled ? "تم إلغاء الطلب" : "إلغاء الطلب"}
      </button>

      {error && (
        <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
              ⚠️
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900">
              إلغاء الطلب؟
            </h2>

            <p className="mt-3 leading-7 text-gray-600">
              هل أنت متأكد من إلغاء هذا الطلب؟ سيتم إرجاع المبلغ المدفوع خلال 24 ساعة.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="rounded-2xl border border-gray-300 px-5 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
              >
                لا، تراجع
              </button>

              <button
                onClick={cancelOrder}
                disabled={loading}
                className="rounded-2xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? "جاري الإلغاء..." : "نعم، إلغاء الطلب"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}