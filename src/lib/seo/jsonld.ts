import type {
  Thing, Graph, IdReference,
  Organization, WebSite, Person, WebPage, AboutPage, CollectionPage, ItemPage, ContactPage,
  BreadcrumbList, WebApplication, FAQPage, HowTo, ItemList, BlogPosting, DigitalDocument, Dataset, Product,
  DefinedTerm, SoftwareApplication, Country,
} from "schema-dts";

/**
 * Capa semántica única de metodokakebo.com (Schema.org / JSON-LD).
 *
 * - Un solo <script type="application/ld+json"> por página, con un único @graph.
 * - Todas las entidades se enlazan por @id estable (Organization, WebSite, WebPage, entidad principal).
 * - Los builders reciben los textos YA localizados desde el Server Component: el JSON-LD usa exactamente
 *   la misma fuente que el HTML visible (messages/*.json, frontmatter MDX, content/*.json).
 * - `graph()` falla si hay referencias {"@id": ...} que no resuelven dentro de la misma página.
 *
 * Solo sintaxis TypeScript "borrable" (sin enums ni parameter properties).
 */

export const BASE_URL = "https://www.metodokakebo.com";
export type Locale = "es" | "en";
/** schema-dts incluye `string` (Text) en muchas uniones de tipo; para un nodo del @graph se excluye. */
type N<T> = Exclude<T, string>;

/** Cualquier nodo Schema.org válido según schema-dts (sin el caso `string` de `Thing`). */
export type JsonNode = Exclude<Thing, string>;
/** Documento JSON-LD final: un único @graph tipado. */
export type JsonLdDocument = Graph;
/** Valor JSON arbitrario, solo para los recorridos genéricos del árbol (stripUndefined / walk). */
type JsonValue = string | number | boolean | null | undefined | JsonValue[] | { [key: string]: JsonValue };

export const ids = {
  org: `${BASE_URL}/#organization`,
  website: `${BASE_URL}/#website`,
  person: `${BASE_URL}/#person`,
  app: `${BASE_URL}/#app`,
  logo: `${BASE_URL}/#logo`,
} as const;

export const ref = (id: string): IdReference => ({ "@id": id });

/** URL absoluta de una ruta (sin barra final). El español no lleva prefijo; el inglés, /en. */
export function localeUrl(locale: Locale, path = ""): string {
  const p = path === "/" ? "" : path;
  return `${BASE_URL}${locale === "es" ? "" : "/en"}${p}`;
}

/** @id de un fragmento de página. La home (sin ruta) usa "/#frag" para ser coherente con "/#organization". */
const at = (url: string, fragment: string) => (url === BASE_URL ? `${url}/#${fragment}` : `${url}#${fragment}`);

export function abs(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

/** Texto plano para Question/Answer y descripciones: quita etiquetas, énfasis Markdown y enlaces Markdown. */
export function plain(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/(\*\*|__)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const truncate = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`);

/* ------------------------------------------------------------------ */
/* 0. Fechas ISO 8601 con zona horaria (Europe/Madrid)                  */
/* ------------------------------------------------------------------ */

const MADRID = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Madrid", timeZoneName: "longOffset", hour: "2-digit" });

/** Desplazamiento de Europe/Madrid en un instante dado, como "+01:00" / "+02:00". */
function madridOffsetAt(instantMs: number): string {
  const part = MADRID.formatToParts(new Date(instantMs)).find((p) => p.type === "timeZoneName")?.value ?? "GMT+01:00";
  const m = part.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  return m ? `${m[1]}${m[2]}:${m[3] ?? "00"}` : "+01:00";
}

/**
 * Normaliza una fecha a ISO 8601 completo con la zona de Madrid (offset real de esa fecha: +01:00 en invierno, +02:00 en verano).
 * «2026-02-24» → «2026-02-24T00:00:00+01:00». Si la fuente ya trae hora y zona (Z o ±hh:mm) se respeta tal cual;
 * si trae hora sin zona se le añade la de Madrid. Cualquier otro formato se devuelve sin tocar.
 */
export function isoMadrid(value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/.test(value)) return value;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) return value;
  const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const [hh, mm, ss] = [Number(m[4] ?? 0), Number(m[5] ?? 0), Number(m[6] ?? 0)];
  // El offset se calcula 2 h antes del instante «ingenuo»: los cambios horarios ocurren a las 01:00 UTC, así que la
  // medianoche local del día del cambio todavía tiene el offset anterior.
  const offset = madridOffsetAt(Date.UTC(y, mo, d, hh, mm, ss) - 2 * 3_600_000);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(y, 4)}-${pad(mo + 1)}-${pad(d)}T${pad(hh)}:${pad(mm)}:${pad(ss)}${offset}`;
}

const DATE_KEYS = new Set(["datePublished", "dateModified", "dateCreated"]);

/* ------------------------------------------------------------------ */
/* 1. Entidades canónicas (desambiguación con sameAs)                   */
/* ------------------------------------------------------------------ */

const wd = (q: string) => `https://www.wikidata.org/wiki/${q}`;

export type EntityKey =
  | "kakeibo"
  | "saving"
  | "personalBudget"
  | "zeroBasedBudgeting"
  | "personalFinance"
  | "consumerPriceIndex"
  | "inflation"
  | "purchasingPower"
  | "excel"
  | "spain";

export const entities: Record<EntityKey, N<DefinedTerm> | N<SoftwareApplication> | N<Country>> = {
  kakeibo: {
    "@type": "DefinedTerm",
    "@id": `${BASE_URL}/#kakebo`,
    name: "Kakebo",
    alternateName: ["Kakeibo", "家計簿"],
    description: "Método japonés de ahorro personal basado en registrar, clasificar y revisar los gastos del hogar, creado en 1904.",
    sameAs: [wd("Q388197"), "https://en.wikipedia.org/wiki/Kakeibo", "https://es.wikipedia.org/wiki/Kakeibo"],
  },
  saving: {
    "@type": "DefinedTerm",
    "@id": `${BASE_URL}/#ahorro`,
    name: "Ahorro",
    alternateName: "Saving",
    sameAs: [wd("Q319622")],
  },
  personalBudget: {
    "@type": "DefinedTerm",
    "@id": `${BASE_URL}/#presupuesto-personal`,
    name: "Presupuesto personal",
    alternateName: "Personal budget",
    sameAs: [wd("Q3525860"), "https://en.wikipedia.org/wiki/Personal_budget"],
  },
  zeroBasedBudgeting: {
    "@type": "DefinedTerm",
    "@id": `${BASE_URL}/#presupuesto-base-cero`,
    name: "Presupuesto base cero",
    alternateName: "Zero-based budgeting",
    sameAs: [wd("Q191900"), "https://en.wikipedia.org/wiki/Zero-based_budgeting", "https://es.wikipedia.org/wiki/Presupuesto_base_cero"],
  },
  personalFinance: {
    "@type": "DefinedTerm",
    "@id": `${BASE_URL}/#finanzas-personales`,
    name: "Finanzas personales",
    alternateName: "Personal finance",
    sameAs: [wd("Q253613"), "https://en.wikipedia.org/wiki/Personal_finance", "https://es.wikipedia.org/wiki/Finanzas_personales"],
  },
  consumerPriceIndex: {
    "@type": "DefinedTerm",
    "@id": `${BASE_URL}/#ipc`,
    name: "Índice de precios de consumo (IPC)",
    alternateName: ["IPC", "Consumer price index"],
    sameAs: [wd("Q180687")],
  },
  inflation: {
    "@type": "DefinedTerm",
    "@id": `${BASE_URL}/#inflacion`,
    name: "Inflación",
    alternateName: "Inflation",
    sameAs: [wd("Q35865")],
  },
  purchasingPower: {
    "@type": "DefinedTerm",
    "@id": `${BASE_URL}/#poder-adquisitivo`,
    name: "Poder adquisitivo",
    alternateName: "Purchasing power",
    sameAs: [wd("Q271969")],
  },
  excel: {
    "@type": "SoftwareApplication",
    "@id": `${BASE_URL}/#microsoft-excel`,
    name: "Microsoft Excel",
    sameAs: [wd("Q11272")],
  },
  spain: {
    "@type": "Country",
    "@id": `${BASE_URL}/#espana`,
    name: "España",
    // Q29 = Spain / España (etiquetas verificadas en wikidata.org). Hoy ninguna página emite esta entidad: solo el generador de ejemplos.
    sameAs: [wd("Q29")],
  },
};

/**
 * Variantes por idioma de cada entidad: nombre y descripción en el idioma de la página (una página EN no lleva texto en
 * español) y, en español, sin la grafía «Kakeibo» (política del sitio: en español siempre «Kakebo»; la grafía «Kakeibo»
 * solo aparece en las páginas en inglés, incluidas las URL de Wikipedia).
 */
type EntityOverride = { name?: string; alternateName?: string | string[]; description?: string; sameAs?: string[] };
const LOCALIZED: Record<"es" | "en", Partial<Record<EntityKey, EntityOverride>>> = {
  es: {
    kakeibo: { alternateName: ["家計簿"], sameAs: [wd("Q388197")] },
  },
  en: {
    kakeibo: {
      name: "Kakeibo",
      alternateName: ["Kakebo", "家計簿"],
      description: "Japanese personal savings method based on recording, classifying and reviewing household spending, created in 1904.",
    },
    saving: { name: "Saving", alternateName: undefined },
    personalBudget: { name: "Personal budget", alternateName: undefined },
    zeroBasedBudgeting: { name: "Zero-based budgeting", alternateName: undefined },
    personalFinance: { name: "Personal finance", alternateName: undefined },
    consumerPriceIndex: { name: "Consumer price index (CPI)", alternateName: ["CPI"] },
    inflation: { name: "Inflation", alternateName: undefined },
    purchasingPower: { name: "Purchasing power", alternateName: undefined },
    spain: { name: "Spain", alternateName: undefined },
  },
};

export const entity = (key: EntityKey, locale: Locale = "es"): JsonNode => ({ ...entities[key], ...(LOCALIZED[locale][key] ?? {}) }) as JsonNode;
export const entityNodes = (keys: EntityKey[], locale: Locale = "es"): JsonNode[] => keys.map((k) => entity(k, locale));
export const entityRefs = (keys: EntityKey[]): IdReference[] => keys.map((k) => ref(`${entities[k]["@id"]}`));

/** Autor histórico de la técnica; solo se usa como `mentions` donde el texto visible lo nombra. */
export const motokoHani: N<Person> = {
  "@type": "Person",
  "@id": `${BASE_URL}/#motoko-hani`,
  name: "Motoko Hani",
  sameAs: ["https://en.wikipedia.org/wiki/Motoko_Hani"],
};

/** Entidades de cada artículo (solo identificadores verificados). El resto de artículos usa `kakeibo` por defecto si el slug lo contiene. */
const BLOG_ABOUT: Record<string, EntityKey[]> = {
  "kakebo-vs-ynab": ["kakeibo", "zeroBasedBudgeting"],
  "regla-50-30-20-ejemplo": ["personalBudget"],
  "como-hacer-un-presupuesto-personal": ["personalBudget"],
  "como-ahorrar-dinero-cada-mes": ["saving"],
  "eliminar-gastos-hormiga": ["saving"],
  "regla-30-dias": ["saving"],
  "ahorro-pareja": ["personalFinance"],
  "plantilla-kakebo-excel": ["kakeibo", "excel"],
  "kakebo-sueldo-minimo": ["kakeibo", "saving"],
};
export function blogAbout(slug: string): EntityKey[] {
  if (BLOG_ABOUT[slug]) return BLOG_ABOUT[slug];
  return slug.includes("kakebo") ? ["kakeibo"] : [];
}

/* ------------------------------------------------------------------ */
/* 2. Textos del sitio por idioma (mover a messages/*.json si se desea) */
/* ------------------------------------------------------------------ */

export const siteCopy = {
  es: {
    orgDescription:
      "Plataforma web gratuita de herramientas y artículos para aplicar el método Kakebo de ahorro personal en formato digital, sin conectar cuentas bancarias.",
    siteDescription: "Herramientas gratuitas y guías para aplicar el método Kakebo de ahorro personal en español.",
    appDescription:
      "Aplicación web gratuita de MetodoKakebo.com para registrar gastos y planificar el ahorro mensual con el método Kakebo japonés y asistencia de inteligencia artificial.",
    // Solo el valor que figura literalmente en la página (auditoría JSON-LD vs. texto visible); el resto se retiró por no ser visible.
    appFeatures: ["Sin conexión bancaria"],
    home: "Inicio",
    blog: "Blog",
    tools: "Herramientas",
  },
  en: {
    orgDescription:
      "Free web platform with tools and articles to apply the Kakebo personal savings method digitally, without connecting bank accounts.",
    siteDescription: "Free tools and guides to apply the Kakebo personal savings method.",
    appDescription:
      "Free web app by MetodoKakebo.com to log expenses and plan monthly savings with the Japanese Kakebo method and AI assistance.",
    appFeatures: ["No bank connection"],
    home: "Home",
    blog: "Blog",
    tools: "Tools",
  },
} as const;

/* ------------------------------------------------------------------ */
/* 3. Nodos base (idénticos en todas las páginas)                      */
/* ------------------------------------------------------------------ */

export function organization(locale: Locale, contact?: { telephone: string; email: string }): N<Organization> {
  return {
    "@type": "Organization",
    "@id": ids.org,
    name: "MetodoKakebo.com",
    url: BASE_URL,
    logo: { "@type": "ImageObject", "@id": ids.logo, url: `${BASE_URL}/logo.png`, contentUrl: `${BASE_URL}/logo.png` },
    image: ref(ids.logo),
    description: siteCopy[locale].orgDescription,
    founder: ref(ids.person),
    ...(contact
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            telephone: contact.telephone,
            email: contact.email,
            availableLanguage: ["Spanish", "English"],
          },
        }
      : {}),
  };
}

export function website(locale: Locale): N<WebSite> {
  return {
    "@type": "WebSite",
    "@id": ids.website,
    url: BASE_URL,
    name: "MetodoKakebo.com",
    description: siteCopy[locale].siteDescription,
    inLanguage: ["es", "en"],
    publisher: ref(ids.org),
  };
}

export function person(locale: Locale): N<Person> {
  return {
    "@type": "Person",
    "@id": ids.person,
    name: "Aitor Alarcón",
    url: localeUrl(locale, "/sobre-nosotros"),
    sameAs: ["https://github.com/mrsteppenwolf627"],
    worksFor: ref(ids.org),
    knowsAbout: entityRefs(["kakeibo", "personalFinance"]),
  };
}

/** Núcleo que lleva toda página: Organization + WebSite + Person (+ entidades referenciadas). */
export function core(locale: Locale, opts?: { contact?: { telephone: string; email: string } }): JsonNode[] {
  return [organization(locale, opts?.contact), website(locale), person(locale), ...entityNodes(["kakeibo", "personalFinance"], locale)];
}

export type Crumb = { name: string; url: string };

export function webPage(o: {
  locale: Locale;
  path: string;
  type?: "WebPage" | "AboutPage" | "CollectionPage" | "ItemPage" | "ContactPage";
  name: string;
  description?: string;
  inLanguage?: string;
  breadcrumbs?: Crumb[];
  mainEntityId?: string;
  about?: EntityKey[];
  mentions?: N<Person>[];
  datePublished?: string;
  dateModified?: string;
  /** Propiedades adicionales del WebPage (p. ej. citation, spatialCoverage). */
  extra?: Partial<N<WebPage>>;
}): JsonNode[] {
  const url = localeUrl(o.locale, o.path);
  const page: N<WebPage> | N<AboutPage> | N<CollectionPage> | N<ItemPage> | N<ContactPage> = {
    "@type": o.type ?? "WebPage",
    "@id": at(url, "webpage"),
    url,
    name: o.name,
    ...(o.description ? { description: o.description } : {}),
    inLanguage: o.inLanguage ?? o.locale,
    isPartOf: ref(ids.website),
    ...(o.breadcrumbs ? { breadcrumb: ref(at(url, "breadcrumb")) } : {}),
    ...(o.mainEntityId ? { mainEntity: ref(o.mainEntityId) } : {}),
    ...(o.about?.length ? { about: entityRefs(o.about) } : {}),
    ...(o.mentions?.length ? { mentions: o.mentions.map((m) => ref(`${m["@id"]}`)) } : {}),
    ...(o.datePublished ? { datePublished: o.datePublished } : {}),
    ...(o.dateModified ? { dateModified: o.dateModified } : {}),
    ...(o.extra ?? {}),
  };
  const nodes: JsonNode[] = [page];
  if (o.breadcrumbs) {
    const breadcrumbList: N<BreadcrumbList> = {
      "@type": "BreadcrumbList",
      "@id": at(url, "breadcrumb"),
      itemListElement: o.breadcrumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
    };
    nodes.push(breadcrumbList);
  }
  if (o.about?.length) nodes.push(...entityNodes(o.about, o.locale));
  if (o.mentions?.length) nodes.push(...o.mentions);
  return nodes;
}

/** Migas estándar: Inicio › sección › página. */
export function crumbs(locale: Locale, trail: { name: string; path: string }[]): Crumb[] {
  return [{ name: siteCopy[locale].home, url: localeUrl(locale, "") }, ...trail.map((t) => ({ name: t.name, url: localeUrl(locale, t.path) }))];
}

/* ------------------------------------------------------------------ */
/* 4. Entidades principales por tipo de página                         */
/* ------------------------------------------------------------------ */

export function webApplication(o: {
  id: string;
  name: string;
  url: string;
  description: string;
  featureList?: readonly string[] | string;
  inLanguage: string;
  operatingSystem?: string;
  about?: EntityKey[];
}): N<WebApplication> {
  return {
    "@type": "WebApplication",
    "@id": o.id,
    name: o.name,
    url: o.url,
    description: o.description,
    applicationCategory: "FinanceApplication",
    operatingSystem: o.operatingSystem ?? "Web",
    inLanguage: o.inLanguage,
    isAccessibleForFree: true,
    ...(o.featureList ? { featureList: o.featureList } : {}),
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", availability: "https://schema.org/InStock", url: o.url },
    author: ref(ids.org),
    publisher: ref(ids.org),
    ...(o.about?.length ? { about: entityRefs(o.about) } : {}),
  };
}

export type FaqItem = { question: string; answer: string };

export function faqPage(pageUrl: string, items: FaqItem[], inLanguage: string): N<FAQPage> | null {
  if (!items.length) return null;
  return {
    "@type": "FAQPage",
    "@id": at(pageUrl, "faq"),
    isPartOf: ref(at(pageUrl, "webpage")),
    inLanguage,
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: plain(i.question),
      acceptedAnswer: { "@type": "Answer", text: plain(i.answer) },
    })),
  };
}

export function howTo(pageUrl: string, name: string, steps: { name?: string; text: string }[], inLanguage: string): N<HowTo> {
  return {
    "@type": "HowTo",
    "@id": at(pageUrl, "howto"),
    name,
    inLanguage,
    isPartOf: ref(at(pageUrl, "webpage")),
    step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, ...(s.name ? { name: s.name } : {}), text: plain(s.text) })),
  };
}

export function itemList(pageUrl: string, items: { name: string; url: string; description?: string }[]): N<ItemList> {
  return {
    "@type": "ItemList",
    "@id": at(pageUrl, "list"),
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: it.url,
      ...(it.description ? { description: plain(it.description) } : {}),
    })),
  };
}

/** Un artículo del blog. Las FAQ solo se emiten si están visibles en el cuerpo (ver `visibleFaq`). */
export function blogPost(o: {
  locale: Locale;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  updatedDate?: string;
  image?: string;
  faq?: FaqItem[];
}): JsonNode[] {
  const path = `/blog/${o.slug}`;
  const url = localeUrl(o.locale, path);
  const about = blogAbout(o.slug);
  const isFounder = o.author.trim() === "Aitor Alarcón";
  const article: N<BlogPosting> = {
    "@type": "BlogPosting",
    "@id": at(url, "article"),
    headline: truncate(plain(o.title), 110),
    description: plain(o.excerpt),
    inLanguage: o.locale,
    image: [abs(o.image || "/og-image.jpg")],
    datePublished: o.date,
    dateModified: o.updatedDate ?? o.date,
    author: isFounder ? ref(ids.person) : { "@type": "Person", name: o.author },
    publisher: ref(ids.org),
    isPartOf: ref(at(url, "webpage")),
    mainEntityOfPage: ref(at(url, "webpage")),
    ...(about.length ? { about: entityRefs(about) } : {}),
  };
  const faq = faqPage(url, o.faq ?? [], o.locale);
  return [
    ...core(o.locale),
    ...webPage({
      locale: o.locale,
      path,
      name: plain(o.title),
      description: plain(o.excerpt),
      breadcrumbs: crumbs(o.locale, [
        { name: siteCopy[o.locale].blog, path: "/blog" },
        { name: plain(o.title), path },
      ]),
      mainEntityId: at(url, "article"),
      datePublished: o.date,
      dateModified: o.updatedDate ?? o.date,
    }),
    article,
    ...entityNodes(about, o.locale),
    ...(faq ? [faq] : []),
  ];
}

/**
 * Solo las preguntas del frontmatter cuyo texto aparece en el cuerpo renderizado.
 * Evita declarar en JSON-LD FAQ que el usuario no ve.
 */
export function visibleFaq(faq: FaqItem[] | undefined, body: string): FaqItem[] {
  if (!faq?.length) return [];
  // El cuerpo se compara tal cual (sin quitar etiquetas): las preguntas de <FaqItem question="..."> viven en atributos JSX.
  const norm = (s: string) => s.replace(/(\*\*|__)/g, "").toLowerCase().replace(/[¿?¡!]/g, "").replace(/\s+/g, " ").trim();
  const haystack = norm(body);
  return faq.filter((f) => haystack.includes(norm(plain(f.question))));
}

/**
 * Pares pregunta/respuesta tal y como se leen en el cuerpo MDX: bloques `<FaqItem question="…">respuesta</FaqItem>` o
 * preguntas en negrita (`**¿…?**`) seguidas de su respuesta hasta la siguiente pregunta, encabezado o separador.
 */
function bodyQa(body: string): { question: string; answer: string }[] {
  const out: { question: string; answer: string }[] = [];
  for (const m of body.matchAll(/<FaqItem\s+question="([^"]+)"\s*>([\s\S]*?)<\/FaqItem>/g)) out.push({ question: m[1], answer: m[2] });
  const lines = body.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const q = /^\*\*(.+?)\*\*\s*$/.exec(lines[i].trim());
    if (!q) continue;
    const answer: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      const t = lines[j].trim();
      if (/^\*\*.+\*\*$/.test(t) || /^#{1,6}\s/.test(t) || /^---+$/.test(t) || t.startsWith("<FaqItem")) break;
      answer.push(lines[j]);
    }
    out.push({ question: q[1], answer: answer.join(String.fromCharCode(10)) });
  }
  return out;
}

/**
 * Hace que `Answer.text` sea la respuesta que ve el usuario. Si la respuesta del frontmatter ya figura en el cuerpo se
 * respeta tal cual; si el cuerpo redacta la misma pregunta con otra respuesta, se usa la del cuerpo (sin marcas MDX).
 * Una pregunta que no se encuentra en el cuerpo (se pinta con la respuesta del frontmatter) no se modifica.
 */
export function withVisibleAnswers(faq: FaqItem[], body: string): FaqItem[] {
  const norm = (s: string) => s.replace(/(\*\*|__)/g, "").toLowerCase().replace(/[¿?¡!]/g, "").replace(/\s+/g, " ").trim();
  const haystack = norm(plain(body));
  const qa = bodyQa(body);
  return faq.map((f) => {
    if (haystack.includes(norm(plain(f.answer)))) return f;
    const hit = qa.find((x) => norm(plain(x.question)) === norm(plain(f.question)));
    const visible = hit ? plain(hit.answer) : "";
    return visible ? { question: f.question, answer: visible } : f;
  });
}

/**
 * FAQ para el JSON-LD de un artículo: solo preguntas cuya respuesta (la visible, ver `withVisibleAnswers`) figura en el cuerpo.
 * Una pregunta que solo aparece de pasada en la prosa (sin su respuesta) se omite del marcado en lugar de emitir una respuesta
 * que el usuario no ve. No cambia lo que se pinta.
 */
export function faqForJsonLd(faq: FaqItem[] | undefined, body: string): FaqItem[] {
  const norm = (s: string) => plain(s).replace(/[¿?¡!]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const haystack = norm(body);
  return withVisibleAnswers(visibleFaq(faq, body), body).filter((f) => haystack.includes(norm(f.answer)));
}

export function digitalDocument(o: {
  id: string;
  name: string;
  description: string;
  url: string;
  encodingFormat: string;
  datePublished?: string;
  dateModified?: string;
  inLanguage: string;
}): N<DigitalDocument> {
  return {
    "@type": "DigitalDocument",
    "@id": o.id,
    name: o.name,
    description: o.description,
    url: o.url,
    encodingFormat: o.encodingFormat,
    isAccessibleForFree: true,
    inLanguage: o.inLanguage,
    ...(o.dateModified ? { dateModified: o.dateModified } : {}),
    author: ref(ids.org),
    publisher: ref(ids.org),
  };
}

/**
 * Periodo «N.º trimestre de AAAA» → intervalo ISO 8601 («AAAA-MM-DD/AAAA-MM-DD»), p. ej. «2.º trimestre de 2026» → «2026-04-01/2026-06-30».
 * Devuelve undefined si el texto no tiene ese formato (no se inventa cobertura).
 */
export function quarterInterval(periodo: string): string | undefined {
  const m = periodo.match(/^([1-4])\.?\S*\s+trimestre\s+de\s+(\d{4})$/i);
  if (!m) return undefined;
  const q = Number(m[1]);
  const ends = ["03-31", "06-30", "09-30", "12-31"];
  return `${m[2]}-${String((q - 1) * 3 + 1).padStart(2, "0")}-01/${m[2]}-${ends[q - 1]}`;
}

export function dataset(o: {
  id: string;
  name: string;
  description: string;
  url: string;
  creatorName: string;
  /** Cobertura temporal ISO 8601 (solo si el periodo es visible en la página). */
  temporalCoverage?: string;
  /** Descarga de la fuente (solo si el enlace es visible en la página). */
  distribution?: { contentUrl: string; encodingFormat: string };
}): N<Dataset> {
  return {
    "@type": "Dataset",
    "@id": o.id,
    name: o.name,
    description: o.description,
    url: o.url,
    creator: { "@type": "Organization", name: o.creatorName },
    isAccessibleForFree: true,
    ...(o.temporalCoverage ? { temporalCoverage: o.temporalCoverage } : {}),
    ...(o.distribution
      ? { distribution: { "@type": "DataDownload", contentUrl: o.distribution.contentUrl, encodingFormat: o.distribution.encodingFormat } }
      : {}),
  };
}

export function product(o: {
  id: string;
  name: string;
  alternateName?: string;
  description: string;
  url: string;
  images: string[];
  category: string;
  commerce?: { price: string; currency: string };
}): N<Product> {
  return {
    "@type": "Product",
    "@id": o.id,
    name: o.name,
    ...(o.alternateName ? { alternateName: o.alternateName } : {}),
    description: o.description,
    url: o.url,
    image: o.images.map(abs),
    category: o.category,
    brand: ref(ids.org),
    ...(o.commerce
      ? {
          offers: {
            "@type": "Offer",
            price: o.commerce.price,
            priceCurrency: o.commerce.currency,
            availability: "https://schema.org/InStock",
            url: o.url,
            seller: ref(ids.org),
          },
        }
      : {}),
  };
}

/* ------------------------------------------------------------------ */
/* 5. Ensamblado, validación y serialización                           */
/* ------------------------------------------------------------------ */

/** Limpia `undefined` y normaliza datePublished/dateModified/dateCreated a ISO 8601 con zona (único punto de normalización). */
function stripUndefined(v: JsonValue): JsonValue {
  if (Array.isArray(v)) return v.map(stripUndefined);
  if (v && typeof v === "object") {
    const out: { [key: string]: JsonValue } = {};
    for (const [k, val] of Object.entries(v)) if (val !== undefined) out[k] = DATE_KEYS.has(k) ? (isoMadrid(val) as JsonValue) : stripUndefined(val);
    return out;
  }
  return v;
}

/** Recorre el árbol: `refs` = {"@id"} sueltos; `defs` = objetos con @id y más propiedades (definiciones, también anidadas). */
function walk(v: JsonValue, refs: Set<string>, defs: Set<string>): void {
  if (Array.isArray(v)) return v.forEach((x) => walk(x, refs, defs));
  if (v && typeof v === "object") {
    const keys = Object.keys(v);
    const id = v["@id"];
    if (typeof id === "string") {
      if (keys.length === 1) refs.add(id);
      else defs.add(id);
    }
    for (const k of keys) if (k !== "@id") walk(v[k], refs, defs);
  }
}

/** Une nodos por @id (el primero manda), comprueba que toda referencia resuelve y devuelve el documento JSON-LD tipado. */
export function graph(nodes: (JsonNode | null | undefined)[]): Graph {
  const byId = new Map<string, JsonNode>();
  const anonymous: JsonNode[] = [];
  for (const raw of nodes) {
    if (!raw) continue;
    // schema-dts → JSON puro: los tipos de entrada ya son válidos, el recorrido solo elimina `undefined` y normaliza fechas.
    const n = stripUndefined(raw as unknown as JsonValue) as unknown as JsonNode;
    const id = n["@id"];
    if (!id) anonymous.push(n);
    else if (!byId.has(id)) byId.set(id, n);
  }
  const refs = new Set<string>();
  const defs = new Set<string>();
  const all = [...byId.values(), ...anonymous];
  for (const n of all) walk(n as unknown as JsonValue, refs, defs);
  const dangling = [...refs].filter((r) => !defs.has(r));
  if (dangling.length) {
    // Siempre lanza: las páginas son estáticas, así que el error rompe el build en vez de publicar un grafo roto.
    throw new Error(`JSON-LD: referencias @id sin nodo en el @graph: ${dangling.join(", ")}`);
  }
  return { "@context": "https://schema.org", "@graph": all };
}

/** Serializa seguro para incrustar en <script>: escapa "<" y los separadores de línea Unicode (U+2028/U+2029). */
export function serialize(doc: JsonLdDocument): string {
  return JSON.stringify(doc)
    .replace(/</g, "\\u003c")
    .split(String.fromCharCode(0x2028)).join("\\u2028")
    .split(String.fromCharCode(0x2029)).join("\\u2029");
}
