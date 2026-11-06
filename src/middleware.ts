import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// /plantillas/* and /ahorro-entrada-vivienda/* are Spanish-only (their /en/ versions are a 404), so their
// responses must not advertise hreflang alternates in the Link header. Everything else keeps the default.
const spanishOnlyMiddleware = createMiddleware({ ...routing, alternateLinks: false });

function isSpanishOnlyPath(pathname: string): boolean {
  return (
    pathname === '/plantillas' ||
    pathname.startsWith('/plantillas/') ||
    pathname === '/ahorro-entrada-vivienda' ||
    pathname.startsWith('/ahorro-entrada-vivienda/')
  );
}

export default function middleware(request: NextRequest) {
  return isSpanishOnlyPath(request.nextUrl.pathname)
    ? spanishOnlyMiddleware(request)
    : intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
