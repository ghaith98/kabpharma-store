"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

const sensitiveRoutes = ["/checkout", "/payment", "/profile", "/orders"];

export default function Analytics() {
  const pathname = usePathname();
  const gaId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const isBackOffice = pathname.startsWith("/admin") || pathname.startsWith("/driver");
  const isSensitiveRoute = sensitiveRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (!isBackOffice) trackPageView(pathname);
  }, [isBackOffice, pathname]);

  useEffect(() => {
    if (isSensitiveRoute) document.body.setAttribute("data-clarity-mask", "true");
    else document.body.removeAttribute("data-clarity-mask");
    return () => document.body.removeAttribute("data-clarity-mask");
  }, [isSensitiveRoute]);

  if (isBackOffice) return null;

  return (
    <>
      {gaId ? (
        <Script id="ga4" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
      ) : null}
      {gaId ? (
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${gaId}',{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});`}
        </Script>
      ) : null}
      {clarityId ? (
        <Script id="clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${clarityId}");`}
        </Script>
      ) : null}
    </>
  );
}
