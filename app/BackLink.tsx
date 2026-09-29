"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

import { getPreviousPage } from "@/lib/navigation-memory";

type BackLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  /** Where to go if there is no earlier page to return to. */
  href: string;
  /**
   * Only go "back" if the previous page is this one (e.g. "/cart" for
   * "Back to cart"). Leave empty to return to whatever page came before.
   */
  onlyFrom?: string;
};

/*
  A Back button that behaves like the browser's Back: it returns to the
  previous page at the same scroll spot, sliders and lists as they were.
  If the visitor opened this page directly (from Google, a shared link...)
  there is nothing to go back to, so it works as a normal link to `href`.
*/
export default function BackLink({
  href,
  onlyFrom,
  onClick,
  ...rest
}: BackLinkProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

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

    // Nothing behind this page in this tab (e.g. opened in a new tab).
    if (window.history.length <= 1) return;

    const previous = getPreviousPage();
    if (!previous) return;

    if (onlyFrom) {
      const previousPath = previous.split("?")[0];
      const matches =
        previousPath === onlyFrom ||
        previousPath.startsWith(`${onlyFrom}/`);
      if (!matches) return;
    }

    event.preventDefault();
    router.back();
  }

  return <Link href={href} {...rest} onClick={handleClick} />;
}
