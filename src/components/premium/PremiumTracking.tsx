"use client";

import React, { useEffect } from "react";
import { Link } from "@/i18n/routing";
import { analytics } from "@/lib/analytics";

import { PREMIUM_PRODUCT_NAME, PREMIUM_PRODUCT_PRICE } from "@/lib/premium/product-meta";

export { PREMIUM_PRODUCT_NAME, PREMIUM_PRODUCT_PRICE };
export const PREMIUM_PATH = "/herramientas/plantilla-kakebo-excel-premium";

export function PremiumViewTracker() {
    useEffect(() => {
        analytics.track("premium_product_viewed", {
            source_page: window.location.pathname,
            product_name: PREMIUM_PRODUCT_NAME,
            product_price: PREMIUM_PRODUCT_PRICE,
        });
    }, []);
    return null;
}

const PURCHASE_TRACKED_KEY = "kakebo_premium_purchase_tracked";

/**
 * Emite `purchase` una sola vez al volver del pago. La ruta /api/premium/claim solo redirige con
 * `?checkout=success` cuando el pago está confirmado por el webhook y la compra se reclama por primera vez
 * (las recargas o reclamaciones repetidas llevan otro valor). Se limpia el parámetro de la URL tras leerlo.
 * Sin consentimiento de analítica no se envía nada (analytics.track devuelve false).
 */
export function PremiumPurchaseTracker() {
    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.get("checkout") !== "success") return;
        url.searchParams.delete("checkout");
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
        try {
            if (window.sessionStorage.getItem(PURCHASE_TRACKED_KEY)) return;
        } catch {
            // sessionStorage no disponible: se envía igualmente, la limpieza de la URL evita repeticiones.
        }
        const sent = analytics.track("purchase", {
            transaction_id: `premium-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
            value: PREMIUM_PRODUCT_PRICE,
            currency: "EUR",
            product_name: PREMIUM_PRODUCT_NAME,
            source_page: window.location.pathname,
        });
        if (sent) {
            try {
                window.sessionStorage.setItem(PURCHASE_TRACKED_KEY, "1");
            } catch {
                // sin efecto
            }
        }
    }, []);
    return null;
}

export function PremiumLink({ ctaLocation, className, children }: {
    ctaLocation: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={PREMIUM_PATH}
            onClick={() =>
                analytics.track("premium_product_cta_clicked", {
                    source_page: window.location.pathname,
                    cta_location: ctaLocation,
                    destination_path: PREMIUM_PATH,
                    product_name: PREMIUM_PRODUCT_NAME,
                    product_price: PREMIUM_PRODUCT_PRICE,
                })
            }
            className={className}
        >
            {children}
        </Link>
    );
}
