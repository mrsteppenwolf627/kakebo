# PROJECT STATUS — metodokakebo.com

**Última actualización:** 2026-06-24 (DOC-FRONTEND-CLOSE-01)  
**Rama operativa:** `main`  
**URL producción:** https://www.metodokakebo.com

> Este documento es la fuente de verdad del SEO Sprint P0, UI Sprint 1, SEO Sprint 2 y el capítulo frontend público/indexable.
> El historial de la migración SaaS→gratuito (P0.2–P1.5 de infraestructura) está en `CONTEXT.md`.
> Las decisiones arquitectónicas de infraestructura están en `ADRs.md`.
> La estrategia de contenido e internacionalización está en la sección **Estrategia de Contenido e Internacionalización** de este mismo documento.

---

## ✅ DOC-FRONTEND-CLOSE-01 — Cierre del capítulo frontend público/indexable

| Campo | Detalle |
|---|---|
| **Fecha de cierre** | 2026-06-24 |
| **Aceptado por usuario** | Sí, provisionalmente |
| **Último commit del capítulo** | `b924649` — UIUX: harden premium visual system for mobile (UIUX-GLOBAL-MOBILE-PREMIUM-01) |
| **Siguiente bloque** | SEO-DATA-PRIORITY-01 |

### Qué queda cerrado y aceptado

El capítulo frontend público/indexable cubre todas las zonas públicas de MetodoKakebo.com. No se harán más cambios visuales amplios sin incidencia concreta. Si aparece un problema específico en revisión visual, se abrirá una tarea UIUX puntual.

**Sistema visual de base:**
- `tailwind.config.ts` typography — H2 (border-bottom), H3 (accent bar primary), HR, blockquote, links, code, listas
- `MDXComponents.tsx` — todos los elementos MDX con tokens semánticos: Table (overflow-x-auto), TableHead/Row/Header/Cell, Blockquote, Callout, RoundedImage, HorizontalRule, FaqSection/FaqItem, CustomLink
- `globals.css` — paleta ZEN/wabi-sabi en tokens semánticos completos para claro y oscuro

**Componentes MDX reutilizables (sistema completo para futuros artículos):**

| Componente | Prop(s) | Uso |
|---|---|---|
| `<SimpleCTA>` | `href`, `cta` | CTA centrado general (fin de artículo) |
| `<ToolCTA>` | `title`, `description`, `href`, `cta` | CTA de herramienta interna con card primary |
| `<ArticleCTA>` | `href`, `cta`, children | CTA editorial de cierre (bg-foreground invertido) |
| `<DownloadCTA>` | `href`, `cta` | Botón de descarga de archivo |
| `<HorizontalRule>` | — | Override de `---` con tres puntos decorativos |
| `<Callout>` | `emoji?`, children | Bloque destacado informativo |
| `<FaqSection>` + `<FaqItem>` | `question` en FaqItem | Sección FAQ estructurada |
| `<Blockquote>` | — | Override de `>` en markdown |
| Tablas markdown | — | Sistema automático con overflow-x-auto |

**Reglas activas (documentadas en INSTRUCCIONES.md Regla #8):**
- No usar `<div className="...stone-...">` en MDX
- No usar `href="/es/..."` en links de MDX — siempre rutas sin prefijo
- Todo patrón visual nuevo debe implementarse como componente del sistema

**Landing pública (home) cerrada:**
- Hero, Features, HowItWorks, Testimonials, SavingsSimulator, AlternativesSection, FAQ, ToolsSection, SeoContent, Footer — todos en tokens semánticos
- Mobile: `py-16 sm:py-24` en todas las secciones, Hero H1 `text-4xl sm:...`, AlternativesSection `overflow-x-auto`, Navbar hamburguesa

**Blog index (/blog):** Featured card + grid 3-col + separador editorial — cerrado

**Artículo individual (/blog/[slug]):** Header con eyebrow, separator, prose refinada, H2/H3/HR editoriales, tablas responsive, todos los CTAs MDX mobile-safe — cerrado

**Analytics:** GA4 (MED-01 `3a1777b`) + CSP (MED-02 `7a08d3d`) — activos en producción. Variable de entorno `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-MTB27GMP8M` requiere estar configurada en Vercel.

**Artículos MDX migrados al sistema (13):**
`ahorro-pareja`, `alternativas-a-app-bancarias`, `como-ahorrar-dinero-cada-mes`, `eliminar-gastos-hormiga`, `kakebo-online-gratis`, `kakebo-sueldo-minimo`, `kakebo-vs-ynab`, `libro-kakebo-pdf`, `metodo-kakebo-para-autonomos`, `peligros-apps-ahorro-automatico`, `plantilla-kakebo-excel`, `regla-30-dias`, `kakebo-online-guia-completa`

**Artículos sin bloques legacy pendientes** (ya tenían componentes o no tenían bloques raw): `metodo-kakebo-guia-definitiva`, `ahorro-pareja`, `como-hacer-un-presupuesto-personal` (migrado en UIUX-PREMIUM-ARTICLE-01)

### Qué queda fuera del capítulo frontend (pendiente SEO)

- SEO-2.3C (enlaces P2 opcionales)
- SEO-2.4 (resolución de canibalizaciones — requiere Search Console)
- Content Sprint 1 (nuevos artículos)
- SEO-DATA-PRIORITY-01 (análisis de Search Console → definir SEO Sprint 3)

### Nota para el próximo agente

El frontend está en buen estado. No toques componentes visuales, MDX de artículos ni estilos globales sin una razón concreta documentada como tarea UIUX. El siguiente trabajo es SEO puro: analizar datos de Search Console y actuar sobre oportunidades concretas.

---

## UIUX Mobile Home — Sprint

### UIUX-MOBILE-HOME-04 — Espaciado vertical mobile reducido en secciones

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-23 |
| **Estado** | ✅ Completado |
| **Archivos modificados** | Features, HowItWorks, Testimonials, AlternativesSection, FAQ |
| **Build** | ✅ Compiled successfully |
| **Tests** | ✅ 506/506 passing |

**Cambio:** `py-24` → `py-16 sm:py-24` en las 5 secciones afectadas.

| Archivo | Antes | Después |
|---|---|---|
| `Features.tsx` | `py-24 bg-muted/30` | `py-16 sm:py-24 bg-muted/30` |
| `HowItWorks.tsx` | `py-24` | `py-16 sm:py-24` |
| `Testimonials.tsx` | `py-24 bg-muted/30` | `py-16 sm:py-24 bg-muted/30` |
| `AlternativesSection.tsx` | `py-24 bg-background` | `py-16 sm:py-24 bg-background` |
| `FAQ.tsx` | `py-24 bg-background` | `py-16 sm:py-24 bg-background` |

**Sin cambio:** `SavingsSimulator` (`py-16` ya correcto), `Footer` (`py-12`), `SeoContent` (`py-12`), `ToolsSection` (fuera de scope), `page.tsx` inline SEO sections (`py-16`).

**Efecto en mobile:** 5 secciones × (96−64)px ahorrados = **~320px menos de scroll vertical** en mobile (160px top + 160px bottom ahorro por sección acumulado). La cadencia entre secciones se mantiene pero no domina la pantalla.

**Desktop desde sm (640px):** `sm:py-24` conserva el espaciado exactamente igual al anterior.

---

### UIUX-MOBILE-HOME-03 — Hero H1 escala mobile

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-23 |
| **Estado** | ✅ Completado |
| **Archivo modificado** | `src/components/landing/Hero.tsx` |
| **Build** | ✅ Compiled successfully |
| **Tests** | ✅ 506/506 passing |

**Cambio:** `text-5xl sm:text-6xl md:text-7xl lg:text-8xl` → `text-4xl sm:text-5xl md:text-7xl lg:text-8xl`

| Breakpoint | Antes | Después |
|---|---|---|
| Mobile (0–639px) | 48px | **36px** ← fix |
| sm (640–767px) | 60px | 48px |
| md (768–1023px) | 72px | 72px (sin cambio) |
| lg (1024px+) | 96px | 96px (sin cambio) |

En 360-430px el H1 pasa de ~4-6 líneas a ~3-4 líneas, liberando espacio para CTAs y contenido bajo el fold.

---

### UIUX-MOBILE-HOME-02 — AlternativesSection overflow fix

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-23 |
| **Estado** | ✅ Completado |
| **Archivo modificado** | `src/components/landing/AlternativesSection.tsx` |
| **Build** | ✅ Compiled successfully |
| **Tests** | ✅ 506/506 passing |

**Diagnóstico:** Tabla 4 columnas `whitespace-nowrap` sin scroll container. Outer `overflow-hidden` + `<main overflow-x-hidden>` = columna "Apps" invisible en 360-390px (clipeada silenciosamente).

**Fix aplicado:** Añadida capa `<div className="overflow-x-auto">` entre el outer wrapper y la tabla.

```
overflow-hidden rounded-2xl  (outer — mantiene esquinas redondeadas)
└── overflow-x-auto          (inner — scroll container local en mobile)
    └── <table>              (sin cambios)
```

**Por qué funciona:** Nested scroll containers en CSS son independientes. El `overflow-x-auto` inner crea su propio contexto de scroll. El contenido de la tabla desborda el inner div (scroll local), no el outer ni el `<main>`. El `overflow-x-hidden` de `<main>` no interfiere con el scroll interno del `overflow-x-auto` descendiente.

**En desktop:** sin cambio visual — la tabla cabe y no aparece scrollbar.
**En mobile 360-390px:** la tabla desborda el inner div → scroll horizontal local → columna "Apps" accesible.

**Navbar y Hero:** no tocados ✓

---

### UIUX-MOBILE-NAV-01 — Navbar mobile y menú hamburguesa mejorados

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-23 |
| **Estado** | ✅ Completado |
| **Archivo modificado** | `src/components/landing/Navbar.tsx` |
| **Build** | ✅ Compiled successfully (0 errores TypeScript) |
| **Tests** | ✅ 506/506 passing |
| **Desktop dropdown UIUX-12** | ✅ Intacto — no modificado |

**Diagnóstico antes:** Hamburger sin `aria-expanded/aria-controls`, tap target ~40px, sin `focus-visible`. Overlay `bg-white dark:bg-stone-950` hardcoded. Nav links `py-2` (~34px touch target) sin `focus-visible`. Sin Escape handler. Sin ThemeToggle en mobile. Sin separadores visuales entre grupos.

**Cambios aplicados:**

| Área | Cambio |
|---|---|
| `menuButtonRef` | Nuevo ref para el botón hamburguesa |
| Escape useEffect | Cierra menú + devuelve foco al botón al presionar Escape |
| Hamburger button | `aria-expanded`, `aria-controls="mobile-menu"`, `aria-label` dinámico, `w-11 h-11` (44px), `focus-visible`, `aria-hidden` en SVGs |
| ThemeToggle | Añadido al header mobile (antes del hamburguesa) — ya no es solo desktop |
| Overlay | `id="mobile-menu"`, `bg-background` (reemplaza `bg-white dark:bg-stone-950` hardcoded), `overflow-x-hidden` |
| Nav aria-label | `aria-label="Menú principal"` en `<nav>` del overlay |
| Main nav links | `py-2 text-lg` → `py-3 text-base` + `hover:text-primary` + `focus-visible:ring-inset` |
| Hash links | Mismo patrón + `focus-visible` |
| Tools group | `border-t border-border/40 pt-3 mt-1` como separador visual; label con `tracking-widest`; links `py-3 px-3 hover:bg-muted/50 rounded-md` + `focus-visible` |
| Bottom section | `border-t border-border/40 pt-4` como separador de grupos |
| CTA grid | `gap-4` → `gap-3` (menor separación visual entre login/start) |

**Comportamiento resultante en mobile:**
- Hamburger: Enter/clic abre/cierra; Escape cierra y devuelve foco al botón; focus-visible visible ✓
- ThemeToggle accesible sin abrir menú ✓
- Touch targets mínimo 44px en todos los links y botones ✓
- Grupos visuales claros: nav principal / herramientas / idioma+cuenta ✓
- Menú completamente fuera del DOM cuando cerrado (no hay elementos accesibles ocultos) ✓
- Desktop dropdown UIUX-12 intacto ✓

---

### UIUX-MOBILE-HOME-01 — Auditoría home mobile

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-23 |
| **Estado** | ✅ Completado (solo auditoría — sin cambios de código) |
| **Código modificado** | Ninguno |

**Problemas críticos detectados:**

| ID | Componente | Problema |
|---|---|---|
| C-1 | `AlternativesSection.tsx` | Tabla 4 columnas `whitespace-nowrap` sin `overflow-x-auto`. Con `overflow-x-hidden` en `<main>`, la columna "Apps" es invisible en 360-390px. |
| C-2 | `Hero.tsx` | `text-5xl` (48px) sin escala mobile. En 360px produce 4-6 líneas por título y domina demasiado el fold. |

**Problemas importantes detectados:**

| ID | Componente | Problema |
|---|---|---|
| I-1 | Features/HowItWorks/Testimonials/Alternatives/FAQ | `py-24` sin reducción mobile → página excesivamente larga en mobile |
| I-2 | `Hero.tsx` Stats Card | `mt-20 p-8 sm:p-12` → pushea mucho contenido al fondo del Hero |
| I-3 | `Testimonials.tsx` | 6 cards columna única en mobile (< 640px) → sección ~1400px de alto |
| I-4 | `HowItWorks.tsx` | `mb-16` en header + `text-lg` en descripción → innecesariamente pesado en mobile |
| I-5 | `SavingsSimulator.tsx` | `px-6` vs `px-4` estándar → leve inconsistencia |

**Problemas secundarios:** H2 `text-4xl` en secciones (aceptable), PH badge width fija 250px, `p-8` SEO categories en mobile.

**Tareas priorizadas:**

| Tarea | Prioridad | Archivo |
|---|---|---|
| UIUX-MOBILE-HOME-02 | Crítico | AlternativesSection.tsx |
| UIUX-MOBILE-HOME-03 | Crítico | Hero.tsx |
| UIUX-MOBILE-HOME-04 | Importante | Features/HowItWorks/Testimonials/FAQ/Alternatives |
| UIUX-MOBILE-HOME-05 | Importante | Hero.tsx (Stats Card) |
| UIUX-MOBILE-HOME-06 | Importante | HowItWorks.tsx |
| UIUX-MOBILE-HOME-07 | Importante | Testimonials.tsx |

**Riesgo técnico principal:** `overflow-x-hidden` en `<main>` (page.tsx) puede entrar en conflicto con `overflow-x-auto` en AlternativesSection. Hay que aislar el fix.

---

## SEO Sprint P0 — Completado

### P0.2 — Canonicals y hreflang del blog

| Campo | Detalle |
|---|---|
| **Objetivo** | Eliminar `/es/` del canonical ES; añadir hreflang correcto `es` / `en` / `x-default` en todos los posts |
| **Commit** | `1116504` — `feat(seo): fix blog canonical and hreflang urls` |
| **Archivo clave** | `src/app/[locale]/(public)/blog/[slug]/page.tsx` → `generateMetadata` |
| **Resultado** | Canonical ES usa `https://www.metodokakebo.com/blog/{slug}` (sin prefijo). EN usa `/en/blog/{slug}`. `x-default` apunta a ES. |

**Patrón canónico establecido:**
```ts
canonical: `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}/blog/${slug}`
```

---

### P0.3 — Canonicals de las páginas de herramientas

| Campo | Detalle |
|---|---|
| **Objetivo** | Corregir canonical/hreflang en `calculadora-ahorro` y `regla-50-30-20` (usaban `/es/` incorrecto) |
| **Commit** | `2986b73` — `feat(seo): fix tool canonical urls` |
| **Archivos clave** | `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx`, `regla-50-30-20/page.tsx` |
| **Resultado** | Herramientas con canonical correcto. Mismo patrón que P0.2 aplicado a las tool pages. |

---

### P0.3B — Fix build roto por `verify-stripe.ts`

| Campo | Detalle |
|---|---|
| **Objetivo** | El script `scripts/verify-stripe.ts` importaba el paquete `stripe` (desinstalado) y rompía el typecheck de Vercel |
| **Commit** | `6b7ba18` — `fix(build): remove legacy stripe verification from typecheck` |
| **Archivo clave** | `scripts/verify-stripe.ts` → eliminado con `git rm` |
| **Resultado** | Build de Vercel limpio. El script era código muerto de la era SaaS sin valor actual. |

---

### P0.4 — Robots.txt: rutas privadas

| Campo | Detalle |
|---|---|
| **Objetivo** | Añadir `Disallow: /app/` y `Disallow: /auth/` para que los crawlers no indexen rutas autenticadas |
| **Commit** | `134eb03` — `feat(seo): restrict private routes in robots` |
| **Archivo clave** | `src/app/robots.ts` |
| **Resultado** | `disallow: ['/api/', '/app/', '/auth/']`. Crawlers excluidos del área de aplicación privada. |

---

### P0.5 — Optimización artículo `plantilla-kakebo-excel`

| Campo | Detalle |
|---|---|
| **Objetivo** | Convertir el artículo en pieza SEO completa: sección "¿Qué incluye?", tabla comparativa, FAQ visible, FAQ schema, enlaces internos |
| **Commit** | `682c73d` — `feat(seo): improve plantilla kakebo excel article` |
| **Archivo clave** | `src/content/blog/plantilla-kakebo-excel.es.mdx` |
| **Resultado** | Artículo con 5 bloques estructurados, tabla Papel/Excel/GSheets/KakeboAI, 5 FAQs en frontmatter para JSON-LD FAQPage, CTA de descarga, enlaces a herramientas internas. |

---

### P0.7 — Optimización artículo `alternativas-a-app-bancarias`

| Campo | Detalle |
|---|---|
| **Objetivo** | Convertir el artículo en comparativa real con fichas de 5 apps (Spendee, Toshl, Money Manager, Emma, YNAB), tabla actualizada, FAQ y enlaces internos |
| **Commit** | `5d5407e` — `feat(seo): expand fintonic alternatives comparison` |
| **Archivo clave** | `src/content/blog/alternativas-a-app-bancarias.es.mdx` |
| **Resultado** | 5 secciones con Pros/Contras/Para quién es, tabla de comparativa actualizada con 8 apps, FAQs en frontmatter para JSON-LD, sección "El oscuro modelo de negocio" y comparativa filosófica Kakebo vs automatización. |

---

### P0.9 — Consistencia total de metadata del blog

| Campo | Detalle |
|---|---|
| **Objetivo** | Corregir `mainEntityOfPage` y `BreadcrumbList` en JSON-LD (usaban `/${locale}/` incorrecto), añadir Twitter Cards por post |
| **Commit** | `f3cddc7` — `feat(seo): finalize blog metadata consistency` |
| **Archivo clave** | `src/app/[locale]/(public)/blog/[slug]/page.tsx` |
| **Resultado** | JSON-LD de BlogPosting con `mainEntityOfPage["@id"]` correcto. BreadcrumbList con 3 ítems (Inicio → Blog → Post) con URLs correctas. Twitter Card `summary_large_image` con imagen y descripción por post. |

---

## UI Sprint 1 — En progreso

### UI-1.1 — Hero images en posts del blog

| Campo | Detalle |
|---|---|
| **Objetivo** | Añadir imagen hero (`aspect-video`, `fill`, `priority`) debajo del header en todos los posts que tengan `image` en frontmatter |
| **Commit** | `ff0326f` — `feat(ui): add hero images to blog posts` |
| **Archivo clave** | `src/app/[locale]/(public)/blog/[slug]/page.tsx` |
| **Resultado** | Hero con `next/image` `fill` + `rounded-xl` renderizado entre `<header>` y el bloque de prose. LCP optimizado con `priority`. Condicional: solo si `post.frontmatter.image` existe. |

**Bloque añadido:**
```tsx
{post.frontmatter.image && (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl mb-12">
        <Image src={post.frontmatter.image} alt={post.frontmatter.title}
               fill className="object-cover" priority
               sizes="(max-width: 768px) 100vw, 768px" />
    </div>
)}
```

---

### UI-1.2 — Estilo visual de secciones FAQ

| Campo | Detalle |
|---|---|
| **Objetivo** | Dar tratamiento visual específico a las FAQ del blog: fondo suave, borde, separadores, jerarquía visual. Sin tocar texto, canonicals, schema ni slugs. |
| **Commit** | `c8e1b35` — `feat(ui): style blog faq sections` |
| **Archivos clave** | `src/components/mdx/MDXComponents.tsx`, `plantilla-kakebo-excel.es.mdx`, `alternativas-a-app-bancarias.es.mdx` |
| **Resultado** | Nuevos componentes `FaqSection` y `FaqItem` en MDXComponents. Las FAQ dejan de ser H3+párrafo prose y pasan a un panel con borde `border-border`, `bg-muted/30`, `divide-y`, `rounded-xl`, con `?` terracota y respuesta en `text-muted-foreground`. `not-prose` para romper con la tipografía del artículo. |

**Componentes añadidos:**
```tsx
FaqSection — contenedor con not-prose, rounded-xl, border, bg-muted/30, divide-y
FaqItem    — ítem con question prop (font-serif, semibold, text-primary ?) + children (text-sm, muted)
```

**MDX usage:**
```mdx
<FaqSection>
<FaqItem question="¿Pregunta?">
Respuesta en texto plano.
</FaqItem>
</FaqSection>
```

### UI-1.3 — Componente Related Posts

| Campo | Detalle |
|---|---|
| **Objetivo** | Reemplazar listas markdown `- [texto](url)` de "Artículos relacionados" por grid visual de tarjetas con imagen, título y excerpt |
| **Commit** | `dde1ee2` — `feat(ui): improve related posts presentation` |
| **Archivos clave** | `src/components/mdx/RelatedPosts.tsx` (nuevo), `MDXComponents.tsx`, `plantilla-kakebo-excel.es.mdx`, `alternativas-a-app-bancarias.es.mdx` |
| **Resultado** | Componente `RelatedPosts` que llama `getBlogPost()` síncronamente por slug, renderiza grid 2 columnas (`sm:grid-cols-2`) con `aspect-video`, hover `scale-105`, título `font-serif` y excerpt `line-clamp-2`. Registrado en `components` de MDXComponents. |

**Usage en MDX:**
```mdx
<RelatedPosts slugs={["kakebo-online-gratis", "eliminar-gastos-hormiga", "libro-kakebo-pdf"]} />
```

---

### UI-1.4 — Featured card en el índice del blog

| Campo | Detalle |
|---|---|
| **Objetivo** | Destacar el artículo más reciente como tarjeta de ancho completo en el índice `/blog`, con el resto en el grid 3-col existente |
| **Commit** | (ver abajo) — `UI-1.4: add featured blog post card` |
| **Archivo clave** | `src/app/[locale]/(public)/blog/page.tsx` |
| **Resultado** | `[featured, ...rest] = posts`. Featured card: layout `flex-col md:flex-row`, imagen LCP `priority` 50% ancho desktop, badge "Artículo destacado" en `bg-primary/10 text-primary`, título `h2 text-3xl font-serif`, excerpt `line-clamp-4`. Resto en grid `md:grid-cols-2 lg:grid-cols-3` sin cambios. Helper `hasPublicImage()` reemplaza lógica `fs.existsSync` inline. |

---

### UI-1.5 — Normalizar color de links en Navbar

| Campo | Detalle |
|---|---|
| **Objetivo** | Eliminar `text-red-600` hardcoded del enlace "Calculadora de inflación" en el dropdown de herramientas; unificar con el sistema de tokens |
| **Commit** | (ver abajo) — `UI-1.5: normalize navbar color states` |
| **Archivo clave** | `src/components/landing/Navbar.tsx` |
| **Resultado** | Dos ocurrencias eliminadas: (1) desktop dropdown `<span className="... text-red-600">` → `text-foreground` ya presente en la misma clase; (2) mobile menu `text-red-600` → `text-foreground` igual que los otros dos tool links. El resto del Navbar ya era consistente: nav links `text-muted-foreground hover:text-foreground`, dropdown items `text-foreground`, CTAs `bg-primary text-primary-foreground`. |

**Auditoría completa del Navbar:**
- Desktop nav links: `text-muted-foreground hover:text-foreground` — ✓ uniforme en todos
- Dropdown herramientas (desktop): `text-foreground` en título, `text-muted-foreground` en descripción — ✓ uniforme (tras fix)
- Mobile menu links: `text-foreground` — ✓ uniforme (tras fix)
- CTA buttons: `bg-primary text-primary-foreground` — ✓ uniforme
- Sin inconsistencias adicionales detectadas

---

---

### BUG-FIX: RelatedPosts crash en producción

| Campo | Detalle |
|---|---|
| **Síntoma** | Error boundary "Algo salió mal" en `/blog/plantilla-kakebo-excel` y `/blog/alternativas-a-app-bancarias` |
| **Error** | `TypeError: Cannot read properties of undefined (reading 'map')` en `RelatedPosts` |
| **Causa raíz** | `next-mdx-remote/rsc` v6 no pasa correctamente props de array literal (`slugs={[...]}`) a componentes custom desde el contexto MDX. El prop `slugs` llega `undefined`. |
| **Fix** | Mover `RelatedPosts` fuera del contexto MDX: slugs movidos a frontmatter YAML (`related:`) y el componente se renderiza en `page.tsx` directamente después de `<MDXRemote>`. |
| **Archivos** | `src/lib/blog.ts`, `src/components/mdx/RelatedPosts.tsx`, `src/components/mdx/MDXComponents.tsx`, `src/app/[locale]/(public)/blog/[slug]/page.tsx`, `plantilla-kakebo-excel.es.mdx`, `alternativas-a-app-bancarias.es.mdx` |
| **Validado** | Build limpio. HTTP 200 en ambas URLs localmente. Sección "Artículos relacionados" renderiza. Sin errores en logs. |

---

## SEO Sprint 2 — En progreso

### SEO-2.1 — Corregir canonical e hreflang rotos

| Campo | Detalle |
|---|---|
| **Objetivo** | Resolver los dos bugs P0 de canonical/hreflang detectados en AUDIT-SEO-POST-P0 |
| **Archivos** | `src/app/[locale]/(public)/blog/page.tsx`, `src/content/blog/kakebo-online-complete-guide.en.mdx` → renombrado |
| **Commit** | (ver abajo) — `SEO-2.1: fix blog canonical and hreflang issues` |

**Bug 1 — Blog index canonical/hreflang:**
- Antes: `canonical: "/${locale}/blog"` → generaba `/es/blog` (relativo e incorrecto)
- Después: `canonical: "https://www.metodokakebo.com${locale === 'es' ? '' : '/${locale}'}/blog"` (absoluto, patrón DA-01)
- hreflang `es`/`en`/`x-default` también corregidos a URLs absolutas

**Bug 2 — Slug mismatch kakebo-online:**
- Antes: `kakebo-online-complete-guide.en.mdx` (slug EN diferente al ES) → hreflang apuntaba a 404
- Después: renombrado a `kakebo-online-guia-completa.en.mdx` → ambos archivos comparten el mismo slug
- `/en/blog/kakebo-online-guia-completa` retorna 200 y los hreflang son simétricos

**Validación:**

| URL | Canonical | hreflang es | hreflang en | x-default |
|-----|-----------|-------------|-------------|-----------|
| `/blog` | `metodokakebo.com/blog` ✅ | `metodokakebo.com/blog` ✅ | `metodokakebo.com/en/blog` ✅ | `metodokakebo.com/blog` ✅ |
| `/en/blog` | `metodokakebo.com/en/blog` ✅ | `metodokakebo.com/blog` ✅ | `metodokakebo.com/en/blog` ✅ | `metodokakebo.com/blog` ✅ |
| `/blog/kakebo-online-guia-completa` | correcto ✅ | correcto ✅ | 200 ✅ | correcto ✅ |
| `/en/blog/kakebo-online-guia-completa` | correcto ✅ | correcto ✅ | correcto ✅ | — |

---

### SEO-2.2 — Related posts global (12 artículos)

| Campo | Detalle |
|---|---|
| **Objetivo** | Extender la arquitectura `RelatedPosts` a los 12 artículos ES sin campo `related:` en frontmatter |
| **Fecha** | 2026-06-18 |
| **Archivos** | 12 archivos `.es.mdx` en `src/content/blog/` (ver tabla de implementación abajo) |
| **Commit** | (ver abajo) — `SEO-2.2: implement sitewide related posts architecture` |

**Tabla de implementación (slugs `related:` asignados):**

| Artículo | related[0] | related[1] | related[2] | Cluster |
|----------|-----------|-----------|-----------|---------|
| `metodo-kakebo-guia-definitiva` | `metodo-kakebo-para-autonomos` | `kakebo-sueldo-minimo` | `ahorro-pareja` | C1 Pillar |
| `metodo-kakebo-para-autonomos` | `metodo-kakebo-guia-definitiva` | `kakebo-sueldo-minimo` | `kakebo-online-guia-completa` | C1 Supporting |
| `kakebo-sueldo-minimo` | `metodo-kakebo-guia-definitiva` | `ahorro-pareja` | `como-ahorrar-dinero-cada-mes` | C1 Supporting |
| `ahorro-pareja` | `metodo-kakebo-guia-definitiva` | `kakebo-sueldo-minimo` | `metodo-kakebo-para-autonomos` | C1 Supporting |
| `kakebo-online-guia-completa` | `kakebo-online-gratis` | `plantilla-kakebo-excel` | `libro-kakebo-pdf` | C2 Pillar |
| `kakebo-online-gratis` | `kakebo-online-guia-completa` | `plantilla-kakebo-excel` | `metodo-kakebo-guia-definitiva` | C2 Supporting |
| `libro-kakebo-pdf` | `kakebo-online-guia-completa` | `plantilla-kakebo-excel` | `metodo-kakebo-guia-definitiva` | C2 Supporting |
| `como-ahorrar-dinero-cada-mes` | `eliminar-gastos-hormiga` | `regla-30-dias` | `metodo-kakebo-guia-definitiva` | C3 Pillar |
| `eliminar-gastos-hormiga` | `como-ahorrar-dinero-cada-mes` | `regla-30-dias` | `metodo-kakebo-guia-definitiva` | C3 Supporting |
| `regla-30-dias` | `como-ahorrar-dinero-cada-mes` | `eliminar-gastos-hormiga` | `metodo-kakebo-guia-definitiva` | C3 Supporting |
| `kakebo-vs-ynab` | `metodo-kakebo-guia-definitiva` | `alternativas-a-app-bancarias` | `kakebo-online-gratis` | C4 |
| `peligros-apps-ahorro-automatico` | `alternativas-a-app-bancarias` | `metodo-kakebo-guia-definitiva` | `kakebo-online-gratis` | C4 |

**Validación:**
- `git grep "^related:" src/content/blog/*.es.mdx | wc -l` → **14** (todos los artículos ES, incluidos los 2 del BUG-FIX previo)
- `npm run build` → ✅ Compiled successfully in ~9s, 0 errores, 29/29 páginas estáticas generadas

**Riesgos pendientes:**
- **Canibalización C2** — `kakebo-online-gratis` vs `kakebo-online-guia-completa` comparten keywords similares. El enlazado refuerza la distinción pillar/supporting pero no resuelve el solapamiento de intención. Pendiente de datos de Search Console → SEO-2.4.
- **Inconsistencia C2** — `plantilla-kakebo-excel` recibe inlinks como supporting de C2, pero su contenido se dirige más hacia comparativa de herramientas (rol C4). La jerarquía interna quedará clarificada en SEO-2.3 (enlazado interno) y será reevaluada en Content Sprint 1.

---

### SEO-2.3A — Enlazado interno contextual P0 (pillar architecture)

| Campo | Detalle |
|---|---|
| **Objetivo** | Implementar los 19 enlaces P0 de PLAN-SEO-2.3: Supporting → Pillar y cross-cluster de alta prioridad |
| **Fecha** | 2026-06-18 |
| **Archivos** | 14 archivos `.es.mdx` en `src/content/blog/` |
| **Commit** | `SEO-2.3A: implement pillar-supporting contextual links` |

**19 enlaces implementados:**

| # | Origen | Destino | Anchor |
|---|---|---|---|
| 1 | `metodo-kakebo-guia-definitiva` | `kakebo-sueldo-minimo` | "guía de Kakebo con el salario mínimo" |
| 2 | `metodo-kakebo-para-autonomos` | `metodo-kakebo-guia-definitiva` | "Método Kakebo" |
| 3 | `kakebo-sueldo-minimo` | `metodo-kakebo-guia-definitiva` | "El Método Kakebo" |
| 4 | `ahorro-pareja` | `metodo-kakebo-guia-definitiva` | "método japonés Kakebo" |
| 5 | `kakebo-online-guia-completa` | `metodo-kakebo-guia-definitiva` | "método Kakebo" |
| 6 | `kakebo-online-gratis` | `metodo-kakebo-guia-definitiva` | "método tradicional inventado por Motoko Hani" |
| 7 | `kakebo-online-gratis` | `kakebo-online-guia-completa` | "guía completa del Kakebo online" |
| 8 | `libro-kakebo-pdf` | `metodo-kakebo-guia-definitiva` | "método zen financiero" |
| 9 | `libro-kakebo-pdf` | `kakebo-online-guia-completa` | "Kakebo en formato digital" |
| 10 | `plantilla-kakebo-excel` | `metodo-kakebo-guia-definitiva` | "El método Kakebo" |
| 11 | `plantilla-kakebo-excel` | `kakebo-online-guia-completa` | "Kakebo online" |
| 12 | `como-ahorrar-dinero-cada-mes` | `regla-30-dias` | "La Regla de Enfriamiento de 30 Días para Caprichos" |
| 13 | `como-ahorrar-dinero-cada-mes` | `eliminar-gastos-hormiga` | "pequeños gastos absurdos" |
| 14 | `eliminar-gastos-hormiga` | `como-ahorrar-dinero-cada-mes` | "ahorro mensual" |
| 15 | `regla-30-dias` | `metodo-kakebo-guia-definitiva` | "método Kakebo" |
| 16 | `regla-30-dias` | `como-ahorrar-dinero-cada-mes` | "ahorro mensual" |
| 17 | `kakebo-vs-ynab` | `metodo-kakebo-guia-definitiva` | "Método Kakebo" |
| 18 | `alternativas-a-app-bancarias` | `metodo-kakebo-guia-definitiva` | "método Kakebo" |
| 19 | `peligros-apps-ahorro-automatico` | `metodo-kakebo-guia-definitiva` | "Método Japonés Kakebo" |

**Reglas seguidas:** solo anchors existentes (6 de los 19 añadieron 1 frase de referencia mínima siguiendo el patrón de cross-references ya presentes). Sin tocar `related:`, FAQs, slugs ni secciones "Artículos relacionados" manuales.

**Validación:** `npm run build` → ✅ Compiled successfully, 0 errores.

---

### SEO-2.3B — Cross-cluster links + authority balancing

| Campo | Detalle |
|---|---|
| **Objetivo** | Corregir los desequilibrios estructurales detectados en AUDIT-SEO-POST-2.3A: reforzar el pillar C3, rescatar el artículo huérfano y normalizar las URLs internas al canónico ES. |
| **Fecha** | 2026-06-18 |
| **Archivos** | 14 archivos `.es.mdx` en `src/content/blog/` (4 con ediciones contextuales + normalización de URLs en todos los que tenían enlaces internos) |
| **Commit** | `SEO-2.3B: implement cross-cluster links and authority balancing` |

**Alcance ejecutado — correcciones estructurales aprobadas por auditoría (Fase 2A/2B/2C):**

| Fase | Acción | Resultado verificado |
|------|--------|----------------------|
| **2A — Reforzar pillar C3** | Enlaces contextuales adicionales (anchor exact-match `ahorrar dinero cada mes`) desde `eliminar-gastos-hormiga` y `regla-30-dias` → `como-ahorrar-dinero-cada-mes`. | Inbound contextual del pillar C3: **2 → 4**. |
| **2B — Rescatar huérfano** | Enlaces contextuales a `libro-kakebo-pdf` desde `kakebo-online-guia-completa` (pillar C2) y `plantilla-kakebo-excel` (supporting C2). | `libro-kakebo-pdf` inbound: **0 → 2** (deja de ser huérfano). |
| **2C — Normalizar URLs internas** | Sustitución `/es/blog/…` → `/blog/…` (canónico ES, DA-01) en todos los `.es.mdx`. | **59 → 0** enlaces `/es/blog/`. Enlaces EN (`/en/blog/`) intactos. Sin enlaces rotos. |

**Validación:** `npm run build` → ✅ Compiled successfully in 7.2s, 0 errores, 29/29 páginas estáticas.

> **Nota — enlaces P1 (Fase 1) NO implementados en este paso.** El subconjunto P0 de PLAN-SEO-2.3 se materializó enlace por enlace en la tabla de SEO-2.3A, pero **los 12 enlaces P1 nunca se enumeraron en ningún artefacto** (PROJECT_STATUS/DA-10 solo describía el *scope*, no la lista). Por decisión explícita, SEO-2.3B (Fase 2) ejecutó únicamente las correcciones estructurales de la auditoría (2A/2B/2C). La enumeración formal y la implementación parcial se completaron después en **SEO-2.3B-P1** (ver sección siguiente). Ningún enlace P2 fue tocado.

---

### SEO-2.3B-P1 — Enlaces cross-cluster aprobados (Tier A)

| Campo | Detalle |
|---|---|
| **Objetivo** | Enumerar los enlaces P1 (inexistentes en PLAN-SEO-2.3) e implementar el subconjunto de alto valor (Tier A) que refuerza el pillar C2 débil y conecta clusters. |
| **Fecha** | 2026-06-18 |
| **Plan** | Se enumeraron 12 candidatos cross-cluster (PLAN-SEO-2.3B-P1) y se aprobó implementar **solo los 7 del Tier A**; los 5 del Tier B quedan diferidos para evitar sobre-concentración de inbound y dilución. |
| **Commit** | `SEO-2.3B-P1: implement approved cross-cluster links` |

**7 enlaces Tier A implementados (anchors naturales, sin tocar FAQs/related/schema/slugs):**

| # | Origen | Destino | Dir | Anchor |
|---|--------|---------|-----|--------|
| 1 | `metodo-kakebo-guia-definitiva` | `kakebo-online-guia-completa` | C1→C2 | "guía completa del Kakebo online" |
| 2 | `metodo-kakebo-para-autonomos` | `kakebo-online-guia-completa` | C1→C2 | "guía completa del Kakebo online" |
| 3 | `kakebo-vs-ynab` | `kakebo-online-guia-completa` | C4→C2 | "guía del Kakebo online" |
| 4 | `kakebo-sueldo-minimo` | `kakebo-online-gratis` | C1→C2 | "llevar el Kakebo online gratis" |
| 5 | `ahorro-pareja` | `como-ahorrar-dinero-cada-mes` | C1→C3 | "técnicas para ahorrar cada mes" |
| 6 | `como-ahorrar-dinero-cada-mes` | `kakebo-online-gratis` | C3→C2 | "Kakebo online gratis" |
| 7 | `kakebo-online-gratis` | `como-ahorrar-dinero-cada-mes` | C2→C3 | "cómo ahorrar dinero cada mes" |

**Efecto sobre la arquitectura:** pillar C2 (`kakebo-online-guia-completa`) inbound contextual **3 → 6** (corrige la inversión pillar/supporting); el pillar C3 gana una salida hacia C2 (antes no tenía ninguna).

**Validación:** `npm run build` → ✅ Compiled successfully in 7.0s, 0 errores, 29/29 páginas. 0 enlaces rotos, 0 `/es/blog/`.

> **Tier B (5 enlaces) NO implementado.** Diferido por riesgo de sobre-concentración de inbound en `como-ahorrar` y rendimientos decrecientes; reevaluar antes de SEO-2.3C / con datos de Search Console.

---

## Content Sprint 1 — En preparación

### RESEARCH-CS1-01 — Validación histórica Motoko Hani / origen del Kakebo

| Campo | Detalle |
|---|---|
| **Objetivo** | Validar con fuentes los datos históricos del primer artículo de CS1 ("Origen del método Kakebo: la historia de Motoko Hani"). |
| **Fecha** | 2026-06-18 |
| **Estado** | ✅ Completado |
| **Documento generado** | `docs/research/CS1-01-motoko-hani-research.md` |
| **Commit** | `RESEARCH: validate Motoko Hani and Kakebo historical sources` |

**Resultado:** datos validados con fuentes independientes (Wikipedia EN, Encyclopedia.com, National Diet Library de Japón, Red Circle Authors, fichas editoriales). Cronología confirmada: 1873 (nacimiento), 1897 (primera periodista), 1901 (boda), 1903 (revista *Katei no Tomo*), 1904 (primer Kakeibo), 1908 (renombrada *Fujin no Tomo*), 1921 (Jiyu Gakuen), 1957 (fallecimiento).

**Decisión editorial sobre cronología (1904 vs 1908):** no es contradicción sino tres hitos distintos. Se **mantiene 1904** como año de origen del Kakebo (correcto y consistente con el sitio) y se **corrige la atribución de la revista**: el kakeibo de 1904 apareció en ***Katei no Tomo*** (fundada en 1903), que se **renombró *Fujin no Tomo* en 1908**. Se evita el anacronismo "Fujin no Tomo en 1904". Tarea derivada anotada: corregir esa imprecisión en `metodo-kakebo-guia-definitiva.es.mdx` (fuera del alcance de esta investigación).

---

## UI/UX Sprint — Páginas Públicas Indexables

### UIUX-INDEXABLE-01 — Auditoría visual y UX completada

| Campo | Detalle |
|---|---|
| **Tipo** | Etapa 1 — Auditoría. Sin implementación. |
| **Fecha** | 2026-06-22 |
| **Estado** | ✅ Completado |
| **Código no modificado** | Confirmado. Cero cambios de código en esta tarea. |

**Archivos auditados:** Navbar, Hero, Features, HowItWorks, Testimonials, SavingsSimulator, FAQ, SeoContent, Footer, blog/page.tsx, blog/[slug]/page.tsx, herramientas/calculadora-ahorro/page.tsx, globals.css, tailwind.config.ts.

**Resumen de hallazgos críticos:**

| ID | Problema | Prioridad |
|---|---|---|
| F1 | Max-width cambia en cada sección de home (6xl → 7xl → 5xl → 4xl) | Crítico |
| L2 | Navbar muestra hash links a secciones de home desde artículos del blog (UX trap) | Crítico |
| L1 | Features grid: 4 tarjetas en 3-col → card huérfana en segunda fila | Crítico |
| T1 | H2 de sección inconsistente: serif/non-serif, normal/bold sin regla | Crítico |
| C1 | Colores hardcoded `text-green-600 text-red-600` en HowItWorks | Crítico |
| A2 | Testimonios con avatares emoji — credibilidad comprometida | Importante |
| A3 | Product Hunt widget en footer — extraño al sistema visual | Importante |
| M1 | Hover de botones inconsistente: scale vs color-change vs underline | Importante |
| L3 | CTA del artículo atrapada dentro de max-w-3xl | Importante |
| C2-C3 | Colores hardcoded stone-* y testimonials bg-stone | Importante |

**Dirección estética recomendada:** *"Editorial financiero con identidad japonesa propia"* — resolver la tensión entre landing SaaS genérica y blog editorial de autoridad. Ver informe completo en el historial de la tarea UIUX-INDEXABLE-01.

**Tareas de implementación priorizadas (Etapa 3 — pendientes de dirección aprobada):**

| ID | Tarea | Impacto |
|---|---|---|
| UIUX-02 | Estandarizar max-width (max-w-6xl home, max-w-4xl editorial) | Muy alto |
| UIUX-03 | Contextualizar Navbar en blog: quitar hash links home | Alto |
| UIUX-04 | Resolver Features grid (2×2 o 5ª feature) | Alto |
| UIUX-05 | Unificar regla tipográfica H2: `font-serif font-normal` landing | Alto |
| UIUX-06 | Reemplazar avatares emoji en Testimonials | Alto |
| UIUX-07 | Eliminar widget Product Hunt del footer | Medio-Alto |
| UIUX-08 | Reemplazar hardcoded colors con semantic tokens | Medio |
| UIUX-09 | Activar `.bg-sakura` sutilmente en una sección | Medio |
| UIUX-10 | Añadir diferenciadores visuales a FeatureCards | Medio |
| UIUX-11 a 15 | Refinamientos de hover, CTA, accesibilidad, blog, accent | Bajo-Medio |

> Ver informe de auditoría completo en la conversación DOC-MEMORY-UIUX-01 → UIUX-INDEXABLE-01.

**Siguiente en esta fase:** acordar dirección estética con el usuario (Etapa 2) antes de iniciar implementación (Etapa 3).

### UIUX-08 — Colores hardcoded reemplazados por tokens semánticos

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-23 |
| **Estado** | ✅ Completado |
| **Archivos** | `HowItWorks.tsx` · `Testimonials.tsx` · `blog/[slug]/page.tsx` |
| **Build** | ✅ Compiled successfully |
| **Tests** | ✅ 506/506 |

**Colores hardcoded encontrados y reemplazados (DA-12-D7):**

| Archivo | Antes | Después | Justificación |
|---|---|---|---|
| `HowItWorks.tsx` L109 | `text-green-600 dark:text-green-400` | `text-primary` | Income destacado con el color de marca — editorial, no semáforo |
| `HowItWorks.tsx` L113/117 | `text-red-600 dark:text-red-400` | `text-muted-foreground` | Gastos subdued — el signo `-` ya comunica negativo |
| `Testimonials.tsx` L18 | `bg-stone-50 dark:bg-stone-900/50` | `bg-muted/30` | Token semántico · mismo sistema que HowItWorks background |
| `Testimonials.tsx` L41 | `bg-stone-100 dark:bg-stone-800` | `bg-muted` | Token semántico · correcto en claro y oscuro |
| `blog/[slug]/page.tsx` L136 | `bg-stone-900 text-white` | `bg-foreground text-background` | Par semántico invertido — funciona en ambos modos |
| `blog/[slug]/page.tsx` L140 | `text-stone-300` | `text-background/70` | 70% opacity sobre foreground — contraste correcto en ambos modos |
| `blog/[slug]/page.tsx` L145 | `bg-white text-stone-900` | `bg-background text-foreground` | Par semántico directo |

**Colores hardcoded fuera del scope no tocados (con justificación):**
- `Navbar.tsx`: `bg-white dark:bg-stone-950` — backdrop blur del navbar, comportamiento específico · fuera de scope explícito
- `HeroCTA.tsx`: `bg-stone-900 dark:bg-stone-100` — bloque CTA del Hero · fuera de scope explícito
- `ToolsSection.tsx`: hover states `hover:border-red-600 group-hover:bg-red-600` — motion interactivo · scope excluye "motion/hover general"
- `CalculatorInflation.tsx`: `text-red-500 text-red-600` sobre resultado de inflación — semántico real (inflación = pérdida) · rediseño excede scope
- `SavingsCalculator.tsx`: `bg-stone-900` interior de tarjeta de resultados · rediseño de componente complejo excede scope
- `sobre-nosotros/page.tsx` · `herramientas/page.tsx`: no estaban en los hallazgos de UIUX-INDEXABLE-01

---

### UIUX-07 — Widget Product Hunt eliminado del footer

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-22 |
| **Estado** | ✅ Completado |
| **Archivo** | `src/components/landing/Footer.tsx` |
| **Build** | ✅ Compiled successfully |
| **Tests** | ✅ 506/506 |

**Cambio aplicado (DA-12-D5):** eliminado el bloque `{/* Product Hunt Widget */}` (líneas 25–37 del original) junto con el `/* eslint-disable @next/next/no-img-element */` del encabezado del archivo, que existía únicamente por el `<img>` del widget.

**Bloque eliminado:** tarjeta con `style` inline (fondo blanco hardcoded `rgb(255,255,255)`, borde `rgb(224,224,224)`, botón naranja `rgb(255,97,84)`), imagen externa `ph-files.imgix.net`, enlace a producthunt.com con `utm_source=embed`.

**Sin tocar:** Product Hunt badge del Hero (`/components/landing/Hero.tsx`) — sigue activo. Estructura, navegación, copyright y bottom bar del footer — sin cambios.

---

### UIUX-14 — Índice del blog refinado

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-23 |
| **Estado** | ✅ Completado |
| **Archivo modificado** | `src/app/[locale]/(public)/blog/page.tsx` |
| **Build** | ✅ Compiled successfully (0 errores TypeScript) |
| **Tests** | ✅ 506/506 passing |

**Diagnóstico antes:** Artículo destacado y grid sin separador visual. Featured card con mismo `border-border` que cards del grid (sin diferenciación base). Excerpt `line-clamp-4` demasiado denso. Poco padding inferior en la página.

**Cambios aplicados:**

| Elemento | Antes | Después |
|---|---|---|
| Outer wrapper padding inferior | `pb-16` | `pb-24` |
| Featured card margin inferior | `mb-10` | `mb-12` |
| Featured card borde base | `border-border` | `border-primary/20` (siempre distinguible) |
| Featured card borde hover | `hover:border-primary/30` | `hover:border-primary/50` |
| Featured excerpt | `line-clamp-4` | `line-clamp-3` |
| Separador featured/grid | — (directo) | Separador con líneas laterales + label "Todos los artículos / All articles" |

**Separador añadido:** `flex items-center gap-4` con `border-t border-border/50` a ambos lados y label `text-xs font-medium text-muted-foreground uppercase tracking-widest`. Inline `locale === 'es'` para ES/EN (mismo patrón ya usado para el badge "Artículo destacado").

**Sin tocar:** MDX, frontmatter, imágenes, metadata, canonical, hreflang, routing, grid layout, cards del grid, hover de links, Footer, Navbar.

**Próxima tarea recomendada:** Pausa de la fase UIUX-INDEXABLE para revisar datos de Search Console, o continuar con UIUX-15 (mejoras de accesibilidad en blog o refinamientos de mobile).

---

### UIUX-13 — CTA final de artículos refinado

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-23 |
| **Estado** | ✅ Completado |
| **Archivo modificado** | `src/app/[locale]/(public)/blog/[slug]/page.tsx` |
| **Build** | ✅ Compiled successfully (0 errores TypeScript) |
| **Tests** | ✅ 506/506 passing |

**Diagnóstico antes:** CTA dentro de `<article className="max-w-3xl">`. Constreñido al ancho de lectura (~768px). Padding `px-6 py-10 sm:px-12` limitado. Sin max-width propio en el párrafo de texto.

**Cambios aplicados:**

| Elemento | Antes | Después |
|---|---|---|
| Contenedor | Dentro de `<article max-w-3xl>` | Fuera del `<article>`, en `<div max-w-5xl>` propio |
| Article padding | `py-24` | `pt-24 pb-16` (conserva respiración superior, reduce inferior) |
| CTA padding horizontal | `px-6 sm:px-12` | `px-8 sm:px-16` |
| CTA padding vertical | `py-10` | `py-12` |
| Párrafo CTA | Sin max-width, sin font-light | `mx-auto max-w-md font-light leading-relaxed` |
| Semántica | CTA dentro de `<article>` (incorrecto) | CTA fuera de `<article>` (correcto — no es contenido editorial) |

**Tokens sin cambio:** `bg-foreground`, `text-background`, `text-background/70`, `bg-background`, `text-foreground`, `hover:opacity-90`, `focus-visible:ring-2 ring-primary/40` — todos conservados de UIUX-08 y UIUX-11.

**Sin tocar:** MDX, metadata, canonical, hreflang, JSON-LD, routing, contenido textual del CTA.

**Próxima tarea recomendada:** Pausa de fase UIUX-INDEXABLE o continuar con UIUX-14 (refinamientos adicionales del blog: índice de artículos, tipografía de prose, o experiencia mobile).

---

### UIUX-12 — Accesibilidad dropdown de herramientas en Navbar

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-23 |
| **Estado** | ✅ Completado |
| **Archivo modificado** | `src/components/landing/Navbar.tsx` |
| **Build** | ✅ Compiled successfully (0 errores TypeScript) |
| **Tests** | ✅ 506/506 passing |

**Diagnóstico antes:** Dropdown controlado solo por CSS `group-hover`. El `<button>` tenía `outline-none` (foco eliminado). Sin `aria-expanded`, `aria-haspopup`, ni `aria-controls`. El panel `invisible` seguía en DOM y podía ser leído por lectores de pantalla.

**Solución aplicada — mínima intervención:**

| Cambio | Detalle |
|---|---|
| `useRef` añadido | `toolsRef` (container), `toolsButtonRef` (trigger) |
| `isToolsOpen` state | Controla apertura vía React en lugar de solo CSS |
| `useEffect` click-outside | Cierra dropdown al hacer click fuera del container |
| `onMouseEnter/Leave` en container | Mantiene el comportamiento hover de ratón |
| `onKeyDown` Escape en container | Cierra dropdown y devuelve foco al botón trigger |
| `onClick` en botón | Toggle apertura por teclado (Enter/Space) |
| `aria-expanded={isToolsOpen}` | Estado accesible para lectores de pantalla |
| `aria-haspopup="true"` | Indica que el botón controla un popup |
| `aria-controls="tools-dropdown-menu"` | Referencia explícita al panel |
| `id="tools-dropdown-menu"` | Identifica el panel |
| `aria-hidden="true"` en SVG chevron | Decorativo — excluido de accesibilidad |
| Eliminado `outline-none` del botón | Sustituido por `focus-visible:ring-2 ring-primary/40` |
| `pointer-events-none` cuando cerrado | El panel invisible no captura eventos de ratón |
| `focus-visible:ring-inset` en links | Foco visible dentro de items del dropdown |
| Eliminado `group`/`group-hover` CSS | Controlado por estado React en su lugar |

**Comportamientos resultantes:**
- Ratón: hover abre, hover-out cierra, click en link cierra y navega ✓
- Teclado: Tab al botón → Enter/Space abre → Tab navega links → Escape cierra y devuelve foco ✓
- Click outside: cierra dropdown ✓
- Screen reader: `aria-expanded` refleja estado real, panel excluido del flujo cuando cerrado ✓
- Mobile: no afectado (el dropdown desktop está en `hidden md:flex`) ✓

**Sin tocar:** layout visual, links, textos, mobile menu, CTAs de autenticación.

**Próxima tarea recomendada:** UIUX-13 o refinamientos de blog/experiencia de lectura de artículos (ver candidatos de la auditoría).

---

### UIUX-11 — Hover y estados interactivos de CTAs unificados

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-23 |
| **Estado** | ✅ Completado |
| **Archivos modificados** | `HeroCTA.tsx`, `Hero.tsx`, `Navbar.tsx`, `blog/[slug]/page.tsx`, `SavingsSimulator.tsx` |
| **Build** | ✅ Compiled successfully (0 errores TypeScript) |
| **Tests** | ✅ 506/506 passing |

**Regla de interacción definida:**

| Tipo | Patrón hover | Focus-visible |
|---|---|---|
| CTA primario (`bg-primary`) | `transition-colors hover:bg-primary/90` | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background` |
| CTA primario invertido (`bg-foreground`) | `transition-colors hover:bg-foreground/90` | ídem |
| CTA secundario (outlined) | `transition-colors hover:border-primary/40` | ídem |
| Link editorial | `hover:underline` | sin cambio |
| Link navegación | `transition-colors hover:text-foreground` | sin cambio |

**Cambios aplicados:**

| Archivo | CTA | Cambio |
|---|---|---|
| `HeroCTA.tsx` | Empezar gratis / Dashboard | `stone-900/stone-100` hardcoded → `bg-foreground text-background`; `transition-opacity hover:opacity-90` → `transition-colors hover:bg-foreground/90`; añadido focus-visible |
| `Hero.tsx` | CTA secundario (#features) | `hover:border-foreground` → `hover:border-primary/40`; añadido focus-visible |
| `Navbar.tsx` desktop | Login link, Start, Dashboard | Añadido focus-visible a los 3 CTAs existentes |
| `Navbar.tsx` mobile | Login, Start, Dashboard | Añadido hover (`hover:border-primary/40`, `hover:bg-primary/90`) + focus-visible a los 3 CTAs |
| `blog/[slug]/page.tsx` | Botón "Empieza gratis" en CTA | `transition-transform hover:scale-105` → `transition-colors hover:opacity-90`; añadido focus-visible |
| `SavingsSimulator.tsx` | CTA signup | `focus-visible:ring-1 focus-visible:ring-ring` → `focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background` |

**Sin cambios (ya consistentes):** Footer links (`hover:text-foreground` ✓), blog/page.tsx editorial links (`hover:underline` ✓), Navbar desktop nav links (`hover:text-foreground` ✓), blog card hovers (son contenedores, no CTAs).

**Excepción justificada:** `hover:scale-105` en imágenes de blog/page.tsx — es efecto sobre la imagen, no sobre un CTA. No se toca.

**Próxima tarea recomendada:** UIUX-12 — Ver candidatos UIUX-11a a 15 de la auditoría (accesibilidad del dropdown de herramientas, refinamientos de blog o accent).

---

### UIUX-10 — Diferenciadores visuales en FeatureCards

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-23 |
| **Estado** | ✅ Completado |
| **Archivo modificado** | `src/components/landing/Features.tsx` |
| **Build** | ✅ Compiled successfully (0 errores TypeScript) |
| **Tests** | ✅ 506/506 passing |

**Cambio aplicado:**

Añadido icono lineal de `lucide-react` a cada FeatureCard. Contenedor `rounded-xl bg-primary/10 text-primary h-10 w-10` encima del título.

| Card | Icono elegido | Justificación |
|---|---|---|
| Registro Manual Consciente | `PenLine` | Escritura manual — metáfora directa del acto de anotar |
| Control de Fijos | `Receipt` | Recibo/factura — metáfora directa de gastos fijos |
| Sin Conexión Bancaria | `ShieldCheck` | Escudo con check — privacidad y seguridad |
| Coach Financiero IA | `Sparkles` | Inteligencia sutil — no tech-infantil, sí editorial |

**Solución técnica:** `icon: ReactNode` como prop en `FeatureCardProps`. `import type { ReactNode } from "react"`. No se cambió el grid 2×2, el max-width, ni ninguna otra sección.

**Compatibilidad modo claro/oscuro:** `bg-primary/10` usa el token `primary` del design system (#cf5c5c / #f87171) con 10% de opacidad — sutil terracota que funciona en ambos modos. `text-primary` aplica el mismo token al icono.

**Próxima tarea recomendada:** UIUX-11 — Refinamientos de hover, CTA, accesibilidad, blog o accent (ver lista de candidatos en auditoría UIUX-INDEXABLE-01).

---

### UIUX-09 — bg-sakura activado en sección editorial de la home

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-23 |
| **Estado** | ✅ Completado |
| **Archivo modificado** | `src/app/[locale]/(public)/page.tsx` |
| **Build** | ✅ Compiled successfully (0 errores TypeScript) |
| **Tests** | ✅ 506/506 passing |

**Cambio aplicado:**

Sección elegida: "¿Qué es el método Kakebo?" (SEO whatIs, línea ~70 de `page.tsx`).

| Antes | Después |
|---|---|
| `<section className="relative py-16">` + `<div className="absolute inset-0 bg-background" />` | `<section className="relative py-16 bg-sakura">` (div opaco eliminado) |

**Justificación de la sección elegida:** Es la sección más directamente identitaria del método — explica el concepto Kakebo en texto editorial. Ancla la identidad japonesa donde más sentido tiene semánticamente. No es el Hero (demasiado protagonista), no es el Footer, no es el blog.

**Por qué funciona:** `bg-sakura` ya existía definida en `globals.css` con overlay 85% en modo claro y 92% en modo oscuro. El asset `/public/bg-sakura.png` existe. La textura es tan sutil que no compromete legibilidad. El div `absolute inset-0 bg-background` que había antes tapaba completamente el fondo del body (que ya tenía `bg-sakura` en `layout.tsx`) — eliminarlo es suficiente para dejar ver la textura.

**Compatibilidad:** Funciona en modo claro (overlay 85% blanco cálido) y modo oscuro (overlay 92% piedra oscuro). El contenido — tarjeta `bg-card` con borde `border-border` — flota sobre la textura sin que esta compita con texto o CTAs.

**bg-sakura en páginas públicas tras UIUX-09:**
- `page.tsx` (home): sección "¿Qué es el método Kakebo?" ← nuevo
- `sobre-nosotros/page.tsx`: ya existía (preexistente, no tocado)
- `herramientas/page.tsx`: ya existía (preexistente, no tocado)
- `layout.tsx` body: ya existía como base global (preexistente, no tocado)

**Próxima tarea recomendada:** UIUX-10 — Añadir diferenciadores visuales a FeatureCards.

---

### UIUX-08 — Colores hardcoded reemplazados por tokens semánticos

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-23 |
| **Estado** | ✅ Completado |
| **Archivos modificados** | `src/components/landing/HowItWorks.tsx`, `src/components/landing/Testimonials.tsx`, `src/app/[locale]/(public)/blog/[slug]/page.tsx` |
| **Build** | ✅ Compiled successfully (0 errores TypeScript) |
| **Tests** | ✅ 506/506 passing |

**Colores reemplazados:**

| Archivo | Hardcoded antes | Token semántico después | Justificación |
|---|---|---|---|
| HowItWorks.tsx | `text-green-600 dark:text-green-400` (ingresos) | `text-primary` | Terracota: color positivo de marca, coherente en modo claro y oscuro |
| HowItWorks.tsx | `text-red-600 dark:text-red-400` (gastos ×2) | `text-destructive` | Token semántico de estado negativo — `#be123c` (claro) / `#ef4444` (oscuro) |
| Testimonials.tsx | `bg-stone-50 dark:bg-stone-900/50` (sección) | `bg-muted/30` | Igual que HowItWorks — consistencia de secciones alternas |
| Testimonials.tsx | `ring-gray-900/5 dark:ring-white/10` (figura) | `ring-border/50` | Borde sutil usando token de borde al 50% de opacidad |
| Testimonials.tsx | `bg-stone-100 dark:bg-stone-800` (monograma) | `bg-muted` | `muted` (#f5f5f4 / #44403c) es equivalente directo de stone-100/stone-800 |
| blog/[slug]/page.tsx | `bg-stone-900` (CTA) | `bg-foreground` | Bloque invertido semántico: dark ink en claro, off-white en oscuro |
| blog/[slug]/page.tsx | `text-white` (CTA) | `text-background` | Inverso de `bg-foreground` — contraste garantizado en ambos modos |
| blog/[slug]/page.tsx | `text-stone-300` (CTA subtítulo) | `text-background/70` | Background al 70% para jerarquía visual dentro del bloque invertido |
| blog/[slug]/page.tsx | `bg-white` (botón CTA) | `bg-background` | Inverso consistente con el bloque |
| blog/[slug]/page.tsx | `text-stone-900` (botón CTA) | `text-foreground` | Contraste correcto sobre `bg-background` en ambos modos |

**Colores hardcoded conservados (fuera de scope o justificados):**
- `Navbar.tsx`: `bg-white/80 dark:bg-stone-950/80` — explícitamente excluido del scope.
- `HeroCTA.tsx`: `bg-stone-900 dark:bg-stone-100` — Hero/Product Hunt excluido del scope.
- `ToolsSection.tsx`, `Calculator*.tsx`, `sobre-nosotros`, `herramientas/page.tsx` — no estaban en los hallazgos de la auditoría UIUX-INDEXABLE-01; quedan como candidatos para una tarea futura (UIUX-08B si procede).

**Compatibilidad modo claro / modo oscuro:**
- HowItWorks: `primary` (#cf5c5c / #f87171) y `destructive` (#be123c / #ef4444) — ambos con contraste WCAG AA sobre `muted/20`.
- Testimonials: `muted/30` actúa como fondo alterno natural. Anillos con `border/50` apenas visibles en ambos modos (mismo nivel de sutileza que los valores anteriores).
- CTA artículo: bloque invertido `foreground/background` — ink sobre blanco en claro, blanco sobre ink en oscuro. Contraste WCAG AAA en ambos modos.

**Próxima tarea recomendada:** UIUX-09 — Activar `.bg-sakura` sutilmente en una sección del home.

---

### UIUX-06 — Atribución editorial sobria en Testimonials

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-22 |
| **Estado** | ✅ Completado |
| **Archivo** | `src/components/landing/Testimonials.tsx` |
| **Build** | ✅ Compiled successfully |
| **Tests** | ✅ 506/506 |

**Cambios aplicados (DA-12-D4):**

1. **Avatares emoji eliminados** — `👩‍🎨 👨‍💻 🎓 💼 📱 👨‍🏫` sustituidos por monograma de inicial en serif.
2. **Monograma editorial** — círculo `h-10 w-10 bg-stone-100 dark:bg-stone-800` con inicial `font-serif font-medium text-muted-foreground`. Mismo tamaño y fondo que el emoji anterior; tipografía sobria en lugar de símbolo decorativo. `aria-hidden="true"` porque la inicial es decorativa.
3. **Semántica H2 corregida** — el eyebrow label ("Comunidad Kakebo") pasa de `<h2>` a `<p>` (elemento no-heading). El título visual ("Lo que dicen nuestros usuarios...") pasa de `<p>` a `<h2>` con `font-serif font-normal tracking-tight` (DA-12-D2). La jerarquía semántica ahora refleja la jerarquía visual.

| Elemento | Antes | Después |
|---|---|---|
| Avatar | emoji decorativo (`text-lg`) | inicial serif (`font-serif font-medium text-muted-foreground`) |
| Eyebrow | `<h2>` (incorrecto) | `<p>` |
| Título visual | `<p> font-bold` | `<h2> font-serif font-normal tracking-tight` |

---

### UIUX-05 — H2 de sección unificados

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-22 |
| **Estado** | ✅ Completado |
| **Build** | ✅ · **Tests** | ✅ 506/506 |

**Regla aplicada (DA-12-D2):** `font-serif font-normal tracking-tight` en todos los H2 de sección de la landing.

**3 archivos modificados — 3 líneas:**

| Componente | Antes | Después |
|---|---|---|
| `HowItWorks.tsx` | `text-4xl font-bold tracking-tight` | `text-4xl font-serif font-normal tracking-tight` |
| `SavingsSimulator.tsx` | `text-3xl font-serif font-medium` | `text-3xl font-serif font-normal tracking-tight` |
| `AlternativesSection.tsx` | `text-3xl font-serif font-medium sm:text-4xl` | `text-3xl font-serif font-normal tracking-tight sm:text-4xl` |

**Sin cambio (ya correctos):** Features (`font-serif font-normal` ✅) · FAQ (`font-serif font-normal` ✅)

**Excepciones resueltas en UIUX-06:**
- `Testimonials.tsx` H2: corregido en UIUX-06 — eyebrow movido a `<p>`, título visual promovido a `<h2 font-serif font-normal>`.
- `page.tsx` SEO cards H2 (`text-2xl`): sub-títulos dentro de cards bordeadas, nivel visual distinto al de los títulos de sección standalone. No son H2 equivalentes en contexto de layout.

---

### UIUX-04 — Features grid equilibrado

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-22 |
| **Estado** | ✅ Completado |
| **Archivo** | `src/components/landing/Features.tsx` |
| **Build** | ✅ · **Tests** | ✅ 506/506 |

**Cambio:** `lg:grid-cols-3` → `lg:grid-cols-2`. Una sola clase modificada.

| Breakpoint | Antes | Después |
|---|---|---|
| Mobile | 1 col | 1 col (sin cambio) |
| Tablet (md) | 2 col | 2 col (sin cambio) |
| Desktop (lg) | 3 col → 3+1 huérfana | 2 col → 2×2 simétrico |

---

### UIUX-03 — Navbar contextualizado para blog

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-22 |
| **Estado** | ✅ Completado |
| **Archivo** | `src/components/landing/Navbar.tsx` |
| **Build** | ✅ Compiled successfully |
| **Tests** | ✅ 506/506 |

**Cambio aplicado:** `const isBlog = pathname.startsWith("/blog")` + 4 condiciones `{!isBlog && (...)}` envolviendo los links `#features` y `#how-it-works` en desktop y mobile.

| Contexto | Links visibles antes | Links visibles después |
|---|---|---|
| Home (`/`) | Tutorial · Blog · About · Tools · Características · Cómo funciona | Sin cambio |
| Blog index (`/blog`) | Tutorial · Blog · About · Tools · Características · Cómo funciona | Tutorial · Blog · About · Tools |
| Artículo (`/blog/[slug]`) | Tutorial · Blog · About · Tools · Características · Cómo funciona | Tutorial · Blog · About · Tools |

**Por qué funciona:** `usePathname()` de `next-intl/routing` devuelve el path sin prefijo de locale, por lo que `/en/blog/...` también retorna pathname `/blog/...`. Un solo `startsWith("/blog")` cubre ambas versiones lingüísticas.

---

### UIUX-02 — Max-width estandarizado

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-22 |
| **Estado** | ✅ Completado |
| **Build** | ✅ Compiled successfully |
| **Tests** | ✅ 506/506 |

**9 archivos modificados — todos `max-w-7xl` y `max-w-5xl` en la parte pública reemplazados por `max-w-6xl`:**

| Archivo | Antes | Después |
|---|---|---|
| `Features.tsx` | `max-w-7xl` | `max-w-6xl` |
| `HowItWorks.tsx` | `max-w-7xl` | `max-w-6xl` |
| `Testimonials.tsx` | `max-w-7xl` | `max-w-6xl` |
| `AlternativesSection.tsx` | `max-w-7xl` | `max-w-6xl` |
| `Footer.tsx` | `max-w-7xl` | `max-w-6xl` |
| `SeoContent.tsx` | `max-w-5xl` | `max-w-6xl` |
| `page.tsx` (home, SEO whatIs) | `max-w-5xl` | `max-w-6xl` |
| `page.tsx` (home, SEO categories) | `max-w-5xl` | `max-w-6xl` |
| `blog/page.tsx` | `max-w-5xl` | `max-w-6xl` |

**Conservados con justificación:**

| Archivo | Valor | Razón |
|---|---|---|
| `Navbar.tsx` | `max-w-6xl` | Ya correcto |
| `Hero.tsx` (main) | `max-w-6xl` | Ya correcto |
| `Hero.tsx` (subtítulo) | `max-w-3xl` | Constraint de texto dentro de columna, no layout |
| `Hero.tsx` (stats card) | `max-w-4xl` | Bloque editorial interior — DA-12 permite 4xl para editorial |
| `HowItWorks.tsx` (card ejemplo) | `max-w-3xl` | Bloque interior legibilidad — no es el ancho de sección |
| `SavingsSimulator.tsx` | `max-w-4xl` | Bloque interactivo centrado — DA-12: max-w-4xl editorial |
| `FAQ.tsx` | `max-w-4xl` | Bloque texto/editorial — DA-12: max-w-4xl para lectura |
| `blog/[slug]/page.tsx` | `max-w-3xl` | Artículo — DA-12: max-w-3xl para lectura |
| `herramientas/calculadora-ahorro` | `max-w-4xl`/`max-w-3xl` | Herramienta pública — editorial y contenido |
| Todos `max-w-2xl`/`max-w-xl` internos | — | Constraints de texto, no afectan el eje de layout |

### UIUX-DIRECCIÓN-01 — Dirección estética aprobada

| Campo | Detalle |
|---|---|
| **Tipo** | Etapa 2 — Dirección estética. Sin implementación. |
| **Fecha** | 2026-06-22 |
| **Estado** | ✅ Completado |
| **Decisión arquitectónica generada** | DA-12 — Dirección estética pública indexable |
| **Referencias visuales** | `imagenes/modo claro paleta estilo.png` · `imagenes/modo oscuro paleta estilo.png` |
| **Código no modificado** | Confirmado. Cero cambios de código en esta tarea. |

**Dirección aprobada:** *"Editorial financiero con identidad japonesa propia"*

Ver DA-12 en la sección de Decisiones arquitectónicas para el detalle completo.

---

## Cluster Presupuesto Personal — Sprint 1 (2026-06-22)

> Apertura del nuevo cluster temático "Presupuesto Personal" como puente entre el cluster Kakebo Core y la autoridad en finanzas personales generales.

### SEO-PILAR-01 — Artículo pilar publicado

| Campo | Detalle |
|---|---|
| **Objetivo** | Crear el artículo pilar del cluster Presupuesto Personal |
| **Título** | "Cómo hacer un presupuesto personal paso a paso (y que dure más de dos meses)" |
| **Slug** | `como-hacer-un-presupuesto-personal` |
| **URL ES (producción)** | `https://www.metodokakebo.com/blog/como-hacer-un-presupuesto-personal` |
| **Archivos** | `src/content/blog/como-hacer-un-presupuesto-personal.es.mdx` (principal) · `como-hacer-un-presupuesto-personal.en.mdx` (legacy) |
| **Imagen hero** | `public/images/blog/como-hacer-un-presupuesto-personal.webp` |
| **Commit** | `38c22ae` — `Feat: add pillar article SEO-PILAR-01` |
| **Validación** | Build ✅ · Tests 506/506 ✅ · Imagen hero corregida (`.webp.png` → `.webp`) |
| **Estado** | ✅ Completado 2026-06-22 · Indexación solicitada en Google Search Console |

**Características del artículo:**
- Sistema en 5 pasos + tabla comparativa de métodos (snippet target) + ejemplo completo de presupuesto real (María, 1.800 €)
- 7 FAQs en frontmatter → JSON-LD FAQPage para rich snippets
- 11 enlaces internos: 9 posts del blog + 2 herramientas (calculadora-ahorro, regla-50-30-20)
- 2 CTAs de herramientas integrados en contexto (Paso 1 y Paso 2)
- `related:` configurado → activa RelatedPosts component

---

### DOC-I18N-01 — Política SEO de idiomas formalizada

| Campo | Detalle |
|---|---|
| **Objetivo** | Documentar explícitamente que el SEO editorial nuevo opera solo en español |
| **Regla** | Solo se crean archivos `.es.mdx` nuevos. El inglés queda como contenido legacy. |
| **Archivos** | `PROJECT_STATUS.md` (raíz) → sección "Política SEO de Idiomas" · `INSTRUCCIONES.md` → Regla 6 en "Reglas de Oro" |
| **Commit** | `4b5ea7f` — `DOC: add SEO language policy` |
| **Estado** | ✅ Completado 2026-06-22 |

---

### CHECK-I18N-ROUTING-01 — Bug routing i18n corregido

| Campo | Detalle |
|---|---|
| **Síntoma** | `/blog/...` redirigía a `/en/blog/...` cuando el visitante/bot enviaba `Accept-Language: en` |
| **Causa raíz** | `next-intl` v4 tiene `localeDetection: true` por defecto; el middleware resolvía el locale por header HTTP en lugar de por URL prefix |
| **Fix aplicado** | `localeDetection: false` en `src/i18n/routing.ts` |
| **Archivo** | `src/i18n/routing.ts` |
| **Commit** | `5656eef` — `Fix: disable locale detection to prevent Accept-Language redirects` |
| **Validación** | Build ✅ · Tests 506/506 ✅ · URL española carga en español sin redirect a `/en/` |
| **Estado** | ✅ Completado 2026-06-22 |

**Comportamiento tras el fix:**

| URL | Antes del fix | Después del fix |
|---|---|---|
| `/blog/...` con `Accept-Language: es` | Español ✅ | Español ✅ |
| `/blog/...` con `Accept-Language: en` | Redirect → `/en/blog/...` ❌ | Español ✅ |
| `/en/blog/...` | Inglés ✅ | Inglés ✅ |

---

## UI/UX Blog — Artículos

### UIUX-GLOBAL-MOBILE-PREMIUM-01 — Sistema visual premium endurecido para mobile

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-24 |
| **Estado** | ✅ Completado |
| **Archivos** | `MDXComponents.tsx` · `HowItWorks.tsx` · `ToolsSection.tsx` |
| **Build** | ✅ Compiled successfully · 0 errores · 29/29 páginas |
| **Tests** | ✅ 506/506 |
| **Validación visual** | Estática (auditoría de clases responsive) — sin entorno de navegador local |

**Diagnóstico mobile antes:**

| Componente | Problema mobile real |
|---|---|
| `SimpleCTA` | `inline-block rounded-full px-8 py-4` — textos de 60-80 chars wrapeaban dentro de pill shape roto |
| `DownloadCTA` | Mismo problema que SimpleCTA |
| `ArticleCTA` button | `px-8` = 64px padding + texto "Empieza tu presupuesto hoy..." (~252px) = 316px en contenedor de 264px → **overflow real** |
| `ToolCTA` button | `px-6` + texto "Calcular mi distribución 50/30/20 →" (300px) en contenedor 280px → overflow potencial |
| `HowItWorks` | `space-y-12` entre pasos (48px), `mb-16` en header (64px), `p-8` en example card — pesados en 360px |
| `ToolsSection` | `py-24` fijo sin variante mobile |

**Cambios aplicados en `MDXComponents.tsx`:**

| Componente | Antes | Después |
|---|---|---|
| `SimpleCTA` button | `inline-block rounded-full px-8 py-4` | `inline-flex w-full max-w-sm items-center justify-center rounded-2xl px-6 py-4 sm:w-auto sm:rounded-full sm:px-8` |
| `DownloadCTA` button | `inline-block rounded-full px-8 py-4` | `inline-flex w-full max-w-sm items-center justify-center rounded-2xl px-6 py-4 sm:w-auto sm:rounded-full sm:px-8` |
| `ToolCTA` button | `inline-block rounded-full px-6 py-2.5` | `inline-flex w-full items-center justify-center rounded-xl px-5 py-2.5 sm:w-auto sm:rounded-full sm:px-6` |
| `ToolCTA` wrapper | `p-6` | `p-5 sm:p-6` |
| `ArticleCTA` button | `inline-block rounded-full px-8 py-3` | `inline-flex w-full max-w-xs items-center justify-center rounded-2xl px-6 py-3 sm:w-auto sm:rounded-full sm:px-8` |
| `ArticleCTA` wrapper | `px-8 py-10` | `px-5 py-8 sm:px-8 sm:py-10` |
| `ArticleCTA` h3 | `text-xl` | `text-lg sm:text-xl` |

**Patrón mobile aplicado a todos los CTAs:**
- Mobile: `w-full` (o `max-w-sm/xs`) + `rounded-2xl` o `rounded-xl` + padding reducido → botón cómodo como element block
- Desktop (`sm:`): `w-auto` + `rounded-full` + padding amplio → botón inline pill premium

**Cambios en `HowItWorks.tsx`:**

| Elemento | Antes | Después |
|---|---|---|
| Section header margin-bottom | `mb-16` | `mb-10 sm:mb-16` |
| Steps gap | `space-y-12` | `space-y-8 sm:space-y-12` |
| Example card padding | `mt-16 p-8` | `mt-12 sm:mt-16 p-5 sm:p-8` |

**Cambios en `ToolsSection.tsx`:**

| Elemento | Antes | Después |
|---|---|---|
| Section vertical padding | `py-24` | `py-16 sm:py-24` |
| Cards padding | `p-8` | `p-6 sm:p-8` |

**Validación de invariantes protegidas:**
- ✅ Navbar mobile — no tocado (UIUX-MOBILE-NAV-01 intacto)
- ✅ Hero H1 `text-4xl sm:text-5xl md:text-7xl lg:text-8xl` — no revertido
- ✅ AlternativesSection `overflow-x-auto` — intacto
- ✅ Tablas MDX con `overflow-x-auto` en wrapper — intactas
- ✅ No scroll horizontal global — tablas tienen scroll local
- ✅ Desktop no degradado — todos los cambios usan variantes `sm:` para preservar desktop
- ✅ Dark mode — todos los cambios usan tokens semánticos
- ✅ SEO/routing — sin tocar

---

### UIUX-GLOBAL-PREMIUM-01 — Sistema visual premium unificado para toda la web pública

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-24 |
| **Estado** | ✅ Completado |
| **Archivos** | `MDXComponents.tsx` · `ToolsSection.tsx` · `INSTRUCCIONES.md` · 13 archivos `.es.mdx` |
| **Build** | ✅ Compiled successfully · 0 errores · 29/29 páginas |
| **Tests** | ✅ 506/506 |
| **MDX tocados** | 13 artículos (solo wrappers visuales — texto sin modificar) |
| **SEO/routing tocado** | ❌ No |

**Diagnóstico global previo (inconsistencias encontradas):**

| Área | Problema | Gravedad |
|---|---|---|
| 12 artículos MDX | `<div class="my-10 text-center"><a href="/es">` — bug routing + sin not-prose + shadow inconsistente | Alta |
| kakebo-sueldo-minimo | `bg-stone-100/800 border-stone-900/400` — stone hardcoded en callout | Alta |
| kakebo-online-guia-completa | `<div>` raw sin componente, h3 recibe prose-h3 accent mal centrado | Media |
| regla-30-dias | `bg-primary/5 border-2 border-primary/20 rounded-3xl` — tokens OK pero raw HTML, rounded-3xl inconsistente | Media |
| plantilla-kakebo-excel | Botón descarga con `shadow-xl hover:-translate-y-1` inconsistente | Media |
| ToolsSection.tsx | `bg-stone-50 bg-white text-stone-900 text-stone-600 border-stone-200 bg-stone-100 group-hover:bg-stone-900 hover:border-red-600` — 10+ stone/red hardcodeados | Alta |

**Nuevos componentes del sistema en `MDXComponents.tsx`:**

| Componente | Uso | Props |
|---|---|---|
| `SimpleCTA` | CTA centrado simple. Sustituye `<div class="my-10 text-center"><a href="/es">` | `href`, `cta` |
| `DownloadCTA` | Botón de descarga con `<a download>`. Sustituye `<a href=".xlsx" download>` inline | `href`, `cta` |

**Artículos migrados (13):**

| Artículo | Cambio |
|---|---|
| ahorro-pareja | `href="/es"` CTA → `<SimpleCTA href="/">` |
| alternativas-a-app-bancarias | `href="/es"` CTA → `<SimpleCTA href="/">` |
| como-ahorrar-dinero-cada-mes | `href="/es"` CTA → `<SimpleCTA href="/">` |
| eliminar-gastos-hormiga | `href="/es"` CTA → `<SimpleCTA href="/">` |
| kakebo-online-gratis | `href="/es"` CTA → `<SimpleCTA href="/">` |
| kakebo-sueldo-minimo | stone callout → `<ToolCTA>` + `href="/es"` CTA → `<SimpleCTA>` |
| kakebo-vs-ynab | `href="/es"` CTA → `<SimpleCTA href="/">` |
| libro-kakebo-pdf | `href="/es"` CTA → `<SimpleCTA href="/">` |
| metodo-kakebo-para-autonomos | `href="/es"` CTA → `<SimpleCTA href="/">` |
| peligros-apps-ahorro-automatico | `href="/es"` CTA → `<SimpleCTA href="/">` |
| plantilla-kakebo-excel | `href="/es"` CTA → `<SimpleCTA>` + download button → `<DownloadCTA>` |
| regla-30-dias | raw ToolCTA div → `<ToolCTA>` + `href="/es"` CTA → `<SimpleCTA>` |
| kakebo-online-guia-completa | raw ArticleCTA div → `<ToolCTA>` |

**`ToolsSection.tsx` — migración completa a tokens semánticos:**

| Antes | Después |
|---|---|
| `bg-stone-50 border-stone-200` | `bg-muted/20 border-border` |
| `text-stone-900` / `text-stone-600` | `text-foreground` / `text-muted-foreground` |
| `bg-white border-stone-200` | `bg-card border-border` |
| `bg-stone-100 group-hover:bg-stone-900 group-hover:text-white` | `bg-muted group-hover:bg-primary group-hover:text-primary-foreground` |
| `hover:border-stone-900` | `hover:border-primary/50` |
| `hover:border-red-600 group-hover:bg-red-600 group-hover:text-red-600` | `hover:border-destructive/50 group-hover:bg-destructive group-hover:text-destructive` |
| `text-stone-900` en links | `text-primary` |

**`INSTRUCCIONES.md` — nueva Regla de Oro #8 + tabla de sistema visual:**
- Regla: "Sistema antes que parche — toda mejora visual debe implementarse como sistema reutilizable"
- Tabla de componentes MDX disponibles para futuros artículos
- Regla explícita: no usar `stone-*/gray-*/white/black` en MDX
- Regla de links: usar rutas sin prefijo `/es/`

**Bug corregido:** 12 artículos tenían `href="/es"` (prefijo erróneo) → corregido a `href="/"` vía `SimpleCTA`

---

### UIUX-PREMIUM-ARTICLE-01 — Experiencia editorial premium en artículos del blog

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-24 |
| **Estado** | ✅ Completado |
| **Archivos** | `MDXComponents.tsx` · `page.tsx` · `tailwind.config.ts` · `como-hacer-un-presupuesto-personal.es.mdx` |
| **Build** | ✅ Compiled successfully · 0 errores · 29/29 páginas |
| **Tests** | ✅ 506/506 |
| **MDX tocado** | Solo `como-hacer-un-presupuesto-personal.es.mdx` — estructura visual, texto sin cambiar |
| **SEO/routing tocado** | ❌ No |

**Diagnóstico de por qué UIUX-BLOG-PROSE-01 se quedó corto:**
- El MDX contenía 3 bloques `<div>` con 12+ valores `stone-*` hardcodeados que bypasaban completamente MDXComponents y el sistema de tokens
- Los bloques también tenían `href="/es/herramientas/..."` y `href="/es/login?mode=signup"` — bug de routing con prefijo `/es/` que no pasa por `CustomLink`
- No había componente para `<hr>` → los separadores `---` solo eran una línea de borde
- H3 sin diferenciación visual clara de H2

**Estrategia aplicada:** combinación de estilos global (tailwind.config.ts) + nuevos componentes MDX + ajuste estructural mínimo del MDX objetivo

**Nuevos componentes en `MDXComponents.tsx`:**

| Componente | Propósito |
|---|---|
| `HorizontalRule` — `hr:` override | Separador editorial con tres puntos primary/30–60–30 centrados en una línea fina. Reemplaza todos los `---` del MDX |
| `ToolCTA` — props-based | CTA de herramienta interna con `bg-primary/5 border-primary/20` — sin stone, sin hardcoded, corrige hrefs `/es/` |
| `ArticleCTA` — children-based | CTA de cierre de artículo con `bg-foreground text-background` — el `bg-stone-900/white` que rompía en dark mode |

**Cambios en `tailwind.config.ts` — H3 con acento lateral:**
```css
h3::before {
  content: "";
  position: absolute;
  left: 0; top: 0.2em; bottom: 0.2em;
  width: 2px; border-radius: 9999px;
  background-color: var(--primary);
  opacity: 0.45;
}
```
H3 ahora tiene padding-left: 0.875rem + barra terracota semitransparente a la izquierda — jerarquía visual clara sin competir con H2.

**Cambios en `page.tsx`:**
- Eyebrow editorial centrado sobre H1: líneas `bg-primary/30` + texto `"Blog"` uppercase tracking-widest
- Separador `h-px bg-border` entre header y cuerpo del artículo
- `pb-16 → pb-24` en el article container
- Author: `text-muted-foreground` explícito en nombre, `text-sm select-none` en monograma

**Cambios en `como-hacer-un-presupuesto-personal.es.mdx`:**

| Bloque original | Reemplazado por | Justificación |
|---|---|---|
| `<div className="... bg-stone-50 border-stone-200">` (CTA calculadora-ahorro) | `<ToolCTA ... href="/herramientas/calculadora-ahorro">` | Stone hardcoded + URL `/es/` bug |
| `<div className="... bg-stone-50 border-stone-200">` (CTA 50/30/20) | `<ToolCTA ... href="/herramientas/regla-50-30-20">` | Stone hardcoded + URL `/es/` bug |
| `<div className="... bg-stone-100 dark:bg-stone-800">` (closing CTA) | `<ArticleCTA href="/login?mode=signup">` | Stone hardcoded en 8 clases + `text-white` + URL `/es/` bug |

**Texto de los tres bloques: sin modificar.** Solo cambió la envoltura visual.

**Mejoras visuales conseguidas:**
- `---` → separador editorial tres-puntos con acento primary
- H3 → barra vertical terracota sutil a la izquierda (diferenciación clara de H2)
- ToolCTAs → `bg-primary/5` con borde `primary/20` — coherentes en claro y oscuro
- ArticleCTA → `bg-foreground text-background` — semántico, perfecto en ambos modos
- Header del artículo → eyebrow editorial + separador antes del body
- URL bugs corregidos: `/es/herramientas/` y `/es/login` → paths sin prefijo

---

### UIUX-BLOG-PROSE-01 — Tipografía y elementos editoriales de artículos MDX

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-24 |
| **Estado** | ✅ Completado |
| **Archivos** | `src/components/mdx/MDXComponents.tsx` · `src/app/[locale]/(public)/blog/[slug]/page.tsx` · `tailwind.config.ts` |
| **Build** | ✅ Compiled successfully · 0 errores · 29/29 páginas |
| **Tests** | ✅ 506/506 |
| **MDX tocado** | ❌ Ningún archivo .mdx modificado |
| **SEO/routing tocado** | ❌ No |

**Diagnóstico previo:**
- `prose-stone` en el contenedor hardcodeaba la paleta stone en lugar de tokens semánticos
- `MDXComponents.tsx` tenía 9+ valores `stone-*`/`stone-*` hardcodeados (rompe dark mode y viola DA-12-D7)
- `Table`: usaba `overflow-y-auto` en lugar de `overflow-x-auto` (bug scroll horizontal en mobile)
- `tailwind.config.ts` sin configuración editorial para H2, H3, HR, listas
- `Blockquote` hardcodeado en stone-600 / stone-50

**Cambios en `tailwind.config.ts` — sección `typography.DEFAULT.css`:**

| Elemento | Cambio |
|---|---|
| `a` | `color: var(--primary)` + `text-underline-offset: 4px` + `color-mix` para decoración suave |
| `h2` | `border-bottom: 1px solid var(--border)` + `padding-bottom: 0.5rem` + `margin-top: 2.75rem` |
| `h3` | `margin-top: 2rem` + `margin-bottom: 0.625rem` |
| `ul/ol > li` | `margin-bottom: 0.35rem` (mejor ritmo de lista) |
| `hr` | `border-color: var(--border)` + márgenes `2.5rem` |
| `blockquote` | `border-left-color: var(--primary)` + `border-left-width: 3px` + `font-style: normal` |
| `code` | `color: inherit` + eliminación de comillas automáticas (::before/::after) |

**Cambios en `MDXComponents.tsx` — 9 valores hardcodeados → tokens semánticos:**

| Componente | Antes | Después |
|---|---|---|
| `RoundedImage` | `border-stone-200` | `border-border` |
| `Callout` | `bg-stone-50 border-stone-200 text-stone-700` | `bg-muted/30 border-border text-muted-foreground` |
| `Table` | `border-stone-200 overflow-y-auto` | `border-border overflow-x-auto` (bug fix mobile) |
| `TableHead` | `bg-stone-50 text-stone-900 border-stone-200` | `bg-muted/50 text-foreground border-border` |
| `TableRow` | `border-stone-100 hover:bg-stone-50/50` | `border-border/60 hover:bg-muted/30` |
| `TableHeader` | `font-medium` | `text-xs font-semibold uppercase tracking-wide` (más editorial) |
| `TableCell` | `p-4` | `px-4 py-3` (más compacto, mejor ritmo) |
| `Blockquote` | `text-stone-600 bg-stone-50/50 italic border-l-4` | `text-muted-foreground bg-muted/20 border-l-[3px] not-prose` |

**Cambios en `page.tsx` — prose container:**

| Antes | Después |
|---|---|
| `prose-stone` | eliminado |
| — | `prose-headings:text-foreground` añadido |
| — | `prose-li:marker:text-primary` añadido |

**Compatibilidad claro/oscuro:** ✅ Todos los cambios usan tokens semánticos que respetan `dark:prose-invert` y las CSS custom properties del tema.

---

## Analytics

### MED-02 — CSP actualizada para permitir GA4

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-24 |
| **Estado** | ✅ Completado |
| **Archivo** | `next.config.ts` → bloque `Content-Security-Policy` en `headers()` |
| **Build** | ✅ Compiled successfully · 0 errores · 29/29 páginas estáticas |

**Dominios añadidos a la CSP:**

| Directiva | Dominio añadido | Motivo |
|---|---|---|
| `script-src` | `https://www.googletagmanager.com` | Carga del script `gtag/js` |
| `connect-src` | `https://www.google-analytics.com` | Envío de eventos a GA4 |
| `connect-src` | `https://region1.google-analytics.com` | Envío de eventos GA4 (región EU) |
| `img-src` | `https://www.google-analytics.com` | Pixel de tracking (fallback) |

**Reglas de seguridad no modificadas:** `frame-src 'none'`, `object-src 'none'`, `default-src 'self'`, Supabase connect, Vercel Insights, HSTS, X-Frame-Options, Referrer-Policy.

---

### MED-01 — Integración Google Analytics 4

| Campo | Detalle |
|---|---|
| **Fecha** | 2026-06-24 |
| **Estado** | ✅ Completado |
| **Measurement ID** | `G-MTB27GMP8M` |
| **Archivos** | `src/components/analytics/GoogleAnalytics.tsx` (nuevo) · `src/app/[locale]/layout.tsx` · `.env.local` |
| **Build** | ✅ Compiled successfully · 0 errores · 29/29 páginas estáticas |

**Implementación:**
- Componente `GoogleAnalytics` en `src/components/analytics/GoogleAnalytics.tsx` usando `next/script` con `strategy="afterInteractive"`.
- El componente retorna `null` si `NEXT_PUBLIC_GA_MEASUREMENT_ID` no está definido (safe guard para entornos sin la variable).
- Importado en `src/app/[locale]/layout.tsx` como primer elemento del `<body>`, antes de los providers.
- Variable añadida a `.env.local`: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-MTB27GMP8M`.
- Sin tocar: SEO metadata, canonicals, hreflang, sitemap, robots, UI, contenido del blog.

**Añadir en Vercel (producción):** `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-MTB27GMP8M` en Environment Variables del proyecto.

---

## Próximas tareas

> Último commit conocido: `5656eef` (2026-06-22)

| Tarea | Objetivo | Estado |
|-------|----------|--------|
| SEO-2.1 | Canonical + hreflang del índice del blog + slug mismatch kakebo-online | ✅ Completado |
| SEO-2.2 | Añadir `related:` a 12 artículos sin RelatedPosts | ✅ Completado |
| SEO-2.3A | Enlazado interno contextual — enlaces P0 (pillar architecture) | ✅ Completado 2026-06-18 |
| SEO-2.3B | Correcciones estructurales (pillar C3, rescate huérfano, normalización URLs) | ✅ Completado 2026-06-18 |
| SEO-2.3B-P1 | Enlaces cross-cluster P1 — Tier A (7 de 12 enumerados) | ✅ Completado 2026-06-18 (Tier B diferido) |
| RESEARCH-CS1-01 | Validación histórica Motoko Hani | ✅ Completado 2026-06-18 |
| SEO-PILAR-01 | Artículo pilar cluster Presupuesto Personal — publicado en ES | ✅ Completado 2026-06-22 |
| DOC-I18N-01 | Política SEO de idiomas documentada (solo español para nuevo contenido) | ✅ Completado 2026-06-22 |
| CHECK-I18N-ROUTING-01 | Bug `Accept-Language` redirect corregido (`localeDetection: false`) | ✅ Completado 2026-06-22 |
| UIUX-INDEXABLE-01 | Auditoría visual y UX de páginas públicas indexables | ✅ Completado 2026-06-22 |
| UIUX-DIRECCIÓN-01 | Dirección estética aprobada — DA-12 documentada | ✅ Completado 2026-06-22 |
| UIUX-02 | Estandarizar max-width de la parte pública/indexable | ✅ Completado 2026-06-22 |
| UIUX-03 | Contextualizar Navbar en páginas de blog | ✅ Completado 2026-06-22 |
| UIUX-04 | Resolver Features grid (4 tarjetas en 3-col) | ✅ Completado 2026-06-22 |
| UIUX-05 | Unificar regla tipográfica H2 de sección (landing) | ✅ Completado 2026-06-22 |
| UIUX-06 | Reemplazar avatares emoji en Testimonials — atribución editorial sobria | ✅ Completado 2026-06-22 |
| UIUX-07 | Eliminar widget Product Hunt del footer | ✅ Completado 2026-06-22 |
| **UIUX-08** | **Reemplazar hardcoded colors con tokens semánticos** | **⬅ SIGUIENTE** |
| SEO-2.3C | Enlazado interno P2 — refinamientos opcionales | Pendiente (tras Tier B y Search Console) |
| SEO-2.4 | Resolución de canibalizaciones | Pendiente (requiere datos de Search Console) |
| SEO-02 | Fondo de emergencia (siguiente artículo cluster Presupuesto Personal) | Pendiente · NO iniciar antes de UIUX-INDEXABLE-01 |
| Content Sprint 1 | Nuevos contenidos según gaps de clusters | En preparación |

### UIUX-INDEXABLE-01 — Definición de tarea

| Campo | Detalle |
|---|---|
| **Nombre** | Auditoría visual y UX de páginas públicas indexables |
| **Objetivo** | Auditar el estado visual y UX de la parte pública de MetodoKakebo.com antes de proponer o implementar ningún cambio |
| **Scope** | `/` · `/blog` · `/blog/[slug]` · `/herramientas/*` · Navbar · Footer · CTAs · experiencia de lectura |
| **Excluye** | `/app/*` (herramienta interna) · lógica de negocio · autenticación |
| **Tipo de tarea** | Etapa 1 — solo auditoría. No se implementa nada. |
| **Estado** | ⬅ Siguiente · Pendiente de inicio |

**Restricciones absolutas de UIUX-INDEXABLE-01:**
- No tocar código visual (componentes, Tailwind, CSS).
- No tocar herramienta interna/dashboard.
- No abrir SEO-02 ni crear artículos nuevos.
- No modificar routing, i18n, hreflang ni middleware.
- No cambiar contenido SEO ni MDX de artículos.
- No implementar rediseño en esta tarea — solo diagnóstico.

**Metodología:** Ver sección `DA-11 — Metodología UI/UX indexable` más abajo y `INSTRUCCIONES.md → Metodología UI/UX indexable`.

---

### DA-11 — Metodología UI/UX indexable

> Decisión arquitectónica añadida 2026-06-22 (DOC-MEMORY-UIUX-01). Aplica a partir de UIUX-INDEXABLE-01.

#### Scope de la fase

**Incluye:** `/` · `/blog` · `/blog/[slug]` · `/herramientas/*` · Navbar · Footer · CTAs · lectura.  
**Excluye:** `/app/*` (herramienta interna/dashboard) y todo lo que requiera autenticación.

#### Orden obligatorio de las etapas

| Etapa | Nombre | Qué hace | Implementa código |
|---|---|---|---|
| 1 | Auditoría | Diagnostica el estado visual actual sin tocar nada | No |
| 2 | Dirección estética | Define dirección visual concreta, aprobada por el usuario | No |
| 3 | Implementación | Ejecuta los cambios aprobados en etapa 2 | Sí |

UIUX-INDEXABLE-01 es **Etapa 1**. No se avanza a etapa 2 ni 3 sin que el usuario apruebe el diagnóstico.

#### Dimensiones de auditoría

| Dimensión | Qué evaluar |
|---|---|
| **Tipografía** | Jerarquía, legibilidad, peso, espaciado, coherencia serif/sans |
| **Color** | Contraste, paleta activa vs. neutral, consistencia de tokens |
| **Motion** | Transiciones, hover states, feedback visual, sensación de respuesta |
| **Fondos y separación** | Textura, separación visual de secciones, `bg-muted`, espaciado vertical |
| **Layout** | Anchura de columnas, márgenes, densidad de información, respiración |
| **Atmósfera** | Sensación general: ¿moderno, editorial, zen, confiable, genérico? |

#### Principios

- Cada decisión visual debe tener razón concreta — no seguir plantillas.
- No cambios decorativos sin propósito funcional o comunicativo.
- No implementar antes de acordar dirección estética con el usuario.
- Cada tarea completada de esta fase debe actualizar `docs/PROJECT_STATUS.md`.

---

## Estrategia de Contenido e Internacionalización

> Decisiones acordadas tras la auditoría AUDIT-SEO-POST-P0 (2026-06-18).

---

### DA-06 — Estrategia de internacionalización

| Dimensión | Decisión |
|-----------|----------|
| **Idioma principal** | Español — todo el esfuerzo editorial y SEO se concentra en ES |
| **Inglés** | Legacy: se conserva la infraestructura i18n y los archivos `.en.mdx` existentes, pero no se crean artículos nuevos en inglés ni se dedican sprints SEO al mercado anglófono |
| **Infraestructura i18n** | `next-intl` v4 · `localePrefix: 'as-needed'` · **`localeDetection: false`** (fix CHECK-I18N-ROUTING-01) |
| **URLs EN existentes** | No se eliminan ni redirigen. Permanecen como contenido legacy. No se indexan manualmente. |
| **Contenido nuevo** | Solo `.es.mdx`. No se crean `.en.mdx` nuevos salvo instrucción explícita del usuario. |
| **Criterio de revisión** | Revaluar cuando exista tracción orgánica EN sostenida en Search Console |

**`localeDetection: false` (añadido 2026-06-22 — CHECK-I18N-ROUTING-01):**  
Sin este flag, `next-intl` v4 redirigía `/blog/...` a `/en/blog/...` cuando el visitante enviaba `Accept-Language: en`. Con `localeDetection: false`, la URL `/blog/...` siempre sirve español (defaultLocale) independientemente del idioma del navegador. El idioma solo se selecciona por prefijo de URL (`/en/...`).

**Justificación:** El sitio no dispone aún de datos que indiquen demanda significativa en inglés. El coste de mantener paridad de contenido ES/EN superaría el beneficio hasta que exista evidencia de tracción real. La infraestructura i18n se mantiene para no cerrar esa puerta.

---

### DA-07 — Arquitectura de contenido por clusters temáticos

El blog se organiza en cuatro clusters. Cada cluster tiene un artículo **pillar** (máxima autoridad topical) y artículos **supporting** que lo refuerzan y enlazan a él. El enlazado interno sigue esta jerarquía: los supporting enlazan al pillar; el pillar puede enlazar a los supporting cuando es relevante.

#### Cluster 1 — Metodología Kakebo

| Rol | Artículo |
|-----|----------|
| **Pillar** | `metodo-kakebo-guia-definitiva` |
| Supporting | `metodo-kakebo-para-autonomos` |
| Supporting | `kakebo-sueldo-minimo` |
| Supporting | `ahorro-pareja` |

**Intención de búsqueda:** Informacional — "qué es kakebo", "cómo funciona el método kakebo", "cómo ahorrar con kakebo".

#### Cluster 2 — Kakebo Digital y Herramientas

| Rol | Artículo |
|-----|----------|
| **Pillar** | `kakebo-online-guia-completa` |
| Supporting | `kakebo-online-gratis` |
| Supporting | `plantilla-kakebo-excel` |
| Supporting | `libro-kakebo-pdf` |

**Intención de búsqueda:** Transaccional/Herramienta — "kakebo online", "kakebo digital", "plantilla kakebo gratis".

**Nota activa:** `kakebo-online-gratis` y `kakebo-online-guia-completa` presentan solapamiento de keywords. No se fusionarán hasta disponer de datos adicionales de Search Console y hasta haber completado SEO-2.1 y SEO-2.2. La diferenciación de intención se reforzará en SEO-2.4.

#### Cluster 3 — Educación Financiera y Ahorro

| Rol | Artículo |
|-----|----------|
| **Pillar** | `como-ahorrar-dinero-cada-mes` |
| Supporting | `eliminar-gastos-hormiga` |
| Supporting | `regla-30-dias` |

**Intención de búsqueda:** Informacional/Educacional — "cómo ahorrar dinero", "técnicas de ahorro", "gastos hormiga".

#### Cluster 4 — Comparativas

> Este cluster no tiene pillar definido aún. Los tres artículos son supporting de audiencias que ya conocen alternativas y comparan opciones.

| Rol | Artículo |
|-----|----------|
| Supporting | `kakebo-vs-ynab` |
| Supporting | `alternativas-a-app-bancarias` |
| Supporting | `peligros-apps-ahorro-automatico` |

**Intención de búsqueda:** Comparativa/Decisional — "alternativas a fintonic", "kakebo vs ynab", "peligros apps bancarias".

---

### DA-08 — Roadmap estratégico

```
SEO Sprint 2
├── SEO-2.1   Canonical + hreflang (completado)
├── SEO-2.2   RelatedPosts global (completado — 14/14 artículos ES)
├── SEO-2.3A  Enlazado interno P0 — pillar architecture (completado 2026-06-18)
├── SEO-2.3B  Correcciones estructurales — pillar C3 + huérfano + URLs (completado 2026-06-18)
├── SEO-2.3B-P1  Cross-cluster Tier A — 7 enlaces, refuerzo pillar C2 (completado 2026-06-18)
│              └ Tier B (5 enlaces) diferido
├── SEO-2.3C  Enlazado interno P2 — refinamientos opcionales (pendiente, tras Tier B)
└── SEO-2.4   Resolución de canibalizaciones (requiere Search Console)

Content Sprint 1  (tras completar SEO Sprint 2)
└── Nuevos artículos que cubran gaps de clusters
    Ejemplos: "kakebo para familias", "kakebo jubilación",
              pillar definitivo para Cluster 4 (Comparativas)
```

**Criterio de transición SEO Sprint 2 → Content Sprint 1:** haber completado SEO-2.1, SEO-2.2 y SEO-2.3A como mínimo. SEO-2.3B/C y SEO-2.4 pueden ejecutarse en paralelo con Content Sprint 1 si los datos de Search Console están disponibles.

**Nota explícita:** No se fusionarán artículos hasta disponer de datos adicionales de Search Console y hasta haber completado SEO-2.1 y SEO-2.2.

---

## Decisiones arquitectónicas

### DA-01 — `localePrefix: 'as-needed'` — ES sin prefijo URL

`next-intl` v4 configurado con `localePrefix: 'as-needed'`. Esto implica:

- **ES:** `https://www.metodokakebo.com/blog/{slug}` (sin `/es/`)
- **EN:** `https://www.metodokakebo.com/en/blog/{slug}`
- `next.config.ts` tiene un redirect 308: `/es/*` → `/*`

**Consecuencia en todo el código:** cualquier URL canónica, hreflang, JSON-LD o breadcrumb debe usar el patrón:

```ts
`https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}/ruta`
```

Usar `/${locale}/ruta` directamente es un bug que genera `/es/` incorrecto en producción.

---

### DA-02 — MDXComponents como sistema de augmentación de prose

Los artículos del blog se renderizan con `next-mdx-remote` dentro de un contenedor `prose prose-lg prose-stone`. Las sobreescrituras de MDXComponents tienen dos responsabilidades:

1. **Elementos HTML estándar** (`a`, `img`, `table`, `blockquote`): reemplazan el comportamiento por defecto con componentes con diseño Kakebo.
2. **Componentes custom JSX** (`Callout`, `FaqSection`, `FaqItem`): se añaden a los MDX files como JSX explícito en el contenido.

El patrón `not-prose` (Tailwind Typography) permite crear islas visuales dentro del flujo de prose sin que el sistema de tipografía interfiera con el diseño del componente.

---

### DA-03 — FAQPage JSON-LD controlado por frontmatter

El schema `FAQPage` solo se incluye en el JSON-LD de un post si el frontmatter YAML contiene una clave `faq:` con el array de preguntas/respuestas:

```yaml
faq:
  - question: "¿Pregunta?"
    answer: "Respuesta."
```

Esto desacopla el schema SEO del contenido visual. Los `FaqItem` en el MDX son la representación visual; el frontmatter `faq:` es la representación semántica para buscadores. Ambos deben mantenerse sincronizados manualmente al editar FAQ.

---

### DA-04 — Hero image: `fill` + `aspect-video` en lugar de `width/height` fijo

Para las imágenes hero de posts, se usa un contenedor `relative aspect-video` con `Image fill` en lugar de dimensiones fijas. Esto garantiza:

- Responsive sin romper el layout (el contenedor define el aspecto, no la imagen)
- El componente `next/image` optimiza automáticamente por tamaño de viewport con `sizes`
- `priority` activa preload para mejorar LCP, relevante dado que es el primer elemento visual

---

### DA-05 — Convención de slugs: inmutables

Los slugs de los artículos del blog (`/blog/plantilla-kakebo-excel`, etc.) son permalinks estables. **No se cambian** aunque el título del artículo cambie, aunque el contenido se reestructure completamente, o aunque se añadan FAQs o secciones. El canonical y el hreflang ya correctos dependen de la estabilidad del slug. Cambiar un slug equivale a crear una nueva URL (404 para la antigua salvo redirect explícito).

---

### DA-10 — Implementación escalonada de SEO-2.3

SEO-2.3 se ejecuta en tres fases independientes en lugar de implementar los 35 enlaces identificados en PLAN-SEO-2.3 de una sola vez.

#### Fases

| Fase | Scope | Objetivo | Prerequisito |
|------|-------|----------|-------------|
| **SEO-2.3A** | 19 enlaces P0 | Consolidar arquitectura Pillar → Supporting. Máxima prioridad SEO. | SEO-2.2 completado ✅ |
| **SEO-2.3B** | 12 enlaces P1 | Reforzar relaciones entre clusters. | Validación de SEO-2.3A |
| **SEO-2.3C** | 4 enlaces P2 | Refinamientos opcionales de baja urgencia. Solo si aportan valor real tras revisar datos. | Validación de SEO-2.3B |

#### Justificación

- **Minimizar riesgo**: introducir 35 enlaces simultáneamente dificulta aislar la causa de cualquier efecto inesperado en rankings o UX.
- **Facilitar validación**: cada fase tiene un scope acotado y un criterio de éxito verificable antes de continuar.
- **Medir impacto por fases**: SEO-2.3A impacta la arquitectura de autoridad (pillar links); SEO-2.3B impacta la navegación entre clusters; SEO-2.3C son ajustes editoriales de menor impacto. Separarlos permite atribuir cambios en Search Console a la fase correcta.
- **Detectar efectos no deseados**: si SEO-2.3A genera un comportamiento de rastreo o ranking no esperado, SEO-2.3B y SEO-2.3C pueden suspenderse sin coste.

#### Alcance explícito de SEO-2.3A

SEO-2.3A incluirá **únicamente** los 19 enlaces clasificados como P0 en PLAN-SEO-2.3:
- Todo supporting enlazando a su Pillar de cluster en prose (donde no existía enlace contextual previo)
- Todo Pillar C3 enlazando a sus Supportings en prose donde el anchor ya existe en el texto
- C4 artículos enlazando a C1 Pillar en prose donde el método es nombrado

SEO-2.3B y SEO-2.3C permanecen **pendientes de validación futura**. No se implementan hasta confirmar que SEO-2.3A no genera efectos adversos.

#### Nota sobre secciones "Artículos relacionados" manuales

Los artículos del blog contienen secciones manuales de "Artículos relacionados" con links markdown heredados del diseño original. Estas secciones **no se modificarán** durante SEO-2.3A ni SEO-2.3B.

La posible eliminación de dichas secciones (que son visualmente redundantes con el componente RelatedPosts de frontmatter) se evaluará únicamente después de validar conjuntamente:
- El comportamiento del componente RelatedPosts en producción
- El enlazado contextual de SEO-2.3A y SEO-2.3B
- Datos de comportamiento de usuario (CTR, scroll depth) si están disponibles en Search Console o Analytics

---

### DA-12 — Dirección estética pública indexable

> Decisión aprobada 2026-06-22 (UIUX-DIRECCIÓN-01). Resultado de la Etapa 2 de la metodología UI/UX indexable (DA-11).  
> Referencias visuales aprobadas: `imagenes/modo claro paleta estilo.png` · `imagenes/modo oscuro paleta estilo.png`

#### Nombre de la dirección

**"Editorial financiero con identidad japonesa propia"**

#### Definición

MetodoKakebo.com debe sentirse como una publicación editorial seria de finanzas personales que tiene una herramienta integrada. No como una landing SaaS genérica.

La referencia visual aprobada combina:
- Revista financiera minimalista
- Papelería japonesa de calidad
- Calma, claridad y confianza
- Minimalismo cálido
- Identidad japonesa sutil pero reconocible
- Autoridad editorial

#### Principio rector

> Primero estructura, coherencia y credibilidad.  
> Después atmósfera y detalles visuales.  
> No hacer cambios decorativos sin resolver problemas estructurales.

#### Scope incluido

Aplica exclusivamente a la parte pública e indexable:
- Home (`/`)
- Blog index (`/blog`)
- Artículos (`/blog/[slug]`)
- Herramientas públicas (`/herramientas/*`)
- Navbar público
- Footer
- CTAs públicos
- Experiencia de lectura

#### Scope excluido

- `/app/*` — herramienta interna, dashboard
- Autenticación, lógica de negocio
- SEO-02 y nuevos artículos (paralelo independiente)

#### Decisiones visuales aprobadas

**D1 — Max-width rector**

| Contexto | Max-width |
|---|---|
| Home pública (secciones landing) | `max-w-6xl` |
| Secciones editoriales / lectura dentro de la home | `max-w-4xl` |
| Artículos de blog | `max-w-3xl` |

Evitar variaciones arbitrarias (`max-w-7xl`, `max-w-5xl`) sin justificación explícita. El eje visual debe ser estable al hacer scroll.

**D2 — Tipografía de sección**

| Contexto | Regla |
|---|---|
| H2 de sección en landing/home | `font-serif font-normal` |
| H2/H3 en blog/artículos | Serif con más peso editorial cuando corresponda |

Prohibido mezclar serif y sans en títulos del mismo nivel jerárquico dentro de la misma página.

**D3 — Navbar contextual**

En páginas de lectura/blog, el Navbar no debe romper el contexto editorial con hash links a secciones de la home (`#features`, `#how-it-works`). El blog debe sentirse editorial, no como extensión forzada de la landing.

**D4 — Testimonios**

Eliminar avatares emoji. Sustituir por tratamiento textual sobrio: iniciales estilizadas, nombre y rol, sin fotografías. La confianza en finanzas personales es prioritaria sobre cualquier elemento decorativo.

**D5 — Product Hunt**

Mantener el badge únicamente en Hero si se considera relevante como señal de prueba social. Eliminar o rediseñar el widget del footer. El footer debe cerrar la web con atmósfera limpia y editorial, no con un widget de terceros con estilos inline.

**D6 — Identidad japonesa**

Activar `.bg-sakura` de forma sutil en una única sección pública. No sobrecargar. El objetivo es anclar visualmente el concepto Kakebo, no decorar por decorar. El overlay ya está configurado en `globals.css` al 85% en light y 92% en dark.

**D7 — Modo claro y modo oscuro**

| Modo | Sensación objetivo |
|---|---|
| Claro | Cálido, editorial, limpio — papel de arroz |
| Oscuro | Premium, sereno, legible — piedra volcánica |

Ningún cambio visual puede sacrificar contraste ni accesibilidad por estética. Los colores hardcoded (`text-green-600`, `text-red-600`, `bg-stone-900`, `bg-stone-50`) deben reemplazarse por tokens semánticos que funcionen en ambos modos.

#### Restricciones de implementación

- Resolver problemas estructurales (max-width, grid, navbar) antes de problemas atmosféricos (sakura, accent).
- No hacer cambios decorativos si hay inconsistencias de layout sin resolver.
- Cada tarea de implementación debe ser atómica: un problema → una tarea → un commit.
- Ningún cambio visual toca `/app/*`, routing, i18n, hreflang, sitemap ni MDX de artículos.

#### Orden de implementación aprobado

| Prioridad | ID | Tarea |
|---|---|---|
| 1 | UIUX-02 | Estandarizar max-width de la parte pública |
| 2 | UIUX-03 | Contextualizar Navbar en páginas de blog |
| 3 | UIUX-04 | Resolver Features grid (4 tarjetas en 3-col) |
| 4 | UIUX-05 | Unificar regla tipográfica H2 de sección |
| 5 | UIUX-06 | Reemplazar avatares emoji en Testimonials |
| 6 | UIUX-07 | Eliminar widget Product Hunt del footer |
| 7 | UIUX-08 | Reemplazar hardcoded colors con tokens semánticos |
| 8 | UIUX-09 | Activar `.bg-sakura` en una sección de la home |
| 9+ | UIUX-10 a 15 | Refinamientos: FeatureCards, hover CTAs, CTA artículo, accesibilidad, blog index, accent |
