"use client";

import { useEffect, useRef } from "react";

import { useAppPathname } from "@/lib/use-app-pathname";
import {
  currentPageKey,
  forgetPreviousPage,
  readSavedScroll,
  recordPageVisit,
  saveScroll,
  setRestoringNavigation,
} from "@/lib/navigation-memory";

/*
  Returns visitors to the exact spot they were on when they go Back
  (site back buttons, the browser/phone back button, or back-swipe), and
  keeps their place on reload (e.g. after switching language).

  Why the browser can't do this alone here: when going back, the browser
  tries to restore the position immediately, before the page's sliders and
  product lists have been drawn again. The page is still short at that
  moment, so it lands at the top. This waits until the page is tall enough,
  then jumps to the saved position. Any touch, wheel or key press by the
  visitor cancels the restore so it never fights them.
*/

const RESTORE_TIMEOUT_MS = 2500;
const TRAVERSE_WINDOW_MS = 3000;

function jumpTo(top: number) {
  window.scrollTo({ top, left: 0, behavior: "instant" as ScrollBehavior });
}

export default function ScrollRestoration() {
  const pathname = useAppPathname();
  const pendingRestore = useRef<number | null>(null);
  const savingEnabled = useRef(true);
  const cancelRestore = useRef<(() => void) | null>(null);
  const traverseTimer = useRef<number | null>(null);
  const renderedPath = useRef<string | null>(null);

  // Remember the previous page for Back buttons, and finish any pending
  // restore once the new page has actually been rendered.
  useEffect(() => {
    renderedPath.current = window.location.pathname;
    recordPageVisit();

    if (pendingRestore.current !== null) {
      const target = pendingRestore.current;
      pendingRestore.current = null;
      restore(target);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  function endTraverseSoon() {
    if (traverseTimer.current !== null) {
      window.clearTimeout(traverseTimer.current);
    }
    traverseTimer.current = window.setTimeout(() => {
      traverseTimer.current = null;
      setRestoringNavigation(false);
    }, TRAVERSE_WINDOW_MS);
  }

  function restore(target: number) {
    cancelRestore.current?.();

    if (target <= 0) {
      savingEnabled.current = true;
      return;
    }

    savingEnabled.current = false;
    const startedAt = performance.now();
    let frame = 0;
    let finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("wheel", finish);
      window.removeEventListener("touchstart", finish);
      window.removeEventListener("keydown", finish);
      cancelRestore.current = null;
      savingEnabled.current = true;
      saveScroll(window.scrollY);
    }

    function step() {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      if (maxScroll >= target - 2) {
        jumpTo(target);

        if (Math.abs(window.scrollY - target) <= 2) {
          finish();
          return;
        }
      }

      if (performance.now() - startedAt > RESTORE_TIMEOUT_MS) {
        jumpTo(Math.min(target, Math.max(0, maxScroll)));
        finish();
        return;
      }

      frame = window.requestAnimationFrame(step);
    }

    window.addEventListener("wheel", finish, { passive: true });
    window.addEventListener("touchstart", finish, { passive: true });
    window.addEventListener("keydown", finish);
    cancelRestore.current = finish;
    frame = window.requestAnimationFrame(step);
  }

  useEffect(() => {
    const previousSetting = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    let saveFrame = 0;

    function handleScroll() {
      if (!savingEnabled.current || saveFrame) return;

      saveFrame = window.requestAnimationFrame(() => {
        saveFrame = 0;
        if (savingEnabled.current) {
          saveScroll(window.scrollY);
        }
      });
    }

    function handlePopState() {
      // Read the saved spot now, before anything can overwrite it.
      const target = readSavedScroll(currentPageKey());
      savingEnabled.current = false;
      setRestoringNavigation(true);
      endTraverseSoon();
      pendingRestore.current = target;

      // Same page with only a different ?query: the route doesn't change,
      // so restore now. Otherwise wait until the previous page is rendered
      // (handled by the pathname effect above), however long that takes.
      if (window.location.pathname === renderedPath.current) {
        pendingRestore.current = null;
        window.requestAnimationFrame(() => restore(target));
      }
    }

    function handleLinkClick(event: MouseEvent) {
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (anchor) {
        // A normal forward visit: sliders and lists start fresh.
        setRestoringNavigation(false);
      }
    }

    // Full page load: restore on reload or browser Back/Forward.
    const entry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;

    // Arrived from outside the store (Google, a shared link, a typed URL):
    // there is no in-store page behind this one for Back buttons.
    if (entry?.type === "navigate") {
      let fromThisSite = false;
      try {
        fromThisSite =
          Boolean(document.referrer) &&
          new URL(document.referrer).origin === window.location.origin;
      } catch {
        fromThisSite = false;
      }
      if (!fromThisSite) forgetPreviousPage();
    }

    if (entry?.type === "reload" || entry?.type === "back_forward") {
      setRestoringNavigation(true);
      endTraverseSoon();
      restore(readSavedScroll());
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleLinkClick, true);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleLinkClick, true);
      window.cancelAnimationFrame(saveFrame);
      cancelRestore.current?.();
      window.history.scrollRestoration = previousSetting;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
