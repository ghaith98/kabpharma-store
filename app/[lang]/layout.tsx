import type {
  Metadata,
  Viewport,
} from "next";
import { notFound } from "next/navigation";

import "../globals.css";
import { sans, arabic } from "../fonts";
import LayoutShell from "../LayoutShell";
import Analytics from "../Analytics";
import { LanguageProvider } from "@/context/LanguageContext";
import { MenuVisibilityProvider } from "@/context/MenuVisibilityContext";
import {
  MENU_VISIBILITY_SETTING_KEY,
  parseHiddenMenuLinks,
} from "@/lib/menu-visibility";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";
import {
  isSupportedLanguage,
  LANGUAGE_COOKIE,
  LANGUAGE_COOKIE_MAX_AGE,
  LANGUAGE_STORAGE_KEY,
  LANGUAGES,
} from "@/lib/language";

/*
  Storefront root layout.

  Every storefront URL (/, /products, /brands/x ...) is internally rewritten
  by proxy.ts to /ar/... or /en/... based on the `lang` cookie, so this
  layout receives the visitor's language and the server renders the correct
  language, direction and text on the first byte. Visitors never see the
  /ar or /en prefix. Each language is pre-rendered and cached separately.
*/
export function generateStaticParams() {
  return LANGUAGES.map((lang) => ({ lang }));
}

// The menu reads which links are hidden (Admin > Menu Links). Refreshing
// the cached pages every minute lets a change show up without a redeploy.
export const revalidate = 60;

/** Menu links hidden by the admin. Any problem = nothing hidden. */
async function loadHiddenMenuLinks() {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", MENU_VISIBILITY_SETTING_KEY)
      .maybeSingle();

    if (error) {
      console.error("Failed to load menu visibility:", error);
      return [];
    }

    return parseHiddenMenuLinks(data?.value);
  } catch (exception) {
    console.error("Failed to load menu visibility:", exception);
    return [];
  }
}

const siteTitle =
  "KAB Pharma | منتجات العناية بالبشرة والشعر";

const siteDescription =
  "اكتشف منتجات KAB Pharma للعناية بالبشرة والشعر والعناية الشخصية، بتركيبات مختارة للاستخدام اليومي وتجربة طلب سهلة وآمنة.";

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

// One-time migration for visitors who chose a language before the cookie
// existed: copy their saved choice into the cookie and reload once.
// Reloads only if the cookie was actually stored (no loop if cookies are blocked).
const languageMigrationScript = `try{var s=localStorage.getItem('${LANGUAGE_STORAGE_KEY}');var c=document.cookie.match(/(?:^|; )${LANGUAGE_COOKIE}=(ar|en)/);if(!c&&(s==='ar'||s==='en')&&s!==document.documentElement.lang){document.cookie='${LANGUAGE_COOKIE}='+s+'; path=/; max-age=${LANGUAGE_COOKIE_MAX_AGE}; samesite=lax';if(document.cookie.indexOf('${LANGUAGE_COOKIE}='+s)!==-1){location.reload()}}}catch(e){}`;

export default async function StorefrontLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;

  if (!isSupportedLanguage(lang)) {
    notFound();
  }

  const hiddenMenuLinks = await loadHiddenMenuLinks();

  return (
    <html
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${sans.variable} ${arabic.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: languageMigrationScript,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              structuredData
            ).replace(/</g, "\\u003c"),
          }}
        />

        <LanguageProvider serverLang={lang}>
          <MenuVisibilityProvider initialHidden={hiddenMenuLinks}>
            <LayoutShell>
              {children}
            </LayoutShell>
          </MenuVisibilityProvider>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
