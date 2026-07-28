# SEO-PERF-LARGE-IMAGES-FIX-KAKEBO-AUTONOMOS-01 — Cierre

**Fecha:** 2026-07-28
**Modelo:** Claude Code
**Estado:** ✅ Completado — validación local y validación de producción conjunta superadas (tarea `SEO-PERF-LARGE-IMAGES-REMAINING-PRODUCTION-VALIDATION-01`). Cierre definitivo.

## Peso original y final

- **Original:** `public/images/blog/kakebo-autonomos.png` — 2 472 867 bytes (2,47 MB), PNG
  truecolor RGB, 3 canales, sin alfa, 8 bits/canal, sin perfil ICC, sin paleta, 1536×1024 px.
- **Final:** 764 399 bytes (0,73 MB / ~746 KB).

## Reducción porcentual

**69,1 %** (2 472 867 → 764 399 bytes).

## Dimensiones y formato

Idénticos: 1536×1024, PNG válido (`isPalette: true`, colormap de 8 bits, sin alfa —
`file`: "PNG image data, 1536 x 1024, 8-bit colormap, non-interlaced").

## Configuración utilizada

Analizada independientemente (no se reutilizaron los parámetros de `ahorro-pareja.png` sin
validar). Contenido visual: portada de libreta Kakebo con caligrafía japonesa (家計簿), etiqueta
"KAKEBO", una tabla con iconos pequeños dibujados a mano (casa, cubiertos, bolsa, coche, libro,
cruz, tijeras) y líneas de cuadrícula finas — mucho más exigente en preservación de texto/bordes
finos que `ahorro-pareja.png`.

**Alternativas probadas:**

| Configuración | Peso | Resultado |
|---|---|---|
| Sin pérdida (`compressionLevel:9, effort:10, palette:false`) | 2 252 509 B (2,25 MB) | Solo -8,9%, insuficiente |
| Paleta 256 colores, sin dithering (`dither:0`) | 748 356 B | Objetivo alcanzado |
| **Paleta 256 colores, con dithering (`dither:1.0`) — elegida** | **764 399 B** | Objetivo alcanzado, mayor robustez frente a banding en degradados |

**Parámetros finales aplicados (`sharp`):**

```js
sharp(original)
  .png({ palette: true, colors: 256, compressionLevel: 9, effort: 10, dither: 1.0 })
  .toFile(output)
```

## Comparación visual

Se compararon original vs. las 2 variantes de paleta en 3 zonas críticas, recortadas y ampliadas
3× a resolución nativa:

1. **Caligrafía/texto** (kanji 家計簿, etiqueta "KAKEBO", círculo pintado a mano): trazos
   idénticos al original, sin pérdida de nitidez, sin halos, sin artefactos — tanto con dithering
   como sin él.
2. **Tabla con iconos pequeños** (casa, cubiertos, bolsa, coche, libro, cruz, tijeras, líneas de
   cuadrícula finas): iconos y líneas perfectamente nítidos, indistinguibles del original.
3. **Degradado suave** (jarrón de cerámica desenfocado, veta de madera de la mesa): sin banding
   perceptible en ninguna de las 2 variantes, ni siquiera a 3× de zoom.

A diferencia de `ahorro-pareja.png` (donde sí se detectó un grano de dithering sutil en zonas de
bokeh muy suave), esta imagen cuantiza de forma mucho más limpia — su textura de papel, grano de
madera y regiones de color más delimitadas ocultan cualquier artefacto de paletización incluso a
resolución nativa ampliada.

## Trade-offs

Ninguno detectado que requiriera decisión del usuario en este caso: ambas variantes de paleta
(con y sin dithering) resultaron visualmente indistinguibles del original incluso en la
inspección más exigente (zoom 3× sobre texto e iconos finos). Se optó por la versión con
dithering por ser la práctica más robusta por defecto ante posibles degradados no detectados en
esta inspección puntual, sin coste de peso relevante (764 KB vs. 748 KB).

## Resultado del hero

Verificado en HTML local (`/blog/metodo-kakebo-para-autonomos` y
`/en/blog/metodo-kakebo-para-autonomos`): `<Image priority>` genera el mismo `srcSet`/`sizes` de
siempre, apuntando a `/_next/image?url=%2Fimages%2Fblog%2Fkakebo-autonomos.png&...` (ruta sin
cambios). Confirmado visualmente en navegador: portada del Kakebo con caligrafía nítida, iconos
de la tabla legibles, sin regresión de layout.

## Open Graph, Twitter y schema

Sin cambios de referencia — verificados en el HTML local:

- `og:image`: `.../images/blog/kakebo-autonomos.png`.
- `twitter:image`: `.../images/blog/kakebo-autonomos.png`.
- Schema `BlogPosting.image`: `["/images/blog/kakebo-autonomos.png"...]`.

## Miniaturas relacionadas

Verificado en `/blog/ahorro-pareja` (artículo que lista `metodo-kakebo-para-autonomos` en su
`related:`): la miniatura de `RelatedPosts.tsx` genera su `srcSet` habitual apuntando a la misma
ruta, sin cambios de comportamiento.

## Validación local

- Metadata del fichero final: PNG válido, 1536×1024, sin alfa, colormap de 8 bits — verificado
  con `sharp().metadata()` y `file`.
- `npm run build` → **PASS**.
- `npm run lint` → **0 errores** (76 warnings preexistentes, sin cambios).
- `npm test` → **610/611** (mismo fallo preexistente y ajeno en `calculate-whatif.test.ts`, no
  relacionado con este cambio).
- `http://localhost:3000/images/blog/kakebo-autonomos.png` → HTTP 200, `Content-Length: 764399`.
- `http://localhost:3000/_next/image?url=%2Fimages%2Fblog%2Fkakebo-autonomos.png&w=828&q=75` →
  HTTP 200 (187 442 bytes, PNG sin negociación WebP).
- `/blog/metodo-kakebo-para-autonomos` y `/en/blog/metodo-kakebo-para-autonomos` → HTTP 200 ambos.
- Comprobación visual real en navegador: hero mostrado correctamente, texto y detalles nítidos,
  sin regresión de layout.
- **Otros assets confirmados sin cambios:** `ahorro-pareja.png` (718 596 B, sin variación),
  `kakebo-vs-ynab.png` (2 448 636 B), `libro-kakebo-pdf.png` (2 193 491 B).

## Validación de producción

**Completada el 2026-07-28**, de forma conjunta con las otras 2 imágenes de la cadena, tras
confirmar el despliegue del commit `e879d6c937b3044c87313a2cf372db18db84e94b` (último de la
serie).

- `https://www.metodokakebo.com/images/blog/kakebo-autonomos.png` → HTTP 200,
  `Content-Type: image/png`, `Content-Length: 764399` (idéntico al local), 1536×1024, PNG válido
  (colormap de 8 bits).
- `/_next/image?url=%2Fimages%2Fblog%2Fkakebo-autonomos.png&w=828&q=75`: sin negociación WebP →
  HTTP 200, PNG, 187 477 bytes; con `Accept: image/webp` (navegador real) → HTTP 200, **WebP,
  43 852 bytes**.
- `/blog/metodo-kakebo-para-autonomos` y `/en/blog/metodo-kakebo-para-autonomos` → HTTP 200
  ambos; hero, `og:image`, `twitter:image` y schema `BlogPosting.image` apuntando correctamente a
  `/images/blog/kakebo-autonomos.png`.
- Comprobación visual real en navegador (ambos locales): portada con caligrafía japonesa
  (家計簿) y tabla de iconos completamente nítidas, sin artefactos, sin regresión de layout.
- Miniatura relacionada verificada en `https://www.metodokakebo.com/blog/ahorro-pareja`.
- `ahorro-pareja.png` (718 596 B), `kakebo-vs-ynab.png` (639 302 B) y `libro-kakebo-pdf.png`
  (608 577 B) confirmados en producción sin afectar a este asset.
