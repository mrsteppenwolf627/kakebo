# Verificación global en producción — JSON-LD, caché/CDN y sameAs

Despliegue: dpl_DxLMUb7TMempSZoPxbtPyyWSrj6G (commit eb0ed6b, rama main) · https://www.metodokakebo.com · solo lectura (GET, concurrencia 4, 250 ms entre peticiones).

## 1. URLs

- **71 URLs** comprobadas en la pasada automática: 62 del sitemap.xml (un único sitemap, sin anidados) + 9 añadidas (los artículos EN noindex de la lista, /en, /en/blog y las rutas de herramientas ES/EN que no estaban en el sitemap).
- **+1 comprobada a mano**: /en/blog/regla-30-dias (ver hallazgo H3).

## 2. Resumen por comprobación (sobre 71 URLs)

| Comprobación | OK | Hallazgos |
|---|---|---|
| HTTP 200 sin redirección | 71 | 0 |
| Caché 2ª petición HIT/PRERENDER | 71 | 0 |
| Contenido 1ª = 2ª | 71 | 0 |
| canonical = URL propia | 71 | 0 |
| robots según política | 71 | 0 |
| Exactamente 1 script ld+json | 63 | 8 |
| JSON-LD parsea | 63 | 8 |
| Raíz con @graph | 71 | 0 |
| Sin @id colgantes | 71 | 0 |
| Sin imágenes relativas | 71 | 0 |
| Sin aggregateRating/review | 71 | 0 |
| FAQ visible en el HTML | 71 | 0 |
| inLanguage coherente | 71 | 0 |
| JSON-LD = captura previa (36 comparables) | 71 | 0 |

Caché (x-vercel-cache, 1ª → 2ª petición): HIT → HIT: 39 · PRERENDER → HIT: 32. Ninguna MISS/STALE. cache-control típico: public, max-age=0, must-revalidate.

## 3. Hallazgos

### H1. Páginas sin JSON-LD (8)

| URL | Comprobación | Observado | Esperado |
|---|---|---|---|
| https://www.metodokakebo.com/cookies | scripts ld+json | 0 | 1 |
| https://www.metodokakebo.com/en/cookies | scripts ld+json | 0 | 1 |
| https://www.metodokakebo.com/en/privacy | scripts ld+json | 0 | 1 |
| https://www.metodokakebo.com/en/terms | scripts ld+json | 0 | 1 |
| https://www.metodokakebo.com/en/tutorial | scripts ld+json | 0 | 1 |
| https://www.metodokakebo.com/privacy | scripts ld+json | 0 | 1 |
| https://www.metodokakebo.com/terms | scripts ld+json | 0 | 1 |
| https://www.metodokakebo.com/tutorial | scripts ld+json | 0 | 1 |

(El "JSON-LD no parsea" de esas mismas 8 URLs es el mismo hallazgo: no hay script que parsear.) **No es una regresión**: /tutorial, /privacy, /terms y /cookies (ES y EN) nunca emitieron JSON-LD ni antes ni después de la migración; quedaron fuera del alcance de la auditoría (que cubría 12 rutas). Decisión pendiente: dejarlas sin datos estructurados o añadir WebPage mínimo.

### H2. Perfiles de X: retirados (no son del propietario)

En la pasada de verificación se declaraban dos perfiles de X como `sameAs` (respondían 404 a un cliente sin sesión). Después se confirmó que **no pertenecen al propietario** y se eliminaron del código y de producción (ver README). Siguen sin comprobar solo por tratarse de datos falsos, no por el bloqueo a bots. github.com/mrsteppenwolf627 responde 200.

### H3. Lista de artículos EN noindex: son 10, no 9

La lista de la petición tiene 9, pero 10 artículos EN tienen noindex: true en el frontmatter; el décimo es **/en/blog/regla-30-dias** (no está en el sitemap ni en la lista). Comprobado a mano: HTTP 200, x-vercel-cache HIT, robots "noindex, nofollow", canonical propia, 1 script ld+json. Es coherente con su frontmatter; solo la lista esperada estaba incompleta. (Corrige también mi cifra del informe anterior, que dio 8.)

### Otros

- Ninguna URL del sitemap redirige ni devuelve 4xx/5xx. Ninguna diferencia de contenido entre la 1ª y la 2ª petición.
- Las 36 URLs con captura previa (de las 37 de la verificación anterior, la 37ª es /en/blog/regla-30-dias, que no está en el sitemap) tienen JSON-LD idéntico byte a byte.
- /en/herramientas/regla-50-30-20 declara inLanguage "es" (excepción documentada) y se tomó como correcta.

## 4. sameAs

| Tipo | URL | Resultado | Observado |
|---|---|---|---|
| wikipedia | https://en.wikipedia.org/wiki/Kakeibo | OK | HTTP 200 |
| wikipedia | https://en.wikipedia.org/wiki/Motoko_Hani | OK | HTTP 200 |
| wikipedia | https://en.wikipedia.org/wiki/Personal_budget | OK | HTTP 200 |
| wikipedia | https://en.wikipedia.org/wiki/Personal_finance | OK | HTTP 200 |
| wikipedia | https://en.wikipedia.org/wiki/Zero-based_budgeting | OK | HTTP 200 |
| wikipedia | https://es.wikipedia.org/wiki/Finanzas_personales | OK | HTTP 200 |
| wikipedia | https://es.wikipedia.org/wiki/Kakeibo | OK | HTTP 200 |
| wikipedia | https://es.wikipedia.org/wiki/Presupuesto_base_cero | OK | HTTP 200 |
| red | https://github.com/mrsteppenwolf627 | OK | HTTP 200 |
| wikidata | https://www.wikidata.org/wiki/Q11272 | OK | en: Microsoft Excel · es: - |
| wikidata | https://www.wikidata.org/wiki/Q180687 | OK | en: consumer price index · es: IPC |
| wikidata | https://www.wikidata.org/wiki/Q191900 | OK | en: zero-based budgeting · es: presupuesto base cero |
| wikidata | https://www.wikidata.org/wiki/Q253613 | OK | en: personal finance · es: finanzas personales |
| wikidata | https://www.wikidata.org/wiki/Q271969 | OK | en: purchasing power · es: poder adquisitivo |
| wikidata | https://www.wikidata.org/wiki/Q29 | OK (no declarado en ningún grafo) | en: Spain · es: España |
| wikidata | https://www.wikidata.org/wiki/Q319622 | OK | en: saving · es: Ahorro |
| wikidata | https://www.wikidata.org/wiki/Q3525860 | OK | en: personal budget · es: presupuesto personal |
| wikidata | https://www.wikidata.org/wiki/Q35865 | OK | en: inflation · es: inflación |
| wikidata | https://www.wikidata.org/wiki/Q388197 | OK | en: housekeeping book · es: Kakeibo |
| red | (dos perfiles de X) | retirados | no pertenecen al propietario; eliminados del `sameAs` tras esta verificación |

Los 9 identificadores Wikidata declarados existen y su etiqueta corresponde a la entidad (Q388197 aparece en inglés como "housekeeping book" y en español como "Kakeibo"; su descripción es "Japanese method of money management"). Las 8 URLs de Wikipedia responden 200.

## 5. Veredicto de Q29

- **Q29 = Spain / España**: existe en Wikidata y su etiqueta es correcta (en: "Spain", es: "España").
- **Dónde aparece en src/**: solo en src/lib/seo/jsonld.ts (líneas 139-140, entidad `spain`). Lo referencian además scripts/generar-ejemplos.mts (ejemplo de vivienda).
- **El grafo de vivienda en producción NO la usa**: ninguna página de src/app ni de src/components importa la entidad `spain`, y Q29 no sale en ninguno de los grafos recogidos (la columna "no declarado" lo confirma). Es código disponible pero sin uso en páginas.
- El comentario de jsonld.ts ("no re-verificado") está desactualizado: queda verificado hoy.
