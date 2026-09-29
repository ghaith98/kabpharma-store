"use client";

import { usePathname } from "next/navigation";

/*
  usePathname() without the internal /ar or /en language prefix.

  Storefront pages are pre-rendered at /ar/... and /en/... and served at
  clean URLs through proxy.ts. During pre-rendering usePathname() returns
  "/en/products" while the browser shows "/products", which would make the
  server HTML and the browser disagree (hydration mismatch) for anything
  that depends on the path, such as active nav links. Stripping the prefix
  gives the same value on both sides. Safe to use outside the storefront.
*/
export function useAppPathname(): string {
  const pathname = usePathname() || "/";
  const match = /^\/(ar|en)(?=\/|$)/.exec(pathname);

  if (!match) return pathname;

  return pathname.slice(match[0].length) || "/";
}
