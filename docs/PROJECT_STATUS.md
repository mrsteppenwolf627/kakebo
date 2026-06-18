# PROJECT STATUS — metodokakebo.com

**Última actualización:** 2026-06-18 (SEO-2.3B)  
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

> **Nota — enlaces P1 (Fase 1) NO implementados.** El subconjunto P0 de PLAN-SEO-2.3 se materializó enlace por enlace en la tabla de SEO-2.3A, pero **los 12 enlaces P1 nunca se enumeraron en ningún artefacto** (PROJECT_STATUS/DA-10 solo describe el *scope*, no la lista). Por decisión explícita, SEO-2.3B ejecutó únicamente las correcciones estructurales de la auditoría (2A/2B/2C). La enumeración formal de los 12 P1 queda pendiente antes de poder implementarlos. Ningún enlace P2 fue tocado.

---

## Próximas tareas

> SEO Sprint 2 en progreso.

| Tarea | Objetivo | Estado |
|-------|----------|--------|
| SEO-2.1 | Canonical + hreflang del índice del blog + slug mismatch kakebo-online | ✅ Completado |
| SEO-2.2 | Añadir `related:` a 12 artículos sin RelatedPosts | ✅ Completado |
| SEO-2.3A | Enlazado interno contextual — enlaces P0 (pillar architecture) | ✅ Completado 2026-06-18 |
| SEO-2.3B | Correcciones estructurales (pillar C3, rescate huérfano, normalización URLs) | ✅ Completado 2026-06-18 (Fase 2A/2B/2C) |
| SEO-2.3B-P1 | Enlazado interno contextual — enlaces P1 (cross-cluster) | Pendiente: requiere enumerar los 12 P1 (no existen en PLAN-SEO-2.3) |
| SEO-2.3C | Enlazado interno contextual — enlaces P2 (refinamientos opcionales) | Pendiente (tras validar SEO-2.3B-P1) |
| SEO-2.4 | Resolución de canibalizaciones (tras datos de Search Console) | Pendiente |
| Content Sprint 1 | Creación de nuevos contenidos según gaps de clusters | Pendiente (tras SEO-2.x) |

---

## Estrategia de Contenido e Internacionalización

> Decisiones acordadas tras la auditoría AUDIT-SEO-POST-P0 (2026-06-18).

---

### DA-06 — Estrategia de internacionalización

| Dimensión | Decisión |
|-----------|----------|
| **Idioma principal** | Español — todo el esfuerzo editorial y SEO se concentra en ES |
| **Inglés** | Mantenimiento mínimo: se conserva la infraestructura i18n existente y las URLs EN actuales, pero no se crean artículos nuevos en inglés ni se dedican sprints SEO al mercado anglófono |
| **Infraestructura i18n** | Se mantiene `next-intl` v4 con `localePrefix: 'as-needed'` y los archivos de traducción existentes |
| **URLs EN existentes** | No se eliminan ni redirigen. Los artículos EN actuales permanecen como están |
| **Contenido nuevo** | Solo en español. No se traducen artículos nuevos de forma proactiva |
| **Criterio de revisión** | Revaluar la estrategia de internacionalización cuando exista tracción real en mercados de habla inglesa (tráfico orgánico EN sostenido en Search Console) |

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
│              └ P1 cross-cluster pendiente (12 enlaces sin enumerar en PLAN-SEO-2.3)
├── SEO-2.3C  Enlazado interno P2 — refinamientos opcionales (pendiente, tras P1)
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
