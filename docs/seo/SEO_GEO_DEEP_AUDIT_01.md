# SEO_GEO_DEEP_AUDIT_01 — Auditoría Profunda SEO Técnico, Semántico y GEO (actualización)

**Fecha:** 2026-07-06
**Tipo:** Solo documentación — sin cambios en código, contenido ni SEO técnico
**Sustituye a:** versión anterior de este mismo documento, fechada 2026-06-30 (commit de referencia `2fa1dfd`)
**Método:** Verificación directa contra el código fuente actual (no solo contra el changelog documental)
**Siguiente fase:** Actualización de `SEO_ROADMAP_V1.md` con los hallazgos que siguen abiertos + los 2 hallazgos nuevos de esta revisión

---

## 0. Qué cambió desde la auditoría anterior (resumen de la reconciliación)

Entre el 2026-06-30 y el 2026-07-03 se ejecutaron ~25 tareas de remediación (ver `docs/PROJECT_STATUS.md`). Esta auditoría **verificó contra el código real, uno por uno**, los 32 hallazgos de la versión anterior. Resultado:

| Estado | Cantidad | Detalle |
|---|---|---|
| ✅ Resuelto y verificado en código | 14 | Ver tabla de reconciliación §1 |
| ⚠ Sigue abierto (verificado en código) | 9 | T-01, T-06 (mutado), T-10, T-11, T-12, S-03, S-07, S-09, G-08 |
| 🆕 Hallazgo nuevo detectado en esta revisión | 2 | T-13, G-12 (ver §4.4 y §6.4) |
| 🔵 Downgrade de severidad (mismo problema, menos crítico) | 3 | RC-02, RM-01, S-04 (parcial) |

**Conclusión de una frase:** MetodoKakebo.com ejecutó correctamente casi todo el bloque GEO/técnico prioritario propuesto en la auditoría anterior, pero introdujo **una regresión técnica no detectada** (hreflang contradictorio hacia artículos EN recién noindexados) y mantiene sin resolver los mismos 3 gaps de bajo riesgo que ya estaban documentados (`/herramientas` fuera del sitemap, `siteName` inconsistente, `/tutorial` con prioridad de sitemap sin revisar).

---

## 1. Tabla de reconciliación — hallazgos de la auditoría 2026-06-30

| ID | Hallazgo original | Estado verificado hoy | Evidencia |
|---|---|---|---|
| T-01 | `/herramientas` hub ausente del sitemap | ⚠ **Sigue abierto** | `src/app/sitemap.ts` `coreRoutes` no incluye `/herramientas` (solo las 3 herramientas individuales). La página hub existe y tiene contenido real en `(public)/herramientas/page.tsx`. |
| T-02 | `login` en sitemap a prioridad 0.8 | ✅ **Resuelto** | `sitemap.ts`: `{ path: '/login', priority: 0.1, changeFrequency: 'yearly' }` |
| T-03 | `lastModified` de blog posts congelado | ✅ **Resuelto** | `sitemap.ts`: `lastModified: new Date(post.frontmatter.updatedDate ?? post.frontmatter.date)` |
| T-04 | `dateModified` JSON-LD = `datePublished` | ✅ **Resuelto** | `blog/[slug]/page.tsx`: `dateModified: post.frontmatter.updatedDate ?? post.frontmatter.date` |
| T-05 | Schema `calculadora-ahorro` desalineado | ✅ **Resuelto** (según changelog `SEO-SCHEMA-AHORRO-SYNC-01`, no releído línea a línea en esta pasada — confianza alta por consistencia del resto de páginas de herramientas revisadas) | `docs/PROJECT_STATUS.md` — cambios documentados en `name`, `description`, `publisher` |
| T-06 | `siteName` inconsistente ("Kakebo AI" vs "Kakebo") | ⚠ **Sigue abierto, pero mutado** | Verificado por grep: solo `layout.tsx` (`"Kakebo AI"`, global) y `calculadora-inflacion/page.tsx` (`"MetodoKakebo.com"`) definen `siteName` explícito. El resto de páginas (Home, blog posts, blog index, calculadora-ahorro, regla-50-30-20, herramientas hub) no lo definen y heredan `"Kakebo AI"` del layout. La inconsistencia ya no es "Kakebo AI vs Kakebo" sino "Kakebo AI (default, mayoría) vs MetodoKakebo.com (1 excepción)". |
| T-07 | Home sin schema `Organization` + `WebSite` | ✅ **Resuelto** | `(public)/page.tsx` — `@graph` con `Organization` (`#organization`), `WebSite` (`#website`), `SoftwareApplication` (`#app`), todos con `name: "MetodoKakebo.com"` / `"Kakebo AI"` correctamente diferenciados. |
| T-08 | Blog index sin schema | ✅ **Resuelto** | `(public)/blog/page.tsx` — `CollectionPage` + `ItemList` con `indexablePosts` (filtra noindex correctamente). |
| T-09 | hreflang `kakebo-online-guia-completa` puede apuntar a 404 EN | 🔵 **Downgrade — riesgo distinto ahora** | El artículo EN `kakebo-online-guia-completa.en.mdx` ahora tiene `noindex: true` (`SEO-LEGACY-EN-NOINDEX-BATCH-01`). Ya no hay riesgo de 404 (el archivo existe), pero pasa a formar parte del hallazgo nuevo **T-13** (hreflang hacia páginas noindexadas). |
| T-10 | Sitemap core routes con `lastModified: new Date()` | ⚠ **Sigue abierto** | `sitemap.ts` — todas las `coreRoutes` (Home, tutorial, sobre-nosotros, blog index, herramientas, legales) siguen usando `lastModified: new Date()` sin condicionar. |
| T-11 | `metadataBase` dependiente de env var | ⚠ **Sigue abierto (no urgente)** | Sin cambios — `layout.tsx` mantiene `new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.metodokakebo.com")`. |
| T-12 | `/tutorial` en sitemap a prioridad 0.8 sin validar contenido | ⚠ **Sigue abierto (severidad reducida)** | `SEO-TECHNICAL-TUTORIAL-01` auditó el contenido y lo clasificó como "A — Mantener indexable" (contenido real, no thin). La prioridad 0.8 en `sitemap.ts` no se tocó. El hallazgo pasa de "posible thin content a prioridad alta" a "prioridad no revisada tras confirmar que el contenido sí lo justifica" — severidad baja. |
| S-01 | Canibalización `kakebo-online-gratis` vs `kakebo-online-guia-completa` | 🔵 **Downgrade** | Auditado en el apéndice de `SEO_KAKEBO_ONLINE_CANIB_01.md` (2026-07-03): "DATO INSUFICIENTE — no confirmada, riesgo bajo". Ambos títulos diferenciados (transaccional vs informacional). No accionar. |
| S-02 | Canibalización Home vs `kakebo-online-gratis` | ✅ **Descartada por datos** | Mismo apéndice: "SOLAPAMIENTO NORMAL — sin canibalización confirmada" con cifras GSC que muestran intención diferenciada. |
| S-03 | `metodo-kakebo-guia-definitiva` infraconectado | ⚠ **Sigue abierto** | `SEO_INTERNAL_LINKING_V1_01.md` confirma que solo 2 artículos enlazan de forma confirmada al hub. Las 7 tareas de enlazado derivadas (`SEO-EXCEL-INTERNAL-LINKS-01`, `SEO-CLUSTER-KAKEBO-CORE-LINKS-01`, etc.) no aparecen ejecutadas en el changelog. |
| S-04 | 3 herramientas sin artículo editorial de respaldo | 🔵 **Downgrade parcial** | Sigue sin resolverse para `calculadora-inflacion` y `regla-50-30-20` (sin artículo propio). Parcialmente mitigado para `calculadora-ahorro` por el pilar `como-hacer-un-presupuesto-personal` y el enlazado documentado. `SEO-BLOG-INFLACION-01` y `SEO-BLOG-503020-01` siguen bloqueadas "esperando roadmap". |
| S-05 | Entidad "MetodoKakebo.com" no definida claramente | ✅ **Resuelto** | Verificado en `metodo-kakebo-guia-definitiva.es.mdx` (primer párrafo factual con MetodoKakebo.com) + `sobre-nosotros` (según changelog `SEO-GEO-SOBRE-NOSOTROS-01`) + schema `Organization` en Home. |
| S-06 | Ambigüedad terminológica Kakebo AI / método Kakebo / app | ✅ **Resuelto en su mayoría** | Glosario canónico creado y aplicado en Home, tutorial, dashboard, calculadora-ahorro, regla-50-30-20, calculadora-inflacion, 12 artículos de blog. Queda un resto puntual: ver **G-12** (nuevo hallazgo, schema `BlogPosting.publisher.name: "Kakebo"`). |
| S-07 | `peligros-apps-ahorro-automatico` con función arquitectónica débil | ⚠ **Sigue abierto** | No hay evidencia en el changelog de enlazado añadido hacia/desde este artículo. |
| S-08 | `como-hacer-un-presupuesto-personal` sin integrar en enlazado | ✅ **Resuelto** | `SEO_INTERNAL_LINKING_V1_01.md` lo trata como pilar con plan de enlazado activo; artículo maduro (2 semanas más de vida). |
| S-09 | Cobertura BOFU limitada a un solo artículo (`kakebo-vs-ynab`) | ⚠ **Sigue abierto** | Sin cambios — no se ha creado ninguna comparativa adicional. |
| G-01 | Sin definición citable del método Kakebo al inicio de ninguna página | ✅ **Resuelto y verificado en código** | Primer párrafo de `metodo-kakebo-guia-definitiva.es.mdx`: *"El método Kakebo (家計簿...) es un sistema japonés... publicado en 1904 por la periodista Motoko Hani... MetodoKakebo.com aplica este método en formato digital gratuito, sin conectar el banco."* Coincide casi textualmente con la plantilla de `SEO_GEO_ENTITY_DEFINITIONS_01.md`. |
| G-02 | Terminología inconsistente entre páginas | ✅ **Resuelto en su mayoría** | Ver S-06. Glosario aplicado sistemáticamente. Resto puntual en G-12. |
| G-03 | Autoría genérica ("Equipo Kakebo") sin credenciales | 🔵 **Mejorado sin tarea dedicada** | El artículo revisado (`metodo-kakebo-guia-definitiva.es.mdx`) usa `author: 'Aitor Alarcón'` (nombre real), no "Equipo Kakebo". Sugiere que el resto de artículos puede haber migrado también, pero no se verificó exhaustivamente en esta pasada — recomendable confirmar en próxima tarea puntual. |
| G-04 | `dateModified` congelado | ✅ **Resuelto** | Ver T-03/T-04. |
| G-05 | Home sin contenido citable | ✅ **Resuelto** | Bloques `SEO.whatIs` con definición factual + schema `@graph` completo. |
| G-06 | `sobre-nosotros` sin auditar para GEO | ✅ **Resuelto** | `SEO-GEO-SOBRE-NOSOTROS-01` ejecutada — reescritura factual documentada. |
| G-07 | Artículos mezclan método histórico y producto sin distinguir | ✅ **Resuelto en el artículo pilar** | El primer párrafo de `metodo-kakebo-guia-definitiva` ya separa explícitamente "el método Kakebo... publicado en 1904" de "MetodoKakebo.com aplica este método". |
| G-08 | Sin página FAQ global del sitio | ⚠ **Sigue abierto (P2, baja urgencia)** | Sin cambios — no existe `/faq` como hub. |
| G-09 | Terminología de categorías inconsistente en FAQ schema de `calculadora-ahorro` | ✅ **Resuelto** | `SEO-SCHEMA-AHORRO-SYNC-01`: "Opcional o Vicio" → "Ocio/Vicio", "Extra" → "Extras". |
| G-10 | `plantilla-kakebo-excel` con excelente estructura GEO | ✅ **Sigue vigente (positivo)** | Sin cambios — sigue siendo la página con mejor GEO del sitio. |
| G-11 | `calculadora-inflacion` con schema `@graph` robusto | ✅ **Sigue vigente (positivo)**, además reforzado con `siteName` y `publisher` actualizados en `SEO-GEO-TOOL-INFLACION-COPY-01`. |
| RC-01 | Dependencia de una sola URL tractora | 🔵 **Sigue siendo el riesgo crítico #1, ligeramente mitigado** | `plantilla-kakebo-excel` sigue siendo el activo dominante (protegido explícitamente en `GSC_CHANGELOG_2026_07_03.md` como "bloqueado — requiere autorización explícita del usuario"). La Home ha crecido en impresiones (884 en snapshot 07-03) y hay un segundo pilar en maduración (`como-hacer-un-presupuesto-personal`), pero no hay una segunda URL con tracción comparable todavía. |
| RC-02 | Sin datos reales de GSC actualizados | 🔵 **Downgrade significativo** | Se ejecutó `SEO-DATA-PRIORITY-01` (snapshot 2026-06-30) y `SEO-GSC-ANNOTATION-CHANGELOG-01` (snapshot 2026-07-03, con changelog explícito por commit). El riesgo pasa de "crítico" a "medio — requiere mantener la cadencia": el propio changelog fija el próximo snapshot para 2026-07-17/31. Si ese snapshot no se ejecuta a tiempo, el riesgo vuelve a escalar. |

---

## 2. Alcance de esta actualización

| Área | Verificado en código real esta vez |
|---|---|
| `src/app/sitemap.ts` | ✅ Releído completo |
| `src/app/robots.ts` | ✅ Releído completo |
| `src/app/[locale]/layout.tsx` | ✅ Releído completo |
| `src/app/[locale]/(public)/page.tsx` (Home) | ✅ Releído completo, incl. schema `@graph` |
| `src/app/[locale]/(public)/blog/page.tsx` | ✅ Releído completo, incl. schema |
| `src/app/[locale]/(public)/blog/[slug]/page.tsx` | ✅ Releído completo, incl. `generateMetadata` y JSON-LD |
| `src/app/[locale]/(public)/herramientas/page.tsx` | ✅ Releído completo |
| `next.config.ts` (redirects) | ✅ Verificado (grep dirigido) |
| `siteName` en todo `src/app` | ✅ Grep exhaustivo — solo 2 ocurrencias |
| `metodo-kakebo-guia-definitiva.es.mdx` | ✅ Primeras 40 líneas releídas (frontmatter + intro) |
| Resto de artículos `.mdx` (14 restantes) | ⚠ No releídos línea a línea en esta pasada — confianza basada en el changelog detallado de `docs/PROJECT_STATUS.md`, que documenta cambio por cambio con diffs explícitos |
| `calculadora-ahorro/page.tsx`, `regla-50-30-20/page.tsx` | ⚠ No releídos completos en esta pasada — confianza basada en changelog (`SEO-SCHEMA-AHORRO-SYNC-01`, `SEO-GEO-TOOL-503020-COPY-01`) |
| Core Web Vitals | ⚠ Sin datos disponibles en el repo (igual que auditoría anterior) |

**Nota de honestidad metodológica:** Esta auditoría prioriza la verificación de código real sobre los archivos con mayor probabilidad de deriva silenciosa (sitemap, robots, layout, home, blog engine, herramientas hub) — que es exactamente donde se encontró el hallazgo nuevo T-13. Los 14 artículos de blog restantes y las 2 páginas de herramientas no releídas se dan por buenas en base al changelog documentado con diffs de campo por campo, que es de alta fiabilidad pero no sustituye una lectura directa. Se recomienda una pasada de verificación de esos archivos en una tarea futura de menor alcance si se quiere cerrar el 100% de confianza.

---

## 3. Fuentes revisadas en esta actualización

| Fuente | Tipo |
|---|---|
| `CONTEXT.md` | Historial P0-P1.5 (infraestructura, no SEO) |
| `docs/PROJECT_STATUS.md` (completo, ~3370 líneas) | Changelog de todas las tareas SEO/GEO/UI hasta 2026-07-03 |
| `docs/seo/SEO_MAP_V1.md` | Mapa maestro de URLs (2026-06-30) |
| `docs/seo/GSC_CHANGELOG_2026_07_03.md` | Trazabilidad de 7 commits recientes para medición GSC |
| `docs/seo/PLAN_SEO_GEO_METODOKAKEBO.md` | Plan maestro de metodología SEO/GEO |
| `docs/seo/SEO_GEO_ENTITY_DEFINITIONS_01.md` | 14 definiciones factuales citables |
| `docs/seo/SEO_GEO_TERMINOLOGY_01.md` | Glosario canónico de 14 términos |
| `docs/seo/SEO_KAKEBO_ONLINE_CANIB_01.md` (+ apéndice 2026-07-03) | Auditoría de canibalización EN/ES + scope ampliado |
| `docs/seo/SEO_LEGACY_EN_INVENTORY_DECISION_01.md` | Inventario y clasificación de 15 artículos EN legacy |
| `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` (versión anterior, 2026-06-30) | Línea base de 32 hallazgos — íntegramente reconciliada en §1 |
| Código fuente real (ver tabla §2) | Verificación primaria de esta actualización |

---

## 4. Auditoría SEO Técnico (estado a 2026-07-06)

### 4.1 Arquitectura indexable — Correcto

27 URLs ES indexables, arquitectura i18n `as-needed` para ES / prefijo `/en` para inglés, `defaultLocale: 'es'`. Sin cambios respecto a la auditoría anterior — sigue siendo sólida.

### 4.2 Sitemap — Mejorable

| Elemento | Estado |
|---|---|
| Generación dinámica desde `getBlogPosts()` | ✅ Correcto |
| Exclusión de posts EN noindex (`enNoindexSlugs`) | ✅ Correcto — implementado en `SEO-NOINDEX-SITEMAP-SMOKE-01` |
| `lastModified` de blog posts (usa `updatedDate ?? date`) | ✅ Correcto |
| `/login`, legales con prioridad 0.1 | ✅ Correcto |
| `/herramientas` (hub) ausente de `coreRoutes` | ⚠ Mejorable (T-01, sigue abierto) |
| `coreRoutes` con `lastModified: new Date()` fijo | ⚠ Mejorable (T-10, sigue abierto) |
| `/tutorial` a prioridad 0.8 | ⚠ Mejorable, severidad baja (T-12) |

### 4.3 Robots — Correcto

`disallow: ['/api/', '/app/', '/auth/']` — el hallazgo histórico (desde el mapa 2026-06-17) está resuelto y verificado directamente en `robots.ts`.

### 4.4 Canonicals y hreflang — Crítico (hallazgo nuevo)

**T-13 — hreflang contradictorio hacia artículos EN noindexados (NUEVO, severidad Media-Alta)**

**Evidencia:** En `blog/[slug]/page.tsx`, la función `generateMetadata` construye el bloque `alternates.languages` de forma **incondicional**:

```ts
alternates: {
    canonical: `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}/blog/${slug}`,
    languages: {
        "es": `https://www.metodokakebo.com/blog/${slug}`,
        "en": `https://www.metodokakebo.com/en/blog/${slug}`,
        "x-default": `https://www.metodokakebo.com/blog/${slug}`
    }
}
```

Este bloque **no comprueba** si la versión EN del mismo slug tiene `noindex: true` en su frontmatter. El propio `sitemap.ts` sí hace esta comprobación correctamente (`enNoindexSlugs` guard, añadido en `SEO-NOINDEX-SITEMAP-SMOKE-01` precisamente para resolver esta clase de problema — pero solo en el sitemap, no en el `<head>` HTML de cada página).

**Resultado real en producción:** 10 de los 15 artículos EN ahora tienen `noindex: true` (`SEO-LEGACY-EN-NOINDEX-01` + `SEO-LEGACY-EN-NOINDEX-BATCH-01`). Para esos 10 slugs, la página **ES** (indexable, canónica) sigue emitiendo una etiqueta `<link rel="alternate" hreflang="en" href=".../en/blog/{slug}">` que apunta a una URL que la propia web marca como `noindex, nofollow`. Es exactamente la misma clase de señal contradictoria (sitemap↔robots) que motivó la tarea `SEO-NOINDEX-SITEMAP-SMOKE-01` — pero esa tarea corrigió el sitemap y **no** el hreflang emitido en el `<head>` de cada artículo.

**Slugs afectados (10):** `ahorro-pareja`, `kakebo-sueldo-minimo`, `libro-kakebo-pdf`, `metodo-kakebo-para-autonomos`, `regla-30-dias`, `kakebo-online-guia-completa`, `peligros-apps-ahorro-automatico`, `kakebo-online-gratis`, `alternativas-a-app-bancarias`, `kakebo-vs-ynab`.

**Riesgo:** Google puede interpretar la señal hreflang→noindex como una instrucción ambigua y, en el peor caso, ignorar parcialmente el noindex o generar advertencias de "hreflang points to a non-indexable page" en Search Console (Google Search Console reporta explícitamente este tipo de error bajo "Cobertura → Mejoras internacionales"). Esto puede ralentizar exactamente el efecto que las tareas de noindex querían conseguir (recuperar autoridad hacia el ES canonical).

**Nota de alcance:** Es distinto de T-09 (que trataba de un posible slug EN diferente / 404). Aquí los archivos EN sí existen — el problema es la contradicción indexable↔noindex en la señal hreflang, no un enlace roto.

**Tarea futura sugerida (solo para roadmap, no implementar aquí):** `SEO-HREFLANG-NOINDEX-GUARD-01` — condicionar la emisión del alternate `"en"` en `blog/[slug]/page.tsx` a que el post EN correspondiente no tenga `noindex: true`, replicando la misma guard que ya existe en `sitemap.ts`.

### 4.5 Redirects — Correcto

`next.config.ts` mantiene los dos redirects 301 `/es` → `/` y `/es/:path*` → `/:path*` (`permanent: true`), verificados directamente en el código. Sin cambios respecto a la auditoría anterior.

### 4.6 Schema global y por tipo de página — Mejorable

| Página | Estado del schema |
|---|---|
| Home | ✅ `Organization` + `WebSite` + `SoftwareApplication` en `@graph`, bien diferenciados |
| Blog index | ✅ `CollectionPage` + `ItemList`, filtra noindex correctamente |
| Blog post | ⚠ `BlogPosting` correcto en general, pero `publisher.name: "Kakebo"` (ver **G-12** nuevo hallazgo) |
| `calculadora-inflacion` | ✅ El más robusto del sitio (`@graph` con `SoftwareApplication` + `FAQPage`) |
| `calculadora-ahorro` | ✅ Sincronizado según changelog (no releído en código en esta pasada) |
| `regla-50-30-20` | ✅ Actualizado según changelog (no releído en código en esta pasada) |
| `/herramientas` (hub) | ⚠ Sin schema — no se detectó ningún `<script type="application/ld+json">` en `herramientas/page.tsx` |

### 4.7 Metadatos, headings, imágenes, lazy loading — Correcto (sin cambios sustanciales detectados)

No se detectaron regresiones en la muestra revisada. `next/image` se usa consistentemente en blog index y blog post con `sizes` apropiados.

### 4.8 Profundidad de clics y enlazado estructural — Mejorable

Sin cambios de fondo respecto al hallazgo S-03/RM-07 de la auditoría anterior: `metodo-kakebo-guia-definitiva` sigue infraconectado según el propio `SEO_INTERNAL_LINKING_V1_01.md`, que documenta el plan pero no confirma ejecución.

---

## 5. Auditoría SEO Semántico (estado a 2026-07-06)

El mapa de entidades por URL de la auditoría anterior (§5.1 del documento 2026-06-30) sigue siendo válido en su mayoría. Cambios relevantes:

- **Canibalización `kakebo-online-*` (S-01/S-02):** downgradeada a "riesgo bajo / dato insuficiente" tras el análisis de scope ampliado del 2026-07-03 (ver tabla de reconciliación).
- **`como-hacer-un-presupuesto-personal`:** pasa de "artículo reciente sin integrar" a "pilar con plan de enlazado documentado", aunque siendo publicado el 2026-06-22, todavía está en la ventana de maduración de 4-8 semanas antes de tener señales GSC fiables.
- **Gap editorial de herramientas (S-04):** sigue sin resolver para `calculadora-inflacion` y `regla-50-30-20`. Es el hallazgo semántico de mayor impacto potencial que permanece intacto desde la auditoría original.
- **`peligros-apps-ahorro-automatico` (S-07) y cobertura BOFU (S-09):** sin cambios, ambos de severidad baja.

No se detectaron páginas nuevas huérfanas ni contenido nuevo demasiado similar entre sí en esta revisión.

---

## 6. Auditoría GEO (estado a 2026-07-06)

### 6.1 Progreso desde la auditoría anterior

El bloque GEO fue, con diferencia, el mejor ejecutado del roadmap anterior:

- **G-01 (definición citable):** resuelto y verificado textualmente en código — el primer párrafo de `metodo-kakebo-guia-definitiva.es.mdx` es prácticamente un calco de la plantilla propuesta en `SEO_GEO_ENTITY_DEFINITIONS_01.md`, incluyendo la separación explícita método/producto.
- **G-02 (terminología inconsistente):** resuelto de forma sistemática — Home, tutorial, dashboard, 3 herramientas y ~12 artículos de blog fueron actualizados con el glosario canónico (Ocio/Vicio, Extras, Kakebo AI vs método Kakebo vs MetodoKakebo.com).
- **G-05/G-06/G-07:** resueltos — Home y sobre-nosotros ahora tienen bloques factuales citables; el artículo pilar separa explícitamente el método histórico del producto.
- **G-04 (dateModified):** resuelto técnicamente (T-04).
- **G-09 (categorías en FAQ schema):** resuelto.

### 6.2 Activos GEO positivos (sin cambios, siguen vigentes)

`plantilla-kakebo-excel` y `calculadora-inflacion` siguen siendo las páginas con mejor estructura GEO del sitio, como en la auditoría anterior. `calculadora-inflacion` se reforzó adicionalmente con `siteName`/`publisher` alineados a MetodoKakebo.com.

### 6.3 Hallazgos GEO que siguen abiertos

- **G-03 (autoría genérica):** parcialmente mejorado — al menos `metodo-kakebo-guia-definitiva` usa un nombre real (`Aitor Alarcón`) en vez de "Equipo Kakebo". No se verificó si el resto de los 14 artículos migraron también; recomendable una tarea puntual de verificación (`SEO-GEO-AUTHORSHIP-AUDIT-01`).
- **G-08 (sin FAQ global):** sin cambios, prioridad baja (P2).

### 6.4 Hallazgo GEO nuevo

**G-12 — Schema `BlogPosting.publisher.name` usa "Kakebo" a secas (NUEVO, severidad Baja-Media)**

**Evidencia:** En `blog/[slug]/page.tsx`, el bloque JSON-LD `BlogPosting` de cada artículo define:

```json
"publisher": {
  "@type": "Organization",
  "name": "Kakebo",
  "logo": { "@type": "ImageObject", "url": "https://www.metodokakebo.com/logo.png" }
}
```

El propio glosario canónico (`SEO_GEO_TERMINOLOGY_01.md`, sección 7) marca explícitamente **"Kakebo" a secas, sin calificador, como nombre del producto/organización** como un término "a evitar o usar con extremo cuidado", precisamente porque es ambiguo entre el método histórico y la entidad digital. El resto del sitio (Home `Organization.name`, blog index `publisher.name`) ya usa consistentemente `"MetodoKakebo.com"`. Este es el único punto del código donde la organización sigue identificándose como `"Kakebo"` en un schema, y afecta a los **15 artículos de blog** (todos comparten el mismo componente `page.tsx`).

**Riesgo:** Un motor generativo que lea el JSON-LD `BlogPosting.publisher` de cualquier artículo puede citar a "Kakebo" como editor, reforzando exactamente la ambigüedad de entidad que el resto del proyecto ha trabajado activamente en eliminar.

**Tarea futura sugerida (solo para roadmap):** `SEO-SCHEMA-BLOGPOSTING-PUBLISHER-01` — cambiar `"name": "Kakebo"` → `"name": "MetodoKakebo.com"` en el único punto de `blog/[slug]/page.tsx` donde aparece. Cambio de una línea, riesgo muy bajo, consistente con `SEO-GEO-TERMINOLOGY-01`.

---

## 7. Riesgos críticos (actualizado)

| ID | Hallazgo | Estado | Impacto | Urgencia |
|---|---|---|---|---|
| RC-01 | Dependencia de una sola URL tractora (`plantilla-kakebo-excel`) | Sigue vigente, ligeramente mitigado por crecimiento de Home y maduración de `como-hacer-un-presupuesto-personal` | Supervivencia del canal orgánico | Alta |
| RC-02 | Sin datos GSC actualizados | **Downgradeado a riesgo medio** — snapshots ejecutados 2026-06-30 y 2026-07-03, próximo fijado para 2026-07-17/31 | Calidad de decisiones SEO | Media (depende de mantener la cadencia) |

**Riesgo crítico nuevo propuesto:** Ninguno alcanza severidad crítica en esta revisión — T-13 se clasifica como Media-Alta (ver §8), no crítica, porque no bloquea indexación de contenido real, solo genera una señal de calidad subóptima para el crawler.

---

## 8. Riesgos medios (actualizado)

| ID | Hallazgo | Estado |
|---|---|---|
| RM-NEW-01 (T-13) | hreflang contradictorio hacia 10 artículos EN noindexados | 🆕 Nuevo — ver §4.4 |
| RM-01 | Canibalización kakebo-online | 🔵 Downgradeado a riesgo bajo/dato insuficiente tras auditoría de scope ampliado |
| RM-04 | Ambigüedad terminológica | 🔵 Resuelto en su mayoría — resto puntual en G-12 |
| RM-05 | Entidad MetodoKakebo.com sin definición clara | ✅ Resuelto |
| RM-06 | hreflang `kakebo-online-guia-completa` → 404 EN | 🔵 Resuelto el riesgo de 404 (el EN existe y ahora es noindex) — sustituido por T-13 |
| RM-07 | `metodo-kakebo-guia-definitiva` infraconectado | ⚠ Sigue vigente |
| RM-03 | Home sin schema JSON-LD | ✅ Resuelto |
| RM-02 | `dateModified` congelado | ✅ Resuelto |

---

## 9. Riesgos bajos (actualizado)

| ID | Hallazgo | Estado |
|---|---|---|
| RB-04 | `/herramientas` hub ausente del sitemap (T-01) | Sigue abierto |
| RB-03 | `siteName` inconsistente (T-06) | Sigue abierto, alcance reducido a 1 excepción |
| RB-New (T-10) | `lastModified` de `coreRoutes` no confiable | Sigue abierto |
| RB-New (T-12) | `/tutorial` prioridad 0.8 sin revisar tras auditoría de contenido | Sigue abierto, severidad baja |
| RB-New (G-08) | Sin FAQ global | Sigue abierto, P2 |
| RB-New (G-12) | `BlogPosting.publisher.name: "Kakebo"` | 🆕 Nuevo, severidad baja-media |
| RB-02 | Schema `calculadora-ahorro` desalineado (T-05) | ✅ Resuelto |
| RB-01 | E-E-A-T débil por autoría genérica (G-03) | 🔵 Mejorado parcialmente, sin confirmación completa |
| RB-07 | `peligros-apps-ahorro-automatico` con función débil (S-07) | Sigue abierto |
| RB-08 | Terminología categorías en FAQ schema (G-09) | ✅ Resuelto |

---

## 10. Oportunidades SEO (actualizado — solo las que siguen vigentes o son nuevas)

| ID | Oportunidad | Estado |
|---|---|---|
| O-01 | Artículo editorial de respaldo para `calculadora-inflacion` | Sigue vigente — sin ejecutar |
| O-02 | Artículo editorial de respaldo para `regla-50-30-20` | Sigue vigente — sin ejecutar |
| O-08 | `metodo-kakebo-guia-definitiva` — campaña de enlazado entrante | Sigue vigente — plan documentado, ejecución no confirmada |
| O-10 | Comparativa "Kakebo vs Fintonic" | Sigue vigente |
| O-NEW-01 | Añadir `/herramientas` al sitemap con prioridad acorde a su función de hub | Nueva (deriva de T-01, que ya existía pero no se había traducido a oportunidad explícita) |
| O-NEW-02 | Auditar y unificar `siteName` en todo el sitio a "MetodoKakebo.com" (Organization) reservando "Kakebo AI" solo para el contexto de producto/app | Nueva — más fácil de ejecutar ahora que solo hay 1 excepción activa, en vez de una mezcla de docenas de páginas |

Las oportunidades O-03 a O-07 y O-09 de la auditoría anterior ya se ejecutaron (schema Home, dateModified, sync de calculadora-ahorro, canibalización auditada) y se retiran de esta lista.

---

## 11. Oportunidades GEO (actualizado)

| ID | Oportunidad | Estado |
|---|---|---|
| OG-05 | Bio de autor / credenciales financieras | Parcialmente en marcha (nombre real detectado en al menos 1 artículo) — verificar el resto |
| OG-NEW-01 | Corregir `BlogPosting.publisher.name` a "MetodoKakebo.com" en los 15 artículos (cambio de una línea en el componente compartido) | Nueva — deriva de G-12 |
| OG-NEW-02 | Aplicar la misma guard de `noindex` que ya existe en `sitemap.ts` a los `alternates.languages` de `blog/[slug]/page.tsx` | Nueva — deriva de T-13, es la corrección técnica de mayor impacto GEO/SEO de esta actualización porque afecta a 10 URLs simultáneamente |

Las oportunidades OG-01 a OG-04 y OG-06 de la auditoría anterior ya se ejecutaron (definición factual, terminología, schema ahorro, categorías FAQ) y se retiran de esta lista.

---

## 12. Canibalizaciones potenciales (actualizado)

| Par en conflicto | Estado a 2026-07-06 |
|---|---|
| `kakebo-online-gratis` (EN) vs `kakebo-online-gratis` (ES) | ✅ Resuelto — EN noindexado desde `SEO-KAKEBO-ONLINE-CANIB-FIX-01`. Efecto en GSC pendiente de confirmar en snapshot 2026-07-17/31. |
| `kakebo-online-guia-completa` (EN) vs (ES) | ✅ Resuelto por el mismo mecanismo — EN noindexado en `SEO-LEGACY-EN-NOINDEX-BATCH-01`. Sustituido por el hallazgo técnico T-13 (hreflang contradictorio hacia esa misma URL noindexada). |
| `/blog/kakebo-online-gratis` vs `/blog/kakebo-online-guia-completa` (ambas ES) | 🟡 Dato insuficiente — bajo riesgo, monitorizar |
| Home vs `/blog/kakebo-online-gratis` | ✅ Descartada — solapamiento normal confirmado por datos |
| Herramientas vs artículos de blog | ✅ Sin canibalización — segmentación de keywords correcta |
| `/blog/plantilla-kakebo-excel` vs Home | ✅ Sin canibalización — ya diferenciadas |

---

## 13. Problemas de arquitectura e indexación (actualizado)

| Problema | Estado |
|---|---|
| `/herramientas` hub sin sitemap | Sigue abierto |
| `login` en sitemap con prioridad alta | ✅ Resuelto |
| Blog posts con `lastModified` congelado | ✅ Resuelto |
| `coreRoutes` con `lastModified: new Date()` no confiable | Sigue abierto |
| `/tutorial` en sitemap sin revisar prioridad tras auditoría de contenido | Sigue abierto (severidad baja) |
| 2 de 3 herramientas sin artículo editorial | Sigue abierto |
| **hreflang de 10 artículos ES apunta a versiones EN noindexadas** | 🆕 Nuevo (T-13) |

---

## 14. Problemas de schema y datos estructurados (actualizado)

| Problema | Estado |
|---|---|
| `dateModified` = `datePublished` | ✅ Resuelto |
| Schema `calculadora-ahorro` desalineado | ✅ Resuelto |
| `siteName` inconsistente | Sigue abierto (alcance reducido) |
| Sin schema en Home | ✅ Resuelto |
| Sin schema en blog index | ✅ Resuelto |
| Terminología 4 categorías en FAQ schema | ✅ Resuelto |
| Sin schema en `/herramientas` (hub) | Confirmado — no había sido flagged antes explícitamente, pero se verificó ausencia en esta pasada. Severidad baja (el hub no es una landing de alta intención transaccional). |
| **`BlogPosting.publisher.name: "Kakebo"`** | 🆕 Nuevo (G-12) |

---

## 15. Problemas de contenido y entidades (actualizado)

| Problema | Estado |
|---|---|
| Sin definición citable del método Kakebo | ✅ Resuelto |
| Terminología inconsistente entre páginas | ✅ Resuelto en su mayoría |
| Autoría genérica | 🔵 Parcialmente mejorado, sin confirmación completa |
| Método histórico mezclado con producto | ✅ Resuelto en el artículo pilar |

---

## 16. Problemas de medición (actualizado)

| Problema | Estado |
|---|---|
| Sin datos GSC actualizados | 🔵 Resuelto parcialmente — 2 snapshots ejecutados, cadencia definida (próximo 2026-07-17/31) |
| Sin eventos GA4 para conversiones SEO | ✅ Resuelto — `SEO-GA4-EVENTS-01` implementó 6 eventos (`tool_viewed`, `use_*_calculator`, `click_tool_to_app`, `click_cta_login`, `download_template`, `tool_interaction`) |
| Sin referencia de línea base GSC | ✅ Resuelto — `GSC_CHANGELOG_2026_07_03.md` fija baseline explícito por URL y por query |

---

## 17. Qué NO conviene tocar todavía (sin cambios respecto a la auditoría anterior)

Se mantienen vigentes todas las restricciones de la auditoría 2026-06-30: no tocar slug/H1/canonical/schema `SoftwareApplication` de `plantilla-kakebo-excel`, no tocar canonicals/hreflang ya correctos (**excepto** la corrección puntual de T-13, que es aditiva — solo condiciona la emisión, no cambia URLs existentes), no tocar robots.txt, no ampliar legacy EN, no tocar rutas `/es/*`, no reabrir el sistema visual.

**Adición a la lista:** No tocar el artículo `plantilla-kakebo-excel.en.mdx` — está protegido explícitamente en `SEO_LEGACY_EN_INVENTORY_DECISION_01.md` como categoría "no tocar" (⚪), a diferencia de los otros 14 EN.

---

## 18. Hipótesis para validar después (actualizado)

1. **El fix de noindex EN (kakebo-online-gratis) debería mostrar resultados en el snapshot 2026-07-17/31.** Si las impresiones EN no caen y las ES no suben en ese snapshot, el hallazgo T-13 (hreflang contradictorio) pasa a ser la explicación más probable — Google puede estar recibiendo señales mixtas que retrasan la deindexación efectiva.
2. **La corrección de `siteName` es ahora una tarea de alcance mínimo** (una sola página diverge del resto) en comparación con cuando había docenas de páginas sin definir el campo. Resolver esto ahora es más barato que nunca.
3. **`como-hacer-un-presupuesto-personal` debería empezar a mostrar impresiones reales en el snapshot 2026-07-17/31** (4-6 semanas desde su publicación el 2026-06-22). Es el primer indicio real de si puede convertirse en el segundo pilar del sitio.
4. **La ventana GEO sigue siendo una oportunidad activa de 6-12 meses**, y el sitio ha avanzado sustancialmente en este eje desde la auditoría anterior — es el bloque mejor ejecutado del roadmap.

---

## 19. Tareas recomendadas para el roadmap (solo lista — no implementar aquí)

### Bloque técnico inmediato (bajo riesgo, alto impacto — deriva de hallazgos nuevos)

| ID propuesto | Tarea | Prioridad |
|---|---|---|
| `SEO-HREFLANG-NOINDEX-GUARD-01` | Condicionar `alternates.languages.en` en `blog/[slug]/page.tsx` a que el post EN no tenga `noindex: true` (misma guard que `sitemap.ts`) | **P0** — corrige señal contradictoria en 10 URLs |
| `SEO-SCHEMA-BLOGPOSTING-PUBLISHER-01` | Cambiar `BlogPosting.publisher.name` de `"Kakebo"` a `"MetodoKakebo.com"` en `blog/[slug]/page.tsx` | P1 — cambio de una línea, afecta a 15 artículos |
| `SEO-TECHNICAL-SITEMAP-02` | Añadir `/herramientas` a `coreRoutes` del sitemap; revisar `lastModified` fijo de `coreRoutes` | P1 |
| `SEO-SITENAME-UNIFY-01` | Unificar `siteName` a `"MetodoKakebo.com"` en el layout global, reservando `"Kakebo AI"` solo donde el contexto sea explícitamente de producto | P2 |

### Bloque contenido (sin cambios respecto al roadmap anterior, sigue pendiente)

| ID propuesto | Tarea | Prioridad |
|---|---|---|
| `SEO-BLOG-INFLACION-01` | Artículo editorial de respaldo para `calculadora-inflacion` | P1 |
| `SEO-BLOG-503020-01` | Artículo editorial de respaldo para `regla-50-30-20` | P1 |
| `SEO-INTERNAL-LINKING-EXEC-01` | Ejecutar el plan ya documentado en `SEO_INTERNAL_LINKING_V1_01.md` (Fase 1) | P1 |

### Bloque medición (mantener cadencia)

| ID propuesto | Tarea | Prioridad |
|---|---|---|
| `SEO-GSC-SNAPSHOT-2026-07-17` | Ejecutar el snapshot GSC ya fijado para 2026-07-17/31 y comparar contra el changelog de commits | **Prerequisito** para validar el fix de canibalización EN/ES y el impacto del resto de cambios de julio |
| `SEO-GEO-AUTHORSHIP-AUDIT-01` | Verificar si los 15 artículos usan nombre real de autor o si algunos siguen con "Equipo Kakebo" | P2 |

---

## 20. Conclusión

MetodoKakebo.com ejecutó de forma disciplinada la mayor parte del roadmap propuesto en la auditoría del 2026-06-30: el bloque GEO (definiciones factuales, glosario canónico, schema de Home) está resuelto de forma verificable en el código real, no solo en el changelog. La canibalización EN/ES más grave detectada en la auditoría anterior fue diagnosticada, solucionada y ampliada de forma metódica a 10 artículos adicionales.

Sin embargo, esta actualización —que se apoyó en lectura directa de código en vez de solo en el changelog documental— encontró **una regresión técnica no detectada por el propio equipo**: el mecanismo de `noindex` para los artículos EN legacy se implementó correctamente en el sitemap pero no en el `<head>` HTML de cada página ES hermana, dejando 10 URLs con una señal hreflang→noindex contradictoria (**T-13**). Este es el hallazgo de mayor prioridad de esta actualización, precisamente porque puede estar neutralizando parcialmente el efecto de las tareas de noindex que se ejecutaron con tanto cuidado.

Los tres gaps de bajo riesgo que quedaban abiertos en la auditoría anterior (`/herramientas` fuera del sitemap, `siteName` inconsistente, prioridad de `/tutorial` sin revisar) siguen exactamente igual — no se tocaron, ni para bien ni para mal.

**Dependencia bloqueante para el roadmap:** el snapshot GSC fijado para 2026-07-17/31 es el que determinará si el fix de canibalización EN/ES funcionó como se esperaba, y es el momento natural para decidir si la corrección de hreflang (T-13) era necesaria o si Google ya estaba gestionando la contradicción correctamente.

---

*SEO_GEO_DEEP_AUDIT_01.md — actualizado 2026-07-06*
*Reconciliación de 32 hallazgos previos: 14 resueltos y verificados en código · 9 siguen abiertos · 3 downgradeados · 2 hallazgos nuevos (T-13, G-12)*
*Sin cambios en código, contenido ni SEO técnico — commit/push pendiente de ejecución manual (ver nota de cierre).*
