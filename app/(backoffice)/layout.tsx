import type {
  Metadata,
  Viewport,
} from "next";

import "../globals.css";
import { sans, arabic } from "../fonts";
import Analytics from "../Analytics";
import { LanguageProvider } from "@/context/LanguageContext";
import { SITE_URL } from "@/lib/site";

/*
  Back-office root layout: admin, admin-mobile, driver, delivery-company.
  No storefront navbar/footer. Language keeps the previous client-side
  behaviour (admin is always English; driver / delivery-company pages
  read the saved choice from this browser). Never indexed by search engines.
*/
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "KAB Pharma",
    template: "%s | KAB Pharma",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a583b",
  colorScheme: "light",
};

export default function BackOfficeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${sans.variable} ${arabic.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var p=location.pathname;var l=p.indexOf('/admin')===0?'en':localStorage.getItem('lang');if(l==='ar'||l==='en'){document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr'}}catch(e){}",
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
