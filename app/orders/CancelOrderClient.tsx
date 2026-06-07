"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CancelOrderClient({ orderId }: { orderId: number }) {
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  async function cancelOrder() {
    const confirmCancel = confirm("هل أنت متأكد من إلغاء الطلب؟");
    if (!confirmCancel) return;

    setLoading(true);

    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled_by_customer" })
      .eq("id", orderId)
      .eq("status", "pending");

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setCancelled(true);

    setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  return (
    <button
      onClick={cancelOrder}
      disabled={loading || cancelled}
      className="mt-4 w-full rounded-2xl border border-red-300 bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
    >
      {cancelled ? "تم إلغاء الطلب" : loading ? "جاري الإلغاء..." : "إلغاء الطلب"}
    </button>
  );
}