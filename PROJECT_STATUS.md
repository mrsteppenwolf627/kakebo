# Estado del Proyecto Kakebo AI

**Última actualización:** 2026-06-26 (SEO-CTR-FINTONIC-01)  
**Último commit aceptado:** `e1f30a5` (SEO-CTR-FINTONIC-01)  
**Rama operativa:** `main`

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

### SEO-DATA-PRIORITY-01 — Priorizar oportunidades según Search Console

**Estado:** Pendiente de inicio  
**Prerequisito:** Datos de Search Console actualizados para el dominio metodokakebo.com  
**Descripción:** Analizar rendimiento actual por query, identificar páginas con impresiones altas y CTR bajo, detectar keywords en posiciones 5-20 candidatas a optimización, y establecer prioridades de SEO Sprint 3 basadas en datos reales, no en estimaciones.

**No iniciar** ningún nuevo artículo SEO ni tarea técnica SEO sin haber ejecutado primero SEO-DATA-PRIORITY-01.

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
| **SEO-DATA-PRIORITY-01** | **Priorizar con datos reales de Search Console** | — | **⬅ SIGUIENTE** |

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
