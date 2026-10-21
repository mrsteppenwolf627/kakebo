"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import { readConsent, subscribeConsent } from "@/lib/consent";

// Google Analytics solo se solicita tras consentimiento explícito de analítica:
// sin aceptación (estado inicial, rechazo o servidor) no se renderiza ningún <script>.
export function GoogleAnalytics() {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => "pending" as const);
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!id || consent !== "accepted") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
