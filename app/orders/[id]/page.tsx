import { supabase } from "@/lib/supabase";
import CancelOrderClient from "../CancelOrderClient";
import OrderDetailsLanguageClient from "./OrderDetailsLanguageClient";

const statusMap = {
  ar: {
    pending: {
      label: "قيد مراجعة الدفع",
      description: "وصلنا طلبك، وسيتم التحقق من الدفع قريباً.",
      badgeClass: "bg-yellow-50 text-yellow-700",
    },
    accepted: {
      label: "تم قبول الطلب",
      description: "تم قبول طلبك وسيتم تجهيزه للتوصيل.",
      badgeClass: "bg-green-50 text-green-700",
    },
    out_for_delivery: {
      label: "قيد التوصيل",
      description: "طلبك خرج للتوصيل وسيصل إليك قريباً.",
      badgeClass: "bg-blue-50 text-blue-700",
    },
    delivered: {
      label: "تم تسليم الطلب",
      description: "تم تسليم طلبك بنجاح. شكراً لاختيارك KAB Pharma.",
      badgeClass: "bg-green-100 text-green-800",
    },
    rejected: {
      label: "تم رفض الطلب",
      description:
        "لم نتمكن من قبول الطلب. يمكنك التواصل معنا للمزيد من التفاصيل.",
      badgeClass: "bg-red-50 text-red-700",
    },
    cancelled_by_customer: {
      label: "تم إلغاء الطلب",
      description: "تم إلغاء الطلب من قبل الزبون قبل قبوله.",
      badgeClass: "bg-gray-100 text-gray-700",
    },
  },
  en: {
    pending: {
      label: "Payment under review",
      description: "We received your order and will verify the payment soon.",
      badgeClass: "bg-yellow-50 text-yellow-700",
    },
    accepted: {
      label: "Order accepted",
      description:
        "Your order has been accepted and will be prepared for delivery.",
      badgeClass: "bg-green-50 text-green-700",
    },
    out_for_delivery: {
      label: "Out for delivery",
      description: "Your order is out for delivery and will arrive soon.",
      badgeClass: "bg-blue-50 text-blue-700",
    },
    delivered: {
      label: "Delivered",
      description:
        "Your order has been delivered successfully. Thank you for choosing KAB Pharma.",
      badgeClass: "bg-green-100 text-green-800",
    },
    rejected: {
      label: "Rejected",
      description:
        "We could not accept this order. Please contact us for more details.",
      badgeClass: "bg-red-50 text-red-700",
    },
    cancelled_by_customer: {
      label: "Cancelled",
      description: "The order was cancelled before being accepted.",
      badgeClass: "bg-gray-100 text-gray-700",
    },
  },
};

const timelineSteps = {
  ar: [
    { key: "pending", label: "مراجعة الدفع" },
    { key: "accepted", label: "قبول الطلب" },
    { key: "out_for_delivery", label: "قيد التوصيل" },
    { key: "delivered", label: "تم التسليم" },
  ],
  en: [
    { key: "pending", label: "Payment review" },
    { key: "accepted", label: "Order accepted" },
    { key: "out_for_delivery", label: "Out for delivery" },
    { key: "delivered", label: "Delivered" },
  ],
};

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

  if (error || !order) {
    return <OrderDetailsLanguageClient order={null} />;
  }

  return (
    <OrderDetailsLanguageClient
      order={order}
      statusMap={statusMap}
      timelineSteps={timelineSteps}
    />
  );
}