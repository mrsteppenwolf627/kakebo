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

export const metadata: Metadata = {
  title: "Kakebo: El Método Japonés para Ahorrar (App 2026)",
  description:
    "La alternativa a Excel y Fintonic que respeta tu privacidad. Sin conexión bancaria. Método Kakebo oficial con Inteligencia Artificial. Gratis 14 días.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kakebo: El Método Japonés para Ahorrar (App 2026)",
    description:
      "Olvídate de Excels complicados. Kakebo organiza tus gastos sin pedirte las claves del banco. 100% Privado y Seguro.",
    type: "website",
    url: "/",
  },
  robots: { index: true, follow: true },
};

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

        <SavingsSimulator />

        <div id="pricing">
          <PricingSection />
        </div>

        <div id="how-it-works">
          <HowItWorks />
        </div>

        <Testimonials />


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

        <AlternativesSection />

        <div id="faq">
          <FAQ />
        </div>

        <SeoContent />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": t('SEO.faqSchema.q1'),
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": t('SEO.faqSchema.a1')
                  }
                },
                {
                  "@type": "Question",
                  "name": t('SEO.faqSchema.q2'),
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": t('SEO.faqSchema.a2')
                  }
                },
                {
                  "@type": "Question",
                  "name": t('SEO.faqSchema.q3'),
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": t('SEO.faqSchema.a3')
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
