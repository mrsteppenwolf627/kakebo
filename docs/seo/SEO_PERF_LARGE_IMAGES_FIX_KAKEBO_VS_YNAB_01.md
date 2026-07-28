# SEO-PERF-LARGE-IMAGES-FIX-KAKEBO-VS-YNAB-01 — Cierre

**Fecha:** 2026-07-28
**Modelo:** Claude Code
**Estado:** ✅ Completado (validación local); validación de producción conjunta pendiente (tarea 4 de la cadena)

## Peso original y final

- **Original:** `public/images/blog/kakebo-vs-ynab.png` — 2 448 636 bytes (2,45 MB), PNG truecolor
  RGB, 3 canales, sin alfa, 8 bits/canal, sin perfil ICC, sin paleta, 1536×1024 px.
- **Final:** 639 302 bytes (0,61 MB / ~624 KB).

## Reducción porcentual

**73,9 %** (2 448 636 → 639 302 bytes).

## Dimensiones y formato

Idénticos: 1536×1024, PNG válido (`isPalette: true`, colormap de 8 bits, sin alfa —
`file`: "PNG image data, 1536 x 1024, 8-bit colormap, non-interlaced").

## Configuración utilizada

Analizada independientemente de las 2 imágenes anteriores. Contenido visual: balanza de latón
con reflejos metálicos y cadenas finas, un teléfono móvil con una interfaz de app (gráfico
circular, barras y pequeños iconos en la parte inferior de la pantalla), libreta, planta y
portátil — combina reflejos metálicos degradados (el elemento más exigente frente a
posterización) con una UI de pantalla con iconos pequeños (exigente frente a pérdida de nitidez).

**Alternativas probadas:**

| Configuración | Peso | Resultado |
|---|---|---|
| Sin pérdida (`compressionLevel:9, effort:10, palette:false`) | 2 210 967 B (2,21 MB) | Solo -9,7%, insuficiente |
| Paleta 256 colores, sin dithering (`dither:0`) | 585 166 B | Objetivo alcanzado |
| **Paleta 256 colores, con dithering (`dither:1.0`) — elegida** | **639 302 B** | Objetivo alcanzado, mayor robustez frente a banding en los reflejos metálicos |

**Parámetros finales aplicados (`sharp`):**

```js
sharp(original)
  .png({ palette: true, colors: 256, compressionLevel: 9, effort: 10, dither: 1.0 })
  .toFile(output)
```

## Comparación visual

Se compararon original vs. variante de paleta con dithering en 2 zonas críticas, recortadas y
ampliadas 3× a resolución nativa:

1. **Iconos y bordes de la pantalla del teléfono** (barra de navegación inferior, iconos
   pequeños, borde curvo del dispositivo): nítidos, sin pérdida de definición, indistinguibles
   del original.
2. **Balanza de latón** (degradados metálicos en el brazo, base, cadenas finas y reflejos de luz
   en los platillos): sin banding ni posterización perceptible, incluso en las zonas de brillo
   más suaves de los platillos — resultado excelente pese a ser el elemento más exigente de la
   imagen.

Ninguna de las 2 zonas mostró artefactos, halos, pérdida de texto/iconos ni cambios de color
apreciables.

## Trade-offs

Ninguno detectado que requiriera decisión del usuario: la variante con dithering resultó
visualmente indistinguible del original tanto en los reflejos metálicos (la zona de mayor riesgo
de esta imagen) como en los iconos finos de la pantalla. Se optó por dithering sobre la variante
sin dithering (585 KB) por el mismo criterio de robustez por defecto ya aplicado en
`kakebo-autonomos.png`, con un coste de peso adicional mínimo (+54 KB).

## Resultado del hero

Verificado en HTML local (`/blog/kakebo-vs-ynab` y `/en/blog/kakebo-vs-ynab`): `<Image priority>`
genera el mismo `srcSet`/`sizes` de siempre, apuntando a
`/_next/image?url=%2Fimages%2Fblog%2Fkakebo-vs-ynab.png&...` (ruta sin cambios). Confirmado
visualmente en navegador: balanza y teléfono nítidos, sin regresión de layout.

## Open Graph, Twitter y schema

Sin cambios de referencia — verificados en el HTML local:

- `og:image`: `.../images/blog/kakebo-vs-ynab.png`.
- `twitter:image`: `.../images/blog/kakebo-vs-ynab.png`.
- Schema `BlogPosting.image`: `["/images/blog/kakebo-vs-ynab.png"...]`.

## Miniaturas relacionadas

Verificado en `/blog/alternativas-a-app-bancarias` (artículo que lista `kakebo-vs-ynab` en su
`related:`): la miniatura de `RelatedPosts.tsx` genera su `srcSet` habitual apuntando a la misma
ruta, sin cambios de comportamiento.

## Validación local

- Metadata del fichero final: PNG válido, 1536×1024, sin alfa, colormap de 8 bits — verificado
  con `sharp().metadata()` y `file`.
- `npm run build` → **PASS**.
- `npm run lint` → **0 errores** (76 warnings preexistentes, sin cambios).
- `npm test` → **610/611** (mismo fallo preexistente y ajeno en `calculate-whatif.test.ts`, no
  relacionado con este cambio).
- `http://localhost:3000/images/blog/kakebo-vs-ynab.png` → HTTP 200, `Content-Length: 639302`.
- `http://localhost:3000/_next/image?url=%2Fimages%2Fblog%2Fkakebo-vs-ynab.png&w=828&q=75` →
  HTTP 200 (194 788 bytes, PNG sin negociación WebP).
- `/blog/kakebo-vs-ynab` y `/en/blog/kakebo-vs-ynab` → HTTP 200 ambos.
- Comprobación visual real en navegador: hero mostrado correctamente, detalles nítidos, sin
  regresión de layout.
- **Otros assets confirmados sin cambios:** `ahorro-pareja.png` (718 596 B),
  `kakebo-autonomos.png` (764 399 B), `libro-kakebo-pdf.png` (2 193 491 B, aún sin optimizar,
  pendiente en la tarea 3 de esta cadena).

## Validación de producción

**Pendiente** — se validará de forma conjunta con las otras 2 imágenes de esta cadena en la tarea
`SEO-PERF-LARGE-IMAGES-REMAINING-PRODUCTION-VALIDATION-01`, tras desplegar el último commit de la
cadena.
