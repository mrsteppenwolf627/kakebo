# SEO_BREADCRUMB_AUDIT_01 — Auditoría del sistema de breadcrumbs

**Fecha:** 2026-07-09
**Tarea:** SEO-BREADCRUMB-AUDIT-01
**Tipo:** Solo auditoría y documentación — sin cambios en código, contenido ni configuración SEO
**Commit de referencia (HEAD):** `6e7faf5`

---

## 1. Documentos revisados

`docs/seo/SEO_ROADMAP_RESUME_2026_07_09.md` · `docs/seo/SEO_ROADMAP_V1.md` · `docs/seo/SEO_GEO_DEEP_AUDIT_01.md` · `docs/seo/SEO_MAP_V1.md` · `docs/PROJECT_STATUS.md` · `PROJECT_STATUS.md` (raíz)

`SEO_GEO_DEEP_AUDIT_01.md` (§7) ya dejaba constancia de que la presencia de `BreadcrumbList` no se había verificado de forma exhaustiva: *"No se detectó schema `BreadcrumbList` explícito en los archivos revisados directamente; el changelog no documenta ninguna tarea de breadcrumbs. Recomendable verificación puntual futura, no bloqueante."* Esta tarea cierra esa incertidumbre.

## 2. Implementación localizada

Búsqueda exhaustiva en `src/` de `Breadcrumb`, `BreadcrumbList`, `breadcrumbs`, `itemListElement`, `"@type": "BreadcrumbList"`:

- **No existe ningún componente de UI de breadcrumbs** (`src/components/**/*readcrumb*` → 0 resultados). Ninguna página del sitio renderiza un rastro de navegación visible en HTML (tipo "Inicio > Blog > Artículo").
- **No existen claves de traducción para breadcrumbs** en `messages/es.json`.
- **Solo 1 archivo** implementa schema `BreadcrumbList`: `src/app/[locale]/(public)/blog/[slug]/page.tsx` — aplica a **todos** los artículos de blog (incluido `plantilla-kakebo-excel`, sin que esta auditoría lo haya modificado).
- `src/app/[locale]/(public)/blog/page.tsx` y `src/app/[locale]/(public)/herramientas/page.tsx` usan `itemListElement` pero dentro de un schema `ItemList` anidado en `CollectionPage.mainEntity` — **no es un `BreadcrumbList`**. Es un tipo de schema distinto (lista de elementos de una colección), que Google no interpreta como rastro de navegación (breadcrumb) en Rich Results.

## 3. Páginas auditadas (10)

Verificación por lectura de código y render local (`npm run dev`), inspeccionando el HTML servido de cada ruta en busca de `"@type":"BreadcrumbList"`:

| Página | `BreadcrumbList` JSON-LD | Breadcrumb visible en HTML |
|---|---|---|
| `/` | ❌ Ausente | ❌ Ausente |
| `/blog` (índice) | ❌ Ausente (solo `ItemList` de `CollectionPage`) | ❌ Ausente |
| `/blog/cuentas-remuneradas` | ✅ Presente | ❌ Ausente |
| `/blog/plantilla-kakebo-excel` | ✅ Presente | ❌ Ausente |
| `/herramientas` (hub) | ❌ Ausente (solo `ItemList` de `CollectionPage`) | ❌ Ausente |
| `/herramientas/calculadora-ahorro` | ❌ Ausente | ❌ Ausente |
| `/herramientas/calculadora-inflacion` | ❌ Ausente | ❌ Ausente |
| `/herramientas/regla-50-30-20` | ❌ Ausente | ❌ Ausente |
| `/tutorial` | ❌ Ausente | ❌ Ausente |
| `/sobre-nosotros` | ❌ Ausente | ❌ Ausente |

## 4. Detalle del `BreadcrumbList` existente (artículos de blog)

Verificado en `/blog/cuentas-remuneradas` (ES) y `/en/blog/plantilla-kakebo-excel` (EN):

```json
// ES — /blog/cuentas-remuneradas
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.metodokakebo.com" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.metodokakebo.com/blog" },
    { "@type": "ListItem", "position": 3, "name": "Qué es una cuenta remunerada y cuándo tiene sentido para tu ahorro", "item": "https://www.metodokakebo.com/blog/cuentas-remuneradas" }
  ]
}

// EN — /en/blog/plantilla-kakebo-excel
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.metodokakebo.com/en" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.metodokakebo.com/en/blog" },
    { "@type": "ListItem", "position": 3, "name": "Free Kakebo Excel Template: How to start and why it (almost) always fails", "item": "https://www.metodokakebo.com/en/blog/plantilla-kakebo-excel" }
  ]
}
```

**Verificado correcto:**
- URLs absolutas y canónicas (coinciden con el `canonical` de cada página, incluido el prefijo `/en/` para inglés).
- Posiciones secuenciales correctas (1, 2, 3), sin huecos ni duplicados.
- Nombres coherentes y localizados: "Inicio"/"Home", "Blog"/"Blog", título real del artículo en el idioma correspondiente.
- Patrón idéntico entre ES y EN — sin inconsistencias de estructura entre idiomas.
- `/blog/plantilla-kakebo-excel` genera su `BreadcrumbList` a través del mismo componente compartido que el resto de artículos, sin ninguna excepción ni override — no requirió ni recibió ninguna modificación en esta auditoría (solo lectura).

## 5. Hallazgos clasificados

| # | Hallazgo | Clasificación |
|---|---|---|
| H1 | El `BreadcrumbList` de los artículos de blog es técnicamente correcto: URLs absolutas, posiciones correctas, nombres coherentes, consistente entre ES/EN | **A — Correcto, sin acción** |
| H2 | El `BreadcrumbList` de los artículos no tiene equivalente visible en el HTML (no hay rastro de navegación tipo "Inicio > Blog > Artículo" visible para el usuario) — solo existe como dato estructurado invisible | **B — Mejora menor futura** |
| H3 | Home, blog index, hub de herramientas, `tutorial` y `sobre-nosotros` no tienen `BreadcrumbList` — coherente, ya que son páginas de primer/segundo nivel donde un breadcrumb aporta poco valor (Home no necesita breadcrumb; blog index y hub ya son el "segundo nivel" natural) | **E — No aplicable** |
| H4 | Las 3 páginas de herramientas individuales (`calculadora-ahorro`, `calculadora-inflacion`, `regla-50-30-20`) **no tienen `BreadcrumbList`** pese a tener una jerarquía real de 2 niveles (`Inicio > Herramientas > [Herramienta]`), exactamente el mismo patrón que ya se implementó para artículos de blog (`Inicio > Blog > [Artículo]`). El hub `/herramientas` las lista vía `ItemList`, pero eso no es interpretado por Google como breadcrumb | **C — Inconsistencia real** |
| H5 | No existe un componente reutilizable de breadcrumbs — el `BreadcrumbList` de blog está hardcodeado inline en `blog/[slug]/page.tsx`, lo que dificulta replicar el mismo patrón en herramientas sin duplicar lógica | **B — Mejora menor futura (de arquitectura de código, no de SEO en sí)** |
| H6 | No se detectó ninguna duplicidad de posiciones, URLs relativas, ni breadcrumbs inconsistentes entre ES/EN en el `BreadcrumbList` existente | **A — Correcto, sin acción** |

## 6. Riesgos

| Riesgo | ¿Presente? | Detalle |
|---|---|---|
| Google Rich Results no detecta breadcrumbs en páginas clave | **Parcialmente** | Los artículos de blog sí son elegibles (schema válido, ya confirmado externamente por el usuario en `POST-PUBLISH-INDEXATION-CHECK-01`: Rich Results detecta "Artículo + Breadcrumbs" en `/blog/cuentas-remuneradas`). Las 3 herramientas y el resto de páginas core **no son elegibles** para el rich result de breadcrumb en SERP porque carecen del schema |
| Impacto en GEO/comprensión de arquitectura | **Bajo-medio** | Un motor generativo que cruce el `BreadcrumbList` de blog puede inferir correctamente la jerarquía `Blog > Artículo`, pero no tiene la misma señal explícita para `Herramientas > Herramienta individual` — una fuga de consistencia estructural, no un error técnico |
| Riesgo SEO de indexación/ranking | **Ninguno** | La ausencia de `BreadcrumbList` en el resto de páginas no penaliza indexación, ranking ni genera errores — es una oportunidad de mejora de rich results, no un defecto que Search Console reporte como error |
| Inconsistencia ES/EN | **Ninguna detectada** | El único `BreadcrumbList` existente es consistente entre idiomas |

## 7. Recomendaciones

1. **Extender `BreadcrumbList` a las 3 páginas de herramientas individuales** (`Inicio > Herramientas > [Herramienta]`), replicando exactamente el patrón ya validado y correcto en `blog/[slug]/page.tsx`. Es la inconsistencia real más clara (H4) y de menor riesgo de implementación, porque reutiliza un patrón ya probado en producción.
2. Valorar, en una tarea de arquitectura de código separada (no SEO), extraer el bloque `BreadcrumbList` a un helper compartido para evitar duplicar la misma estructura en 4+ archivos (H5) — mejora de mantenibilidad, no de SEO.
3. No se recomienda añadir breadcrumb visible en HTML (H2) como prioridad — es una mejora de UX/accesibilidad de bajo impacto SEO directo (Google no exige que el breadcrumb visible coincida con el structured data para ser elegible en Rich Results, aunque es buena práctica). Se deja como nota, no como tarea recomendada de forma inmediata.
4. No tocar Home, blog index, hub de herramientas, `/tutorial` ni `/sobre-nosotros` — su ausencia de `BreadcrumbList` es coherente con su posición en la arquitectura (H3).

## 8. Decisión recomendada

**Sí procede una implementación futura**, acotada al hallazgo H4: añadir `BreadcrumbList` a las 3 páginas de herramientas individuales. Es una tarea técnica atómica, de bajo riesgo (patrón ya validado en blog), sin dependencias de datos GSC, y no compite con ninguna ventana de medición activa (no toca title, meta, canonical, hreflang ni ningún campo ya medido).

## 9. Siguiente tarea recomendada

**`SEO-BREADCRUMB-HERRAMIENTAS-IMPL-01`** — añadir schema `BreadcrumbList` (`Inicio > Herramientas > [Herramienta]`) a `calculadora-ahorro/page.tsx`, `calculadora-inflacion/page.tsx` y `regla-50-30-20/page.tsx`, replicando el patrón de 3 niveles ya usado en `blog/[slug]/page.tsx`. Cambio atómico, sin tocar título/meta/canonical/hreflang/otros schemas existentes en esas páginas.

## 10. Qué NO se ha modificado

- No se ha tocado ningún archivo de código (`blog/[slug]/page.tsx`, páginas de herramientas, Home, etc.).
- No se ha tocado `/blog/plantilla-kakebo-excel` — solo se ha leído su `BreadcrumbList` ya existente vía render local, sin ninguna modificación.
- No se ha tocado ningún artículo de blog ni ninguna herramienta.
- No se ha tocado sitemap, robots, canonical, hreflang ni ningún otro schema (`BlogPosting`, `SoftwareApplication`, `FAQPage`, `Organization`, `CollectionPage`).
- No se ha publicado contenido nuevo.

---

*SEO_BREADCRUMB_AUDIT_01.md — creado 2026-07-09*
*Solo auditoría y documentación — sin cambios en código, contenido ni configuración SEO*
