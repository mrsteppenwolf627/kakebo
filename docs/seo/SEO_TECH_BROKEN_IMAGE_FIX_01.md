# SEO-TECH-BROKEN-IMAGE-FIX-01 — Cierre

**Fecha:** 2026-07-28
**Modelo:** Claude Code
**Estado:** ✅ Completado (validación local); validación de producción pendiente de despliegue

## Referencia anterior

`src/content/blog/metodo-kakebo-guia-definitiva.en.mdx`, frontmatter, campo `image`:

```yaml
image: "/images/blog/kakebo-method.jpg"
```

Fichero que, según `SEO-TECH-BROKEN-IMAGE-VALIDATION-01`, nunca existió en el repositorio
(confirmado en `git log --all`) y devolvía HTTP 404 tanto en su forma original como en su
variante optimizada `/_next/image`.

## Referencia nueva

```yaml
image: "/images/blog/metodo-kakebo-guia-definitiva.png"
```

Mismo asset que ya usa correctamente la versión española del artículo — existente en
`public/images/blog/metodo-kakebo-guia-definitiva.png` (2 560 701 bytes, `image/png`), verificado
HTTP 200 en producción antes de este cambio.

## Archivo modificado

Único fichero tocado: `src/content/blog/metodo-kakebo-guia-definitiva.en.mdx` — una única línea
del frontmatter (el valor del campo `image`). No se modificó el cuerpo del artículo, ningún otro
campo del frontmatter (`title`, `excerpt`, `faq`, etc.), ni ningún otro fichero del repositorio.
Verificado con `git diff --stat`: 1 archivo, 1 línea insertada, 1 línea eliminada.

## Comprobación del asset

- `public/images/blog/metodo-kakebo-guia-definitiva.png` existe en el repositorio (confirmado con
  `ls` antes de aplicar el cambio).
- Búsqueda de `kakebo-method` en todo `src/`, `public/` y `messages/` tras el cambio: **0
  resultados** — no queda ninguna referencia al fichero roto en ningún lugar del código.

## Validación local

- `npm run build` → **PASS**.
- `npm run lint` → **0 errores** (76 warnings preexistentes, sin cambios).
- `npm test` → **610/611** (mismo fallo preexistente y ajeno en `calculate-whatif.test.ts`, no
  relacionado con este fix; ningún test roto por este cambio).
- HTML servido localmente (`npm run start` + `curl` sobre
  `http://localhost:3000/en/blog/metodo-kakebo-guia-definitiva`):
  - **Hero del artículo:** `<img>` con `srcSet`/`src` apuntando a
    `/_next/image?url=%2Fimages%2Fblog%2Fmetodo-kakebo-guia-definitiva.png&...` — correcto.
  - **`og:image`:** `.../images/blog/metodo-kakebo-guia-definitiva.png` — correcto.
  - **`twitter:image`:** `.../images/blog/metodo-kakebo-guia-definitiva.png` — correcto.
  - **Schema `BlogPosting`:** `"image":["/images/blog/metodo-kakebo-guia-definitiva.png"...]` —
    correcto.
  - **0 apariciones** de `kakebo-method` en el HTML servido.
  - Asset verificado accesible: `http://localhost:3000/images/blog/metodo-kakebo-guia-definitiva.png`
    → HTTP 200; su variante optimizada `/_next/image?url=...` → HTTP 200.
  - **Versión española sin cambios:** `http://localhost:3000/blog/metodo-kakebo-guia-definitiva`
    sigue sirviendo `og:image` idéntico al de antes de este fix (mismo asset, ya lo usaba
    correctamente).

## Validación de producción

**Pendiente de despliegue**, siguiendo el mismo patrón que las tareas anteriores de este ciclo.
Tras el despliegue de este commit, queda pendiente confirmar en
`https://www.metodokakebo.com/en/blog/metodo-kakebo-guia-definitiva`:

1. Hero visible sin icono de imagen rota.
2. `https://www.metodokakebo.com/images/blog/metodo-kakebo-guia-definitiva.png` → HTTP 200 (ya
   verificado hoy en producción como parte de `SEO-TECH-BROKEN-IMAGE-VALIDATION-01`, sin cambios
   esperados en el asset en sí).
3. `og:image` y `twitter:image` correctos en el HTML servido.
4. Schema `BlogPosting.image` correcto.
5. Ausencia total de `kakebo-method.jpg` en el HTML de producción.

Se recomienda una tarea de seguimiento `SEO-TECH-BROKEN-IMAGE-FIX-PRODUCTION-VALIDATION-01`.

## Confirmación: sin cambios de contenido ni metadata adicional

- **Contenido del artículo (cuerpo MDX):** sin cambios.
- **`title`, `excerpt`, `author`, `readingTime`, `faq`:** sin cambios.
- **Versión española (`.es.mdx`):** sin cambios, no tocada.
- **`canonical`, `hreflang`, `robots`, `sitemap`:** sin cambios — este fix no toca la generación
  de metadata de `blog/[slug]/page.tsx`, solo el dato de origen (`frontmatter.image`) que esa
  plantilla ya consumía correctamente.
- **Slug:** sin cambios.
- **Peso/optimización de la imagen:** no se ha tocado el asset en sí, tal como exige el alcance de
  esta tarea; sigue siendo el mismo fichero de 2 560 701 bytes ya usado por la versión española.
