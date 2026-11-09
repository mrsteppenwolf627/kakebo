# Informe JSON-LD 4 — fechas ISO 8601, avisos no críticos y limpieza

Fecha: 2026-11-09 · Commit de código: `4ea62f4` (rama `main`) · Despliegue: `dpl_8oMDfDbdvpuKwxZFtHDgyEAAH7fr` (`kakebo-leohl9488-aitors-projects-b90cd59c.vercel.app`), estado READY, alias `www.metodokakebo.com` y `metodokakebo.com`.

## 1. Cambios por archivo

| Archivo | Cambio |
|---|---|
| `src/lib/seo/jsonld.ts` | `isoMadrid()`: normaliza `datePublished`/`dateModified`/`dateCreated` a ISO 8601 con zona Europe/Madrid, calculando el offset real de cada fecha. Se aplica en **un único punto** (`stripUndefined`, que usa `graph()` para todos los nodos), así que cubre `blogPost`, `webPage`, `digitalDocument` y cualquier nodo futuro. Fechas que ya traen hora y zona (`Z` o `±hh:mm`) se respetan; hora sin zona recibe la de Madrid; otros formatos no se tocan. `quarterInterval()`: «N.º trimestre de AAAA» → intervalo ISO. `dataset()` acepta `temporalCoverage` y `distribution`. Comentario de Q29 corregido (verificada como Spain/España; sin tocar el valor). |
| `src/app/[locale]/(public)/ahorro-entrada-vivienda/[provincia]/page.tsx` | Pasa al Dataset el periodo (`meta.periodo`) y la descarga (`meta.url`, solo si es `.xls`). |
| `src/__tests__/seo/jsonld-fechas.test.ts` (nuevo) | Offsets de invierno/verano, días de cambio horario (2026-03-29 → +01:00, 2026-10-25 → +02:00), respeto de fechas con zona, normalización en `graph()`, `quarterInterval()` y `dataset()`. |
| `src/__tests__/seo/jsonld-semantico.test.tsx` | Todas las fechas de las rutas públicas y de los 33 artículos (18 ES + 15 EN) llevan zona; fechas exactas de un artículo; Dataset con periodo y descarga visibles; sin campos sin respaldo en producto premium ni en la calculadora de inflación. |
| `docs/seo/jsonld-2026-11-09/README.md` (nuevo) | Índice y aclaración: son **10** los artículos EN con noindex por frontmatter, incluido `/en/blog/regla-30-dias`. |

No se modificó ningún frontmatter ni `/privacy`, `/terms`, `/cookies`, `/tutorial`, ni `@id`, estructura del `@graph` o `sameAs`.

## 2. Avisos no críticos del Rich Results Test

Revisado el JSON-LD servido en producción antes del cambio.

### Campos añadidos

| URL | Campo | Valor | Respaldo visible |
|---|---|---|---|
| `/ahorro-entrada-vivienda/madrid` (Dataset) | `temporalCoverage` | `2026-04-01/2026-06-30` | «2.º trimestre de 2026» aparece en la página (verificado en el HTML servido) |
| `/ahorro-entrada-vivienda/madrid` (Dataset) | `distribution` (`DataDownload`, `application/vnd.ms-excel`) | `https://apps.fomento.gob.es/BoletinOnline2/sedal/35101000.XLS` | Enlace «Fuente» a esa URL visible en la página (verificado); el formato es el de la extensión `.XLS` |

El mismo Dataset se emite en las 12 páginas de provincia del piloto con su propio periodo y enlace.

### Campos descartados («aviso aceptado: sin dato»)

| URL / tipo | Campo | Motivo |
|---|---|---|
| Dataset | `license` | El `avisoLegalUrl` del Ministerio existe en los datos pero no se muestra en la página; declararlo como licencia sería una afirmación sin respaldo visible. |
| Dataset | `spatialCoverage` en el Dataset | La hoja de la fuente cubre todas las provincias; la página solo declara Madrid en el `WebPage` (ya existente). No se amplía. |
| Product premium | `shippingDetails` | La página dice «descarga digital inmediata» y «No se envía nada físico», pero el marcado exige país de destino y la página no indica países. |
| Product premium | `hasMerchantReturnPolicy` | La página y `/terms` explican el desistimiento de 14 días y su pérdida con el consentimiento en la descarga inmediata, pero el marcado exige `applicableCountry` y no figura. Declararla simplificaría una política legal; no se añade. |
| Product premium | `priceValidUntil`, `sku`, `gtin`, `itemCondition` | No existen: ni en la configuración del sitio ni en la página. |
| Product premium | `brand` | Ya está declarado (referencia a `#organization`). |
| WebApplication (inflación) | `aggregateRating`, `review` | No hay valoraciones reales (regla del proyecto: no se añaden). |
| WebApplication (inflación) | `screenshot`, `softwareVersion` | No hay capturas ni versionado publicados. |

## 3. Validación local

- `tsc` sin errores. `npm run build` (con `NEXT_PUBLIC_APP_URL` de producción) exit 0. Lint: 1 error preexistente (`NewsletterConfirmationNotice.tsx:34`), sin warnings nuevos.
- `npm test`: 10 fallos en los mismos 6 archivos de la línea base, ninguno nuevo; 2650 tests en total, con los nuevos en verde.
- Validador sobre el build local (`next start`) de **72 URLs** (62 del sitemap + 10 artículos EN noindex y rutas de herramientas no incluidas en el sitemap): 72/72 sin hallazgos (un único script, `@graph`, sin `@id` colgantes, sin imágenes relativas, sin rating/review, FAQ visibles, `inLanguage` coherente, fechas con zona). `graph()` lanza error si hay referencias colgantes.
- Nota: la verificación anterior hablaba de 71 URLs; la lista correcta es de 72 porque `/en/blog/regla-30-dias` (noindex, fuera del sitemap) se había quedado fuera.

## 4. Despliegue

- Push `eb0ed6b..4ea62f4` a `main` (sin force). El push disparó el despliegue de producción automático: sin pasos manuales.
- `dpl_8oMDfDbdvpuKwxZFtHDgyEAAH7fr`: READY, commit `4ea62f4`, rama `main`, alias `www.metodokakebo.com` y `metodokakebo.com`.
- `main` local (`C:/kk-prod`) y `origin/main` sincronizadas en `4ea62f4`.

## 5. Verificación posterior en producción

- **72/72 URLs** con HTTP 200 y 0 hallazgos. Caché: 1ª → 2ª petición `PRERENDER → HIT` (56) y `HIT → HIT` (16); **0 MISS/STALE**.
- **JSON-LD**: 48 páginas cambiadas, todas las que emiten fechas: 33 artículos (18 ES + 15 EN), 13 de vivienda (hub + 12 provincias; las 12 provincias llevan además `temporalCoverage` y `distribution` en su Dataset) y 2 plantillas imprimibles. 24 sin cambios: home y /en, índices, herramientas ES/EN, sobre-nosotros ES/EN y las 8 páginas sin JSON-LD.
- **Fechas con zona en el HTML servido**:
  - Artículo ES `alternativas-a-app-bancarias`: `datePublished=2026-01-13T00:00:00+01:00`, `dateModified=2026-07-20T00:00:00+02:00`.
  - Artículo EN `plantilla-kakebo-excel`: `2026-01-27T00:00:00+01:00` / `2026-10-08T00:00:00+02:00`.
  - Vivienda `madrid`: `dateModified=2026-11-06T00:00:00+01:00`.
  - **Home (ES y EN) y plantilla premium: no emiten `datePublished` ni `dateModified`** (nunca los tuvieron y no hay fecha visible), así que no hay nada que normalizar ahí. No se ha inventado ninguna.
- **Páginas no tocadas** (`/sobre-nosotros` ES y EN, `/privacy`, `/terms`, `/cookies`, `/tutorial` ES y EN): JSON-LD **byte a byte idéntico** (10/10; las 8 últimas siguen sin script). El HTML completo es idéntico (10/10) una vez descartados los identificadores de build y los nombres de los chunks JS, que cambian en cada despliegue (un `diff` crudo siempre difiere).
