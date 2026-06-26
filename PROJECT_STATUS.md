# Estado del Proyecto Kakebo AI

**Última actualización:** 2026-06-26 (UI-TYPOGRAPHY-BRAND-ALIGN-01)  
**Último commit aceptado:** `a62b440` (UI-TYPOGRAPHY-BRAND-ALIGN-01)  
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
