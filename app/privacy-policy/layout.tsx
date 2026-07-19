import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description:
    "تعرّف على كيفية جمع KAB Pharma لبيانات العملاء واستخدامها وحمايتها عند إنشاء الحساب وتقديم الطلبات.",
  alternates: {
    canonical: `${SITE_URL}/privacy-policy`,
  },
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
