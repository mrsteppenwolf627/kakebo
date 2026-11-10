import { MetadataRoute } from 'next'

// URL canónica fija: el sitemap no debe depender de una variable de entorno (el build local generaba localhost).
const PRODUCTION_URL = 'https://www.metodokakebo.com';

// El idioma por defecto (es) no lleva prefijo y el inglés usa /en: cada regla se declara para ambos.
const PREFIXES = ['', '/en'];

// REGLA DE ORO: una ruta con noindex (metadata `robots` o cabecera X-Robots-Tag) NUNCA puede estar en `disallow`.
// Si Googlebot no puede descargar el documento no ve el noindex y puede indexar la URL sin snippet.
// Por eso NO se bloquean aquí (todas sirven noindex): /app/* (layout), /auth/callback (layout), /login (layout) y /docs/* (X-Robots-Tag).
// Solo se bloquean rutas sin página propia: redirecciones heredadas hacia /app/* (307) y /api/*.
// "$" evita bloquear rutas públicas futuras que empiecen igual.
const LEGACY_REDIRECT_PATHS = ['/history', '/settings', '/new$', '/new?'];

export default function robots(): MetadataRoute.Robots {
    // Despliegues de preview: no se rastrea nada (producción y desarrollo local siguen la regla normal).
    if (process.env.VERCEL_ENV === 'preview') {
        return { rules: { userAgent: '*', disallow: '/' } };
    }

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                ...PREFIXES.flatMap((prefix) => LEGACY_REDIRECT_PATHS.map((path) => `${prefix}${path}`)),
                // Parámetros de campaña sin contenido propio en páginas INDEXABLES (la canonical ya los descarta).
                // Se retiran '?mode=' (variantes de /login, que lleva noindex) y '?ym=' (panel /app, noindex): bloquearlas ocultaría el noindex.
                '/*?utm_',
                '/*&utm_',
            ],
        },
        sitemap: `${PRODUCTION_URL}/sitemap.xml`,
    }
}
