"use client";

import { Suspense } from "react";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./FooterComponent";
import MobileBottomNav from "./MobileBottomNav";
import OnlinePresenceTracker from "./OnlinePresenceTracker";
import NavigationProgress from "./NavigationProgress";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname =
    usePathname();

  const isDriverPage =
    pathname.startsWith(
      "/driver"
    );

  const isAdminPage =
    pathname.startsWith(
      "/admin"
    );

  const isDeliveryCompanyPage =
    pathname.startsWith(
      "/delivery-company"
    );

  /*
    صفحة delivery داخلية أيضاً،
    لذلك لا نحسبها ضمن زوار المتجر.
  */
  const isDeliveryPage =
    pathname.startsWith(
      "/delivery"
    );

  const shouldTrackPresence =
    !isDriverPage &&
    !isAdminPage &&
    !isDeliveryCompanyPage &&
    !isDeliveryPage;

  if (
    isDriverPage ||
    isAdminPage ||
    isDeliveryCompanyPage
  ) {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>

      {shouldTrackPresence && (
        <OnlinePresenceTracker />
      )}

      <Navbar />

      <div
        id="main-content"
        tabIndex={-1}
        className="flex-1 outline-none"
      >
        {children}
      </div>

      <Footer />

      <MobileBottomNav />
    </>
  );
}
