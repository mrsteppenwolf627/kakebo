# SEO-PERF-LARGE-IMAGES-FIX-LIBRO-KAKEBO-PDF-01 — Cierre

**Fecha:** 2026-07-28
**Modelo:** Claude Code
**Estado:** ✅ Completado (validación local); validación de producción conjunta pendiente (tarea 4 de la cadena)

## Peso original y final

- **Original:** `public/images/blog/libro-kakebo-pdf.png` — 2 193 491 bytes (2,19 MB), PNG
  truecolor RGB, 3 canales, sin alfa, 8 bits/canal, sin perfil ICC, sin paleta, 1536×1024 px.
- **Final:** 608 577 bytes (0,58 MB / ~594 KB).

## Reducción porcentual

**72,3 %** (2 193 491 → 608 577 bytes).

## Dimensiones y formato

Idénticos: 1536×1024, PNG válido (`isPalette: true`, colormap de 8 bits, sin alfa —
`file`: "PNG image data, 1536 x 1024, 8-bit colormap, non-interlaced").

## Configuración utilizada

Analizada independientemente de las 2 imágenes anteriores. Contenido visual: es la imagen más
exigente en texto de las 4 de esta serie — una libreta abierta con el título manuscrito "PLAN
FINANCIERO" subrayado, una lista de 5 conceptos con icono + palabra cada uno ("Ingresos",
"Gastos", "Ahorro", "Inversión", "Metas"), un gráfico de barras y uno circular dibujados a mano,
la frase "Pequeños pasos, grandes cambios." y una calculadora con pantalla LCD mostrando los
dígitos "1250" — además de una alcancía, un tarro de monedas y un calendario con marcas de
verificación.

**Alternativas probadas:**

| Configuración | Peso | Resultado |
|---|---|---|
| Sin pérdida (`compressionLevel:9, effort:10, palette:false`) | 2 011 787 B (2,01 MB) | Solo -8,3%, insuficiente |
| Paleta 256 colores, sin dithering (`dither:0`) | 554 432 B | Objetivo alcanzado |
| **Paleta 256 colores, con dithering (`dither:1.0`) — elegida** | **608 577 B** | Objetivo alcanzado, mayor robustez frente a banding |

**Parámetros finales aplicados (`sharp`):**

```js
sharp(original)
  .png({ palette: true, colors: 256, compressionLevel: 9, effort: 10, dither: 1.0 })
  .toFile(output)
```

## Comparación visual

Se compararon original vs. variante de paleta con dithering en las 2 zonas de mayor riesgo,
recortadas y ampliadas 3× a resolución nativa:

1. **Texto manuscrito de la libreta** ("PLAN FINANCIERO" subrayado, "Ingresos", "Gastos",
   "Ahorro", "Inversión", "Metas" con sus iconos): completamente legible y nítido, trazos
   idénticos al original, sin pérdida de definición en ningún carácter.
2. **Dígitos de la pantalla LCD de la calculadora** ("1250"): perfectamente legibles, sin
   distorsión ni pérdida de contraste respecto al original.

Ninguna de las 2 zonas —las más exigentes de toda la serie de 4 imágenes por la cantidad de
texto/dígitos pequeños que contienen— mostró artefactos, halos, pérdida de nitidez ni cambios de
color apreciables.

## Trade-offs

Ninguno detectado que requiriera decisión del usuario: pese a ser la imagen con más texto fino de
la serie, la cuantización a 256 colores preservó perfectamente tanto el texto manuscrito como los
dígitos de la calculadora. Se optó por dithering sobre la variante sin dithering (554 KB) por el
mismo criterio de robustez por defecto ya aplicado en las 2 imágenes anteriores de esta cadena.

## Resultado del hero

Verificado en HTML local (`/blog/libro-kakebo-pdf` y `/en/blog/libro-kakebo-pdf`):
`<Image priority>` genera el mismo `srcSet`/`sizes` de siempre, apuntando a
`/_next/image?url=%2Fimages%2Fblog%2Flibro-kakebo-pdf.png&...` (ruta sin cambios). Confirmado
visualmente en navegador: texto "PLAN FINANCIERO" y lista de conceptos completamente legibles al
tamaño real de visualización, calculadora legible, sin regresión de layout.

## Open Graph, Twitter y schema

Sin cambios de referencia — verificados en el HTML local:

- `og:image`: `.../images/blog/libro-kakebo-pdf.png`.
- `twitter:image`: `.../images/blog/libro-kakebo-pdf.png`.
- Schema `BlogPosting.image`: `["/images/blog/libro-kakebo-pdf.png"...]`.

## Miniaturas relacionadas

Verificado en `/blog/plantilla-kakebo-excel` (artículo que lista `libro-kakebo-pdf` en su
`related:`): la miniatura de `RelatedPosts.tsx` genera su `srcSet` habitual apuntando a la misma
ruta, sin cambios de comportamiento.

## Validación local

- Metadata del fichero final: PNG válido, 1536×1024, sin alfa, colormap de 8 bits — verificado
  con `sharp().metadata()` y `file`.
- `npm run build` → **PASS**.
- `npm run lint` → **0 errores** (76 warnings preexistentes, sin cambios).
- `npm test` → **610/611** (mismo fallo preexistente y ajeno en `calculate-whatif.test.ts`, no
  relacionado con este cambio).
- `http://localhost:3000/images/blog/libro-kakebo-pdf.png` → HTTP 200, `Content-Length: 608577`.
- `http://localhost:3000/_next/image?url=%2Fimages%2Fblog%2Flibro-kakebo-pdf.png&w=828&q=75` →
  HTTP 200 (189 809 bytes, PNG sin negociación WebP).
- `/blog/libro-kakebo-pdf` y `/en/blog/libro-kakebo-pdf` → HTTP 200 ambos.
- Comprobación visual real en navegador: hero mostrado correctamente, todo el texto legible, sin
  regresión de layout.
- **Otras 3 imágenes de la serie confirmadas sin cambios en esta tarea:** `ahorro-pareja.png`
  (718 596 B), `kakebo-autonomos.png` (764 399 B), `kakebo-vs-ynab.png` (639 302 B) — todas ya
  optimizadas en tareas anteriores de esta cadena, retenidas sin modificación adicional.

## Validación de producción

**Pendiente** — se validará de forma conjunta con las otras 2 imágenes de esta cadena en la tarea
`SEO-PERF-LARGE-IMAGES-REMAINING-PRODUCTION-VALIDATION-01`, tras desplegar este commit (el último
de la serie de optimización).
