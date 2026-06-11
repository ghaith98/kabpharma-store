  import type { Metadata } from "next";
  import { Geist, Geist_Mono } from "next/font/google";
  import "./globals.css";
  import Navbar from "./Navbar";
  import Footer from "./FooterComponent";
  import MobileBottomNav from "./MobileBottomNav";    

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
  <Navbar />

  <main className="flex-1">
    {children}
  </main>

  <Footer />

  <MobileBottomNav />
</body>
      </html>
    );
  }
