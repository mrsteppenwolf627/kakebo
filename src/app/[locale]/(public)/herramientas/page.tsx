import { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { Footer } from "@/components/landing";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Tools.Index.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://www.metodokakebo.com${locale === 'es' ? '' : '/en'}/herramientas`,
      languages: {
        "es": "https://www.metodokakebo.com/herramientas",
        "en": "https://www.metodokakebo.com/en/herramientas",
        "x-default": "https://www.metodokakebo.com/herramientas"
      }
    }
  };
}

export default async function ToolsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Tools.Index" });
  const tNav = await getTranslations({ locale, namespace: "Navigation" });

  const tools = [
    {
      title: tNav("toolsSavings"),
      description: tNav("toolsSavingsDesc"),
      href: "/herramientas/calculadora-ahorro",
      icon: "💰"
    },
    {
      title: tNav("tools503020"),
      description: tNav("tools503020Desc"),
      href: "/herramientas/regla-50-30-20",
      icon: "📊"
    },
    {
      title: tNav("toolsInflation"),
      description: tNav("toolsInflationDesc"),
      href: "/herramientas/calculadora-inflacion",
      icon: "📉"
    }
  ];

  return (
    <div className="min-h-screen bg-sakura">
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-5xl md:text-6xl font-serif text-foreground">
              {t.rich('header.title', {
                italic: (chunks) => <span className="italic text-primary">{chunks}</span>
              })}
            </h1>
            <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
              {t('header.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href as any}
                className="group bg-card border border-border p-8 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-center space-y-4"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {tool.icon}
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {tool.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
                <div className="pt-4 text-primary text-sm font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  {locale === 'es' ? 'Abrir herramienta' : 'Open tool'} →
                </div>
              </Link>
            ))}
          </div>

          {/* Plantilla Excel Promotion - Consolidation of Authority */}
          <div className="mt-20 bg-stone-900 dark:bg-stone-800 text-white p-12 rounded-3xl text-center space-y-6">
            <h2 className="text-3xl font-serif">
               {locale === 'es' ? '¿Buscas la Plantilla Kakebo en Excel?' : 'Looking for the Kakebo Excel Template?'}
            </h2>
            <p className="text-stone-300 font-light max-w-xl mx-auto text-lg">
              {locale === 'es' 
                ? 'Hemos movido nuestra famosa plantilla gratuita a una guía completa para que aprendas a usarla paso a paso.' 
                : 'We have moved our famous free template to a complete guide so you can learn how to use it step by step.'}
            </p>
            <Link
              href="/blog/plantilla-kakebo-excel"
              className="inline-block bg-white text-stone-900 px-10 py-4 rounded-full font-bold hover:bg-stone-100 transition-transform hover:scale-105"
            >
               {locale === 'es' ? 'Descargar Plantilla Gratis' : 'Download Free Template'}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
