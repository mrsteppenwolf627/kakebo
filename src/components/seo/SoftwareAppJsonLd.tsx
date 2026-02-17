export default function SoftwareAppJsonLd() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Kakebo AI",
        "description": "Aplicación de gestión financiera personal basada en el método japonés Kakebo e Inteligencia Artificial. Alternativa privada a Fintonic y Excel.",
        "applicationCategory": "FinanceApplication",
        "applicationSubCategory": "Personal Finance",
        "operatingSystem": "Web, iOS, Android",
        "softwareVersion": "3.5",
        "datePublished": "2026-02-17",
        "screenshot": "https://www.metodokakebo.com/og-image.jpg",
        "featureList": [
            "Método Kakebo Digital",
            "Copiloto IA (GPT-4o)",
            "Sin conexión bancaria (Privacidad Total)",
            "Calculadora de Inflación",
            "Regla 50/30/20",
            "Chat Financiero"
        ],
        "offers": {
            "@type": "Offer",
            "price": "3.99",
            "priceCurrency": "EUR",
            "priceValidUntil": "2026-12-31"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "150"
        },
        "author": {
            "@type": "Organization",
            "name": "Kakebo AI Team",
            "url": "https://www.metodokakebo.com"
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
