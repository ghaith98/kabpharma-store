import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import "./globals.css";
import LayoutShell from "./LayoutShell";
import { LanguageProvider } from "../context/LanguageContext";
import TawkUserSync from "./TawkUserSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KAB Pharma",
  description: "Trusted Skincare & Personal Care Solutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <LayoutShell>{children}</LayoutShell>
        </LanguageProvider>

        <TawkUserSync />

        <Script
          id="tawk-to-chat"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API = Tawk_API || {};
              var Tawk_LoadStart = new Date();

              (function () {
                var s1 = document.createElement("script");
                var s0 = document.getElementsByTagName("script")[0];

                s1.async = true;
                s1.src = "https://embed.tawk.to/6a527c249a72601d480b42c2/1jt939t48";
                s1.charset = "UTF-8";
                s1.setAttribute("crossorigin", "*");

                s0.parentNode.insertBefore(s1, s0);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}