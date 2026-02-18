"use client";

import Error from "next/error";

// This page renders when a route is 404 and doesn't match a locale
// In our case, middleware redirects to /[locale], so this should rarely be seen
// But if it is, we show a generic 404 or redirect. 
// Ideally, we just render a simple html returning 404 status.

export default function NotFound() {
    return (
        <html lang="en">
            <body>
                <Error statusCode={404} />
            </body>
        </html>
    );
}
