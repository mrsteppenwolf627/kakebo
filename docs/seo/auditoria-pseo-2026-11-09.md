# Auditoría pSEO — vivienda por provincia (2026-11-09)

## Alcance y método

- **Alcance:** `/ahorro-entrada-vivienda/[provincia]`, 12 páginas piloto más el índice `/ahorro-entrada-vivienda`.
- **Método:** código fuente y HTML prerenderizado del build local. Sin peticiones HTTP en vivo, sin Rich Results Test y sin Google Search Console.
- **Métrica de unicidad:** propia (shingles de 5 palabras sobre el texto de `<main>`). Sus umbrales no son cifras de Google.

## Thin content

- 699–716 palabras por página.
- El 67–68 % de los shingles es idéntico en las 12 páginas.
- Similitud de Jaccard por pares: 0,52–0,55 (media 0,54).
- Entre 6 y 11 palabras exclusivas por página frente a las otras 11.
- Lo que varía es solo el nombre de la provincia y cifras derivadas de un único dato (`valorM2` × constantes).

## Rastreo

- `dynamicParams = false` en la ruta de provincia, en el índice y en plantillas.
- `generateStaticParams` genera solo las 12 provincias con `piloto: true`.
- `prerender-manifest` con `fallback: false`.
- No existe ruta `/en/` de vivienda ni URLs `/en/ahorro...` en el sitemap.

## Metadatos

- Título único, canonical absoluta sin parámetros, hreflang `es` + `x-default`, og/twitter absolutos en las 12 páginas.
- Descripciones de 160–167 caracteres: al límite y sin cuota mensual concreta.

## Schema (JSON-LD)

- 48/48 preguntas y respuestas del FAQ presentes en el texto visible.
- Fecha, cobertura y Dataset coinciden con lo visible.
- **Discrepancia detectada y corregida (commit `61e80d6`):** la última miga del JSON-LD no coincidía con la visible.

## Pendiente tras la medición de 2 semanas (≈ 2026-11-20) — NO aplicado

- Puerta de calidad por provincia en `lib/vivienda.ts`.
- Descripción con cuota mensual a 10 años.
- Script de control de unicidad en CI.
- Datos de enriquecimiento: variación interanual, serie histórica, provincias vecinas. Datos externos solo con fuente primaria, fecha y licencia verificadas.
