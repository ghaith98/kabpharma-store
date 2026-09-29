import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "من نحن",

  description:
    "تعرّف على KAB Pharma، رؤيتنا ورسالتنا وقيمنا في تقديم منتجات موثوقة للعناية بالبشرة والشعر والجسم، مع تجربة تسوق واضحة وخدمة عملاء قريبة منك.",

  alternates: {
    canonical: `${SITE_URL}/about`,
  },

  openGraph: {
    type: "website",
    url: `${SITE_URL}/about`,
    siteName: "KAB Pharma",
    locale: "ar_SY",
    alternateLocale: ["en_US"],

    title: "من نحن | KAB Pharma",

    description:
      "تعرّف على قصة KAB Pharma ورؤيتنا في تقديم منتجات موثوقة للعناية بالبشرة والشعر والجسم.",

    images: [
      {
        url: `${SITE_URL}/opengraph-image.jpg`,
        width: 1200,
        height: 630,
        alt: "KAB Pharma",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "من نحن | KAB Pharma",

    description:
      "تعرّف على قصة KAB Pharma ورؤيتنا ومنتجاتنا للعناية بالبشرة والشعر والجسم.",

    images: [
      `${SITE_URL}/opengraph-image.jpg`,
    ],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

