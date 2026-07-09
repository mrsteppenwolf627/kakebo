# SEO_BREADCRUMB_TOOLS_IMPL_01 — BreadcrumbList en herramientas individuales

**Fecha:** 2026-07-09
**Tarea:** SEO-BREADCRUMB-TOOLS-IMPL-01
**Tipo:** Corrección técnica de schema — cambio atómico
**Commit de referencia (HEAD antes de esta tarea):** `00c6a3a`

---

## 1. Problema corregido

`SEO-BREADCRUMB-AUDIT-01` (`docs/seo/SEO_BREADCRUMB_AUDIT_01.md`, hallazgo H4) confirmó que las 3 herramientas individuales carecían de schema `BreadcrumbList` pese a tener una jerarquía real de navegación (`Inicio > Herramientas > Herramienta`), idéntica en estructura a la ya implementada y validada en los artículos de blog (`Inicio > Blog > Artículo`). Esta tarea implementa la corrección recomendada.

## 2. URLs afectadas

- `https://www.metodokakebo.com/herramientas/calculadora-ahorro` (+ `/en/herramientas/calculadora-ahorro`)
- `https://www.metodokakebo.com/herramientas/calculadora-inflacion` (+ `/en/herramientas/calculadora-inflacion`)
- `https://www.metodokakebo.com/herramientas/regla-50-30-20` (+ `/en/herramientas/regla-50-30-20`)

## 3. Archivos modificados

1. `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx`
2. `src/app/[locale]/(landing)/herramientas/calculadora-inflacion/page.tsx`
3. `src/app/[locale]/(landing)/herramientas/regla-50-30-20/page.tsx`

**3 archivos.**

## 4. Estructura BreadcrumbList aplicada

En cada archivo se añadió, dentro del componente de página, un objeto `BREADCRUMB_SCHEMA` construido según el `locale`, y un segundo `<script type="application/ld+json">` independiente (sin tocar el/los `<script>` ya existentes con `SoftwareApplication`/`HowTo`/`FAQPage`/`DefinedTerm`).

**Patrón (3 niveles, igual que en `blog/[slug]/page.tsx`):**

| Posición | Nodo | URL ES | URL EN |
|---|---|---|---|
| 1 | Inicio / Home | `https://www.metodokakebo.com` | `https://www.metodokakebo.com/en` |
| 2 | Herramientas / Tools | `https://www.metodokakebo.com/herramientas` | `https://www.metodokakebo.com/en/herramientas` |
| 3 | Nombre de la herramienta | `.../herramientas/[slug]` | `https://www.metodokakebo.com/en/herramientas/[slug]` |

**Nombres aplicados en posición 3:**

| Herramienta | ES | EN |
|---|---|---|
| `calculadora-ahorro` | Calculadora de ahorro | Savings calculator |
| `calculadora-inflacion` | Calculadora de inflación | Inflation calculator |
| `regla-50-30-20` | Regla 50/30/20 | 50/30/20 rule |

Los nombres de "Inicio"/"Home" y "Herramientas"/"Tools" coinciden exactamente con las cadenas ya usadas en el resto del sitio (`Navigation.home: "Inicio"`, `Navigation.tools: "Herramientas"` en `messages/es.json`, y con el patrón `locale === 'es' ? "Inicio" : "Home"` ya usado en `blog/[slug]/page.tsx`).

Los slugs de URL (`calculadora-ahorro`, `calculadora-inflacion`, `regla-50-30-20`) no se traducen — coincide con el patrón ya existente en `alternates.languages` de las 3 páginas, donde la versión EN usa el mismo slug en español.

## 5. Decisión sobre helper/reutilización

No existe ningún helper compartido de `BreadcrumbList` en el repositorio (confirmado en `SEO-BREADCRUMB-AUDIT-01`, hallazgo H5). El único precedente (`blog/[slug]/page.tsx`) también implementa el `BreadcrumbList` de forma **inline**, sin extraerlo a un componente o función reutilizable.

Se optó por **implementación local en cada uno de los 3 archivos**, replicando ese mismo patrón inline, por los siguientes motivos:
- Mantiene consistencia con el único precedente ya validado en producción — no introduce un segundo patrón (helper) conviviendo con el patrón inline ya existente.
- Las restricciones de la tarea priorizan explícitamente "cambio seguro, pequeño y coherente" y autorizan la implementación local cuando crear un helper "implica tocar demasiados archivos" — crear un helper habría requerido tocar un archivo nuevo más los 3 existentes, sin reducir el riesgo real (el bloque es corto, ~10 líneas, y solo cambian 3 valores por archivo).
- Cambio atómico: cada archivo es autocontenido, sin introducir una dependencia cruzada entre las 3 herramientas ni con `blog/[slug]/page.tsx`.

Nota para una futura tarea de arquitectura (no SEO, no propuesta como próxima tarea): con 4 implementaciones inline del mismo patrón (blog + 3 herramientas), podría valorarse extraer un helper `buildBreadcrumbSchema(locale, items)` compartido — pero eso es una mejora de mantenibilidad de código, no de SEO, y queda fuera del objetivo de esta tarea.

## 6. Cambio técnico necesario para insertar el JSON-LD

Las 3 páginas no recibían el parámetro `locale` en su componente por defecto (a diferencia de su propio `generateMetadata`, que sí lo usa). Para construir el `BreadcrumbList` con nombres y URLs localizados correctamente (ES/EN), fue estrictamente necesario:
- Convertir cada `export default function ...Page()` en `export default async function ...Page({ params }: { params: Promise<{ locale: string }> })`.
- Añadir `const { locale } = await params;` al inicio del componente.

Este cambio no afecta a ningún elemento visible: el JSX renderizado, el contenido, los textos, los estilos y el resto de la lógica de cada página permanecen exactamente igual.

## 7. Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| `npm run build` | ✅ Compilación exitosa, todas las rutas generadas sin error |
| `npm run lint` | ✅ 0 errores, 76 warnings preexistentes (ninguno en los archivos modificados) |
| `npx tsc --noEmit` | ✅ 0 errores de tipado |
| Render local (`npm run dev`) — `BreadcrumbList` presente | ✅ En las 3 páginas ES y sus 3 equivalentes EN |
| Posiciones 1, 2, 3 | ✅ Correctas y secuenciales en las 6 rutas verificadas |
| URLs absolutas y canónicas | ✅ Coinciden exactamente con el `canonical` de cada página (incluido prefijo `/en/`) |
| `SoftwareApplication` sigue presente | ✅ Confirmado en las 3 páginas (grep de `"@type":"SoftwareApplication"` = 1 en cada una) |
| `FAQPage` sigue presente | ✅ Confirmado en `calculadora-ahorro` y `calculadora-inflacion` |
| `HowTo` sigue presente | ✅ Confirmado en `calculadora-ahorro` y `regla-50-30-20` |
| `DefinedTerm` sigue presente | ✅ Confirmado en `calculadora-inflacion` |
| `title` sin cambios | ✅ Verificado en las 3 páginas |
| `canonical` sin cambios | ✅ Verificado en las 3 páginas |
| H1 sin cambios (1 único H1 por página) | ✅ Verificado en las 3 páginas |
| No se duplican schemas existentes | ✅ El `BreadcrumbList` se añadió en un `<script>` nuevo e independiente, sin tocar el array/objeto ya serializado en el `<script>` original de cada página |

### Detalle del `BreadcrumbList` renderizado (ejemplo ES)

```json
// /herramientas/calculadora-ahorro
{"@type":"BreadcrumbList","itemListElement":[
  {"@type":"ListItem","position":1,"name":"Inicio","item":"https://www.metodokakebo.com"},
  {"@type":"ListItem","position":2,"name":"Herramientas","item":"https://www.metodokakebo.com/herramientas"},
  {"@type":"ListItem","position":3,"name":"Calculadora de ahorro","item":"https://www.metodokakebo.com/herramientas/calculadora-ahorro"}
]}
```

### Detalle del `BreadcrumbList` renderizado (ejemplo EN)

```json
// /en/herramientas/regla-50-30-20
{"@type":"BreadcrumbList","itemListElement":[
  {"@type":"ListItem","position":1,"name":"Home","item":"https://www.metodokakebo.com/en"},
  {"@type":"ListItem","position":2,"name":"Tools","item":"https://www.metodokakebo.com/en/herramientas"},
  {"@type":"ListItem","position":3,"name":"50/30/20 rule","item":"https://www.metodokakebo.com/en/herramientas/regla-50-30-20"}
]}
```

## 8. Qué se dejó fuera de alcance

- No se ha añadido breadcrumb visible en UI (fuera del objetivo, restricción explícita).
- No se ha tocado ningún artículo de blog ni `/blog/plantilla-kakebo-excel`.
- No se ha modificado `title`, meta description, `canonical`, `hreflang`, `robots` ni `openGraph` de ninguna de las 3 herramientas.
- No se ha tocado `SoftwareApplication`, `FAQPage`, `HowTo` ni `DefinedTerm` — solo se han verificado presentes, sin ninguna modificación de sus campos.
- No se ha tocado el sitemap.
- No se ha creado ningún helper compartido de breadcrumbs (decisión documentada en §5).
- No se ha rediseñado ni tocado la UI visible de ninguna herramienta.
- No se ha publicado contenido nuevo.

## 9. Resultado final

`SEO-BREADCRUMB-TOOLS-IMPL-01` queda **completada**. Las 3 herramientas individuales (`calculadora-ahorro`, `calculadora-inflacion`, `regla-50-30-20`) emiten ahora un `BreadcrumbList` correcto y coherente con el patrón ya validado en blog, en ES y EN. Con esto, las páginas core con jerarquía de navegación real (`blog/[slug]` y las 3 herramientas) tienen paridad completa de `BreadcrumbList`. Cierra el hallazgo H4 de `SEO_BREADCRUMB_AUDIT_01.md`.

---

*SEO_BREADCRUMB_TOOLS_IMPL_01.md — creado 2026-07-09*
*Cambio atómico — 3 archivos — sin breadcrumb visible, sin cambios de contenido, diseño, funcionalidad, title, canonical, hreflang, robots ni schemas previos*
