import type { Metadata } from "next";
import {
  Navbar,
  Hero,
  Features,
  PricingSection,
  HowItWorks,
  FAQ,
  Footer,
  SeoContent,
  Testimonials,
  SavingsSimulator,
  AlternativesSection,
} from "@/components/landing";
import dynamic from "next/dynamic";

const DynamicTestimonials = dynamic(() => import("@/components/landing").then(mod => mod.Testimonials));
const DynamicSavingsSimulator = dynamic(() => import("@/components/landing").then(mod => mod.SavingsSimulator));
const DynamicAlternativesSection = dynamic(() => import("@/components/landing").then(mod => mod.AlternativesSection));
const DynamicFAQ = dynamic(() => import("@/components/landing").then(mod => mod.FAQ));

import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Landing.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        "es": "/es",
        "en": "/en",
        "x-default": "/es"
      }
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "website",
      url: `/${locale}`,
    },
    robots: { index: true, follow: true },
  };
}

import { useTranslations } from 'next-intl';

export default function PublicHomePage() {
  const t = useTranslations('Landing');
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />

      {/* Add padding to account for fixed navbar */}
      <div className="pt-20">
        <Hero />

        <div id="features">
          <Features />
        </div>

        <DynamicSavingsSimulator />

        <div id="pricing">
          <PricingSection />
        </div>

        <div id="how-it-works">
          <HowItWorks />
        </div>

        <DynamicTestimonials />


        {/* SEO Content - Kakebo Method Explanation */}
        <section className="relative py-16">
          <div className="absolute inset-0 bg-background" />
          <div className="relative z-10 mx-auto w-full max-w-5xl px-4">
            <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
              <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground mb-4">
                {t('SEO.whatIs.title')}
              </h2>

              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p dangerouslySetInnerHTML={{ __html: t.raw('SEO.whatIs.p1') }} />
                <p dangerouslySetInnerHTML={{ __html: t.raw('SEO.whatIs.p2') }} />
                <p dangerouslySetInnerHTML={{ __html: t.raw('SEO.whatIs.p3') }} />
              </div>
            </div>
          </div>
        </section>

        {/* SEO Content - Categories */}
        <section className="relative py-16 bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-4">
            <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-sm p-8 shadow-lg">
              <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground mb-6">
                {t('SEO.categories.title')}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <CategoryCard
                  title={t('SEO.categories.survival.title')}
                  desc={t('SEO.categories.survival.desc')}
                />
                <CategoryCard
                  title={t('SEO.categories.fixed.title')}
                  desc={t('SEO.categories.fixed.desc')}
                />
                <CategoryCard
                  title={t('SEO.categories.leisure.title')}
                  desc={t('SEO.categories.leisure.desc')}
                />
                <CategoryCard
                  title={t('SEO.categories.culture.title')}
                  desc={t('SEO.categories.culture.desc')}
                />
              </div>
            </div>
          </div>
        </section>

        <DynamicAlternativesSection />

        <div id="faq">
          <DynamicFAQ />
        </div>

        <SeoContent />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Kakebo AI",
              "url": "https://www.metodokakebo.com",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web, PWA, iOS, Android",
              "inLanguage": "es",
              "offers": {
                "@type": "Offer",
                "price": "3.99",
                "priceCurrency": "EUR",
                "availability": "https://schema.org/InStock",
                "priceValidUntil": "2027-01-01"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "24",
                "bestRating": "5"
              },
              "description": "App de control de gastos basada en el método japonés Kakebo. Sin conexión bancaria, 100% privado, con Agente IA integrado.",
              "screenshot": "https://www.metodokakebo.com/api/og",
              "featureList": [
                "Registro manual consciente de gastos",
                "Agente IA financiero personal",
                "Sin conexión bancaria",
                "Categorías Kakebo nativas",
                "Historial y exportación"
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "¿Realmente es gratis empezar con Kakebo AI?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sí, 100%. Puedes registrarte y usar el Plan Manual (control de gastos completo) sin pagar nada. El registro es instantáneo y no necesitas tarjeta de crédito."
                  }
                },
                {
                  "@type": "Question",
                  "name": "¿Qué incluye el trial de 14 días del Plan Pro?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "El trial te da acceso completo al Agente IA de finanzas: análisis automático, consejos personalizados, predicciones de ahorro e insights inteligentes. No se cobra hasta el día 15."
                  }
                },
                {
                  "@type": "Question",
                  "name": "¿Puedo cancelar el Plan Pro durante el trial?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sí, puedes cancelar en cualquier momento desde tu perfil. Si cancelas durante los 14 días de trial, no se cobra nada."
                  }
                },
                {
                  "@type": "Question",
                  "name": "¿Mis datos financieros están seguros en Kakebo AI?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sí. Usamos Supabase para autenticación y Stripe para pagos. Tus datos financieros están encriptados y nunca compartimos información con terceros. No nos conectamos a tu banco."
                  }
                }
              ]
            })
          }}
        />
      </div>
    </main>
  );
}

function CategoryCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50">
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
