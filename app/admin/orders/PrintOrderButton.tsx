"use client";

type OrderItem = { id: number; product_name: string | null; variant_label_ar: string | null; variant_label_en: string | null; quantity: number; unit_price: number };
type PrintableOrder = { id: number; customer_name: string | null; phone: string | null; governorate: string | null; delivery_area: string | null; address: string | null; delivery_fee: number | null; cod_fee: number | null; payment_method: string | null; coupon_code: string | null; discount_amount: number | null; products_subtotal: number | null; total_price: number | null; status: string; created_at: string | null; order_items: OrderItem[] };

export default function PrintOrderButton({ order }: { order: PrintableOrder }) {
  function openInvoice() {
    sessionStorage.setItem("kabpharma:print-order", JSON.stringify(order));
    window.location.assign("/admin/orders/print");
  }

  return <button type="button" onClick={openInvoice} className="mt-4 inline-flex rounded-xl bg-green-700 px-4 py-2 font-bold text-white transition hover:bg-green-800 print:hidden">🖨️ Print Invoice</button>;
}
