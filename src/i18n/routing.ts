import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['en', 'es'],

    // Used when no locale matches
    defaultLocale: 'es',

    // Prefix default locale (e.g. /es/about) or not (e.g. /about)
    localePrefix: 'as-needed',

    // Disable automatic locale detection via Accept-Language header.
    // Without this, browsers/bots with Accept-Language: en would be redirected
    // from /blog/... to /en/blog/..., breaking Spanish canonical URLs in GSC.
    // Language selection must be explicit via URL prefix (/en/...).
    localeDetection: false
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
    createNavigation(routing);
