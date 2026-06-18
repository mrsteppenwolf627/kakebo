# PROJECT STATUS — metodokakebo.com

**Última actualización:** 2026-06-18 (BUG-FIX: RelatedPosts crash)  
**Rama operativa:** `main`  
**URL producción:** https://www.metodokakebo.com

> Este documento es la fuente de verdad del SEO Sprint P0 y el UI Sprint 1.
> El historial de la migración SaaS→gratuito (P0.2–P1.5 de infraestructura) está en `CONTEXT.md`.
> Las decisiones arquitectónicas de infraestructura están en `ADRs.md`.

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

## Próximas tareas

> UI Sprint 1 completado. Pendiente definir UI Sprint 2.

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
