# Audit del JSON-LD frente a lo visible — modo estricto (2026-11-11)

Script manual y de solo lectura. **No forma parte de `npm run validate` ni de CI.**

## Cómo ejecutarlo

```bash
npm run build                                   # el audit lee .next/server/app
node scripts/audit-jsonld-visible.mjs --tabla --out=audit-estricto.json
# opciones: [directorio] --vocab=<schemaorg.jsonld> --json --tabla
```

Sale con código 1 solo por fallos estructurales (JSON-LD roto, `@id` colgantes, URL del sitemap sin HTML). Los «no visibles» se informan, no hacen fallar el script.

## Qué comprueba (scripts/lib/visible-estricto.mjs)

| Nodo | Dónde debe estar el texto |
|---|---|
| `BreadcrumbList` → cada `ListItem.name` | Un `<li>` de un `<nav aria-label="Migas de pan" o "Breadcrumb">`, carácter a carácter; el último, además, con `aria-current="page"`. Sin `<nav>` de miga, ningún item cuenta como visible. |
| `FAQPage` → `Question.name`, `Answer.text` | Bloque de FAQ: `<details>`, `<section aria-labelledby>` con encabezado de FAQ, contenedor con id `faq` (acordeón) o lo que sigue a un encabezado «Preguntas frecuentes». La respuesta debe aparecer tras su pregunta. Se ignoran los espacios; se respetan mayúsculas. |
| `HowTo.name` | Un encabezado h1–h6 con exactamente ese texto. |
| `HowToStep.name` / `.text` | Elemento con ese texto exacto / contenido en un li, p o encabezado. |
| `ItemList` → `ListItem.name` | Enlace, encabezado o li con ese texto (exacto; «parcial» si solo está contenido en un enlace o encabezado). |
| `WebApplication.name` / `featureList` | Encabezado con ese nombre / elemento o li visible. |

Siempre se excluyen: `<script>`, `<style>`, `<noscript>`, `<template>`, `<svg>`, comentarios, la cabecera global (`<header class="fixed …">`), el pie global (`<footer class="… border-t …">`), los nodos `aria-hidden="true"` y los diálogos. El banner de cookies es solo de cliente y no está en el HTML servido.

## Cómo leer el resumen

- **filas** = una por página y nodo; **páginasAfectadas** = páginas distintas con al menos un fallo; **nombresUnicos** = combinaciones `tipo.propiedad|valor` distintas. Son tres cifras distintas: etiquétalas siempre.
- `falsosVisiblesDeLaSubcadena` son las filas que la comprobación antigua (subcadena en todo el texto de la página) daba por visibles y la estricta no. La sección `noVisibles*` heredada sigue siendo la de subcadena y es solo informativa.
- **Criterio aprobado (2026-11-11): una respuesta colapsada, accesible por interacción, cuenta como visible.** Es el caso del FAQ de la home (`section#faq`, 5 preguntas): las respuestas están en el DOM con `max-h-0 opacity-0` y se revelan al hacer clic. Ni `display:none` ni `hidden`, así que tampoco están ocultas a los lectores de pantalla. El audit estricto sigue pasando sus 5 preguntas y 5 respuestas sin cambios.
- **Mejora de accesibilidad pendiente (no implementada):** los `<button>` de ese acordeón (`src/components/landing/FAQ.tsx`) no llevan `aria-expanded` ni `aria-controls`, y los paneles de respuesta no tienen `id`.

## Excepción documentada: nombre de producto de la home

`WebApplication.name` debe ser, en general, un encabezado visible. **Excepción (aprobada 2026-11-11, solo `/` y `/en`):** se acepta aunque no sea un encabezado si es el nombre de producto con el que empieza el `<title>` de la home (separado por un carácter que no sea letra ni número). Hoy: «Kakebo AI», que abre «Kakebo AI | App Gratis del Método Kakebo» (ES) y «Kakebo AI: Free Online Kakeibo App…» (EN). La fila del informe lo indica en la columna «dónde». En ninguna otra página se aplica; en las herramientas el nombre debe ser su h1.

Tests: `src/__tests__/seo/audit-visible-estricto.test.ts` (sección «excepción de la home»).

## Limitaciones

- No ejecuta JavaScript: audita el HTML prerenderizado.
- Las descripciones (`description`), fechas y precios siguen comprobándose por subcadena global; no tienen un bloque propio que se pueda exigir.
- El analizador de HTML es mínimo y está pensado para el HTML que genera Next.js; no es un parser completo.
- Tests con fixtures: `src/__tests__/seo/audit-visible-estricto.test.ts`.
