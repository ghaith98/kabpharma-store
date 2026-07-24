import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "الشروط والأحكام",
  description:
    "شروط استخدام متجر KAB Pharma، بما في ذلك الحسابات والطلبات والأسعار والتوصيل ومسؤوليات العميل.",
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

