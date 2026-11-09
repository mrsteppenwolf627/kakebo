// Genera y valida grafos JSON-LD con datos reales del repo. Uso: node --experimental-strip-types scripts/generar-ejemplos.mts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as S from "../src/lib/seo/jsonld.ts";

const ROOT = process.cwd(); // raíz del repo (donde están messages/ y src/content/)
const OUT = process.env.JSONLD_OUT ?? path.join(os.tmpdir(), "seo-jsonld-ejemplos"); // fuera del árbol de git
fs.mkdirSync(OUT, { recursive: true });

const es = JSON.parse(fs.readFileSync(`${ROOT}/messages/es.json`, "utf8"));
const write = (name: string, doc: S.JsonNode) => {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(doc, null, 2) + "\n");
  console.log("OK", name, (doc["@graph"] as unknown[]).length, "nodos");
};

/* ---------- HOME (es) ---------- */
{
  const locale: S.Locale = "es";
  const url = S.localeUrl(locale, "");
  const faq = (["q1", "q2", "q3", "q4", "q5"] as const).map((k) => ({
    question: es.FAQ.questions[k].question,
    answer: es.FAQ.questions[k].answer,
  }));
  const app = S.webApplication({
    id: S.ids.app,
    name: "Kakebo AI",
    url: S.BASE_URL,
    description: S.siteCopy[locale].appDescription,
    featureList: S.siteCopy[locale].appFeatures,
    inLanguage: locale,
    operatingSystem: "Web, PWA",
    about: ["kakeibo"],
  });
  write(
    "home.es.json",
    S.graph([
      ...S.core(locale),
      ...S.webPage({ locale, path: "", name: es.Landing.meta.title, description: es.Landing.meta.description, mainEntityId: S.ids.app, about: ["kakeibo"] }),
      app,
      S.faqPage(url, faq, locale),
    ]),
  );
}

/* ---------- SOBRE NOSOTROS (es) ---------- */
{
  const locale: S.Locale = "es";
  write(
    "sobre-nosotros.es.json",
    S.graph([
      ...S.core(locale, { contact: { telephone: es.About.contact.phone, email: "<valor de About.contact.email en messages>" } }),
      ...S.webPage({
        locale,
        path: "/sobre-nosotros",
        type: "AboutPage",
        name: es.About.meta.title,
        description: es.About.meta.description,
        breadcrumbs: S.crumbs(locale, [{ name: "Sobre nosotros", path: "/sobre-nosotros" }]),
        mainEntityId: S.ids.org,
        about: ["kakeibo"],
        mentions: [S.motokoHani],
      }),
    ]),
  );
}

/* ---------- ARTÍCULOS ---------- */
function post(slug: string) {
  const raw = fs.readFileSync(`${ROOT}/src/content/blog/${slug}.es.mdx`, "utf8").replace(/\r\n/g, "\n");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)!;
  const fm = m[1];
  const body = m[2];
  const get = (k: string) => fm.match(new RegExp(`^${k}:\\s*['"]?(.*?)['"]?\\s*$`, "m"))?.[1];
  const faq: S.FaqItem[] = [];
  const re = /-\s*question:\s*"([^"]+)"\s*\n\s*answer:\s*"([^"]+)"/g;
  let r: RegExpExecArray | null;
  while ((r = re.exec(fm))) faq.push({ question: r[1], answer: r[2] });
  return { title: get("title")!, excerpt: get("excerpt")!, author: get("author")!, date: get("date")!, updatedDate: get("updatedDate"), image: get("image"), faq, body };
}
for (const slug of ["kakebo-vs-ynab", "alternativas-a-app-bancarias", "plantilla-kakebo-excel"]) {
  const p = post(slug);
  const shown = S.visibleFaq(p.faq, p.body);
  console.log(`   ${slug}: FAQ frontmatter=${p.faq.length} visibles=${shown.length}`);
  write(`blog.${slug}.es.json`, S.graph(S.blogPost({ locale: "es", slug, title: p.title, excerpt: p.excerpt, author: p.author, date: p.date, updatedDate: p.updatedDate, image: p.image, faq: shown })));
}

/* ---------- CALCULADORA DE INFLACIÓN (es) ---------- */
{
  const locale: S.Locale = "es";
  const path_ = "/herramientas/calculadora-inflacion";
  const url = S.localeUrl(locale, path_);
  const c = es.Tools.Inflation.content.faq;
  const faq = [
    { question: c.q1, answer: c.a1 },
    { question: c.q2, answer: `${c.a2} ${c.a2b}` },
    { question: c.q3, answer: c.a3 },
  ];
  const appId = `${url}#app`;
  write(
    "calculadora-inflacion.es.json",
    S.graph([
      ...S.core(locale),
      ...S.webPage({
        locale,
        path: path_,
        name: "Calculadora de Inflación e IPC",
        description: "Herramienta online gratuita de MetodoKakebo.com para calcular la pérdida de poder adquisitivo del dinero en función del IPC y la inflación estimada.",
        breadcrumbs: S.crumbs(locale, [
          { name: "Herramientas", path: "/herramientas" },
          { name: "Calculadora de inflación", path: path_ },
        ]),
        mainEntityId: appId,
        about: ["inflation", "consumerPriceIndex", "purchasingPower"],
      }),
      S.webApplication({
        id: appId,
        name: "Calculadora de Inflación e IPC",
        url,
        description: "Herramienta online gratuita de MetodoKakebo.com para calcular la pérdida de poder adquisitivo del dinero en función del IPC y la inflación estimada.",
        featureList: ["Cálculo de valor real", "Proyección de inflación", "Gráfico de pérdida de valor"],
        inLanguage: locale,
        about: ["inflation", "consumerPriceIndex"],
      }),
      S.faqPage(url, faq, locale),
    ]),
  );
}

/* ---------- REGLA 50/30/20 (página solo en español, también bajo /en) ---------- */
{
  const locale: S.Locale = "es";
  const path_ = "/herramientas/regla-50-30-20";
  const url = S.localeUrl(locale, path_);
  const appId = `${url}#app`;
  const steps = [
    { text: "Calcula tus ingresos netos mensuales (lo que recibes en el banco)." },
    { text: "Destina el 50% a gastos imprescindibles (alquiler, comida, facturas)." },
    { text: "Reserva un 20% para ahorro e inversión (fondo de emergencia, jubilación)." },
    { text: "Utiliza el 30% restante para caprichos y estilo de vida (cenas, ocio, viajes)." },
  ];
  write(
    "regla-50-30-20.es.json",
    S.graph([
      ...S.core(locale),
      ...S.webPage({
        locale,
        path: path_,
        name: "Calculadora 50/30/20 Gratis",
        breadcrumbs: S.crumbs(locale, [
          { name: "Herramientas", path: "/herramientas" },
          { name: "Regla 50/30/20", path: path_ },
        ]),
        mainEntityId: appId,
        about: ["personalBudget"],
      }),
      S.webApplication({
        id: appId,
        name: "Calculadora 50/30/20",
        url,
        description: "Calculadora gratuita de MetodoKakebo.com para distribuir el sueldo mensual según la regla 50/30/20: 50% necesidades, 30% deseos y 20% ahorro.",
        inLanguage: "es",
        about: ["personalBudget"],
      }),
      S.howTo(url, "Cómo aplicar la regla 50/30/20 a tu sueldo", steps, "es"),
    ]),
  );
}

/* ---------- VIVIENDA: provincia ---------- */
{
  const locale: S.Locale = "es";
  const meta = JSON.parse(fs.readFileSync(`${ROOT}/src/content/vivienda/valor-tasado.es.json`, "utf8")).meta;
  const nombre = "Madrid";
  const path_ = "/ahorro-entrada-vivienda/madrid";
  const url = S.localeUrl(locale, path_);
  const ds = S.dataset({
    id: `${url}#fuente`,
    name: meta.fuente,
    description: `Valor tasado medio de vivienda libre, provincias, ${meta.periodo}`,
    url: meta.url,
    creatorName: meta.organismo,
  });
  const place = { "@type": "AdministrativeArea", "@id": `${url}#provincia`, name: nombre, containedInPlace: S.ref(S.entities.spain["@id"] as string) };
  write(
    "vivienda-provincia.es.json",
    S.graph([
      ...S.core(locale),
      ...S.webPage({
        locale,
        path: path_,
        name: `Cuánto ahorrar para la entrada de un piso en ${nombre}`,
        breadcrumbs: S.crumbs(locale, [
          { name: "Entrada de vivienda por provincia", path: "/ahorro-entrada-vivienda" },
          { name: `Entrada de un piso en ${nombre}`, path: path_ },
        ]),
        dateModified: meta.consultado,
        about: ["personalBudget"],
        extra: { citation: S.ref(`${url}#fuente`), spatialCoverage: S.ref(`${url}#provincia`) },
      }),
      place,
      S.entities.spain,
      ds,
      S.faqPage(url, [{ question: "¿Cuánto hay que ahorrar al mes?", answer: "Ejemplo: respuesta visible de la página." }], locale),
    ]),
  );
}

/* ---------- PLANTILLA IMPRIMIBLE ---------- */
{
  const locale: S.Locale = "es";
  const pl = JSON.parse(fs.readFileSync(`${ROOT}/src/content/plantillas/plantillas.es.json`, "utf8"))[0];
  const path_ = `/plantillas/${pl.slug}`;
  const url = S.localeUrl(locale, path_);
  write(
    "plantilla.es.json",
    S.graph([
      ...S.core(locale),
      ...S.webPage({
        locale,
        path: path_,
        type: "ItemPage",
        name: pl.h1,
        description: pl.metaDescription,
        breadcrumbs: S.crumbs(locale, [
          { name: "Plantillas Kakebo", path: "/blog/plantilla-kakebo-excel" },
          { name: pl.h1, path: path_ },
        ]),
        mainEntityId: `${url}#documento`,
        about: ["kakeibo"],
        dateModified: pl.updatedDate,
      }),
      S.digitalDocument({
        id: `${url}#documento`,
        name: pl.h1,
        description: pl.metaDescription,
        url: S.abs(pl.asset.path),
        encodingFormat: "application/pdf",
        dateModified: pl.updatedDate,
        inLanguage: "es",
      }),
      S.faqPage(url, pl.faq, locale),
    ]),
  );
}

/* ---------- PREMIUM ---------- */
{
  const locale: S.Locale = "es";
  const path_ = "/herramientas/plantilla-kakebo-excel-premium";
  const url = S.localeUrl(locale, path_);
  write(
    "premium.es.json",
    S.graph([
      ...S.core(locale),
      ...S.webPage({
        locale,
        path: path_,
        type: "ItemPage",
        name: "Plantilla Kakebo Excel Premium",
        breadcrumbs: S.crumbs(locale, [
          { name: "Herramientas", path: "/herramientas" },
          { name: "Plantilla Kakebo Excel Premium", path: path_ },
        ]),
        mainEntityId: `${url}#producto`,
        about: ["kakeibo", "excel"],
      }),
      S.product({
        id: `${url}#producto`,
        name: "Plantilla Kakebo Excel Premium",
        description: "Plantilla de hoja de cálculo Kakebo.",
        url,
        images: ["/images/premium/panel.png"],
        category: "Spreadsheet template",
        commerce: { price: "9.90", currency: "EUR" },
      }),
    ]),
  );
}

/* ---------- Prueba negativa: referencia colgante debe fallar ---------- */
try {
  S.graph([{ "@type": "WebPage", "@id": "https://x/#a", isPartOf: S.ref("https://x/#no-existe") }]);
  console.log("FALLO: no detectó referencia colgante");
  process.exit(1);
} catch (e) {
  console.log("OK prueba negativa:", (e as Error).message);
}
