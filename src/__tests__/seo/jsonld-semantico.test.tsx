// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createTranslator } from "next-intl";
import { ldDocumentsFromTree } from "@/__tests__/helpers/jsonld";
import * as S from "@/lib/seo/jsonld";
import { getBlogPosts } from "@/lib/blog";
import esMessages from "../../../messages/es.json";
import enMessages from "../../../messages/en.json";

/**
 * Capa semántica JSON-LD: cada ruta pública emite un único <script> con un único @graph, sin referencias @id colgantes,
 * con imágenes absolutas, sin valoraciones inventadas y con las FAQ presentes en lo que ve el usuario.
 * Las páginas se ejecutan (Server Components) con los messages reales; los componentes cliente se sustituyen por stubs
 * porque aquí se inspecciona el árbol de elementos, no el DOM.
 */

const hoisted = vi.hoisted(() => {
  const stubModule = (extra: Record<string, unknown> = {}) =>
    new Proxy({ __esModule: true, ...extra } as Record<string, unknown>, {
      has: (_t, k) => typeof k !== "symbol" && k !== "then",
      get: (t, k) => {
        if (k in t) return t[k as string];
        // Sin «then»/símbolos: si no, import() trataría el módulo como thenable y nunca resolvería.
        if (typeof k === "symbol" || k === "then") return undefined;
        return () => null;
      },
    });
  return { stubModule };
});

vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const es = (await import("../../../messages/es.json")).default;
  const en = (await import("../../../messages/en.json")).default;
  const messagesOf = (l: string) => (l === "en" ? en : es);
  return {
    setRequestLocale: vi.fn(),
    getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) =>
      createTranslator({ locale, namespace: namespace as never, messages: messagesOf(locale) as never }),
    getMessages: async ({ locale }: { locale: string }) => messagesOf(locale),
  };
});
vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["en", "es"], defaultLocale: "es" },
  Link: () => null,
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("next-mdx-remote/rsc", () => ({ MDXRemote: () => null }));
vi.mock("remark-gfm", () => ({ default: () => undefined }));
vi.mock("@/components/landing", () => hoisted.stubModule());
vi.mock("@/components/landing/Navbar", () => hoisted.stubModule());
vi.mock("@/components/landing/Footer", () => hoisted.stubModule());
vi.mock("@/components/landing/tools/SavingsCalculator", () => hoisted.stubModule());
vi.mock("@/components/landing/tools/CalculatorInflation", () => hoisted.stubModule());
vi.mock("@/components/landing/tools/Calculator503020", () => hoisted.stubModule());
vi.mock("@/components/i18n/ToolMessages", () => hoisted.stubModule());
vi.mock("@/components/premium/PremiumTracking", () => hoisted.stubModule());
vi.mock("@/components/premium/PremiumPurchaseButton", () => hoisted.stubModule());
vi.mock("@/components/vivienda/CalculadoraEntrada", () => hoisted.stubModule());
vi.mock("@/components/vivienda/GraficoValorTasado", () => hoisted.stubModule());
vi.mock("@/components/mdx/RelatedPosts", () => hoisted.stubModule());
vi.mock("@/components/mdx/MDXClientCTAs", () => hoisted.stubModule());
vi.mock("@/components/mdx/MDXComponents", () =>
  hoisted.stubModule({ components: { FaqSection: function FaqSection() { return null; }, FaqItem: function FaqItem() { return null; } } }),
);

const P = "@/app/[locale]";
type Route = { name: string; mod: string; params: Record<string, string>; faqFromSource?: string[] };

// Rutas públicas con JSON-LD (las mismas que el mapa de renderizado). `faqFromSource`: la FAQ la pinta un componente
// cliente; se comprueba que su código lee las mismas claves de messages que el JSON-LD.
const ROUTES: Route[] = [
  { name: "/", mod: `${P}/(public)/page`, params: { locale: "es" }, faqFromSource: ["src/components/landing/FAQ.tsx"] },
  { name: "/en", mod: `${P}/(public)/page`, params: { locale: "en" }, faqFromSource: ["src/components/landing/FAQ.tsx"] },
  { name: "/sobre-nosotros", mod: `${P}/(public)/sobre-nosotros/page`, params: { locale: "es" } },
  { name: "/en/sobre-nosotros", mod: `${P}/(public)/sobre-nosotros/page`, params: { locale: "en" } },
  { name: "/blog", mod: `${P}/(public)/blog/page`, params: { locale: "es" } },
  { name: "/en/blog", mod: `${P}/(public)/blog/page`, params: { locale: "en" } },
  { name: "/herramientas", mod: `${P}/(public)/herramientas/page`, params: { locale: "es" } },
  { name: "/en/herramientas", mod: `${P}/(public)/herramientas/page`, params: { locale: "en" } },
  { name: "/herramientas/calculadora-ahorro", mod: `${P}/(public)/herramientas/calculadora-ahorro/page`, params: { locale: "es" } },
  { name: "/en/herramientas/calculadora-ahorro", mod: `${P}/(public)/herramientas/calculadora-ahorro/page`, params: { locale: "en" } },
  {
    name: "/herramientas/calculadora-inflacion",
    mod: `${P}/(landing)/herramientas/calculadora-inflacion/page`,
    params: { locale: "es" },
    faqFromSource: ["src/components/landing/tools/CalculatorInflation.tsx"],
  },
  {
    name: "/en/herramientas/calculadora-inflacion",
    mod: `${P}/(landing)/herramientas/calculadora-inflacion/page`,
    params: { locale: "en" },
    faqFromSource: ["src/components/landing/tools/CalculatorInflation.tsx"],
  },
  { name: "/herramientas/regla-50-30-20", mod: `${P}/(landing)/herramientas/regla-50-30-20/page`, params: { locale: "es" } },
  { name: "/en/herramientas/regla-50-30-20", mod: `${P}/(landing)/herramientas/regla-50-30-20/page`, params: { locale: "en" } },
  { name: "/herramientas/plantilla-kakebo-excel-premium", mod: `${P}/(public)/herramientas/plantilla-kakebo-excel-premium/page`, params: { locale: "es" } },
  { name: "/en/herramientas/plantilla-kakebo-excel-premium", mod: `${P}/(public)/herramientas/plantilla-kakebo-excel-premium/page`, params: { locale: "en" } },
  { name: "/plantillas/kakebo-para-imprimir", mod: `${P}/(public)/plantillas/[slug]/page`, params: { locale: "es", slug: "kakebo-para-imprimir" } },
  { name: "/ahorro-entrada-vivienda", mod: `${P}/(public)/ahorro-entrada-vivienda/page`, params: { locale: "es" } },
  { name: "/ahorro-entrada-vivienda/madrid", mod: `${P}/(public)/ahorro-entrada-vivienda/[provincia]/page`, params: { locale: "es", provincia: "madrid" } },
];

const posts = (["es", "en"] as const).flatMap((locale) =>
  getBlogPosts(locale).map((p) => ({ name: `/${locale === "en" ? "en/" : ""}blog/${p.slug}`, locale, slug: p.slug })),
);

async function renderTree(mod: string, params: Record<string, string>) {
  const { default: Page } = await import(/* @vite-ignore */ mod);
  return Page({ params: Promise.resolve(params) });
}

/** Cadenas de texto del árbol de elementos (children y props de tipo string), sin ejecutar componentes. */
function treeStrings(tree: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<unknown>();
  const walk = (n: any) => {
    if (n == null || seen.has(n)) return;
    if (typeof n === "string") return void out.push(n);
    if (typeof n !== "object") return;
    seen.add(n);
    if (Array.isArray(n)) return n.forEach(walk);
    if (n.props) for (const v of Object.values(n.props)) walk(v);
  };
  walk(tree);
  return out;
}

/** Elementos <script type="application/ld+json"> sueltos en el árbol (no deben existir: todo va por <JsonLd/>). */
function rawLdScripts(tree: unknown): number {
  let n = 0;
  const seen = new Set<unknown>();
  const walk = (x: any) => {
    if (!x || typeof x !== "object" || seen.has(x)) return;
    seen.add(x);
    if (Array.isArray(x)) return x.forEach(walk);
    if (x.type === "script" && x.props?.type === "application/ld+json") n++;
    if (x.props) for (const v of Object.values(x.props)) walk(v);
  };
  walk(tree);
  return n;
}

const norm = (s: string) => s.replace(/(\*\*|__)/g, "").toLowerCase().replace(/[¿?¡!]/g, "").replace(/\s+/g, " ").trim();

function danglingRefs(doc: any): string[] {
  const refs = new Set<string>();
  const defs = new Set<string>();
  const walk = (v: any) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === "object") {
      const keys = Object.keys(v);
      if (typeof v["@id"] === "string") (keys.length === 1 ? refs : defs).add(v["@id"]);
      for (const k of keys) if (k !== "@id") walk(v[k]);
    }
  };
  walk(doc["@graph"]);
  return [...refs].filter((r) => !defs.has(r));
}

function collectImages(v: any, out: string[] = [], key = ""): string[] {
  if (Array.isArray(v)) v.forEach((x) => collectImages(x, out, key));
  else if (v && typeof v === "object") for (const [k, val] of Object.entries(v)) collectImages(val, out, k);
  else if (typeof v === "string" && (key === "image" || key === "contentUrl" || key === "thumbnailUrl")) out.push(v);
  return out;
}

const faqNames = (doc: any): { question: string; answer: string }[] =>
  (doc["@graph"].find((n: any) => n["@type"] === "FAQPage")?.mainEntity ?? []).map((q: any) => ({ question: q.name, answer: q.acceptedAnswer.text }));

describe("JSON-LD: un único script con un único @graph por ruta pública", () => {
  it.each(ROUTES)("$name", async ({ mod, params }) => {
    const tree = await renderTree(mod, params);
    const docs = ldDocumentsFromTree(tree);
    expect(docs).toHaveLength(1);
    expect(docs[0]["@context"]).toBe("https://schema.org");
    expect(Array.isArray(docs[0]["@graph"])).toBe(true);
    expect(rawLdScripts(tree)).toBe(0);
    // Núcleo compartido e idéntico en todas las páginas.
    const ids = docs[0]["@graph"].map((n: any) => n["@id"]);
    for (const id of [S.ids.org, S.ids.website, S.ids.person]) expect(ids).toContain(id);
  });

  it.each(posts)("$name", async ({ locale, slug }) => {
    const tree = await renderTree(`${P}/(public)/blog/[slug]/page`, { locale, slug });
    expect(ldDocumentsFromTree(tree)).toHaveLength(1);
    expect(rawLdScripts(tree)).toBe(0);
  });
});

describe("JSON-LD: todo @id referenciado existe en el grafo", () => {
  it.each(ROUTES)("$name", async ({ mod, params }) => {
    const [doc] = ldDocumentsFromTree(await renderTree(mod, params));
    expect(danglingRefs(doc)).toEqual([]);
  });

  it.each(posts)("$name", async ({ locale, slug }) => {
    const [doc] = ldDocumentsFromTree(await renderTree(`${P}/(public)/blog/[slug]/page`, { locale, slug }));
    expect(danglingRefs(doc)).toEqual([]);
  });
});

describe("graph()", () => {
  it("lanza error si hay referencias @id sin nodo", () => {
    expect(() => S.graph([{ "@type": "WebPage", "@id": "https://x/#a", isPartOf: { "@id": "https://x/#no-existe" } }])).toThrow(/#no-existe/);
  });

  it("acepta referencias que resuelven (también en nodos anidados) y fusiona por @id", () => {
    const doc = S.graph([
      { "@type": "WebSite", "@id": "https://x/#w" },
      { "@type": "WebSite", "@id": "https://x/#w", name: "duplicado" },
      { "@type": "WebPage", "@id": "https://x/#p", isPartOf: { "@id": "https://x/#w" } },
    ]) as any;
    expect(doc["@graph"]).toHaveLength(2);
  });
});

describe("JSON-LD: imágenes absolutas", () => {
  it.each(ROUTES)("$name", async ({ mod, params }) => {
    const [doc] = ldDocumentsFromTree(await renderTree(mod, params));
    for (const url of collectImages(doc["@graph"])) expect(url).toMatch(/^https?:\/\//);
  });

  it.each(posts)("$name", async ({ locale, slug }) => {
    const [doc] = ldDocumentsFromTree(await renderTree(`${P}/(public)/blog/[slug]/page`, { locale, slug }));
    const images = collectImages(doc["@graph"]);
    expect(images.length).toBeGreaterThan(0);
    for (const url of images) expect(url).toMatch(/^https?:\/\//);
  });

  it("abs() convierte rutas relativas", () => {
    expect(S.abs("/images/blog/x.png")).toBe("https://www.metodokakebo.com/images/blog/x.png");
    expect(S.abs("https://cdn.example/x.png")).toBe("https://cdn.example/x.png");
  });
});

describe("JSON-LD: sin valoraciones ni reseñas inventadas", () => {
  it.each(ROUTES)("$name", async ({ mod, params }) => {
    const json = JSON.stringify(ldDocumentsFromTree(await renderTree(mod, params)));
    expect(json).not.toMatch(/aggregateRating|"review"|"Review"|ratingValue|reviewCount/);
  });

  it("el módulo no contiene builders de valoraciones y SoftwareAppJsonLd ya no existe", () => {
    const src = readFileSync(join(process.cwd(), "src/lib/seo/jsonld.ts"), "utf-8");
    expect(src).not.toMatch(/aggregateRating|reviewCount|ratingValue/);
    expect(() => readFileSync(join(process.cwd(), "src/components/seo/SoftwareAppJsonLd.tsx"))).toThrow();
  });
});

describe("serialize()", () => {
  it("escapa «<» y los separadores de línea Unicode", () => {
    const out = S.serialize({ a: "</script><script>alert(1)</script>", b: "x y z" });
    expect(out).not.toContain("<");
    expect(out).not.toContain(" ");
    expect(out).not.toContain(" ");
    expect(JSON.parse(out).a).toBe("</script><script>alert(1)</script>");
  });
});

describe("paridad FAQ: lo que declara el JSON-LD se ve en la página", () => {
  const rendered = ROUTES.filter((r) => !r.faqFromSource);

  it.each(rendered)("$name: cada pregunta y respuesta del FAQPage está en el árbol renderizado", async ({ mod, params }) => {
    const tree = await renderTree(mod, params);
    const [doc] = ldDocumentsFromTree(tree);
    const faq = faqNames(doc);
    const visible = treeStrings(tree).map((s) => S.plain(s));
    for (const { question, answer } of faq) {
      expect(visible.some((s) => norm(s).includes(norm(question))), `pregunta no visible: ${question}`).toBe(true);
      expect(visible.some((s) => norm(s).includes(norm(answer))), `respuesta no visible: ${answer.slice(0, 60)}`).toBe(true);
    }
  });

  it("home: el FAQPage son exactamente las 5 preguntas del componente FAQ (namespace FAQ)", async () => {
    for (const [locale, messages] of [["es", esMessages], ["en", enMessages]] as const) {
      const [doc] = ldDocumentsFromTree(await renderTree(`${P}/(public)/page`, { locale }));
      const q = (messages as any).FAQ.questions;
      expect(faqNames(doc).map((f) => f.question)).toEqual(["q1", "q2", "q3", "q4", "q5"].map((k) => S.plain(q[k].question)));
    }
    const component = readFileSync(join(process.cwd(), "src/components/landing/FAQ.tsx"), "utf-8");
    expect(component).toContain("useTranslations('FAQ')");
    expect(component).toContain("['q1', 'q2', 'q3', 'q4', 'q5']");
    // Las 3 preguntas antiguas (Landing.SEO.faqSchema) ya no existen.
    expect((esMessages as any).Landing.SEO.faqSchema).toBeUndefined();
    expect((enMessages as any).Landing.SEO.faqSchema).toBeUndefined();
  });

  it("calculadora de inflación: el FAQPage son las 3 preguntas que pinta CalculatorInflation (content.faq.q1–q3)", async () => {
    for (const [locale, messages] of [["es", esMessages], ["en", enMessages]] as const) {
      const [doc] = ldDocumentsFromTree(await renderTree(`${P}/(landing)/herramientas/calculadora-inflacion/page`, { locale }));
      const f = (messages as any).Tools.Inflation.content.faq;
      expect(faqNames(doc).map((x) => x.question)).toEqual([f.q1, f.q2, f.q3]);
      const answers = faqNames(doc).map((x) => x.answer);
      expect(answers.join(" ")).not.toMatch(/<[a-zA-Z]/); // sin etiquetas de texto enriquecido
    }
    const component = readFileSync(join(process.cwd(), "src/components/landing/tools/CalculatorInflation.tsx"), "utf-8");
    for (const k of ["q1", "q2", "q3"]) expect(component).toContain(`content.faq.${k}`);
    expect(component).not.toContain("content.faq.q4");
  });

  // Artículos: cada pregunta del FAQPage está en el cuerpo del MDX o en la sección «Preguntas frecuentes» que renderiza la plantilla.
  it.each(posts)("$name: FAQ visible (cuerpo o sección renderizada)", async ({ locale, slug }) => {
    const tree = await renderTree(`${P}/(public)/blog/[slug]/page`, { locale, slug });
    const [doc] = ldDocumentsFromTree(tree);
    const post = getBlogPosts(locale).find((p) => p.slug === slug)!;
    const fm = post.frontmatter.faq ?? [];
    const names = faqNames(doc).map((f) => f.question);
    // Todo lo que declara el frontmatter queda visible: el FAQPage coincide con él (nada se declara sin mostrarse).
    expect(names).toEqual(fm.map((f) => S.plain(f.question)));
    const sectionQuestions = treeStrings(tree).map((s) => norm(s));
    const body = norm(post.content);
    for (const q of names) {
      const n = norm(q);
      expect(body.includes(n) || sectionQuestions.some((s) => s === n), `pregunta no visible en ${slug}: ${q}`).toBe(true);
    }
  });
});

describe("contenido: reglas de la capa semántica", () => {
  it("tipos por página (mapa del informe)", async () => {
    const typesOf = async (mod: string, params: Record<string, string>) =>
      (ldDocumentsFromTree(await renderTree(mod, params))[0]["@graph"] as any[]).map((n) => n["@type"]);
    expect(await typesOf(`${P}/(public)/page`, { locale: "es" })).toEqual(expect.arrayContaining(["WebPage", "WebApplication", "FAQPage"]));
    expect(await typesOf(`${P}/(public)/sobre-nosotros/page`, { locale: "es" })).toContain("AboutPage");
    for (const m of ["blog/page", "herramientas/page", "ahorro-entrada-vivienda/page"]) {
      expect(await typesOf(`${P}/(public)/${m}`, { locale: "es" })).toEqual(expect.arrayContaining(["CollectionPage", "ItemList"]));
    }
    expect(await typesOf(`${P}/(public)/herramientas/calculadora-ahorro/page`, { locale: "es" })).toEqual(
      expect.arrayContaining(["WebApplication", "HowTo", "FAQPage", "BreadcrumbList"]),
    );
    expect(await typesOf(`${P}/(public)/plantillas/[slug]/page`, { locale: "es", slug: "kakebo-para-imprimir" })).toEqual(
      expect.arrayContaining(["ItemPage", "DigitalDocument", "FAQPage", "BreadcrumbList"]),
    );
    expect(await typesOf(`${P}/(public)/ahorro-entrada-vivienda/[provincia]/page`, { locale: "es", provincia: "madrid" })).toEqual(
      expect.arrayContaining(["WebPage", "Dataset", "FAQPage", "BreadcrumbList"]),
    );
  });

  it("calculadora de ahorro: sin dateModified fijo; operatingSystem de la app principal «Web, PWA»", async () => {
    const [ahorro] = ldDocumentsFromTree(await renderTree(`${P}/(public)/herramientas/calculadora-ahorro/page`, { locale: "es" }));
    expect(JSON.stringify(ahorro)).not.toContain("2026-10-21");
    const [home] = ldDocumentsFromTree(await renderTree(`${P}/(public)/page`, { locale: "es" }));
    const app = home["@graph"].find((n: any) => n["@type"] === "WebApplication");
    expect(app.operatingSystem).toBe("Web, PWA");
    expect(JSON.stringify(home)).not.toMatch(/iOS|Android/);
  });

  it("inflación: sin DefinedTermSet «Diccionario Financiero Kakebo»; featureList es un array", async () => {
    const [doc] = ldDocumentsFromTree(await renderTree(`${P}/(landing)/herramientas/calculadora-inflacion/page`, { locale: "es" }));
    expect(JSON.stringify(doc)).not.toMatch(/DefinedTermSet|Diccionario Financiero/);
    const app = doc["@graph"].find((n: any) => n["@type"] === "WebApplication");
    expect(Array.isArray(app.featureList)).toBe(true);
  });

  it("regla 50/30/20 e inflación llevan inLanguage «es» también bajo /en cuando su texto es fijo en español (regla)", async () => {
    const [regla] = ldDocumentsFromTree(await renderTree(`${P}/(landing)/herramientas/regla-50-30-20/page`, { locale: "en" }));
    const page = regla["@graph"].find((n: any) => n["@type"] === "WebPage");
    expect(page.inLanguage).toBe("es");
    expect(regla["@graph"].find((n: any) => n["@type"] === "HowTo").inLanguage).toBe("es");
  });

  it("sobre-nosotros: contacto leído de About.contact.*, sin jobTitle", async () => {
    const [doc] = ldDocumentsFromTree(await renderTree(`${P}/(public)/sobre-nosotros/page`, { locale: "es" }));
    const org = doc["@graph"].find((n: any) => n["@type"] === "Organization");
    const t = createTranslator({ locale: "es", namespace: "About.contact" as never, messages: esMessages as never }) as unknown as (k: string) => string;
    expect(org.contactPoint.telephone).toBe(t("phone"));
    expect(org.contactPoint.email).toBe(t("email"));
    expect(JSON.stringify(doc)).not.toContain("jobTitle");
    expect(doc["@graph"].some((n: any) => n["@id"] === `${S.BASE_URL}/#motoko-hani`)).toBe(true);
  });

  it("artículos: autor → #person, publisher → #organization, imagen absoluta y sin SoftwareApplication", async () => {
    const [doc] = ldDocumentsFromTree(await renderTree(`${P}/(public)/blog/[slug]/page`, { locale: "es", slug: "plantilla-kakebo-excel" }));
    const article = doc["@graph"].find((n: any) => n["@type"] === "BlogPosting");
    expect(article.author).toEqual({ "@id": S.ids.person });
    expect(article.publisher).toEqual({ "@id": S.ids.org });
    expect(article.image[0]).toMatch(/^https:\/\//);
    // La plantilla es una hoja de cálculo, no software: se enlaza con about → Microsoft Excel (único SoftwareApplication del grafo).
    const apps = doc["@graph"].filter((n: any) => n["@type"] === "SoftwareApplication");
    expect(apps.map((n: any) => n.name)).toEqual(["Microsoft Excel"]);
    expect(JSON.stringify(doc)).not.toContain("Plantilla Kakebo Excel Gratis");
    expect(doc["@graph"].some((n: any) => n["@id"] === `${S.BASE_URL}/#microsoft-excel`)).toBe(true);
  });

  it("política de grafía: «kakeibo» solo en el JSON-LD en inglés; nada en español en el JSON-LD inglés", async () => {
    const es = JSON.stringify(ldDocumentsFromTree(await renderTree(`${P}/(public)/page`, { locale: "es" })));
    const en = JSON.stringify(ldDocumentsFromTree(await renderTree(`${P}/(public)/page`, { locale: "en" })));
    expect(es).not.toMatch(/kakeibo/i);
    expect(en).toMatch(/Kakeibo/);
    expect(en.replace("Aitor Alarcón", "")).not.toMatch(/[¿¡áéíóúñÁÉÍÓÚÑ]/);
  });
});

describe("artículos MDX: el JSON-LD lo genera solo la plantilla", () => {
  it("ningún .mdx incrusta <script> (un solo script ld+json por página)", () => {
    const dir = join(process.cwd(), "src/content/blog");
    const withScript = readdirSync(dir)
      .filter((f) => f.endsWith(".mdx"))
      .filter((f) => /<script|ld\+json/i.test(readFileSync(join(dir, f), "utf-8")));
    expect(withScript).toEqual([]);
  });
});

describe("fechas y campos del Dataset en las páginas", () => {
  const isoTz = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
  const datesOf = (v: any, out: string[] = []): string[] => {
    if (Array.isArray(v)) v.forEach((x) => datesOf(x, out));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) {
        if ((k === "datePublished" || k === "dateModified") && typeof x === "string") out.push(x);
        else datesOf(x, out);
      }
    return out;
  };

  it.each([...ROUTES.map((r) => ({ name: r.name, mod: r.mod, params: r.params })), ...posts.map((p) => ({ name: p.name, mod: `${P}/(public)/blog/[slug]/page`, params: { locale: p.locale, slug: p.slug } }))])(
    "$name: todas las fechas llevan zona horaria",
    async ({ mod, params }) => {
      const [doc] = ldDocumentsFromTree(await renderTree(mod, params));
      for (const d of datesOf(doc["@graph"])) expect(d).toMatch(isoTz);
    },
  );

  it("artículo: usa las fechas del frontmatter con el offset de su fecha", async () => {
    const [doc] = ldDocumentsFromTree(await renderTree(`${P}/(public)/blog/[slug]/page`, { locale: "es", slug: "alternativas-a-app-bancarias" }));
    const article = doc["@graph"].find((n: any) => n["@type"] === "BlogPosting");
    expect(article.datePublished).toBe("2026-01-13T00:00:00+01:00");
    expect(article.dateModified).toBe("2026-07-20T00:00:00+02:00");
  });

  it("vivienda: el Dataset declara el periodo y la descarga visibles en la página", async () => {
    const tree = await renderTree(`${P}/(public)/ahorro-entrada-vivienda/[provincia]/page`, { locale: "es", provincia: "madrid" });
    const [doc] = ldDocumentsFromTree(tree);
    const ds = doc["@graph"].find((n: any) => n["@type"] === "Dataset");
    expect(ds.temporalCoverage).toMatch(/^\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}$/);
    expect(ds.distribution["@type"]).toBe("DataDownload");
    const visible = treeStrings(tree).join(" ");
    expect(visible).toContain("trimestre de 2026"); // el periodo que origina temporalCoverage
    expect(ds).not.toHaveProperty("license"); // el aviso legal no se muestra en la página
  });

  it("producto premium y calculadora de inflación: sin campos sin respaldo visible (rating, envío, devoluciones)", async () => {
    for (const [mod, params] of [[`${P}/(public)/herramientas/plantilla-kakebo-excel-premium/page`, { locale: "es" }], [`${P}/(landing)/herramientas/calculadora-inflacion/page`, { locale: "es" }]] as const) {
      const json = JSON.stringify(ldDocumentsFromTree(await renderTree(mod, params as any)));
      expect(json).not.toMatch(/shippingDetails|hasMerchantReturnPolicy|priceValidUntil|"sku"|gtin|softwareVersion|screenshot/);
    }
  });
});

describe("perfiles de X no verificados: no se declaran como propios", () => {
  it.each([...ROUTES.map((r) => ({ name: r.name, mod: r.mod, params: r.params })), ...posts.slice(0, 6).map((p) => ({ name: p.name, mod: `${P}/(public)/blog/[slug]/page`, params: { locale: p.locale, slug: p.slug } }))])(
    "$name: el grafo no contiene x.com ni twitter.com; Organization sin sameAs y Person solo con GitHub",
    async ({ mod, params }) => {
      const [doc] = ldDocumentsFromTree(await renderTree(mod, params));
      expect(JSON.stringify(doc)).not.toMatch(/x\.com|twitter\.com|kakebo_ai|aitoralmu"/i);
      const org = doc["@graph"].find((n: any) => n["@type"] === "Organization");
      expect(org).not.toHaveProperty("sameAs"); // sin valores verificados: la propiedad se omite, no queda vacía
      const person = doc["@graph"].find((n: any) => n["@type"] === "Person" && n["@id"] === S.ids.person);
      expect(person.sameAs).toEqual(["https://github.com/mrsteppenwolf627"]);
    },
  );

  it("el layout no declara @kakebo_ai como twitter:creator", () => {
    expect(readFileSync(join(process.cwd(), "src/app/[locale]/layout.tsx"), "utf-8")).not.toMatch(/kakebo_ai/);
  });
});
