import { supabase } from "@/lib/supabase";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return <p className="p-8 text-red-600">Order not found</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-4 text-3xl font-bold">Order #{order.id}</h1>

        <p className="mb-2">
  <strong>الحالة:</strong>{" "}
  {(() => {
  const statusMap: Record<string, string> = {
    pending: "قيد مراجعة الدفع",
    accepted: "تم قبول الطلب",
    out_for_delivery: "الطلب قيد التوصيل",
    delivered: "تم تسليم الطلب",
    rejected: "تم رفض الطلب",
  };

  return statusMap[order.status] || order.status;
})()}
</p>

        <p className="mb-2">
          <strong>Total:</strong>{" "}
          {Number(order.total_price).toLocaleString()} SYP
        </p>

        <p className="mb-2">
          <strong>Name:</strong> {order.customer_name}
        </p>

        <p className="mb-2">
          <strong>Phone:</strong> {order.phone}
        </p>

        <p>
          <strong>Address:</strong> {order.address}
        </p>
      </div>
    </main>
  );
}