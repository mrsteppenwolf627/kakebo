import { MetadataRoute } from 'next'
import { getBlogPosts } from '@/lib/blog';
import { routing } from '@/i18n/routing';

// Shared lastModified for static core routes (Home, tutorial, herramientas, legales, etc.).
// Bump this date manually whenever the actual content of one of those pages changes —
// do NOT replace with `new Date()`, which falsely marks every core route as "modified today"
// on every build regardless of whether anything changed.
const CORE_ROUTES_LAST_MODIFIED = new Date('2026-07-07');

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.metodokakebo.com';
    const posts = getBlogPosts();
    const locales = routing.locales;

    const coreRoutes = [
        { path: '', priority: 1, changeFrequency: 'weekly' as const },
        { path: '/tutorial', priority: 0.5, changeFrequency: 'monthly' as const },
        { path: '/sobre-nosotros', priority: 0.7, changeFrequency: 'monthly' as const },
        { path: '/blog', priority: 0.8, changeFrequency: 'weekly' as const },
        { path: '/herramientas', priority: 0.8, changeFrequency: 'weekly' as const },
        { path: '/herramientas/regla-50-30-20', priority: 0.9, changeFrequency: 'weekly' as const },
        { path: '/herramientas/calculadora-inflacion', priority: 0.9, changeFrequency: 'weekly' as const },
        { path: '/herramientas/calculadora-ahorro', priority: 0.9, changeFrequency: 'weekly' as const },
        { path: '/login', priority: 0.1, changeFrequency: 'yearly' as const },
        { path: '/privacy', priority: 0.1, changeFrequency: 'yearly' as const },
        { path: '/terms', priority: 0.1, changeFrequency: 'yearly' as const },
        { path: '/cookies', priority: 0.1, changeFrequency: 'yearly' as const },
    ];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // Add localized core routes
    coreRoutes.forEach((route) => {
        locales.forEach((locale) => {
            const path = route.path === '' && locale === 'es' ? '' : (locale === 'es' ? route.path : `/${locale}${route.path}`);
            sitemapEntries.push({
                url: `${baseUrl}${path}`,
                lastModified: CORE_ROUTES_LAST_MODIFIED,
                changeFrequency: route.changeFrequency,
                priority: route.priority,
                alternates: {
                    languages: locales.reduce((acc, l) => {
                        const lPath = route.path === '' && l === 'es' ? '' : (l === 'es' ? route.path : `/${l}${route.path}`);
                        acc[l] = `${baseUrl}${lPath}`;
                        return acc;
                    }, {} as Record<string, string>)
                }
            });
        });
    });

    // Build set of EN slugs that actually have a translated file AND are indexable.
    // getBlogPosts('en') only returns slugs with a real {slug}.en.mdx file, so this
    // set doubles as both an existence check and a noindex check — a slug with no
    // EN file at all never enters `enPosts` in the first place.
    const enPosts = getBlogPosts('en');
    const enIndexableSlugs = new Set(
        enPosts.filter((p) => !p.frontmatter.noindex).map((p) => p.slug)
    );

    // Add localized blog posts (skip EN URLs when no EN file exists or it's noindex)
    posts.filter((post) => !post.frontmatter.noindex).forEach((post) => {
        locales.forEach((locale) => {
            if (locale === 'en' && !enIndexableSlugs.has(post.slug)) return;

            const path = locale === 'es' ? `/blog/${post.slug}` : `/${locale}/blog/${post.slug}`;
            sitemapEntries.push({
                url: `${baseUrl}${path}`,
                lastModified: new Date(post.frontmatter.updatedDate ?? post.frontmatter.date),
                changeFrequency: 'monthly',
                priority: 0.7,
                alternates: {
                    languages: locales.reduce((acc, l) => {
                        if (l === 'en' && !enIndexableSlugs.has(post.slug)) return acc;
                        const lPath = l === 'es' ? `/blog/${post.slug}` : `/${l}/blog/${post.slug}`;
                        acc[l] = `${baseUrl}${lPath}`;
                        return acc;
                    }, {} as Record<string, string>)
                }
            });
        });
    });

    return sitemapEntries;
}
