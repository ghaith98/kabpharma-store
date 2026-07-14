import type { Metadata } from "next";

const SITE_URL = "https://www.kabpharma.com";

export const metadata: Metadata = {
  title: "تواصل معنا",

  description:
    "تواصل مع فريق خدمة عملاء KAB Pharma عبر واتساب أو إنستغرام أو فيسبوك أو البريد الإلكتروني للحصول على المساعدة بخصوص المنتجات والطلبات.",

  alternates: {
    canonical: `${SITE_URL}/contact`,
  },

  openGraph: {
    type: "website",
    url: `${SITE_URL}/contact`,
    siteName: "KAB Pharma",
    locale: "ar_SY",
    alternateLocale: ["en_US"],

    title: "تواصل معنا | KAB Pharma",

    description:
      "فريق خدمة عملاء KAB Pharma جاهز لمساعدتك والإجابة عن استفسارات المنتجات والطلبات.",

    images: [
      {
        url: `${SITE_URL}/opengraph-image.jpg`,
        width: 1200,
        height: 630,
        alt: "خدمة عملاء KAB Pharma",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "تواصل معنا | KAB Pharma",

    description:
      "تواصل مع فريق خدمة عملاء KAB Pharma للحصول على المساعدة بخصوص المنتجات والطلبات.",

    images: [
      `${SITE_URL}/opengraph-image.jpg`,
    ],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}