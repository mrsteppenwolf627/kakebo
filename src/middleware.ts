import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// /plantillas/* is Spanish-only (/en/plantillas/* is a 404), so its responses must not
// advertise hreflang alternates in the Link header. Everything else keeps the default.
const spanishOnlyMiddleware = createMiddleware({ ...routing, alternateLinks: false });

function isSpanishOnlyPath(pathname: string): boolean {
  return pathname === '/plantillas' || pathname.startsWith('/plantillas/');
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
