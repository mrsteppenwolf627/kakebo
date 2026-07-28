# SEO-PERF-LARGE-IMAGES-FIX-AHORRO-PAREJA-01 — Cierre

**Fecha:** 2026-07-28
**Modelo:** Claude Code
**Estado:** ✅ Completado (validación local); validación de producción pendiente de despliegue

## 1. Peso original

`public/images/blog/ahorro-pareja.png` — **2 542 524 bytes (2,54 MB)**, PNG truecolor RGB
(3 canales, sin alfa/transparencia), 8 bits/canal, sin perfil ICC ni metadata embebida, sin
paleta (`isPalette: false`), 1536×1024 px (verificado con `sharp().metadata()` antes de tocar el
fichero).

## 2. Peso final

**718 596 bytes (0,69 MB / ~702 KB)** — dentro del rango objetivo (300–800 KB) y por debajo de
1 MB.

## 3. Porcentaje de reducción

**71,7 %** de reducción respecto al original (2 542 524 → 718 596 bytes).

## 4. Dimensiones originales y finales

Idénticas: **1536 × 1024 px** en ambos casos (verificado con `sharp().metadata()` sobre el
fichero final). Sin recorte, sin cambio de proporción, sin reescalado.

## 5. Herramienta y parámetros utilizados

**`sharp`** (dependencia ya presente en el proyecto, `node_modules/sharp`), vía un script Node.js
puntual ejecutado sobre una copia temporal del original (fuera del repositorio, en el directorio
de scratchpad de la sesión — nunca se sobrescribió el original hasta confirmar el resultado).

Se probaron dos enfoques antes de decidir:

1. **Recompresión sin pérdida** (`compressionLevel: 9, effort: 10, adaptiveFiltering: true,
   palette: false`): 2,54 MB → 2,35 MB (solo ~7,5 % de reducción, píxeles idénticos al original).
   Insuficiente para alcanzar el objetivo de peso.
2. **PNG indexado de 256 colores con dithering** (`palette: true, colors: 256,
   compressionLevel: 9, effort: 10, dither: 1.0`): 2,54 MB → 719 KB. Es la técnica finalmente
   aplicada.

**Parámetros finales aplicados:**

```js
sharp(original)
  .png({ palette: true, colors: 256, compressionLevel: 9, effort: 10, dither: 1.0 })
  .toFile(output)
```

El resultado sigue siendo un PNG válido (`isPalette: true`, colormap de 8 bits, sin alfa —
verificado con `sharp().metadata()` y con `file` sobre el fichero final).

## 6. Método de comparación visual

1. **Inspección a tamaño real de visualización web** (828 px de ancho, el tamaño real que sirve
   el hero del artículo vía `sizes="(max-width: 768px) 100vw, 768px"`): original y optimizada
   generadas con `sharp().resize(828)` y comparadas visualmente — **indistinguibles**.
2. **Inspección a resolución nativa con recorte y ampliación 3×** de una zona de degradado suave
   (fondo desenfocado, lámpara encendida, pared) — a esta ampliación **sí se aprecia un grano de
   dithering sutil** en la versión de 256 colores que no está presente en el original. Esta
   comparación se mostró al usuario antes de aplicar el cambio.
3. **Decisión informada del usuario:** dado el conflicto explícito entre el requisito de peso
   (<1 MB) y el requisito de cero degradación visible detectado durante la validación, se
   presentaron ambas alternativas (compresión sin pérdida insuficiente vs. palette con dithering
   sutil solo visible con zoom al archivo nativo) mediante una pregunta directa. El usuario
   seleccionó explícitamente la versión de 256 colores (719 KB), asumiendo el dithering sutil
   como aceptable dado que es imperceptible en el tamaño real de visualización en la web.
4. **Confirmación final:** captura de pantalla del artículo real (`/blog/ahorro-pareja`,
   servidor de producción local) tras aplicar el cambio — la imagen se muestra completa, sin
   iconos rotos, sin deformación, sin banding perceptible a tamaño de visualización normal.

## 7. Resultado del hero

Verificado en HTML servido localmente (`/blog/ahorro-pareja` y `/en/blog/ahorro-pareja`): el
`<Image priority>` sigue generando el mismo `srcSet`/`sizes` de siempre, apuntando a
`/_next/image?url=%2Fimages%2Fblog%2Fahorro-pareja.png&...` (ruta sin cambios). Confirmado
visualmente en navegador: la imagen carga completa, correctamente encuadrada, sin regresión de
layout en el resto del artículo.

## 8. Resultado de Open Graph, Twitter y schema

Sin cambios de referencia — los 3 siguen apuntando exactamente a `/images/blog/ahorro-pareja.png`
en ambos locales (ES y EN), verificado en el HTML servido:

- `og:image`: `.../images/blog/ahorro-pareja.png`.
- `twitter:image`: `.../images/blog/ahorro-pareja.png`.
- Schema `BlogPosting.image`: `["/images/blog/ahorro-pareja.png"...]`.

Como no se tocó ningún componente ni frontmatter, estas 3 referencias nunca dejaron de apuntar a
la ruta correcta — solo cambió el contenido binario del fichero al que apuntan.

## 9. Resultado de las miniaturas

Verificado en `/blog/kakebo-sueldo-minimo` (artículo que lista `ahorro-pareja` en su
`related:`): la miniatura de `RelatedPosts.tsx` sigue generando su `srcSet` habitual
(`w=384` hasta `w=3840`) apuntando a la misma ruta, sin cambios de comportamiento.

## 10. Validación local

- **Metadata del fichero final:** PNG válido, 1536×1024, sin alfa, colormap de 8 bits — verificado
  con `sharp().metadata()` y `file`.
- `npm run build` → **PASS**.
- `npm run lint` → **0 errores** (76 warnings preexistentes, sin cambios).
- `npm test` → **610/611** (mismo fallo preexistente y ajeno en `calculate-whatif.test.ts`, no
  relacionado con este cambio).
- `http://localhost:3000/images/blog/ahorro-pareja.png` → HTTP 200, `Content-Length: 718596`.
- `http://localhost:3000/_next/image?url=%2Fimages%2Fblog%2Fahorro-pareja.png&w=828&q=75` →
  HTTP 200 (228 033 bytes, PNG sin negociación WebP en esta prueba — coherente con el
  comportamiento ya documentado en `SEO-PERF-LARGE-IMAGES-VALIDATION-01`).
- `/blog/ahorro-pareja` y `/en/blog/ahorro-pareja` → HTTP 200 ambos.
- Comprobación visual real en navegador (captura de pantalla): hero mostrado correctamente, sin
  degradación perceptible, sin regresión de layout.

## 11. Validación de producción

**Pendiente de despliegue**, siguiendo el mismo patrón que las tareas anteriores de este ciclo.
Tras el despliegue de este commit, queda pendiente confirmar en
`https://www.metodokakebo.com/images/blog/ahorro-pareja.png`: HTTP 200, peso ~719 KB, y
comprobación visual real del hero en `/blog/ahorro-pareja` y `/en/blog/ahorro-pareja`. Se
recomienda una tarea de seguimiento
`SEO-PERF-LARGE-IMAGES-FIX-AHORRO-PAREJA-PRODUCTION-VALIDATION-01`.

## 12. Confirmación: las otras imágenes no fueron modificadas

Verificado con `git diff --stat` sobre las 3 imágenes restantes detectadas en
`SEO-PERF-LARGE-IMAGES-VALIDATION-01` — **sin cambios**:

- `public/images/blog/kakebo-vs-ynab.png` — 2 448 636 bytes, sin modificar.
- `public/images/blog/kakebo-autonomos.png` — 2 472 867 bytes, sin modificar.
- `public/images/blog/libro-kakebo-pdf.png` — 2 193 491 bytes, sin modificar.

Ninguna quedó incluida en este commit. No se ha modificado ningún fichero MDX, componente ni
configuración — el único archivo tocado en todo el repositorio es
`public/images/blog/ahorro-pareja.png`.
