# Línea base técnica de SEO — 2026-11-11

Fotografía del HTML prerenderizado de `main` en `4186f5d` (más el cambio de accesibilidad del FAQ, que no toca JSON-LD), para comparar en el futuro. Solo contiene HTML público; sin datos sensibles.

| Archivo | Contenido |
|---|---|
| `conteos.json` | 94 HTML en el build, 64 con JSON-LD, 62 URL en el sitemap, 54 con miga visible |
| `audit-estricto.json` / `audit-estricto-tabla.txt` | Salida completa del audit estricto (una fila por página y nodo; ver `../../AUDIT_JSONLD_VISIBLE_ESTRICTO.md`) |
| `migas-visibles.txt` | URL con un `<nav aria-label="Migas de pan"\|"Breadcrumb">` en el HTML (incluye las 13 de vivienda y las 25 de clúster) |
| `jsonld-sha256.txt` | `sha256  url` del JSON-LD de cada página con JSON-LD |

## Regenerarla y compararla

```bash
npm run build
node scripts/seo-baseline.mjs docs/seo/baselines/AAAA-MM-DD
diff docs/seo/baselines/2026-11-11/jsonld-sha256.txt docs/seo/baselines/AAAA-MM-DD/jsonld-sha256.txt
```

Una línea distinta en `jsonld-sha256.txt` es una página cuyo JSON-LD cambió. El build local puede diferir del de producción en metadatos que dependen del entorno (p. ej. `robots` si falta `NEXT_PUBLIC_APP_URL`); compara siempre builds hechos con el mismo entorno.
