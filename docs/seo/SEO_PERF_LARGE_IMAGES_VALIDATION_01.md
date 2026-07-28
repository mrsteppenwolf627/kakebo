# SEO-PERF-LARGE-IMAGES-VALIDATION-01 — Validación de imágenes >1MB (auditoría SE Ranking)

**Fecha:** 2026-07-28
**Modelo:** Claude Code
**Estado:** ✅ Completado — **Tarea exclusiva de diagnóstico y documentación. Cero cambios de assets, contenido, componentes o configuración.**
**Rama operativa:** `main` (sincronizada con `origin/main`; commit `8783fec0906b13a8d7e9576b4814103437fe38e8` confirmado presente antes de iniciar esta validación)

---

## 1. Hallazgo original de SE Ranking

Auditoría del 28 de julio de 2026: 4 imágenes de más de 1 MB detectadas en:

- `https://www.metodokakebo.com/blog/kakebo-vs-ynab`
- `https://www.metodokakebo.com/blog/metodo-kakebo-para-autonomos`
- `https://www.metodokakebo.com/blog/libro-kakebo-pdf`
- `https://www.metodokakebo.com/blog/ahorro-pareja`

## 2. Tabla URL por URL

| URL | Asset (`image` frontmatter) | Formato/dimensiones originales | Peso original | HTTP asset raw |
|---|---|---|---|---|
| `/blog/kakebo-vs-ynab` | `/images/blog/kakebo-vs-ynab.png` | PNG, 1536×1024, RGB no interlaced | 2 448 636 B (2,45 MB) | 200 |
| `/blog/metodo-kakebo-para-autonomos` | `/images/blog/kakebo-autonomos.png` | PNG, 1536×1024, RGB no interlaced | 2 472 867 B (2,47 MB) | 200 |
| `/blog/libro-kakebo-pdf` | `/images/blog/libro-kakebo-pdf.png` | PNG, 1536×1024, RGB no interlaced | 2 193 491 B (2,19 MB) | 200 |
| `/blog/ahorro-pareja` | `/images/blog/ahorro-pareja.png` | PNG, 1536×1024, RGB no interlaced | 2 542 524 B (2,54 MB) | 200 |

Las 4 imágenes son PNG sin comprimir (sin reducción de paleta, exportación en bruto), la causa
directa de su peso desproporcionado para una resolución de 1536×1024.

## 3. Asset identificado — origen en código

Cada una se referencia en el campo `image` del frontmatter, **idéntico entre `.es.mdx` y
`.en.mdx`** (a diferencia del caso resuelto en `SEO-TECH-BROKEN-IMAGE-FIX-01`, aquí ambos locales
usan el mismo fichero real y existente):

```yaml
# kakebo-vs-ynab.{es,en}.mdx
image: '/images/blog/kakebo-vs-ynab.png'
# metodo-kakebo-para-autonomos.{es,en}.mdx
image: '/images/blog/kakebo-autonomos.png'
# libro-kakebo-pdf.{es,en}.mdx
image: '/images/blog/libro-kakebo-pdf.png'
# ahorro-pareja.{es,en}.mdx
image: '/images/blog/ahorro-pareja.png'
```

Consumido por `src/app/[locale]/(public)/blog/[slug]/page.tsx` en 4 puntos (mismo patrón para las
4 URLs): hero visible (`<Image priority sizes="(max-width: 768px) 100vw, 768px">`), `og:image`,
`twitter:image` y `schema.image` (JSON-LD `BlogPosting`). El hero usa `priority` (sin lazy
loading, correcto para un elemento LCP) y un `sizes` que refleja fielmente el ancho real de
visualización (contenedor `max-w-3xl` ≈ 768 px) — **no hay dimensiones desproporcionadas respecto
al tamaño visible**; el `sizes` está bien configurado.

## 4. Peso y formato realmente transferido (Next.js Image Optimization)

`next.config.ts` no define ningún bloque `images` personalizado — se usa la configuración por
defecto de Next.js, que sí tiene la optimización de imágenes activa (no hay `unoptimized: true`).
El `<img src>` real que aparece en el HTML servido **no es el fichero original**, es siempre
`/_next/image?url=%2Fimages%2Fblog%2F{fichero}&w={ancho}&q=75` — verificado en las 4 páginas.

Medido contra producción para `kakebo-vs-ynab.png` y `ahorro-pareja.png` (representativos; mismo
comportamiento estructural en los 4, verificado también para `w=828`/`w=384` en los 4 ficheros):

| Variante solicitada | `Accept` del cliente | Formato servido | Peso transferido |
|---|---|---|---|
| `w=384` (tamaño de tarjeta relacionada) | sin negociación WebP | PNG | 54 583 B |
| `w=384` | `image/webp,...` (navegador real) | **WebP** | 12 478 B |
| `w=828` (tamaño de hero real, ≈768px CSS) | sin negociación WebP | PNG | 193 057–240 674 B (4 ficheros) |
| `w=828` | `image/webp,...` | **WebP** | 45 358–50 208 B |
| `w=3840` (variante más grande del `srcset`, peor caso) | sin negociación WebP | PNG | 650 631–741 708 B |
| `w=3840` | `image/webp,...` | **WebP** | 128 210–128 568 B |

**Ninguna variante realmente servida por `/_next/image` supera 1 MB, en ningún escenario probado,
incluido el peor caso (petición del ancho más grande del `srcset` sin soporte WebP).** El
navegador de un usuario real (que sí envía `Accept: image/webp`) recibe entre ~12 KB y ~130 KB
según el tamaño solicitado — una reducción de más del 95 % respecto al fichero original.

`srcset`/`sizes` están presentes y correctamente configurados en las 4 páginas (mismo patrón ya
verificado en tareas anteriores de este ciclo). `loading`: el hero usa `priority` (carga
prioritaria, sin `lazy`, correcto); las miniaturas en `RelatedPosts.tsx` usan `loading="lazy"`
(correcto, están fuera del viewport inicial). `quality`: `q=75`, el valor por defecto de Next.js,
sin override explícito en ningún punto.

## 5. Diferenciación de pesos (qué mide realmente SE Ranking)

- **Peso del archivo original** (`/images/blog/{fichero}.png`): 2,19–2,54 MB — **confirmado
  >1 MB**, HTTP 200, servido directamente sin optimización (es un fichero estático de `public/`).
- **Peso realmente transferido al navegador para el `<img>` visible de la página**: 12 KB–130 KB
  en el caso típico (WebP negociado), hasta 742 KB en el peor caso teórico (PNG sin negociación,
  ancho máximo del `srcset`) — **nunca supera 1 MB**.
- **Peso de la imagen usada en `og:image`/`twitter:image`**: coincide con el archivo original
  (2,19–2,54 MB) — `blog/[slug]/page.tsx` asigna `post.frontmatter.image` directamente a estos
  campos, sin pasar por el optimizador de Next.js. Los crawlers de redes sociales (Facebook,
  Twitter/X, LinkedIn, WhatsApp) obtienen el fichero sin optimizar cuando generan la vista previa
  de un enlace compartido.
- **Peso del campo `image` del schema `BlogPosting`**: idéntico al original, mismo motivo.
- **No se ha detectado ninguna descarga innecesaria del original** por parte del propio sitio: el
  único punto que referencia el original sin pasar por `/_next/image` es la metadata social/schema,
  que es exactamente su función esperada (los agregadores sociales necesitan una URL directa, no
  pueden negociar formato vía `Accept` como un navegador).

**Conclusión sobre qué mide SE Ranking:** no es posible determinar con certeza qué cabecera
`Accept` ni qué URL exacta usó el rastreador de SE Ranking, pero **con independencia de eso**, el
fichero original de 2,19–2,54 MB es real, está publicado en una URL pública indexable
(`og:image`/`twitter:image`/schema), y por sí solo justifica el hallazgo — sea cual sea el método
exacto de medición de la herramienta.

## 6. Uso en hero, redes sociales y schema

Idéntico para las 4 URLs: cada imagen se usa como (a) hero visible del propio artículo, (b)
`og:image`, (c) `twitter:image`, (d) `image` del schema `BlogPosting` — las 4 referencias
consumen el mismo string de frontmatter, sin variantes por canal.

## 7. Alcance por páginas e idiomas

| Imagen | Página propia (ES) | Página propia (EN) | Reutilizada como miniatura "relacionado" en |
|---|---|---|---|
| `kakebo-vs-ynab.png` | `/blog/kakebo-vs-ynab` (indexable) | `/en/blog/kakebo-vs-ynab` (**`noindex: true`**) | `alternativas-a-app-bancarias.es.mdx` (1 página) |
| `kakebo-autonomos.png` | `/blog/metodo-kakebo-para-autonomos` (indexable) | `/en/...` (**`noindex: true`**) | `ahorro-pareja.es.mdx`, `metodo-kakebo-guia-definitiva.es.mdx` (2 páginas) |
| `libro-kakebo-pdf.png` | `/blog/libro-kakebo-pdf` (indexable) | `/en/...` (**`noindex: true`**) | `kakebo-online-guia-completa.es.mdx`, `plantilla-kakebo-excel.es.mdx` (2 páginas) |
| `ahorro-pareja.png` | `/blog/ahorro-pareja` (indexable) | `/en/...` (**`noindex: true`**) | `kakebo-sueldo-minimo.es.mdx`, `metodo-kakebo-guia-definitiva.es.mdx` (2 páginas) |

Las 4 versiones inglesas de estos artículos están marcadas `noindex: true` (verificado en su
frontmatter) — Google no las indexa, aunque el fichero sigue siendo accesible por URL directa y se
sigue cargando en esa página cuando se visita. Esto no reduce el hallazgo sobre las URLs
españolas señaladas por SE Ranking (esas sí son indexables), pero acota el alcance real: cada
imagen se sirve en 1 página indexable propia + entre 1 y 2 páginas adicionales donde aparece como
miniatura de "artículo relacionado" (a un tamaño mucho menor, `w=384`, ya verificado <55 KB).
Ningún otro artículo reutiliza el mismo fichero como su propia imagen de portada.

## 8. Clasificación de cada caso

| URL | Clasificación | Justificación |
|---|---|---|
| `/blog/ahorro-pareja` | **OPTIMIZACIÓN RECOMENDABLE** | Original más pesado (2,54 MB) de los 4; reutilizado en 2 páginas relacionadas además de la propia; sin impacto confirmado en el `<img>` visible (Next.js ya lo sirve optimizado, <1 MB en todos los casos) |
| `/blog/metodo-kakebo-para-autonomos` | **OPTIMIZACIÓN RECOMENDABLE** | 2,47 MB; reutilizado en 2 páginas relacionadas; mismo perfil de riesgo que el anterior |
| `/blog/kakebo-vs-ynab` | **OPTIMIZACIÓN RECOMENDABLE** | 2,45 MB; reutilizado en 1 página relacionada; artículo con enlazado interno reforzado recientemente (`SEO-ONPAGE-ALTERNATIVAS-FINTONIC-*`), por lo que su og:image pesado puede afectar a más comparticiones de lo habitual |
| `/blog/libro-kakebo-pdf` | **OPTIMIZACIÓN RECOMENDABLE** | Original más ligero de los 4 (2,19 MB, aun así muy por encima de 1 MB); reutilizado en 2 páginas relacionadas |

**Ninguno de los 4 casos es un falso positivo** — el fichero original >1 MB es real y
verificable en las 4 URLs. Pero **ninguno se clasifica como "OPTIMIZACIÓN NECESARIA"** en sentido
estricto/urgente, porque no se ha detectado ningún impacto confirmado en el rendimiento real de la
página vista por un usuario (Core Web Vitals): Next.js Image Optimization ya sirve una variante
correctamente dimensionada y negociada por formato en el `<img>` real, siempre por debajo de 1 MB
incluso en el peor escenario probado. El impacto real y confirmado se limita a la metadata social
y al schema, que sí sirven el fichero sin optimizar.

## 9. Riesgo SEO, rendimiento y UX

- **Rendimiento de la página (Core Web Vitals, LCP):** riesgo **bajo/no confirmado**. El hero usa
  `priority` y un `sizes` correcto; el peso realmente transferido nunca supera ~130 KB en un
  navegador moderno típico. No se ha medido ninguna regresión de LCP atribuible a estas imágenes.
- **Compartición social (previews de Facebook/Twitter/LinkedIn/WhatsApp):** riesgo **medio**. Los
  crawlers de estas plataformas descargan el fichero `og:image` sin pasar por el optimizador de
  Next.js, es decir, descargan 2,19–2,54 MB reales. La mayoría de plataformas aceptan imágenes de
  ese tamaño (los límites habituales rondan 5–8 MB), por lo que no se prevé un fallo de vista
  previa, pero sí una generación más lenta y un consumo de ancho de banda innecesario en el
  extremo del crawler social.
- **Higiene de assets / auditorías externas:** riesgo **medio**. Herramientas como SE Ranking
  seguirán marcando estas URLs mientras el fichero original exceda 1 MB, con independencia de que
  el usuario final no note impacto — esto es un coste reputacional/de auditoría, no de UX directa.
- **UX visual:** sin riesgo — las imágenes se muestran correctamente, sin deformación, con
  dimensiones apropiadas a su contenedor.

## 10. Orden de prioridad

Ordenado por peso transferido (del original, ya que es el único punto con impacto real confirmado)
y frecuencia de uso; los 4 casos comparten el mismo impacto visual (ninguno), el mismo riesgo de
pérdida de calidad al comprimir (bajo, dado el margen enorme entre 2+ MB y un JPEG/WebP bien
comprimido a esa resolución) y la misma facilidad de corrección (cambio de 1 solo fichero, sin
tocar código):

1. **`ahorro-pareja.png`** (2,54 MB; 1 página propia + 2 relacionadas) — mayor peso y mayor
   reutilización combinados.
2. **`metodo-kakebo-para-autonomos` → `kakebo-autonomos.png`** (2,47 MB; 1 + 2 páginas).
3. **`kakebo-vs-ynab.png`** (2,45 MB; 1 + 1 páginas, pero en un artículo con enlazado interno
   reforzado recientemente, lo que aumenta su visibilidad de compartición).
4. **`libro-kakebo-pdf.png`** (2,19 MB; 1 + 2 páginas) — el más ligero de los 4, aunque sigue muy
   por encima del umbral de 1 MB.

## 11. Primera corrección recomendada (propuesta, NO ejecutada)

**`SEO-PERF-LARGE-IMAGES-FIX-AHORRO-PAREJA-01`** — alcance atómico: comprimir/reexportar
únicamente `public/images/blog/ahorro-pareja.png` (el caso de mayor prioridad según la sección
10) a un peso muy inferior a 1 MB manteniendo resolución y calidad visual equivalentes (p. ej.
reexportar como PNG optimizado o WebP de alta calidad, sin cambiar el nombre de fichero ni el
campo `image` del frontmatter, que ya referencia la ruta correcta). Al no requerir ningún cambio
de código, frontmatter, componente ni configuración — solo sustituir el binario del asset — es la
corrección de menor riesgo y mayor rapidez de las 4.

**Los otros 3 casos (`kakebo-autonomos.png`, `kakebo-vs-ynab.png`, `libro-kakebo-pdf.png`)
requerirían tareas atómicas independientes**, una por imagen, siguiendo el mismo patrón — no se
recomienda combinarlas en una sola tarea, ya que cada una es un binario distinto con su propio
riesgo de regresión visual que conviene validar de forma aislada (tal y como exige esta tarea:
"no mezclar las cuatro optimizaciones en una futura tarea si requieren tratamientos diferentes").
Aunque el tratamiento técnico es idéntico en los 4 casos (mismo formato origen, mismo mecanismo de
entrega), se recomienda no agruparlas para poder revertir o repriorizar cualquiera de forma
independiente sin afectar a las demás.

## 12. Elementos descartados / fuera de alcance de esta validación

- No se ha comprimido, reexportado ni sustituido ningún fichero de imagen.
- No se ha modificado ningún frontmatter, componente (`blog/[slug]/page.tsx`,
  `RelatedPosts.tsx`), ni `next.config.ts`.
- No se ha auditado el resto de imágenes del blog más allá de las 4 URLs señaladas por SE Ranking.
- No se ha evaluado si conviene migrar el formato de origen de PNG a WebP/AVIF a nivel de
  proyecto — eso sería una decisión de arquitectura de assets más amplia, fuera del alcance
  quirúrgico de esta validación.
- No se ha modificado ningún otro hallazgo de la auditoría SE Ranking del 28/07/2026.

## STOP de implementación

**Esta tarea es exclusivamente de diagnóstico.** No se ha comprimido ninguna imagen, no se ha
sustituido ningún asset, no se ha modificado contenido, componentes ni configuración. La
corrección propuesta en la sección 11 queda documentada pero **no ejecutada**. No se inicia
ninguna otra tarea.
