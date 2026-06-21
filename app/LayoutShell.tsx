"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./FooterComponent";
import MobileBottomNav from "./MobileBottomNav";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isDriverPage = pathname.startsWith("/driver");
  const isAdminPage = pathname.startsWith("/admin");
  const isDeliveryCompanyPage =
    pathname.startsWith("/delivery-company");

  if (
    isDriverPage ||
    isAdminPage ||
    isDeliveryCompanyPage
  ) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}