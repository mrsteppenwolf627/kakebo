# POST-PUBLISH-INDEXATION-CHECK-01

**Fecha de verificación:** 2026-07-09
**Fecha de publicación de contenido:** 2026-07-08
**Sprint activo:** Sprint Contenido V1 (Sprint SEO Técnico V1 cerrado)

## URLs revisadas

1. `https://www.metodokakebo.com/blog/cuentas-remuneradas`
2. `https://www.metodokakebo.com/herramientas/calculadora-ahorro`

## Commits relacionados

| Commit | Descripción |
|---|---|
| `72f52a9` | docs: close SEO Technical Sprint V1 |
| `011f42c` | Content: add cuentas remuneradas guide |
| `8ffbcfc` | Docs: audit savings calculator v2 |
| `e986a1d` | Tool: improve savings calculator v2 |
| `808c621` | DOC: actualizar hash commit TOOL-CALCULADORA-AHORRO-V2-IMPL-01 en PROJECT_STATUS |
| `c123eb0` | Docs: audit savings calculator SEO GEO |
| `ea3f17b` | SEO: optimize savings calculator GEO |
| `1b986e2` | DOC: registrar TOOL-CALCULADORA-AHORRO-SEO-GEO-AUDIT/IMPL-01 en PROJECT_STATUS |

## 1. Integración local de archivos

| Archivo | Estado |
|---|---|
| `src/content/blog/cuentas-remuneradas.es.mdx` | ✅ Existe |
| `public/images/blog/cuentas-remuneradas.png` | ✅ Existe |
| `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx` | ✅ Existe |
| `src/components/landing/tools/SavingsCalculator.tsx` | ✅ Existe, importado por la page |

## 2. Estado de sitemap (`src/app/sitemap.ts`)

- `/herramientas/calculadora-ahorro` está declarada explícitamente en `coreRoutes` con `priority: 0.9`, `changeFrequency: 'weekly'`, y se generan entradas por locale con `alternates.languages`. ✅
- `/blog/cuentas-remuneradas` **no** requiere entrada manual: `sitemap.ts` itera `getBlogPosts()` y añade automáticamente cualquier post cuyo frontmatter no tenga `noindex: true`. El frontmatter del artículo no define `noindex`, por lo que la entrada se genera automáticamente con `lastModified` tomado de `updatedDate` (2026-07-08). ✅
- No fue necesario modificar `sitemap.ts`.

## 3. Indexabilidad

- **noindex en frontmatter/metadata (fuente):** ninguna de las dos páginas define `noindex` de forma explícita en su código de metadata para producción.
- **robots.ts:** solo bloquea `/api/`, `/app/`, `/auth/`. Ninguna de las dos rutas revisadas está bloqueada. ✅
- **Comportamiento observado en local (dev):** ambas páginas devuelven `<meta name="robots" content="noindex, nofollow">` al probarlas en `localhost:3000`. Esto es un comportamiento **esperado y correcto**, no un error: `src/app/[locale]/layout.tsx` define `const isProduction = process.env.NEXT_PUBLIC_APP_URL === "https://www.metodokakebo.com"` y solo emite `index: true, follow: true` cuando esa variable coincide con el dominio de producción. Es una salvaguarda global para evitar que Google indexe entornos de desarrollo/staging. En producción real (`NEXT_PUBLIC_APP_URL` apuntando al dominio), ambas páginas se sirven como `index, follow`. **No se ha modificado este mecanismo** (está fuera del alcance de la tarea y no es un error bloqueante).
- **Canonical:**
  - Blog: `https://www.metodokakebo.com/blog/cuentas-remuneradas` ✅ (verificado en HTML renderizado)
  - Calculadora: `https://www.metodokakebo.com/herramientas/calculadora-ahorro` ✅ (verificado en HTML renderizado)
- **Hreflang:** ambas páginas generan `alternates.languages` con `es`, `en` (si procede) y `x-default`. En el caso del blog, el idioma `en` solo se añade si el post en inglés existe y no tiene `noindex` (lógica centralizada en `lib/blog.ts`, sin duplicación de listas).

## 4. Metadata

### `/blog/cuentas-remuneradas`

| Campo | Estado |
|---|---|
| title | ✅ "Qué es una cuenta remunerada y cuándo tiene sentido para tu ahorro \| Blog Kakebo" |
| description/excerpt | ✅ presente en frontmatter |
| author | ✅ "Aitor Alarcón" |
| date / updatedDate | ✅ 2026-07-08 / 2026-07-08 |
| imagen | ✅ `/images/blog/cuentas-remuneradas.png`, carga con HTTP 200 |
| schema BlogPosting | ✅ presente (headline, image, datePublished, dateModified, author, publisher, mainEntityOfPage) |
| schema BreadcrumbList | ✅ presente |
| schema FAQPage | ✅ presente (6 preguntas definidas en frontmatter `faq`) |
| H1 único | ✅ confirmado en HTML renderizado (1 solo `<h1>`) |

### `/herramientas/calculadora-ahorro`

| Campo | Estado |
|---|---|
| title | ✅ "Calculadora de Ahorro Mensual Gratis" |
| meta description | ✅ vía `next-intl` (`Tools.Savings.meta.description`) |
| openGraph image | ✅ endpoint OG dinámico `/api/og?title=...` |
| schema SoftwareApplication | ✅ presente |
| schema FAQPage | ✅ presente (6 preguntas, visibles también en HTML server-rendered) |
| schema HowTo | ✅ presente (4 pasos, visibles también en HTML server-rendered) |
| H1 único | ✅ confirmado en HTML renderizado |

## 5. Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| `npm run build` | ✅ Compilación exitosa, ambas rutas (`/[locale]/blog/[slug]`, `/[locale]/herramientas/calculadora-ahorro`) generadas sin error |
| `npm run lint` | ✅ 0 errores, 76 warnings preexistentes (ninguno en los archivos de las dos URLs revisadas) |
| `npx tsc --noEmit` | ✅ 0 errores de tipado |
| Servidor local (`npm run dev`) | ✅ Levantado correctamente |
| `GET /blog/cuentas-remuneradas` | ✅ HTTP 200 |
| `GET /herramientas/calculadora-ahorro` | ✅ HTTP 200 |
| `GET /images/blog/cuentas-remuneradas.png` | ✅ HTTP 200 |
| FAQ visible en HTML de calculadora | ✅ presente ("Preguntas frecuentes sobre el ahorro mensual") |
| Bloque "Cómo usar la calculadora" (HowTo visible) | ✅ presente |
| H1 único en ambas páginas | ✅ confirmado |
| Canonical correcto en ambas páginas | ✅ confirmado |

No se realizaron cambios de contenido, UI, SEO técnico global ni funcionalidad. No se tocó `/blog/plantilla-kakebo-excel`, otras herramientas ni artículos existentes.

## 6. Checklist manual pendiente (Google Search Console / Rich Results)

Claude Code no tiene acceso a Google Search Console ni a la herramienta Rich Results Test externa. Estos pasos deben completarse manualmente:

- [ ] Inspeccionar URL en GSC: `https://www.metodokakebo.com/blog/cuentas-remuneradas`
- [ ] Inspeccionar URL en GSC: `https://www.metodokakebo.com/herramientas/calculadora-ahorro`
- [ ] Solicitar indexación en GSC para ambas URLs si Google aún no las ha rastreado tras el deploy
- [ ] Pasar `https://www.metodokakebo.com/blog/cuentas-remuneradas` por [Rich Results Test](https://search.google.com/test/rich-results) y registrar si detecta `BlogPosting`, `BreadcrumbList` y `FAQPage`
- [ ] Pasar `https://www.metodokakebo.com/herramientas/calculadora-ahorro` por Rich Results Test y registrar si detecta `SoftwareApplication`, `HowTo` y `FAQPage`
- [ ] Guardar snapshot/captura de ambos resultados si es posible

## 7. Ventana de medición recomendada

- **Artículo nuevo** (`/blog/cuentas-remuneradas`): 8–12 semanas para evaluar rastreo, indexación y posicionamiento inicial.
- **Cambios de title/meta** (calculadora, tras optimización SEO/GEO): 2–4 semanas para ver impacto en CTR/posición.
- **FAQ / contenido visible / enlazado interno**: 4–8 semanas para evaluar impacto en rich results y tráfico asociado.

## 8. Decisión final

**No publicar nuevo artículo inmediatamente. Volver al Plan Maestro SEO/GEO tras esta verificación.**

Ambas URLs están correctamente integradas, sin errores de build/lint/type, sin bloqueos de indexación en producción, con metadata y schema estructurado coherentes, y sirven contenido correcto (HTTP 200, imagen carga, FAQ y HowTo visibles). La tarea de verificación se considera cerrada; el seguimiento de indexación real depende de GSC y queda como checklist manual pendiente.
