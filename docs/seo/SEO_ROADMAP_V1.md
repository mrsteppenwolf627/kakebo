# SEO_ROADMAP_V1 — Roadmap Oficial de Ejecución SEO/GEO

**Fecha:** 2026-07-07
**Tarea:** SEO-ROADMAP-V1-01
**Tipo:** Solo documentación estratégica — sin cambios en código, contenido ni configuración SEO
**Sustituye a:** `SEO_ROADMAP_V1.md` anterior (2026-06-30, commit de referencia `db35559`)
**Basado en:** `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` (2026-07-07), `docs/seo/SEO_MAP_V1.md` (2026-06-30), `docs/seo/GSC_CHANGELOG_2026_07_03.md`, `docs/PROJECT_STATUS.md`, `CONTEXT.md`, `PLAN_SEO_GEO_METODOKAKEBO.md`
**Estado:** Única referencia vigente para priorizar el trabajo SEO/GEO a partir de hoy

---

# 1. Resumen ejecutivo

## Estado actual del proyecto

MetodoKakebo.com tiene la base técnica y GEO más sólida de su historia: definición factual del método Kakebo verificada en código, glosario terminológico aplicado de forma sistemática, schema robusto en Home/blog index/herramientas de mayor tráfico, y una disciplina de medición GSC/GA4 real y documentada. La auditoría `SEO_GEO_DEEP_AUDIT_01.md` (2026-07-07) confirma que no hay hallazgos nuevos desde el 2026-07-06 porque no ha habido commits de código en ese intervalo.

Persisten, sin embargo, dos tipos de deuda muy distintos:

1. **Deuda de ejecución de bajo riesgo y alto impacto** — correcciones ya diagnosticadas, triviales de aplicar, que llevan días documentadas sin ejecutarse (hreflang contradictorio, entidad de marca en schema, hub de herramientas fuera del sitemap).
2. **Deuda estructural de fondo** — dependencia de una sola URL tractora, enlazado interno diseñado pero no ejecutado, y dos huecos editoriales en el cluster de herramientas.

Ninguna de estas dos deudas requiere más auditoría. Requiere secuencia y disciplina de ejecución.

## Objetivos de este roadmap

1. Convertir los 13 hallazgos priorizados de la auditoría en tareas ejecutables, pequeñas, verificables e independientes.
2. Ordenar la ejecución no solo por impacto, sino por riesgo, dependencias y tiempo de espera real (recrawl de Google, maduración de contenido).
3. Dejar explícito qué no debe tocarse todavía y qué evento concreto lo desbloqueará.
4. Servir como única fuente de verdad para decidir "qué toca ahora" en cada sesión de trabajo futura, sustituyendo la improvisación tarea a tarea.

---

# 2. Principios de ejecución

Estos principios no son opcionales. Cualquier tarea que los rompa debe partirse en tareas más pequeñas antes de ejecutarse.

1. **Una tarea, un commit.** Ninguna tarea de este roadmap debe requerir más de un commit para completarse. Si una tarea parece necesitar dos commits, es que en realidad son dos tareas.
2. **Un objetivo por tarea.** No mezclar corrección técnica + contenido, ni SEO + GEO, ni dos URLs distintas, en la misma tarea.
3. **Una validación explícita por tarea.** Cada tarea define de antemano cómo se comprueba que funcionó (build, lectura de código, Rich Results Test, snapshot GSC posterior, etc.). Si no se puede definir la validación, la tarea no está lista para ejecutarse.
4. **Una actualización documental por tarea.** Cada commit debe reflejarse en `docs/PROJECT_STATUS.md` con el mismo formato que las ~40 tareas anteriores (campo, detalle, cambios, validación).
5. **Un push por tarea.** No acumular varias tareas completadas sin pushear — cada tarea cerrada se sube a `origin/main` antes de empezar la siguiente.
6. **No romper este flujo aunque la tarea parezca trivial.** Las correcciones de una línea (como T-13 o G-12) siguen el mismo proceso completo: commit propio, documentación propia, push propio. La disciplina de proceso es la que ha mantenido este proyecto libre de regresiones no detectadas — perderla por "es solo una línea" es exactamente el tipo de atajo que ya causó la regresión T-13 en el sprint anterior.

---

# 3. Backlog priorizado

## Bloque técnico

### `SEO-HREFLANG-NOINDEX-GUARD-01` — ✅ COMPLETADA 2026-07-07

| Campo | Detalle |
|---|---|
| **ID** | SEO-HREFLANG-NOINDEX-GUARD-01 |
| **Estado** | ✅ Completada — commit `fix(seo): resolve hreflang contradiction for EN noindex posts`. Ver `docs/PROJECT_STATUS.md` para el detalle de la corrección y `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` (T-13 marcado como resuelto). |
| **Título** | Condicionar el hreflang EN al estado noindex del post |
| **Descripción** | En `blog/[slug]/page.tsx`, el bloque `alternates.languages` construye la entrada `"en"` de forma incondicional. Debe omitirse (o apuntar a la versión ES) cuando el post EN correspondiente tenga `noindex: true` en su frontmatter, replicando la guard `enNoindexSlugs` ya existente en `sitemap.ts`. |
| **Objetivo** | Eliminar la señal hreflang→noindex contradictoria en 10 URLs (T-13 de la auditoría) |
| **Impacto SEO** | Alto — corrige un error que Search Console puede reportar explícitamente en "Mejoras internacionales" y que puede retrasar la deindexación efectiva de los 10 artículos EN legacy |
| **Impacto GEO** | Medio — mejora la fiabilidad de la señal de idioma/URL canónica que un motor generativo podría cruzar |
| **Dificultad** | Muy baja — una condición sobre un objeto ya existente |
| **Riesgo** | Bajo — solo condiciona la emisión, no cambia ninguna URL activa ni afecta a las 5 URLs EN que sí siguen indexadas |
| **Dependencias** | Ninguna |
| **Archivos afectados** | `src/app/[locale]/(public)/blog/[slug]/page.tsx` |
| **Validación necesaria** | Renderizar `generateMetadata` para los 10 slugs afectados y confirmar que `alternates.languages.en` no aparece (o apunta a ES); confirmar que los 5 slugs EN indexables mantienen su hreflang correcto; build sin errores |
| **Documentación a actualizar** | `docs/PROJECT_STATUS.md` (nueva entrada), `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` (marcar T-13 como resuelto en la próxima actualización) |
| **Prioridad** | **P0** |

---

### `SEO-SCHEMA-BLOGPOSTING-PUBLISHER-01` — ✅ COMPLETADA 2026-07-07

| Campo | Detalle |
|---|---|
| **ID** | SEO-SCHEMA-BLOGPOSTING-PUBLISHER-01 |
| **Estado** | ✅ Completada — commit `fix(seo): unify BlogPosting publisher entity`. Ver `docs/PROJECT_STATUS.md` para el detalle de la corrección y `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` (G-12 marcado como resuelto). |
| **Título** | Corregir `publisher.name` en el schema BlogPosting |
| **Descripción** | Cambiar `"name": "Kakebo"` por `"name": "MetodoKakebo.com"` en el bloque JSON-LD `BlogPosting` de `blog/[slug]/page.tsx`, alineando con el resto del sitio y con el glosario canónico del proyecto |
| **Objetivo** | Eliminar la única fuga de ambigüedad de entidad que queda en schema (G-12 de la auditoría) |
| **Impacto SEO** | Bajo-medio — coherencia de entidad para Google |
| **Impacto GEO** | Medio — afecta a los 15 artículos de blog simultáneamente; reduce el riesgo de que un motor generativo cite "Kakebo" a secas como editor |
| **Dificultad** | Muy baja — cambio de un valor de string |
| **Riesgo** | Muy bajo |
| **Dependencias** | Ninguna |
| **Archivos afectados** | `src/app/[locale]/(public)/blog/[slug]/page.tsx` |
| **Validación necesaria** | Inspeccionar el JSON-LD renderizado de al menos 2 artículos y confirmar `publisher.name: "MetodoKakebo.com"`; Google Rich Results Test sin errores |
| **Documentación a actualizar** | `docs/PROJECT_STATUS.md`, `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` (marcar G-12 como resuelto) |
| **Prioridad** | **P0** |

---

### `SEO-SITEMAP-HERRAMIENTAS-01` — ✅ COMPLETADA 2026-07-07

| Campo | Detalle |
|---|---|
| **ID** | SEO-SITEMAP-HERRAMIENTAS-01 |
| **Estado** | ✅ Completada — commit `fix(seo): include tools hub in sitemap`. Ver `docs/PROJECT_STATUS.md` para el detalle de la corrección y `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` (T-01 marcado como resuelto en su parte de sitemap; el schema del hub sigue pendiente en `SEO-SCHEMA-HERRAMIENTAS-HUB-01`). |
| **Título** | Añadir el hub `/herramientas` a `coreRoutes` del sitemap |
| **Descripción** | Incluir `/herramientas` en el array `coreRoutes` de `sitemap.ts` con una prioridad acorde a su función de hub (entre la de Home y la de las herramientas individuales) |
| **Objetivo** | Cerrar el hallazgo T-01 — el hub deja de estar ausente del sitemap |
| **Impacto SEO** | Bajo-medio — mejora la señal de indexación de una página que agrupa las 3 herramientas de mejor rendimiento relativo |
| **Impacto GEO** | Bajo |
| **Dificultad** | Muy baja |
| **Riesgo** | Muy bajo |
| **Dependencias** | Ninguna |
| **Archivos afectados** | `src/app/sitemap.ts` |
| **Validación necesaria** | `/sitemap.xml` generado localmente incluye `/herramientas` (y su variante `/en/herramientas`) con la prioridad esperada |
| **Documentación a actualizar** | `docs/PROJECT_STATUS.md`, `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` (marcar T-01 como resuelto) |
| **Prioridad** | **P1** |

---

### `SEO-SITEMAP-LASTMODIFIED-01` — ✅ COMPLETADA 2026-07-07

| Campo | Detalle |
|---|---|
| **ID** | SEO-SITEMAP-LASTMODIFIED-01 |
| **Estado** | ✅ Completada — commit `fix(seo): improve sitemap lastModified strategy`. Solución elegida: constante compartida `CORE_ROUTES_LAST_MODIFIED` (no fecha por ruta, no lectura de filesystem). Ver `docs/PROJECT_STATUS.md` para el detalle y justificación, y `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` (T-10 marcado como resuelto). |
| **Título** | Usar fechas fijas de `lastModified` para `coreRoutes` estables |
| **Descripción** | Sustituir `lastModified: new Date()` por una fecha fija (o derivada de un campo real de última edición) para las rutas núcleo que no cambian en cada build: Home, tutorial, sobre-nosotros, blog index, herramientas, legales |
| **Objetivo** | Cerrar el hallazgo T-10 — dejar de enviar una señal de "modificado hoy" falsa en cada build |
| **Impacto SEO** | Bajo — mejora la utilidad de la señal de frescura para priorización de crawl |
| **Impacto GEO** | Ninguno |
| **Dificultad** | Baja |
| **Riesgo** | Muy bajo |
| **Dependencias** | Ninguna |
| **Archivos afectados** | `src/app/sitemap.ts` |
| **Validación necesaria** | `sitemap.xml` generado en dos builds consecutivos sin cambios de contenido muestra el mismo `lastModified` para las `coreRoutes` |
| **Documentación a actualizar** | `docs/PROJECT_STATUS.md`, `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` (marcar T-10 como resuelto) |
| **Prioridad** | **P1** |

---

### `SEO-SITENAME-UNIFY-01`

| Campo | Detalle |
|---|---|
| **ID** | SEO-SITENAME-UNIFY-01 |
| **Título** | Unificar `siteName` a "MetodoKakebo.com" |
| **Descripción** | Corregir la única página que diverge (`calculadora-inflacion/page.tsx` usa `"MetodoKakebo.com"`, el resto hereda `"Kakebo AI"` de `layout.tsx`) para que todo el sitio use el mismo valor de `siteName`, reservando "Kakebo AI" solo donde el contexto sea explícitamente de producto/app (a decidir en la propia tarea cuál de los dos valores debe prevalecer como global) |
| **Objetivo** | Cerrar el hallazgo RB-03 |
| **Impacto SEO** | Bajo |
| **Impacto GEO** | Bajo-medio — coherencia de entidad de marca |
| **Dificultad** | Muy baja — ahora que solo hay una excepción activa |
| **Riesgo** | Bajo |
| **Dependencias** | Ninguna |
| **Archivos afectados** | `src/app/[locale]/layout.tsx` y/o `src/app/[locale]/(landing)/herramientas/calculadora-inflacion/page.tsx` |
| **Validación necesaria** | Grep de `siteName` en `src/app` confirma un único valor consistente en todo el sitio |
| **Documentación a actualizar** | `docs/PROJECT_STATUS.md`, `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` (marcar RB-03 como resuelto) |
| **Prioridad** | **P1** |

---

### `SEO-SCHEMA-HERRAMIENTAS-HUB-01`

| Campo | Detalle |
|---|---|
| **ID** | SEO-SCHEMA-HERRAMIENTAS-HUB-01 |
| **Título** | Añadir schema `CollectionPage`/`ItemList` al hub `/herramientas` |
| **Descripción** | Replicar en `herramientas/page.tsx` el mismo patrón de schema ya implementado y validado en el blog index (`CollectionPage` con `mainEntity: ItemList` de las 3 herramientas) |
| **Objetivo** | Dotar al hub de la misma elegibilidad de rich results que ya tiene el blog index |
| **Impacto SEO** | Bajo-medio |
| **Impacto GEO** | Bajo-medio — mejora la estructura de conocimiento del hub |
| **Dificultad** | Baja — patrón ya existente y probado en el blog index, solo hay que reutilizarlo |
| **Riesgo** | Muy bajo |
| **Dependencias** | Ninguna (independiente de `SEO-SITEMAP-HERRAMIENTAS-01`, aunque conceptualmente relacionada) |
| **Archivos afectados** | `src/app/[locale]/(public)/herramientas/page.tsx` |
| **Validación necesaria** | Google Rich Results Test sin errores; schema no duplica el `SoftwareApplication` de cada herramienta individual |
| **Documentación a actualizar** | `docs/PROJECT_STATUS.md`, `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` |
| **Prioridad** | **P2** |

---

### `SEO-TECHNICAL-TUTORIAL-PRIORITY-01`

| Campo | Detalle |
|---|---|
| **ID** | SEO-TECHNICAL-TUTORIAL-PRIORITY-01 |
| **Título** | Revisar la prioridad de sitemap de `/tutorial` tras la auditoría de contenido ya realizada |
| **Descripción** | `SEO-TECHNICAL-TUTORIAL-01` (ejecutada) clasificó `/tutorial` como contenido real, no thin — pero la prioridad de sitemap (0.8) nunca se ajustó a esa conclusión. Decidir y aplicar la prioridad definitiva coherente con su función de onboarding, no de captación SEO principal |
| **Objetivo** | Cerrar el hallazgo T-12 (severidad baja) |
| **Impacto SEO** | Bajo |
| **Impacto GEO** | Ninguno |
| **Dificultad** | Muy baja |
| **Riesgo** | Muy bajo |
| **Dependencias** | Ninguna |
| **Archivos afectados** | `src/app/sitemap.ts` |
| **Validación necesaria** | `sitemap.xml` refleja la nueva prioridad para `/tutorial` |
| **Documentación a actualizar** | `docs/PROJECT_STATUS.md` |
| **Prioridad** | **P2** |

---

### `SEO-BREADCRUMB-AUDIT-01`

| Campo | Detalle |
|---|---|
| **ID** | SEO-BREADCRUMB-AUDIT-01 |
| **Título** | Auditar la presencia y corrección de `BreadcrumbList` en el sitio |
| **Descripción** | La auditoría no pudo confirmar si existe schema `BreadcrumbList` en las páginas de blog/herramientas. Esta tarea es solo de auditoría: verificar qué existe y documentar si falta |
| **Objetivo** | Cerrar la incertidumbre documentada en la sección de estructura HTML de la auditoría |
| **Impacto SEO** | Bajo (auditoría) / medio si se detecta ausencia total y se prioriza como tarea futura |
| **Impacto GEO** | Bajo |
| **Dificultad** | Muy baja |
| **Riesgo** | Ninguno — solo lectura |
| **Dependencias** | Ninguna |
| **Archivos afectados** | Ninguno (solo lectura) |
| **Validación necesaria** | Documento con conclusión clara: existe / no existe / parcial, con archivos concretos |
| **Documentación a actualizar** | `docs/seo/SEO_BREADCRUMB_AUDIT_01.md` (nuevo, si se detectan hallazgos que lo justifiquen) |
| **Prioridad** | **P3** |

---

## Bloque arquitectura / enlazado interno

### `SEO-INTERNAL-LINKING-EXEC-METODO-01` — ✅ COMPLETADA (Fase 1) 2026-07-07

| Campo | Detalle |
|---|---|
| **ID** | SEO-INTERNAL-LINKING-EXEC-METODO-01 |
| **Estado** | ✅ Completada para el alcance de Fase 1 — commit `feat(seo): execute internal linking phase 1`. Hallazgo: el enlazado hacia `metodo-kakebo-guia-definitiva` ya estaba resuelto (12/13 artículos del cluster ya enlazaban, ejecutado como efecto colateral del sprint de terminología). El gap real ejecutado fue `SEO-AHORRO-INBOUND-01` (enlaces desde `como-ahorrar-dinero-cada-mes` y `regla-30-dias` hacia `calculadora-ahorro`). Ver `docs/PROJECT_STATUS.md` para el detalle completo. Los enlaces salientes desde `plantilla-kakebo-excel` (`SEO-INTERNAL-LINKING-EXEC-EXCEL-01`) siguen bloqueados, sin tocar esa URL. |
| **Título** | Ejecutar el enlazado entrante hacia `metodo-kakebo-guia-definitiva` documentado en el plan |
| **Descripción** | `SEO_INTERNAL_LINKING_V1_01.md` ya diseñó qué artículos deben enlazar al hub de cluster "Kakebo Core". Esta tarea ejecuta únicamente esos enlaces, uno por artículo origen, en el orden que defina el propio plan |
| **Objetivo** | Redistribuir autoridad interna hacia el hub semántico del sitio (RM-07) |
| **Impacto SEO** | Alto — es el cambio de arquitectura con mayor potencial de impacto pendiente de ejecutar |
| **Impacto GEO** | Medio — refuerza la autoridad temática del artículo con la definición factual más citable del sitio |
| **Dificultad** | Media — requiere revisar cada artículo origen y añadir el enlace con anchor text natural |
| **Riesgo** | Bajo si se sigue el plan ya documentado; medio si se enlaza sin criterio |
| **Dependencias** | Ninguna técnica; se recomienda ejecutar después del bloque técnico (P0/P1) para no mezclar tipos de cambio en la misma ventana de medición |
| **Archivos afectados** | Los archivos `.es.mdx` de los artículos origen identificados en `SEO_INTERNAL_LINKING_V1_01.md` — **un commit por artículo origen**, no un commit para todos |
| **Validación necesaria** | Los enlaces son verificables (no rotos), el anchor text es natural y contextual, no hay sobreoptimización |
| **Documentación a actualizar** | `docs/PROJECT_STATUS.md` (una entrada por commit/artículo) |
| **Prioridad** | **P1** |

---

### `SEO-INTERNAL-LINK-CANONICAL-01` — ✅ COMPLETADA 2026-07-07

| Campo | Detalle |
|---|---|
| **ID** | SEO-INTERNAL-LINK-CANONICAL-01 |
| **Título** | Corregir enlaces internos con prefijo `/es/` por su URL canónica |
| **Descripción** | Detectada durante `S-EJEC-01`: 14 enlaces internos en `como-hacer-un-presupuesto-personal.es.mdx` y 3 en `messages/es.json` (bloque `Landing.SEO.whatIs.p3`) usaban el prefijo `/es/` en lugar de la URL canónica sin prefijo |
| **Estado** | ✅ Completada — commit `fix(seo): canonicalize remaining internal /es link`. Sustitución exclusiva del prefijo en las 17 ocurrencias; anchor text y resto del contenido intactos. Búsqueda exhaustiva posterior en todo el contenido público (`.mdx` ES/EN, `messages/*.json`, `src/app/[locale]/(public)`, `src/app/[locale]/(landing)`, `src/components`) confirma cero coincidencias restantes de `/es/` en enlaces internos. Ver `docs/PROJECT_STATUS.md` para el detalle. |
| **Impacto SEO** | Bajo-medio — elimina un salto de redirect 301 innecesario en 17 enlaces internos, coherente con el resto del sitio (ya sin URLs `/es/` en sitemap ni canonicals) |
| **Impacto GEO** | Ninguno |
| **Dificultad** | Muy baja |
| **Riesgo** | Muy bajo |
| **Dependencias** | Ninguna |
| **Archivos afectados** | `src/content/blog/como-hacer-un-presupuesto-personal.es.mdx`, `messages/es.json` |
| **Prioridad** | **P1** (ejecutada de forma reactiva al detectarse durante S-EJEC-01) |

---

### `SEO-INTERNAL-LINKING-EXEC-EXCEL-01`

| Campo | Detalle |
|---|---|
| **ID** | SEO-INTERNAL-LINKING-EXEC-EXCEL-01 |
| **Título** | Enlazado saliente desde `plantilla-kakebo-excel` hacia herramientas relacionadas |
| **Descripción** | Añadir un enlace textual desde `plantilla-kakebo-excel` hacia `/herramientas/regla-50-30-20` (sección donde se menciona el 20% de ahorro) y, si no existe ya, un segundo enlace en el cuerpo hacia `/herramientas/calculadora-ahorro` |
| **Objetivo** | Distribuir autoridad desde la URL tractora hacia herramientas estratégicas sin tocar el resto del artículo |
| **Impacto SEO** | Medio |
| **Impacto GEO** | Bajo |
| **Dificultad** | Muy baja |
| **Riesgo** | Bajo — el artículo está protegido, por lo que el cambio debe ser mínimo y quirúrgico (solo añadir enlaces, no tocar slug/H1/estructura/schema) |
| **Dependencias** | Requiere confirmación explícita del usuario antes de tocar `plantilla-kakebo-excel`, por la política de protección vigente (`GSC_CHANGELOG_2026_07_03.md`: "bloqueado — requiere autorización explícita") |
| **Archivos afectados** | `src/content/blog/plantilla-kakebo-excel.es.mdx` |
| **Validación necesaria** | Los enlaces funcionan, no se modifica ningún otro elemento del artículo, build limpio |
| **Documentación a actualizar** | `docs/PROJECT_STATUS.md` |
| **Prioridad** | **P1 — condicionada a autorización explícita del usuario antes de ejecutar** |

---

### `SEO-GEO-AUTHORSHIP-AUDIT-01`

| Campo | Detalle |
|---|---|
| **ID** | SEO-GEO-AUTHORSHIP-AUDIT-01 |
| **Título** | Verificar la autoría real en los 14 artículos de blog no revisados |
| **Descripción** | Solo se ha confirmado que `metodo-kakebo-guia-definitiva` usa un nombre real de autor (Aitor Alarcón). Revisar el frontmatter `author` de los 14 artículos restantes y documentar cuáles siguen con "Equipo Kakebo" u otro valor genérico |
| **Objetivo** | Cerrar el hallazgo G-03 — confirmar el alcance real del problema antes de decidir si migrar autoría |
| **Impacto SEO** | Bajo |
| **Impacto GEO** | Medio — E-E-A-T |
| **Dificultad** | Muy baja (auditoría) |
| **Riesgo** | Ninguno — solo lectura |
| **Dependencias** | Ninguna |
| **Archivos afectados** | Ninguno (solo lectura en esta tarea; la migración de autoría, si procede, sería una tarea posterior separada) |
| **Validación necesaria** | Documento con tabla de los 15 artículos y su valor actual de `author` |
| **Documentación a actualizar** | `docs/seo/SEO_GEO_AUTHORSHIP_AUDIT_01.md` (nuevo) |
| **Prioridad** | **P2** |

---

## Bloque contenido (bloqueado hasta cumplir condiciones — ver sección 6)

### `SEO-BLOG-INFLACION-01`

| Campo | Detalle |
|---|---|
| **ID** | SEO-BLOG-INFLACION-01 |
| **Título** | Crear artículo editorial de respaldo para `calculadora-inflacion` |
| **Descripción** | Artículo nuevo sobre cómo la inflación afecta al ahorro, con definición factual, ejemplo numérico y CTA hacia la calculadora |
| **Objetivo** | Cerrar el gap editorial S-04 en el cluster Inflación/IPC |
| **Impacto SEO** | Alto (potencial, no confirmado) |
| **Impacto GEO** | Medio — nueva pieza citable con estructura FAQ |
| **Dificultad** | Media |
| **Riesgo** | Ninguno (URL nueva, no toca contenido existente) |
| **Dependencias** | Snapshot GSC 2026-07-17/31 (confirmar volumen de búsqueda) + enlazado interno del bloque anterior ya ejecutado |
| **Archivos afectados** | Nuevo `.es.mdx` en `src/content/blog/` |
| **Validación necesaria** | Artículo indexado sin errores; FAQPage schema válido; enlace funcional hacia la calculadora |
| **Documentación a actualizar** | `docs/PROJECT_STATUS.md`, `docs/seo/SEO_MAP_V1.md` (nueva URL en el inventario) |
| **Prioridad** | **P2 — bloqueada (ver sección 6)** |

---

### `SEO-BLOG-503020-01`

| Campo | Detalle |
|---|---|
| **ID** | SEO-BLOG-503020-01 |
| **Título** | Crear artículo editorial de respaldo para `regla-50-30-20` |
| **Descripción** | Artículo nuevo explicando la regla 50/30/20 con tabla ejemplo y CTA hacia la calculadora |
| **Objetivo** | Cerrar el gap editorial S-04 en el cluster Regla 50/30/20 |
| **Impacto SEO** | Alto (potencial, no confirmado) |
| **Impacto GEO** | Medio |
| **Dificultad** | Media |
| **Riesgo** | Ninguno |
| **Dependencias** | Igual que `SEO-BLOG-INFLACION-01` |
| **Archivos afectados** | Nuevo `.es.mdx` en `src/content/blog/` |
| **Validación necesaria** | Artículo indexado sin errores; enlace funcional hacia la calculadora |
| **Documentación a actualizar** | `docs/PROJECT_STATUS.md`, `docs/seo/SEO_MAP_V1.md` |
| **Prioridad** | **P2 — bloqueada (ver sección 6)** |

---

### `SEO-KAKEBO-VS-FINTONIC-01`

| Campo | Detalle |
|---|---|
| **ID** | SEO-KAKEBO-VS-FINTONIC-01 |
| **Título** | Crear segunda comparativa BOFU: "Kakebo vs Fintonic" |
| **Descripción** | Ampliar la cobertura BOFU (hoy limitada a `kakebo-vs-ynab`) con una comparativa dirigida a la audiencia que ya usa o considera apps bancarias con Open Banking |
| **Objetivo** | Cerrar el hallazgo S-09 (cobertura BOFU limitada) |
| **Impacto SEO** | Medio |
| **Impacto GEO** | Medio — tabla comparativa citable |
| **Dificultad** | Media |
| **Riesgo** | Ninguno |
| **Dependencias** | Snapshot GSC 2026-07-17/31 + enlazado interno ejecutado; menor prioridad que los dos artículos de herramientas porque no tiene una herramienta esperando detrás |
| **Archivos afectados** | Nuevo `.es.mdx` en `src/content/blog/` |
| **Validación necesaria** | Artículo indexado; tabla comparativa correctamente estructurada; sin claims sin fuente (según el estándar ya aplicado en `kakebo-vs-ynab`) |
| **Documentación a actualizar** | `docs/PROJECT_STATUS.md`, `docs/seo/SEO_MAP_V1.md` |
| **Prioridad** | **P3 — bloqueada (ver sección 6)** |

---

### `SEO-GEO-FAQ-PAGE-01`

| Campo | Detalle |
|---|---|
| **ID** | SEO-GEO-FAQ-PAGE-01 |
| **Título** | Crear página `/faq` global del sitio |
| **Descripción** | Hub de preguntas frecuentes agregando las FAQ ya existentes en distintas páginas, con schema `FAQPage` propio |
| **Objetivo** | Cerrar el hallazgo G-08 |
| **Impacto SEO** | Bajo |
| **Impacto GEO** | Bajo-medio |
| **Dificultad** | Media |
| **Riesgo** | Ninguno |
| **Dependencias** | Ninguna técnica; prioridad baja por diseño (P6 en el plan maestro) |
| **Archivos afectados** | Nueva ruta `src/app/[locale]/(public)/faq/page.tsx` |
| **Validación necesaria** | Página indexada, schema `FAQPage` válido, sin duplicar contenido de FAQ ya indexado en otras páginas de forma que genere canibalización |
| **Documentación a actualizar** | `docs/PROJECT_STATUS.md`, `docs/seo/SEO_MAP_V1.md` |
| **Prioridad** | **P3 — no ejecutar hasta que el resto del contenido esté estabilizado** |

---

## Bloque medición

### `SEO-GSC-SNAPSHOT-2026-07-17`

| Campo | Detalle |
|---|---|
| **ID** | SEO-GSC-SNAPSHOT-2026-07-17 |
| **Título** | Ejecutar el snapshot GSC ya fijado para 2026-07-17/31 |
| **Descripción** | Exportar de Search Console las mismas métricas documentadas en `GSC_CHANGELOG_2026_07_03.md` (Home, queries clave, las 10 URLs EN noindex, `regla-50-30-20`, `kakebo-online-guia-completa`) y compararlas contra el baseline del 2026-07-03 |
| **Objetivo** | Validar si el sprint de canibalización EN/ES y las optimizaciones de snippet de julio funcionaron |
| **Impacto SEO** | Crítico — es el prerrequisito de todo el bloque P2 de optimización URL por URL y de contenido |
| **Impacto GEO** | Ninguno directo, pero condiciona si se prioriza más trabajo GEO o más trabajo de captación clásica |
| **Dificultad** | Baja (exportar y documentar) |
| **Riesgo** | Ninguno — solo lectura de datos |
| **Dependencias** | Ninguna, salvo la fecha (no ejecutar antes del 2026-07-17) |
| **Archivos afectados** | Ninguno (solo documentación) |
| **Validación necesaria** | Documento con datos numéricos reales, comparación explícita contra el baseline de `GSC_CHANGELOG_2026_07_03.md` |
| **Documentación a actualizar** | `docs/seo/GSC_SNAPSHOT_2026_07_17.md` (nuevo), `docs/PROJECT_STATUS.md` |
| **Prioridad** | **P0 — programada, no ejecutar antes de la fecha** |

---

# 4. Orden recomendado

El orden no es solo por impacto: prioriza primero lo que no tiene coste de espera ni riesgo, deja para después lo que depende de fechas o de autorización, y dejar al final lo que requiere que el paso anterior esté consolidado.

1. **`SEO-HREFLANG-NOINDEX-GUARD-01`** — P0, cero dependencias, corrige una regresión activa. Ejecutar primero.
2. **`SEO-SCHEMA-BLOGPOSTING-PUBLISHER-01`** — P0, cero dependencias, mismo tipo de archivo que la tarea anterior (agrupable en la misma sesión de trabajo, pero commits separados).
3. **`SEO-SITEMAP-HERRAMIENTAS-01`** — P1, cero dependencias, bajo riesgo.
4. **`SEO-SITEMAP-LASTMODIFIED-01`** — P1, mismo archivo que la tarea 3 (ejecutar en la misma sesión, commits separados para no mezclar dos objetivos en el sitemap).
5. **`SEO-SITENAME-UNIFY-01`** — P1, cero dependencias.
6. **`SEO-SCHEMA-HERRAMIENTAS-HUB-01`** — P2, sin dependencias técnicas, pero tiene sentido ejecutarla después de que el hub ya esté en el sitemap (orden lógico, no bloqueante).
7. **`SEO-TECHNICAL-TUTORIAL-PRIORITY-01`** — P2, trivial, puede ejecutarse en cualquier momento del bloque técnico.
8. **`SEO-BREADCRUMB-AUDIT-01`** — P3, auditoría pura, sin urgencia.
9. **`SEO-GEO-AUTHORSHIP-AUDIT-01`** — P2, auditoría pura, puede ejecutarse en paralelo con el bloque técnico porque no toca los mismos archivos.
10. **`SEO-INTERNAL-LINKING-EXEC-METODO-01`** — P1, ejecutar después de cerrar el bloque técnico para no mezclar ventanas de medición de cambios técnicos con cambios de enlazado en el mismo periodo.
11. **`SEO-INTERNAL-LINKING-EXEC-EXCEL-01`** — P1, condicionada a autorización explícita; solicitar esa autorización en paralelo con el punto 10, ejecutar cuando se conceda.
12. **`SEO-GSC-SNAPSHOT-2026-07-17`** — P0 programada; se ejecuta en su fecha con independencia del resto del roadmap, y sus resultados son los que desbloquean el bloque de contenido.
13. **`SEO-BLOG-INFLACION-01`** — P2, bloqueada hasta el punto 12 + puntos 10-11 completados.
14. **`SEO-BLOG-503020-01`** — P2, misma condición que la anterior.
15. **`SEO-KAKEBO-VS-FINTONIC-01`** — P3, después de los dos artículos de herramientas.
16. **`SEO-GEO-FAQ-PAGE-01`** — P3, al final, sin urgencia.

**Regla de secuencia:** no iniciar el punto 13 en adelante sin haber cerrado los puntos 1-12.

---

# 5. Hitos

## Bloque 1 — Correcciones técnicas pequeñas
`SEO-HREFLANG-NOINDEX-GUARD-01` · `SEO-SCHEMA-BLOGPOSTING-PUBLISHER-01` · `SEO-SITEMAP-HERRAMIENTAS-01` · `SEO-SITEMAP-LASTMODIFIED-01` · `SEO-SITENAME-UNIFY-01` · `SEO-TECHNICAL-TUTORIAL-PRIORITY-01`

**Objetivo del bloque:** cerrar toda la deuda técnica ya diagnosticada y de bajo riesgo antes de tocar nada más. Puede completarse en días, no en semanas.

## Bloque 2 — Arquitectura
`SEO-SCHEMA-HERRAMIENTAS-HUB-01` · `SEO-BREADCRUMB-AUDIT-01` · `SEO-GEO-AUTHORSHIP-AUDIT-01`

**Objetivo del bloque:** completar las piezas de arquitectura e infraestructura de contenido que no dependen de datos externos.

## Bloque 3 — Enlazado interno
`SEO-INTERNAL-LINKING-EXEC-METODO-01` · `SEO-INTERNAL-LINKING-EXEC-EXCEL-01`

**Objetivo del bloque:** redistribuir autoridad interna hacia el hub semántico y reforzar la conexión desde la URL tractora, cerrando el mayor cuello de botella arquitectónico identificado en la auditoría.

## Bloque 4 — Contenido
`SEO-BLOG-INFLACION-01` · `SEO-BLOG-503020-01` · `SEO-KAKEBO-VS-FINTONIC-01` · `SEO-GEO-FAQ-PAGE-01`

**Objetivo del bloque:** cerrar los gaps editoriales confirmados, solo después de que los bloques 1-3 estén cerrados y el snapshot GSC lo valide.

## Bloque 5 — Medición
`SEO-GSC-SNAPSHOT-2026-07-17`

**Objetivo del bloque:** validar con datos reales el impacto de todo lo anterior y decidir si el Bloque 4 se ejecuta tal como está planteado o se ajusta.

**Nota de secuencia real:** aunque se numera como Bloque 5, `SEO-GSC-SNAPSHOT-2026-07-17` debe ejecutarse en su fecha natural (2026-07-17/31), que probablemente coincide con la ejecución de los Bloques 1-3. Es el hito que desbloquea el Bloque 4, no el último en ejecutarse cronológicamente.

---

# 6. Tareas bloqueadas

| Tarea | Qué dato falta | Qué evento la desbloquea |
|---|---|---|
| `SEO-BLOG-INFLACION-01` | Volumen de búsqueda confirmado y enlazado interno estabilizado | Snapshot GSC 2026-07-17/31 ejecutado + Bloque 3 completado |
| `SEO-BLOG-503020-01` | Igual que la anterior | Igual que la anterior |
| `SEO-KAKEBO-VS-FINTONIC-01` | Confirmación de que el cluster Alternativas/Fintonic tiene tracción suficiente para justificar una tercera pieza | Snapshot GSC 2026-07-17/31 + resultados de los dos artículos de herramientas ya publicados |
| `SEO-INTERNAL-LINKING-EXEC-EXCEL-01` | Autorización explícita del usuario para tocar `plantilla-kakebo-excel` | Confirmación directa del usuario (política vigente desde `GSC_CHANGELOG_2026_07_03.md`) |
| `SEO-GEO-FAQ-PAGE-01` | Ninguno crítico, pero es P3 por diseño — no debe competir por atención con el resto del roadmap | Cierre completo de los Bloques 1-4 |
| Cualquier optimización adicional de `como-hacer-un-presupuesto-personal` (no listada como tarea aún — solo monitorización) | Impresiones reales en GSC | Publicado el 2026-06-22; primeras señales fiables esperadas a partir de 2026-08-17 (8 semanas) |
| Cualquier decisión sobre los 3 artículos EN "dudosos" (`como-ahorrar-dinero-cada-mes`, `eliminar-gastos-hormiga`, `metodo-kakebo-guia-definitiva` en su versión EN) | Posición y tracción en GSC | Snapshot GSC 2026-07-17/31 |

---

# 7. Riesgos del roadmap

| Qué puede salir mal | Cómo evitarlo |
|---|---|
| Ejecutar varias tareas del Bloque 1 en el mismo commit "porque son pequeñas" | Mantener la disciplina de un commit por tarea aunque el cambio sea de una línea — es exactamente el tipo de atajo que causó la regresión T-13 |
| Empezar el Bloque 4 (contenido) antes de que el snapshot GSC lo confirme, por presión de avanzar | Bloquear explícitamente esas tareas en el backlog (sección 6) y no permitir su ejecución sin el evento desbloqueante documentado |
| Tocar `plantilla-kakebo-excel` sin la autorización explícita del usuario | La tarea `SEO-INTERNAL-LINKING-EXEC-EXCEL-01` queda marcada como condicionada; no ejecutar sin confirmación expresa |
| Que el snapshot GSC del 2026-07-17/31 no se ejecute a tiempo | Tratarlo como tarea P0 programada igual que cualquier otra tarea del roadmap, no como una nota informal |
| Interpretar los resultados del snapshot antes de tiempo (fluctuaciones diarias, muestras pequeñas) | Aplicar las mismas reglas de interpretación ya documentadas en `GSC_CHANGELOG_2026_07_03.md` sección 5 |
| Que el enlazado interno del Bloque 3 se ejecute sin seguir el plan ya documentado en `SEO_INTERNAL_LINKING_V1_01.md`, introduciendo enlaces no naturales | Cada tarea de enlazado debe citar explícitamente qué parte del plan ejecuta y no improvisar enlaces fuera de ese documento |
| Acumular tareas completadas sin push, perdiendo trazabilidad | Seguir el principio 5 de la sección 2 sin excepción |
| Que una tarea de "solo auditoría" (`SEO-BREADCRUMB-AUDIT-01`, `SEO-GEO-AUTHORSHIP-AUDIT-01`) derive en cambios de código sin planificarlo como tarea nueva | Cerrar la tarea de auditoría con su documento de hallazgos y, si hace falta acción, crear una tarea nueva independiente en una próxima revisión de este roadmap |

---

# 8. Criterios para dar una tarea por completada

Una tarea de este roadmap solo puede marcarse como completada cuando se cumplen **todas** las siguientes condiciones:

1. **Commit único** con el nombre de la tarea, ya pusheado a `origin/main`.
2. **Validación ejecutada y superada** exactamente como se definió en el backlog (build limpio, Rich Results Test, grep de confirmación, documento de auditoría, etc. — según corresponda a esa tarea).
3. **Documentación actualizada** en `docs/PROJECT_STATUS.md` con el mismo formato que las tareas anteriores del proyecto (campo/detalle, cambios, validación).
4. **Sin efectos colaterales no documentados** — si la tarea tocó algo fuera de los "archivos afectados" listados, eso debe quedar explícitamente registrado y justificado en el commit y en la documentación.
5. **Sin mezclar objetivos** — si al ejecutar se detectó una segunda mejora relacionada, esa segunda mejora se registra como tarea nueva en este roadmap, no se cuela en el mismo commit.
6. **Actualización del estado del hallazgo origen** en `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` (o en el roadmap, según corresponda) para que la próxima auditoría no vuelva a listarlo como abierto.

Una tarea de tipo "medición" (snapshot GSC) se considera completada cuando el documento de snapshot existe con datos reales y una comparación explícita contra el baseline anterior — no antes de la fecha mínima fijada, aunque técnicamente se pudiera exportar antes.

Una tarea de tipo "contenido bloqueado" no puede completarse mientras su condición de desbloqueo (sección 6) no se haya cumplido, independientemente de si el equipo tiene capacidad para ejecutarla antes.

---

*SEO_ROADMAP_V1.md — actualizado 2026-07-07*
*16 tareas priorizadas · P0: 3 · P1: 5 · P2: 5 · P3: 3 · 5 de ellas bloqueadas por fecha, datos o autorización*
*Sin cambios en código, contenido ni configuración SEO — solo documentación.*
