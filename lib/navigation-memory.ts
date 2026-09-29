/*
  Small shared memory for "go back to where I was".

  - Scroll position per page (URL) for the current browser tab.
  - Whether the page currently on screen was reached with Back/Forward
    (or a reload), so components like sliders and "Show more" lists
    restore their state only then, and start fresh on normal visits.
  - The previous in-site page, so Back buttons can return to it.

  Everything lives in sessionStorage (this tab only) and fails silently
  if storage is unavailable.
*/

const SCROLL_PREFIX = "kab_scroll:";
const CURRENT_PAGE_KEY = "kab_nav_current";
const PREVIOUS_PAGE_KEY = "kab_nav_previous";

let restoringNavigation = false;

export function currentPageKey() {
  return `${window.location.pathname}${window.location.search}`;
}

function read(key: string) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Restoring position is a nicety; never break the page over it.
  }
}

export function readPageNumber(prefix: string, pageKey = currentPageKey()) {
  const value = Number(read(`${prefix}${pageKey}`));
  return Number.isFinite(value) ? value : 0;
}

export function writePageNumber(
  prefix: string,
  value: number,
  pageKey = currentPageKey()
) {
  write(`${prefix}${pageKey}`, String(Math.max(0, Math.round(value))));
}

export function readSavedScroll(pageKey = currentPageKey()) {
  return readPageNumber(SCROLL_PREFIX, pageKey);
}

export function saveScroll(value: number, pageKey = currentPageKey()) {
  writePageNumber(SCROLL_PREFIX, value, pageKey);
}

/** True while the visible page was reached with Back/Forward or reload. */
export function isRestoringNavigation() {
  return restoringNavigation;
}

export function setRestoringNavigation(value: boolean) {
  restoringNavigation = value;
}

/** Call whenever a new page is shown; keeps the previous in-site page. */
export function recordPageVisit(pageKey = currentPageKey()) {
  const current = read(CURRENT_PAGE_KEY);

  if (current && current !== pageKey) {
    write(PREVIOUS_PAGE_KEY, current);
  }

  write(CURRENT_PAGE_KEY, pageKey);
}

/** Forget the previous page (visitor arrived from outside the store). */
export function forgetPreviousPage() {
  try {
    window.sessionStorage.removeItem(PREVIOUS_PAGE_KEY);
  } catch {
    // ignore
  }
}

/** The page the visitor was on before this one, in this tab (or null). */
export function getPreviousPage() {
  return read(PREVIOUS_PAGE_KEY);
}
