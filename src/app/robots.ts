import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.metodokakebo.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/api/', // Hide API routes
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
