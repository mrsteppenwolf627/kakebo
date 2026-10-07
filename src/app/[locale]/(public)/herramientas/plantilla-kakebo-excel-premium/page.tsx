import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { PremiumViewTracker } from "@/components/premium/PremiumTracking";
import { PremiumPurchaseButton } from "@/components/premium/PremiumPurchaseButton";
import { isPremiumCommerceEnabled } from "@/lib/premium/config";

const PRODUCT_SLUG = "herramientas/plantilla-kakebo-excel-premium";
const FREE_TEMPLATE_PATH = "/blog/plantilla-kakebo-excel";
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
      title: "Plantilla Kakebo Excel Premium | Pack Kakebo Master System",
      description:
        "Kakebo Master System: plantilla Kakebo Excel premium, ebook y tutorial en PDF para planificar ingresos, registrar gastos y revisar cada semana. 9,90 € IVA incluido, compra única. Próximamente.",
      ogAlt: "Panel de control de Kakebo Master System, plantilla Kakebo Excel premium",
    },
    home: "Inicio",
    tools: "Herramientas",
    eyebrow: "Kakebo Master System · Pack digital",
    h1: "Plantilla Kakebo Excel premium: más claridad para tu dinero, menos improvisación",
    subtitle:
      "Kakebo Master System es un pack digital con una plantilla Excel premium, un ebook y un tutorial en PDF para planificar, registrar y revisar tu dinero cada mes.",
    status: "Próximamente",
    price: "9,90 € IVA incluido · compra única",
    statusNote: "Todavía no se cobra nada: la compra se abrirá más adelante.",
    freeCta: "Ver la plantilla gratuita",
    toolsCta: "Ver todas las herramientas",
    purchase: {
      soon: "Próximamente",
      soonNote: "La compra todavía no está disponible.",
      buy: "Comprar Kakebo Master System",
      pending: "Procesando…",
      unavailable: "La compra todavía no está disponible.",
    },
    previewAlt: {
      panel: "Panel de control de Kakebo Master System con presupuesto, gasto real y evolución mensual",
      portada: "Portada de Kakebo Master System con los pasos para usar el sistema",
    },
    answer:
      "Kakebo Master System es un pack digital de pago que reúne tres archivos: una plantilla Kakebo Excel premium, el ebook «El arte de mirar tu dinero» (unas 20 páginas) y un tutorial en PDF con instrucciones paso a paso. Cuesta 9,90 € IVA incluido, es una compra única con acceso permanente a los archivos y no hace falta crear una cuenta. La plantilla no usa macros. Todavía no se puede comprar.",
    pack: {
      title: "Qué incluye el pack",
      intro: "Una sola compra, tres archivos digitales.",
      items: [
        [
          "Plantilla Excel premium",
          "Libro de Excel (.xlsx) sin macros con 12 hojas: portada, panel de control, configuración, plan mensual, registro, revisión semanal, reflexión mensual, objetivos, gastos recurrentes, patrimonio, guía y comprobaciones.",
        ],
        [
          "Ebook «El arte de mirar tu dinero»",
          "Guía práctica de Kakebo y finanzas personales en PDF, de unas 20 páginas, para entender el método y mirar tus gastos con calma.",
        ],
        [
          "Tutorial en PDF",
          "Instrucciones de uso de la plantilla, paso a paso y con imágenes, en un PDF de 8 páginas.",
        ],
      ] as [string, string][],
    },
    what: {
      title: "Qué es Kakebo Master System",
      body: [
        "Kakebo Master System es un sistema de organización financiera personal basado en el método Kakebo japonés: primero planificas el mes, después registras lo que gastas, revisas cada semana y cierras el mes con una reflexión. La plantilla de Excel es el núcleo; el ebook y el tutorial te ayudan a entender el método y a usarla.",
        "Está pensado para quien ya conoce la plantilla gratuita y quiere un sistema anual con panel de control, objetivos de ahorro, gastos recurrentes, cuentas y patrimonio, o para quien empieza y prefiere una estructura completa desde el primer día.",
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
      title: "Qué contiene la plantilla Excel",
      groups: [
        ["Planificación", ["Configuración inicial editable", "Ingresos", "Gastos fijos", "Presupuesto mensual", "Categorías Kakebo"]],
        ["Registro", ["Registro estructurado de gastos e ingresos", "Gastos recurrentes", "Cuentas", "Diseñada para Excel y preparada para Google Sheets, pendiente de validación"]],
        ["Análisis", ["Dashboard visual", "Evolución del ahorro", "Comparación entre presupuesto y gasto real", "Objetivos de ahorro", "Cuentas y patrimonio"]],
        ["Método", ["Revisión semanal", "Reflexión mensual", "Guía dentro del libro", "Flujo anual completo"]],
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
      title: "Vista previa del panel de control",
      caption:
        "El panel de control compara presupuesto y gasto real por categoría y muestra la evolución mensual. Los datos de la captura (enero de 2026) son ejemplos ilustrativos: no son datos de usuarios reales, no representan resultados garantizados y sirven únicamente para mostrar el funcionamiento visual del sistema.",
    },
    cover: {
      title: "Vista previa de la portada",
      caption:
        "La portada resume los pasos de uso y las reglas del sistema: entrada rápida, ahorro primero, cuatro categorías, privacidad y reflexión.",
    },
    compare: {
      title: "Plantilla gratuita frente a Kakebo Master System",
      intro:
        "Son dos productos distintos. La plantilla gratuita es una buena opción para empezar, sigue disponible y no necesita compra ni registro. Kakebo Master System es un pack de pago más completo para quien quiere trabajar con el método durante todo el año.",
      free: {
        name: "Plantilla gratuita de Excel",
        price: "Sin coste",
        items: ["Buena opción para empezar", "Descarga inmediata", "Estructura básica", "Sin registro"],
        cta: "Ver la plantilla gratuita",
      },
      plus: {
        name: PRODUCT_NAME,
        price: "9,90 € IVA incluido",
        items: ["Plantilla Excel premium con panel de control", "Ebook «El arte de mirar tu dinero»", "Tutorial en PDF", "Compra única y acceso permanente", "Sin crear cuenta"],
        badge: "Próximamente",
      },
    },
    terms: {
      title: "Condiciones del pack",
      items: [
        ["Precio", "9,90 € con el IVA incluido."],
        ["Compra única", "Pagas una sola vez. No es una suscripción."],
        ["Acceso permanente", "Podrás volver a acceder a los archivos del pack cuando los necesites."],
        ["Sin cuenta", "No hace falta crear una cuenta para comprarlo."],
        ["Producto digital", "Se entrega en formato digital (Excel y PDF). No se envía nada físico."],
        ["Independiente de la aplicación", "Comprar el pack no concede funciones de la aplicación Kakebo (IA, informes) ni suscripciones: son productos distintos."],
        ["Disponibilidad", "La compra todavía no está disponible."],
      ] as [string, string][],
    },
    compat: {
      title: "Compatibilidad y funcionamiento",
      items: [
        ["Excel", "Diseñada para Microsoft Excel moderno."],
        ["Google Sheets", "Diseñada para Microsoft Excel y preparada para funcionar en Google Sheets sin macros, pendiente de validación con la versión final."],
        ["Sin macros", "No utiliza macros ni requiere instalar software adicional."],
        ["Formatos", "La plantilla es un archivo Excel (.xlsx); el ebook y el tutorial son archivos PDF."],
        ["Privacidad", "No hay conexión bancaria: tus datos permanecen en tu archivo o en tu Google Drive."],
        ["Constancia", "Diseñada para trabajar con constancia, no para prometer resultados mágicos."],
      ] as [string, string][],
    },
    faq: {
      title: "Preguntas frecuentes",
      items: [
        ["¿Qué es Kakebo Master System?", "Es un pack digital de pago con tres archivos: una plantilla Kakebo Excel premium, el ebook «El arte de mirar tu dinero» (unas 20 páginas) y un tutorial en PDF."],
        ["¿Cuánto cuesta?", "9,90 € con el IVA incluido. Es una compra única, no una suscripción."],
        ["¿Qué incluye el pack?", "La plantilla Excel premium sin macros con 12 hojas, el ebook en PDF y el tutorial en PDF con las instrucciones de uso de la plantilla."],
        ["¿Necesito crear una cuenta para comprarlo?", "No. No hace falta registrarse para comprar el pack."],
        ["¿Tendré acceso permanente a los archivos?", "Sí. La compra es única y da acceso permanente a los archivos del pack."],
        ["¿Ya se puede comprar?", "Todavía no. La compra no está disponible por ahora; cuando se abra, se anunciará en esta página."],
        ["¿Es lo mismo que la plantilla gratuita?", "No. La plantilla gratuita de Excel es otro producto: es gratuita, tiene una estructura básica y sigue disponible. Kakebo Master System es el pack de pago con la plantilla premium, el ebook y el tutorial."],
        ["¿Comprar el pack da acceso a la aplicación Kakebo o a funciones Plus?", "No. El pack son archivos independientes: no concede funciones de la aplicación (como la IA o los informes) ni ninguna suscripción."],
        ["¿Funciona con Excel y con Google Sheets?", "Está diseñada para Microsoft Excel y preparada para funcionar en Google Sheets sin macros, pendiente de validación con la versión final."],
        ["¿Utiliza macros?", "No. No utiliza macros ni requiere instalar software adicional."],
        ["¿Garantiza que ahorraré?", "No. Es una herramienta de organización: el resultado depende de tus decisiones y de la constancia con la que la uses."],
      ] as [string, string][],
    },
    state: {
      title: "Disponibilidad",
      body: ["Kakebo Master System todavía no se puede comprar. Cuando esté disponible, el precio será de 9,90 € con el IVA incluido, en compra única y con acceso permanente."],
    },
    finalCta: {
      title: "Mientras tanto, empieza con la plantilla gratuita",
      body: "La plantilla gratuita de Excel es válida para empezar y está disponible ahora mismo.",
    },
    productDescription:
      "Pack digital con plantilla Kakebo Excel premium (12 hojas, sin macros), el ebook «El arte de mirar tu dinero» y un tutorial en PDF. Compra única, acceso permanente. Todavía no disponible para compra.",
  },
  en: {
    meta: {
      title: "Premium Kakebo Excel Template | Kakebo Master System Pack",
      description:
        "Kakebo Master System: a premium Kakebo Excel template, an ebook and a PDF tutorial to plan income, track expenses and review each week. €9.90 VAT included, one-time purchase. Coming soon.",
      ogAlt: "Kakebo Master System dashboard, a premium Kakebo Excel template",
    },
    home: "Home",
    tools: "Tools",
    eyebrow: "Kakebo Master System · Digital pack",
    h1: "Premium Kakebo Excel template: more clarity for your money, less improvisation",
    subtitle:
      "Kakebo Master System is a digital pack with a premium Excel template, an ebook and a PDF tutorial to plan, track and review your money every month.",
    status: "Coming soon",
    price: "€9.90 VAT included · one-time purchase",
    statusNote: "Nothing is charged yet: purchase will open later.",
    freeCta: "See the free template",
    toolsCta: "See all tools",
    purchase: {
      soon: "Coming soon",
      soonNote: "Purchase is not available yet.",
      buy: "Buy Kakebo Master System",
      pending: "Processing…",
      unavailable: "Purchase is not available yet.",
    },
    previewAlt: {
      panel: "Kakebo Master System dashboard with budget, actual spending and monthly progress",
      portada: "Kakebo Master System cover with the steps to use the system",
    },
    answer:
      "Kakebo Master System is a paid digital pack with three files: a premium Kakebo Excel template, the ebook “El arte de mirar tu dinero” (about 20 pages) and a PDF tutorial with step-by-step instructions. It costs €9.90 VAT included, it is a one-time purchase with permanent access to the files, and you do not need to create an account. The template uses no macros. It cannot be bought yet.",
    pack: {
      title: "What's in the pack",
      intro: "One purchase, three digital files.",
      items: [
        [
          "Premium Excel template",
          "An Excel workbook (.xlsx) with no macros and 12 sheets: cover, dashboard, setup, monthly plan, log, weekly review, monthly reflection, goals, recurring expenses, net worth, guide and checks.",
        ],
        [
          "Ebook “El arte de mirar tu dinero”",
          "A practical PDF guide to Kakebo and personal finance, about 20 pages long, to understand the method and look at your spending calmly. (The ebook is written in Spanish.)",
        ],
        [
          "PDF tutorial",
          "Step-by-step instructions for using the template, with images, in an 8-page PDF.",
        ],
      ] as [string, string][],
    },
    what: {
      title: "What is Kakebo Master System",
      body: [
        "Kakebo Master System is a personal finance organization system based on the Japanese Kakebo method: you plan the month first, then log what you spend, review every week and close the month with a reflection. The Excel template is the core; the ebook and the tutorial help you understand the method and use it.",
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
      title: "What the Excel template contains",
      groups: [
        ["Planning", ["Editable initial setup", "Income", "Fixed expenses", "Monthly budget", "Kakebo categories"]],
        ["Tracking", ["Structured expense and income log", "Recurring expenses", "Accounts", "Designed for Excel and prepared for Google Sheets, pending validation"]],
        ["Analysis", ["Visual dashboard", "Savings progress", "Budget vs. actual comparison", "Savings goals", "Accounts and net worth"]],
        ["Method", ["Weekly review", "Monthly reflection", "In-workbook guide", "Full yearly workflow"]],
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
      title: "Free template vs. Kakebo Master System",
      intro:
        "They are two different products. The free template is a good way to get started, stays available and needs no purchase or sign-up. Kakebo Master System is a more complete paid pack for anyone who wants to work with the method all year long.",
      free: {
        name: "Free Excel template",
        price: "No cost",
        items: ["A good way to get started", "Instant download", "Basic structure", "No sign-up"],
        cta: "See the free template",
      },
      plus: {
        name: PRODUCT_NAME,
        price: "€9.90 VAT included",
        items: ["Premium Excel template with a dashboard", "Ebook “El arte de mirar tu dinero”", "PDF tutorial", "One-time purchase, permanent access", "No account needed"],
        badge: "Coming soon",
      },
    },
    terms: {
      title: "Pack terms",
      items: [
        ["Price", "€9.90, VAT included."],
        ["One-time purchase", "You pay once. It is not a subscription."],
        ["Permanent access", "You will be able to access the pack files again whenever you need them."],
        ["No account", "You do not need to create an account to buy it."],
        ["Digital product", "Delivered in digital format (Excel and PDF). Nothing physical is shipped."],
        ["Independent from the app", "Buying the pack does not grant Kakebo app features (AI, reports) or subscriptions: they are different products."],
        ["Availability", "Purchase is not available yet."],
      ] as [string, string][],
    },
    compat: {
      title: "Compatibility and how it works",
      items: [
        ["Excel", "Designed for modern Microsoft Excel."],
        ["Google Sheets", "Designed for Microsoft Excel and prepared to work in Google Sheets without macros, pending validation with the final version."],
        ["No macros", "It uses no macros and needs no extra software."],
        ["Formats", "The template is an Excel file (.xlsx); the ebook and the tutorial are PDF files."],
        ["Privacy", "There is no bank connection: your data stays in your file or in your Google Drive."],
        ["Consistency", "Built for steady habits, not for promising miracle results."],
      ] as [string, string][],
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        ["What is Kakebo Master System?", "It is a paid digital pack with three files: a premium Kakebo Excel template, the ebook “El arte de mirar tu dinero” (about 20 pages) and a PDF tutorial."],
        ["How much does it cost?", "€9.90, VAT included. It is a one-time purchase, not a subscription."],
        ["What is included in the pack?", "The premium Excel template with 12 sheets and no macros, the ebook as a PDF, and the PDF tutorial with the template's instructions."],
        ["Do I need to create an account to buy it?", "No. You do not need to sign up to buy the pack."],
        ["Will I have permanent access to the files?", "Yes. The purchase is one-time and gives permanent access to the pack files."],
        ["Can I buy it now?", "Not yet. Purchase is not available for now; when it opens, it will be announced on this page."],
        ["Is it the same as the free template?", "No. The free Excel template is a different product: it is free, has a basic structure and stays available. Kakebo Master System is the paid pack with the premium template, the ebook and the tutorial."],
        ["Does buying the pack give access to the Kakebo app or Plus features?", "No. The pack is a set of independent files: it does not grant app features (such as AI or reports) or any subscription."],
        ["Does it work with Excel and Google Sheets?", "Designed for Microsoft Excel and prepared to work in Google Sheets without macros, pending validation with the final version."],
        ["Does it use macros?", "No. It uses no macros and needs no extra software."],
        ["Does it guarantee that I will save money?", "No. It is an organization tool: results depend on your decisions and on how consistently you use it."],
      ] as [string, string][],
    },
    state: {
      title: "Availability",
      body: ["Kakebo Master System cannot be bought yet. When it is available, the price will be €9.90 VAT included, as a one-time purchase with permanent access."],
    },
    finalCta: {
      title: "In the meantime, start with the free template",
      body: "The free Excel template is a valid way to get started and is available right now.",
    },
    productDescription:
      "Digital pack with a premium Kakebo Excel template (12 sheets, no macros), the ebook “El arte de mirar tu dinero” and a PDF tutorial. One-time purchase, permanent access. Not available for purchase yet.",
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

  // No `robots` override: the page is public and indexable. Indexing is controlled site-wide by the
  // locale layout (production domain only), so previews and local builds stay out of the index.
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

  // Product WITHOUT `offers`: the pack cannot be bought yet, so no price, currency or availability is
  // declared in structured data (it would be a false availability signal). Add an Offer only when the
  // purchase is really open.
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
                <span className="text-sm font-medium text-foreground">{c.price}</span>
              </div>
              <p className="text-sm text-muted-foreground">{c.statusNote}</p>
              <PremiumPurchaseButton enabled={commerceEnabled} labels={c.purchase} />
              <Link
                href={FREE_TEMPLATE_PATH}
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

          {/* 2. The three pieces of the pack */}
          <section className="space-y-8">
            <div className="max-w-2xl space-y-3">
              <h2 className={sectionTitle}>{c.pack.title}</h2>
              <p className="text-muted-foreground font-light leading-relaxed">{c.pack.intro}</p>
            </div>
            <ol className="grid gap-6 md:grid-cols-3">
              {c.pack.items.map(([title, body], i) => (
                <li key={title} className={card}>
                  <span aria-hidden className="mb-2 block font-serif text-3xl italic text-primary">{i + 1}</span>
                  <h3 className="mb-2 font-serif text-xl text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* 3. What it is */}
          <section className="max-w-3xl space-y-4">
            <h2 className={sectionTitle}>{c.what.title}</h2>
            {c.what.body.map((p) => (
              <p key={p} className="text-muted-foreground font-light leading-relaxed">{p}</p>
            ))}
          </section>

          {/* 4. Problem */}
          <section className="max-w-3xl space-y-4">
            <h2 className={sectionTitle}>{c.problem.title}</h2>
            {c.problem.body.map((p) => (
              <p key={p} className="text-muted-foreground font-light leading-relaxed">{p}</p>
            ))}
          </section>

          {/* 5. Excel contents */}
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

          {/* 6. Cycle */}
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

          {/* 7. Dashboard preview */}
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

          {/* 8. Cover preview */}
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

          {/* 9. Free vs pack */}
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
                  href={FREE_TEMPLATE_PATH}
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

          {/* 10. Pack terms */}
          <section className="space-y-6">
            <h2 className={sectionTitle}>{c.terms.title}</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              {c.terms.items.map(([term, desc]) => (
                <div key={term} className={card}>
                  <dt className="mb-1 font-bold text-foreground">{term}</dt>
                  <dd className="text-sm text-muted-foreground">{desc}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* 11. Compatibility */}
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

          {/* 12. FAQ (visible, mirrors FAQPage schema) */}
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

          {/* 13. Availability + free template link */}
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
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href={FREE_TEMPLATE_PATH}
                  className={`inline-block rounded-full bg-primary px-10 py-4 font-bold text-primary-foreground transition-transform hover:scale-105 ${focusRing}`}
                >
                  {c.freeCta}
                </Link>
                <Link
                  href="/herramientas"
                  className={`font-bold text-foreground underline decoration-primary underline-offset-4 hover:decoration-2 ${focusRing}`}
                >
                  {c.toolsCta} →
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
