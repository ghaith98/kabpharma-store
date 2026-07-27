import { NextResponse } from "next/server";

export function jsonError(
  error: string,
  status: number
) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export function hasTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get(
    "sec-fetch-site"
  );

  if (!origin) {
    return fetchSite === "same-origin";
  }

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const configuredOrigin =
      process.env.NEXT_PUBLIC_SITE_URL
        ? new URL(
            process.env.NEXT_PUBLIC_SITE_URL
          ).origin
        : null;
    const allowedOrigins = new Set(
      [
        requestUrl.origin,
        configuredOrigin,
      ].filter(
        (value): value is string =>
          Boolean(value)
      )
    );

    return (
      allowedOrigins.has(originUrl.origin) &&
      (fetchSite == null ||
        fetchSite === "same-origin" ||
        fetchSite === "same-site")
    );
  } catch {
    return false;
  }
}
