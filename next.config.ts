import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  trailingSlash: false,
  async redirects() {
    // Fase 0.1 pSEO: unifica /es/... (locale por defecto con prefijo) en la URL canónica sin prefijo.
    // Se resuelve en next.config (antes del middleware de next-intl) para emitir 301/308 permanente.
    return [
      {
        source: "/es",
        destination: "/",
        permanent: true,
      },
      {
        source: "/es/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://* https://www.google-analytics.com; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://vitals.vercel-insights.com https://www.google-analytics.com https://region1.google-analytics.com; frame-src 'none'; object-src 'none';",
          },
        ],
      },
      {
        // Archivos sin valor de búsqueda: se siguen sirviendo pero no deben entrar en el índice.
        source: "/manifest.webmanifest",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      {
        source: "/docs/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      {
        // Premium pack endpoints (claim/download carry one-time ids or redirect to signed URLs):
        // never leak the URL through the Referer header. Declared after the global rule so it wins.
        source: "/api/premium/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
