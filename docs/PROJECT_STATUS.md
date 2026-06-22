# PROJECT STATUS — metodokakebo.com

**Última actualización:** 2026-06-22 (UIUX-DIRECCIÓN-01)  
**Rama operativa:** `main`  
**URL producción:** https://www.metodokakebo.com

> Este documento es la fuente de verdad del SEO Sprint P0, UI Sprint 1 y SEO Sprint 2.
> El historial de la migración SaaS→gratuito (P0.2–P1.5 de infraestructura) está en `CONTEXT.md`.
> Las decisiones arquitectónicas de infraestructura están en `ADRs.md`.
> La estrategia de contenido e internacionalización está en la sección **Estrategia de Contenido e Internacionalización** de este mismo documento.

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
| **UIUX-05** | **Unificar regla tipográfica H2 de sección (landing)** | **⬅ SIGUIENTE** |
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
