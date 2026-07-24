import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "سياسة الاستبدال والاسترجاع",
  description:
    "سياسة KAB Pharma للاستبدال والاسترجاع، وحالات المنتجات المؤهلة وطريقة التواصل مع خدمة العملاء.",
  alternates: {
    canonical: `${SITE_URL}/refund-policy`,
  },
};

export default function RefundPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

