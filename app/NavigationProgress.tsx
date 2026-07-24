"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SHOW_DELAY_MS = 120;
const SAFETY_TIMEOUT_MS = 10_000;

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<number | null>(null);
  const safetyTimer = useRef<number | null>(null);

  useEffect(() => {
    function clearProgress() {
      if (showTimer.current !== null) {
        window.clearTimeout(showTimer.current);
        showTimer.current = null;
      }

      if (safetyTimer.current !== null) {
        window.clearTimeout(safetyTimer.current);
        safetyTimer.current = null;
      }

      setVisible(false);
    }

    clearProgress();
  }, [pathname, searchParams]);

  useEffect(() => {
    function startProgress() {
      if (showTimer.current !== null) return;

      showTimer.current = window.setTimeout(() => {
        setVisible(true);
      }, SHOW_DELAY_MS);

      safetyTimer.current = window.setTimeout(() => {
        setVisible(false);
        showTimer.current = null;
        safetyTimer.current = null;
      }, SAFETY_TIMEOUT_MS);
    }

    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>(
        "a[href]"
      );

      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const destination = new URL(
        anchor.href,
        window.location.href
      );

      if (
        destination.origin !== window.location.origin ||
        (destination.pathname === window.location.pathname &&
          destination.search === window.location.search) ||
        destination.protocol !== window.location.protocol
      ) {
        return;
      }

      startProgress();
    }

    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", startProgress);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", startProgress);

      if (showTimer.current !== null) {
        window.clearTimeout(showTimer.current);
      }

      if (safetyTimer.current !== null) {
        window.clearTimeout(safetyTimer.current);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[10000] h-[3px] overflow-hidden transition-opacity duration-150 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="kab-navigation-progress h-full w-2/5 bg-[#0a583b] shadow-[0_0_12px_rgba(10,88,59,0.5)]" />
    </div>
  );
}
