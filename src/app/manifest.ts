import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Kakebo AI: Finanzas Zen',
        short_name: 'Kakebo AI',
        description: 'Gestión financiera minimalista con Inteligencia Artificial.',
        start_url: '/app',
        display: 'standalone',
        background_color: '#fafaf9', // stone-50
        theme_color: '#fafaf9', // stone-50
        icons: [
            {
                src: '/icon.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
