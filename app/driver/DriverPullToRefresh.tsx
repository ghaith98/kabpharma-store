"use client";

import { useEffect, useState } from "react";

export default function DriverPullToRefresh() {
  const [pulling, setPulling] = useState(false);

  useEffect(() => {
    let startY = 0;
    let currentY = 0;

    function onTouchStart(e: TouchEvent) {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      }
    }

    function onTouchMove(e: TouchEvent) {
      currentY = e.touches[0].clientY;

      if (window.scrollY === 0 && currentY - startY > 80) {
        setPulling(true);
      }
    }

    function onTouchEnd() {
      if (pulling) {
        window.dispatchEvent(
          new Event("driverRefreshRequested")
        );
      }

      setPulling(false);
      startY = 0;
      currentY = 0;
    }

    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pulling]);

  if (!pulling) return null;

  return (
    <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-black px-4 py-2 text-sm font-bold text-white shadow">
      Refreshing…
    </div>
  );
}
