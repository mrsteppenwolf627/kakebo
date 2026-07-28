# SEO-TECH-BROKEN-IMAGE-VALIDATION-01 — Validación de imagen rota en artículo EN

**Fecha:** 2026-07-28
**Modelo:** Claude Code
**Estado:** ✅ Completado — **Tarea exclusiva de diagnóstico y documentación. Cero cambios de código, contenido, imágenes o metadata.**
**Rama operativa:** `main` (sincronizada con `origin/main`; commit `d09270e372e5c6175d543b64675b13296e1ee820` confirmado presente antes de iniciar esta validación)

---

## 1. Hallazgo original

Auditoría SE Ranking, 28 de julio de 2026: imagen no encontrada (4XX) detectada en
`https://www.metodokakebo.com/en/blog/metodo-kakebo-guia-definitiva`.

## 2. URL de página afectada

`https://www.metodokakebo.com/en/blog/metodo-kakebo-guia-definitiva` — verificado HTTP 200 (la
página en sí carga correctamente; el problema es un recurso interno, no la página).

## 3. URL exacta de la imagen

`https://www.metodokakebo.com/images/blog/kakebo-method.jpg`

Referenciada en el HTML de la página de 3 formas:
- Hero visible del artículo, vía Next.js Image (`<img>` real, con `srcSet` generado a través de
  `/_next/image?url=%2Fimages%2Fblog%2Fkakebo-method.jpg&...`).
- `<meta property="og:image" content="https://www.metodokakebo.com/images/blog/kakebo-method.jpg"/>`.
- `<meta name="twitter:image" content="https://www.metodokakebo.com/images/blog/kakebo-method.jpg"/>`.
- Campo `image` del JSON-LD `BlogPosting` (dato estructurado).

## 4. Código HTTP

- `https://www.metodokakebo.com/images/blog/kakebo-method.jpg` (asset original) → **HTTP 404**.
- `https://www.metodokakebo.com/_next/image?url=%2Fimages%2Fblog%2Fkakebo-method.jpg&w=1200&q=75`
  (versión optimizada usada realmente en el `<img>` renderizado) → **HTTP 404** también (Next.js
  Image Optimization no puede servir una variante de un origen que no existe).

## 5. Origen en código / MDX

`src/content/blog/metodo-kakebo-guia-definitiva.en.mdx`, frontmatter, línea 7:

```yaml
image: "/images/blog/kakebo-method.jpg"
```

Consumido por `src/app/[locale]/(public)/blog/[slug]/page.tsx` en 4 puntos, todos usando
`post.frontmatter.image` directamente sin comprobar su existencia:
- Línea 55 → `openGraph.images[0].url`.
- Línea 74 → `twitter.images[0]`.
- Líneas 129-132 → `<Image src={post.frontmatter.image} .../>` (hero visible del artículo).
- Línea 189 → `schema.image` (JSON-LD `BlogPosting`).

El template en sí es correcto y no genera ninguna ruta incorrecta — reproduce fielmente el valor
literal que declara el frontmatter. La causa está exclusivamente en el dato del contenido, no en
el código de la plantilla.

## 6. Comparación ES/EN

| | ES (`.es.mdx`) | EN (`.en.mdx`) |
|---|---|---|
| Campo `image` del frontmatter | `/images/blog/metodo-kakebo-guia-definitiva.png` | `/images/blog/kakebo-method.jpg` |
| Fichero en `public/images/blog/` | ✅ existe (`metodo-kakebo-guia-definitiva.png`) | ❌ no existe (`kakebo-method.jpg`) |
| HTTP del asset | 200 (verificado, `Content-Type: image/png`, 2 560 701 bytes) | 404 |
| Hero visible en la página | Se muestra correctamente | Icono de imagen rota (recurso no encontrado) |
| `og:image` / `twitter:image` | Correctos | Rotos |

**El problema afecta exclusivamente a la versión inglesa.** La versión española usa un nombre de
archivo distinto y correcto, apuntando a un asset que sí existe en el repositorio y en producción.

## 7. Estado de indexación de la página inglesa

- HTTP: 200.
- `<meta name="robots" content="index, follow"/>` — **indexable, no `noindex`**.
- Canonical: `https://www.metodokakebo.com/en/blog/metodo-kakebo-guia-definitiva` (autorreferente,
  correcto).
- hreflang: `es` → versión española, `en` → sí misma, `x-default` → versión española — correcto y
  coherente, sin el patrón de bug de `/es/` visto en tareas anteriores (login).
- Presente en `/sitemap.xml`, con `lastmod` `2026-07-01`, junto con su alternate `es` correcto.

La página está completamente indexable y correctamente configurada a nivel de metadata técnica —
el único defecto real es la imagen.

## 8. Alcance real

- Búsqueda exhaustiva de `kakebo-method.jpg` en todo el repositorio (`src/`, `public/`,
  `messages/`): **una única referencia**, la línea 7 del frontmatter de
  `metodo-kakebo-guia-definitiva.en.mdx`. Ninguna otra página, componente o contenido usa este
  nombre de archivo.
- Búsqueda del fichero en `public/images/blog/` (incluyendo variantes de mayúsculas/minúsculas):
  **no existe ninguna variante** del nombre `kakebo-method` en ningún formato.
- Búsqueda en el historial completo de Git (`git log --all --diff-filter=A`): el fichero
  **nunca ha existido** en ningún commit de este repositorio — no es un caso de "archivo
  eliminado", sino de un nombre de archivo que se escribió en el frontmatter sin que el asset
  correspondiente llegara a crearse o subirse nunca.
- El impacto es **visible para el usuario**, no solo para metadata social: el hero de la propia
  página del artículo (elemento `<Image>` renderizado en el cuerpo de la página, arriba del
  título) muestra un icono de imagen rota a cualquier visitante de la versión inglesa. Además
  afecta a las vistas previas de compartición social (Open Graph/Twitter Card) y al campo `image`
  del schema `BlogPosting`.

## 9. Causa raíz

El frontmatter de `metodo-kakebo-guia-definitiva.en.mdx` declara `image:
"/images/blog/kakebo-method.jpg"`, un nombre de archivo que nunca se correspondió con ningún
asset real subido al proyecto — a diferencia del resto de artículos traducidos, donde el campo
`image` del `.en.mdx` reutiliza (o debería reutilizar) el mismo fichero ya existente que usa la
versión `.es.mdx`. No es un problema de plantilla, de despliegue, de mayúsculas/minúsculas ni de
un archivo borrado — es un dato de contenido incorrecto desde su creación.

## 10. Riesgo SEO y UX

- **UX: alto.** Cualquier visitante humano de `/en/blog/metodo-kakebo-guia-definitiva` ve un
  icono de imagen rota en la cabecera del artículo — un defecto visual directamente visible, no
  solo un problema técnico de metadata.
- **Compartición social: alto.** Cualquier enlace compartido en redes sociales (Twitter/X,
  Facebook, LinkedIn, WhatsApp, etc.) de la versión inglesa de este artículo mostrará una vista
  previa sin imagen o rota, reduciendo el CTR de los enlaces compartidos.
- **SEO técnico puro: medio-bajo.** La página sigue siendo indexable, con canonical y hreflang
  correctos; Google no penaliza el ranking directamente por una imagen 404 aislada, pero sí puede
  degradar la elegibilidad de la página para resultados enriquecidos con imagen (rich results,
  Google Discover) y contribuye a que herramientas de auditoría (como SE Ranking) sigan marcando
  el dominio con errores de recursos.
- **Alcance del riesgo: contenido, no aislado en producción.** Al no existir el fichero en ningún
  punto del repositorio ni del historial, el problema se replicaría igual en cualquier entorno
  (local, staging, producción) — no es un fallo de despliegue puntual.

## 11. Primera corrección recomendada (propuesta, NO ejecutada)

**`SEO-TECH-BROKEN-IMAGE-FIX-01`** — alcance atómico: corregir el campo `image` del frontmatter de
`src/content/blog/metodo-kakebo-guia-definitiva.en.mdx` para que apunte a un asset real. La opción
más directa y de menor riesgo es reutilizar el mismo fichero que ya usa la versión española
(`/images/blog/metodo-kakebo-guia-definitiva.png`), que ya existe, ya se sirve correctamente
(HTTP 200) y ya contiene el diseño/branding del artículo — evitando la necesidad de generar o
subir un nuevo asset. Cambio de una única línea de frontmatter, sin tocar el cuerpo del artículo,
la plantilla, ni ningún otro fichero.

## 12. Elementos descartados / fuera de alcance de esta validación

- No se ha sustituido, generado ni subido ninguna imagen nueva.
- No se ha modificado el frontmatter ni el cuerpo de `metodo-kakebo-guia-definitiva.en.mdx` ni de
  su equivalente `.es.mdx`.
- No se ha modificado `blog/[slug]/page.tsx` ni ningún otro componente de plantilla.
- No se ha modificado metadata, canonical, hreflang, robots ni sitemap.
- No se ha auditado el resto de imágenes del sitio en busca de casos similares — esta tarea se
  limitó estrictamente a la URL señalada por SE Ranking; una auditoría más amplia de assets rotos
  quedaría como una tarea separada e independiente si se decide abordarla.

## Clasificación del hallazgo

**CONFIRMADO.** Verificado directamente contra producción (HTTP 404 real en el asset y en su
variante optimizada de Next.js), contra el código fuente (única referencia, en el frontmatter EN)
y contra el historial de Git (el fichero nunca existió). No es un falso positivo, no está resuelto
previamente, y no es parcial ni dudoso — el defecto es exacto, único y completamente identificado.

## STOP de implementación

**Esta tarea es exclusivamente de diagnóstico.** No se ha corregido la imagen, no se ha optimizado
ninguna otra imagen, no se ha modificado contenido, y no se han corregido otros hallazgos de la
auditoría SE Ranking. La corrección propuesta en la sección 11 queda documentada pero **no
ejecutada**. No se inicia ninguna otra tarea.
