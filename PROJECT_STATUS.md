# Estado del Proyecto Kakebo AI

**Última actualización:** 2026-07-03 (SEO-GSC-ANNOTATION-CHANGELOG-01)  
**Último commit aceptado:** d8971ae  
**Rama operativa:** `main`

---

## SEO-GSC-ANNOTATION-CHANGELOG-01 — Changelog GSC sprint

**Estado:** ✅ Completado (2026-07-03)

Documento de trazabilidad creado: `docs/seo/GSC_CHANGELOG_2026_07_03.md`  
Registra 7 commits del sprint, baseline GSC, métricas a revisar y decisiones vigentes.  
**Próximo snapshot:** entre 2026-07-17 y 2026-07-31.  
Sin cambios en `src/` ni en contenido.

---

## SEO-NOINDEX-SITEMAP-SMOKE-01 — Validación técnica noindex + sitemap

**Estado:** ✅ Completado (2026-07-03)

**Bug detectado y corregido en `sitemap.ts`:**
- `getBlogPosts()` sin argumento → solo lee `.es.mdx` → noindex EN ignorado por el sitemap
- Resultado: las 10 URLs `/en/blog/...` con `noindex: true` EN aparecían igualmente en el sitemap (señal contradictoria)
- Fix: `getBlogPosts('en')` para construir `enNoindexSlugs` y dos guards `if (locale === 'en' && enNoindexSlugs.has(post.slug)) return` — uno al generar la entrada, otro en hreflang `alternates`

**Mecanismo `robots` (page.tsx):** Correcto — `post.frontmatter.noindex && { robots: { index: false, follow: false } }` ✅  
**Mecanismo `sitemap.ts`:** Corregido en este commit. Ahora los 10 slugs EN noindex no generan entrada EN en el sitemap ni en `alternates`.  
**Build:** Limpio.

---

## SEO-LEGACY-EN-NOINDEX-BATCH-01 — noindex batch 7 artículos EN legacy

**Estado:** ✅ Completado (2026-07-03)

**Artículos marcados con `noindex: true`:**
1. `ahorro-pareja.en.mdx` → `/en/blog/ahorro-pareja`
2. `kakebo-sueldo-minimo.en.mdx` → `/en/blog/kakebo-sueldo-minimo`
3. `libro-kakebo-pdf.en.mdx` → `/en/blog/libro-kakebo-pdf`
4. `metodo-kakebo-para-autonomos.en.mdx` → `/en/blog/metodo-kakebo-para-autonomos`
5. `regla-30-dias.en.mdx` → `/en/blog/regla-30-dias`
6. `kakebo-online-guia-completa.en.mdx` → `/en/blog/kakebo-online-guia-completa` ← prioridad por cross-language risk
7. `peligros-apps-ahorro-automatico.en.mdx` → `/en/blog/peligros-apps-ahorro-automatico`

**Acumulado noindex EN:** 10/15 artículos EN ahora excluidos del índice y del sitemap.  
**Excluidos del batch (según decisión):** `como-ahorrar-dinero-cada-mes` · `eliminar-gastos-hormiga` · `metodo-kakebo-guia-definitiva` (dudosos) · `como-hacer-un-presupuesto-personal` (mantener) · `plantilla-kakebo-excel` (protegido).

**Cambio por archivo:** 1 línea `noindex: true` en frontmatter. Cuerpo intacto. Sin tocar `.es.mdx`, Home, herramientas, `sitemap.ts` ni Excel.  
**Build:** Limpio.

---

## SEO-LEGACY-EN-INVENTORY-DECISION-01 — Inventario artículos EN legacy

**Estado:** ✅ Completado (2026-07-03) — solo documentación

**Resultado:** 15 artículos `.en.mdx` clasificados. Ver `docs/seo/SEO_LEGACY_EN_INVENTORY_DECISION_01.md`.

| Decisión | N | Artículos |
|---|---|---|
| ✅ Ya noindex | 3 | kakebo-online-gratis · alternativas-a-app-bancarias · kakebo-vs-ynab |
| 🟢 Mantener indexable | 1 | `como-hacer-un-presupuesto-personal` (2026-06-22 — más reciente, keyword EN real) |
| 🟡 Dudoso / esperar GSC | 3 | `como-ahorrar-dinero-cada-mes` · `eliminar-gastos-hormiga` · `metodo-kakebo-guia-definitiva` |
| 🔴 Candidatos a noindex | 7 | `ahorro-pareja` · `kakebo-sueldo-minimo` · `libro-kakebo-pdf` · `metodo-kakebo-para-autonomos` · `regla-30-dias` · `kakebo-online-guia-completa` · `peligros-apps-ahorro-automatico` |
| ⚪ No tocar | 1 | `plantilla-kakebo-excel` (protegido) |

**Próxima tarea propuesta:** `SEO-LEGACY-EN-NOINDEX-BATCH-01` — noindex en bloque de los 7 candidatos

**Archivo creado:** `docs/seo/SEO_LEGACY_EN_INVENTORY_DECISION_01.md`  
**Sin cambios en frontmatter** — solo documentación.

---

## SEO-KAKEBO-ONLINE-GUIA-SNIPPET-01 — Snippet /blog/kakebo-online-guia-completa

**Estado:** ✅ Completado (2026-07-03) — title y excerpt optimizados

**Archivo modificado:** `src/content/blog/kakebo-online-guia-completa.es.mdx` (frontmatter, 3 líneas)

| Campo | Antes | Después |
|---|---|---|
| `title` | `Kakebo online: guía completa del método Kakebo en formato digital (2026)` (73 chars) | `Kakebo online: guía completa del método Kakebo (2026)` (53 chars) |
| `excerpt` | `Cómo usar el método Kakebo en formato digital: qué herramienta elegir, cómo empezar paso a paso y los errores más comunes...` | `Guía de MetodoKakebo.com para usar el método Kakebo en formato digital: qué herramienta elegir, cómo empezar paso a paso y los errores más habituales...` |
| `updatedDate` | `2026-07-01` | `2026-07-03` |

**Nota técnica:** `description` en frontmatter no se usa en SERP (el sistema de blog usa `excerpt` para meta description y OG). Solo `title` y `excerpt` afectan al snippet.

**Justificación:**
- `title`: "en formato digital" eliminado (redundante con "online") — reduce longitud de 73→53 chars, evitando truncado al añadir " | Blog Kakebo"
- `excerpt`: añadido "Guía de MetodoKakebo.com" al inicio — señal de entidad de marca + señal de intención informativa ("guía")
- Intención informativa mantenida: no cannibaliza Home ("App Gratis") ni Excel ("plantilla")
- Cuerpo del artículo: no tocado · EN no tocado · herramientas: no tocadas

**Build:** Limpio

---

## SEO-LEGACY-EN-NOINDEX-01 — noindex artículos EN legacy

**Estado:** ✅ Completado (2026-07-03)

**Artículos EN revisados (15 total):**

| Archivo | Estado previo | Acción |
|---|---|---|
| `kakebo-online-gratis.en.mdx` | `noindex: true` (cba3fd0) | No tocado ✅ |
| `alternativas-a-app-bancarias.en.mdx` | Indexable | `noindex: true` añadido |
| `kakebo-vs-ynab.en.mdx` | Indexable | `noindex: true` añadido |
| 12 restantes (.en.mdx) | Sin cambio | No estaban en scope GSC — no tocados |

**Mecanismo reutilizado:** frontmatter `noindex: true` → `robots: { index: false, follow: false }` en `blog/[slug]/page.tsx` → exclusión automática de `sitemap.ts`. Implementado en `cba3fd0`. `sitemap.ts` no modificado en esta tarea.

**Archivos modificados:** 2 — solo frontmatter de `.en.mdx`, sin tocar cuerpo, versiones ES, Home, herramientas ni Excel.  
**Build:** Limpio.

---

## SEO-REGLA-503020-SNIPPET-GEO-01 — Snippet y señal GEO /herramientas/regla-50-30-20

**Estado:** ✅ Completado (2026-07-03) — description y ogDescription optimizados

**Cambio aplicado — `messages/es.json` namespace `Tools.Rule503020.meta`:**

| Campo | Antes | Después |
|---|---|---|
| `description` | `Calculadora 50/30/20 gratis para dividir tu sueldo entre necesidades, deseos y ahorro. Introduce tu salario y obtén tu presupuesto mensual al instante.` | `Calcula tu presupuesto mensual con la regla 50/30/20. Divide tus ingresos entre necesidades (50%), deseos (30%) y ahorro o deuda (20%). Herramienta gratuita de MetodoKakebo.com.` |
| `ogDescription` | `Divide tu sueldo entre necesidades (50%), deseos (30%) y ahorro (20%). Calculadora gratuita de presupuesto mensual basada en la regla 50/30/20.` | `Aplica la regla 50/30/20 a tus ingresos mensuales: 50% para necesidades, 30% para deseos y 20% para ahorro o deuda. Calculadora gratuita de MetodoKakebo.com.` |

**Justificación:**
- `tu sueldo` → `tus ingresos (mensuales)`: herramienta válida para cualquier ingreso, no solo salario
- `regla 50/30/20` explícita en description (antes ausente)
- `ahorro o deuda (20%)`: el 20% sirve también para cancelar deuda — mayor fidelidad a la regla original
- `MetodoKakebo.com` en description y ogDescription: señal de entidad de marca
- `title` y `ogTitle`: sin cambios (ya bien estructurados)
- Schema (SoftwareApplication + HowTo), lógica de cálculo, Home, Excel: no tocados

**Archivos modificados:** `messages/es.json` (2 líneas)  
**Build:** Limpio

---

## SEO-HOME-BRAND-ENTITY-COPY-01 — Refuerzo entidad de marca Home

**Estado:** ✅ Completado (2026-07-03) — metadata quirúrgica

**GSC base:** `/` — 892 imp / pos 8.2 / CTR 5.72% · "kakebo" brand query pos 13.74 (snapshot 2026-03-29 → 2026-06-28)

**Problema identificado:** El title "Kakebo Online Gratis | App de Ahorro con el Método Japonés" targetaba la query "kakebo online gratis" (territorio del artículo /blog/kakebo-online-gratis), y la description no incluía señal de entidad de marca ("MetodoKakebo.com" ni "método Kakebo" explícito).

**Cambio aplicado — `messages/es.json` namespace `Landing.meta`:**

| Campo | Antes | Después |
|---|---|---|
| `title` | `Kakebo Online Gratis \| App de Ahorro con el Método Japonés` | `Kakebo AI \| App Gratis del Método Kakebo` |
| `description` | `App Kakebo online gratis para controlar gastos y ahorrar con el método japonés. Sin conectar el banco, 100% privada y con IA integrada.` | `MetodoKakebo.com es la herramienta gratuita para aplicar el método Kakebo online. Controla gastos, organiza tu presupuesto mensual y mejora el ahorro. Sin banco, 100% privada.` |
| `ogTitle` | Igual al title anterior | Igual al title nuevo |
| `ogDescription` | Igual a description anterior | Igual a description nueva |

**Justificación:**
- `Kakebo AI` reemplaza a `Kakebo Online Gratis` en el title: usa el nombre oficial del producto y evita conflicto con /blog/kakebo-online-gratis
- `del Método Kakebo` en el title: señal de relación entre el producto y el método
- Description inicia con `MetodoKakebo.com es la herramienta gratuita...`: señal de entidad de marca explícita
- `el método Kakebo online` en description: keyword exacta en lugar de "el método japonés" (genérico)
- `messages/en.json`: no tocado (título EN ya estructura correcta: "Kakebo AI: Online Kakebo Savings App")

**Archivos modificados:** `messages/es.json` (4 líneas)  
**Build:** Limpio · Sin cambios en schema, diseño, calculadoras, `/blog/plantilla-kakebo-excel`  
**`.claude/settings.local.json`:** No tocado

---

## SEO-KAKEBO-ONLINE-CANIB-01 — Auditoría canibalización (scope ampliado, 2026-07-03)

**Estado:** ✅ Completado — scope extendido a todas las URLs del sitio

**Contexto:** Tarea originalmente completada el 2026-06-30 (solo canibalización EN/ES en `kakebo-online-gratis`). En la sesión de 2026-07-03 se extendió el scope al resto de URLs relacionadas con "kakebo", "método kakebo", Home, herramientas, tutorial y blog index.

**Resultado del scope ampliado:**

| Par de URLs / Query | Estado | Veredicto |
|---|---|---|
| `/en/blog/kakebo-online-gratis` vs `/blog/kakebo-online-gratis` (ES) | 15 clics EN / 1 clic ES | 🔴 CANIBALIZACIÓN CONFIRMADA — ya documentada |
| Home (`/`) vs cluster "kakebo online" | 892 imp Home / 208 imp EN | 🟡 Solapamiento normal — sin acción |
| `/blog/kakebo-online-gratis` vs `/blog/kakebo-online-guia-completa` | 37 imp guia-completa | 🟡 Dato insuficiente — intenciones diferenciadas |
| "kakebo" brand query → Home pos 13.74 | 2 clics / 168 imp | 🟡 Falta autoridad de marca — no canibalización |
| "método kakebo" → metodo-kakebo-guia-definitiva | 6 imp combinadas | ⚪ Dato insuficiente |
| Herramientas vs artículos blog | Sin overlap | 🟢 Segmentación correcta |

**Única acción recomendada:** `SEO-KAKEBO-ONLINE-CANIB-FIX-01` (ya implementado — commit `cba3fd0`)

**Documento:** `docs/seo/SEO_KAKEBO_ONLINE_CANIB_01.md` — apéndice A1-A5 añadido

---

## SEO-CALCULADORA-AHORRO-AUDIT-01 — Auditoría calculadora-ahorro

**Estado:** ✅ Completado (2026-07-03) — auditoría + un fix quirúrgico

**GSC base:** `/es/herramientas/calculadora-ahorro` — 15 clics / 43 imp / CTR 34.88% / pos 10.7 (snapshot 2026-03-29 → 2026-06-28)

**Hallazgos:**

| Hallazgo | Estado | Acción |
|---|---|---|
| `layout.tsx` con metadata de la calculadora 50/30/20 (error de copy-paste) | CONFIRMADO — error técnico | Fix: eliminado export `metadata` del layout |
| `keywords` incorrectas en HTML (consecuencia del layout erróneo) | CONFIRMADO | Resuelto al fix anterior |
| Snippet ya convierte: CTR 34.88% excepcional | DESCARTADO para cambio | No tocado |
| Pos 10.7 — oportunidad si sube a top-7 | ESPERAR DATOS | Próximo snapshot GSC |
| Schema sin campo `author` (presente en calculadora-inflacion) | DESCARTADO (impacto mínimo) | Deuda menor pendiente |

**Fix aplicado:** Eliminado export `metadata` estático de `layout.tsx` que describía la calculadora 50/30/20 en lugar de la calculadora de ahorro. La metadata real ya la gestiona el `generateMetadata` de `page.tsx`. El layout queda como shell puro (`<>{children}</>`).

**Archivos modificados:** `src/app/[locale]/(public)/herramientas/calculadora-ahorro/layout.tsx`  
**Build:** Limpio. Sin cambios en snippet, lógica, diseño, content ni schema.  
**`.claude/settings.local.json`:** No tocado. `/blog/plantilla-kakebo-excel`: no tocado.

---

## SEO-BLOG-INFLACION-01 — Optimiza snippet calculadora de inflación

**Estado:** ✅ Completado (2026-07-02)

**Hallazgo GSC usado:** `/es/herramientas/calculadora-inflacion` — 300 imp / pos 8.94 / CTR 0.33% (snapshot 2026-03-29 → 2026-06-28)

**Archivo modificado:** `messages/es.json` — namespace `Tools.Inflation.meta`

| Campo | Antes | Después |
|---|---|---|
| `title` | `Calculadora de Inflación e IPC 2026 \| ¿Cuánto pierde tu dinero?` | `Calculadora de Inflación e IPC \| Pérdida de Poder Adquisitivo` |
| `description` | `Calcula cuánto pierde tu dinero con la inflación en España. Introduce tus ahorros, IPC y años. Resultado inmediato y gratis, sin registro.` | `Calcula cuánto ha perdido valor tu dinero con la inflación acumulada. Introduce importe, IPC y años: resultado inmediato. Gratis y sin registro.` |
| `ogTitle` | `Calculadora de Inflación e IPC 2026 \| Kakebo` | `Calculadora de Inflación e IPC \| Pérdida de Poder Adquisitivo` |
| `ogDescription` | `Descubre cuánto dinero pierdes por el IPC acumulado. Herramienta de cálculo de inflación para proteger tus ahorros.` | `Descubre cuánto ha perdido valor tu dinero por el IPC acumulado. Calcula la pérdida de poder adquisitivo real. Herramienta gratuita de MetodoKakebo.com.` |

**Justificación de cambios:**
- Eliminado `2026` del title: evita envejecimiento sin actualización anual
- `Pérdida de Poder Adquisitivo` sustituye a `¿Cuánto pierde tu dinero?`: captura mejor la intención de búsqueda financiera específica
- Eliminado `en España` de la description: la herramienta acepta cualquier IPC, no solo español
- Sustituido `tus ahorros` por `importe`: la herramienta sirve para cualquier cantidad monetaria
- Añadido `inflación acumulada` en description: captura queries de cola larga
- Añadido `MetodoKakebo.com` en ogDescription: señal de entidad para motores generativos
- Lógica de cálculo: no tocada
- `/blog/plantilla-kakebo-excel`: no tocado
- `.claude/settings.local.json`: no tocado

**Validación:** `npm run build` limpio · diff solo en `messages/es.json`

---

## SEO-URL-CANONICAL-ES-01 — Redirección URLs /es/ a canónicas

**Estado:** ✅ Auditado y verificado — sin código nuevo (implementación preexistente confirmada)

**Causa raíz:** `next-intl` con `localePrefix: 'as-needed'` sirve contenido ES tanto en `/blog/...` como en `/es/blog/...`. Google indexó históricamente las URLs `/es/` antes de que se desplegaran los redirects.

**Hallazgo:** Los redirects permanentes ya estaban implementados en `next.config.ts` desde el commit `bed1fd1` (2026-03-21), antes del período del snapshot GSC (2026-03-29 — 2026-06-28). La fragmentación en GSC es un lag de consolidación de Google, no un problema de código activo.

**Comportamiento verificado (308 Permanent Redirect):**

| URL solicitada | Código | Destino |
|---|---|---|
| `/es` | 308 | `/` |
| `/es/blog/plantilla-kakebo-excel` | 308 | `/blog/plantilla-kakebo-excel` |
| `/es/herramientas/calculadora-ahorro` | 308 | `/herramientas/calculadora-ahorro` |
| `/es/herramientas/calculadora-inflacion` | 308 | `/herramientas/calculadora-inflacion` |
| `/es/tutorial` | 308 | `/tutorial` |
| `/es/privacy` | 308 | `/privacy` |
| `/es/sobre-nosotros` | 308 | `/sobre-nosotros` |
| `/es/blog/...?utm_source=test` | 308 | `/blog/...?utm_source=test` (QS preservado) |
| `/en/blog/plantilla-kakebo-excel` | 200 | Sin redirect (correcto) |
| `/api/health` | 200 | Sin redirect (correcto) |

**Sitemap:** Sin URLs `/es/` — limpio.  
**Build:** Limpio (`npm run build` sin errores).  
**Tipo de redirect:** 308 (Next.js convierte `permanent: true` en redirects() → 308 en App Router).  
**Archivos modificados:** Solo PROJECT_STATUS.md y docs/PROJECT_STATUS.md (sin cambios de código).  
**`.claude/settings.local.json`:** No tocado.  
**`/blog/plantilla-kakebo-excel`:** No modificado.

**Expectativa SEO:** Google consolidará las URLs `/es/` hacia las canónicas a medida que recrawlee el sitio en las próximas semanas/meses. Los clicks reportados en GSC contra `/es/...` son atribución al URL indexado (redirect source), no al URL servido.

---

## SEO-DATA-PRIORITY-01 — Análisis snapshot GSC 2026-06-30

**Estado:** ✅ Completado (2026-07-02)  

**Fuente:** `docs/seo/gsc_2026_06_30/` (Queries, Pages, Chart, Countries, Devices — Last 3 months)  
**Análisis completo:** `docs/seo/GSC_PRIORITY_ANALYSIS_01.md`

**Resumen ejecutivo:**
- 222 clics / 3,079 impresiones / CTR 7.2% / Pos media 7.7
- España 62.6% del tráfico / Desktop 61.7%
- Artículo tractor: `plantilla-kakebo-excel` (125 clics, 861 imp combinados)

**Hallazgo crítico — URL Fragmentation:**  
El 52% de los clics van a URLs `/es/blog/...` no canónicas. `plantilla-kakebo-excel` recibe 115 clics en `/es/` vs 10 en la URL canónica. Google ha indexado las URLs con prefijo `/es/`. Se requiere nueva tarea `SEO-URL-CANONICAL-ES-01`.

**Mayor oportunidad de CTR:** `calculadora-inflacion` — 300 imp, pos 8.94, CTR 0.33%. → `SEO-BLOG-INFLACION-01`

**Siguiente tarea recomendada:** `SEO-BLOG-INFLACION-01`

---

## HOTFIX-BLOG-ARTICLE-ERROR-01 — Corrige error "Algo salió mal" en artículos blog

**Estado:** ✅ Completado (2026-07-02)  
**Build:** ✅ Compiled successfully  

**Causa raíz:** El commit 800bd32 (SEO-GA4-EVENTS-01) añadió `"use client"` a `MDXComponents.tsx`. Esto convirtió todo el módulo en un client boundary. Cuando `BlogPostPage` (RSC) pasa el objeto `components` exportado desde ese módulo a `MDXRemote` de `next-mdx-remote/rsc` (también RSC), Next.js App Router lanza un error de serialización que el error boundary `[locale]/error.tsx` captura mostrando "Algo salió mal" en todos los artículos.

**Fix aplicado:**
- Eliminado `"use client"` e `import { analytics }` de `MDXComponents.tsx`
- Creado `src/components/mdx/MDXClientCTAs.tsx` con `"use client"` que contiene solo los 4 CTAs con tracking (ToolCTA, SimpleCTA, DownloadCTA, ArticleCTA)
- `MDXComponents.tsx` importa los CTAs desde `MDXClientCTAs.tsx` — patrón correcto de Next.js App Router
- Todos los eventos GA4 conservados sin cambios

**Archivos modificados:**
- `src/components/mdx/MDXComponents.tsx` — removido "use client" y CTAs inline
- `src/components/mdx/MDXClientCTAs.tsx` — nuevo archivo cliente con los 4 CTAs + analytics

---

## SEO-TECHNICAL-LEGAL-PAGES-01 — Canonical, hreflang y sitemap en páginas legales

**Estado:** ✅ Completado (2026-07-02)  
**Build:** ✅ Compiled successfully  

**Objetivo:** Añadir canonical/hreflang explícitos y corregir prioridad en sitemap para `/privacy`, `/terms`, `/cookies`.

**Auditoría previa:**
- Canonical: ❌ Ausente en las 3 páginas → ✅ Añadido
- Hreflang: ❌ Ausente → ✅ Añadido (es, en, x-default)
- Sitemap prioridad: ❌ 0.5 → ✅ Reducida a 0.1 (igual que /login)
- noindex: no aplicado — páginas permanecen indexables para confianza/legalidad
- robots.ts: sin cambios necesarios

**Archivos modificados:**
- `src/app/[locale]/privacy/page.tsx` — canonical + hreflang
- `src/app/[locale]/terms/page.tsx` — canonical + hreflang
- `src/app/[locale]/cookies/page.tsx` — canonical + hreflang
- `src/app/sitemap.ts` — prioridad 0.5 → 0.1

---

## SEO-SCHEMA-BLOG-INDEX-01 — Schema CollectionPage + ItemList en /blog

**Estado:** ✅ Completado (2026-07-02)  
**Build:** ✅ Compiled successfully  

**Objetivo:** Añadir schema JSON-LD a `/blog` para reforzar su función como índice editorial.

**Schema añadido en `src/app/[locale]/(public)/blog/page.tsx`:**

- Tipo principal: `CollectionPage`
- `mainEntity`: `ItemList` con `ListItem` por cada artículo indexable
- Generado dinámicamente en el server component a partir de `getBlogPosts(locale)`
- Posts con `noindex: true` excluidos del ItemList
- URLs absolutas correctas: `https://www.metodokakebo.com/blog/[slug]` (ES) / `https://www.metodokakebo.com/en/blog/[slug]` (EN)

**Campos por artículo:**
- `position` (1, 2, 3…)
- `name` (título del artículo)
- `description` (excerpt)
- `url` (URL absoluta locale-aware)

**Publisher:** `{ "@type": "Organization", "name": "MetodoKakebo.com" }`

**Artículos ES incluidos:** 15 (todos los `.es.mdx` publicados sin noindex)

**No duplica:** el schema `BlogPosting` de artículos individuales — `CollectionPage` representa el índice, no los artículos.

---

## SEO-GEO-SAVINGS-CONTENT-FIX-01 — Corrección explicación ahorro/Kakebo en SavingsCalculator

**Estado:** ✅ Completado (2026-07-02)  
**Build:** ✅ Compiled successfully  

**Objetivo:** Eliminar la asociación incorrecta "ahorro (Extra)" en el texto explicativo de la calculadora de ahorro y usar terminología canónica.

**Clave modificada en `messages/es.json`:**

`Tools.Savings.content.whyText1`

**Texto anterior:**  
"…el 30% a deseos (Ocio + Cultura) y el 20% a ahorro (Extra)."

**Texto nuevo:**  
"…el 30% a gastos no esenciales (Ocio/Vicio y Cultura) y fijar el 20% restante como objetivo de ahorro mensual, separado de las categorías de gasto del método Kakebo."

**Errores corregidos:**
- "ahorro (Extra)" → eliminado: "Extras" en Kakebo son gastos imprevistos, no el objetivo de ahorro
- "Ocio + Cultura" → "Ocio/Vicio y Cultura" (terminología canónica)
- El ahorro pasa a describirse como objetivo del presupuesto, no como categoría de gasto

---

## SEO-GEO-CALCULADORA-AHORRO-SCHEMA-TERMINOLOGY-01 — Auditoría schema/FAQ calculadora-ahorro

**Estado:** ✅ Auditado — sin cambios necesarios (2026-07-02)  
**Build:** sin cambios en código  

**Objetivo:** Verificar y corregir terminología no canónica en el FAQ_SCHEMA y JSON-LD de `calculadora-ahorro/page.tsx`.

**Resultado de la auditoría:**

El `FAQ_SCHEMA` y el contenido visible del schema en `calculadora-ahorro/page.tsx` **ya usan terminología canónica correcta**:
- FAQ pregunta 2 (`¿Cuáles son las 4 categorías del Kakebo?`): "Supervivencia", "**Ocio/Vicio**", "Cultura", "**Extras**" ✅
- Párrafos visibles (líneas 106, 121): "Supervivencia, Ocio/Vicio, Cultura y Extras" ✅
- `SCHEMA` (SoftwareApplication): sin nombres de categorías — sin problema ✅

**Hallazgos fuera del alcance de esta tarea (para futura tarea):**
- `Tools.Savings.content.whyText1` (línea 277): "(Extra)" usado para el 20% de ahorro en contexto 50/30/20 — confusión conceptual (Extra en Kakebo es para imprevistos, no ahorro) + forma no canónica; requiere reescritura de ese párrafo explicativo.
- `Tools.Savings.content.whyText2` (línea 278): `'Ocio'` en pregunta retórica — shorthand aceptable según glosario si el contexto ya establecido.
- Dashboard app (líneas 645-649, 985-988, 1043-1046): `"opcional": "Opcional"` y `"extra": "Extra"` — son etiquetas internas del /app/ que mapean claves de base de datos; fuera de alcance.
- `Tools.Rule503020.legend.wants.label` (línea 310): "30% Deseos (Opcional)" — herramienta diferente, contexto 50/30/20 no Kakebo.

**Archivos NO modificados:** ninguno (auditoría confirmó estado correcto del target).

---

## SEO-GEO-TUTORIAL-TERMINOLOGY-FIX-01 — Corrección terminología categorías en /tutorial

**Estado:** ✅ Completado (2026-07-02)  
**Build:** ✅ Compiled successfully  

**Objetivo:** Sustituir nombres de categorías Kakebo no canónicos en el namespace `Tutorial` de `messages/es.json`.

**Claves modificadas en `messages/es.json` (Tutorial namespace):**

| Clave | Antes | Después |
|---|---|---|
| `content.s2.c2` | `<bold>Opcional:</bold>` | `<bold>Ocio/Vicio:</bold>` |
| `content.s2.c4` | `<bold>Extra:</bold>` | `<bold>Extras:</bold>` |
| `images.img2.alt` | "…Supervivencia, Opcional, Cultura y Extra" | "…Supervivencia, Ocio/Vicio, Cultura y Extras" |

**Archivos NO tocados:** `tutorial/page.tsx` (schema válido), Home, herramientas, blog, inglés.

---

## SEO-GEO-SOBRE-NOSOTROS-01 — Optimización GEO/E-E-A-T de /sobre-nosotros

**Estado:** ✅ Completado (2026-07-02)  
**Build:** pendiente validación  

**Objetivo:** Eliminar superlativos no verificables, terminología no canónica e implicaciones de asesoramiento financiero del namespace `About` en `messages/es.json`. Sin tocar schema, diseño, rutas ni inglés.

**Cambios en `messages/es.json` (About namespace):**

| Campo | Problema | Cambio |
|---|---|---|
| `meta.description` | "mi misión de devolverte el control financiero" + "Sin humo" (1ª persona comercial, coloquial) | Reemplazado por descripción factual de MetodoKakebo.com |
| `meta.ogDescription` | "la app de Kakebo más privada y segura del mercado, diseñada para la tranquilidad mental" (superlativo no verificable, claim subjetivo) | Reemplazado por descripción factual sin superlativos |
| `story.p2` | "(Mindful Spending)" (etiqueta inventada en inglés) + "la solución definitiva" (superlativo) + "avalada por más de un siglo de eficacia empírica" (claim exagerado) | Eliminados; añadida referencia histórica factual (1904, Motoko Hani) y disclaimer de herramienta educativa |
| `values.v2.desc` | "Ocio" (nombre no canónico; falta "/Vicio" y "Extras") | Corregido a "Ocio/Vicio, Cultura y Extras" según glosario |
| `values.v3.desc` | "coach financiero" + "consejos reales y accionables" (implica asesoramiento financiero personalizado) | Reemplazado por descripción factual de qué hace la IA según el método Kakebo |
| `team.desc` | "la mejor herramienta metodológica" (superlativo) | "la mejor" → "una" |

**Archivos NO tocados (confirmado):** `sobre-nosotros/page.tsx` (schema válido), `messages/en.json`, diseño, rutas, imágenes.

---

## SEO-GA4-EVENTS-01 — Eventos GA4 para conversiones SEO

**Estado:** ✅ Completado (2026-07-02)  
**Build:** ✅ Compiled successfully

**Objetivo:** Implementar eventos GA4 para medir conversiones SEO reales sin tocar diseño, copy, rutas ni SEO técnico.

**Eventos implementados:**

| Evento GA4 | Trigger | Archivos | Parámetros |
|---|---|---|---|
| `tool_viewed` | Montaje de cada calculadora | `SavingsCalculator.tsx`, `CalculatorInflation.tsx`, `Calculator503020.tsx` | `tool_name` |
| `use_savings_calculator` | Primera interacción con inputs de `SavingsCalculator` | `SavingsCalculator.tsx` | `tool_name: calculadora_ahorro` |
| `use_inflation_calculator` | Primera interacción con inputs de `CalculatorInflation` | `CalculatorInflation.tsx` | `tool_name: calculadora_inflacion` |
| `use_503020_calculator` | Primera interacción con slider de `Calculator503020` | `Calculator503020.tsx` | `tool_name: regla_50_30_20` |
| `click_tool_to_app` | Clic en CTA de herramientas hacia /login | `SavingsCalculator.tsx`, `CalculatorInflation.tsx`, `Calculator503020.tsx` | `tool_name`, `cta_location` |
| `click_cta_login` | Clic en SimpleCTA, ArticleCTA, ToolCTA (→login) en artículos | `MDXComponents.tsx` | `source_page`, `cta_label`, `cta_location` |
| `download_template` | Clic en DownloadCTA en artículos | `MDXComponents.tsx` | `template_type: excel`, `source_page`, `location` |
| `tool_interaction` | Clic en cross-sell desde CalculatorInflation | `CalculatorInflation.tsx` | `tool_name`, `action: cross_sell` |

**Archivos modificados:**
- `src/lib/analytics.ts` — Nuevos tipos de evento añadidos; `window.gtag` activado con safety check (`typeof window !== 'undefined' && typeof window.gtag === 'function'`)
- `src/components/landing/tools/SavingsCalculator.tsx` — `analytics` import, `tool_viewed` on mount, `use_savings_calculator` on first input, `click_tool_to_app` on CTA
- `src/components/landing/tools/CalculatorInflation.tsx` — `useRef` añadido, `use_inflation_calculator` on first input, estandarización `signup_click` → `click_tool_to_app`
- `src/components/landing/tools/Calculator503020.tsx` — `useRef` añadido, `use_503020_calculator` on first slider, estandarización `signup_click` → `click_tool_to_app`
- `src/components/mdx/MDXComponents.tsx` — `"use client"` añadido, `analytics` import, eventos en `SimpleCTA`, `DownloadCTA`, `ArticleCTA`, `ToolCTA` (solo cuando href → login/app)

**Eventos NO implementados (pendiente):**
- CTA inline en `calculadora-ahorro/page.tsx` (botón "Empezar a usar la App" en sección inferior) — es JSX inline de servidor, requiere extraer a un Client Component separado; riesgo > beneficio en esta tarea.
- Tracking de `click_cta_login` en CTA del bloque final del `tutorial/page.tsx` — mismo motivo.

**Principios de privacidad:**
- No se envían datos personales (nombres, emails, importes concretos).
- Solo se envían: nombre de herramienta, página de origen (pathname), nombre del botón (texto del CTA), ubicación del CTA.
- Todos los eventos fallan silenciosamente si GA4 no está cargado.

---

## SEO-TECHNICAL-TUTORIAL-01 — Auditoría /tutorial: canonical y hreflang

**Estado:** ✅ Completado con cambios (2026-07-01)  
**Archivo:** `src/app/[locale]/(public)/tutorial/page.tsx`  
**Build:** ✅ Compiled successfully

**Auditoría de contenido:**
- Clasificación: **A — Mantener indexable**
- Contenido: 4 secciones (qué es Kakebo, 4 categorías, dashboard, agente IA), imágenes de producto, TOC lateral
- Intención SEO: navegacional/informacional para usuarios que buscan "tutorial Kakebo" o "cómo usar Kakebo"
- No thin content per se — es tutorial de producto con imágenes reales de la app
- No compite directamente con artículos del blog (foco en interfaz del producto, no en el método en general)

**Bug técnico encontrado y corregido:**
- `canonical` apuntaba a `https://www.metodokakebo.com/es/tutorial` (URL con prefijo `/es/` que redirige o no existe)
- `hreflang "es"` y `"x-default"` apuntaban a `/es/tutorial` en lugar de `/tutorial`
- Patrón correcto: `locale === 'es' ? '' : `/${locale}`` (igual que `sobre-nosotros` y artículos del blog)

**Cambios:**
- `canonical`: `/${locale}/tutorial` → `${locale === 'es' ? '' : `/${locale}`}/tutorial`
- `hreflang "es"`: `/es/tutorial` → `/tutorial`
- `hreflang "x-default"`: `/es/tutorial` → `/tutorial`

**Nota técnica (fuera de alcance, para tarea futura):** `messages/es.json` usa "Opcional" y "Extra" como nombres de categoría en la sección de tutorial — terminología no canónica (debería ser "Ocio/Vicio" y "Extras"). Pendiente de corrección en una tarea de contenido separada.

**Sitemap:** `/tutorial` permanece con prioridad 0.8 — correcto para página de onboarding de producto.

---

## SEO-TECHNICAL-SITEMAP-01 — Ajuste sitemap: herramientas y login

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/app/sitemap.ts`  
**Build:** ✅ Compiled successfully

**Auditoría:**
- `/herramientas/calculadora-ahorro` — ✅ ya presente (prioridad 0.9)
- `/herramientas/calculadora-inflacion` — ✅ ya presente (prioridad 0.9)
- `/herramientas/regla-50-30-20` — ✅ ya presente (prioridad 0.9)
- `/login` — prioridad 0.8 → **0.1**; changeFrequency `monthly` → `yearly`

**Cambios realizados:**
- `/login`: prioridad 0.8 → 0.1; changeFrequency `monthly` → `yearly`

**No modificado (ya correcto):**
- Las tres herramientas públicas ya estaban incluidas con prioridad 0.9
- Blog posts usan `updatedDate ?? date` para `lastModified` (patrón correcto, ya implementado en SEO-TECHNICAL-DATEMODIFIED-01)
- Home con prioridad 1.0 — correcto

**Nota técnica:** Las páginas estáticas (core routes) usan `lastModified: new Date()` que marca siempre la fecha actual. Es el patrón existente del repo y no fue modificado en esta tarea.

---

## SEO-GEO-SUPPORT-SUELDO-MINIMO-01 — Optimización SEO/GEO artículo kakebo-sueldo-minimo

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/kakebo-sueldo-minimo.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `description` añadido
- `title`: actualizado a "Cómo ahorrar con el salario mínimo: método Kakebo para ingresos ajustados"
- `excerpt`: "el Método Kakebo es perfecto" → descripción factual; "parece imposible" eliminado
- FAQ Q2: "bueno" → "útil"; "no te juzga" → explicación factual; "Ocio y Vicio" → "Ocio/Vicio"; "tu poco dinero" eliminado
- FAQ Q4: "Rotundamente sí" eliminado; "linterna financiera" eliminado; "Vicio" → "Ocio/Vicio"; "Extra" → "Extras"
- Intro: "gurús financieros americanos", "jubilarse joven en Bali", "nadie se digna a responder" eliminados → explicación directa
- H2: "El gravísimo error occidental" → "Por qué el porcentaje importa más que la cantidad"
- H2: "La salvación Kakebo: Santificar primero tu Hábito. Importar un rábano tu cuota." → "El enfoque del método Kakebo con ingresos ajustados"
- "el 99% de las metodologías americanas" (estadística sin fuente) eliminado
- "letal sentimiento", "precipicio económico familiar" eliminados
- "El as bajo la manga de la mentalidad nipona" eliminado
- "saldo bajo la sombra del reflejo de tu cuenta del BBVA" (marca concreta) eliminado
- Tabla: "Ocio y Vicio" → "Ocio/Vicio"; "Cultura / Extras" (combinados) → filas separadas Cultura 5% + Extras 5%
- ToolCTA: emoji "📥" eliminado del título
- "drásticamente" eliminado
- H2: "Adaptación Extrema: El Kakebo para Estudiantes con Beca o Precariedad" → "Adaptación para estudiantes y situaciones de mayor precariedad"
- "sorprendentemente efectivo, y hasta terapéutico" (lenguaje médico) eliminado
- "miserables euros", "tristes 300€", "burla para un adulto de 40 años" (condescendiente) eliminados
- "compleja red neuronal", "armazón invencible", "cimentando el muro de carga" (pseudociencia/metáforas extremas) eliminados
- `Ocio y Vicio` → `Ocio/Vicio` en todo el artículo
- Figcaption: texto poético → descripción factual del método
- Alt text de imagen: mejorado para SEO y accesibilidad

---

## SEO-GEO-SUPPORT-ELIMINAR-GASTOS-HORMIGA-01 — Optimización SEO/GEO artículo eliminar-gastos-hormiga

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/eliminar-gastos-hormiga.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `description` añadido
- `title`: "El método japonés infalible" eliminado → "Cómo eliminar los gastos hormiga con el método Kakebo"
- `excerpt`: "sin esfuerzo" eliminado → descripción factual del contenido
- FAQ Q1: ampliada para incluir ejemplos concretos y efecto acumulado
- FAQ Q2: "Ocio y Vicio" → "Ocio/Vicio" (terminología canónica); "drásticamente" eliminado; "choque de consciencia" → "tomar consciencia"
- Intro: "antídoto perfecto" y "silencioso y destructivo" eliminados → explicación directa
- Emojis en lista de ejemplos (☕🍫💳📺🛒) eliminados
- H3: "Las matemáticas mortales detrás del 'Factor Latte'" → "El impacto acumulado del gasto pequeño diario"
- "verdaderamente devastador" eliminado
- H2: "La solución japonesa: Kakebo contra la colmena" → "El método Kakebo para detectar gastos hormiga"
- "El secreto ancestral para destruir" eliminado
- H3: "La suma de la vergüenza (y la liberación)" → "Revisar el total de Ocio/Vicio al cierre del mes"
- "absolutamente curativo" eliminado
- "90% de los gastos hormiga" (porcentaje sin fuente) eliminado
- H2: "Kakebo AI: Destruyendo gastos hormiga en 2026" → "Kakebo AI para el registro de gastos hormiga"
- "nosotros hemos creado la solución definitiva" → terminología canónica (Kakebo AI / MetodoKakebo.com)
- "consciencia budista del método original" eliminado
- "la tecnología más punta del momento" eliminado
- Emoji 💬 eliminado del body
- "destructiva categoría de 'Ocio y Vicio'" → "categoría Ocio/Vicio"
- "te manda el aviso" (feature claim no verificado) eliminado
- "informe exacto, forense y detallado" → "informe mensual por categoría"
- "consulta nuestra guía completa" (primera persona) → referencia factual

---

## SEO-GEO-SUPPORT-REGLA-30-DIAS-01 — Optimización SEO/GEO artículo regla-30-dias

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/regla-30-dias.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `title` actualizado: eliminado "El escudo definitivo" → descriptivo y factual
- `description` añadido: describe el contenido con terminología canónica
- `excerpt` actualizado: eliminado "curar tu adicción" y "miles de euros" → descripción factual
- FAQ Q1: ampliada para mayor completitud (incluye el "si sí / si no" del resultado)
- FAQ Q2: eliminado "neocórtex racional" (pseudocientífico) y "80% de los casos" (estadística sin fuente) → explicación conductual factual
- Intro: eliminada narrativa ficticia ("Lunes por la tarde", "¡ALTO! Congela la tarjeta", "antivirus más potente jamás creado") → explicación directa de la regla
- H2 "La Trampa Dopaminérgica" → "Por qué las compras impulsivas son difíciles de evitar"
- Eliminado framing médico: "Para entender cómo curar la enfermedad, primero hay que entender el diagnóstico"
- Eliminado blockquote pseudocientífico: "diseñado quirúrgicamente para hackear tu sistema de recompensa animal"
- Eliminado "estadísticamente imposible" (sin fuente)
- Eliminados superlatiivos: "soberanamente efectiva, absolutamente gratuita", "desarmantemente simple"
- Paso 2: "romper el bucle dopaminérgico" → descripción factual del objetivo
- Paso 4: "80% de los casos según estudios de psicología del consumo" → "Si la urgencia ha desaparecido" (sin porcentaje sin fuente)
- `Ocio y Vicio` → `Ocio/Vicio` (terminología canónica)
- ToolCTA: eliminado emoji `💡` del título; description actualizada (factual)
- H2: "La Fusión Definitiva" → "La regla de los 30 días y el método Kakebo"
- Eliminado "la eficacia se multiplica considerablemente" (sin fuente)
- Eliminado "la mayoría de usuarios que aplican ambos sistemas juntos reportan..." (afirmación sin fuente)
- Eliminado "consulta nuestra guía" (primera persona) → "La guía de ahorro mensual explica..."
- Obstáculo 2: eliminado "La compra emocional es uno de los mayores destructores de la salud financiera"
- Sección Kakebo AI: terminología canónica explícita (Kakebo AI / MetodoKakebo.com diferenciados)
- Anchor text en artículos relacionados: "el método japonés infalible" → eliminado; título simple

---

## ✅ Capítulo Frontend Público/Indexable — CERRADO

**Fecha de cierre:** 2026-06-24  
**Aceptado por usuario:** sí, provisionalmente  
**Último commit del capítulo:** `b924649` — UIUX: harden premium visual system for mobile

El capítulo frontend público/indexable queda cerrado. No se harán más cambios visuales amplios sin una auditoría o incidencia concreta. Si en revisión visual futura aparece un problema concreto, se abrirá como tarea UIUX puntual.

### Áreas cerradas y aceptadas

| Área | Estado |
|---|---|
| Sistema visual premium global (tokens semánticos, MDXComponents, tailwind.config) | ✅ Cerrado |
| Componentes MDX reutilizables (ToolCTA, SimpleCTA, ArticleCTA, DownloadCTA, HorizontalRule, Callout, Blockquote, FaqSection) | ✅ Cerrado |
| Migración de 13 artículos .es.mdx — CTAs y bloques legacy → componentes | ✅ Cerrado |
| Home pública (Hero, Features, HowItWorks, Testimonials, SavingsSimulator, AlternativesSection, FAQ, ToolsSection, SeoContent) | ✅ Cerrado |
| Blog index (/blog) — featured card + grid + separador editorial | ✅ Cerrado |
| Artículo individual (/blog/[slug]) — header editorial, prose refinada, H2/H3/HR, tablas, CTAs | ✅ Cerrado |
| Navbar pública (desktop + mobile, dropdown herramientas, contexto blog) | ✅ Cerrado |
| Mobile 360/390/430px — CTAs, spacing, tablas, Hero, HowItWorks | ✅ Cerrado |
| Dark mode — tokens semánticos en todos los componentes públicos | ✅ Cerrado |
| Analytics GA4 (MED-01) + CSP (MED-02) | ✅ Cerrado |
| Reglas visuales documentadas para futuros artículos (INSTRUCCIONES.md Regla #8 + tabla MDXComponents) | ✅ Cerrado |

### Historial de tareas completadas (capítulo frontend)

| Tarea | Descripción | Commit |
|---|---|---|
| SEO-PILAR-01 | Artículo pilar "Cómo hacer un presupuesto personal" | `38c22ae` |
| DOC-I18N-01 | Política SEO de idiomas | `4b5ea7f` |
| CHECK-I18N-ROUTING-01 | Bug Accept-Language corregido | `5656eef` |
| UIUX-02 a UIUX-14 | Sprint UI/UX completo (max-width, navbar, features, tipografía, testimonials, PH, tokens, sakura, featurecards, hover, a11y, blog CTA, blog index) | `bfde77e`..`d238358` |
| UIUX-MOBILE-NAV-01 | Navbar mobile + hamburguesa | `770b52c` |
| UIUX-MOBILE-HOME-02–04 | AlternativesSection, Hero H1, py-24 → py-16 en 5 secciones | `1162a97`..`a0da677` |
| MED-01 | GA4 integrado | `3a1777b` |
| MED-02 | CSP actualizada para GA4 | `7a08d3d` |
| UIUX-BLOG-PROSE-01 | Tipografía y MDXComponents base | `43269b6` |
| UIUX-PREMIUM-ARTICLE-01 | HorizontalRule, ToolCTA, ArticleCTA, página de artículo premium | `d3ea3cf` |
| UIUX-GLOBAL-PREMIUM-01 | SimpleCTA, DownloadCTA, migración 13 MDX, ToolsSection | `5376fda` |
| UIUX-GLOBAL-MOBILE-PREMIUM-01 | Mobile: overflow fix CTAs, HowItWorks, ToolsSection | `b924649` |

---

## 🔜 Siguiente bloque — SEO

### SEO-GEO-SUPPORT-KAKEBO-ONLINE-GUIA-COMPLETA-01 — Optimización SEO/GEO artículo kakebo-online-guia-completa

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/kakebo-online-guia-completa.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'`, `readingTime` y `faq` añadidos al frontmatter
- `title` y `description` actualizados: sin "método japonés" suelto; descriptivos
- `excerpt` mejorado: factual
- `faq` frontmatter añadido (Q3: sin "categorías japonesas básicas")
- **Categorías corregidas en todo el artículo:** "Opcional" → "Ocio/Vicio"; "Extra" → "Extras" (aparecía 4 veces en el artículo)
- Intro: "filosofía milenaria" → eliminado; "método japonés creado en 1904 por Motoko Hani" como descripción correcta
- "la magia de verdad" → eliminado
- Primera persona: "¿Nuestra recomendación?" → eliminado; "nuestro simulador interactivo de asistente artificial" → descripción factual en ToolCTA
- "Copiloto Financiero personal" → eliminado
- "mata la filosofía del Kakebo" → explicación factual del porqué
- "comodidades exponenciales" → eliminado
- "la consciencia plena del método japonés" → "el mecanismo central del método Kakebo"
- JSON-LD `description`: actualizado con terminología canónica correcta
- Sección "Kakebo online con IA" reescrita: sin narrativa "Imagina que...", sin "máxima expresión"; factual

---

### SEO-GEO-SUPPORT-KAKEBO-AUTONOMOS-01 — Optimización SEO/GEO artículo metodo-kakebo-para-autonomos

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/metodo-kakebo-para-autonomos.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `title` y `excerpt` actualizados: descriptivos y factuales
- FAQ Q1 y Q2: terminología canónica correcta, sin "de hecho es vital"
- Intro reescrita: sin primera persona "te enseñaremos a domesticar", directa sobre el problema
- Sección "El ciclo de gasto": títulos reescritos (sin "Euforia/Pánico"); eliminado "comportamiento financiero bipolar", "asesino de la tranquilidad", lenguaje dramático
- figcaption: sin "la frontera que separa el éxito del fracaso"
- Sección estrategia: título sin "a prueba de balas"; "Los japoneses inventaron" → "creado por Motoko Hani en 1904"; eliminado "La Magia", "el milagro", "Error mortal autónomo", "milimétricamente", "1.500€ sagrados", "genuina magia de la disciplina nipona"
- Tabla: celdas factuales (sin "¡Mes Excelente!", "guardados a fuego", "Sequía total")
- Post-tabla: eliminado "dramática", "ni para pipas", "funcionario del Estado"
- Sección IVA: título sin "El monstruo trimestral"; eliminado "terrorífico", "sudores fríos nocturnos", "Retención Quirúrgica Inmediata", "religiosamente", "polvorienta subcuenta", "apocalíptica avalancha contable"; corregido bug "las urgentes necesidades urgentes"
- Sección categorías: título sin "Nipones"; eliminado "famosas"
- Sección Kakebo AI: sin cambios significativos; terminología canónica mantenida

---

### SEO-GEO-SUPPORT-LIBRO-KAKEBO-PDF-01 — Optimización SEO/GEO artículo libro-kakebo-pdf

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/libro-kakebo-pdf.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `title` actualizado: descriptivo ("formatos disponibles, limitaciones prácticas y alternativas digitales")
- `excerpt` actualizado: sin "la mayoría lo abandona"
- FAQ Q4: eliminado "potente estructura psicológica" y "inmenso valor"; tono factual
- Intro reescrita: sin primera persona comercial ("tenemos que contarte", "te desvelaremos"), sin narrativa asumida
- Link "método zen financiero" → link correcto al método Kakebo
- Terminología: "magia del Kakebo" → eliminado; "método milenario" → eliminado (1904 no es milenario); "asistente neuronal artificial" → "agente de IA"
- Afirmación "el 85% de los usuarios acaban abandonando" → eliminada (no verificada)
- Lenguaje sensacionalista: "en qué demonios", "embriagante romanticismo", "indudablemente infalible", "burdas fotocopias" → tono factual
- Sección "Las 3 trampas" → "Las limitaciones del formato PDF e impreso"
- Sección "Las ediciones" reorganizada: ventajas/limitaciones concretas por formato
- Tabla comparativa: celdas reescritas ("Sufrido a pulmón" → factual; "Crónicamente lento" → factual; "Copiloto proactivo protector" → factual; "quiebra" → eliminado; "asistente neuronal artificial" → "asistida por IA")
- Cierre: eliminado "milimétricamente", "eliminamos quirúrgicamente", "vibrante e intachable", primera persona; tono factual sobre Kakebo AI con terminología canónica

---

### SEO-GEO-SUPPORT-KAKEBO-VS-YNAB-01 — Optimización SEO/GEO artículo kakebo-vs-ynab

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/kakebo-vs-ynab.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `title` actualizado: describe diferencias reales (registro consciente vs. presupuesto base cero)
- `excerpt` actualizado: describe el contenido comparativo con terminología canónica
- FAQ Q1 y Q2 mejoradas: terminología canónica correcta, respuestas factuales
- Intro reescrita: directa sobre el objetivo comparativo
- Sección YNAB: reescrita con ventajas/limitaciones factuales (eliminadas frases como "sagrada y suprema", "curva estresante")
- Sección Kakebo: renombrada "Qué es el método Kakebo" (eliminado "El contendiente nipón"); definición factual del método Kakebo con D-01; terminología canónica correcta
- Sección Wallet/apps: tono factual (eliminadas frases como "destrozan silenciosamente toda la vital intención reflexiva")
- Tabla comparativa: COMPLETAMENTE REESCRITA — los 5 contenidos de celdas originales eran incoherentes ("Proactivo Ansioso: Vives mentalmente en el futuro, asignando neuróticamente euros", etc.)
- **"Veredicto Final" (líneas 115-128): TEXTO COMPLETAMENTE CORRUPTO** — tres párrafos y tres perfiles con repetición masiva de adjetivos aleatorios — reemplazado por sección "Para quién es mejor cada uno" con tres perfiles claros y factuales
- Sección Kakebo AI: mejorada con terminología canónica explícita (Kakebo AI / método Kakebo / MetodoKakebo.com diferenciados)

---

### SEO-GEO-SUPPORT-AHORRO-PAREJA-01 — Optimización SEO/GEO artículo ahorro-pareja

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/ahorro-pareja.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `title` actualizado: añade "presupuesto compartido, gastos comunes y método Kakebo"
- `excerpt` actualizado: descripción factual directa (sin "El dinero es la principal causa de divorcio")
- FAQ Q1: respuesta ligeramente mejorada
- FAQ Q2: "la pestaña de reflexión del método Kakebo" → "el paso de reflexión del método Kakebo"
- Intro reescrita: directa sobre el problema práctico que resuelve el artículo, sin afirmación sobre "principal causa de divorcio a nivel mundial" (sin fuente verificable)
- H2 "Los 3 Errores Mortales" → "Los 3 errores habituales al gestionar el dinero en pareja"
- Sección 1: "brutal asimetría" → "asimetría de información"; tono factual
- Sección 2: "estúpidamente al 50/50" → "a partes iguales al 50/50"
- Sección 3: "ocultismo económico" mantenido como concepto; redacción más factual
- Modelos: "Existen rotundamente tres" → eliminado "rotundamente"; "(El Recomendado por Psicólogos de Pareja)" sin fuente eliminado
- Caso práctico Ana/Luis: mantenido, con "deprimentes 500€" corregido
- Deudas: sección reestructurada, eliminadas frases dramáticas ("transparencia dolorosa", "exactitud milimétrica", "dinámicas tóxicas del tipo Salvador vs. Rescatado")
- H2 "Aplicando la magia del Kakebo" → "Aplicando el método Kakebo en pareja"
- "método organizativo nipón (Kakebo)" → "el método Kakebo"
- "gran palabra mágica redentora" → "cuarto paso del método Kakebo"
- "el Kakebo nipón impone pacíficamente" → "el método Kakebo propone"
- Diálogos: mantenidos (útiles y bien construidos); framing ligeramente ajustado
- Sección "Kakebo AI": explícitamente nombrada como "app gratuita de MetodoKakebo.com"; terminología canónica correcta (método Kakebo / Kakebo AI / MetodoKakebo.com diferenciados)

---

### SEO-GEO-SUPPORT-AHORRAR-DINERO-CADA-MES-01 — Optimización SEO/GEO artículo como-ahorrar-dinero-cada-mes

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/como-ahorrar-dinero-cada-mes.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `title`: eliminado "que sí funcionan" (clickbait); añadido "presupuesto" al subtítulo
- `excerpt` actualizado: incluye "presupuesto personal", "control de gastos", "método Kakebo", "gastos fijos y gastos hormiga"
- FAQ Q1, Q2, Q3 mejoradas: terminología canónica correcta (método Kakebo, Kakebo AI, MetodoKakebo.com); Q3 menciona explícitamente Kakebo AI
- Intro reescrita: explica directamente el proceso de ahorro mensual (4 pasos: registrar ingresos, clasificar gastos, revisar patrones, definir cantidad realista)
- H2 principales renombrados: "Domando la Psicología del Ahorro" → "Estrategias de base: presupuesto y registro de gastos"; "Tácticas de Trinchera" → "Reducción de gastos fijos y variables"
- Sección 3 (método Kakebo): "infalible" eliminado; "magia del Kakebo" eliminado; añadida definición factual del método Kakebo; añadida descripción de Kakebo AI con terminología canónica
- Sección 4: "enemigo letal", "maldita compra impulsiva", "irrefrenable" eliminados; tono factual
- Sección 5: "extenuante semana 52", "sorprendente cifra", "casi sin darte ni cuenta" eliminados; redacción directa
- Sección 8: "La tarjeta Contactless es peligrosa" → descripción factual del efecto de visibilidad del gasto
- Sección 10: "Tu oscura compañía de luz", lenguaje dramático eliminado; redacción factual
- Sección 11: TEXTO COMPLETAMENTE CORRUPTO (repetición aleatoria de adjetivos) → reescrita con descripción factual del redondeo automático
- Sección 12: TEXTO COMPLETAMENTE INCOHERENTE (repetición aleatoria, ilegible) → reescrita con descripción factual del coste por uso
- Sección 15: "IAs conversacionales que apliquen la filosofía del Kakebo" → terminología canónica correcta: Kakebo AI (MetodoKakebo.com), registro activo vs categorización automática

---

### SEO-GEO-SUPPORT-PELIGROS-APPS-AHORRO-01 — Optimización SEO/GEO artículo peligros-apps-ahorro-automatico

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/peligros-apps-ahorro-automatico.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `excerpt` actualizado: eliminado "graves riesgos" y "manipulación psicológica"; reemplazado por descripción factual de los tres aspectos cubiertos
- FAQ frontmatter Q2: "¿Por qué no recomiendan usar apps de ahorro automático?" → "¿Qué limitaciones tienen las apps de ahorro automático?" (elimina el framing de recomendación negativa); respuesta reescrita de forma factual y equilibrada
- Intro reescrita: explica directamente los tres aspectos que trata el artículo, sin alarmismo
- H2 renombrados: "El Panóptico Bancario Permanente" → "Privacidad y acceso a datos bancarios"; "La Desconexión Neuronal" → "Automatización y consciencia del gasto"; "El fuego cruzado publicitario" → "Publicidad y ofertas personalizadas"
- Peligro 1: eliminadas frases como "algo siniestro", "fatídico instante", "devastadoramente personal"; cita especulativa sobre partido político y moteles eliminada; sustituida por descripción factual de qué refleja un historial bancario
- Peligro 2: eliminado "gravísimo", "dictador robótico", "Ceguera Automática Neuronal" (término no establecido); sustituido por explicación factual del principio de registro activo y el método Kakebo
- Peligro 3: eliminado "créditos vampíricos", "cobradores de comisiones más efectivos e inquietantes"; sustituido por descripción factual del modelo de negocio de comisiones por referidos
- Sección Kakebo AI: depersonalizada ("nunca te pediremos" → "Kakebo AI no solicita"); terminología canónica correcta (método Kakebo / Kakebo AI / MetodoKakebo.com diferenciados)
- Sección "El falso mito": renombrada "El equilibrio entre comodidad y control activo"; eliminadas frases absolutistas ("trampa mortal", "cedes el poder a sistemas diseñados para maximizar su beneficio corporativo", estadística sin fuente); reemplazada por análisis factual de para qué sirve cada enfoque

---

### SEO-GEO-SUPPORT-ALTERNATIVAS-APP-BANCARIAS-01 — Optimización SEO/GEO artículo alternativas-a-app-bancarias

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/alternativas-a-app-bancarias.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido al frontmatter
- `title` actualizado: "Las 7 Alternativas a Fintonic sin Banco (2026)" → "Alternativas a Apps Bancarias para Controlar Gastos sin Conectar el Banco (2026)" (alinea con slug y semántica del artículo)
- `excerpt` actualizado: incluye "alternativas a apps bancarias", "controlar gastos", "Kakebo AI"
- FAQ frontmatter: Q2 y Q5 mejoradas para incluir "Kakebo AI" y "MetodoKakebo.com" con terminología canónica
- Intro reescrita: explica directamente el problema (controlar gastos sin conectar el banco), elimina lenguaje alarmista
- Sección "El oscuro modelo de negocio" → renombrada "El modelo de negocio de las apps financieras gratuitas", tono más prudente y factual; eliminadas frases como "comisiones abusivas", "intereses usurarios", "obsceno Data Brokerage", cita exagerada
- Sección "El gran cisma: La Automatización Inconsciente" → renombrada "Automatización frente a registro consciente", tono factual, terminología corregida ("método Kakebo" + "Kakebo AI" diferenciados)
- Sección "Kakebo AI" → depersonalizada (eliminado "hemos creado desde cero", "jamás te pediremos", "nuestro sistema", "¿Cómo narices"); descripción factual del producto como herramienta de MetodoKakebo.com
- Sección "El falso dilema" → renombrada "Privacidad frente a comodidad: no son excluyentes", tono más directo y sin superlatiivos; termina con principio del método Kakebo
- Párrafo de transición: "el método Kakebo potenciado con IA" → "Kakebo AI — la app gratuita de MetodoKakebo.com basada en el método Kakebo" (terminología canónica)
- FAQ cuerpo: respuestas ajustadas para incluir "método Kakebo" y "Kakebo AI" con distinción correcta

---

### SEO-GEO-BLOG-KAKEBO-ONLINE-GUIA-COMPLETA-IMAGE-01 — Imagen portada kakebo-online-guia-completa (imagen definitiva)

**Estado:** ✅ Completado (2026-07-01)  
**Archivos:** `public/images/blog/kakebo-online-guia-completa.png` · `src/content/blog/kakebo-online-guia-completa.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios (2):**
- Imagen añadida a `public/images/blog/kakebo-online-guia-completa.png` (~2.1 MB)
- Frontmatter `image`: `"/images/blog/kakebo-online-guia.png"` → `"/images/blog/kakebo-online-guia-completa.png"` (imagen específica del artículo, nombre único)
- Nota: tarea anterior (GUIA-IMAGE-01) ya corrigió `.jpg→.png`; esta tarea asigna la imagen definitiva con nombre inequívoco
- Otros issues del artículo (H1 duplicado, `description:`, `tags:`) no tocados

---

### SEO-GEO-BLOG-KAKEBO-ONLINE-GUIA-IMAGE-01 — Imagen portada kakebo-online-guia-completa

**Estado:** ✅ Completado (2026-07-01)  
**Archivos:** `public/images/blog/kakebo-online-guia.png` · `src/content/blog/kakebo-online-guia-completa.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios (2):**
- Imagen añadida a `public/images/blog/kakebo-online-guia.png` (~2.4 MB)
- Frontmatter `image`: `"/images/blog/kakebo-online-guia.jpg"` → `"/images/blog/kakebo-online-guia.png"` (corrige ruta rota + formato incorrecto)
- Otros issues del artículo (H1 duplicado, `description:`, `tags:`) no tocados — fuera de alcance de esta tarea

---

### SEO-GEO-BLOG-KAKEBO-AUTONOMOS-IMAGE-01 — Imagen portada metodo-kakebo-para-autonomos

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `public/images/blog/kakebo-autonomos.png`  
**Build:** ✅ Compiled successfully

**Cambios (1):**
- Imagen añadida a `public/images/blog/kakebo-autonomos.png` (~2.4 MB)
- MDX no modificado: el frontmatter ya declaraba `image: '/images/blog/kakebo-autonomos.png'` correctamente

---

### SEO-GEO-BLOG-LIBRO-KAKEBO-PDF-IMAGE-01 — Imagen portada libro-kakebo-pdf

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `public/images/blog/libro-kakebo-pdf.png`  
**Build:** ✅ Compiled successfully

**Cambios (1):**
- Imagen añadida a `public/images/blog/libro-kakebo-pdf.png` (~2.1 MB)
- MDX no modificado: el frontmatter ya declaraba `image: '/images/blog/libro-kakebo-pdf.png'` correctamente

---

### SEO-GEO-BLOG-PELIGROS-APPS-AHORRO-IMAGE-01 — Imagen portada peligros-apps-ahorro-automatico

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `public/images/blog/peligros-apps-ahorro.png`  
**Build:** ✅ Compiled successfully

**Cambios (1):**
- Imagen añadida a `public/images/blog/peligros-apps-ahorro.png` (~2.0 MB)
- MDX no modificado: el frontmatter ya declaraba `image: '/images/blog/peligros-apps-ahorro.png'` correctamente

---

### SEO-GEO-BLOG-AHORRO-PAREJA-IMAGE-01 — Imagen portada ahorro-pareja

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `public/images/blog/ahorro-pareja.png`  
**Build:** ✅ Compiled successfully

**Cambios (1):**
- Imagen añadida a `public/images/blog/ahorro-pareja.png` (~2.4 MB)
- MDX no modificado: el frontmatter ya declaraba `image: '/images/blog/ahorro-pareja.png'` correctamente

---

### SEO-GEO-BLOG-KAKEBO-VS-YNAB-IMAGE-01 — Imagen portada kakebo-vs-ynab

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `public/images/blog/kakebo-vs-ynab.png`  
**Build:** ✅ Compiled successfully

**Cambios (1):**
- Imagen añadida a `public/images/blog/kakebo-vs-ynab.png` (~2.3 MB)
- Nota: archivo fuente en `imagenes/blog/` tenía extensión doble (`kakebo-vs-ynab.png.png`) — copiado con nombre correcto
- MDX no modificado: el frontmatter ya declaraba `image: '/images/blog/kakebo-vs-ynab.png'` correctamente

---

### SEO-GEO-BLOG-AHORRAR-DINERO-IMAGE-01 — Imagen portada como-ahorrar-dinero-cada-mes

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `public/images/blog/ahorrar-dinero.png`  
**Build:** ✅ Compiled successfully

**Cambios (1):**
- Imagen añadida a `public/images/blog/ahorrar-dinero.png` (~2.3 MB)
- MDX no modificado: el frontmatter ya declaraba `image: '/images/blog/ahorrar-dinero.png'` correctamente

---

### SEO-GEO-BLOG-METODO-KAKEBO-GUIA-IMAGE-01 — Imagen portada metodo-kakebo-guia-definitiva

**Estado:** ✅ Completado (2026-07-01)  
**Archivos:** `public/images/blog/metodo-kakebo-guia-definitiva.png` · `src/content/blog/metodo-kakebo-guia-definitiva.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios (2):**
- Imagen añadida a `public/images/blog/metodo-kakebo-guia-definitiva.png` (~2.4 MB)
- Frontmatter `image`: `/api/og?title=Método Kakebo: Guía Definitiva&description=...` → **`/images/blog/metodo-kakebo-guia-definitiva.png`** (imagen estática real)
- Activa: portada visual en artículo, OG image, Twitter card, JSON-LD BlogPosting image

---

### SEO-GEO-PILLAR-PRESUPUESTO-PERSONAL-01 — /blog/como-hacer-un-presupuesto-personal

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/como-hacer-un-presupuesto-personal.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios (7):**
- `updatedDate: '2026-07-01'` añadido — activa dateModified en JSON-LD y sitemap
- Intro: párrafo de definición factual GEO-citable ("Un presupuesto personal es...") antes del hook existente — basado en D-12
- FAQ frontmatter Q2: `"calculadora de ahorro de MetodoKakebo"` → **"calculadora de ahorro mensual de MetodoKakebo.com"**
- Línea 111: `"el método japonés"` (ambiguo) → **"el método Kakebo"** (canónico)
- Línea 207: anchor text `"calculadora de ahorro"` → **"calculadora de ahorro mensual"** + `de MetodoKakebo.com`
- FAQ body: mismo fix para anchor text de calculadora de ahorro
- ArticleCTA: `"MetodoKakebo: un diario de gastos digital construido sobre el método japonés"` → **"Kakebo AI, la app gratuita de MetodoKakebo.com, basada en el método Kakebo japonés"**

---

### SEO-GEO-BLOG-KAKEBO-ONLINE-IMAGE-01 — Imagen portada kakebo-online-gratis

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `public/images/blog/kakebo-online-gratis.png`  
**Build:** ✅ Compiled successfully

**Cambios:**
- Imagen añadida a `public/images/blog/kakebo-online-gratis.png` (~2 MB)
- El frontmatter ya declaraba `image: '/images/blog/kakebo-online-gratis.png'` — sin cambios en MDX
- Activa: OG image, Twitter card, JSON-LD BlogPosting image, y portada `<Image>` en el artículo

---

### SEO-GEO-PILLAR-KAKEBO-ONLINE-GRATIS-ES-01 — /blog/kakebo-online-gratis ES

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/kakebo-online-gratis.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios (6):**
- `title`: "La Mejor Aplicación" → **"Aplica el Método Japonés sin Conectar el Banco"** (elimina superlativo)
- `excerpt`: "La alternativa moderna" → "La alternativa digital" (más neutro)
- `updatedDate: '2026-07-01'` añadido
- Intro: definición factual nueva como primera frase + **MetodoKakebo.com** y **Kakebo AI** nombrados
- H2: "¿Es Kakebo AI **la mejor opción**...?" → "¿**Por qué elegir** Kakebo AI...?" + MetodoKakebo.com en cuerpo
- Cierre: "**receta definitiva**" → "**puede ayudarte**" + MetodoKakebo.com

---

### SEO-GEO-PILLAR-METODO-KAKEBO-GUIA-01 — Artículo pilar método Kakebo

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/metodo-kakebo-guia-definitiva.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios aplicados (6):**

| Elemento | Cambio |
|---|---|
| `excerpt` | Elimina "hasta un 35% de tu sueldo" (promesa cuantitativa) → descripción factual |
| `updatedDate` | Añadido `2026-07-01` — activa dateModified real en JSON-LD y sitemap |
| FAQ Q1 answer | "necesidades, deseos, cultura y extras" → **"Supervivencia, Ocio/Vicio, Cultura y Extras"** (canónico) |
| Primer párrafo | "es mucho más que una simple técnica" → definición factual GEO-citeable con 家計簿 + MetodoKakebo.com |
| Categoría 3 | "**Cultura (Extra)**" → "**Cultura**" (paréntesis confuso eliminado) |
| Cierre | "garantiza" → "puede ayudarte" · añade "en MetodoKakebo.com" |

---

### SEO-GEO-TOOL-503020-COPY-01 — /herramientas/regla-50-30-20 copy canónico

**Estado:** ✅ Completado (2026-07-01)  
**Archivos:** `regla-50-30-20/page.tsx` + `messages/es.json`  
**Build:** ✅ Compiled successfully

**Cambios en `page.tsx`:**
- `SCHEMA.name`: "Calculadora Regla 50/30/20 Kakebo" → **"Calculadora 50/30/20"** (canónico D-11)
- `SCHEMA.description`: "caprichos" → "deseos" + añade "MetodoKakebo.com"
- `SCHEMA`: añade `publisher → #organization`
- CTA text: elimina promesa de automatización implícita → "Kakebo AI, la app gratuita de MetodoKakebo.com, puede ayudarte"
- CTA button: "Crear cuenta en Kakebo" → **"Crear cuenta en Kakebo AI"**

**Cambios en `messages/es.json` (Rule503020):**
- `cta.text`: "Kakebo clasifica" → "**Kakebo AI** clasifica" · "caprichos" → "deseos"
- `cta.button`: "Empezar gratis con Kakebo" → "Empezar gratis con **Kakebo AI**"
- `content.whatText2`: `<bold>Kakebo</bold>` → `<bold>Kakebo AI</bold>` con referencia a MetodoKakebo.com

---

### SEO-GEO-TOOL-INFLACION-COPY-01 — /herramientas/calculadora-inflacion schema + cta copy

**Estado:** ✅ Completado (2026-07-01)  
**Archivos:** `src/app/[locale]/(landing)/herramientas/calculadora-inflacion/page.tsx` + `messages/es.json`  
**Build:** ✅ Compiled successfully

**Cambios en `page.tsx` (schema + metadata):**
- `openGraph.siteName`: "Kakebo" → "MetodoKakebo.com"
- Schema `SoftwareApplication.name`: "Calculadora de Inflación Kakebo 2026" → **"Calculadora de Inflación e IPC"** (canónico D-10, sin año hardcodeado)
- Schema `SoftwareApplication.description`: añade "MetodoKakebo.com"
- Schema `SoftwareApplication.author.name`: "Kakebo" → "MetodoKakebo.com"
- Schema `SoftwareApplication`: añade `publisher → #organization` (consistencia con Home y calculadora-ahorro)

**Cambios en `messages/es.json`:**
- `Tools.Inflation.cta.text`: "Kakebo es tu herramienta para lograrlo" → "**Kakebo AI**, la herramienta gratuita de **MetodoKakebo.com**, puede ayudarte." (elimina "Kakebo" solo + promesa implícita "lograrlo")

---

### SEO-GEO-TOOL-AHORRO-COPY-01 — /herramientas/calculadora-ahorro copy alineado con glosario

**Estado:** ✅ Completado (2026-07-01)  
**URL:** `/herramientas/calculadora-ahorro`  
**Archivo:** `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx`  
**Build:** ✅ Compiled successfully

**Cambios en copy hardcodeado (3 bloques):**

| Bloque | Cambio |
|---|---|
| Sección "¿Cómo usar?" p.1 | "Nuestra calculadora" → "La calculadora de ahorro mensual de **MetodoKakebo.com**" |
| Sección "¿Cómo usar?" p.2 | "del Kakebo: Supervivencia, **Opcional**" → "del **método Kakebo**: Supervivencia, **Ocio/Vicio**" |
| Sección "¿Cómo usar?" p.3 | "ahorro sólido...sin sacrificar" → lenguaje de estimación, no promesa · elimina "sólido" |
| Sección "¿Qué te dice?" | `"Opcional" o "Vicio"` → **"Ocio/Vicio"** (canónico) · "ya está asegurado" → **"ya está planificado"** |
| CTA final | "registrará...vigilará tu ahorro por ti" → **"te ayudará a registrar...hacer seguimiento"** (elimina promesa de automatización) |

**Metadata y schema:** no modificados (ya correctos desde SEO-SCHEMA-AHORRO-SYNC-01)

---

### SEO-GEO-APP-ENTITY-COPY-01 — Dashboard /app — terminología canónica

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `messages/es.json`  
**Build:** ✅ Compiled successfully

**Hallazgo crítico:** `/app` tiene `robots: { index: false, follow: false }` en `app/layout.tsx`. Es una página autenticada noindex — sin impacto SEO directo. Los cambios aplican por coherencia con el glosario para los usuarios autenticados.

**Cambios aplicados en `Dashboard` namespace:**

| Clave | Cambio |
|---|---|
| `Dashboard.SEO.title` | Añade "el" → "con el método Kakebo" |
| `Dashboard.SEO.p1` | "Kakebo es tu herramienta definitiva" → **"Kakebo AI es la herramienta de MetodoKakebo.com"** · "Ocio" → **"Ocio/Vicio"** |
| `Dashboard.SEO.p2` | "El método japonés Kakebo" → **"El método Kakebo"** (término canónico) |
| `Dashboard.SEO.p3` | "alcanza la libertad financiera" → **"toma mejores decisiones sobre tu dinero"** (elimina promesa financiera) |
| `Dashboard.Onboarding.done.desc` | "tomar control absoluto" → **"la constancia es la clave del método Kakebo"** (elimina superlativo) |

**No modificado:** metadata (ya noindex), schema, routing, Home, artículos, herramientas, lógica app, auth, Supabase, APIs

---

### SEO-GEO-HOME-ENTITY-COPY-01 — Home optimizada como fuente de entidad SEO/GEO

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `messages/es.json`  
**Build:** ✅ Compiled successfully

**6 bloques de copy ajustados en `messages/es.json`:**

| Clave | Cambio |
|---|---|
| `Landing.SEO.whatIs.title` | "Qué es Kakebo y para qué sirve" → "Qué es el método Kakebo y MetodoKakebo.com" |
| `Landing.SEO.whatIs.p1` | Añade definición factual del método Kakebo (1904) + MetodoKakebo.com como plataforma gratuita |
| `Landing.SEO.categories` (4 cards) | "Gastos fijos" eliminado · Categorías canónicas: Supervivencia / **Ocio/Vicio** / **Cultura** / **Extras** |
| `Landing.SEO.faqSchema.a2` | "Ocio, Cultura, Extra" → "**Ocio/Vicio**, Cultura y **Extras**" |
| `Landing.Content.article1.p` | Separa método histórico de MetodoKakebo.com como plataforma. Elimina "Kakebo adapta este método" (claim ambiguo) |
| `Landing.Content.article2.p` | "nuestra plataforma" → **Kakebo AI** + **MetodoKakebo.com**. "Extra" → **Extras** |
| `HowItWorks.steps.step3.desc` | "supervivencia, fijos, ocio, cultura" → categorías canónicas completas |

**Metadata y schema:** no modificados (ya correctos desde tareas anteriores)

**No añadido:** enlaces internos nuevos, claims exagerados, ratings, reviews, datos de empresa

---

### SEO-INTERNAL-LINKING-V1-01 — Auditoría y plan de enlazado interno

**Estado:** ✅ Completado (2026-07-01)  
**Tipo:** Solo documentación estratégica — sin cambios en código ni enlaces  
**Documento:** `docs/seo/SEO_INTERNAL_LINKING_V1_01.md`

**17 URLs analizadas · 8 clusters · 4 fases · 7 tareas derivadas**

**URLs que más necesitan autoridad entrante:**
1. `/blog/metodo-kakebo-guia-definitiva` — hub semántico con solo 2 fuentes confirmadas
2. `/herramientas/calculadora-ahorro` — CTR 34,88% pero solo 2 fuentes (ambas en FAQ)
3. `/herramientas/calculadora-inflacion` — 300 imp, 1 clic, 0 enlaces de blog
4. `/herramientas/regla-50-30-20` — 6 imp, 0 clics, 0 enlaces de blog

**Anchors recomendados principales:**
- "el método Kakebo" → `/blog/metodo-kakebo-guia-definitiva`
- "calculadora de ahorro mensual" → `/herramientas/calculadora-ahorro`
- "calculadora de inflación e IPC" → `/herramientas/calculadora-inflacion`
- "plantilla Kakebo Excel gratis" → `/blog/plantilla-kakebo-excel`

**Fases propuestas:**
- Fase 1: Enlazado mínimo de mayor impacto (plantilla-excel → herramientas, cluster → metodo-kakebo)
- Fase 2: Refuerzo kakebo-online/app y presupuesto personal (esperar GSC post-noindex)
- Fase 3: Enlazado hacia calculadora-inflacion (tras crear artículo editorial)
- Fase 4: Revisión y auditoría de impacto

**Tareas derivadas:** `SEO-EXCEL-INTERNAL-LINKS-01` · `SEO-CLUSTER-KAKEBO-CORE-LINKS-01` · `SEO-AHORRO-INBOUND-01` · `SEO-PRESUPUESTO-INBOUND-01` · `SEO-INFLACION-INBOUND-01` · `SEO-503020-INBOUND-01` · `SEO-INTERNAL-LINKING-AUDIT-01`

---

### SEO-SCHEMA-AHORRO-SYNC-01 — Schema calculadora-ahorro sincronizado con glosario

**Estado:** ✅ Completado (2026-07-01)  
**URL:** `/herramientas/calculadora-ahorro`  
**Archivo:** `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx`  
**Build:** ✅ Compiled successfully

**Schema antes:**
- `SCHEMA.name`: "Calculadora de Ahorro Kakebo" (incorrecto per glosario)
- `SCHEMA.description`: usaba "Ocio, Cultura y Ahorro" (nombres de categorías incorrectos); sin MetodoKakebo.com
- `FAQ_SCHEMA` Q2 answer: "Opcional o Vicio" y "Extra" (nombres incorrectos por glosario)
- Sin `publisher`

**Schema después:**
- `SCHEMA.name`: **"Calculadora de Ahorro Mensual"** (canónico per D-09 y glosario)
- `SCHEMA.description`: factual, menciona MetodoKakebo.com, alineada con D-09
- `SCHEMA.publisher`: `{ "@id": "https://www.metodokakebo.com/#organization" }` (consistente con SEO-SCHEMA-HOME-01)
- `FAQ_SCHEMA` Q2 answer: **"Ocio/Vicio"** y **"Extras"** (canónico per glosario)

**Nota sobre FAQ_SCHEMA:** Los textos de las FAQ se renderizan como contenido visible desde el objeto `FAQ_SCHEMA`. La corrección de "Opcional o Vicio" → "Ocio/Vicio" y "Extra" → "Extras" es un cambio de terminología mínimo justificado por el glosario canónico (hallazgo G-09 de SEO_GEO_DEEP_AUDIT_01.md). No se tocó estructura, lógica ni copy fuera de estos dos términos.

---

### SEO-TECHNICAL-DATEMODIFIED-01 — Soporte updatedDate y dateModified real

**Estado:** ✅ Completado (2026-07-01)  
**Build:** ✅ Compiled successfully

**Archivos modificados:**
- `src/lib/blog.ts` — añadido `updatedDate?: string` al tipo `BlogPost['frontmatter']`
- `src/app/[locale]/(public)/blog/[slug]/page.tsx` — `dateModified` usa `updatedDate ?? date`
- `src/app/sitemap.ts` — `lastModified` de blog posts usa `updatedDate ?? date`

**Comportamiento resultante:**
- `datePublished` → siempre `post.frontmatter.date` (sin cambios)
- `dateModified` → `post.frontmatter.updatedDate ?? post.frontmatter.date` (nuevo)
- `lastModified` sitemap → `new Date(post.frontmatter.updatedDate ?? post.frontmatter.date)` (nuevo)
- Artículos sin `updatedDate`: comportamiento idéntico al anterior (fallback a `date`)

**Uso futuro:** Para señalizar una actualización real de un artículo, añadir al frontmatter:
```
updatedDate: 'YYYY-MM-DD'
```
No inventar fechas. Solo usar cuando el contenido realmente se haya actualizado.

**No se añadió `updatedDate` a ningún artículo.** La infraestructura queda lista.

---

### SEO-SCHEMA-HOME-01 — Schema Organization + WebSite + SoftwareApplication en Home

**Estado:** ✅ Completado (2026-06-30)  
**URL afectada:** `/` (Home)  
**Archivo:** `src/app/[locale]/(public)/page.tsx`  
**Build:** ✅ Compiled successfully

**Implementación:**
- El `SoftwareApplication` existente tenía `aggregateRating` con datos inventados (4.8/24) — **eliminado**
- El `SoftwareApplication` existente y el nuevo `Organization` + `WebSite` se unificaron en un único bloque `@graph`
- Se usó `@id` para referencias cruzadas entre entidades

**Schemas en `@graph`:**
- `Organization` (`#organization`): name "MetodoKakebo.com", url, logo (`/logo.png`), sameAs `https://x.com/kakebo_ai`, description factual
- `WebSite` (`#website`): name "MetodoKakebo.com", url, inLanguage "es", publisher → `#organization`, description factual
- `SoftwareApplication` (`#app`): name "Kakebo AI", applicationCategory, operatingSystem, offers (price 0 EUR), description factual, publisher → `#organization`, featureList

**FAQPage (existente):** mantenido sin cambios en script separado

**No añadido:** SearchAction (no hay búsqueda interna real), aggregateRating, sameAs sin documentar, dirección, teléfono, datos legales

---

### SEO-GEO-ENTITY-DEFINITION-01 — Definiciones factuales citables

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo documentación estratégica semántica/GEO — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_GEO_ENTITY_DEFINITIONS_01.md`

**14 entidades definidas** (corta ≤25 palabras + ampliada ≤80 palabras + uso + schema + FAQ + primer párrafo + ejemplos):  
Método Kakebo · Kakebo · MetodoKakebo.com · Kakebo AI · App Kakebo · Kakebo online · Plantilla Kakebo Excel · Herramientas gratuitas · Calculadora de ahorro mensual · Calculadora de inflación e IPC · Calculadora 50/30/20 · Presupuesto personal · Gastos mensuales · Finanzas personales

**Bloques reutilizables creados:**
- 6 bloques por tipo de página (Home, artículo método, plantilla-excel, kakebo-online, herramienta, sobre-nosotros)
- 3 bloques schema (Organization, WebSite, SoftwareApplication Kakebo AI)
- 4 bloques FAQ (método, MetodoKakebo.com, Kakebo AI, diferencia app/plantilla)
- 3 bloques de primer párrafo listos para insertar (metodo-kakebo-guia-definitiva, sobre-nosotros, Home)

**11 frases prohibidas documentadas** (claims exagerados, superlativos, promesas financieras, confusión método/producto)

**Próximas tareas que deben usar este documento:**  
`SEO-GEO-ENTITY-DEFINITION-01` (implementación) · `SEO-SCHEMA-HOME-01` · `SEO-SCHEMA-AHORRO-SYNC-01` · `SEO-EXCEL-TITLE-01` · `SEO-BLOG-INFLACION-01` · `SEO-BLOG-503020-01` · `SEO-INTERNAL-LINKING-V1-01`

---

### SEO-GEO-TERMINOLOGY-01 — Glosario canónico SEO/GEO

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo documentación estratégica — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_GEO_TERMINOLOGY_01.md`

**14 términos definidos:** Método Kakebo · Kakebo · MetodoKakebo.com · Kakebo AI · App Kakebo · Kakebo online · Plantilla Kakebo Excel · Herramientas gratuitas · Calculadora de ahorro mensual · Calculadora de inflación e IPC · Calculadora 50/30/20 · Regla 50/30/20 · Presupuesto personal · Gastos mensuales

**Ambigüedades principales detectadas:**
- "Kakebo" solo es ambiguo entre método histórico y producto digital
- "Kakebo Online" no es un nombre propio — es un descriptor
- "Opcional o Vicio" y "Extra" son nombres incorrectos de categorías (canon: "Ocio/Vicio" y "Extras")
- MetodoKakebo.com apenas aparece como entidad en el contenido actual

**Reglas canónicas más importantes:**
- Método Kakebo = sistema japonés 1904 (Motoko Hani) — NO el producto digital
- Kakebo AI = nombre oficial del producto de MetodoKakebo.com
- MetodoKakebo.com = la plataforma/organización como entidad
- Categorías: Supervivencia / Ocio/Vicio / Cultura / Extras (solo estas formas)
- En schema `Organization.name`: "MetodoKakebo.com" o "Kakebo AI", nunca solo "Kakebo"

**Frases definicionales citables incluidas** (6 frases — para usar en `SEO-GEO-ENTITY-DEFINITION-01`)

**Próximas tareas que deben usar este documento:** `SEO-GEO-ENTITY-DEFINITION-01`, `SEO-SCHEMA-HOME-01`, `SEO-SCHEMA-AHORRO-SYNC-01`, `SEO-EXCEL-TITLE-01`, `SEO-INTERNAL-LINKING-V1-01`, `SEO-BLOG-INFLACION-01`, `SEO-BLOG-503020-01`

---

### SEO-KAKEBO-ONLINE-CANIB-FIX-01 — Implementar noindex en artículo EN

**Estado:** ✅ Completado (2026-06-30)  
**URL afectada:** `/en/blog/kakebo-online-gratis` → ahora con `noindex`  
**Build:** ✅ Compiled successfully

**Implementación:**
- No existía patrón de `noindex` en el sistema — se creó mecanismo mínimo y reutilizable
- `src/lib/blog.ts` — añadido `noindex?: boolean` al tipo `BlogPost['frontmatter']`
- `src/app/[locale]/(public)/blog/[slug]/page.tsx` — `generateMetadata` aplica `robots: { index: false, follow: false }` cuando `frontmatter.noindex === true`
- `src/app/sitemap.ts` — filtra posts con `noindex: true` para excluirlos del sitemap
- `src/content/blog/kakebo-online-gratis.en.mdx` — añadido `noindex: true` en frontmatter

**Verificaciones:**
- `/en/blog/kakebo-online-gratis`: noindex aplicado ✅
- `/blog/kakebo-online-gratis` (ES): sin noindex, sigue indexable ✅
- Canonical y hreflang: no modificados ✅
- Versión española del artículo: no tocada ✅
- robots.txt: no tocado ✅
- Otros artículos EN: no tocados ✅
- Home `/`: no tocada ✅

**Validación en GSC:** Revisar en 2-4 semanas que la URL EN muestre noindex en "Inspect URL". En 6-8 semanas, confirmar que la ES canonical gana impresiones.

---

### SEO-KAKEBO-ONLINE-CANIB-01 — Auditoría canibalización EN/ES kakebo-online-gratis

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo auditoría y documentación — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_KAKEBO_ONLINE_CANIB_01.md`

**Veredicto:** Interferencia EN→ES **CONFIRMADA** por datos reales de GSC

**Causa raíz:** Cross-language URL contamination — el slug `kakebo-online-gratis` contiene la palabra española "gratis" en la URL inglesa `/en/blog/kakebo-online-gratis`. Google asocia esta URL EN con búsquedas españolas y la muestra por encima del ES canonical.

**Datos clave:**
- `/en/blog/kakebo-online-gratis`: 15 clics · 208 imp · pos 6,86
- `/blog/kakebo-online-gratis` (ES canonical): 1 clic · 6 imp · pos 6,0
- Ratio ES:EN = 1:34 en impresiones (anomalía para audiencia 62,6% española)
- Todos los clics EN son de usuarios españoles (queries en español, `kakebo online gratis`)

**Solución recomendada:**  
`noindex` en `kakebo-online-gratis.en.mdx` → eliminar del índice de Google → toda la autoridad migra al ES canonical. Complementar con refuerzo de señales internas hacia `/blog/kakebo-online-gratis`.

**Tarea fix propuesta:** `SEO-KAKEBO-ONLINE-CANIB-FIX-01` ⬅ siguiente P0

---

### SEO-DATA-PRIORITY-01 — Snapshot GSC y priorización SEO por datos reales

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo análisis y documentación — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_DATA_PRIORITY_01.md`  
**Export:** GSC Last 3 months — 2026-03-29 → 2026-06-28

**Métricas del periodo:**
- 222 clics · 3.079 impresiones · CTR 7,21% · 92 días
- Últimos 28 días: 120 clics / 1.355 imp / CTR 8,85%
- Últimos 7 días: 32 clics / 329 imp / CTR 9,73%
- Últimos 3 días: 15 clics / 128 imp / CTR 11,72% / pos 6,35

**Hallazgos clave:**
- `plantilla-kakebo-excel` acumula 125 clics combinados (ES + canónica) — 56% del total
- Home: 51 clics, 892 impresiones, CTR 5,72%
- `calculadora-ahorro` CTR 34,88% confirmado (15 clics, 43 imp, pos 10,7)
- **CONFIRMADO:** `/en/blog/kakebo-online-gratis` captura 15 clics mientras `/es/` tiene 0
- **CONFIRMADO:** `app kakebo` (pos 5,87) y `metodo kakebo app` (pos 8,49) tienen 0 clics
- `calculadora-inflacion`: 300 impresiones, 1 clic, CTR 0,33% — mayor desperdicio del sitio
- España = 62,6% de clics; LatAm = 27%; EEUU = 427 imp (0,47% CTR)
- Desktop = 61% de clics (audiencia en modo investigación)
- Sin rich results confirmados en Search Appearance

**Cambio de prioridad en roadmap:**
- `SEO-KAKEBO-ONLINE-CANIB-01` sube de P2 a **P0** — canibalización confirmada por datos
- `SEO-EXCEL-TITLE-01` se mantiene P0 confirmado
- `SEO-HREFLANG-KAKEBO-ONLINE-01` sube urgencia a P1

**Próximas 5 tareas en orden:**
1. `SEO-KAKEBO-ONLINE-CANIB-01` — resolver canibalización EN/ES confirmada
2. `SEO-EXCEL-TITLE-01` — meta title <65 chars en URL principal
3. `SEO-GEO-TERMINOLOGY-01` — glosario + correcciones siteName
4. `SEO-SCHEMA-HOME-01` — schema Organization + WebSite en Home
5. `SEO-CALCULADORA-AHORRO-AUDIT-01` — entender patrón CTR 34,88%

---

### SEO-ROADMAP-V1-01 — Roadmap SEO/GEO priorizado

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo documentación estratégica — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_ROADMAP_V1.md`

**26 tareas priorizadas** en 7 bloques (P0→P6)  
**5 tareas ejecutables inmediatamente** (sin necesidad de datos GSC)  
**12 tareas bloqueadas** hasta tener `SEO-DATA-PRIORITY-01` completado

**Próximas 5 tareas en orden estricto:**
1. `SEO-DATA-PRIORITY-01` — Snapshot GSC completo (prerequisito crítico)
2. `SEO-GEO-TERMINOLOGY-01` — Glosario canónico + siteName + categorías (paralelo)
3. `SEO-GEO-ENTITY-DEFINITION-01` — Definición factual método + producto
4. `SEO-SCHEMA-HOME-01` — Schema Organization + WebSite en Home
5. `SEO-TECHNICAL-DATEMODIFIED-01` — updatedDate + dateModified real

**Tareas P0 (inmediatas):** `SEO-DATA-PRIORITY-01`, `SEO-GA4-EVENTS-01`  
**Tareas P1 (paralelo):** `SEO-GEO-TERMINOLOGY-01`, `SEO-GEO-ENTITY-DEFINITION-01`, `SEO-SCHEMA-HOME-01`, `SEO-TECHNICAL-DATEMODIFIED-01`

**URLs protegidas:** `/blog/plantilla-kakebo-excel` (solo cambios quirúrgicos), `/herramientas/calculadora-ahorro` (no tocar hasta entender CTR 35,9%), `/blog/como-hacer-un-presupuesto-personal` (dejar madurar)

**Ventana de revisión del roadmap:** 12 semanas → crear `SEO_ROADMAP_V2.md` basado en datos reales

---

### SEO-GEO-DEEP-AUDIT-01 — Auditoría profunda SEO técnico, semántico y GEO

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo documentación — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_GEO_DEEP_AUDIT_01.md`

**32 hallazgos** (12 técnicos · 9 semánticos · 11 GEO)  
**2 riesgos críticos · 7 medios · 8 bajos**

**Hallazgos clave:**
- Problemas P0 del mapa anterior ya RESUELTOS en código (canonical, robots, canonicals herramientas)
- `dateModified` JSON-LD congelado en todos los posts (T-03/T-04)
- Home sin schema `Organization` + `WebSite` (T-07)
- Schema `calculadora-ahorro` desalineado del contenido optimizado (T-05)
- Ambigüedad terminológica crítica: "Kakebo AI" vs "método Kakebo" vs "app" (S-06 + G-02)
- Sin definición factual citable del método o producto en ninguna página (G-01 + G-05)
- 3 herramientas sin artículo editorial de respaldo (S-04)
- Canibalización kakebo-online sin resolver (S-01 + S-02)

**Tareas futuras priorizadas (18 en total):**  
`SEO-EXCEL-TITLE-01` · `SEO-TECHNICAL-DATEMODIFIED-01` · `SEO-TECHNICAL-SITEMAP-01` · `SEO-SCHEMA-HOME-01` · `SEO-GEO-ENTITY-DEFINITION-01` · `SEO-GEO-TERMINOLOGY-01` · `SEO-KAKEBO-ONLINE-CANIB-01` · `SEO-BLOG-INFLACION-01` · `SEO-BLOG-503020-01` · `SEO-INTERNAL-LINKING-V1-01` · `SEO-GA4-EVENTS-01` + más

**Prerequisito bloqueante:** `SEO-DATA-PRIORITY-01` (snapshot GSC actualizado)

---

### SEO-MAP-V1-AUDIT-01 — Mapa maestro SEO V1

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo documentación — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_MAP_V1.md` (sustituye a `SEO_MAP_V1.md` de raíz, 2026-06-17)

**Inventario:**
- 27 URLs ES indexables auditadas
- ~16 URLs EN legacy catalogadas
- ~13 rutas de app (no indexables) listadas
- 1 recurso descargable catalogado
- ~82 URLs totales inventariadas

**Clusters identificados:** 10 (Kakebo Excel, Kakebo Online/App, Herramientas de Ahorro, Presupuesto Personal, Inflación/IPC, Regla 50/30/20, Alternativas/Fintonic, Finanzas Generales, Legal/Institucional, Legacy EN)

**URLs con tracción real documentada:** 4 (`/blog/plantilla-kakebo-excel`, `/herramientas/calculadora-ahorro`, `/herramientas/calculadora-inflacion`, `/blog/alternativas-a-app-bancarias`)

**Riesgos activos:** 7 (title truncado en URL pilar, H3 antes de H2, robots.txt sin `/app/`, canonical herramientas pendiente verificar, canibalización kakebo-online, interferencia EN legacy)

**Gaps críticos:** Sin artículo editorial de respaldo para calculadora-inflacion, regla-50-30-20 y calculadora-ahorro

**Próximas tareas prioritarias:** `SEO-EXCEL-TITLE-01`, `SEO-ROBOTS-01`, `SEO-DATA-PRIORITY-01`

---

### SEO-PILLAR-EXCEL-AUDIT-01 — Auditoría página pilar plantilla-kakebo-excel

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo documentación — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_PILLAR_EXCEL_AUDIT_01.md`  
**URL auditada:** `/blog/plantilla-kakebo-excel`

**Hallazgos clave:**
- 12 fortalezas SEO identificadas (JSON-LD SoftwareApplication único, keyword exacta en H1, recurso descargable real, FAQPage con 5 preguntas, hreflang/canonical correctos)
- 10 riesgos SEO identificados (meta title truncado ~93 chars, H3 antes de primer H2, dateModified congelado, enlazado interno insuficiente hacia herramientas)
- 8 oportunidades de enlazado interno identificadas (hacia /herramientas/regla-50-30-20, /herramientas/calculadora-inflacion, desde /blog/como-hacer-un-presupuesto-personal, y más)
- 8 tareas futuras propuestas (SEO-EXCEL-TITLE-01, SEO-EXCEL-H3-FIX-01, SEO-EXCEL-DATE-01, SEO-EXCEL-INTERNAL-LINKS-01, SEO-EXCEL-INBOUND-PILAR-01, y más)

**Restricción activa:** No tocar slug, H1, estructura narrativa, hreflang/canonical, imágenes ni contenido EN legacy.

---

### SEO-DATA-PRIORITY-01 — Priorizar oportunidades según Search Console

**Estado:** Pendiente de inicio  
**Prerequisito:** Datos de Search Console actualizados para el dominio metodokakebo.com  
**Descripción:** Analizar rendimiento actual por query, identificar páginas con impresiones altas y CTR bajo, detectar keywords en posiciones 5-20 candidatas a optimización, y establecer prioridades de SEO Sprint 3 basadas en datos reales, no en estimaciones.

**No iniciar** ningún nuevo artículo SEO ni tarea técnica SEO sin haber ejecutado primero SEO-DATA-PRIORITY-01.

---

## UI-CARDS-BRAND-ALIGN-01 — Alineación sistema de tarjetas con brand manual

**Fecha:** 2026-06-26

**Inventario completo auditado:** Features, ToolsSection, SavingsSimulator, Testimonials, FAQ, HowItWorks, AlternativesSection, Blog index, RelatedPosts, MDXComponents, SavingsCalculator, Calculator503020, CalculatorInflation.

**Inconsistencias corregidas (2 archivos):**

| Archivo | Inconsistencia | Corrección |
|---|---|---|
| `SavingsCalculator.tsx` | Tip box `bg-orange-50/border-orange-100` (fuera de paleta) | `bg-muted/50 border-border` (tokens brand) |
| `SavingsCalculator.tsx` | Emoji `💡` en tip box (brand manual: sin emojis) | Eliminado |
| `SavingsCalculator.tsx` | Result card `shadow-xl` (excesiva) | `shadow-sm` (sutil) |
| `SavingsCalculator.tsx` | Progress bar `bg-blue-500` (fuera paleta) | `bg-primary` (terracota brand) |
| `SavingsCalculator.tsx` | Progress bar `bg-purple-500` (fuera paleta) | `bg-accent` (índigo brand) |
| `SavingsCalculator.tsx` | Progress bar `bg-yellow-500` (fuera paleta) | `bg-amber-400` (ámbar, chart-5 del sistema) |
| `HowItWorks.tsx` | Timeline icon `shadow-lg` (único shadow agresivo del sistema) | `shadow-sm` |

**Validado como coherente (no tocado):**
- Sistema de radios en 3 niveles: editorial (sin radius/rounded-sm), componentes (rounded-xl), containers (rounded-2xl) — es intencional
- CalculatorInflation: colores red/stone en stat cards contextuales (pérdida = rojo, real = neutro) — semánticamente correctos
- Calculator503020: colores amber/emerald en legend items — contextualmente apropiados y en paleta cálida
- ToolsSection inflation card usando `destructive` — tarea separada pendiente (`UI-TOOLS-INFLATION-COLOR-01`)
- RelatedPosts `hover:-translate-y-0.5` — sutil, no agresivo
- Blog index `hover:shadow-lg` en featured — diferenciación intencional

**Tipografías globales:** no tocadas.  
**Textos/SEO:** no tocados.  
**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `4781ad0`

---

## UI-TYPOGRAPHY-BRAND-ALIGN-01 — Alineación tipográfica con brand manual

**Fecha:** 2026-06-26  
**Tipo:** Correcciones tipográficas mínimas y globales

**Diagnóstico previo a la tarea:**
- Hero, Features, FAQ, SavingsSimulator, AlternativesSection, ToolsSection, Footer, Navbar: `font-serif` correctamente aplicado en todos los H1/H2/H3 ✅
- Blog articles: `prose-headings:font-serif` en el layout del artículo ✅
- Calculadoras: `font-serif` en H1 y secciones editoriales ✅
- Único problema encontrado: HowItWorks step card H3 sin `font-serif` + tailwind typography prose sin `fontFamily` global

**Cambios aplicados:**

1. `tailwind.config.ts` — Añadido `fontFamily: 'var(--font-playfair), serif'` a los selectores `h2` y `h3` de la configuración `typography`. Garantiza que cualquier bloque `.prose` use Playfair en H2/H3 globalmente, sin depender del modificador `prose-headings:font-serif` en cada uso.

2. `src/components/landing/HowItWorks.tsx` — Añadido `font-serif` al H3 del step card (`Step` component). Los títulos de pasos son "H3 destacados" según el brand manual.

**Zonas validadas:** Home, Blog index, artículos, herramientas, CTAs, navbar, footer, MDXComponents — tipografía coherente en todas.

**Tarjetas/radios/bordes/sombras:** no tocados.  
**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `a62b440`

---

## UI-CTA-EMOJI-REMOVE-01 — Eliminación de emojis en CTAs editoriales

**Fecha:** 2026-06-26  
**Emojis eliminados:** 14 total (12 × `👉🏽` en SimpleCTA, 1 × `📥` en DownloadCTA, 1 × `🔒` en Hero trust signal)

**Artículos modificados (12):**
- `ahorro-pareja.es.mdx`
- `alternativas-a-app-bancarias.es.mdx`
- `como-ahorrar-dinero-cada-mes.es.mdx`
- `eliminar-gastos-hormiga.es.mdx`
- `kakebo-online-gratis.es.mdx`
- `kakebo-sueldo-minimo.es.mdx`
- `kakebo-vs-ynab.es.mdx`
- `libro-kakebo-pdf.es.mdx`
- `metodo-kakebo-para-autonomos.es.mdx`
- `peligros-apps-ahorro-automatico.es.mdx`
- `plantilla-kakebo-excel.es.mdx` (SimpleCTA + DownloadCTA)
- `regla-30-dias.es.mdx`

**`messages/es.json`:** `Hero.trustSignal` — eliminado `🔒`

**Ajustes de copy (donde el texto dependía del gesto del emoji):**
- `peligros-apps-ahorro-automatico`: "Destruye…refugio" → "Cierra tus conexiones Open Banking y únete a Kakebo AI"
- `regla-30-dias`: copy de 100 chars + "dieta extrema" → "Empieza gratis con Kakebo AI y toma el control de tus gastos"
- 3 copies simplificados eliminando openers que funcionaban como hook del emoji ("Olvídate de…", "Olvida…", "Suelta…")

**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `45bab2c`

---

## UI-COLOR-PRIMARY-ALIGN-01 — Alineación color primario con brand manual

**Fecha:** 2026-06-26  
**Cambio:** `#cf5c5c` / `#f87171` → `#cf8c6c` (terracota cálida brand manual)

**Tokens actualizados en `src/app/globals.css`:**

| Token | Antes (light) | Después | Antes (dark) | Después |
|---|---|---|---|---|
| `--primary` | `#cf5c5c` | `#cf8c6c` | `#f87171` | `#cf8c6c` |
| `--primary-foreground` | `#fafaf9` | `#1c1917` | `#1c1917` | sin cambio |
| `--ring` | `#cf5c5c` | `#cf8c6c` | `#f87171` | `#cf8c6c` |
| `--chart-1` | `#cf5c5c` | `#cf8c6c` | `#f87171` | `#cf8c6c` |
| `--sidebar-primary` | `#cf5c5c` | `#cf8c6c` | `#f87171` | `#cf8c6c` |
| `--sidebar-primary-foreground` | `#fafaf9` | `#1c1917` | `#1c1917` | sin cambio |
| `--sidebar-ring` | `#cf5c5c` | `#cf8c6c` | `#f87171` | `#cf8c6c` |

**Hardcodes actualizados:**
- `src/components/reports/ReportPDF.tsx` (×2) — componente interno
- `src/app/api/og/route.tsx` (×1) — gradiente decorativo OG
- `src/components/AIMetricsChart.tsx` (×1) — array de colores de chart interno

**Nota de contraste:** `primary-foreground` actualizado de `#fafaf9` (blanco, 2.6:1 con nuevo primary) a `#1c1917` (piedra oscura, 6.6:1 con nuevo primary) para cumplir WCAG AA. El dark mode ya usaba `#1c1917` — se unifica el sistema.

**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `1d3800d`

---

## UI-BRAND-AUDIT-01 — Auditoría de identidad visual

**Fecha:** 2026-06-26  
**Tipo:** Solo documentación — sin cambios en código  
**Documento:** `docs/brand/UI_BRAND_AUDIT_01.md`

**Resumen:** 12 hallazgos detectados. 2 de alta prioridad (sistémicos), 4 de media, 6 de baja.

| Prioridad | Hallazgo | Tarea futura |
|---|---|---|
| Alta | Color primario #cf5c5c ≠ #CF8C6C del brand manual | UI-COLOR-PRIMARY-ALIGN-01 |
| Alta | Emoji `👉🏽` en 12 CTAs de artículos | UI-CTA-EMOJI-REMOVE-01 |
| Media | Border-radius de CTAs inconsistente | UI-CTA-RADIUS-UNIFY-01 |
| Media | Calculadora de Ahorro ausente de ToolsSection | UI-TOOLS-SECTION-COMPLETE-01 |
| Media | Color `destructive` en inflation card | UI-TOOLS-INFLATION-COLOR-01 |
| Media | "PASO" hardcodeado sin i18n en HowItWorks | UI-HOWITWORKS-I18N-01 |
| Baja | Emoji 🔒 en trust signal Hero | (incluir en emoji task) |
| Baja | Copyright "Kakebo Ahorro" legacy en Footer | UI-FOOTER-COPYRIGHT-01 |
| Baja | Border-radius de cards inconsistente | UI-CARDS-RADIUS-SYSTEM-01 |
| Baja | Dark mode primary demasiado vibrante | (incluir en color task) |
| Baja | SeoContent jerarquía H3/H4 desconectada | UI-SEOCONTENT-HIERARCHY-01 |
| Baja | "Artículo destacado" hardcodeado (no i18n) | (tarea i18n limpieza) |

**Commit:** `5616816`

---

## TOOL-CALCULADORA-AHORRO-V2-IMPL-01 — Calculadora de ahorro V2

**Fecha:** 2026-07-08  
**Estado:** ✅ Completado  
**Commit:** `e986a1d`  
**URL afectada:** `/herramientas/calculadora-ahorro`

**Problema resuelto:**  
La V1 capturaba el campo `fixedExpenses` en estado y UI pero nunca lo usaba en los cálculos. Las barras de progreso estaban hardcodeadas a `w-[50%]`, `w-[20%]`, `w-[10%]` con valores estáticos. La herramienta era funcionalmente un duplicado de la calculadora 50/30/20. El `page.tsx` añadía un `<h1>` duplicado y doble padding (`pt-32 pb-12` + `pt-24 pb-16` en el componente).

**Cambios en V2:**

| Archivo | Cambio |
|---|---|
| `SavingsCalculator.tsx` | Reescritura completa — nueva entrada de gastos variables, cálculo de margen real, barras dinámicas, alertas de estado, sección de objetivo opcional |
| `page.tsx` | Eliminado H1 duplicado, eliminado doble padding, eliminada sección editorial (movida al componente). Reducido a wrapper + schemas JSON-LD |
| `messages/es.json` → `Tools.Savings.*` | Añadidas claves para gastos variables, objetivo de ahorro, estados de resultado, sección goal, disclaimer |
| `src/lib/analytics.ts` | Añadidos `savings_calculator_calculate` y `savings_calculator_goal_result` al tipo `EventName` |

**Lógica de cálculo V2:**
- `margenReal = ingresos − gastosFijos − gastosVariables`
- `tasaAhorro = (margenReal / ingresos) × 100`
- `mesesParaObjetivo = ceil(objetivo / margenReal)` cuando margen > 0
- `ahorroNecesario = ceil(objetivo / plazo)` cuando plazo > 0
- Estado: `deficit` | `zero` | `tight` (<10%) | `below_target` (<20%) | `good` (≥20%)
- Barra apilada con `style={{ width: X% }}` — completamente dinámica

**Analytics GA4 (sin datos personales exactos):**
- `savings_calculator_calculate`: ranges de income, margen, tasa + has_goal, has_deadline, result_status
- `savings_calculator_goal_result`: months_to_goal (rangos), savings_rate_range, result_status

**Restricciones respetadas:**  
Sin tocar otras herramientas · Sin tocar artículos del blog · Sin tocar SEO técnico global · Sin modificar canonical/hreflang/sitemap · Sin datos personales exactos en GA4

**Build:** ✅ Compiled successfully — 0 errores TypeScript, 0 errores de compilación

---

## CONTENT-01 — Artículo "Cuentas remuneradas"

**Fecha:** 2026-07-08  
**Estado:** ✅ Completado  
**Sprint:** Sprint Contenido V1  
**Tipo:** Guía evergreen informativa — España-first, bank-agnostic

**URL creada:** `/blog/cuentas-remuneradas`  
**Archivo MDX:** `src/content/blog/cuentas-remuneradas.es.mdx`  
**Imagen integrada:** `docs/seo/articulos/cuenta_remunerada.png` → `public/images/blog/cuentas-remuneradas.png`

**Objetivo editorial:**  
Explicar qué es una cuenta remunerada, cómo funciona, qué factores revisar antes de contratar una y cuándo encaja dentro de un sistema de ahorro personal tipo Kakebo. No es una comparativa comercial de bancos ni una recomendación de contratación.

**Keyword principal:** `cuentas remuneradas`  
**Keywords secundarias:** `qué es una cuenta remunerada`, `cuenta remunerada ahorro`, `TAE cuenta remunerada`, `fondo de emergencia cuenta remunerada`, `cuentas remuneradas España`, `cuenta remunerada o depósito`

**Hipótesis SEO/GEO:**  
Captar intención informativa sobre cuentas remuneradas y conectar naturalmente el clúster de ahorro mensual, fondo de emergencia, inflación y presupuesto personal ya existente en el sitio.

**Estructura editorial:**  
Respuesta rápida + definición + cómo funciona + tabla comparativa (4 productos) + qué mirar antes de contratar + cuándo tiene/no tiene sentido + ejemplo práctico (1.000 €, 3.000 €, 10.000 €) + fondo de emergencia + errores frecuentes + checklist (tabla) + FAQ (6 preguntas) + conclusión + fuentes oficiales

**Fuentes oficiales integradas:**
- Banco de España (cuentas a la vista, TAE, depósitos a plazo)
- FGD — Fondo de Garantía de Depósitos (cobertura hasta 100.000 € por titular y entidad)
- BOE — Ley 35/2006 del IRPF, artículo 25 (intereses como rendimientos del capital mobiliario)
- BCE (contexto de tipos oficiales, sin previsiones)

**Enlazado interno activo:**
- `/blog/como-hacer-un-presupuesto-personal`
- `/herramientas/calculadora-ahorro`
- `/herramientas/calculadora-inflacion`

**Restricciones respetadas:**  
Sin comparativa comercial · Sin recomendación de entidades · Sin afiliación · Sin promesas de rentabilidad · Sin tabla de "mejores cuentas" · No se ha tocado `/blog/plantilla-kakebo-excel` · No se han modificado componentes globales

**Schema generado automáticamente por el sistema:** `BlogPosting` + `FAQPage` (6 preguntas en frontmatter)

**Ventana de medición SEO:** 8–12 semanas desde publicación

**Build:** ✅ Compiled successfully — 0 errores TypeScript, 0 errores de compilación

---

## SEO-503020-CALCULADORA-01 — Optimización herramienta regla 50/30/20

**Fecha de ejecución:** 2026-06-26  
**URL objetivo:** `/herramientas/regla-50-30-20`  
**Keywords objetivo:** calculadora 50 30 20 (primaria), 50 30 20 calculadora, calculadora presupuesto, calculadora gastos mensuales, necesidades deseos y ahorro

**Cambios realizados:**

| Campo | Antes | Después |
|---|---|---|
| `Rule503020.meta.title` | `"Calculadora 50/30/20: Tu Sueldo Ideal en 1 Clic (Plantilla Gratis)"` (67 chars) | `"Calculadora 50/30/20 Gratis | Necesidades, Deseos y Ahorro"` (58 chars ✓) |
| `Rule503020.meta.description` | 153 chars, empieza "No hagas números" | 151 chars, empieza "Calculadora 50/30/20 gratis para dividir tu sueldo" |
| `Rule503020.meta.ogTitle` | "Distribuye tu Nómina en 1 Clic" | "Tu Presupuesto Mensual Gratis" |
| `Rule503020.header.subtitle` | "Descubre cuánto deberías ahorrar..." | "Divide tu sueldo mensual entre necesidades, deseos y ahorro..." |
| H1 page.tsx (hardcodeado) | `"Calculadora Regla 50/30/20"` | `"Calculadora 50/30/20 Gratis"` |
| Subtítulo page.tsx (hardcodeado) | "Descubre tu sueldo ideal distribuyéndolo..." | "Divide tu sueldo mensual entre necesidades, deseos y ahorro..." |
| H1 duplicado Calculator503020.tsx | `<h1>` | `<h2>` (mismo fix que SEO-AHORRO-H1-DEDUP-01) |

**Archivos modificados:** `messages/es.json`, `page.tsx` (regla-50-30-20), `Calculator503020.tsx`  
**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `bb82137`

---

## SEO-AHORRO-H1-DEDUP-01 — Corrección H1 duplicado en calculadora de ahorro

**Fecha de ejecución:** 2026-06-26  
**URL objetivo:** `/es/herramientas/calculadora-ahorro`  
**Problema:** Dos elementos `<h1>` en la misma página — uno en `page.tsx`, otro en `SavingsCalculator.tsx`

**Corrección aplicada:**
- `src/components/landing/tools/SavingsCalculator.tsx` — `<h1>` → `<h2>` (2 líneas)
- Las clases Tailwind del elemento no cambian → cero impacto visual
- `page.tsx` conserva el único `<h1>` semántico real

**Jerarquía resultante:**
```
<h1> Calculadora de Ahorro Mensual          (page.tsx)
  <h2> Calculadora de Ahorro Mensual        (SavingsCalculator, degradado)
  <h2> ¿Cómo usar esta calculadora...       (sección SEO)
  <h2> ¿Qué te dice el resultado?           (sección SEO)
  <h2> Preguntas frecuentes sobre ahorro    (sección SEO)
```

**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `6d98a8a`

---

## SEO-AHORRO-CALCULADORA-01 — Optimización calculadora de ahorro

**Fecha de ejecución:** 2026-06-26  
**URL objetivo:** `/es/herramientas/calculadora-ahorro`  
**Datos Search Console:** 39 impresiones · 14 clics · CTR 35,9% · posición 8,97  
**Keywords objetivo:** calculadora ahorro (primaria), calculadora de ahorro, cuánto ahorrar al mes, simulador de ahorro mensual, plan de ahorro mensual

**Cambios realizados:**

| Campo | Antes | Después |
|---|---|---|
| `Tools.Savings.meta.title` | `"Calculadora de Ahorro Kakebo: Distribuye tu sueldo"` (50 chars) | `"Calculadora de Ahorro Mensual: ¿Cuánto Ahorrar al Mes?"` (55 chars) |
| `Tools.Savings.meta.description` | 153 chars — enfocada en distribución de ingresos | 141 chars — empieza "Calcula cuánto ahorrar al mes", añade "plan de ahorro mensual" |
| `Tools.Savings.meta.ogTitle` | `"Calculadora de Ahorro Kakebo: Tu sueldo ideal"` | `"Calculadora de Ahorro Mensual | Simula tu Plan de Ahorro"` |
| `Tools.Savings.header.title` (H1 interno) | `"Calculadora de Ahorro Kakebo"` | `"Calculadora de Ahorro Mensual"` — keyword "mensual" |
| `Tools.Savings.header.subtitle` | `"Descubre cómo deberías distribuir tu sueldo..."` | `"¿Cuánto puedes ahorrar al mes? Calcula tu plan..."` — intención directa |
| H1 page.tsx (hardcodeado) | `"Calculadora de Ahorro Kakebo"` | `"Calculadora de Ahorro Mensual"` |
| Subtítulo page.tsx (hardcodeado) | `"Descubre tu potencial de ahorro mensual..."` | `"¿Cuánto deberías ahorrar cada mes? Planifica tu ahorro mensual..."` |

**Nota técnica (pre-existing):** La página tiene dos elementos `<h1>` — uno hardcodeado en `page.tsx` y otro dentro del componente `SavingsCalculator`. No se corrige la estructura en esta tarea.

**Archivos modificados:** `messages/es.json`, `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx`  
**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `8084303`

---

## SEO-HOME-KAKEBO-APP-01 — Optimización Home para kakebo online gratis / kakebo app

**Fecha de ejecución:** 2026-06-26  
**URL objetivo:** `/` (Home ES)  
**Keywords objetivo:** kakebo online gratis (primaria), kakebo online, kakebo app, app kakebo, método kakebo

**Cambios realizados en `messages/es.json`:**

| Campo | Antes | Después |
|---|---|---|
| `Landing.meta.title` | `"Kakebo AI: App Kakebo Online para Ahorro | Sin Banco, Con IA"` (60 chars) | `"Kakebo Online Gratis | App de Ahorro con el Método Japonés"` (59 chars) |
| `Landing.meta.description` | `"Controla tus gastos con el método japonés..."` (109 chars) | `"App Kakebo online gratis para controlar gastos y ahorrar con el método japonés. Sin conectar el banco, 100% privada y con IA integrada."` (135 chars) |
| `Landing.meta.ogTitle` | igual que title anterior | igual que title nuevo |
| `Landing.meta.ogDescription` | igual que description anterior | igual que description nueva |
| `Hero.subtitle` | `"La App de Control de Gastos basada en el Método Japonés..."` | `"La app Kakebo online gratuita para controlar gastos con el Método Japonés..."` |

**H1 (`Hero.title`):** no modificado — ya contenía "Kakebo Online" en posición óptima  
**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `ad9fbf5`

---

## SEO-I18N-KAKEBO-ONLINE-VALIDATE-01 — Validación interferencia ES/EN

**Fecha:** 2026-06-26  
**Tipo:** Validación documental — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_I18N_KAKEBO_ONLINE_VALIDATE_01.md`

**URLs revisadas:**
- `/blog/kakebo-online-gratis` — canónica ES (sin prefijo)
- `/es/blog/kakebo-online-gratis` — redirect 301 confirmado en `next.config.ts`
- `/en/blog/kakebo-online-gratis` — versión EN, supera en señales a ES
- `/es/blog/kakebo-online-guia-completa` — redirect 301 confirmado

**Resultado:**

| Interferencia | Clasificación |
|---|---|
| `/es/*` interfiriendo con `/blog/*` | DESCARTADO — 301 en su lugar |
| EN artículo superando ES en señales | DUDOSO — slug EN contiene keyword española "gratis" |
| Canibalización interna ES | DESCARTADO — intención diferenciada |

**Próxima tarea propuesta:** SEO-I18N-EN-SLUG-FIX-01 (pendiente de datos adicionales de GSC)  
**Commit:** `0006a3d`

---

## DOC-BRAND-01 — Manual de identidad visual Kakebo

**Fecha de ejecución:** 2026-06-26  
**Tipo:** Tarea documental — sin cambios en código

**Archivos añadidos a `docs/brand/`:**
- `IDENTIDAD_VISUAL_KAKEBO.md` — Fuente operativa principal: dirección estética, principios visuales, tipografías, paleta, uso del color, fondos, componentes, tono verbal y reglas de implementación
- `PROMPT_VISUAL_KAKEBO.md` — Bloque reutilizable para prompts visuales a Claude, Gemini o Codex
- `identidad-kakebo-01-cover.png` — Portada del manual visual
- `identidad-kakebo-02-logotipo.png` — Logotipo y usos
- `identidad-kakebo-03-paleta.png` — Paleta cromática
- `identidad-kakebo-04-tipografia.png` — Sistema tipográfico
- `identidad-kakebo-05-sistema-visual.png` — Sistema visual completo
- `identidad-kakebo-06-fondos-recursos.png` — Fondos y recursos gráficos
- `identidad-kakebo-07-aplicaciones.png` — Aplicaciones y ejemplos

**Uso futuro:**
- Referencia obligatoria antes de cualquier tarea UIUX, imagen de blog o recurso gráfico
- El prompt de `PROMPT_VISUAL_KAKEBO.md` debe incluirse en tareas visuales a Claude Code, Gemini o Codex
- Las imágenes son referencia visual complementaria; el markdown es la fuente operativa principal

**Nota:** No se tocó código de aplicación, artículos, SEO, UI, routing ni ningún otro área.  
**Commit:** `5249c37`

---

## SEO-CTR-FINTONIC-01 — Detalle técnico

**Fecha de ejecución:** 2026-06-26  
**URL objetivo:** `/es/blog/alternativas-a-app-bancarias`  
**Datos Search Console:** 310 impresiones · 2 clics · CTR 0,65% · posición media 7,95

**Problema diagnosticado:**
- `title` (77 chars) → meta title `{title} | Blog Kakebo` = 91 chars, truncado por Google (~65 max)
- `excerpt` (175 chars) → description sobre el límite ~155, empieza con pregunta pasiva sin CTA concreto
- Keyword "Fintonic" aparece en intro en p.2, "alternativa a Fintonic" no hasta p.4

**Cambios realizados:**
- `title` (frontmatter): `"Las 7 Alternativas a Fintonic sin Banco (2026)"` (47 chars → 61 total con suffix ✓)
- `excerpt` (frontmatter): `"Comparativa 2026: las 7 mejores alternativas a Fintonic. Controla tus gastos sin conectar el banco ni ceder tus datos. Gratis y sin publicidad."` (143 chars, sin emoji)
- Intro p.3: añade "Fintonic y sus alternativas bancarias" para traer el keyword al párrafo 3

**Archivo modificado:** `src/content/blog/alternativas-a-app-bancarias.es.mdx`  
**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `e1f30a5`

---

## SEO-CTR-INFLACION-01 — Detalle técnico

**Fecha de ejecución:** 2026-06-26  
**URL objetivo:** `/es/herramientas/calculadora-inflacion`  
**Datos Search Console:** 353 impresiones · 1 clic · CTR 0,28% · posición media 7,8

**Problema diagnosticado:**
- Title con redacción pasiva ("¿Cuánto *valor* pierde tu dinero?") y keyword IPC al final entre paréntesis
- Description con 164 chars (sobre el límite ~155) + emoji 📊 con riesgo de truncación
- H1 sin referencia a "IPC" — keyword secundaria con alta búsqueda

**Cambios realizados:**
- `messages/es.json` → `Tools.Inflation.meta.title`: `"Calculadora de Inflación e IPC 2026 | ¿Cuánto pierde tu dinero?"` (65 chars)
- `messages/es.json` → `Tools.Inflation.meta.description`: `"Calcula cuánto pierde tu dinero con la inflación en España. Introduce tus ahorros, IPC y años. Resultado inmediato y gratis, sin registro."` (139 chars, sin emoji)
- `messages/es.json` → `Tools.Inflation.meta.ogTitle`: `"Calculadora de Inflación e IPC 2026 | Kakebo"`
- `messages/es.json` → `Tools.Inflation.header.title`: `"Calculadora de <italic>Inflación e IPC</italic> en España"` — añade IPC al H1 visible

**Nota canónica (no bloqueante, no tocada):** El canonical apunta a `https://www.metodokakebo.com/herramientas/calculadora-inflacion` (sin `/es/`), mientras Search Console indexa `/es/herramientas/calculadora-inflacion`. Esto es coherente si la ruta ES es la ruta sin prefijo en producción (configuración i18n default locale). No se toca hasta tener evidencia de error.

**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `12b97e0`  
**Archivos modificados:** `messages/es.json`

---

## Estado actual del proyecto (2026-06-26)

| Tarea | Descripción | Commit | Estado |
|---|---|---|---|
| SEO-PILAR-01 | Artículo pilar cluster Presupuesto Personal | `38c22ae` | ✅ Completado |
| DOC-I18N-01 | Política SEO de idiomas documentada | `4b5ea7f` | ✅ Completado |
| CHECK-I18N-ROUTING-01 | Bug `Accept-Language` corregido | `5656eef` | ✅ Completado |
| UIUX-02 a 14 + MOBILE | Sprint UI/UX y mobile completo | `bfde77e`..`a0da677` | ✅ Completado |
| MED-01 + MED-02 | GA4 + CSP | `3a1777b`..`7a08d3d` | ✅ Completado |
| UIUX-BLOG-PROSE-01 + PREMIUM + GLOBAL | Sistema premium de artículos + global + mobile | `43269b6`..`b924649` | ✅ Completado |
| **SEO-CTR-INFLACION-01** | Optimizar CTR snippet calculadora inflación (title, description, H1) | `12b97e0` | ✅ Completado |
| **SEO-CTR-FINTONIC-01** | Optimizar CTR artículo alternativas a Fintonic (title, excerpt, intro) | `e1f30a5` | ✅ Completado |
| **DOC-BRAND-01** | Manual de identidad visual Kakebo en `docs/brand/` | `5249c37` | ✅ Completado |
| **SEO-I18N-KAKEBO-ONLINE-VALIDATE-01** | Validación interferencia ES/EN kakebo-online (DUDOSO) | `0006a3d` | ✅ Completado |
| **SEO-HOME-KAKEBO-APP-01** | Optimizar Home para kakebo online gratis / kakebo app | `ad9fbf5` | ✅ Completado |
| **SEO-AHORRO-CALCULADORA-01** | Optimizar calculadora de ahorro para cuánto ahorrar al mes | `8084303` | ✅ Completado |
| **SEO-AHORRO-H1-DEDUP-01** | Corregir H1 duplicado en calculadora de ahorro | `6d98a8a` | ✅ Completado |
| **SEO-503020-CALCULADORA-01** | Optimizar herramienta regla 50/30/20 para calculadora 50 30 20 | `bb82137` | ✅ Completado |
| **UI-BRAND-AUDIT-01** | Auditoría completa web contra brand manual (12 hallazgos) | `5616816` | ✅ Completado |
| **UI-COLOR-PRIMARY-ALIGN-01** | Alinear color primario #cf5c5c→#cf8c6c (brand manual) | `1d3800d` | ✅ Completado |
| **UI-CTA-EMOJI-REMOVE-01** | Eliminar emojis de CTAs en 12 artículos + Hero trust signal | `45bab2c` | ✅ Completado |
| **UI-TYPOGRAPHY-BRAND-ALIGN-01** | Alinear tipografía: prose h2/h3 fontFamily + HowItWorks H3 serif | `a62b440` | ✅ Completado |
| **UI-CARDS-BRAND-ALIGN-01** | Alinear tarjetas: orange→muted, shadow-xl→sm, progress bars→palette | `4781ad0` | ✅ Completado |
| **SEO-PILLAR-EXCEL-AUDIT-01** | Auditoría página pilar `/blog/plantilla-kakebo-excel` como activo SEO orgánico principal | — | ✅ Completado (2026-06-30) |
| **SEO-MAP-V1-AUDIT-01** | Mapa maestro SEO — inventario completo de URLs, clusters, prioridades y estado | — | ✅ Completado (2026-06-30) |
| **SEO-GEO-DEEP-AUDIT-01** | Auditoría profunda SEO técnico, semántico y GEO — 32 hallazgos | — | ✅ Completado (2026-06-30) |
| **SEO-ROADMAP-V1-01** | Roadmap SEO/GEO priorizado — 26 tareas en 7 bloques | — | ✅ Completado (2026-06-30) |
| **SEO-DATA-PRIORITY-01** | Snapshot GSC (Last 3m) + priorización por datos reales | — | ✅ Completado (2026-06-30) |
| **SEO-KAKEBO-ONLINE-CANIB-01** | Auditoría canibalización EN/ES kakebo-online-gratis — CONFIRMADA + scope ampliado todas las URLs (2026-07-03) | — | ✅ Completado (2026-07-03) |
| **SEO-KAKEBO-ONLINE-CANIB-FIX-01** | noindex en EN kakebo-online-gratis + exclusión de sitemap | `cba3fd0` | ✅ Completado (2026-06-30) |
| **SEO-GEO-TERMINOLOGY-01** | Glosario canónico SEO/GEO — 14 términos definidos | `168165f` | ✅ Completado (2026-06-30) |
| **SEO-GEO-ENTITY-DEFINITION-01** | Definiciones factuales citables — 14 entidades, bloques reutilizables | `96183cc` | ✅ Completado (2026-06-30) |
| **SEO-SCHEMA-HOME-01** | Schema Organization + WebSite + SoftwareApplication en Home | `16653ca` | ✅ Completado (2026-06-30) |
| **SEO-TECHNICAL-DATEMODIFIED-01** | Soporte `updatedDate` en frontmatter + `dateModified` real en JSON-LD y sitemap | `c77d160` | ✅ Completado (2026-07-01) |
| **SEO-SCHEMA-AHORRO-SYNC-01** | Schema calculadora-ahorro sincronizado con glosario canónico y GEO | `3141e9b` | ✅ Completado (2026-07-01) |
| **SEO-INTERNAL-LINKING-V1-01** | Auditoría y plan de enlazado interno — 17 URLs, 8 clusters, 4 fases | `af075f0` | ✅ Completado (2026-07-01) |
| **SEO-GEO-HOME-ENTITY-COPY-01** | Home optimizada como fuente de entidad SEO/GEO — 6 bloques de copy | `f2b1f51` | ✅ Completado (2026-07-01) |
| **SEO-GEO-APP-ENTITY-COPY-01** | Dashboard /app — terminología canónica en bloque SEO y onboarding | `1a4eff7` | ✅ Completado (2026-07-01) |
| **SEO-GEO-TOOL-AHORRO-COPY-01** | /herramientas/calculadora-ahorro — copy alineado con glosario GEO | `aa2432a` | ✅ Completado (2026-07-01) |
| **SEO-GEO-TOOL-INFLACION-COPY-01** | /herramientas/calculadora-inflacion — schema + cta copy alineados | `09f08a8` | ✅ Completado (2026-07-01) |
| **SEO-GEO-TOOL-503020-COPY-01** | /herramientas/regla-50-30-20 — schema + copy Kakebo AI canónico | `ac80f84` | ✅ Completado (2026-07-01) |
| **SEO-GEO-PILLAR-METODO-KAKEBO-GUIA-01** | /blog/metodo-kakebo-guia-definitiva — definición GEO, categorías canónicas, excerpt sin promesa | `aabc03a` | ✅ Completado (2026-07-01) |
| **SEO-GEO-PILLAR-KAKEBO-ONLINE-GRATIS-ES-01** | /blog/kakebo-online-gratis ES — definición GEO, sin superlativos, MetodoKakebo.com | — | ✅ Completado (2026-07-01) |

**Restricciones activas:**
- No abrir nuevo contenido SEO sin datos de Search Console (SEO-DATA-PRIORITY-01 primero).
- No hacer más cambios frontend amplios sin incidencia concreta.
- No tocar herramienta interna/dashboard.
- No tocar routing/i18n/hreflang/sitemap/middleware.
- No añadir imágenes ni avatares externos.

> Ver historial detallado de sprints SEO y decisiones arquitectónicas en `docs/PROJECT_STATUS.md`.

---

## Política SEO de Idiomas

**Fecha de decisión:** 2026-06-22  
**ID tarea de referencia:** DOC-I18N-01

### Regla activa

**El idioma principal y único activo para la producción de nuevo contenido editorial SEO del blog es el español.**

### Detalle de la política

| Ámbito | Regla |
|---|---|
| Nuevos artículos de blog | Solo se crean en español (`.es.mdx`) |
| Versiones `.en.mdx` nuevas | **No se crean** salvo orden explícita del usuario en la tarea |
| Contenido inglés existente | Se conserva como contenido legacy — no se elimina |
| Contenido inglés legacy | No se amplía, no se prioriza, no se indexa manualmente |
| Roadmap SEO activo | Opera exclusivamente en español |

### Contenido inglés legacy

Los siguientes archivos `.en.mdx` existen como contenido heredado y quedan fuera del roadmap SEO activo. No se tocan salvo instrucción explícita:

```
src/content/blog/ahorro-pareja.en.mdx
src/content/blog/alternativas-a-app-bancarias.en.mdx
src/content/blog/como-ahorrar-dinero-cada-mes.en.mdx
src/content/blog/como-hacer-un-presupuesto-personal.en.mdx   ← creado en SEO-PILAR-01, queda como legacy
src/content/blog/eliminar-gastos-hormiga.en.mdx
src/content/blog/kakebo-online-gratis.en.mdx
src/content/blog/kakebo-online-guia-completa.en.mdx
src/content/blog/kakebo-sueldo-minimo.en.mdx
src/content/blog/kakebo-vs-ynab.en.mdx
src/content/blog/libro-kakebo-pdf.en.mdx
src/content/blog/metodo-kakebo-guia-definitiva.en.mdx
src/content/blog/metodo-kakebo-para-autonomos.en.mdx
src/content/blog/peligros-apps-ahorro-automatico.en.mdx
src/content/blog/plantilla-kakebo-excel.en.mdx
src/content/blog/regla-30-dias.en.mdx
```

### Nota para agentes

Cualquier agente (Claude Code, Codex, u otro) que ejecute una tarea de creación de contenido editorial **debe crear únicamente el archivo `.es.mdx`**. Si la tarea no indica explícitamente que se requiere la versión inglesa, no se crea.

---

## Decisiones Arquitectónicas

### DA-09 — Prioridad de crecimiento temático

**Orden aprobado:**
1. Cluster 1 — Metodología Kakebo
2. Cluster 4 — Comparativas
3. Cluster 2 — Kakebo Digital y Herramientas
4. Cluster 3 — Educación Financiera General

**Justificación estratégica:**
El orden establecido busca consolidar la autoridad temática (Topical Authority) en el "Core Topic" (Método Kakebo) para establecer una base sólida de E-E-A-T frente a los motores de búsqueda antes de atacar verticales más genéricas y competidas. Abordar primero el Cluster 1 asegura el dominio del nicho, mientras que el Cluster 4 aprovecha esa autoridad para captar tráfico con intención comercial o comparativa (BOFU).

## Entidades y subtemas pendientes

**Entidades:**
* Motoko Hani
* Japón
* Minimalismo
* Ikigai
* Fondo de emergencia
* Libertad financiera
* Tasa de ahorro
* Gasto consciente
* Gratificación diferida
* Sistema de sobres
* Presupuesto base cero

**Subtemas:**
* Historia del Kakebo
* Filosofía del Kakebo
* Gestión de deuda
* Educación financiera infantil
* Gestión de ingresos irregulares
* Formatos físicos del método
* Categorización avanzada de gastos

## Candidatos para Content Sprint 1

*(Sujetos a revisión futura)*

**P0:**
* Origen del método Kakebo
* Las 4 categorías de gasto del Kakebo
* Kakebo para salir de deudas
* Las 4 preguntas antes de comprar

**P1:**
* Kakebo vs Sistema de Sobres
* Qué hacer si fallas con tu Kakebo
* Kakebo para niños

**P2:**
* Kakebo vs Regla 50/30/20
* Kakebo y Minimalismo
* Mejores agendas Kakebo físicas

> **Nota:** Los candidatos de Content Sprint 1 no constituyen un backlog definitivo. Su ejecución se revisará tras completar SEO-2.2, SEO-2.3 y SEO-2.4 y tras analizar datos adicionales de Search Console.

---

## Cluster SEO — Presupuesto Personal

**Estado:** En desarrollo activo  
**Decisión estratégica (2026-06-22):** Cluster prioritario siguiente tras consolidar el cluster Kakebo Core. Actúa como puente temático hacia autoridad en finanzas personales generales y da contenido hub a las calculadoras existentes (50/30/20 y ahorro).

### Artículos del cluster — Estado

| ID | Keyword principal | Slug | Prioridad | Estado |
|---|---|---|---|---|
| SEO-PILAR-01 | `como hacer un presupuesto personal` | `como-hacer-un-presupuesto-personal` | P1 — Pilar | ✅ Publicado 2026-06-22 |
| SEO-02 | `fondo de emergencia` | — | P1 | Pendiente |
| SEO-03 | `gastos fijos y variables` | — | P1 | Pendiente |
| SEO-04 | `como organizar finanzas personales` | — | P1 | Pendiente |
| SEO-05 | `regla 50 30 20` | — | P1 | Pendiente |
| SEO-06 | `presupuesto familiar mensual` | — | P2 | Pendiente |
| SEO-07 | `metodo de los sobres` | — | P2 | Pendiente |
| SEO-08 | `cuanto ahorrar al mes` | — | P2 | Pendiente |
| SEO-09 | `presupuesto base cero` | — | P3 | Pendiente |
| SEO-10 | `presupuesto ingresos irregulares` | — | P3 | Pendiente |

### SEO-PILAR-01 — Detalle técnico

**Fecha de publicación:** 2026-06-22  
**Archivos creados:**
- `src/content/blog/como-hacer-un-presupuesto-personal.es.mdx`
- `src/content/blog/como-hacer-un-presupuesto-personal.en.mdx`
- `public/images/blog/como-hacer-un-presupuesto-personal.webp`

**URLs:**
- ES: `https://www.metodokakebo.com/blog/como-hacer-un-presupuesto-personal`
- EN: `https://www.metodokakebo.com/en/blog/como-hacer-un-presupuesto-personal`

**SEO configurado:**
- Meta title, description, Open Graph, Twitter Card vía frontmatter
- JSON-LD: BlogPosting + BreadcrumbList + FAQPage (7 preguntas)
- hreflang ES/EN/x-default
- Canonical URL por locale
- Sitemap: incluido automáticamente vía `getBlogPosts()`

**Herramientas integradas:** calculadora-ahorro (×2), regla-50-30-20 (×1)  
**Enlaces internos:** 9 artículos del blog + 2 herramientas  
**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Tests:** ✅ 506/506 passing
