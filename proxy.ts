import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  LANGUAGE_COOKIE,
  LANGUAGE_COOKIE_MAX_AGE,
} from "@/lib/language";

/*
  Storefront language routing.

  Visitors always see clean URLs (/products, /brands/x). Internally each
  request is rewritten to /ar/... or /en/... from the `lang` cookie, so the
  server renders the page in the right language and each language is cached
  as its own static page.

  /en/products or /ar/products typed or shared directly: the language is
  saved to the cookie and the visitor is redirected to the clean URL.

  Not applied to API routes, Next.js internals, files (anything with a dot)
  or the back office (admin, driver, delivery).
*/
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const firstSegment = pathname.split("/")[1] || "";

  if (isSupportedLanguage(firstSegment)) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.pathname =
      pathname.slice(firstSegment.length + 1) || "/";

    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(LANGUAGE_COOKIE, firstSegment, {
      path: "/",
      maxAge: LANGUAGE_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
    return response;
  }

  const cookieLanguage = request.cookies.get(LANGUAGE_COOKIE)?.value;
  const lang = isSupportedLanguage(cookieLanguage)
    ? cookieLanguage
    : DEFAULT_LANGUAGE;

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;

  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: [
    "/((?!api/|api$|_next/|admin|driver|delivery|.*\\..*).*)",
  ],
};
