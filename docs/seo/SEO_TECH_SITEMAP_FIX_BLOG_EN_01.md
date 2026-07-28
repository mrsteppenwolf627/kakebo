# SEO-TECH-SITEMAP-FIX-BLOG-EN-01 — Cierre

**Fecha:** 2026-07-28
**Modelo:** Claude Code
**Estado:** ✅ Completado

## Causa raíz

Confirmada previamente en `docs/seo/SEO_TECH_SITEMAP_VALIDATION_01.md`: `src/app/sitemap.ts`
generaba la URL `/en/blog/{slug}` (y su entrada `alternates.languages.en`) para todo post español
no marcado `noindex`, usando un conjunto de exclusión (`enNoindexSlugs`) que solo recogía slugs
cuyo fichero `{slug}.en.mdx` **existe y** está marcado `noindex: true`. Cuando el fichero inglés
no existe en absoluto, el slug nunca entra en ese conjunto, así que la condición de exclusión
nunca se cumplía y el sitemap anunciaba una URL sin contenido real (HTTP 404).

## Solución aplicada

Inversión del criterio de inclusión: en vez de una lista de bloqueo (`enNoindexSlugs`, "excluir si
existe Y es noindex"), se construye una lista de permiso (`enIndexableSlugs`, "incluir solo si
existe Y NO es noindex"). Como `getBlogPosts('en')` (en `src/lib/blog.ts`) solo devuelve slugs con
un fichero `.en.mdx` real en disco, el nuevo conjunto resuelve **a la vez** la comprobación de
existencia y la de indexabilidad con una sola fuente de datos, sin leer el sistema de archivos por
segunda vez ni duplicar lógica.

```ts
// Antes
const enNoindexSlugs = new Set(
    enPosts.filter((p) => p.frontmatter.noindex).map((p) => p.slug)
);
// ...
if (locale === 'en' && enNoindexSlugs.has(post.slug)) return;

// Después
const enIndexableSlugs = new Set(
    enPosts.filter((p) => !p.frontmatter.noindex).map((p) => p.slug)
);
// ...
if (locale === 'en' && !enIndexableSlugs.has(post.slug)) return;
```

El mismo cambio se aplicó en el segundo punto donde se repetía la misma comprobación: el cálculo
de `alternates.languages` de cada entrada del sitemap.

## Criterio exacto de inclusión de una URL inglesa de blog

Una URL `/en/blog/{slug}` se genera **si y solo si**:

1. Existe el fichero `src/content/blog/{slug}.en.mdx` (verificado porque `getBlogPosts('en')`
   solo devuelve slugs con fichero real).
2. Ese fichero no tiene `noindex: true` en su frontmatter.
3. El post español correspondiente tampoco tiene `noindex: true` (comprobación ya existente,
   sin cambios, en el `.filter()` que envuelve todo el bucle).

Cuando se cumplen las 3 condiciones, la página `/en/blog/{slug}` es la página MDX real
(`src/app/[locale]/(public)/blog/[slug]/page.tsx` resuelve `getBlogPost(slug, 'en')` con éxito),
por lo que HTTP 200, canonical propio (`.../en/blog/{slug}`) y `robots: index, follow` (o el
`noindex` explícito si el frontmatter EN lo marca, en cuyo caso ya está excluido del sitemap por
el punto 2) están garantizados por construcción — no hace falta comprobarlos por separado.

## Archivos modificados

- `src/app/sitemap.ts` — único cambio funcional: renombrado y invertido el criterio del `Set` de
  exclusión/inclusión EN, en los dos puntos donde se usaba (generación de la URL y de
  `alternates.languages`). No se tocó el resto del fichero (rutas core, `/login`, páginas legales,
  herramientas, lógica de posts en español).
- `src/__tests__/app/sitemap.test.ts` — **nuevo**. Test unitario con `@/lib/blog` mockeado
  (4 escenarios sintéticos: post con EN indexable, post sin fichero EN, post con EN marcado
  noindex, verificación de que el ES sigue apareciendo siempre) + verificación de
  `alternates.languages`.
- `src/__tests__/app/sitemap-en-blog-content.test.ts` — **nuevo**. Test de integración contra el
  contenido real del repositorio (sin mocks de `@/lib/blog`): confirma que las 3 URLs 404
  concretas ya no aparecen, que sus versiones en español siguen presentes, que un post EN real e
  indexable (`como-ahorrar-dinero-cada-mes`) sigue apareciendo, que un post EN real marcado
  `noindex` (`ahorro-pareja`) sigue excluido, y que `/login`/`/en/login` no se han visto afectados.

No se modificó ningún fichero `.mdx`, ninguna metadata de artículo, `robots.txt`, ni ningún
archivo relacionado con `/login` o `/en/login`.

## URLs eliminadas del sitemap

- `https://www.metodokakebo.com/en/blog/cuentas-remuneradas`
- `https://www.metodokakebo.com/en/blog/fondo-de-emergencia`
- `https://www.metodokakebo.com/en/blog/regla-50-30-20-ejemplo`

Sus versiones en español (`/blog/cuentas-remuneradas`, `/blog/fondo-de-emergencia`,
`/blog/regla-50-30-20-ejemplo`) permanecen en el sitemap, ahora con `alternates.languages`
limitado a `es` (sin `en`), reflejando correctamente que no existe traducción inglesa.

## URLs inglesas válidas conservadas

Verificado que las 10 URLs `/en/blog/*` correspondientes a ficheros `.en.mdx` reales y no marcados
`noindex` siguen presentes sin cambios (comparación de conteo total del sitemap local: 50 URLs de
producción actuales → 47 tras el fix, exactamente -3, ninguna otra URL afectada). Ejemplo
verificado explícitamente en test: `https://www.metodokakebo.com/en/blog/como-ahorrar-dinero-cada-mes`.

Los 10 posts EN existentes y explícitamente marcados `noindex: true` (p. ej. `ahorro-pareja`,
`kakebo-vs-ynab`, `alternativas-a-app-bancarias`, etc.) siguen correctamente excluidos, sin
cambios de comportamiento respecto a antes del fix.

## Pruebas realizadas

- `src/__tests__/app/sitemap.test.ts` (5 tests, mockeado): post con EN indexable aparece; post sin
  fichero EN no aparece; post con EN `noindex` no aparece; el ES aparece siempre pase lo que pase
  con el EN; `alternates.languages` solo incluye `en` cuando corresponde.
- `src/__tests__/app/sitemap-en-blog-content.test.ts` (5 tests, contenido real sin mocks): las 3
  URLs 404 confirmadas están ausentes; sus 3 versiones ES siguen presentes; un post EN real e
  indexable sigue presente; un post EN real con `noindex` sigue ausente; `/login` y `/en/login`
  siguen presentes sin cambios.

## Validación local

- `npm run build` → **PASS**.
- `npm run lint` → **0 errores** (76 warnings preexistentes, sin cambios, ningún warning nuevo).
- `npm test` → **595/596** (10 tests nuevos, todos en verde; el único fallo es el mismo
  preexistente y ajeno de `calculate-whatif.test.ts`, ya documentado, no relacionado con este fix).
- Sitemap generado localmente (`npm run start` + `curl http://localhost:3000/sitemap.xml`):
  - Las 3 URLs `/en/blog/cuentas-remuneradas`, `/en/blog/fondo-de-emergencia`,
    `/en/blog/regla-50-30-20-ejemplo` → **ausentes**.
  - Sus 3 contrapartes en español → **presentes**, con `alternates.languages` limitado a `es`.
  - `/en/blog/como-ahorrar-dinero-cada-mes` (EN real e indexable) → **presente**.
  - `/en/blog/ahorro-pareja` (EN real, `noindex`) → **ausente**; `/blog/ahorro-pareja` (ES) →
    presente.
  - `/login` y `/en/login` → presentes, sin cambios.
  - Total de URLs del sitemap: 47 (antes del fix, en producción: 50; diferencia de exactamente
    -3, coherente con las 3 URLs eliminadas y ninguna otra).

## Validación de producción

**Pendiente de despliegue.** Tras el despliegue de este commit a producción, queda pendiente:

1. Descargar `https://www.metodokakebo.com/sitemap.xml` y confirmar la ausencia de las 3 URLs
   `/en/blog/*` afectadas.
2. Confirmar que las 3 URLs siguen devolviendo HTTP 404 (comportamiento correcto — el fix retira
   el anuncio en el sitemap, no crea contenido nuevo ni cambia el estado real de esas rutas).
3. Confirmar que las URLs `/en/blog/*` válidas y `/login`/`/en/login` no han cambiado.

Este paso no se ha podido completar dentro de esta tarea porque requiere el despliegue real del
commit a `https://www.metodokakebo.com`, fuera del alcance de las acciones ejecutables en este
entorno de trabajo. Se recomienda repetir el método de verificación de
`SEO-TECH-SITEMAP-VALIDATION-01` sección 3 tras el despliegue.

## Confirmación: `/login` fuera de alcance

No se ha modificado `src/app/[locale]/login/layout.tsx` ni ninguna línea de `sitemap.ts`
relacionada con `coreRoutes` (que es donde se generan `/login` y `/en/login`). El bug de canonical
de login, documentado en `SEO-TECH-SITEMAP-VALIDATION-01` (tarea de corrección propuesta
`SEO-TECH-LOGIN-CANONICAL-FIX-01`), permanece intacto y sin corregir, tal y como exige el alcance
de esta tarea. Verificado explícitamente en ambos tests nuevos que `/login` y `/en/login` siguen
presentes en el sitemap sin cambios.
