import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { PremiumViewTracker } from "@/components/premium/PremiumTracking";
import { PremiumPurchaseButton } from "@/components/premium/PremiumPurchaseButton";
import { isPremiumCommerceEnabled } from "@/lib/premium/config";

const PRODUCT_SLUG = "herramientas/plantilla-kakebo-excel-premium";
const BASE_URL = "https://www.metodokakebo.com";
const PREVIEW_DIR = "images/products/kakebo-premium";
const PRODUCT_NAME = "Kakebo Master System";

const PREVIEWS = {
  panel: { src: `/${PREVIEW_DIR}/panel.png`, width: 1740, height: 1180 },
  portada: { src: `/${PREVIEW_DIR}/portada.png`, width: 960, height: 940 },
} as const;

type Locale = "es" | "en";

const content = {
  es: {
    meta: {
      title: "Plantilla Kakebo Excel Premium | Sistema completo para ahorrar",
      description:
        "Descubre una plantilla Kakebo Excel premium para planificar tus ingresos, controlar tus gastos, revisar cada semana y mejorar tus decisiones de ahorro durante todo el año.",
      ogAlt: "Panel de control de Kakebo Master System, plantilla Kakebo Excel premium",
    },
    home: "Inicio",
    tools: "Herramientas",
    eyebrow: "Plantilla Kakebo Excel Premium",
    h1: "Más claridad para tu dinero. Menos improvisación.",
    subtitle:
      "Kakebo Master System es un sistema Excel completo para planificar, registrar, revisar y aprender de tus decisiones cada mes.",
    status: "Producto en preparación",
    price: "Precio previsto: 9,90 €",
    statusNote:
      "Todavía no se cobra nada: el checkout y la entrega segura se activarán próximamente.",
    freeCta: "Volver a la plantilla gratuita",
    purchase: {
      soon: "Próximamente",
      soonNote: "El acceso premium estará disponible pronto.",
      buy: "Comprar Kakebo Master System",
      pending: "Procesando…",
      unavailable: "El checkout todavía no está disponible: el pago aún no está configurado.",
    },
    previewAlt: {
      panel: "Panel de control de Kakebo Master System con presupuesto, gasto real y evolución mensual",
      portada: "Portada de Kakebo Master System con los pasos para usar el sistema",
    },
    answer:
      "La Plantilla Kakebo Excel Premium es un sistema de organización financiera personal que combina planificación mensual, registro de gastos, dashboard, objetivos de ahorro y revisión periódica en un único sistema de Excel. Se llama Kakebo Master System, no usa macros y está diseñada para Microsoft Excel y preparada para funcionar en Google Sheets sin macros, pendiente de validación con la versión final.",
    what: {
      title: "Qué es Kakebo Master System",
      body: [
        "Kakebo Master System es una plantilla de Excel basada en el método Kakebo japonés: primero planificas el mes, después registras lo que gastas, revisas cada semana y cierras el mes con una reflexión.",
        "Está pensada para quien ya conoce la plantilla gratuita y quiere un sistema anual con panel de control, objetivos de ahorro, gastos recurrentes, cuentas y patrimonio, o para quien empieza y prefiere una estructura completa desde el primer día.",
      ],
    },
    problem: {
      title: "Qué problema resuelve",
      body: [
        "Una hoja de gastos básica te dice lo que ya ha pasado. Cuando el control del dinero se limita a anotar importes, es fácil abandonarlo a las pocas semanas porque no hay un ritmo de planificación, revisión y ajuste.",
        "Kakebo Master System añade ese ritmo: decides el presupuesto al empezar, registras con pocos campos (fecha, tipo, importe y categoría), revisas cada semana y conviertes lo aprendido en una decisión concreta para el mes siguiente. No promete resultados económicos; ordena el proceso para que puedas mantener el hábito.",
      ],
    },
    includes: {
      title: "Qué incluye",
      groups: [
        ["Planificación", ["Configuración inicial editable", "Ingresos", "Gastos fijos", "Presupuesto mensual", "Categorías Kakebo"]],
        ["Registro", ["Registro estructurado de gastos e ingresos", "Gastos recurrentes", "Cuentas", "Diseñada para Excel y preparada para Google Sheets, pendiente de validación"]],
        ["Análisis", ["Dashboard visual", "Evolución del ahorro", "Comparación entre presupuesto y gasto real", "Objetivos de ahorro", "Cuentas y patrimonio"]],
        ["Método", ["Revisión semanal", "Reflexión mensual", "Tutorial PDF visual paso a paso", "Flujo anual completo"]],
      ] as [string, string[]][],
    },
    how: {
      title: "Cómo funciona el ciclo Kakebo",
      steps: [
        "Configura tu punto de partida.",
        "Planifica el mes.",
        "Registra tus movimientos.",
        "Revisa tus semanas.",
        "Cierra el mes.",
        "Ajusta el siguiente ciclo.",
      ],
    },
    dashboard: {
      title: "Vista previa del dashboard",
      caption:
        "El panel de control compara presupuesto y gasto real por categoría y muestra la evolución mensual. Los datos de la captura (enero de 2026) son ejemplos ilustrativos: no son datos de usuarios reales, no representan resultados garantizados y sirven únicamente para mostrar el funcionamiento visual del sistema.",
    },
    cover: {
      title: "Vista previa de la portada",
      caption:
        "La portada resume los pasos de uso y las reglas del sistema: entrada rápida, ahorro primero, cuatro categorías, privacidad y reflexión.",
    },
    compare: {
      title: "Plantilla gratuita frente a premium",
      intro:
        "La plantilla gratuita es una buena opción para empezar y seguirá disponible. Kakebo Master System es un sistema más completo para quien quiere trabajar con el método durante todo el año.",
      free: {
        name: "Plantilla gratuita",
        price: "Sin coste",
        items: ["Buena opción para empezar", "Descarga inmediata", "Estructura básica", "Sin registro"],
        cta: "Ver la plantilla gratuita",
      },
      plus: {
        name: PRODUCT_NAME,
        price: "Precio previsto: 9,90 €",
        items: ["Sistema anual completo", "Dashboard", "Objetivos de ahorro", "Cuentas y patrimonio", "Revisiones semanales y mensuales", "Tutorial PDF visual"],
        badge: "En preparación",
      },
    },
    compat: {
      title: "Compatibilidad y funcionamiento",
      items: [
        ["Excel", "Diseñada para Microsoft Excel moderno."],
        ["Google Sheets", "Diseñada para Microsoft Excel y preparada para funcionar en Google Sheets sin macros, pendiente de validación con la versión final."],
        ["Sin macros", "No utiliza macros ni requiere instalar software adicional."],
        ["Archivos previstos", "Está previsto entregar el archivo de Excel y un tutorial PDF visual paso a paso."],
        ["Privacidad", "No hay conexión bancaria: tus datos permanecen en tu archivo o en tu Google Drive."],
        ["Constancia", "Diseñada para trabajar con constancia, no para prometer resultados mágicos."],
      ] as [string, string][],
    },
    faq: {
      title: "Preguntas frecuentes",
      items: [
        ["¿Qué es la Plantilla Kakebo Excel Premium?", "Es un sistema de Excel llamado Kakebo Master System que combina planificación mensual, registro de gastos, dashboard, objetivos de ahorro y revisión periódica según el método Kakebo."],
        ["¿Para quién sirve?", "Para quien quiere llevar sus finanzas personales con un método estructurado durante todo el año, tanto si ya usa la plantilla gratuita como si empieza desde cero."],
        ["¿Qué diferencia hay entre la versión gratuita y la premium?", "La gratuita tiene una estructura básica y es suficiente para empezar. La premium añade un sistema anual con dashboard, objetivos, gastos recurrentes, cuentas y patrimonio, revisiones y un tutorial PDF visual."],
        ["¿Funciona con Excel y con Google Sheets?", "Está diseñada para Microsoft Excel y preparada para funcionar en Google Sheets sin macros, pendiente de validación con la versión final."],
        ["¿Utiliza macros?", "No. No utiliza macros ni requiere instalar software adicional."],
        ["¿Qué archivos recibirá el comprador?", "Está previsto que incluya el archivo de Excel y un tutorial PDF visual paso a paso. La entrega segura todavía no está activa."],
        ["¿Cuánto cuesta y cuándo puedo comprarla?", "El precio previsto es de 9,90 €. Todavía no se puede comprar: el pago con Stripe no está conectado y la compra y la descarga segura se activarán más adelante."],
        ["¿Garantiza que ahorraré?", "No. Es una herramienta de organización: el resultado depende de tus decisiones y de la constancia con la que la uses."],
      ] as [string, string][],
    },
    state: {
      title: "Estado actual del producto",
      body: [
        "Kakebo Master System está en preparación. El precio previsto es de 9,90 €.",
        "Stripe todavía no está conectado: la compra y la descarga segura se activarán posteriormente, y hasta entonces no hay compra ni descarga del producto premium.",
      ],
    },
    finalCta: {
      title: "Empieza hoy con la plantilla gratuita",
      body: "La plantilla gratuita es válida para empezar y está disponible ahora mismo.",
    },
    productDescription:
      "Plantilla Kakebo Excel premium para planificar ingresos, registrar gastos, revisar cada semana y definir objetivos de ahorro. Sin macros; diseñada para Excel y preparada para Google Sheets, pendiente de validación con la versión final.",
  },
  en: {
    meta: {
      title: "Premium Kakebo Excel Template | Complete savings system",
      description:
        "A complete Kakebo Excel template to plan income, track expenses, review your habits and improve your savings decisions throughout the year.",
      ogAlt: "Kakebo Master System dashboard, a premium Kakebo Excel template",
    },
    home: "Home",
    tools: "Tools",
    eyebrow: "Premium Kakebo Excel Template",
    h1: "More clarity for your money. Less improvisation.",
    subtitle:
      "Kakebo Master System is a complete Excel system to plan, track, review and learn from your monthly decisions.",
    status: "Product in preparation",
    price: "Planned price: €9.90",
    statusNote:
      "Nothing is charged yet: checkout and secure delivery will be enabled soon.",
    freeCta: "Back to the free template",
    purchase: {
      soon: "Coming soon",
      soonNote: "Premium access will be available soon.",
      buy: "Buy Kakebo Master System",
      pending: "Processing…",
      unavailable: "Checkout is not available yet: payments are not configured.",
    },
    previewAlt: {
      panel: "Kakebo Master System dashboard with budget, actual spending and monthly progress",
      portada: "Kakebo Master System cover with the steps to use the system",
    },
    answer:
      "The Premium Kakebo Excel Template is a personal finance organization system that combines monthly planning, expense tracking, a dashboard, savings goals and regular reviews in a single Excel system. It is called Kakebo Master System, uses no macros and is designed for Microsoft Excel and prepared to work in Google Sheets without macros, pending validation with the final version.",
    what: {
      title: "What is Kakebo Master System",
      body: [
        "Kakebo Master System is an Excel template based on the Japanese Kakebo method: you plan the month first, then log what you spend, review every week and close the month with a reflection.",
        "It is meant for people who already know the free template and want a yearly system with a dashboard, savings goals, recurring expenses, accounts and net worth, or for beginners who prefer a complete structure from day one.",
      ],
    },
    problem: {
      title: "What problem it solves",
      body: [
        "A basic expense sheet tells you what has already happened. When money tracking is only about writing down amounts, it is easy to drop after a few weeks because there is no rhythm of planning, review and adjustment.",
        "Kakebo Master System adds that rhythm: you set the budget at the start, log with few fields (date, type, amount and category), review every week and turn what you learned into a concrete decision for next month. It does not promise financial results; it organizes the process so you can keep the habit.",
      ],
    },
    includes: {
      title: "What's included",
      groups: [
        ["Planning", ["Editable initial setup", "Income", "Fixed expenses", "Monthly budget", "Kakebo categories"]],
        ["Tracking", ["Structured expense and income log", "Recurring expenses", "Accounts", "Designed for Excel and prepared for Google Sheets, pending validation"]],
        ["Analysis", ["Visual dashboard", "Savings progress", "Budget vs. actual comparison", "Savings goals", "Accounts and net worth"]],
        ["Method", ["Weekly review", "Monthly reflection", "Visual step-by-step PDF tutorial", "Full yearly workflow"]],
      ] as [string, string[]][],
    },
    how: {
      title: "How the Kakebo cycle works",
      steps: [
        "Set your starting point.",
        "Plan the month.",
        "Log your transactions.",
        "Review your weeks.",
        "Close the month.",
        "Adjust the next cycle.",
      ],
    },
    dashboard: {
      title: "Dashboard preview",
      caption:
        "The dashboard compares budget and actual spending by category and shows monthly progress. The data in the screenshot (January 2026) is illustrative sample data: it is not real user data, it does not represent guaranteed results, and it only shows how the system works visually.",
    },
    cover: {
      title: "Cover preview",
      caption:
        "The cover summarizes the steps and the rules of the system: quick entry, savings first, four categories, privacy and reflection.",
    },
    compare: {
      title: "Free template vs. premium",
      intro:
        "The free template is a good way to get started and will stay available. Kakebo Master System is a more complete system for anyone who wants to work with the method all year long.",
      free: {
        name: "Free template",
        price: "No cost",
        items: ["A good way to get started", "Instant download", "Basic structure", "No sign-up"],
        cta: "See the free template",
      },
      plus: {
        name: PRODUCT_NAME,
        price: "Planned price: €9.90",
        items: ["Complete yearly system", "Dashboard", "Savings goals", "Accounts and net worth", "Weekly and monthly reviews", "Visual PDF tutorial"],
        badge: "In preparation",
      },
    },
    compat: {
      title: "Compatibility and how it works",
      items: [
        ["Excel", "Designed for modern Microsoft Excel."],
        ["Google Sheets", "Designed for Microsoft Excel and prepared to work in Google Sheets without macros, pending validation with the final version."],
        ["No macros", "It uses no macros and needs no extra software."],
        ["Planned files", "The plan is to deliver the Excel file and a visual step-by-step PDF tutorial."],
        ["Privacy", "There is no bank connection: your data stays in your file or in your Google Drive."],
        ["Consistency", "Built for steady habits, not for promising miracle results."],
      ] as [string, string][],
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        ["What is the Premium Kakebo Excel Template?", "It is an Excel system called Kakebo Master System that combines monthly planning, expense tracking, a dashboard, savings goals and regular reviews following the Kakebo method."],
        ["Who is it for?", "For anyone who wants to manage personal finances with a structured method all year long, whether they already use the free template or are starting from scratch."],
        ["What is the difference between the free and the premium version?", "The free one has a basic structure and is enough to get started. The premium one adds a yearly system with a dashboard, goals, recurring expenses, accounts and net worth, reviews and a visual PDF tutorial."],
        ["Does it work with Excel and Google Sheets?", "Designed for Microsoft Excel and prepared to work in Google Sheets without macros, pending validation with the final version."],
        ["Does it use macros?", "No. It uses no macros and needs no extra software."],
        ["Which files will buyers receive?", "The plan is to include the Excel file and a visual step-by-step PDF tutorial. Secure delivery is not active yet."],
        ["How much does it cost and when can I buy it?", "The planned price is €9.90. It cannot be bought yet: Stripe payments are not connected, and purchase and secure download will be enabled later."],
        ["Does it guarantee that I will save money?", "No. It is an organization tool: results depend on your decisions and on how consistently you use it."],
      ] as [string, string][],
    },
    state: {
      title: "Current product status",
      body: [
        "Kakebo Master System is in preparation. The planned price is €9.90.",
        "Stripe is not connected yet: purchase and secure download will be enabled later, and until then the premium product cannot be bought or downloaded.",
      ],
    },
    finalCta: {
      title: "Start today with the free template",
      body: "The free template is a valid way to get started and is available right now.",
    },
    productDescription:
      "Premium Kakebo Excel template to plan income, track expenses, review every week and set savings goals. No macros; designed for Excel and prepared for Google Sheets, pending validation with the final version.",
  },
} as const;

function getContent(locale: string) {
  return content[(locale === "en" ? "en" : "es") as Locale];
}

function localizedUrl(locale: string, slug: string) {
  const prefix = locale === "es" ? "" : `/${locale}`;
  return `${BASE_URL}${prefix}${slug ? `/${slug}` : ""}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = getContent(locale);
  const url = localizedUrl(locale, PRODUCT_SLUG);
  const image = {
    url: `${BASE_URL}${PREVIEWS.panel.src}`,
    width: PREVIEWS.panel.width,
    height: PREVIEWS.panel.height,
    alt: c.meta.ogAlt,
  };

  return {
    title: c.meta.title,
    description: c.meta.description,
    alternates: {
      canonical: url,
      languages: {
        es: localizedUrl("es", PRODUCT_SLUG),
        en: localizedUrl("en", PRODUCT_SLUG),
        "x-default": localizedUrl("es", PRODUCT_SLUG),
      },
    },
    openGraph: {
      type: "website",
      title: c.meta.title,
      description: c.meta.description,
      url,
      siteName: "MetodoKakebo.com",
      locale: locale === "en" ? "en_US" : "es_ES",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: c.meta.title,
      description: c.meta.description,
      images: [image.url],
    },
    // Keep out of the index until checkout and secure delivery exist.
    robots: { index: false, follow: true },
  };
}

export default async function PremiumTemplatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const c = getContent(locale);
  const { panel, portada } = PREVIEWS;
  const pageUrl = localizedUrl(locale, PRODUCT_SLUG);
  const commerceEnabled = isPremiumCommerceEnabled();

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: c.home, item: localizedUrl(locale, "") },
      { "@type": "ListItem", position: 2, name: c.tools, item: localizedUrl(locale, "herramientas") },
      { "@type": "ListItem", position: 3, name: PRODUCT_NAME, item: pageUrl },
    ],
  };

  // Product without `offers`: checkout is not active, so no price or availability is declared.
  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: PRODUCT_NAME,
    alternateName: locale === "en" ? "Premium Kakebo Excel Template" : "Plantilla Kakebo Excel Premium",
    description: c.productDescription,
    image: [`${BASE_URL}${panel.src}`, `${BASE_URL}${portada.src}`],
    url: pageUrl,
    category: "Spreadsheet template",
    brand: { "@type": "Brand", name: "MetodoKakebo.com" },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.items.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  const sectionTitle = "text-3xl font-serif text-foreground";
  const card = "rounded-2xl border border-border bg-card p-6 shadow-sm";
  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2";

  return (
    <div className="min-h-screen bg-sakura">
      <PremiumViewTracker />
      {[breadcrumbs, product, faqSchema].map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto space-y-24">
          {/* 1. Hero */}
          <section className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{c.eyebrow}</p>
              <h1 className="text-4xl md:text-5xl font-serif text-foreground leading-tight">{c.h1}</h1>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">{c.subtitle}</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-block rounded-full border border-primary/40 bg-card px-4 py-1.5 text-sm font-medium text-foreground">
                  {c.status}
                </span>
                <span className="text-sm text-muted-foreground">{c.price}</span>
              </div>
              <p className="text-sm text-muted-foreground">{c.statusNote}</p>
              <PremiumPurchaseButton enabled={commerceEnabled} labels={c.purchase} />
              <Link
                href="/blog/plantilla-kakebo-excel"
                className={`inline-block rounded-full border border-border bg-card px-8 py-3 font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 ${focusRing}`}
              >
                {c.freeCta}
              </Link>
            </div>
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <Image
                src={panel.src}
                alt={c.previewAlt.panel}
                width={panel.width}
                height={panel.height}
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="h-auto w-full"
              />
            </div>
          </section>

          {/* Direct answer */}
          <section className="rounded-3xl border border-primary/30 bg-card p-8 shadow-sm md:p-10">
            <p className="text-lg leading-relaxed text-foreground font-light">{c.answer}</p>
          </section>

          {/* 2. What it is */}
          <section className="max-w-3xl space-y-4">
            <h2 className={sectionTitle}>{c.what.title}</h2>
            {c.what.body.map((p) => (
              <p key={p} className="text-muted-foreground font-light leading-relaxed">{p}</p>
            ))}
          </section>

          {/* 3. Problem */}
          <section className="max-w-3xl space-y-4">
            <h2 className={sectionTitle}>{c.problem.title}</h2>
            {c.problem.body.map((p) => (
              <p key={p} className="text-muted-foreground font-light leading-relaxed">{p}</p>
            ))}
          </section>

          {/* 4. Includes */}
          <section className="space-y-8">
            <h2 className={sectionTitle}>{c.includes.title}</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {c.includes.groups.map(([group, items]) => (
                <div key={group} className={card}>
                  <h3 className="mb-4 font-serif text-xl text-foreground">{group}</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden className="text-primary">·</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Cycle */}
          <section className="space-y-8">
            <h2 className={sectionTitle}>{c.how.title}</h2>
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {c.how.steps.map((step, i) => (
                <li key={step} className={card}>
                  <span aria-hidden className="mb-2 block font-serif text-3xl italic text-primary">{i + 1}</span>
                  <span className="text-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* 6. Dashboard preview */}
          <section className="space-y-6">
            <h2 className={sectionTitle}>{c.dashboard.title}</h2>
            <figure className="space-y-3">
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                <Image
                  src={panel.src}
                  alt={c.previewAlt.panel}
                  width={panel.width}
                  height={panel.height}
                  sizes="(min-width: 1024px) 1024px, 100vw"
                  className="h-auto w-full"
                />
              </div>
              <figcaption className="text-sm text-muted-foreground">{c.dashboard.caption}</figcaption>
            </figure>
          </section>

          {/* 7. Cover preview */}
          <section className="space-y-6">
            <h2 className={sectionTitle}>{c.cover.title}</h2>
            <figure className="mx-auto max-w-xl space-y-3">
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                <Image
                  src={portada.src}
                  alt={c.previewAlt.portada}
                  width={portada.width}
                  height={portada.height}
                  sizes="(min-width: 640px) 576px, 100vw"
                  className="h-auto w-full"
                />
              </div>
              <figcaption className="text-sm text-muted-foreground">{c.cover.caption}</figcaption>
            </figure>
          </section>

          {/* 8. Free vs premium */}
          <section className="space-y-8">
            <div className="max-w-2xl space-y-3">
              <h2 className={sectionTitle}>{c.compare.title}</h2>
              <p className="text-muted-foreground font-light leading-relaxed">{c.compare.intro}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col rounded-2xl border border-border bg-card p-8 shadow-sm">
                <h3 className="font-serif text-2xl text-foreground">{c.compare.free.name}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{c.compare.free.price}</p>
                <ul className="mb-6 flex-1 space-y-2 text-sm text-muted-foreground">
                  {c.compare.free.items.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
                <Link
                  href="/blog/plantilla-kakebo-excel"
                  className={`self-start font-bold text-foreground underline decoration-primary underline-offset-4 hover:decoration-2 ${focusRing}`}
                >
                  {c.compare.free.cta} →
                </Link>
              </div>
              <div className="flex flex-col rounded-2xl border border-primary/40 bg-card p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-serif text-2xl text-foreground">{c.compare.plus.name}</h3>
                  <span className="whitespace-nowrap rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                    {c.compare.plus.badge}
                  </span>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">{c.compare.plus.price}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {c.compare.plus.items.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 9. Compatibility */}
          <section className="space-y-6">
            <h2 className={sectionTitle}>{c.compat.title}</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              {c.compat.items.map(([term, desc]) => (
                <div key={term} className={card}>
                  <dt className="mb-1 font-bold text-foreground">{term}</dt>
                  <dd className="text-sm text-muted-foreground">{desc}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* 10. FAQ (visible, mirrors FAQPage schema) */}
          <section className="space-y-6">
            <h2 className={sectionTitle}>{c.faq.title}</h2>
            <div className="space-y-4">
              {c.faq.items.map(([question, answer]) => (
                <div key={question} className={card}>
                  <h3 className="mb-2 font-bold text-foreground">{question}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 11. Status + 12. Free template link */}
          <section className="space-y-6 rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
            <h2 className={sectionTitle}>{c.state.title}</h2>
            {c.state.body.map((p) => (
              <p key={p} className="mx-auto max-w-xl font-light text-muted-foreground">{p}</p>
            ))}
            <div className="flex justify-center text-center">
              <PremiumPurchaseButton enabled={commerceEnabled} labels={c.purchase} />
            </div>
            <div className="space-y-4 pt-4">
              <h3 className="font-serif text-2xl text-foreground">{c.finalCta.title}</h3>
              <p className="mx-auto max-w-xl font-light text-muted-foreground">{c.finalCta.body}</p>
              <Link
                href="/blog/plantilla-kakebo-excel"
                className={`inline-block rounded-full bg-primary px-10 py-4 font-bold text-primary-foreground transition-transform hover:scale-105 ${focusRing}`}
              >
                {c.freeCta}
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
