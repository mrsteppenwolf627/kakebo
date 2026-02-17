export default function SoftwareAppJsonLd() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Kakebo AI",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web, iOS, Android",
        "offers": {
            "@type": "Offer",
            "price": "3.99",
            "priceCurrency": "EUR"
        },
        "description": "Aplicación de gestión financiera personal basada en el método japonés Kakebo e Inteligencia Artificial.",
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
