# SEO_GEO_DEEP_AUDIT_01 — Auditoría SEO/GEO Profunda de MetodoKakebo.com

**Fecha:** 2026-07-07
**Tarea:** SEO-GEO-DEEP-AUDIT-01
**Tipo:** Solo diagnóstico — sin cambios en código, contenido ni configuración SEO
**Commit de referencia (HEAD):** `d77bd18` (2026-07-06) — sin commits posteriores en el repo
**Método:** Verificación directa contra el código fuente real (`sitemap.ts`, `robots.ts`, `layout.tsx`, `blog/[slug]/page.tsx`, `herramientas/page.tsx`, Home) + lectura completa de `CONTEXT.md`, `docs/PROJECT_STATUS.md` (~3370 líneas), `docs/seo/SEO_MAP_V1.md`, `docs/seo/GSC_CHANGELOG_2026_07_03.md`, `docs/seo/SEO_ROADMAP_V1.md`, `docs/seo/PLAN_SEO_GEO_METODOKAKEBO.md` y el resto de `docs/seo/*.md`
**Nota de continuidad:** Existe una auditoría previa con el mismo nombre de archivo fechada 2026-07-06. Como no se ha registrado ningún commit ni cambio de código entre esa fecha y hoy, esta actualización reconfirma sus hallazgos mediante verificación independiente (no solo por herencia documental) y los reorganiza en el formato solicitado para esta tarea. No hay hallazgos nuevos respecto a ayer — el estado del sitio es idéntico.

---

## 1. Resumen ejecutivo

MetodoKakebo.com es una aplicación gratuita de gestión financiera personal (método Kakebo) con una capa pública de marketing/SEO (Next.js App Router, i18n ES/EN) sobre una app autenticada. El proyecto ha ejecutado, en las últimas dos semanas, un sprint SEO/GEO disciplinado (~40 tareas documentadas en `docs/PROJECT_STATUS.md`) que ha resuelto la mayoría de los problemas técnicos y de contenido detectados en auditorías anteriores.

El sitio tiene **27 URLs ES indexables** (15 artículos de blog, 4 herramientas/hub, 5 páginas principales, 3 legales) y **10 URLs EN legacy noindexadas** de un total de 15 EN históricas. Existe **una única URL con tracción orgánica probada y dominante**: `/blog/plantilla-kakebo-excel`. Una segunda URL, `/herramientas/calculadora-ahorro`, muestra un CTR excepcional (35,9%) para su posición, y un tercer activo en maduración, `/blog/como-hacer-un-presupuesto-personal`, aún no tiene datos suficientes.

El estado general es **sólido en base técnica y muy avanzado en GEO** (definición factual del método, glosario canónico, schema de Home), pero mantiene **una regresión técnica activa no corregida** (hreflang que apunta a URLs marcadas `noindex`, ver T-13) y **tres huecos estructurales de bajo riesgo pero de impacto acumulado** que llevan abiertos desde hace más de una semana sin ejecutarse: el hub `/herramientas` fuera del sitemap y sin schema, el `siteName` inconsistente en una página, y el enlazado interno hacia el segundo pilar temático (`metodo-kakebo-guia-definitiva`) que sigue sin ejecutarse pese a estar documentado.

El riesgo estratégico más importante no es técnico: es la **dependencia de una sola URL tractora** sin una segunda fuente de tráfico orgánico consolidada, combinada con una **ventana de medición aún abierta** (el próximo snapshot GSC que valida todo el sprint de julio está programado para 2026-07-17/31 y todavía no se ha ejecutado).

---

## 2. Estado general del proyecto

| Dimensión | Estado |
|---|---|
| Arquitectura i18n / indexabilidad | Sólida — `as-needed` para ES, prefijo `/en` para inglés, `defaultLocale: 'es'` |
| Sitemap | Dinámico, con guard de noindex correcto para EN — pero incompleto (falta `/herramientas`) |
| Robots.txt | Correcto — bloquea `/api/`, `/app/`, `/auth/` |
| Redirects legacy (`/es/*`) | Correctos — 301 permanentes, validados |
| Schema estructurado | Avanzado en Home, blog index y herramientas de mayor tráfico; incompleto en el hub de herramientas; con un valor de entidad incorrecto en blog posts (G-12) |
| GEO (definiciones, glosario, entidades) | El bloque mejor ejecutado del proyecto — resuelto de forma verificable en código |
| Medición (GSC/GA4) | Dos snapshots recientes documentados (2026-06-30, 2026-07-03); eventos GA4 de conversión activos; próxima validación pendiente (2026-07-17/31) |
| Enlazado interno estructural | El bloque menos ejecutado — plan documentado (`SEO_INTERNAL_LINKING_V1_01.md`) pero sin ejecución confirmada |
| Cobertura editorial de herramientas | Gap persistente — 2 de 3 herramientas sin artículo de respaldo |
| Deuda de infraestructura (no SEO) | Resuelta — `ignoreBuildErrors` eliminado, lint a 0 errores, 506/506 tests (ver `CONTEXT.md` P1.1–P1.5) |

---

## 3. Fortalezas

1. **Definición factual y citable del método Kakebo, verificada en código.** El primer párrafo de `metodo-kakebo-guia-definitiva.es.mdx` separa explícitamente el método histórico (1904, Motoko Hani) del producto (MetodoKakebo.com), siguiendo casi textualmente la plantilla de `SEO_GEO_ENTITY_DEFINITIONS_01.md`. Es exactamente el tipo de bloque que un motor generativo puede citar sin ambigüedad.
2. **Glosario terminológico aplicado de forma sistemática.** "Ocio/Vicio" y "Extras" (no "Opcional"/"Extra"), "Kakebo AI" vs "método Kakebo" vs "MetodoKakebo.com" diferenciados en Home, tutorial, dashboard, 3 herramientas y ~12 artículos de blog. Reduce directamente la ambigüedad de entidad que penaliza tanto a SEO semántico como a GEO.
3. **Schema estructurado robusto en los activos de mayor tráfico.** Home tiene `@graph` con `Organization` + `WebSite` + `SoftwareApplication`; blog index tiene `CollectionPage` + `ItemList` que filtra correctamente contenido noindex; `calculadora-inflacion` tiene el schema más completo del sitio (`SoftwareApplication` + `FAQPage` + `HowTo`).
4. **Higiene de indexación EN ejecutada con guard verificado en sitemap.** El bug de contradicción sitemap↔robots para los 10 artículos EN legacy noindexados está corregido y confirmado directamente en `sitemap.ts` (`enNoindexSlugs`).
5. **Cultura de medición naciente pero real.** Dos snapshots GSC con métricas numéricas documentadas por URL y por query, changelog de commits con hipótesis y ventana mínima de validación explícita por cada cambio (`GSC_CHANGELOG_2026_07_03.md`) — disciplina poco común y que evita el error clásico de interpretar ruido como señal.
6. **Protección explícita del activo dominante.** `/blog/plantilla-kakebo-excel` está marcado en múltiples documentos como "no tocar sin autorización explícita", evitando el riesgo más común en sitios con una sola URL tractora: dañarla por exceso de optimización.
7. **Deuda de infraestructura no-SEO resuelta**, lo cual reduce el riesgo de que un futuro cambio de contenido rompa el build silenciosamente (`ignoreBuildErrors` eliminado, 0 errores de lint, 506/506 tests).

---

## 4. Debilidades

1. **Regresión técnica activa: hreflang contradictorio (T-13).** 10 URLs ES emiten `<link rel="alternate" hreflang="en">` hacia versiones EN marcadas `noindex, nofollow`. El propio mecanismo que corrige esto ya existe en `sitemap.ts` pero no se replicó en el `<head>` HTML de cada página (`generateMetadata` en `blog/[slug]/page.tsx`).
2. **Entidad de marca inconsistente en el único punto que faltaba (G-12).** El schema `BlogPosting.publisher.name` de los 15 artículos de blog usa `"Kakebo"` a secas — precisamente el término que el propio glosario canónico del proyecto marca como ambiguo y a evitar.
3. **Hub `/herramientas` infravalorado técnicamente.** No está en `coreRoutes` del sitemap y no tiene ningún schema JSON-LD, pese a ser la página que agrupa las 3 herramientas con mejor rendimiento relativo del sitio.
4. **`lastModified` de rutas núcleo no fiable.** Todas las `coreRoutes` del sitemap (Home, tutorial, sobre-nosotros, blog index, herramientas, legales) usan `new Date()` en cada build, lo que envía a Google una señal de "modificado hoy" aunque no haya cambiado nada — reduce la utilidad de esa señal para priorización de crawl.
5. **Enlazado interno estructural sin ejecutar.** El plan de `SEO_INTERNAL_LINKING_V1_01.md` está documentado pero las tareas derivadas (enlaces desde `plantilla-kakebo-excel` hacia herramientas, enlaces entrantes hacia `metodo-kakebo-guia-definitiva`) no aparecen ejecutadas en el changelog.
6. **Cobertura editorial incompleta en el cluster de herramientas.** `calculadora-inflacion` y `regla-50-30-20` no tienen artículo de blog de respaldo — reciben tráfico transaccional puro sin capturar la demanda informacional del mismo cluster de keywords.
7. **Autoría no verificada de forma exhaustiva.** Solo se confirmó un artículo (`metodo-kakebo-guia-definitiva`) con nombre de autor real (Aitor Alarcón) en lugar de "Equipo Kakebo"; los otros 14 no se han revisado uno a uno.
8. **Dependencia de una sola URL tractora sin diversificación confirmada.** `plantilla-kakebo-excel` sigue siendo, con diferencia, el activo orgánico dominante; no existe todavía una segunda URL con tracción equivalente y verificada.

---

## 5. Riesgos

Ver tabla detallada en la sección 10 (Análisis de riesgos) y sección 11 (Priorización). Resumen de los tres riesgos de mayor severidad:

- **RC-01 (Alto):** Concentración de todo el tráfico orgánico relevante en `plantilla-kakebo-excel`. Cualquier penalización, cambio de algoritmo o error técnico en esa única URL tiene impacto desproporcionado sobre el canal orgánico completo.
- **T-13 (Medio-Alto):** Señal hreflang→noindex contradictoria en 10 URLs, con riesgo de que Google interprete de forma ambigua el `noindex` de los artículos EN legacy y retrase la consolidación de autoridad hacia ES que el sprint de julio buscaba conseguir.
- **RC-02 (Medio, en descenso):** Cadencia de medición GSC todavía no autosostenida — depende de que el snapshot del 2026-07-17/31 se ejecute efectivamente; si no se ejecuta, el proyecto vuelve a decidir sin datos.

---

## 6. Oportunidades

1. **Corregir T-13 y G-12 en un solo commit de bajo riesgo** (una condición + un valor de string) con impacto simultáneo en 10 URLs (hreflang) y 15 URLs (publisher). Es la mejor relación impacto/esfuerzo de todo el roadmap actual.
2. **Ejecutar el enlazado interno ya diseñado** en `SEO_INTERNAL_LINKING_V1_01.md` — el trabajo de mapeo ya está hecho, falta la ejecución.
3. **Convertir el hub `/herramientas` en una pieza SEO real**: añadirlo al sitemap con prioridad de hub y dotarlo de un schema `CollectionPage`/`ItemList` análogo al ya implementado en el blog index (patrón reutilizable, riesgo mínimo).
4. **Ventana GEO activa de 6-12 meses.** El sitio ya tiene la base (definiciones factuales, FAQ, tablas, glosario) para posicionarse como fuente citable en motores generativos antes de que la competencia lo haga — es el eje donde MetodoKakebo.com tiene ventaja relativa más clara hoy.
5. **`como-hacer-un-presupuesto-personal` como segundo pilar.** Publicado 2026-06-22, con estructura de pilar completa; el snapshot de 2026-07-17/31 será la primera oportunidad real de confirmar si genera tracción y reducir así la dependencia de una sola URL.
6. **Cerrar el gap editorial de `calculadora-inflacion` y `regla-50-30-20`** una vez que el snapshot GSC confirme volumen de búsqueda — estas dos herramientas ya tienen el schema y el copy optimizado; solo falta la pieza informacional de apoyo.

---

## 7. Auditoría SEO técnica

Clasificación: **Correcto** / **Mejorable** / **Crítico**, con justificación basada en lectura directa del código.

| Apartado | Valoración | Justificación |
|---|---|---|
| **Arquitectura del sitio** | Correcto | App Router de Next.js con route groups `(public)`/`(landing)`/`app`; separación clara entre superficie pública indexable y app autenticada; i18n con `next-intl`, locale `as-needed` para ES y prefijo `/en` para inglés. |
| **Indexabilidad** | Mejorable | El contenido público relevante es indexable correctamente. Persisten inconsistencias menores: el hub `/herramientas` no está en el sitemap aunque sí es indexable y rastreable por enlace directo. |
| **Robots.txt** | Correcto | `disallow: ['/api/', '/app/', '/auth/']` verificado directamente en `robots.ts`. Cubre toda la superficie no pública. Sin hallazgos. |
| **Sitemap** | Mejorable | Generación dinámica correcta desde `getBlogPosts()`, exclusión de EN noindex correctamente implementada (`enNoindexSlugs`), `lastModified` de blog posts usa `updatedDate ?? date` (correcto). Pero: (a) `/herramientas` (hub) ausente de `coreRoutes`; (b) todas las `coreRoutes` usan `lastModified: new Date()` en cada build, sin distinguir contenido realmente actualizado de contenido estable. |
| **Canonicals** | Correcto | Verificado en `blog/[slug]/page.tsx`: `canonical` construido correctamente según locale (`/blog/slug` para ES, `/en/blog/slug` para EN), sin prefijo `/es/` residual. |
| **Hreflang** | Crítico | Verificado directamente en código: `alternates.languages` en `blog/[slug]/page.tsx` construye el bloque `"en"` de forma **incondicional**, sin comprobar si el post EN correspondiente tiene `noindex: true`. Afecta a 10 de 15 slugs de blog. Es señal contradictoria de la clase que Search Console reporta explícitamente como error de "mejoras internacionales". |
| **Rutas legacy** | Correcto | Los 15 artículos EN legacy están inventariados y clasificados (`SEO_LEGACY_EN_INVENTORY_DECISION_01.md`); 10 ya noindexados, 1 protegido explícitamente (`plantilla-kakebo-excel.en.mdx`), 3 pendientes de decisión con más datos, 1 mantenido. Política congelada y respetada (no se ha tocado nada fuera de plan). |
| **Redirecciones** | Correcto | `next.config.ts` mantiene dos redirects 301 permanentes (`/es` → `/`, `/es/:path*` → `/:path*`), verificados directamente. Sin URLs `/es/` en el sitemap. |
| **Metadata (title/description)** | Correcto (activos revisados) | Ejemplos verificados: Home, `calculadora-inflacion`, `calculadora-ahorro`, `regla-50-30-20`, `kakebo-online-guia-completa` — todos con title/description trabajados en sprints recientes con longitud y keyword adecuadas. |
| **Títulos y jerarquía H1/H2/H3** | Mejorable | Corregido en la mayoría de páginas (H1 duplicado eliminado en `SavingsCalculator`/`Calculator503020`). Sin evidencia de nuevos problemas de jerarquía en esta pasada, pero no se releyó línea a línea el H2/H3 de los 15 artículos de blog en esta auditoría — confianza basada en el changelog, no en lectura directa exhaustiva. |
| **Estructura HTML / semántica** | Correcto | Uso de `<main>`, `next/image` con `sizes`, componentes MDX estructurados. Sin hallazgos nuevos. |
| **Schema global** | Mejorable | Home con `@graph` completo (`Organization` + `WebSite` + `SoftwareApplication`) — correcto. Blog index con `CollectionPage` + `ItemList` — correcto. El hub `/herramientas` no tiene ningún `<script type="application/ld+json">` — confirmado por lectura directa del archivo. |
| **Schema por tipo de página** | Mejorable | `BlogPosting` en artículos correcto en general, salvo `publisher.name: "Kakebo"` (debería ser `"MetodoKakebo.com"` según el propio glosario del proyecto). `calculadora-inflacion` es el más robusto (`SoftwareApplication` + `FAQPage` + `HowTo`). |
| **Breadcrumbs** | No verificado en esta pasada | No se detectó `BreadcrumbList` explícito en los archivos revisados directamente; el changelog no documenta ninguna tarea de breadcrumbs. Recomendable verificación puntual futura, no bloqueante. |
| **Enlazado interno estructural** | Mejorable | Plan completo documentado en `SEO_INTERNAL_LINKING_V1_01.md`, pero sin confirmación de ejecución en el changelog. `metodo-kakebo-guia-definitiva`, que debería ser el hub del cluster "Kakebo Core", sigue infraconectado. |
| **Profundidad de clic** | Correcto | Todas las URLs indexables relevantes son alcanzables en 1-2 clics desde Home/blog index/herramientas hub — arquitectura plana, sin paginación profunda. |
| **Imágenes / alt / lazy loading** | Correcto | Uso consistente de `next/image` en blog index y blog post con `sizes` apropiados; no se detectaron regresiones en la muestra revisada. |
| **Core Web Vitals** | Sin datos | No hay datos de CWV disponibles en el repo (ni en esta pasada ni en la anterior). No es posible evaluar sin acceso a PageSpeed Insights / CrUX. |
| **Consistencia general (`siteName`)** | Mejorable | Grep exhaustivo confirma solo 2 puntos del código definen `siteName` explícito: `layout.tsx` (`"Kakebo AI"`, aplicado globalmente por defecto) y `calculadora-inflacion/page.tsx` (`"MetodoKakebo.com"`, única excepción). El resto de páginas heredan el valor global — la inconsistencia real hoy es "1 página diverge del resto", no una mezcla generalizada. |

---

## 8. Auditoría SEO semántica

### 8.1 Mapa de intención por URL (extracto de las URLs de mayor relevancia — inventario completo de 27 URLs en `docs/seo/SEO_MAP_V1.md`)

| URL | Rol | Intención principal | Keyword principal | Keywords secundarias | ¿Pilar o soporte? |
|---|---|---|---|---|---|
| `/blog/plantilla-kakebo-excel` | Pilar — activo dominante | Transaccional (descarga de recurso) | plantilla kakebo excel gratis | kakebo excel, kakebo google sheets | Pilar |
| `/blog/metodo-kakebo-guia-definitiva` | Debería ser hub de cluster "Kakebo Core" | Informacional | método kakebo | qué es el kakebo, método japonés ahorro | Pilar (infraconectado) |
| `/blog/como-hacer-un-presupuesto-personal` | Pilar en maduración | Informacional | cómo hacer un presupuesto personal | presupuesto mensual, planificar presupuesto | Pilar (sin datos aún) |
| `/` (Home) | Entidad de marca | Navegacional / transaccional app | kakebo online gratis | kakebo app, kakebo online, método kakebo | Pilar de marca |
| `/herramientas/calculadora-ahorro` | Herramienta con mejor CTR del sitio | Transaccional | calculadora de ahorro mensual | cuánto ahorrar al mes | Soporte transaccional |
| `/herramientas/calculadora-inflacion` | Herramienta sin respaldo editorial | Transaccional | calculadora de inflación | IPC, poder adquisitivo | Soporte transaccional (gap) |
| `/herramientas/regla-50-30-20` | Herramienta sin respaldo editorial | Transaccional | calculadora 50/30/20 | necesidades deseos ahorro | Soporte transaccional (gap) |
| `/blog/kakebo-online-gratis` | Cluster "Kakebo Online" | Transaccional | kakebo online gratis | app kakebo gratis, kakebo sin banco | Soporte |
| `/blog/kakebo-online-guia-completa` | Cluster "Kakebo Online" | Informacional | kakebo online | kakebo digital, aplicación kakebo | Soporte (posible solape con la anterior) |
| `/blog/kakebo-vs-ynab` | Único comparativo BOFU del sitio | Informacional/comparativo | kakebo vs ynab | mejor método presupuesto | Soporte BOFU |
| `/blog/alternativas-a-app-bancarias` + `/blog/peligros-apps-ahorro-automatico` | Cluster Fintonic/alternativas | Informacional | alternativas a fintonic | open banking riesgos | Soporte (segundo artículo infraconectado) |

### 8.2 Canibalizaciones potenciales

| Par | Estado |
|---|---|
| `kakebo-online-gratis` (ES) vs `kakebo-online-guia-completa` (ES) | Sin confirmar — dato insuficiente según auditoría de scope ampliado (`SEO_KAKEBO_ONLINE_CANIB_01.md`, apéndice 2026-07-03). Riesgo bajo, monitorizar en el snapshot de julio. |
| `kakebo-online-gratis` (ES) vs (EN) | Resuelto — versión EN noindexada. |
| `kakebo-online-guia-completa` (ES) vs (EN) | Resuelto en el noindex, pero sustituido por el hallazgo técnico T-13 (hreflang sigue apuntando a la versión noindexada). |
| Home vs `kakebo-online-gratis` | Descartada — intención diferenciada confirmada por datos GSC (marca/navegacional vs transaccional específico). |
| Herramientas vs artículos de blog | Sin canibalización — segmentación de keywords correcta. |

### 8.3 Contenido duplicado / thin content

No se detectó contenido duplicado entre artículos ES. `/tutorial` fue auditado específicamente (`SEO-TECHNICAL-TUTORIAL-01`) y clasificado como contenido real, no thin — su única pendiente es que la prioridad de sitemap (0.8) no se revisó tras esa conclusión. No se detectaron páginas huérfanas nuevas en esta pasada.

### 8.4 Cobertura temática — clusters existentes vs incompletos

| Cluster | Estado |
|---|---|
| Kakebo Excel | Completo y consolidado — 1 URL dominante |
| Kakebo Online / App | Existe pero con solape de intención sin resolver entre 2 URLs |
| Herramientas de Ahorro (calculadora-ahorro) | Parcialmente cubierto — apoyado por el pilar de presupuesto |
| Inflación / IPC | **Incompleto** — solo la herramienta, sin artículo editorial |
| Regla 50/30/20 | **Incompleto** — solo la herramienta, sin artículo editorial |
| Presupuesto Personal | En construcción — pilar reciente, sin enlazado consolidado todavía |
| Kakebo Core (método) | Existe el contenido pilar pero **infraconectado** como hub |
| Comparativas / BOFU | **Muy limitado** — un solo artículo (`kakebo-vs-ynab`) cubre todo el fondo de embudo |
| Alternativas / Fintonic | Existe, pero el segundo artículo del cluster tiene función arquitectónica débil |
| Finanzas personales generales (TOFU) | Amplio en número de artículos, pero sin jerarquía de enlazado clara entre ellos |

---

## 9. Auditoría GEO

| Criterio | Estado | Evidencia |
|---|---|---|
| Definiciones claras al inicio de páginas clave | Resuelto | Primer párrafo de `metodo-kakebo-guia-definitiva.es.mdx`, casi textual respecto a la plantilla de `SEO_GEO_ENTITY_DEFINITIONS_01.md` |
| Respuestas directas / estructura pregunta-respuesta | Presente | FAQ schema en `plantilla-kakebo-excel`, `calculadora-inflacion`, `calculadora-ahorro`, y FAQ en frontmatter de varios artículos de blog |
| Tablas comparativas | Presente pero concentradas | `kakebo-vs-ynab` es el único comparativo estructurado en tabla; sin réplica en otros verticales (p. ej. "Kakebo vs Fintonic" sigue siendo una oportunidad no ejecutada) |
| Listas y contenido citable | Presente | Artículos con pasos numerados y listas de categorías (`como-ahorrar-dinero-cada-mes`, `regla-30-dias`) |
| Entidades bien definidas | Resuelto en su mayoría | Glosario canónico aplicado; único punto pendiente es `BlogPosting.publisher.name: "Kakebo"` (G-12) |
| Consistencia terminológica | Resuelta en su mayoría | "Ocio/Vicio", "Extras", "Kakebo AI" vs "método Kakebo" vs "MetodoKakebo.com" aplicados de forma sistemática en Home, tutorial, dashboard, herramientas y ~12 artículos |
| Autoridad temática | En construcción | Un solo pilar fuerte (`plantilla-kakebo-excel`) más un segundo en maduración; el hub semántico (`metodo-kakebo-guia-definitiva`) no recibe suficiente enlazado entrante para consolidar autoridad |
| Autoridad de marca | Reforzada recientemente | Schema `Organization` + `WebSite` en Home; copy de marca reforzado en `SEO-HOME-BRAND-ENTITY-COPY-01`; `sobre-nosotros` reescrito con tono factual y E-E-A-T (`SEO-GEO-SOBRE-NOSOTROS-01`) |
| Estructura de conocimiento / separación método-producto | Resuelta en el artículo pilar | El método histórico (1904, Motoko Hani) y el producto (MetodoKakebo.com) están explícitamente diferenciados, evitando la ambigüedad que penaliza la citabilidad |
| Reutilización del contenido por IA (citabilidad) | Parcialmente lista, con una fuga activa | El contenido factual y estructurado en tablas/FAQ es apto para citación; pero la señal de entidad tiene dos fugas puntuales: `publisher.name: "Kakebo"` (G-12) y el hreflang contradictorio (T-13, afecta a la fiabilidad de la señal de idioma/URL canónica que un motor generativo podría cruzar) |
| Autoría / E-E-A-T | Parcial | Solo un artículo confirmado con autor real (Aitor Alarcón); el resto no se ha verificado uno a uno — recomendable auditoría puntual dedicada |
| FAQ global de sitio | No existe | No hay página `/faq` como hub agregador — prioridad baja, no urgente |

**Mejoras GEO futuras identificadas (solo documentadas, no implementar):**
1. Corregir `BlogPosting.publisher.name` a `"MetodoKakebo.com"` en los 15 artículos (cambio de una línea en el componente compartido).
2. Condicionar el `alternates.languages.en` de `blog/[slug]/page.tsx` al estado `noindex` del post EN, replicando la guard ya existente en `sitemap.ts`.
3. Verificar y, si procede, migrar la autoría de los 14 artículos restantes a nombre real con credenciales.
4. Añadir schema `CollectionPage`/`ItemList` al hub `/herramientas`, reutilizando el patrón ya validado en el blog index.
5. Crear una segunda comparativa BOFU (p. ej. "Kakebo vs Fintonic") para ampliar la cobertura de contenido citable en decisiones de compra/adopción.

---

## 10. Auditoría de arquitectura

| Apartado | Valoración | Detalle |
|---|---|---|
| Navegación | Correcta | Navbar/TopNav diferenciados entre superficie pública y app autenticada; sin enlaces rotos detectados en los archivos revisados |
| Estructura de categorías | Correcta pero informal | Los "clusters" existen a nivel de contenido y de documentación (`SEO_MAP_V1.md`) pero no como taxonomía física en URLs (no hay `/blog/categoria/...`) — aceptable dado el volumen actual de contenido (15 artículos) |
| Arquitectura de URLs | Correcta | Slugs planos, sin prefijos innecesarios (`/blog/slug`, `/herramientas/slug`), i18n `as-needed` coherente |
| Distribución de autoridad | Desequilibrada | Concentrada en `plantilla-kakebo-excel`; el hub temático (`metodo-kakebo-guia-definitiva`) no recibe el enlazado que necesitaría para redistribuir esa autoridad |
| Enlazado interno | Débil en ejecución | Diseño completo documentado, ejecución pendiente — es el cuello de botella arquitectónico más claro del sitio ahora mismo |
| Profundidad del contenido | Adecuada en el pilar principal | `plantilla-kakebo-excel` y `metodo-kakebo-guia-definitiva` tienen profundidad real; las herramientas sin respaldo editorial son comparativamente más "delgadas" en cobertura informacional (aunque no thin content en sí mismas) |
| Cuellos de botella | Identificados | (1) Enlazado interno sin ejecutar bloquea la redistribución de autoridad; (2) el hub `/herramientas` no está integrado en la arquitectura de indexación (sitemap + schema); (3) la dependencia de una sola URL tractora es un cuello de botella de resiliencia, no solo de crecimiento |

---

## 11. Análisis de riesgos

### 11.1 Riesgos SEO actuales

| ID | Riesgo | Severidad |
|---|---|---|
| RC-01 | Dependencia de una sola URL tractora (`plantilla-kakebo-excel`) sin segunda fuente consolidada | Alta |
| T-13 | Hreflang contradictorio hacia 10 URLs EN noindexadas | Media-Alta |
| RM-07 | `metodo-kakebo-guia-definitiva` infraconectado como hub de cluster | Media |
| T-01 | Hub `/herramientas` ausente del sitemap | Baja |
| T-10 | `lastModified` de `coreRoutes` no fiable (`new Date()` fijo) | Baja |
| RB-03 | `siteName` inconsistente (1 excepción activa) | Baja |

### 11.2 Riesgos GEO

| ID | Riesgo | Severidad |
|---|---|---|
| G-12 | `BlogPosting.publisher.name: "Kakebo"` contradice el glosario canónico del propio proyecto | Baja-Media |
| G-08 | Sin página FAQ global del sitio | Baja |
| G-03 | Autoría genérica no verificada en 14 de 15 artículos | Baja |

### 11.3 Deuda técnica

- `typescript.ignoreBuildErrors` fue eliminado (P1.4) — sin deuda activa en el build de producción.
- 77 warnings de ESLint (`no-unused-vars`) siguen pendientes, sin bloquear build ni tests — deuda de código, no de SEO.
- Deuda técnica SEO concreta: T-13 y G-12 (ambas de corrección trivial, sin ejecutar).

### 11.4 Deuda semántica

- Enlazado interno documentado pero no ejecutado (deuda de ejecución, no de diseño).
- Gap editorial persistente en 2 de 3 herramientas.
- Cobertura BOFU limitada a un único artículo comparativo.

### 11.5 Dependencias peligrosas

- El roadmap de contenido nuevo (`SEO-BLOG-INFLACION-01`, `SEO-BLOG-503020-01`) depende explícitamente de tener primero el enlazado interno ejecutado y datos de GSC confirmados — si se salta este orden, el riesgo es publicar contenido sin la arquitectura de soporte que lo haga rentable.
- La validación de todo el sprint de canibalización EN/ES depende del snapshot GSC del 2026-07-17/31, que todavía no se ha ejecutado — es una dependencia temporal externa al equipo (recrawl de Googlebot).

### 11.6 Oportunidades de alto impacto

1. Corrección conjunta de T-13 + G-12 (bajo esfuerzo, impacto sobre 15 URLs).
2. Ejecución del enlazado interno ya diseñado (bloque de mayor impacto potencial pendiente de ejecutar).
3. Consolidación de `como-hacer-un-presupuesto-personal` como segundo pilar tras el snapshot de julio.

---

## 12. Tabla de priorización

| ID | Descripción | Impacto | Urgencia | Dificultad | Tipo |
|---|---|---|---|---|---|
| T-13 | Hreflang contradictorio hacia 10 artículos EN noindexados | Alto | Alta | Muy baja | SEO técnico |
| G-12 | `BlogPosting.publisher.name` usa "Kakebo" en lugar de "MetodoKakebo.com" | Medio | Media | Muy baja | GEO |
| RM-07 | `metodo-kakebo-guia-definitiva` infraconectado como hub de cluster | Alto | Media | Media | Arquitectura / contenido |
| S-EJEC-01 | Ejecutar el plan de enlazado interno ya documentado (`SEO_INTERNAL_LINKING_V1_01.md`) | Alto | Media | Media | Arquitectura |
| T-01 | Hub `/herramientas` ausente del sitemap y sin schema | Bajo | Baja | Baja | SEO técnico |
| T-10 | `lastModified` de `coreRoutes` no fiable | Bajo | Baja | Baja | SEO técnico |
| RB-03 | `siteName` inconsistente en 1 página | Bajo | Baja | Muy baja | SEO técnico |
| S-04 | Gap editorial: `calculadora-inflacion` y `regla-50-30-20` sin artículo de respaldo | Alto (potencial) | Baja (bloqueado por datos) | Media | Contenido |
| S-09 | Cobertura BOFU limitada a un único comparativo (`kakebo-vs-ynab`) | Medio | Baja | Media | Contenido |
| G-03 | Autoría genérica sin verificar en 14 de 15 artículos | Bajo | Baja | Baja | Contenido / GEO |
| G-08 | Sin página FAQ global | Bajo | Baja | Media | GEO |
| RC-02 | Cadencia de medición GSC dependiente de ejecución puntual futura | Medio | Media (fecha ya fijada: 2026-07-17/31) | Baja | Medición |
| RC-01 | Dependencia de una sola URL tractora | Alto | Media (estructural, no urgente en sí misma) | Alta (requiere diversificación real, no un fix) | Estratégico / arquitectura |

*No se proponen tareas concretas de ejecución en este documento — solo priorización, tal como exige el alcance de esta auditoría.*

---

## 13. Conclusiones

1. **El sitio está técnicamente sano y semánticamente coherente**, con una base GEO notablemente más madura que la de un proyecto de este tamaño en una etapa comparable — el trabajo de definición de entidad, glosario y schema de Home es el bloque mejor ejecutado de todo el roadmap reciente.
2. **El problema dominante hoy no es de diagnóstico sino de ejecución.** Los hallazgos de mayor prioridad (T-13, G-12, enlazado interno) ya están identificados y documentados desde hace días; lo que falta es la ejecución, no más auditoría.
3. **La dependencia de una sola URL tractora sigue siendo el riesgo estructural más importante** del proyecto, y no se resuelve con una tarea puntual sino con la maduración sostenida de al menos un segundo pilar (`como-hacer-un-presupuesto-personal` es el candidato más cercano) y la ejecución del enlazado interno que redistribuya autoridad hacia `metodo-kakebo-guia-definitiva`.
4. **La disciplina de medición implantada en julio es un activo en sí mismo** — el proyecto ya sabe qué mirar y cuándo mirarlo (snapshot 2026-07-17/31). El riesgo ahora es de constancia, no de método.
5. **No se recomienda abrir ningún bloque de contenido nuevo todavía.** Tanto el plan (`SEO_ROADMAP_V1.md`) como esta auditoría coinciden: el enlazado interno y la validación de datos GSC deben cerrarse antes de crear las dos piezas editoriales de respaldo pendientes (inflación, 50/30/20).
6. **Próximo hito natural:** el snapshot GSC del 2026-07-17/31 determinará si el sprint de canibalización EN/ES funcionó, si `como-hacer-un-presupuesto-personal` empieza a mostrar tracción, y si la corrección de T-13 era necesaria o si Google ya gestionaba correctamente la contradicción. Es el punto de decisión natural para la siguiente fase del roadmap.

---

*SEO_GEO_DEEP_AUDIT_01.md — actualizado 2026-07-07*
*Verificación independiente contra código fuente real — sin hallazgos nuevos respecto a la revisión de 2026-07-06 (no hubo cambios de código en el intervalo)*
*Sin cambios en código, contenido ni configuración SEO — solo documentación.*
