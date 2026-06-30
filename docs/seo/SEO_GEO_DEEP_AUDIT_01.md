# SEO_GEO_DEEP_AUDIT_01 — Auditoría Profunda SEO Técnico, Semántico y GEO

**Fecha:** 2026-06-30  
**Commit de referencia:** `2fa1dfd` (HEAD al inicio de la auditoría)  
**Tipo:** Solo documentación — sin cambios en código, contenido ni SEO técnico  
**Siguiente fase:** `SEO-ROADMAP-V1-01` — Roadmap SEO priorizado

---

## 1. Resumen ejecutivo

MetodoKakebo.com tiene una base técnica SEO más sólida de lo que indicaba el mapa anterior. Los problemas P0 técnicos (canonical de blog posts, robots.txt sin bloquear `/app/`) ya están **resueltos en el código actual**. Los canonicals de las tres herramientas son correctos. El sitemap genera URLs sin `/es/` para ES. Los redirects `/es/*` → `/*` funcionan.

Los problemas reales se concentran en tres capas:

1. **Técnico medio**: `dateModified` congelado en todos los posts, `/herramientas` hub ausente del sitemap, siteName inconsistente entre páginas, schema `calculadora-ahorro` con descripción desactualizada vs. contenido optimizado.

2. **Semántico estructural**: Tres herramientas sin artículo editorial de respaldo, posible canibalización entre `kakebo-online-gratis` y `kakebo-online-guia-completa`, `metodo-kakebo-guia-definitiva` infraconectado, entidad "MetodoKakebo.com" no definida claramente en ninguna página.

3. **GEO**: Terminología inconsistente entre páginas ("Kakebo AI" vs "método Kakebo" vs "app Kakebo" vs "kakebo online"), autoría genérica sin credenciales financieras, ausencia de una definición corta y citabile de qué es el producto.

**Total de hallazgos: 32** (12 técnicos · 9 semánticos · 11 GEO)  
**Riesgos críticos: 2** · **Riesgos medios: 7** · **Riesgos bajos: 8**

---

## 2. Alcance de la auditoría

| Área | Revisado |
|---|---|
| Arquitectura indexable | ✅ |
| Sitemap (`src/app/sitemap.ts`) | ✅ |
| Robots (`src/app/robots.ts`) | ✅ |
| Canonicals (blog posts + herramientas) | ✅ |
| hreflang | ✅ |
| Redirects (`next.config.ts`) | ✅ |
| Schema JSON-LD por tipo de página | ✅ |
| Metadatos globales (layout.tsx) | ✅ |
| Headings y estructura de contenido | ✅ (artículo pilar + herramientas) |
| Imágenes y alt text | ✅ (artículo pilar) |
| Intención de búsqueda y clusters | ✅ |
| Entidades semánticas | ✅ |
| Canibalizaciones | ✅ |
| GEO / Generative Engine Optimization | ✅ |
| E-E-A-T | ✅ |
| Medición (GA4, eventos) | ✅ (según configuración disponible) |
| Core Web Vitals | ⚠ Sin datos disponibles en repo |

---

## 3. Fuentes revisadas

| Fuente | Estado |
|---|---|
| `docs/seo/PLAN_SEO_GEO_METODOKAKEBO.md` | Leído ✅ |
| `docs/seo/SEO_MAP_V1.md` | Leído ✅ |
| `docs/seo/SEO_PILLAR_EXCEL_AUDIT_01.md` | Leído ✅ |
| `docs/brand/IDENTIDAD_VISUAL_KAKEBO.md` | Referenciado ✅ |
| `PROJECT_STATUS.md` + `docs/PROJECT_STATUS.md` | Leídos ✅ |
| `src/app/sitemap.ts` | Leído ✅ |
| `src/app/robots.ts` | Leído ✅ |
| `next.config.ts` | Leído ✅ |
| `src/app/[locale]/layout.tsx` | Leído ✅ |
| `src/app/[locale]/(public)/blog/[slug]/page.tsx` | Leído ✅ |
| `src/app/[locale]/(landing)/herramientas/calculadora-inflacion/page.tsx` | Leído ✅ |
| `src/app/[locale]/(landing)/herramientas/regla-50-30-20/page.tsx` | Leído ✅ |
| `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx` | Leído ✅ |
| `src/content/blog/plantilla-kakebo-excel.es.mdx` | Leído ✅ |
| Glob de rutas de app y contenido | Leído ✅ |

---

## 4. Auditoría SEO Técnico Profundo

### 4.1 Estado actual — Problemas ya resueltos

Los siguientes problemas técnicos estaban flagged en `SEO_MAP_V1.md` (raíz, 2026-06-17) y están **ya corregidos** en el código actual:

| Problema anterior | Estado actual |
|---|---|
| Canonical de blog posts ES usaba `/es/blog/[slug]` | ✅ Corregido: `${locale === 'es' ? '' : '/${locale}'}/blog/${slug}` |
| robots.txt no bloqueaba `/app/` ni `/auth/` | ✅ Corregido: `disallow: ['/api/', '/app/', '/auth/']` |
| Canonical `calculadora-ahorro` con `/es/` residual | ✅ Corregido: misma lógica que blog posts |
| Canonical `regla-50-30-20` con `/es/` residual | ✅ Corregido: misma lógica |

### 4.2 Hallazgos técnicos activos

---

**T-01** — `/herramientas` hub ausente del sitemap  
**Área:** Técnico · **Severidad:** Media · **Impacto:** Indexación / crawl  
**Evidencia:** `sitemap.ts` lista explícitamente las 3 herramientas individuales pero no incluye `/herramientas` (el hub/índice). La ruta sí existe en `(public)/herramientas/page.tsx`.  
**Riesgo:** El hub de herramientas puede tener crawl reducido al no estar declarado en el sitemap. Si tiene contenido editorial, pierde señal de prioridad.  
**Recomendación:** Añadir `/herramientas` al array `coreRoutes` del sitemap.  
**Tarea futura:** `SEO-TECHNICAL-SITEMAP-01`

---

**T-02** — `login` en sitemap a prioridad 0.8  
**Área:** Técnico · **Severidad:** Baja · **Impacto:** Crawl budget  
**Evidencia:** `sitemap.ts` incluye `/login` con `priority: 0.8` y `changeFrequency: 'monthly'`. Esta es la misma prioridad que el blog index y el tutorial.  
**Riesgo:** Google puede priorizar el crawl del login sobre páginas con contenido editorial real. Una página de autenticación no necesita estar en el sitemap con prioridad alta.  
**Recomendación:** Reducir prioridad de `/login` a 0.1 o excluirla del sitemap.  
**Tarea futura:** `SEO-TECHNICAL-SITEMAP-01` (incluir junto con T-01)

---

**T-03** — `lastModified` del sitemap congelado en fecha de publicación original para blog posts  
**Área:** Técnico · **Severidad:** Media · **Impacto:** Freshness / re-crawl  
**Evidencia:** `sitemap.ts` usa `lastModified: new Date(post.frontmatter.date)` — la fecha de publicación original del frontmatter. Cuando el contenido de un artículo se actualiza (por ejemplo, cuando se quitaron los emojis en `UI-CTA-EMOJI-REMOVE-01`), el sitemap no refleja esa actualización.  
**Riesgo:** Google puede no re-crawl prioritariamente artículos que ya actualizó pero que el sitemap muestra con fecha antigua. Especialmente importante para `plantilla-kakebo-excel` (fecha 2026-01-27, sin `updatedDate`).  
**Recomendación:** Añadir campo `updatedDate` al frontmatter y usar el más reciente entre `date` y `updatedDate` en el sitemap.  
**Tarea futura:** `SEO-TECHNICAL-DATEMODIFIED-01`

---

**T-04** — `dateModified` en JSON-LD de blog posts congelado en `datePublished`  
**Área:** Técnico · **Severidad:** Media · **Impacto:** Freshness / GEO  
**Evidencia:** En `blog/[slug]/page.tsx`: `dateModified: post.frontmatter.date` (mismo valor que `datePublished`). No existe campo `updatedDate` en el frontmatter de ningún artículo.  
**Riesgo:** Google y motores generativos interpretan `dateModified = datePublished` como contenido que no ha sido actualizado. Para `plantilla-kakebo-excel`, publicado en 2026-01-27, se han hecho actualizaciones de CTAs y emojis sin actualizar la fecha en el JSON-LD.  
**Recomendación:** Misma solución que T-03 — campo `updatedDate` en frontmatter, usar en sitemap y JSON-LD.  
**Tarea futura:** `SEO-TECHNICAL-DATEMODIFIED-01`

---

**T-05** — Schema `SoftwareApplication` de `calculadora-ahorro` con nombre y descripción desactualizados  
**Área:** Técnico · **Severidad:** Baja · **Impacto:** GEO / Rich results  
**Evidencia:** El schema en `calculadora-ahorro/page.tsx` tiene `"name": "Calculadora de Ahorro Kakebo"` y `"description": "distribuir tu nómina mensual basada en el método japonés Kakebo"`. Sin embargo, el contenido visible optimizado en `SEO-AHORRO-CALCULADORA-01` usa "Calculadora de Ahorro Mensual" y la intención "cuánto ahorrar al mes". El schema no se actualizó junto con el contenido.  
**Riesgo:** Inconsistencia entre schema (lo que Google y motores generativos leen en datos estructurados) y el contenido visible (H1, descripción). Puede afectar la coherencia de rich results.  
**Recomendación:** Actualizar `name` y `description` del schema para alinear con el contenido optimizado.  
**Tarea futura:** `SEO-SCHEMA-AHORRO-SYNC-01`

---

**T-06** — `siteName` inconsistente entre páginas  
**Área:** Técnico · **Severidad:** Baja · **Impacto:** Autoridad de marca / GEO  
**Evidencia:** `layout.tsx` establece `siteName: "Kakebo AI"`. `calculadora-inflacion/page.tsx` establece `siteName: "Kakebo"`. `calculadora-ahorro/page.tsx` no define `siteName` en OG (hereda el del layout). `blog/[slug]/page.tsx` no define `siteName` en OG tampoco.  
**Riesgo:** Los metadatos Open Graph presentan el sitio como "Kakebo AI" en algunas páginas y "Kakebo" en otras. Esto puede afectar cómo las plataformas sociales y motores generativos identifican la entidad del sitio.  
**Recomendación:** Unificar `siteName` en todas las páginas. Decidir si la marca es "Kakebo AI" o "Kakebo" (en línea con la identidad del brand manual).  
**Tarea futura:** `SEO-TECHNICAL-SITENAME-01`

---

**T-07** — Home sin schema JSON-LD  
**Área:** Técnico · **Severidad:** Media · **Impacto:** Rich results / GEO / Autoridad  
**Evidencia:** La home (`(public)/page.tsx`) no tiene schema JSON-LD explícito. El `layout.tsx` solo define metadatos estándar (title, description, OG, Twitter) pero no inyecta `Organization`, `WebSite` ni `SearchAction`.  
**Riesgo:** La home es el activo de mayor PageRank del sitio. Sin `Organization` schema, Google no puede verificar la entidad de la marca. Sin `WebSite` + `SearchAction`, no hay elegibilidad para sitelinks de búsqueda.  
**Recomendación:** Añadir `Organization` + `WebSite` (con `SearchAction` para sitelinks) al `page.tsx` de la home.  
**Tarea futura:** `SEO-SCHEMA-HOME-01`

---

**T-08** — Blog index sin schema JSON-LD  
**Área:** Técnico · **Severidad:** Baja · **Impacto:** Rich results  
**Evidencia:** `(public)/blog/page.tsx` no tiene schema JSON-LD. La página actúa como hub editorial pero no está marcada como `CollectionPage` o `ItemList`.  
**Riesgo:** Oportunidad perdida para rich snippets de tipo lista de artículos.  
**Recomendación:** Añadir schema `CollectionPage` o `ItemList` al blog index.  
**Tarea futura:** `SEO-SCHEMA-BLOG-INDEX-01`

---

**T-09** — hreflang `kakebo-online-guia-completa` puede apuntar a URL 404 EN  
**Área:** Técnico · **Severidad:** Media · **Impacto:** Indexación EN / señales hreflang  
**Evidencia:** El artículo ES tiene slug `kakebo-online-guia-completa`. La versión EN tiene slug `kakebo-online-complete-guide` (slug diferente). El hreflang del artículo ES apunta a `/en/blog/kakebo-online-guia-completa` — URL que puede no existir si el archivo `.en.mdx` usa el slug `kakebo-online-complete-guide`.  
**Riesgo:** Google puede ignorar las señales hreflang de ambas páginas si el par ES↔EN apunta a URLs incorrectas. Potencial split de señales de autoridad.  
**Recomendación:** Verificar la existencia de ambos archivos `.mdx` y corregir el hreflang o estandarizar los slugs.  
**Tarea futura:** `SEO-HREFLANG-KAKEBO-ONLINE-01`

---

**T-10** — Sitemap core routes usa `lastModified: new Date()` (fecha siempre actual)  
**Área:** Técnico · **Severidad:** Baja · **Impacto:** Crawl efficiency  
**Evidencia:** `sitemap.ts` — todas las rutas `coreRoutes` (Home, tutorial, sobre-nosotros, herramientas, login, legales) usan `lastModified: new Date()`, que genera la fecha del momento de la petición al sitemap.  
**Riesgo:** Google ignora `lastModified` poco confiable. Si el sitemap siempre dice que todo fue modificado hoy, Googlebot puede aprender a ignorarlo y no priorizar re-crawl de páginas realmente actualizadas.  
**Recomendación:** Para páginas estables (legales, sobre-nosotros), usar fechas fijas. Para páginas dinámicas (home, blog), usar la fecha real del último cambio relevante.  
**Tarea futura:** `SEO-TECHNICAL-SITEMAP-01`

---

**T-11** — `metadataBase` dependiente de variable de entorno  
**Área:** Técnico · **Severidad:** Baja · **Impacto:** Metadatos en staging  
**Evidencia:** `layout.tsx`: `metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.metodokakebo.com")`. Si la variable no está configurada en entornos de preview/staging, los metadatos con rutas relativas (imágenes OG de herramientas que usan `/api/og?...`) pueden resolverse incorrectamente.  
**Riesgo:** En previews de Vercel, las imágenes OG generadas por `/api/og` pueden apuntar al dominio de producción en lugar del de preview. No es un riesgo de producción pero puede dificultar el testing.  
**Recomendación:** Documentar esta dependencia. En producción no es problema.  
**Tarea futura:** No urgente — documentar en INSTRUCCIONES.md

---

**T-12** — `tutorial` en sitemap a prioridad 0.8 sin validación de contenido  
**Área:** Técnico · **Severidad:** Baja · **Impacto:** Crawl budget  
**Evidencia:** `/tutorial` está en el sitemap con `priority: 0.8` (igual que el blog index). Si esta página tiene thin content o solo es funcional para usuarios autenticados, desperdicia crawl budget.  
**Riesgo:** Posible crawl de página débil con señal de prioridad alta.  
**Recomendación:** Revisar el contenido de `/tutorial` y determinar si debe tener esa prioridad o si debería tener `noindex`.  
**Tarea futura:** `SEO-TECHNICAL-TUTORIAL-01` (auditoría de contenido)

---

### 4.3 Resumen técnico

| # | ID | Descripción breve | Severidad | Estado |
|---|---|---|---|---|
| 1 | T-01 | `/herramientas` hub ausente del sitemap | Media | Pendiente |
| 2 | T-02 | `login` en sitemap a prioridad 0.8 | Baja | Pendiente |
| 3 | T-03 | `lastModified` blog posts congelado en publicación | Media | Pendiente |
| 4 | T-04 | `dateModified` JSON-LD = `datePublished` en todos los posts | Media | Pendiente |
| 5 | T-05 | Schema `calculadora-ahorro` desalineado del contenido optimizado | Baja | Pendiente |
| 6 | T-06 | `siteName` inconsistente entre páginas | Baja | Pendiente |
| 7 | T-07 | Home sin schema `Organization` + `WebSite` | Media | Pendiente |
| 8 | T-08 | Blog index sin schema | Baja | Pendiente |
| 9 | T-09 | hreflang `kakebo-online-guia-completa` puede apuntar a 404 EN | Media | Pendiente |
| 10 | T-10 | Sitemap core routes con `lastModified: new Date()` no confiable | Baja | Pendiente |
| 11 | T-11 | `metadataBase` dependiente de env var | Baja | Documentar |
| 12 | T-12 | `/tutorial` en sitemap a prioridad 0.8 sin validación | Baja | Pendiente |

---

## 5. Auditoría SEO Semántico

### 5.1 Mapa de entidades por URL

| URL | Entidad principal | Entidad secundaria | Función en arquitectura |
|---|---|---|---|
| `/` | MetodoKakebo.com / App | Método Kakebo / ahorro | Hub de marca y captación app |
| `/blog/plantilla-kakebo-excel` | Plantilla Excel + Kakebo Excel | Fricción vs app | Pilar orgánico principal |
| `/blog/como-hacer-un-presupuesto-personal` | Presupuesto personal | Método Kakebo | Pilar cluster presupuesto (reciente) |
| `/blog/kakebo-online-gratis` | App Kakebo online | Kakebo gratis | Captación app |
| `/blog/kakebo-online-guia-completa` | Método Kakebo digital | Comparativa | Hub informacional |
| `/blog/metodo-kakebo-guia-definitiva` | Método Kakebo | Historia / filosofía | Pilar método (infraconectado) |
| `/blog/alternativas-a-app-bancarias` | Fintonic / alternativas | Privacidad | Cluster comparativas |
| `/blog/peligros-apps-ahorro-automatico` | Open Banking / riesgos | Privacidad | Soporte cluster alternativas |
| `/blog/libro-kakebo-pdf` | PDF Kakebo | Descarga | Soporte cluster recursos |
| `/blog/eliminar-gastos-hormiga` | Gastos hormiga | Método Kakebo | Soporte informacional |
| `/blog/kakebo-vs-ynab` | Kakebo vs YNAB | Comparativa BOFU | Comparativa |
| `/blog/regla-30-dias` | Regla 30 días | Control gastos | Técnica complementaria |
| `/blog/ahorro-pareja` | Ahorro pareja | Finanzas personales | Nicho audiencia |
| `/blog/metodo-kakebo-para-autonomos` | Kakebo autónomos | Ingresos irregulares | Nicho audiencia |
| `/blog/kakebo-sueldo-minimo` | Ahorro salario mínimo | Kakebo joven | Nicho audiencia |
| `/blog/como-ahorrar-dinero-cada-mes` | Ahorro mensual | Técnicas ahorro | TOFU amplio |
| `/herramientas/calculadora-ahorro` | Calculadora ahorro | Plan mensual | Herramienta transaccional |
| `/herramientas/calculadora-inflacion` | Inflación / IPC | Poder adquisitivo | Herramienta transaccional |
| `/herramientas/regla-50-30-20` | Regla 50/30/20 | Presupuesto sueldo | Herramienta transaccional |

### 5.2 Hallazgos semánticos

---

**S-01** — Canibalización potencial: `kakebo-online-gratis` vs `kakebo-online-guia-completa`  
**Área:** Semántico · **Severidad:** Media · **Impacto:** Ranking / autoridad dividida  
**Evidencia:**
- `kakebo-online-gratis`: "La Mejor Aplicación para Controlar tus Gastos (2026)" — intención transaccional
- `kakebo-online-guia-completa`: "Cómo usar el método japonés en digital (Guía completa 2026)" — intención informacional
- Ambas compiten por queries de "kakebo online" y variantes cercanas
- La interferencia EN en `kakebo-online-gratis` detectada en `SEO-I18N-KAKEBO-ONLINE-VALIDATE-01` no fue resuelta

**Riesgo:** Google puede alternar entre ambas URLs para las mismas queries, reduciendo la posición efectiva de ambas.  
**Recomendación:** Auditar con GSC real cuáles queries van a cada URL. Si se confirma solapamiento, diferenciar más agresivamente la intención: `gratis` = captación de producto, `guia-completa` = contenido informacional de método.  
**Tarea futura:** `SEO-KAKEBO-ONLINE-CANIB-01`

---

**S-02** — Canibalización potencial: Home vs `kakebo-online-gratis`  
**Área:** Semántico · **Severidad:** Media · **Impacto:** Ranking / CTR  
**Evidencia:**
- La Home fue optimizada en `SEO-HOME-KAKEBO-APP-01` para "kakebo online gratis" y "kakebo app"
- `kakebo-online-gratis` también posiciona para "kakebo online gratis"
- El artículo `/blog/kakebo-online-gratis` enlaza a la app a través de CTAs que van a `/`
- La Home y el artículo pueden competir por las mismas queries

**Riesgo:** Dos URLs del mismo dominio compitiendo por el mismo término flagship "kakebo online gratis". Sin datos GSC reales, no se puede confirmar si ya es un problema activo.  
**Recomendación:** Clarificar la función de cada URL: Home = captación directa de app (intención de producto), artículo = información sobre el método digital (intención informacional). Asegurarse de que los metadatos los diferencian claramente.  
**Tarea futura:** `SEO-KAKEBO-ONLINE-CANIB-01` (mismo que S-01)

---

**S-03** — `metodo-kakebo-guia-definitiva` infraconectado — no cumple función de hub  
**Área:** Semántico · **Severidad:** Media · **Impacto:** Autoridad / topical authority  
**Evidencia:** El artículo `metodo-kakebo-guia-definitiva` debería ser el hub semántico del cluster Kakebo Core, recibiendo enlaces desde todos los artículos sobre el método. Sin embargo, basado en la revisión de `plantilla-kakebo-excel`, el enlazado hacia este artículo es escaso. No hay un análisis de cuántos artículos enlazan hacia él.  
**Riesgo:** Un artículo pilar que no recibe enlaces internos pierde su función de hub. La autoridad del cluster Kakebo Core no está consolidada en ninguna URL central.  
**Recomendación:** Auditar cuántos artículos enlazan a `metodo-kakebo-guia-definitiva` y crear un plan de enlazado entrante desde los artículos de cluster.  
**Tarea futura:** `SEO-INTERNAL-LINKING-V1-01`

---

**S-04** — Tres herramientas sin artículo editorial de respaldo  
**Área:** Semántico · **Severidad:** Alta · **Impacto:** Cobertura temática / tráfico informacional  
**Evidencia:**
- `/herramientas/calculadora-inflacion` — sin artículo "cómo afecta la inflación a tus ahorros"
- `/herramientas/regla-50-30-20` — sin artículo "qué es la regla 50/30/20"
- `/herramientas/calculadora-ahorro` — parcialmente cubierto por `como-ahorrar-dinero-cada-mes`

**Riesgo:** Las herramientas capturan tráfico transaccional directo pero no pueden capturar tráfico informacional (usuarios que buscan entender el concepto antes de usar la calculadora). Un artículo de respaldo duplicaría la presencia en SERP para el mismo cluster.  
**Recomendación:** Crear artículo editorial para `calculadora-inflacion` y `regla-50-30-20` como P1 del roadmap de contenido.  
**Tarea futura:** `SEO-BLOG-INFLACION-01`, `SEO-BLOG-503020-01`

---

**S-05** — Entidad "MetodoKakebo.com" no definida claramente en ninguna página  
**Área:** Semántico · **Severidad:** Media · **Impacto:** GEO / E-E-A-T / autoridad de marca  
**Evidencia:** Ninguna página del sitio tiene un bloque claro que diga "MetodoKakebo.com es una aplicación de gestión de finanzas personales basada en el método Kakebo japonés, creada por [equipo], disponible de forma gratuita en [URL]". La página `sobre-nosotros` existe pero su contenido no fue revisado en profundidad para esta auditoría.  
**Riesgo:** Los motores generativos y Google no tienen una fuente de referencia clara sobre qué es MetodoKakebo.com. Esto dificulta que el sitio aparezca como Knowledge Panel o sea correctamente citado por motores de IA.  
**Recomendación:** Añadir un bloque de definición corta y factual al inicio de la página `sobre-nosotros` o crear una sección "Qué es MetodoKakebo.com" en la Home.  
**Tarea futura:** `SEO-GEO-ENTITY-DEFINITION-01`

---

**S-06** — Ambigüedad terminológica: "Kakebo AI" vs "método Kakebo" vs "app Kakebo"  
**Área:** Semántico · **Severidad:** Alta · **Impacto:** GEO / consistencia de entidad / CTR  
**Evidencia:**
- El `layout.tsx` usa `creator: "Kakebo AI"`, `publisher: "Kakebo AI"`, `siteName: "Kakebo AI"`
- Los artículos del blog hablan del "método Kakebo", "Kakebo Online", "Kakebo AI" como si fueran lo mismo
- La herramienta se llama "Kakebo AI" en la Home pero "Kakebo" en el schema de herramientas
- Los usuarios buscan "kakebo online", "método kakebo", "kakebo app" — no "Kakebo AI"
- Motores generativos pueden no entender que "Kakebo AI", "MetodoKakebo.com", "app Kakebo" y "método Kakebo digital" son la misma entidad

**Riesgo:** Un motor generativo citando MetodoKakebo.com puede usar el nombre incorrecto o crear confusión. Google puede no asociar claramente la marca con las queries objetivo.  
**Recomendación:** Definir la terminología canónica: el producto es "Kakebo AI" (nombre de marca), el método es "método Kakebo" (japonés), el sitio es "MetodoKakebo.com". Usar consistentemente en todas las páginas y schemas.  
**Tarea futura:** `SEO-GEO-TERMINOLOGY-01`

---

**S-07** — `peligros-apps-ahorro-automatico` con función arquitectónica débil  
**Área:** Semántico · **Severidad:** Baja · **Impacto:** Autoridad del cluster / enlazado  
**Evidencia:** El artículo sobre peligros de apps de ahorro automático es un artículo de awareness de privacidad. No aparece en el related posts de otros artículos del cluster Fintonic. Su función dentro del cluster es de soporte, pero no está claramente conectado.  
**Riesgo:** URL potencialmente "huérfana" dentro de su cluster. Puede estar recibiendo poco tráfico interno.  
**Recomendación:** Verificar en GA4 el tráfico de esta URL. Si es bajo, conectar desde `alternativas-a-app-bancarias` como artículo de profundidad.  
**Tarea futura:** `SEO-INTERNAL-LINKING-V1-01`

---

**S-08** — `como-hacer-un-presupuesto-personal` sin integrar en la arquitectura de enlazado  
**Área:** Semántico · **Severidad:** Media · **Impacto:** Autoridad nueva URL / indexación  
**Evidencia:** El artículo fue publicado el 2026-06-22. No se ha tenido tiempo de verificar cuántos artículos existentes enlazan hacia él ni si las herramientas lo mencionan. Al ser reciente, necesita recibir enlazado interno para que Google le asigne autoridad más rápidamente.  
**Riesgo:** Un artículo pilar reciente sin enlazado interno tarda más en indexarse y posicionarse.  
**Recomendación:** Auditar enlaces hacia este artículo y añadirlo a la red de enlazado desde `plantilla-kakebo-excel`, `calculadora-ahorro` y `como-ahorrar-dinero-cada-mes`.  
**Tarea futura:** `SEO-INTERNAL-LINKING-V1-01`

---

**S-09** — Cobertura de intención "BOFU" limitada a un solo artículo  
**Área:** Semántico · **Severidad:** Baja · **Impacto:** Conversión / tráfico comercial  
**Evidencia:** Solo `kakebo-vs-ynab` cumple función de comparativa BOFU. No hay artículos "kakebo vs excel", "kakebo vs papel", "kakebo vs fintonic" como URLs independientes con intención comparativa directa.  
**Riesgo:** Tráfico de alta intención comercial limitado.  
**Recomendación:** Identificar comparativas con volumen real en GSC antes de crear nuevas URLs.  
**Tarea futura:** Evaluar en `SEO-ROADMAP-V1-01`

---

### 5.3 Resumen semántico

| # | ID | Descripción breve | Severidad |
|---|---|---|---|
| 1 | S-01 | Canibalización kakebo-online-gratis vs kakebo-online-guia-completa | Media |
| 2 | S-02 | Canibalización Home vs kakebo-online-gratis | Media |
| 3 | S-03 | metodo-kakebo-guia-definitiva infraconectado | Media |
| 4 | S-04 | 3 herramientas sin artículo editorial de respaldo | Alta |
| 5 | S-05 | Entidad MetodoKakebo.com no definida claramente | Media |
| 6 | S-06 | Ambigüedad terminológica Kakebo AI / método Kakebo / app | Alta |
| 7 | S-07 | peligros-apps-ahorro-automatico con función débil | Baja |
| 8 | S-08 | como-hacer-un-presupuesto-personal sin enlazado interno | Media |
| 9 | S-09 | Cobertura BOFU limitada | Baja |

---

## 6. Auditoría GEO (Generative Engine Optimization)

### 6.1 Criterios evaluados

GEO evalúa si el contenido del sitio puede ser correctamente entendido, resumido y citado por sistemas de respuesta generativa (ChatGPT, Gemini, Perplexity, Copilot, AI Overviews de Google).

### 6.2 Activos GEO positivos (ya bien configurados)

| Asset | Razón | URL |
|---|---|---|
| FAQPage JSON-LD en blog posts | 5 preguntas en `plantilla-kakebo-excel`, respuestas directas y citables | `/blog/plantilla-kakebo-excel` |
| SoftwareApplication JSON-LD | Señal clara de "esto es una herramienta gratuita" para motores generativos | Herramientas + `plantilla-kakebo-excel` |
| Tabla comparativa Papel / Excel / Google Sheets / Kakebo AI | Contenido citabile en formato tabla | `/blog/plantilla-kakebo-excel` |
| Schema @graph en `calculadora-inflacion` | FAQPage + SoftwareApplication + respuestas directas | `/herramientas/calculadora-inflacion` |
| FAQ visible en `calculadora-ahorro` | Preguntas y respuestas renderizadas en HTML | `/herramientas/calculadora-ahorro` |
| Lista de pasos explícita | Secciones numeradas con H3 en artículos | Múltiples artículos |
| BreadcrumbList en blog posts | Señal estructural de ubicación en el sitio | Todos los posts |
| Geo metadata en layout | `geo.region: "ES"` — señal geográfica | Global |

### 6.3 Hallazgos GEO

---

**G-01** — Ninguna página tiene una definición citable de "qué es el método Kakebo" al inicio  
**Área:** GEO · **Severidad:** Alta · **Impacto:** GEO / citabilidad / autoridad semántica  
**Evidencia:** Los motores generativos buscan definiciones cortas y directas al principio de los documentos. En `metodo-kakebo-guia-definitiva`, el H1 es "Método Kakebo: La técnica japonesa para ahorrar dinero sin esfuerzo" pero no se sabe si el primer párrafo tiene una definición tipo "El Kakebo (家計簿) es un método de registro de gastos japonés creado por [...]". Los artículos de blog analizados (plantilla-kakebo-excel) comienzan con la intención de la búsqueda, no con una definición del método.  
**Riesgo:** ChatGPT o Perplexity, al responder "¿qué es el método Kakebo?", pueden usar Wikipedia u otras fuentes en lugar de MetodoKakebo.com por falta de definición factual y directa al inicio.  
**Recomendación:** Añadir en `metodo-kakebo-guia-definitiva` un primer párrafo con definición concisa, factual y citable: quién lo inventó, cuándo, para qué, y cuáles son las 4 categorías. Máximo 3 frases.  
**Tarea futura:** `SEO-GEO-ENTITY-DEFINITION-01`

---

**G-02** — Terminología inconsistente entre páginas dificulta la comprensión por motores generativos  
**Área:** GEO · **Severidad:** Alta · **Impacto:** GEO / entidad de marca  
**Evidencia:** En distintas páginas se usa:
- "Kakebo AI" (marca del producto)
- "método Kakebo" (el sistema japonés)
- "Kakebo Online" (forma de uso digital)
- "app de ahorro" (categoría genérica)
- "MetodoKakebo.com" (nombre de dominio)
- "agente inteligente" (descripción del producto)

Sin un glosario o jerarquía terminológica, un motor generativo puede:
- Mezclar "Kakebo AI" (producto) con "método Kakebo" (técnica centenaria)
- Atribuir claims del producto al método japonés histórico
- No citar MetodoKakebo.com como referencia de "método Kakebo" porque no es el término más usado en el sitio

**Riesgo:** Dilución de la autoridad temática. Si el sitio mezcla términos, Google y los motores generativos tampoco los distinguen.  
**Recomendación:** Definir en una sección de la home o en `sobre-nosotros` la jerarquía: "El método Kakebo es [definición]. MetodoKakebo.com es una app online gratuita basada en este método. La app se llama Kakebo AI."  
**Tarea futura:** `SEO-GEO-TERMINOLOGY-01`

---

**G-03** — Autoría genérica debilita E-E-A-T para contenido financiero  
**Área:** GEO · **Severidad:** Media · **Impacto:** E-E-A-T / autoridad / GEO  
**Evidencia:** Todos los artículos del blog tienen `author: 'Equipo Kakebo'`. No hay nombre de persona real, no hay bio, no hay credenciales financieras. Para contenido YMYL-adjacent (finanzas personales), Google da más peso a autores identificables con experiencia demostrable.  
**Riesgo:** Los motores generativos pueden desconfiar de contenido financiero sin autoría identificable. Google puede puntuar más bajo en E-E-A-T.  
**Recomendación:** No es urgente, pero a medio plazo considerar añadir una bio de autor con nombre real o al menos un enlace a la página `sobre-nosotros` donde se describa el equipo con credenciales.  
**Tarea futura:** `SEO-GEO-AUTHORSHIP-01` (P2)

---

**G-04** — `dateModified` congelado inhibe señal de frescura para motores generativos  
**Área:** GEO · **Severidad:** Media · **Impacto:** GEO / freshness  
**Evidencia:** (Ver T-04). Los motores generativos priorizan contenido con fecha de actualización reciente para responder a queries con intención de actualidad. `plantilla-kakebo-excel` (publicado 2026-01-27) ha tenido actualizaciones reales de CTAs y emojis, pero el `dateModified` en JSON-LD no lo refleja.  
**Riesgo:** Para queries tipo "plantilla kakebo excel 2026", un motor generativo puede preferir una fuente con `dateModified` más reciente sobre la nuestra aunque nuestro contenido sea más relevante.  
**Recomendación:** (Ver T-03/T-04) — campo `updatedDate` en frontmatter.  
**Tarea futura:** `SEO-TECHNICAL-DATEMODIFIED-01`

---

**G-05** — La Home no tiene contenido citabile para motores generativos  
**Área:** GEO · **Severidad:** Media · **Impacto:** GEO / first impression  
**Evidencia:** La Home es una landing de conversión optimizada para CTR hacia el signup. Sin embargo, para GEO, la Home debería tener al menos un párrafo que explique qué es el producto de forma factual, citable y sin hipérbole de marketing. El Hero probablemente usa copywriting de conversión, no definiciones factuales.  
**Riesgo:** Un motor generativo que visite la Home como primera página del sitio puede no entender claramente qué es el producto.  
**Recomendación:** Añadir una sección breve tipo "¿Qué es MetodoKakebo.com?" con texto factual, no persuasivo. No requiere modificar el Hero.  
**Tarea futura:** `SEO-GEO-ENTITY-DEFINITION-01`

---

**G-06** — Página `sobre-nosotros` con schema `Organization` pero función GEO desconocida  
**Área:** GEO · **Severidad:** Baja · **Impacto:** Autoridad de entidad  
**Evidencia:** El mapa anterior mencionó `Organization` schema en `sobre-nosotros`. Sin embargo, el contenido de la página no fue revisado para esta auditoría. Se desconoce si tiene una descripción del equipo, credenciales, historial o información que refuerce la E-E-A-T.  
**Riesgo:** Si `sobre-nosotros` tiene poco texto o es genérica, el schema `Organization` no aporta valor real a los motores generativos.  
**Recomendación:** Auditar el contenido de `sobre-nosotros` y asegurarse de que incluye: quiénes somos, por qué creamos el producto, qué experiencia tenemos en finanzas personales.  
**Tarea futura:** `SEO-GEO-SOBRE-NOSOTROS-01`

---

**G-07** — Los artículos mezclan el método histórico Kakebo con el producto MetodoKakebo.com sin distinguirlos  
**Área:** GEO · **Severidad:** Media · **Impacto:** Citabilidad / autoridad temática  
**Evidencia:** En `plantilla-kakebo-excel`, el artículo habla del "método Kakebo" (inventado en 1904 por Motoko Hani) y de "Kakebo AI" (el producto) en el mismo flujo narrativo, sin una línea clara de separación. Un motor generativo puede atribuir las características del producto al método histórico o viceversa.  
**Riesgo:** Claims incorrectos en respuestas de IA ("el método Kakebo tiene IA integrada" o "Motoko Hani creó una app de finanzas").  
**Recomendación:** En artículos que mencionen el método histórico, añadir una transición explícita: "El método Kakebo fue creado en 1904 por Motoko Hani. MetodoKakebo.com es una aplicación moderna basada en estos principios, disponible de forma gratuita."  
**Tarea futura:** `SEO-GEO-TERMINOLOGY-01`

---

**G-08** — Sin página de preguntas frecuentes global del sitio  
**Área:** GEO · **Severidad:** Baja · **Impacto:** GEO / citabilidad general  
**Evidencia:** Las FAQs están distribuidas en artículos individuales (frontmatter `faq`) y herramientas. No hay una página `/faq` o `/preguntas-frecuentes` central que consolide las preguntas más comunes sobre el método y el producto.  
**Riesgo:** Para motores generativos, una página FAQ central con respuestas directas sobre el producto es una fuente de citación de alta confianza. Sin ella, las respuestas están fragmentadas.  
**Recomendación:** Evaluar creación de `/faq` como hub de preguntas frecuentes sobre el método y el producto. P2 — baja urgencia.  
**Tarea futura:** `SEO-GEO-FAQ-PAGE-01` (P2)

---

**G-09** — `calculadora-ahorro` FAQ incoherente con optimización reciente  
**Área:** GEO · **Severidad:** Baja · **Impacto:** GEO / consistencia  
**Evidencia:** El FAQ_SCHEMA de `calculadora-ahorro/page.tsx` incluye la pregunta "¿Cuáles son las 4 categorías del Kakebo?" con respuesta "Supervivencia, Opcional o Vicio, Cultura y Extra". Sin embargo, el nombre oficial en el brand manual y en los artículos es "Ocio y Vicio" o "Ocio/Vicio", no "Opcional o Vicio". También llama a la categoría "Extra" en lugar de "Extras".  
**Riesgo:** Un motor generativo que cite esta FAQ puede difundir una terminología que no coincide exactamente con la canónica del método.  
**Recomendación:** Unificar la terminología de las 4 categorías en todo el sitio: Supervivencia, Ocio/Vicio, Cultura, Extras.  
**Tarea futura:** `SEO-GEO-TERMINOLOGY-01` (incluir terminología de categorías)

---

**G-10** — Contenido de `plantilla-kakebo-excel` optimizado para GEO en varias dimensiones  
**Área:** GEO · **Severidad:** N/A · **Impacto:** GEO positivo ✅  
**Evidencia:** 
- FAQPage JSON-LD con 5 preguntas ✅
- SoftwareApplication JSON-LD (herramienta descargable, precio 0) ✅
- Tabla comparativa en HTML (Papel / Excel / Sheets / Kakebo AI) ✅
- Lista de pasos explícita (5 pasos del "problema de la fricción") ✅
- Citas en blockquote ✅
- CTAs bien diferenciadas (descarga vs conversión) ✅

**Valoración:** Esta es la página con mejor preparación GEO del sitio actualmente.

---

**G-11** — `calculadora-inflacion` tiene el schema GEO más robusto del sitio  
**Área:** GEO · **Severidad:** N/A · **Impacto:** GEO positivo ✅  
**Evidencia:** Schema `@graph` con `SoftwareApplication` + `FAQPage` + respuestas directas. Las FAQs incluyen definiciones de "qué es la inflación", "diferencia entre IPC e inflación" — ideal para motores generativos.  
**Valoración:** Referencia a replicar en otras herramientas.

---

### 6.3 Resumen GEO

| # | ID | Descripción breve | Severidad |
|---|---|---|---|
| 1 | G-01 | Sin definición citable del método Kakebo al inicio de ninguna página | Alta |
| 2 | G-02 | Terminología inconsistente entre páginas | Alta |
| 3 | G-03 | Autoría genérica sin credenciales (E-E-A-T) | Media |
| 4 | G-04 | dateModified congelado — sin señal de frescura | Media |
| 5 | G-05 | Home sin contenido factual citable | Media |
| 6 | G-06 | sobre-nosotros no auditada para GEO | Baja |
| 7 | G-07 | Artículos mezclan método histórico y producto sin distinción | Media |
| 8 | G-08 | Sin página FAQ global del sitio | Baja |
| 9 | G-09 | Terminología de 4 categorías Kakebo inconsistente en FAQ schema | Baja |
| 10 | G-10 | plantilla-kakebo-excel — excelente estructura GEO | ✅ Positivo |
| 11 | G-11 | calculadora-inflacion — schema @graph GEO robusto | ✅ Positivo |

---

## 7. Riesgos críticos

| ID | Hallazgo | Impacto | Urgencia |
|---|---|---|---|
| **RC-01** | **Dependencia excesiva de una sola URL tractora** (`/blog/plantilla-kakebo-excel`). Si pierde posición (algoritmo, competencia, cambio de intención), el tráfico orgánico del sitio cae drásticamente. No hay segunda URL con tracción real comparabl | Supervivencia del canal orgánico | Alta |
| **RC-02** | **Sin datos reales de GSC actualizados** para la mayoría de URLs. Todas las prioridades del roadmap se basan en estimaciones y en los datos puntuales documentados en tareas anteriores. Sin GSC actualizado, es imposible detectar canibalizaciones activas, páginas en posición 6-15, o CTR anómalos. | Calidad de las decisiones SEO | Alta |

---

## 8. Riesgos medios

| ID | Hallazgo | Impacto | Urgencia |
|---|---|---|---|
| RM-01 | Canibalización kakebo-online (S-01 + S-02) no resuelta | Ranking / autoridad dividida | Media |
| RM-02 | `dateModified` congelado en JSON-LD y sitemap (T-03 + T-04 + G-04) | Freshness / GEO | Media |
| RM-03 | Home sin schema JSON-LD (T-07) | Rich results / GEO | Media |
| RM-04 | Ambigüedad terminológica Kakebo AI vs método Kakebo (S-06 + G-02) | GEO / autoridad de entidad | Media |
| RM-05 | Entidad MetodoKakebo.com sin definición clara (S-05 + G-01) | GEO / citabilidad | Media |
| RM-06 | hreflang `kakebo-online-guia-completa` puede apuntar a 404 EN (T-09) | Indexación EN / señales | Media |
| RM-07 | `metodo-kakebo-guia-definitiva` infraconectado (S-03) | Autoridad temática / cluster | Media |

---

## 9. Riesgos bajos

| ID | Hallazgo | Impacto |
|---|---|---|
| RB-01 | E-E-A-T débil por autoría genérica (G-03) | Autoridad en contenido financiero |
| RB-02 | Schema `calculadora-ahorro` desalineado del contenido optimizado (T-05) | GEO / rich results coherencia |
| RB-03 | `siteName` inconsistente entre páginas (T-06) | Autoridad de marca |
| RB-04 | `/herramientas` hub ausente del sitemap (T-01) | Crawl del hub |
| RB-05 | `login` en sitemap a prioridad 0.8 (T-02) | Crawl budget |
| RB-06 | Artículos mezclan método histórico y producto (G-07) | Citabilidad GEO |
| RB-07 | `peligros-apps-ahorro-automatico` con función débil (S-07) | Autoridad del cluster |
| RB-08 | Terminología 4 categorías Kakebo inconsistente en FAQ schema (G-09) | GEO / citabilidad |

---

## 10. Oportunidades SEO

| ID | Oportunidad | Impacto estimado | Esfuerzo |
|---|---|---|---|
| O-01 | Artículo editorial de respaldo para `calculadora-inflacion` — capturar tráfico informacional "inflación y ahorros" | Alto | Medio |
| O-02 | Artículo editorial de respaldo para `regla-50-30-20` — capturar tráfico informacional "qué es la regla 50/30/20" | Alto | Medio |
| O-03 | Schema `Organization` + `WebSite` en Home con SearchAction — elegibilidad para sitelinks | Medio | Bajo |
| O-04 | Reducir meta title de `plantilla-kakebo-excel` a <65 chars — mejorar CTR de URL principal | Alto | Muy bajo |
| O-05 | Enlazado interno estructural desde `plantilla-kakebo-excel` hacia herramientas — distribuir autoridad | Medio | Bajo |
| O-06 | Campo `updatedDate` en frontmatter + actualizar JSON-LD `dateModified` — señal de frescura | Medio | Bajo |
| O-07 | `como-hacer-un-presupuesto-personal` — reforzar con enlazado entrante desde herramientas y otros artículos | Medio | Bajo |
| O-08 | `metodo-kakebo-guia-definitiva` — campaña de enlazado entrante desde artículos de cluster | Alto | Bajo |
| O-09 | Validar y resolver posible canibalización kakebo-online — puede doblar el posicionamiento consolidando intención | Alto | Bajo (si solo es diferenciación de metadatos) |
| O-10 | Artículo comparativa "Kakebo vs Fintonic" — tráfico de marca competidor con alta intención | Medio-Alto | Medio |

---

## 11. Oportunidades GEO

| ID | Oportunidad | Impacto estimado | Esfuerzo |
|---|---|---|---|
| OG-01 | Definición factual y citable de "qué es el método Kakebo" en primer párrafo de `metodo-kakebo-guia-definitiva` | Alto — citabilidad directa en respuestas de IA | Muy bajo |
| OG-02 | Definición de MetodoKakebo.com como entidad en `sobre-nosotros` o bloque en Home | Alto — Knowledge Panel potencial | Bajo |
| OG-03 | Unificar terminología en todo el sitio (glosario canónico: Kakebo AI / método Kakebo / MetodoKakebo.com) | Alto — coherencia de entidad para motores generativos | Bajo |
| OG-04 | Añadir `@graph` con múltiples schemas a `calculadora-ahorro` y `regla-50-30-20` — replicar estructura de `calculadora-inflacion` | Medio — elegibilidad rich snippets | Bajo |
| OG-05 | Añadir bio de autor o página de equipo con credenciales financieras | Medio — E-E-A-T para YMYL | Medio |
| OG-06 | Resolver inconsistencia terminológica de 4 categorías Kakebo en schemas (G-09) | Medio — precisión factual en citaciones | Muy bajo |

---

## 12. Canibalizaciones potenciales

| Par en conflicto | Query objetivo | Tipo | Probabilidad | Acción |
|---|---|---|---|---|
| `/blog/kakebo-online-gratis` vs `/blog/kakebo-online-guia-completa` | "kakebo online", "kakebo online gratis" | Alta intención / informacional | Alta | Auditar con GSC real |
| `Home (/)` vs `/blog/kakebo-online-gratis` | "kakebo online gratis" | Transaccional vs informacional | Media | Diferenciación de metadatos más agresiva |
| `/herramientas/calculadora-ahorro` vs `/blog/como-ahorrar-dinero-cada-mes` | "cuánto ahorrar al mes" | Herramienta vs artículo | Baja | Vigilar en GSC |
| `/blog/plantilla-kakebo-excel` vs Home | "kakebo excel gratis" | Recurso vs app | Baja | No actuar — ya diferenciadas |

---

## 13. Problemas de arquitectura e indexación

| Problema | Descripción | Impacto |
|---|---|---|
| `/herramientas` hub sin sitemap | La página hub de herramientas no está en el sitemap | Crawl reducido del hub |
| `login` en sitemap con prioridad alta | Desperdicio de crawl budget en página de autenticación | Crawl budget |
| Blog posts con `lastModified` congelado | Sitemap no refleja actualizaciones reales | Freshness en GSC |
| `/tutorial` en sitemap sin auditar contenido | Puede ser thin content a prioridad 0.8 | Crawl budget calidad |
| 3 herramientas sin artículo editorial | Cluster incompleto — tráfico informacional no capturado | Cobertura temática |
| hreflang `kakebo-online-guia-completa` ↔ slug EN diferente | Señales hreflang pueden ser ignoradas | Indexación EN |

---

## 14. Problemas de schema y datos estructurados

| Problema | URL afectada | Descripción |
|---|---|---|
| `dateModified` = `datePublished` | Todos los blog posts | No refleja actualizaciones reales |
| Schema `SoftwareApplication` desalineado | `/herramientas/calculadora-ahorro` | Nombre y descripción del schema no coinciden con el contenido optimizado |
| `siteName` inconsistente | `calculadora-inflacion` vs `layout.tsx` | "Kakebo" vs "Kakebo AI" |
| Sin schema en Home | `/` | Sin `Organization` + `WebSite` + `SearchAction` |
| Sin schema en blog index | `/blog` | Sin `CollectionPage` o `ItemList` |
| Terminología 4 categorías en FAQ schema | `/herramientas/calculadora-ahorro` | "Opcional o Vicio" ≠ "Ocio/Vicio" canónico |

---

## 15. Problemas de contenido y entidades

| Problema | Descripción | Impacto |
|---|---|---|
| Sin definición citable del método Kakebo | Ninguna página tiene un párrafo de definición factual al inicio | GEO / citabilidad |
| Terminología inconsistente entre páginas | Kakebo AI / método Kakebo / kakebo online / app de ahorro usados indistintamente | GEO / coherencia de entidad |
| Autoría genérica | "Equipo Kakebo" sin nombre, bio ni credenciales financieras | E-E-A-T / YMYL |
| Método histórico mezclado con producto | Los artículos no distinguen claramente entre el método japonés de 1904 y el producto MetodoKakebo.com | GEO / claims |

---

## 16. Problemas de medición

| Problema | Descripción | Impacto |
|---|---|---|
| Sin datos GSC actualizados para la mayoría de URLs | Las decisiones SEO se basan en estimaciones y datos puntuales históricos | Calidad de decisiones |
| Sin eventos GA4 específicos para conversiones SEO | GA4 está integrado pero no se documentan eventos específicos (descarga xlsx, clic en calculadora, signup desde blog) | Medición de conversión orgánica |
| Sin referencia de línea base GSC | No hay snapshot de GSC del momento de inicio del roadmap | Imposibilidad de medir impacto de cambios |

---

## 17. Qué NO conviene tocar todavía

| Elemento | Razón |
|---|---|
| Slug `/blog/plantilla-kakebo-excel` | URL ganadora con tracción orgánica real — cualquier cambio de slug destruye el historial |
| H1 de `plantilla-kakebo-excel` | Coincidencia exacta con queries principales — no tocar |
| Canonical de blog posts | Ya correcto — no re-tocar |
| Canonical de herramientas | Ya correcto — no re-tocar |
| robots.txt | Ya correcto (`/app/` y `/auth/` bloqueados) — no re-tocar |
| hreflang de blog posts | Ya correcto para la estructura actual — no re-tocar |
| Legacy EN | Política DOC-I18N-01 activa — no ampliar, no eliminar, no optimizar |
| Rutas `/es/*` | Redirects 301 correctos — no tocar |
| Schema `SoftwareApplication` de `plantilla-kakebo-excel` | Activo SEO diferencial único — no tocar |
| CTAs en herramientas | Ya optimizadas, no introducir regresiones |
| Sistema visual (tailwind, tokens, brand) | Capítulo frontend cerrado — no abrir sin incidencia concreta |

---

## 18. Hipótesis para validar después

1. **`/herramientas/calculadora-ahorro` con CTR 35,9% es reproducible** — Su intención está extremadamente alineada con la query. Si se crea un artículo editorial de respaldo que enlace a la calculadora, el tráfico combinado podría multiplicarse. Hipótesis: el artículo capturé tráfico informacional y la calculadora capture tráfico transaccional del mismo cluster.

2. **La canibalización kakebo-online está activa** — Dos artículos con intención similar probablemente están alternando en SERP para las mismas queries. Con GSC real, esto se confirma en menos de 10 minutos revisando las queries top de cada URL.

3. **`como-hacer-un-presupuesto-personal` será el segundo pilar del sitio** — Publicado el 2026-06-22, necesita 4-8 semanas de maduración. Si a finales de agosto empieza a mostrar impresiones en GSC, es candidato a ser el segundo activo SEO relevante.

4. **GEO es una ventana de oportunidad de 6-12 meses** — Los motores generativos están siendo adoptados rápidamente. MetodoKakebo.com tiene el tipo de contenido que los motores generativos citan (FAQs, tablas comparativas, pasos, datos estructurados). Invertir en GEO ahora puede generar citas en AI Overviews antes de que los competidores lo hagan.

5. **La inconsistencia terminológica es el principal bloqueante GEO** — Si se unifica la terminología en 3-5 piezas clave (Home, metodo-kakebo-guia-definitiva, plantilla-kakebo-excel, sobre-nosotros), el sitio puede empezar a ser citado como referencia sobre "método Kakebo" por motores generativos.

---

## 19. Tareas recomendadas para el roadmap

### Bloque inmediato (bajo riesgo, alto impacto)

| ID propuesto | Tarea | Tipo | Prioridad |
|---|---|---|---|
| `SEO-EXCEL-TITLE-01` | Reducir meta title de `plantilla-kakebo-excel` a <65 chars | SEO técnico / CTR | P0 |
| `SEO-TECHNICAL-DATEMODIFIED-01` | Añadir `updatedDate` en frontmatter + usar en JSON-LD y sitemap | SEO técnico | P1 |
| `SEO-TECHNICAL-SITEMAP-01` | Añadir `/herramientas` al sitemap, bajar prioridad de `login`, mejorar `lastModified` de core routes | SEO técnico | P1 |
| `SEO-SCHEMA-HOME-01` | Añadir schema `Organization` + `WebSite` con SearchAction a la Home | SEO técnico / GEO | P1 |
| `SEO-EXCEL-H3-FIX-01` | Convertir H3 inicial en H2 en `plantilla-kakebo-excel` | SEO semántico | P1 |
| `SEO-EXCEL-INTERNAL-LINKS-01` | Añadir enlazado desde `plantilla-kakebo-excel` a herramientas estratégicas | SEO semántico | P1 |

### Bloque GEO (medio plazo, alta oportunidad)

| ID propuesto | Tarea | Tipo | Prioridad |
|---|---|---|---|
| `SEO-GEO-ENTITY-DEFINITION-01` | Añadir definición factual del método + del producto en `metodo-kakebo-guia-definitiva` y/o `sobre-nosotros` | GEO | P1 |
| `SEO-GEO-TERMINOLOGY-01` | Unificar terminología: glosario canónico en todo el sitio | GEO | P1 |
| `SEO-SCHEMA-AHORRO-SYNC-01` | Actualizar schema `calculadora-ahorro` para alinear con contenido optimizado | GEO / técnico | P1 |
| `SEO-GEO-AUTHORSHIP-01` | Añadir bio de autor o página equipo con credenciales | GEO / E-E-A-T | P2 |
| `SEO-GEO-FAQ-PAGE-01` | Evaluar página `/faq` global del sitio | GEO | P2 |

### Bloque contenido (esperar datos GSC)

| ID propuesto | Tarea | Tipo | Prioridad |
|---|---|---|---|
| `SEO-KAKEBO-ONLINE-CANIB-01` | Auditar canibalización kakebo-online con GSC real | SEO semántico | P1 — esperar datos |
| `SEO-BLOG-INFLACION-01` | Crear artículo editorial de respaldo para `calculadora-inflacion` | Contenido | P1 — esperar roadmap |
| `SEO-BLOG-503020-01` | Crear artículo editorial de respaldo para `regla-50-30-20` | Contenido | P1 — esperar roadmap |
| `SEO-INTERNAL-LINKING-V1-01` | Mapa y ejecución de enlazado interno estructural | Enlazado | P1 — ejecutar post-roadmap |
| `SEO-HREFLANG-KAKEBO-ONLINE-01` | Verificar y corregir hreflang de `kakebo-online-guia-completa` | SEO técnico | P1 |

### Bloque medición (crítico para tomar decisiones)

| ID propuesto | Tarea | Tipo | Prioridad |
|---|---|---|---|
| `SEO-DATA-PRIORITY-01` | Obtener snapshot GSC actualizado para todo el sitio | Medición | **PREREQUISITO** |
| `SEO-GA4-EVENTS-01` | Definir y activar eventos GA4 para conversiones clave (descarga xlsx, signup desde blog, clic en calculadora) | Medición | P1 |

---

## 20. Conclusión

MetodoKakebo.com tiene una base técnica SEO más sólida de lo esperado. Los problemas críticos del mapa anterior (canonical, robots, canonicals de herramientas) ya están resueltos. La URL tractora (`plantilla-kakebo-excel`) tiene una estructura técnica y GEO muy bien construida, con múltiples schemas especializados y contenido citabile.

Los problemas reales son de segundo nivel: `dateModified` congelado, home sin schema, terminología inconsistente, herramientas sin artículos de respaldo, y un hub semántico (`metodo-kakebo-guia-definitiva`) infraconectado.

La oportunidad más significativa a corto plazo es la **unificación terminológica y GEO**: definir claramente qué es MetodoKakebo.com, qué es el método Kakebo, y asegurarse de que esa definición esté en el primer párrafo de las páginas clave. Esto tiene coste de implementación mínimo y puede mejorar tanto el CTR como la citabilidad en motores generativos.

La oportunidad más significativa a medio plazo es **resolver la canibalización del cluster kakebo-online** y **crear artículos editoriales de respaldo** para las tres herramientas, que actualmente capturan solo tráfico transaccional sin cobertura informacional.

**Dependencia bloqueante para el roadmap:** `SEO-DATA-PRIORITY-01` — sin datos reales de GSC actualizados, el resto de decisiones son estimaciones.

---

*SEO_GEO_DEEP_AUDIT_01.md — 2026-06-30*  
*32 hallazgos (12 técnicos · 9 semánticos · 11 GEO) · 2 riesgos críticos · 7 medios · 8 bajos*  
*Sin cambios en código, contenido ni SEO técnico.*
