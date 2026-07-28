# UI-CALCULADORA-AHORRO-FOOTER-DUPLICATE-01 — Cierre

**Fecha:** 2026-07-28
**Modelo:** Claude Code
**Estado:** ✅ Completado
**URL afectada:** `https://www.metodokakebo.com/herramientas/calculadora-ahorro`

## Causa raíz

`src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx` importaba y renderizaba
`<Footer />` directamente dentro de su propio `<main>`, además del `<Footer />` global que ya
renderiza `src/app/[locale]/layout.tsx` (layout raíz para todas las rutas bajo `[locale]`). El
layout local de la ruta (`.../calculadora-ahorro/layout.tsx`) es un simple passthrough
(`<>{children}</>`) y no era la causa. Resultado: dos instancias completas del footer apiladas
al final de la página.

## Cambio aplicado

Archivo modificado: `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx`
- Eliminado el import `import { Footer } from "@/components/landing/Footer";`
- Eliminado el render `<Footer />` al final del `<main>`

Se conserva intacto el footer global renderizado por `src/app/[locale]/layout.tsx`. No se tocó
`Navbar`, metadata, schema, la calculadora ni ningún otro bloque de la página.

## Validación

- `npm run build` → PASS
- `npm run lint` → 0 errores (76 warnings preexistentes, sin cambios)
- `npm test` → 585/586 (1 fallo preexistente y ajeno en `calculate-whatif.test.ts`, documentado ya en `PROJECT_STATUS.md`, no relacionado con este fix)
- Servidor de producción local (`npm run start`) + `curl` + recuento de `<footer>` en el HTML:
  - `/` → 1 footer
  - `/herramientas/calculadora-ahorro` → 1 footer (antes: 2) ✅ corregido
  - `/herramientas/calculadora-inflacion` → 1 footer (control, sin cambios)

## Hallazgo adicional (fuera de alcance, no corregido en esta tarea)

Se detectó el mismo patrón de footer duplicado (import directo de `Footer` en la página +
`Footer` global del layout raíz) en otras páginas públicas, preexistente y no introducido por
este cambio:
- `src/app/[locale]/(public)/blog/page.tsx`
- `src/app/[locale]/(public)/blog/[slug]/page.tsx`
- `src/app/[locale]/(public)/herramientas/page.tsx`
- `src/app/[locale]/(public)/tutorial/page.tsx`
- `src/app/[locale]/(landing)/herramientas/regla-50-30-20/page.tsx`

Confirmado por conteo de `<footer>` en HTML servido: `/blog`, un artículo de blog (`/blog/kakebo-online-gratis`), `/tutorial`, `/herramientas` y `/herramientas/regla-50-30-20` muestran 2 footers cada uno. Por alcance estricto de esta tarea (única URL: calculadora-ahorro) no se ha tocado ningún otro archivo. Se recomienda abrir una tarea de seguimiento (p. ej. `UI-FOOTER-DUPLICATE-GLOBAL-01`) para auditar y corregir todas las páginas afectadas.
