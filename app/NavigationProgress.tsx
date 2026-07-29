"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const COMPLETE_HOLD_MS = 320;
const SAFETY_TIMEOUT_MS = 8_000;

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<"idle" | "loading" | "completing" | "done">("idle");

  const showTimer    = useRef<number | null>(null);
  const completeTimer = useRef<number | null>(null);
  const safetyTimer  = useRef<number | null>(null);

  function clear() {
    [showTimer, completeTimer, safetyTimer].forEach((r) => {
      if (r.current !== null) {
        window.clearTimeout(r.current);
        r.current = null;
      }
    });
  }

  // When the route settles → animate the bar to 100% then fade out.
  useEffect(() => {
    if (phase === "idle" || phase === "done") return;

    clear();

    // Defer setState to avoid the synchronous-setState-in-effect lint error.
    completeTimer.current = window.setTimeout(() => {
      setPhase("completing");

      completeTimer.current = window.setTimeout(() => {
        setPhase("done");

        completeTimer.current = window.setTimeout(() => {
          setPhase("idle");
        }, 400);
      }, COMPLETE_HOLD_MS);
    }, 0);

    return clear;
  }, [pathname, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for internal link clicks → start the bar immediately.
  useEffect(() => {
    function startProgress() {
      if (phase === "loading") return;
      clear();
      setPhase("loading");

      safetyTimer.current = window.setTimeout(() => {
        setPhase("idle");
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
      ) return;

      const anchor = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const dest = new URL(anchor.href, window.location.href);
      if (
        dest.origin !== window.location.origin ||
        dest.protocol !== window.location.protocol ||
        (dest.pathname === window.location.pathname && dest.search === window.location.search)
      ) return;

      startProgress();
    }

    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", startProgress);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", startProgress);
      clear();
    };
  }, [phase]);  

  const widthClass =
    phase === "idle"
      ? "w-0"
      : phase === "loading"
        ? "w-[72%]"
        : "w-full";

  const opacityClass =
    phase === "idle" || phase === "done" ? "opacity-0" : "opacity-100";

  const transitionClass =
    phase === "idle"
      ? ""
      : phase === "loading"
        ? "transition-[width] duration-[380ms] ease-out"
        : "transition-[width] duration-[260ms] ease-out";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[10000] h-[2px] ${opacityClass} transition-opacity duration-300`}
    >
      <div
        className={`h-full ${widthClass} bg-[#0a583b] ${transitionClass}`}
        style={{
          boxShadow: phase !== "idle" ? "0 0 10px rgba(10,88,59,0.6), 0 0 4px rgba(10,88,59,0.4)" : undefined,
        }}
      />

      {(phase === "loading" || phase === "completing") && (
        <div
          className={`absolute top-[-1px] h-[4px] w-[60px] rounded-full bg-[#3db87a] opacity-80 ${widthClass} ${transitionClass}`}
          style={{ right: 0, left: "auto", transform: "translateX(50%)" }}
        />
      )}
    </div>
  );
}