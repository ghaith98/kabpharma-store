import type {
  Metadata,
  Viewport,
} from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";
import "./globals.css";
import LayoutShell from "./LayoutShell";
import { LanguageProvider } from "../context/LanguageContext";
import { SITE_URL } from "@/lib/site";

const siteTitle =
  "KAB Pharma | منتجات العناية بالبشرة والشعر";

const siteDescription =
  "اكتشف منتجات KAB Pharma للعناية بالبشرة والشعر والعناية الشخصية، بتركيبات مختارة للاستخدام اليومي وتجربة طلب سهلة وآمنة.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: siteTitle,
    template: "%s | KAB Pharma",
  },

  description: siteDescription,

  applicationName: "KAB Pharma",

  authors: [
    {
      name: "KAB Pharma",
      url: SITE_URL,
    },
  ],

  creator: "KAB Pharma",
  publisher: "KAB Pharma",

  category: "Skincare and Personal Care",

  openGraph: {
    type: "website",
    locale: "ar_SY",
    alternateLocale: ["en_US"],
    siteName: "KAB Pharma",
    title: siteTitle,
    description: siteDescription,
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
    title: siteTitle,
    description: siteDescription,
    images: [`${SITE_URL}/opengraph-image.jpg`],
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a583b",
  colorScheme: "light",
};

const structuredData = {
  "@context": "https://schema.org",

  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "KAB Pharma",

      alternateName: [
        "KAB",
        "kabpharma.com",
      ],

      inLanguage: ["ar", "en"],
    },

    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "KAB Pharma",
      url: `${SITE_URL}/`,

      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var l=localStorage.getItem('lang');if(l==='ar'||l==='en'){document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr'}}catch(e){}",
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="kab-skip-link"
        >
          Skip to content / الانتقال إلى المحتوى
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              structuredData
            ).replace(/</g, "\\u003c"),
          }}
        />

        <LanguageProvider>
          <LayoutShell>
            {children}
          </LayoutShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
