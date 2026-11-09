# JSON-LD — documentación de la auditoría (2026-11-09)

| Archivo | Contenido |
|---|---|
| `informe-semantico-jsonld.md` | Auditoría original de la capa semántica y mapa de tipos por página |
| `verificacion-global.md` | Verificación en producción de las 71 URLs (caché/CDN, JSON-LD, sameAs, Q29) |
| `informe-jsonld-4.md` | Fechas ISO 8601 con zona, avisos no críticos del Rich Results Test y limpieza |

## Artículos EN con noindex

Son **10** los artículos en inglés con `noindex: true` en el frontmatter (no 9). Salen con `robots: noindex, nofollow`, no están en el sitemap y siguen sirviéndose con JSON-LD:

`ahorro-pareja`, `alternativas-a-app-bancarias`, `kakebo-online-gratis`, `kakebo-online-guia-completa`, `kakebo-sueldo-minimo`, `kakebo-vs-ynab`, `libro-kakebo-pdf`, `metodo-kakebo-para-autonomos`, `peligros-apps-ahorro-automatico` y **`regla-30-dias`** (este último es el que faltaba en la lista de 9).

Todos bajo `/en/blog/<slug>`. La fuente de verdad es el frontmatter (`noindex: true` en `src/content/blog/<slug>.en.mdx`); `sitemap.ts` y `generateMetadata` lo leen del mismo sitio.

## Páginas sin JSON-LD (a propósito)

`/tutorial`, `/privacy`, `/terms` y `/cookies` (ES y EN) no emiten JSON-LD ni lo han hecho nunca.
