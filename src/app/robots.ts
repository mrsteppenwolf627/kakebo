import { MetadataRoute } from 'next'

// URL canónica fija: el sitemap no debe depender de una variable de entorno (el build local generaba localhost).
const PRODUCTION_URL = 'https://www.metodokakebo.com';

// El idioma por defecto (es) no lleva prefijo y el inglés usa /en: cada regla se declara para ambos.
const PREFIXES = ['', '/en'];

// Rutas privadas, redirecciones heredadas hacia /app/* y archivos sin valor de búsqueda.
// "$" evita bloquear rutas públicas futuras que empiecen igual.
const PRIVATE_PATHS = ['/app$', '/app?', '/app/', '/auth/', '/history', '/settings', '/new$', '/new?'];

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
                '/docs/',
                ...PREFIXES.flatMap((prefix) => PRIVATE_PATHS.map((path) => `${prefix}${path}`)),
                // Parámetros sin contenido propio (la canonical ya los descarta): variantes de login, UTM y mes del panel.
                '/*?mode=',
                '/*&mode=',
                '/*?utm_',
                '/*&utm_',
                '/*?ym=',
            ],
        },
        sitemap: `${PRODUCTION_URL}/sitemap.xml`,
    }
}
