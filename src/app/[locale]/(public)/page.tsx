import type { Metadata } from "next";
import {
  Hero,
  Features,
  HowItWorks,
  FAQ,
  SeoContent,
  SavingsSimulator,
  AlternativesSection,
  ToolsSection,
} from "@/components/landing";
import dynamic from "next/dynamic";

const DynamicSavingsSimulator = dynamic(() => import("@/components/landing").then(mod => mod.SavingsSimulator));
const DynamicAlternativesSection = dynamic(() => import("@/components/landing").then(mod => mod.AlternativesSection));
const DynamicFAQ = dynamic(() => import("@/components/landing").then(mod => mod.FAQ));

import { getTranslations, setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import * as S from "@/lib/seo/jsonld";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Landing.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}`.replace(/([^:]\/)\/+/g, "$1"),
      languages: {
        "es": "https://www.metodokakebo.com",
        "en": "https://www.metodokakebo.com/en",
        "x-default": "https://www.metodokakebo.com"
      }
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "website",
      // Misma URL que la canonical: el español no lleva prefijo (/es redirige con 308 a /).
      url: locale === 'es' ? '/' : `/${locale}`,
      siteName: "MetodoKakebo.com",
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Landing' });

  // JSON-LD: un único @graph. El FAQPage usa las 5 preguntas que se ven en pantalla (namespace FAQ, el mismo que el componente FAQ).
  const loc: S.Locale = locale === 'en' ? 'en' : 'es';
  const tFaq = await getTranslations({ locale, namespace: 'FAQ' });
  const faq = (['q1', 'q2', 'q3', 'q4', 'q5'] as const).map((k) => ({
    question: tFaq(`questions.${k}.question`),
    answer: tFaq(`questions.${k}.answer`),
  }));
  const graph = S.graph([
    ...S.core(loc),
    ...S.webPage({ locale: loc, path: '', name: t('meta.title'), description: t('meta.description'), mainEntityId: S.ids.app, about: ['kakeibo'] }),
    S.webApplication({
      id: S.ids.app,
      name: 'Kakebo AI',
      url: S.BASE_URL,
      description: S.siteCopy[loc].appDescription,
      featureList: S.siteCopy[loc].appFeatures,
      inLanguage: loc,
      operatingSystem: 'Web, PWA',
      about: ['kakeibo'],
    }),
    S.faqPage(S.localeUrl(loc, ''), faq, loc),
  ]);
  return (
    <main className="min-h-screen overflow-x-hidden">

      {/* Add padding to account for fixed navbar */}
      <div className="pt-20">
        <Hero />

        <div id="features">
          <Features />
        </div>

        <DynamicSavingsSimulator />

        <div id="how-it-works">
          <HowItWorks />
        </div>


        {/* SEO Content - Kakebo Method Explanation */}
        <section className="relative py-16 bg-sakura">
          <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
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
          <div className="mx-auto w-full max-w-6xl px-4">
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

        <ToolsSection />

        <div id="faq">
          <DynamicFAQ />
        </div>

        <SeoContent />

        <JsonLd graph={graph} />
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
