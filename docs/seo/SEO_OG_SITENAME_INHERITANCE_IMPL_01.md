# SEO_OG_SITENAME_INHERITANCE_IMPL_01 — Implementación de og:site_name explícito

**Fecha:** 2026-07-09
**Tarea:** SEO-OG-SITENAME-INHERITANCE-IMPL-01
**Tipo:** Corrección técnica de metadata — cambio atómico
**Commit de referencia (HEAD antes de esta tarea):** `f3527ad`

---

## 1. Problema corregido

`SEO-OG-SITENAME-INHERITANCE-AUDIT-01` (`docs/seo/SEO_OG_SITENAME_INHERITANCE_AUDIT_01.md`) confirmó que 6 de 9 páginas públicas auditadas no emitían `<meta property="og:site_name">` porque su bloque `openGraph` propio (definido en `generateMetadata`) reemplaza por completo el `openGraph` de `layout.tsx` en lugar de fusionarse con él — comportamiento documentado de Next.js Metadata API. Esta tarea implementa la corrección recomendada por esa auditoría.

## 2. Páginas corregidas (6)

| Página | Archivo |
|---|---|
| `/` (Home) | `src/app/[locale]/(public)/page.tsx` |
| `/sobre-nosotros` | `src/app/[locale]/(public)/sobre-nosotros/page.tsx` |
| `/blog/[slug]` (todos los artículos indexables) | `src/app/[locale]/(public)/blog/[slug]/page.tsx` |
| `/herramientas/calculadora-ahorro` | `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx` |
| `/herramientas/regla-50-30-20` | `src/app/[locale]/(landing)/herramientas/regla-50-30-20/page.tsx` |
| `/tutorial` | `src/app/[locale]/(public)/tutorial/page.tsx` |

En cada archivo se añadió una única línea dentro del objeto `openGraph` ya existente:

```ts
siteName: "MetodoKakebo.com",
```

No se modificó ningún otro campo: `title`, `description`, `type`, `url`, `images` y el resto de la metadata (incluidos `alternates.canonical`, `alternates.languages`, `robots`) quedan exactamente igual que antes.

## 3. Archivos modificados

1. `src/app/[locale]/(public)/page.tsx`
2. `src/app/[locale]/(public)/sobre-nosotros/page.tsx`
3. `src/app/[locale]/(public)/blog/[slug]/page.tsx`
4. `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx`
5. `src/app/[locale]/(landing)/herramientas/regla-50-30-20/page.tsx`
6. `src/app/[locale]/(public)/tutorial/page.tsx`

**6 archivos, 1 línea cada uno.**

## 4. Decisión sobre constante compartida

Se buscó en el repositorio una constante existente (`SITE_NAME`, `SITE_URL`, `siteConfig`, archivo de configuración de metadata) — no se encontró ninguna. Se optó por **repetir el literal `"MetodoKakebo.com"` localmente en cada archivo**, en lugar de crear una constante compartida (`src/lib/seo/constants.ts` u otra ubicación), por los siguientes motivos:

- Es exactamente el mismo patrón que ya usa la página de referencia correcta (`calculadora-inflacion/page.tsx`), que define `siteName: "MetodoKakebo.com"` como literal — mantener consistencia de patrón con el único ejemplo ya validado en producción.
- Crear una constante añade un archivo nuevo y una importación en cada uno de los 6 archivos afectados (7 archivos tocados en vez de 6), sin reducir el riesgo real: el valor no cambia con frecuencia (es la razón social del sitio) y ya se demostró en `SEO-SITENAME-UNIFY-01` que el problema real no era "el valor cambia", sino "un desarrollador escribió el valor equivocado una vez" — algo que una constante no habría evitado si esa constante en sí se hubiera definido mal.
- Las restricciones explícitas de esta tarea autorizan esta decisión: *"Si crear constante implica tocar muchos archivos, NO hacerlo. Repetir siteName localmente es aceptable en esta tarea."*

Esta decisión no descarta una futura extracción a constante si el proyecto introduce más puntos con `siteName` — se deja como nota abierta, no como tarea pendiente formal.

## 5. Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| `npm run build` | ✅ Compilación exitosa, todas las rutas generadas sin error |
| `npm run lint` | ✅ 0 errores, 76 warnings preexistentes (ninguno en los archivos modificados) |
| `npx tsc --noEmit` | ✅ 0 errores de tipado |
| Render local (`npm run dev`) — comprobación de `og:site_name` | ✅ Ver tabla siguiente |
| Render local — `title`, `canonical`, H1 sin alterar | ✅ Confirmado en las 6 rutas |
| Render local — páginas no tocadas (`/blog`, `/herramientas`, `calculadora-inflacion`) | ✅ Siguen mostrando `og:site_name: "MetodoKakebo.com"` correctamente, sin regresión |
| Render local — JSON-LD `Person`/`Organization` en `/sobre-nosotros` | ✅ Sin cambios (`"Aitor Alarcón"` / `"MetodoKakebo.com"`) |

### Comprobación HTML de `og:site_name` por ruta

| Ruta | `<meta property="og:site_name">` | Título (sin cambios) | Canonical (sin cambios) | H1 |
|---|---|---|---|---|
| `/` | ✅ `MetodoKakebo.com` | `Kakebo AI \| App Gratis del Método Kakebo` | `https://www.metodokakebo.com` | 1 |
| `/sobre-nosotros` | ✅ `MetodoKakebo.com` | `Sobre Kakebo AI: Filosofía, Privacidad y su Creador` | `https://www.metodokakebo.com/sobre-nosotros` | 1 |
| `/blog/cuentas-remuneradas` | ✅ `MetodoKakebo.com` | `Qué es una cuenta remunerada... \| Blog Kakebo` | `https://www.metodokakebo.com/blog/cuentas-remuneradas` | 1 |
| `/herramientas/calculadora-ahorro` | ✅ `MetodoKakebo.com` | `Calculadora de Ahorro Mensual Gratis` | `https://www.metodokakebo.com/herramientas/calculadora-ahorro` | 1 |
| `/herramientas/regla-50-30-20` | ✅ `MetodoKakebo.com` | `Calculadora 50/30/20 Gratis \| Necesidades, Deseos y Ahorro` | `https://www.metodokakebo.com/herramientas/regla-50-30-20` | 1 |
| `/tutorial` | ✅ `MetodoKakebo.com` | `Cómo usar el Método Kakebo \| Tutorial completo de Ahorro` | `https://www.metodokakebo.com/tutorial` | 1 |

Las 6 páginas afectadas identificadas en la auditoría ahora emiten `og:site_name` correctamente. No se modificó ningún `title`, `description`, `canonical`, `hreflang`, schema JSON-LD, contenido editorial ni H1.

## 6. Resultado final

`SEO-OG-SITENAME-INHERITANCE-IMPL-01` queda **completada**. Las 9 páginas públicas auditadas en `SEO-OG-SITENAME-INHERITANCE-AUDIT-01` emiten ahora `<meta property="og:site_name" content="MetodoKakebo.com">` de forma consistente: 3 ya lo hacían correctamente (`/blog`, `/herramientas`, `calculadora-inflacion`) y las 6 restantes quedan corregidas en esta tarea. No quedan páginas públicas indexables con `og:site_name` ausente dentro del alcance auditado.

`plantilla-kakebo-excel` no fue tocada directamente — el cambio en `blog/[slug]/page.tsx` es el mismo componente compartido de renderizado que ya se había modificado en tareas técnicas previas (p. ej. `SEO-HREFLANG-NOINDEX-GUARD-01`, `SEO-SCHEMA-BLOGPOSTING-PUBLISHER-01`) sin que eso constituya "tocar" el artículo en sí (su `.mdx`, slug, título o contenido permanecen intactos).

---

*SEO_OG_SITENAME_INHERITANCE_IMPL_01.md — creado 2026-07-09*
*Cambio atómico — 6 archivos, 1 línea cada uno — sin cambios de contenido editorial, UI, funcionalidad, canonical, hreflang, sitemap, robots ni schema JSON-LD*
