"use client";

import React, { useEffect } from "react";
import { Link } from "@/i18n/routing";
import { analytics } from "@/lib/analytics";

export const PREMIUM_PRODUCT_NAME = "Kakebo Master System";
export const PREMIUM_PRODUCT_PRICE = 9.9;
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
