# Auditoría de la capa semántica (Schema.org / JSON-LD) — metodokakebo.com

Fecha: 2026-11-09 · Repositorio auditado: `Cursor projects/kakebo` (copia local) · Autor: Aitor Alarcón Muñoz

## 0. Alcance y método

- **Leído en código fuente**: layout raíz, 12 rutas públicas con JSON-LD (home, sobre-nosotros, blog índice y `[slug]`, herramientas índice, calculadora de ahorro, calculadora de inflación, regla 50/30/20, plantilla premium, plantillas `[slug]`, vivienda índice y `[provincia]`), `components/seo/SoftwareAppJsonLd.tsx`, `lib/blog.ts`, `messages/es.json` y `en.json`, 18 artículos `*.es.mdx`, `plantillas.es.json`, `valor-tasado.es.json`.
- **Paridad visible**: contrastada a nivel de código fuente (mismo origen de datos que el DOM del Server Component). **No** se descargó el HTML renderizado de producción.
- **No auditado**: los 18 artículos `*.en.mdx`, rutas `/en` de páginas con texto fijo, `mobile/`. La búsqueda de usos de `SoftwareAppJsonLd` se hizo sobre `repomix-output.xml` (instantánea anterior a los últimos cambios).
- **Identificadores Wikidata**: comprobados en la página de cada ítem en wikidata.org el 2026-11-09. Los no comprobados se señalan.
- **Validación técnica**: el módulo entregado compila con `tsc --strict` y los 10 grafos de ejemplo se generaron con datos reales del repo; el generador falla si una referencia `{"@id"}` no resuelve dentro del grafo (prueba negativa incluida).

## 1. Resumen

| Métrica | Antes | Después |
|---|---|---|
| Scripts `ld+json` por página | 1–3 (premium: 3; home: 2; calculadoras: 2) | 1 por página |
| Estructura | Objetos aislados / arrays de objetos con `@context` repetido; solo home y about usan `@graph` | `@graph` único en todas las páginas |
| Entidades con `@id` compartido | 2 (`#organization`, `#person`) | `#organization`, `#website`, `#person`, `#logo`, `#app` + `#webpage`, `#breadcrumb`, `#faq`, etc. por página |
| Referencias `@id` colgantes | 3 páginas (`publisher` → `#organization` sin nodo en la página) | 0 (validado en build) |
| Entidades con `sameAs` canónico | 0 de contenido (solo perfiles sociales) | 9 conceptos con Wikidata (+ Wikipedia donde está confirmada) |
| FAQPage con preguntas no visibles | home, inflación, 13 de 18 artículos ES | 0 |

## 2. Fase 1 — Entidades y desambiguación

| Entidad (texto del sitio) | Rol | Ambigüedad detectada | Tipo propuesto | Identificador canónico |
|---|---|---|---|---|
| Kakebo / método Kakebo | Concepto central | «Kakebo» (método) vs «Kakebo AI» (producto) vs «Kakebo» (libro físico) | `DefinedTerm` | Wikidata **Q388197** (enlaza enwiki/eswiki *Kakeibo*) + Wikipedia en/es |
| Kakebo AI | Herramienta | Producto propio, sin entrada externa | `WebApplication` | — (solo `@id` propio `#app`) |
| MetodoKakebo.com | Organización | — | `Organization` | sin `sameAs` (los perfiles de X no son del propietario y se retiraron); no existe ítem Wikidata |
| Aitor Alarcón | Persona/fundador | — | `Person` | `sameAs` X y GitHub (ya existentes) |
| Motoko Hani | Autora histórica (citada en About) | — | `Person` (`mentions`) | Wikipedia en (sin Q verificado) |
| Ahorro | Concepto | Verbo vs nombre vs «Cuenta de ahorro» | `DefinedTerm` | Q319622 |
| Presupuesto personal | Concepto | «Presupuesto» público vs doméstico | `DefinedTerm` | Q3525860 |
| Presupuesto base cero (YNAB) | Método comparado | — | `DefinedTerm` | Q191900 + Wikipedia en/es |
| Finanzas personales | Dominio | — | `DefinedTerm` | Q253613 + Wikipedia en/es |
| IPC | Indicador | IPC (España) vs CPI genérico | `DefinedTerm` | Q180687 (genérico; existe ítem español distinto, no usado) |
| Inflación | Concepto | Inflación vs IPC | `DefinedTerm` | Q35865 |
| Poder adquisitivo | Concepto | — | `DefinedTerm` | Q271969 |
| Microsoft Excel | Herramienta | Excel vs Google Sheets | `SoftwareApplication` | Q11272 |
| España | Ámbito de las páginas de vivienda | — | `Country` | Q29 — **no re-verificado hoy** |

Sin identificador verificado (omitidos a propósito, sin `sameAs` inventado): regla 50/30/20, fondo de emergencia, YNAB como producto, Fintonic, las 12 provincias.

## 3. Fase 2 — Discrepancias frente a Schema.org y Google Rich Results

Severidad: **A** = declara algo no visible o rompe el grafo · **M** = tipo/propiedad mejorable o inconsistente · **B** = menor.

| # | Página / archivo | Hallazgo | Sev. | Corrección aplicada |
|---|---|---|---|---|
| 1 | `components/seo/SoftwareAppJsonLd.tsx` | `aggregateRating` 4.8 / 150 valoraciones sin reseñas visibles; `softwareVersion` y `datePublished` fijos. Componente sin importar en `src/` (código muerto) | A | Eliminar el componente. Mientras exista, un `import` accidental publicaría valoraciones inventadas |
| 2 | Home | FAQPage con 3 preguntas (`Landing.SEO.faqSchema`); el FAQ visible tiene 5 distintas (`FAQ.questions`) | A | FAQPage generado desde `FAQ.questions.q1–q5` |
| 3 | Home (EN) | Descripciones del grafo fijas en español bajo `/en` | M | `siteCopy[locale]` |
| 4 | Home | `SoftwareApplication` con `operatingSystem: "Web, PWA, iOS, Android"`; no se encontró listado de apps nativas en el código revisado | M | `Web, PWA`. Revertir solo si existen apps en tiendas |
| 5 | Home / About / Blog | Tres URLs de logo distintas (`/logo.png`, `/icon.png`) y `logo` como string o ImageObject según la página | M | Un único `ImageObject` `#logo` → `/logo.png` en todas |
| 6 | About | `jobTitle: "Fundador y Desarrollador"` no aparece en el texto visible (solo «creador del proyecto») | A | Propiedad eliminada; relación expresada con `Organization.founder` |
| 7 | About | `ContactPoint` correcto y visible (teléfono, email). Email y teléfono se toman de `About.contact.*` (misma fuente que el DOM); en `ejemplos/sobre-nosotros.es.json` el email figura como marcador de posición | B | Sin valores literales en código |
| 8 | Blog `[slug]` | `image` relativa (`/images/blog/...`) en `BlogPosting` | M | `abs()` a URL absoluta |
| 9 | Blog `[slug]` | `author` = `Person` solo con `name`; no enlaza con el `Person` de About | M | `author` → `{"@id": "#person"}` cuando el autor es Aitor Alarcón |
| 10 | Blog `[slug]` | `publisher` sin `url`; `mainEntityOfPage` con `WebPage` inline cuyo `@id` es la URL (sin nodo WebPage) | M | `publisher` → `#organization`; `WebPage` real `#webpage` enlazado con `isPartOf`/`mainEntityOfPage` |
| 11 | Blog `[slug]` | FAQPage tomado del frontmatter sin comprobar visibilidad. En 18 artículos ES: 69 preguntas en frontmatter, **35 literalmente visibles**, 34 no | A | `visibleFaq()` filtra por coincidencia con el cuerpo |
| 12 | Blog `plantilla-kakebo-excel` | `SoftwareApplication` «Plantilla Kakebo Excel Gratis» para una hoja de cálculo (no es software); `featureList` no verificada en el cuerpo | M | `about` → `Microsoft Excel` (Q11272); el artículo conserva `BlogPosting` |
| 13 | Calculadora de ahorro | `dateModified: "2026-10-21"` fijo, sin fecha visible | A | Eliminado |
| 14 | Calculadora de ahorro / inflación / regla 50-30-20 | `publisher: {"@id": "#organization"}` sin nodo `Organization` en la página | A | `core()` incluye Organization/WebSite/Person en cada grafo |
| 15 | Las tres calculadoras | `SoftwareApplication` genérico | M | `WebApplication` (subtipo más específico) |
| 16 | Calculadora de inflación | FAQPage con 4 preguntas; en pantalla hay 3 (`Tools.Inflation.content.faq`) con otra redacción. Solo coincide una pregunta | A | FAQ generado desde `messages` (texto sin etiquetas `<bold>`) |
| 17 | Calculadora de inflación | `DefinedTerm` «Inflación» dentro de `DefinedTermSet` «Diccionario Financiero Kakebo»: ese diccionario no existe en el sitio | A | Sustituido por `about` → `inflation`, `consumerPriceIndex`, `purchasingPower` con `sameAs` |
| 18 | Calculadora de inflación | `featureList` como un único string separado por comas | B | Array de strings |
| 19 | Regla 50/30/20 y calculadora de inflación | Texto fijo en español también bajo `/en` | M | `inLanguage` fijado a `es` en estos grafos. Confirmar si `/en` debe existir para estas rutas |
| 20 | Regla 50/30/20 | `HowToStep` sin `name` (solo `text`) | B | Se mantiene: el texto visible no tiene título de paso |
| 21 | Vivienda `[provincia]` | `isPartOf`/`publisher` como objetos inline sin `@id`; `citation` como `CreativeWork` genérico | M | `@id` compartidos; la fuente pasa a `Dataset` (nombre, descripción, URL, creador) enlazado por `citation`; provincia como `AdministrativeArea` |
| 22 | Vivienda | `dateModified` = fecha de consulta del dato (visible como «Consultado el…») | B | Se mantiene; semánticamente es fecha de consulta |
| 23 | Plantillas `[slug]` | Solo `BreadcrumbList` + `FAQPage`; sin `WebPage` ni entidad principal | M | `ItemPage` + `DigitalDocument` (`encodingFormat: application/pdf`) |
| 24 | Plantilla premium | 3 scripts separados; `brand` inline; sin `WebPage` | M | `ItemPage` + `Product` en un grafo; `brand`/`seller` → `#organization`. `offers` solo con comercio activo (ya correcto) |
| 25 | Todas | `JSON.stringify` sin escapar `<`: una respuesta FAQ con `</script>` rompería la página | M | `serialize()` escapa `<`, U+2028 y U+2029 |
| 26 | Todas | Blog índice, herramientas y vivienda índice: `CollectionPage` + `ItemList` correctos | — | Se conservan, con `@id` y `numberOfItems` |

**Propiedades inexistentes o deprecadas**: no se encontraron propiedades inventadas en el JSON-LD actual. Al construir el módulo se descartó `numberOfPages` en `DigitalDocument` (solo existe en `Book`).

**Limitaciones de elegibilidad en Google (documentación de Google, no re-verificada hoy)**: los resultados enriquecidos de FAQ están restringidos a sitios gubernamentales y de salud; los de HowTo se retiraron. Los tipos se mantienen por su valor semántico, sin esperar rich result. `SoftwareApplication`/`WebApplication` exige `name`, `offers.price` y `aggregateRating` o `review` para ser elegible; sin reseñas reales no hay rich result y no se debe añadir `aggregateRating`.

### Mapa de tipos propuesto

| Página | Tipo de página | Entidad principal (`mainEntity`) | Nodos adicionales |
|---|---|---|---|
| `/` | `WebPage` | `WebApplication` Kakebo AI | `FAQPage` (5 visibles), `Organization`, `WebSite`, `Person` |
| `/sobre-nosotros` | `AboutPage` | `Organization` | `BreadcrumbList`, `Person` (Motoko Hani en `mentions`) |
| `/blog` | `CollectionPage` | `ItemList` | `BreadcrumbList` |
| `/blog/[slug]` | `WebPage` | `BlogPosting` | `BreadcrumbList`, `FAQPage` (solo visibles), `about` → entidades |
| `/herramientas` | `CollectionPage` | `ItemList` | `BreadcrumbList` |
| `/herramientas/calculadora-ahorro` | `WebPage` | `WebApplication` | `HowTo`, `FAQPage`, `BreadcrumbList` |
| `/herramientas/calculadora-inflacion` | `WebPage` | `WebApplication` | `FAQPage` (3 visibles), `about` IPC/inflación |
| `/herramientas/regla-50-30-20` | `WebPage` | `WebApplication` | `HowTo`, `BreadcrumbList` |
| `/herramientas/plantilla-kakebo-excel-premium` | `ItemPage` | `Product` | `BreadcrumbList` |
| `/plantillas/[slug]` | `ItemPage` | `DigitalDocument` | `FAQPage`, `BreadcrumbList` |
| `/ahorro-entrada-vivienda` | `CollectionPage` | `ItemList` | `BreadcrumbList` |
| `/ahorro-entrada-vivienda/[provincia]` | `WebPage` | — (`citation` → `Dataset`, `spatialCoverage` → `AdministrativeArea`) | `FAQPage`, `BreadcrumbList` |

## 4. Fase 3 — Grafo consolidado

Todas las páginas comparten el mismo núcleo y se enlazan así:

```
Organization (#organization) ──logo──▶ ImageObject (#logo)
      ▲  ▲                      └─founder─▶ Person (#person) ──knowsAbout──▶ DefinedTerm
      │  └── publisher ── WebSite (#website) ◀── isPartOf ── WebPage (<url>#webpage)
      │                                                         ├─ breadcrumb ▶ BreadcrumbList
      └── author/publisher ◀── entidad principal ◀─ mainEntity ─┤─ about ▶ DefinedTerm (+sameAs)
                                (WebApplication · BlogPosting · Product · DigitalDocument)
                                                                └─ FAQPage / HowTo (isPartOf ▶ #webpage)
```

Archivos entregados:

- `src/lib/seo/jsonld.ts` — builders, registro de entidades, `graph()` (fusiona por `@id` y valida referencias), `serialize()`, `visibleFaq()`.
- `src/components/seo/JsonLd.tsx` — Server Component que emite el único `<script>`.
- `scripts/generar-ejemplos.mts` — genera y valida los grafos con los datos reales.
- `ejemplos/*.json` — 10 grafos generados.

Integración (ejemplos; el patrón es el mismo en cada ruta):

```tsx
// Home — (public)/page.tsx: sustituye los dos <script> por:
import JsonLd from "@/components/seo/JsonLd";
import * as S from "@/lib/seo/jsonld";

const url = S.localeUrl(locale, "");
const tFaq = await getTranslations({ locale, namespace: "FAQ" });
const faq = (["q1","q2","q3","q4","q5"] as const).map((k) => ({ question: tFaq(`questions.${k}.question`), answer: tFaq(`questions.${k}.answer`) }));

<JsonLd graph={S.graph([
  ...S.core(locale),
  ...S.webPage({ locale, path: "", name: t("meta.title"), description: t("meta.description"), mainEntityId: S.ids.app, about: ["kakeibo"] }),
  S.webApplication({ id: S.ids.app, name: "Kakebo AI", url: S.BASE_URL, description: S.siteCopy[locale].appDescription,
    featureList: S.siteCopy[locale].appFeatures, inLanguage: locale, operatingSystem: "Web, PWA", about: ["kakeibo"] }),
  S.faqPage(url, faq, locale),
])} />
```

```tsx
// Blog — (public)/blog/[slug]/page.tsx: sustituye el <script> con el array por:
<JsonLd graph={S.graph(S.blogPost({
  locale, slug, title: post.frontmatter.title, excerpt: post.frontmatter.excerpt, author: post.frontmatter.author,
  date: post.frontmatter.date, updatedDate: post.frontmatter.updatedDate, image: post.frontmatter.image,
  faq: S.visibleFaq(post.frontmatter.faq, post.content),
}))} />
```

```tsx
// Inflación / ahorro / regla: webPage + webApplication + faqPage/howTo con los mismos textos que se renderizan
// (ver scripts/generar-ejemplos.mts, bloques «CALCULADORA DE INFLACIÓN» y «REGLA 50/30/20»).
```

## 5. Fase 4 — Contenido visible vs. datos estructurados

| Página | Dato declarado | ¿Visible en el DOM? | Resultado |
|---|---|---|---|
| Home | Descripciones Organization/WebSite/App, `featureList` | Sí (copy de la landing) | Conforme |
| Home | FAQPage (3 preguntas) | No (el FAQ visible es otro) | **Corregido** (5 preguntas visibles) |
| About | Teléfono, email, nombre | Sí (`contact.*`) | Conforme |
| About | `jobTitle` «Fundador y Desarrollador» | No | **Eliminado** |
| About | `sameAs` X/GitHub | No (enlaces no visibles) | Aceptable: son identificadores, no afirmaciones de contenido |
| Blog | `headline`, fechas, autor, imagen | Sí (H1, `<time>`, autor, imagen) | Conforme |
| Blog | FAQPage del frontmatter | 35 de 69 preguntas | **Filtrado** a las visibles |
| Calc. ahorro | HowTo y FAQ | Sí (misma fuente `savings-calculator-page.ts`) | Conforme |
| Calc. ahorro | `dateModified` | No | **Eliminado** |
| Calc. inflación | FAQ (4) | 3 visibles, otra redacción | **Corregido** |
| Calc. inflación | DefinedTermSet «Diccionario Financiero Kakebo» | No | **Eliminado** |
| Regla 50/30/20 | HowTo (4 pasos) | Sí (renderizado desde la misma constante) | Conforme |
| Vivienda `[provincia]` | FAQ, fuente, periodo, fecha de consulta | Sí | Conforme |
| Plantillas `[slug]` | FAQ, fecha de actualización | Sí | Conforme |
| Premium | Producto, imágenes, FAQ, precio 9,90 € solo con comercio activo | Sí | Conforme |

Detalle de artículos ES (preguntas del frontmatter / literalmente visibles en el cuerpo): visibles al 100 %: `alternativas-a-app-bancarias` 6/6, `como-hacer-un-presupuesto-personal` 7/7, `fondo-de-emergencia` 6/6, `kakebo-online-guia-completa` 5/5, `regla-50-30-20-ejemplo` 6/6. Parciales: `cuentas-remuneradas` 4/6, `metodo-kakebo-guia-definitiva` 1/3. Sin ninguna visible: `ahorro-pareja` 0/2, `como-ahorrar-dinero-cada-mes` 0/3, `eliminar-gastos-hormiga` 0/2, `kakebo-online-gratis` 0/2, `kakebo-sueldo-minimo` 0/4, `kakebo-vs-ynab` 0/2, `libro-kakebo-pdf` 0/4, `metodo-kakebo-para-autonomos` 0/2, `peligros-apps-ahorro-automatico` 0/2, `plantilla-kakebo-excel` 0/5 (el cuerpo tiene 5 `FaqItem` con otra redacción), `regla-30-dias` 0/2. El criterio es coincidencia literal del texto de la pregunta: una pregunta redactada de forma distinta en el cuerpo cuenta como no visible.

## 6. Bloques JSON-LD corregidos

### 6.1 Home (`/`) — completo

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.metodokakebo.com/#organization",
      "name": "MetodoKakebo.com",
      "url": "https://www.metodokakebo.com",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://www.metodokakebo.com/#logo",
        "url": "https://www.metodokakebo.com/logo.png",
        "contentUrl": "https://www.metodokakebo.com/logo.png"
      },
      "image": {
        "@id": "https://www.metodokakebo.com/#logo"
      },
      "description": "Plataforma web gratuita de herramientas y artículos para aplicar el método Kakebo de ahorro personal en formato digital, sin conectar cuentas bancarias.",
      "founder": {
        "@id": "https://www.metodokakebo.com/#person"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://www.metodokakebo.com/#website",
      "url": "https://www.metodokakebo.com",
      "name": "MetodoKakebo.com",
      "description": "Herramientas gratuitas y guías para aplicar el método Kakebo de ahorro personal en español.",
      "inLanguage": [
        "es",
        "en"
      ],
      "publisher": {
        "@id": "https://www.metodokakebo.com/#organization"
      }
    },
    {
      "@type": "Person",
      "@id": "https://www.metodokakebo.com/#person",
      "name": "Aitor Alarcón",
      "url": "https://www.metodokakebo.com/sobre-nosotros",
      "sameAs": [
        "https://github.com/mrsteppenwolf627"
      ],
      "worksFor": {
        "@id": "https://www.metodokakebo.com/#organization"
      },
      "knowsAbout": [
        {
          "@id": "https://www.metodokakebo.com/#kakeibo"
        },
        {
          "@id": "https://www.metodokakebo.com/#finanzas-personales"
        }
      ]
    },
    {
      "@type": "DefinedTerm",
      "@id": "https://www.metodokakebo.com/#kakeibo",
      "name": "Kakebo",
      "alternateName": [
        "Kakeibo",
        "家計簿"
      ],
      "description": "Método japonés de ahorro personal basado en registrar, clasificar y revisar los gastos del hogar, creado en 1904.",
      "sameAs": [
        "https://www.wikidata.org/wiki/Q388197",
        "https://en.wikipedia.org/wiki/Kakeibo",
        "https://es.wikipedia.org/wiki/Kakeibo"
      ]
    },
    {
      "@type": "DefinedTerm",
      "@id": "https://www.metodokakebo.com/#finanzas-personales",
      "name": "Finanzas personales",
      "alternateName": "Personal finance",
      "sameAs": [
        "https://www.wikidata.org/wiki/Q253613",
        "https://en.wikipedia.org/wiki/Personal_finance",
        "https://es.wikipedia.org/wiki/Finanzas_personales"
      ]
    },
    {
      "@type": "WebPage",
      "@id": "https://www.metodokakebo.com/#webpage",
      "url": "https://www.metodokakebo.com",
      "name": "Kakebo AI | App Gratis del Método Kakebo",
      "description": "MetodoKakebo.com es la herramienta gratuita para aplicar el método Kakebo online. Controla gastos, organiza tu presupuesto mensual y mejora el ahorro. Sin banco, 100% privada.",
      "inLanguage": "es",
      "isPartOf": {
        "@id": "https://www.metodokakebo.com/#website"
      },
      "mainEntity": {
        "@id": "https://www.metodokakebo.com/#app"
      },
      "about": [
        {
          "@id": "https://www.metodokakebo.com/#kakeibo"
        }
      ]
    },
    {
      "@type": "WebApplication",
      "@id": "https://www.metodokakebo.com/#app",
      "name": "Kakebo AI",
      "url": "https://www.metodokakebo.com",
      "description": "Aplicación web gratuita de MetodoKakebo.com para registrar gastos y planificar el ahorro mensual con el método Kakebo japonés y asistencia de inteligencia artificial.",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web, PWA",
      "inLanguage": "es",
      "isAccessibleForFree": true,
      "featureList": [
        "Registro manual consciente de gastos",
        "Agente IA financiero personal",
        "Sin conexión bancaria",
        "Categorías Kakebo nativas",
        "Historial y exportación"
      ],
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock",
        "url": "https://www.metodokakebo.com"
      },
      "author": {
        "@id": "https://www.metodokakebo.com/#organization"
      },
      "publisher": {
        "@id": "https://www.metodokakebo.com/#organization"
      },
      "about": [
        {
          "@id": "https://www.metodokakebo.com/#kakeibo"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.metodokakebo.com/#faq",
      "isPartOf": {
        "@id": "https://www.metodokakebo.com/#webpage"
      },
      "inLanguage": "es",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "¿Realmente es gratis empezar?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sí, 100%. Puedes registrarte y usar el Plan Manual (control de gastos completo) sin pagar nada. El registro es instantáneo y no necesitas tarjeta de crédito."
          }
        },
        {
          "@type": "Question",
          "name": "¿Qué incluye Kakebo?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Incluye todo: registro ilimitado de gastos, gestión de gastos fijos, asistente de IA, análisis automático, consejos personalizados y predicciones de ahorro. Todo de forma gratuita."
          }
        },
        {
          "@type": "Question",
          "name": "¿Habrá que pagar en el futuro?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Las funciones actuales seguirán siendo gratuitas. Nuestro objetivo es mantener siempre disponible una versión gratuita potente del núcleo de la herramienta para todos."
          }
        },
        {
          "@type": "Question",
          "name": "¿Kakebo sirve aunque ya use una app bancaria?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sí. Tu banco te muestra movimientos; Kakebo te obliga a entender decisiones y patrones. La clave está en la revisión mensual consciente y la intención de mejorar."
          }
        },
        {
          "@type": "Question",
          "name": "¿Mis datos están seguros?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sí. Usamos Supabase para autenticación y seguridad de datos. Tus datos financieros están encriptados y nunca compartimos información con terceros."
          }
        }
      ]
    }
  ]
}
```

### 6.2 Artículo con FAQ visible (`/blog/alternativas-a-app-bancarias`)

Nodos propios del artículo; Organization, WebSite, Person y entidades son los mismos que en 6.1 y van en el mismo `@graph`.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.metodokakebo.com/blog/alternativas-a-app-bancarias#webpage",
      "url": "https://www.metodokakebo.com/blog/alternativas-a-app-bancarias",
      "name": "Alternativas a Fintonic: 8 apps para controlar tus gastos sin ceder tus datos",
      "description": "Comparamos 8 alternativas a Fintonic en 2026: con y sin conexión bancaria, precio y privacidad. Encuentra la que se adapta a ti, sin ceder tus datos.",
      "inLanguage": "es",
      "isPartOf": {
        "@id": "https://www.metodokakebo.com/#website"
      },
      "breadcrumb": {
        "@id": "https://www.metodokakebo.com/blog/alternativas-a-app-bancarias#breadcrumb"
      },
      "mainEntity": {
        "@id": "https://www.metodokakebo.com/blog/alternativas-a-app-bancarias#article"
      },
      "datePublished": "2026-01-13",
      "dateModified": "2026-07-20"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.metodokakebo.com/blog/alternativas-a-app-bancarias#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Inicio",
          "item": "https://www.metodokakebo.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "https://www.metodokakebo.com/blog"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Alternativas a Fintonic: 8 apps para controlar tus gastos sin ceder tus datos",
          "item": "https://www.metodokakebo.com/blog/alternativas-a-app-bancarias"
        }
      ]
    },
    {
      "@type": "BlogPosting",
      "@id": "https://www.metodokakebo.com/blog/alternativas-a-app-bancarias#article",
      "headline": "Alternativas a Fintonic: 8 apps para controlar tus gastos sin ceder tus datos",
      "description": "Comparamos 8 alternativas a Fintonic en 2026: con y sin conexión bancaria, precio y privacidad. Encuentra la que se adapta a ti, sin ceder tus datos.",
      "inLanguage": "es",
      "image": [
        "https://www.metodokakebo.com/images/blog/alternativas-a-app-bancarias.png"
      ],
      "datePublished": "2026-01-13",
      "dateModified": "2026-07-20",
      "author": {
        "@id": "https://www.metodokakebo.com/#person"
      },
      "publisher": {
        "@id": "https://www.metodokakebo.com/#organization"
      },
      "isPartOf": {
        "@id": "https://www.metodokakebo.com/blog/alternativas-a-app-bancarias#webpage"
      },
      "mainEntityOfPage": {
        "@id": "https://www.metodokakebo.com/blog/alternativas-a-app-bancarias#webpage"
      }
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.metodokakebo.com/blog/alternativas-a-app-bancarias#faq",
      "isPartOf": {
        "@id": "https://www.metodokakebo.com/blog/alternativas-a-app-bancarias#webpage"
      },
      "inLanguage": "es",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "¿Cuál es la mejor alternativa a Fintonic?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Depende de lo que busques. Para automatización similar con mayor privacidad, Spendee o Emma. Para control de gastos sin conectar el banco con el método Kakebo, Kakebo AI o Money Manager. Para presupuesto estricto por objetivos, YNAB."
          }
        },
        {
          "@type": "Question",
          "name": "¿Hay una alternativa a Fintonic sin conectar el banco?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sí. Money Manager y Kakebo AI son alternativas a Fintonic y a otras apps bancarias que funcionan sin conectar el banco. Money Manager usa registro manual. Kakebo AI, la app de MetodoKakebo.com, usa un agente de IA conversacional que categoriza tus gastos a partir de mensajes de texto en lenguaje natural."
          }
        },
        {
          "@type": "Question",
          "name": "¿Qué aplicación es más privada que Fintonic?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Money Manager y Kakebo AI son las más privadas de esta comparativa: ninguna requiere acceso a tu cuenta bancaria. Entre las apps que sí se conectan al banco, Spendee permite usar la app en modo manual sin conectar ninguna cuenta."
          }
        },
        {
          "@type": "Question",
          "name": "¿Hay alternativas gratuitas a Fintonic?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sí. Money Manager y Kakebo AI son completamente gratuitas. Spendee y Toshl tienen versiones gratuitas con funciones básicas. Emma tiene plan gratuito. YNAB es la única de pago sin versión gratuita."
          }
        },
        {
          "@type": "Question",
          "name": "¿Cuál es mejor para controlar gastos personales sin complicarse?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Para simplicidad: Kakebo AI, la app gratuita de MetodoKakebo.com (sin banco, IA conversacional), o Spendee (visual, intuitiva). Para automatización total: Fintonic. Para control completo del dato: Money Manager."
          }
        },
        {
          "@type": "Question",
          "name": "¿Es mejor usar una app automática o registrar los gastos manualmente?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Depende de tu prioridad: la automatización ahorra tiempo pero reduce la consciencia del gasto, mientras que el registro manual —como en Money Manager o Kakebo AI— exige más disciplina pero refuerza el control activo sobre tus finanzas. Fintonic, Emma o Spendee automatizan mejor; Money Manager y Kakebo AI priorizan el registro consciente sin conectar el banco."
          }
        }
      ]
    }
  ]
}
```

Los grafos completos de sobre-nosotros, blog (3 artículos), calculadora de inflación, regla 50/30/20, vivienda por provincia, plantilla imprimible y plantilla premium están en `ejemplos/`.

## 7. Datos a confirmar antes de publicar

- Si existen apps nativas iOS/Android (afecta a `operatingSystem`).
- Q29 (España) no se re-verificó en esta sesión.
- Si `/en` debe servir las rutas de regla 50/30/20 y calculadora de inflación (hoy el texto visible es español).
- Los datos de ejemplo de vivienda, plantilla premium y calculadora de ahorro usan valores de muestra en el generador; en producción salen de las mismas variables que el JSX.

Fuentes de identificadores: wikidata.org (Q388197, Q319622, Q180687, Q35865, Q3525860, Q191900, Q253613, Q271969, Q11272) · en.wikipedia.org/wiki/Kakeibo.
