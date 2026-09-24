"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrderItem = { id: number; product_name: string | null; variant_label_ar: string | null; variant_label_en: string | null; quantity: number; unit_price: number };
type PrintableOrder = {
  id: number; customer_name: string | null; phone: string | null;
  governorate: string | null; delivery_area: string | null; address: string | null;
  delivery_fee: number | null; cod_fee: number | null; payment_method: string | null;
  coupon_code: string | null; discount_amount: number | null; products_subtotal: number | null;
  total_price: number | null; status: string; created_at: string | null; order_items: OrderItem[];
};

const money = (value: number | null | undefined) => `${Number(value || 0).toLocaleString()} SYP`;

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-SY");
}

function Detail({ label, value }: { label: string; value: string }) {
  return <p className="leading-6"><span className="font-bold text-[#183f2c]">{label}</span> {value || "—"}</p>;
}

function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${strong ? "text-base font-extrabold text-[#0a583b]" : "text-sm text-slate-700"}`}>
      <span>{label}</span><span dir="ltr">{value}</span>
    </div>
  );
}

export default function PrintOrderPage() {
  const router = useRouter();
  const [order, setOrder] = useState<PrintableOrder | null>(null);

  useEffect(() => {
    async function loadInvoice() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/admin/login"); return; }
      const savedOrder = sessionStorage.getItem("kabpharma:print-order");
      if (!savedOrder) return;
      try { setOrder(JSON.parse(savedOrder) as PrintableOrder); }
      catch { sessionStorage.removeItem("kabpharma:print-order"); }
    }
    loadInvoice();
  }, [router]);

  useEffect(() => {
    if (!order) return;
    const timeout = window.setTimeout(() => window.print(), 350);
    return () => window.clearTimeout(timeout);
  }, [order]);

  if (!order) {
    return <main className="grid min-h-screen place-items-center bg-[#f5f7f6] p-6"><div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-bold">لم يتم اختيار فاتورة</h1><button type="button" onClick={() => router.push("/admin/orders")} className="mt-5 rounded-xl bg-[#0a583b] px-5 py-2.5 font-bold text-white">العودة للطلبات</button></div></main>;
  }

  const itemsSubtotal = order.order_items.reduce((total, item) => total + Number(item.unit_price || 0) * Number(item.quantity || 0), 0);
  const productsSubtotal = Number(order.products_subtotal ?? itemsSubtotal);
  const deliveryAddress = [order.governorate, order.delivery_area, order.address].filter(Boolean).join(" — ");

  return (
    <main dir="rtl" className="invoice-screen min-h-screen bg-[#f1f4f2] p-4 text-slate-900 sm:p-8">
      <div className="no-print mx-auto mb-5 flex max-w-[210mm] justify-between gap-3">
        <button type="button" onClick={() => router.push("/admin/orders")} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700">العودة للطلبات</button>
        <button type="button" onClick={() => window.print()} className="rounded-xl bg-[#0a583b] px-4 py-2 text-sm font-bold text-white">طباعة أو حفظ PDF</button>
      </div>

      <article className="invoice-page mx-auto w-full max-w-[210mm] rounded-[24px] bg-white p-6 shadow-[0_12px_40px_rgba(15,45,30,0.08)] sm:p-10">
        <header className="flex items-start justify-between gap-5 border-b border-[#d9e5dc] pb-5">
          <div className="text-right">
            <p className="text-xs font-bold tracking-[0.18em] text-[#0a583b]">KAB PHARMA</p>
            <h1 className="mt-1 text-3xl font-extrabold text-[#0a583b]">فاتورة طلب</h1>
            <div className="mt-3 flex flex-wrap justify-start gap-x-4 gap-y-1 text-sm text-slate-600">
              <p><span className="font-bold text-slate-800">رقم الطلب:</span> #{order.id}</p>
              <p><span className="font-bold text-slate-800">تاريخ الطلب:</span> {formatDate(order.created_at)}</p>
            </div>
          </div>
          <img src="/logo.png" alt="KAB Pharma" className="h-auto w-36 object-contain" />
        </header>

        <section className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border border-[#dce7df] bg-[#fbfdfb] p-4">
            <h2 className="mb-2 font-extrabold text-[#0a583b]">معلومات العميل</h2>
            <Detail label="الاسم:" value={order.customer_name || ""} />
            <Detail label="رقم الهاتف:" value={order.phone || ""} />
          </div>
          <div className="rounded-2xl border border-[#dce7df] bg-[#fbfdfb] p-4">
            <h2 className="mb-2 font-extrabold text-[#0a583b]">معلومات التوصيل</h2>
            <Detail label="العنوان:" value={deliveryAddress} />
            <Detail label="طريقة الدفع:" value={order.payment_method === "cod" ? "الدفع عند الاستلام" : "شام كاش"} />
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#dce7df]">
          <table className="w-full border-collapse text-right text-sm">
            <thead className="bg-[#0a583b] text-white">
              <tr><th className="w-10 px-3 py-3">#</th><th className="px-3 py-3">المنتج</th><th className="w-16 px-3 py-3">الكمية</th><th className="w-28 px-3 py-3">سعر القطعة</th><th className="w-28 px-3 py-3">المجموع</th></tr>
            </thead>
            <tbody>
              {order.order_items.map((item, index) => (
                <tr key={item.id} className="border-t border-[#e4ece6] even:bg-[#fbfdfb]">
                  <td className="px-3 py-3">{index + 1}</td><td className="px-3 py-3"><p className="font-bold">{item.product_name || "—"}</p>{(item.variant_label_ar || item.variant_label_en) && <p className="mt-0.5 text-xs text-slate-500">{item.variant_label_ar || item.variant_label_en}</p>}</td><td className="px-3 py-3">{item.quantity}</td><td className="px-3 py-3" dir="ltr">{money(item.unit_price)}</td><td className="px-3 py-3 font-bold" dir="ltr">{money(Number(item.unit_price || 0) * Number(item.quantity || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-5 mr-auto w-full max-w-[330px] overflow-hidden rounded-2xl border border-[#dce7df] bg-[#fbfdfb]">
          <div className="border-b border-[#dce7df] px-4 py-3 text-sm font-extrabold text-[#0a583b]">ملخص الطلب</div>
          <div className="px-4"><TotalRow label="مجموع المنتجات" value={money(productsSubtotal)} />{Number(order.discount_amount || 0) > 0 && <div className="border-t border-[#e4ece6]"><TotalRow label={`الحسم${order.coupon_code ? ` (${order.coupon_code})` : ""}`} value={`−${money(order.discount_amount)}`} /></div>}<div className="border-t border-[#e4ece6]"><TotalRow label="رسوم التوصيل" value={money(order.delivery_fee)} /></div>{Number(order.cod_fee || 0) > 0 && <div className="border-t border-[#e4ece6]"><TotalRow label="رسم الدفع عند الاستلام" value={money(order.cod_fee)} /></div>}<div className="mt-1 border-t-2 border-[#0a583b]"><TotalRow label="الإجمالي" value={money(order.total_price)} strong /></div></div>
        </section>

        <footer className="mt-8 border-t border-[#d9e5dc] pt-4 text-center text-xs text-slate-500">شكراً لثقتكم بـ KAB Pharma — الجودة لحياة أكثر صحة</footer>
      </article>

      <style jsx global>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .invoice-screen { min-height: 0 !important; padding: 0 !important; background: #fff !important; }
          .invoice-page { max-width: none !important; border-radius: 0 !important; padding: 0 !important; box-shadow: none !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </main>
  );
}
