import { MetadataRoute } from 'next'
import { getBlogPosts } from '@/lib/blog';
import { routing } from '@/i18n/routing';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.metodokakebo.com';
    const posts = getBlogPosts();
    const locales = routing.locales;

    const coreRoutes = [
        { path: '', priority: 1, changeFrequency: 'weekly' as const },
        { path: '/tutorial', priority: 0.8, changeFrequency: 'monthly' as const },
        { path: '/sobre-nosotros', priority: 0.7, changeFrequency: 'monthly' as const },
        { path: '/blog', priority: 0.8, changeFrequency: 'weekly' as const },
        { path: '/herramientas/regla-50-30-20', priority: 0.9, changeFrequency: 'weekly' as const },
        { path: '/herramientas/calculadora-inflacion', priority: 0.9, changeFrequency: 'weekly' as const },
        { path: '/herramientas/calculadora-ahorro', priority: 0.9, changeFrequency: 'weekly' as const },
        { path: '/login', priority: 0.8, changeFrequency: 'monthly' as const },
        { path: '/privacy', priority: 0.5, changeFrequency: 'yearly' as const },
        { path: '/terms', priority: 0.5, changeFrequency: 'yearly' as const },
        { path: '/cookies', priority: 0.5, changeFrequency: 'yearly' as const },
    ];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // Add localized core routes
    coreRoutes.forEach((route) => {
        locales.forEach((locale) => {
            sitemapEntries.push({
                url: `${baseUrl}/${locale}${route.path}`,
                lastModified: new Date(),
                changeFrequency: route.changeFrequency,
                priority: route.priority,
                alternates: {
                    languages: locales.reduce((acc, l) => {
                        acc[l] = `${baseUrl}/${l}${route.path}`;
                        return acc;
                    }, {} as Record<string, string>)
                }
            });
        });
    });

    // Add localized blog posts
    posts.forEach((post) => {
        locales.forEach((locale) => {
            sitemapEntries.push({
                url: `${baseUrl}/${locale}/blog/${post.slug}`,
                lastModified: new Date(post.frontmatter.date),
                changeFrequency: 'monthly',
                priority: 0.7,
                alternates: {
                    languages: locales.reduce((acc, l) => {
                        acc[l] = `${baseUrl}/${l}/blog/${post.slug}`;
                        return acc;
                    }, {} as Record<string, string>)
                }
            });
        });
    });

    return sitemapEntries;
}
