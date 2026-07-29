"use client";

import { Suspense } from "react";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./FooterComponent";
import MobileBottomNav from "./MobileBottomNav";
import OnlinePresenceTracker from "./OnlinePresenceTracker";
import NavigationProgress from "./NavigationProgress";
import RoutePreloader from "./RoutePreloader";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isDriverPage         = pathname.startsWith("/driver");
  const isAdminPage          = pathname.startsWith("/admin");
  const isDeliveryCompanyPage = pathname.startsWith("/delivery-company");
  const isDeliveryPage       = pathname.startsWith("/delivery");

  const shouldTrackPresence =
    !isDriverPage &&
    !isAdminPage &&
    !isDeliveryCompanyPage &&
    !isDeliveryPage;

  if (isDriverPage || isAdminPage || isDeliveryCompanyPage) {
    return <>{children}</>;
  }

  return (
    <>
      {/*
        NavigationProgress: instant top-bar feedback on every internal link click.
        Wrapped in Suspense because it reads useSearchParams.
      */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>

      {/*
        RoutePreloader: silently prefetches the 6 highest-traffic routes
        ~1.5s after the shell mounts. Makes subsequent nav taps instant
        even before the user hovers over anything.
      */}
      <RoutePreloader />

      {shouldTrackPresence && (
        <OnlinePresenceTracker />
      )}

      <Navbar />

      {/*
        #main-content: the only part of the DOM that changes on navigation.
        Navbar, Footer, and MobileBottomNav stay mounted — no re-render flicker.
        The kab-page-enter animation in globals.css runs on every child mount,
        giving a smooth 220ms fade-in instead of a hard content swap.
      */}
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