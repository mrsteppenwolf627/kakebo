# SEO_AUTHOR_ABOUT_NORMALIZE_01 — Normalización de Person.name en /sobre-nosotros

**Fecha:** 2026-07-09
**Tarea:** SEO-AUTHOR-ABOUT-NORMALIZE-01
**Tipo:** Corrección técnica de schema — cambio atómico
**Commit de referencia (HEAD antes de esta tarea):** `217565a`

---

## 1. Problema detectado

Durante `SEO-SITENAME-UNIFY-01` (commit `217565a`) se detectó, como hallazgo adyacente fuera de alcance, que el schema JSON-LD `Person` de `/sobre-nosotros` declaraba:

```json
"name": "Aitor Almu"
```

mientras que la identidad editorial oficial fijada por `SEO-AUTHOR-NORMALIZATION-01` (2026-07-07) es:

- **Persona / autor:** Aitor Alarcón
- **Publisher / organización:** MetodoKakebo.com

"Aitor Almu" no es una variante estilística: es un nombre distinto al canónico ya normalizado en los 29 artículos de blog, en `layout.tsx` (`authors: [{ name: "Aitor Alarcón" }]`) y en el resto del sitio. Es la misma entidad `Person` (`@id: https://www.metodokakebo.com/#person`), por lo que el valor de `name` debía coincidir con el resto de referencias a esa persona en el sitio.

## 2. Corrección aplicada

`Person.name`: `"Aitor Almu"` → `"Aitor Alarcón"`

No se modificó ningún otro campo de la entidad `Person`: `@id`, `jobTitle`, `url`, `sameAs` (`https://x.com/aitoralmu`, `https://github.com/mrsteppenwolf627`) y `worksFor` quedan exactamente igual. Esos campos son identificadores/handles reales (cuenta de X, usuario de GitHub), no el nombre editorial, por lo que están fuera del objetivo de esta tarea y no representan una inconsistencia de identidad.

## 3. Archivo modificado

- `src/app/[locale]/(public)/sobre-nosotros/page.tsx` (línea 52) — 1 línea

## 4. Búsqueda de otras apariciones

Se buscó `"Aitor Almu"` en todo el repositorio. Resultado: **una única aparición en código fuente** (la corregida). Las demás coincidencias eran referencias documentales en `docs/seo/SEO_SITENAME_UNIFY_01.md`, `docs/PROJECT_STATUS.md` y `PROJECT_STATUS.md`, describiendo el hallazgo — no requieren cambio porque documentan correctamente el estado histórico previo a esta corrección.

No se encontró ningún otro punto técnico (schema, metadata, frontmatter) donde la misma entidad `Person` usara un nombre distinto a "Aitor Alarcón".

## 5. Qué se dejó fuera de alcance

- `Organization.name` (`"MetodoKakebo.com"`) — sin tocar, confirmado correcto.
- `siteName` / `openGraph.siteName` — sin tocar, según restricción explícita de la tarea.
- `sameAs` (`@x.com/aitoralmu`, GitHub `mrsteppenwolf627`) — son identificadores de cuentas reales, no nombres editoriales; no se tocan.
- `contactPoint.email` (`aitor@aitoralmu.xyz`) en el schema `Organization` de la misma página — dominio personal ya señalado como discrepancia menor en `SEO_AUTHOR_AUDIT_01.md` (§ hallazgo "Email de contacto en dominio personal", severidad Baja); no es el `Person.name` y queda fuera del objetivo único de esta tarea.
- Ausencia de `og:site_name` en páginas con `openGraph` propio (Home, `calculadora-ahorro`) — hallazgo ya documentado en `SEO-SITENAME-UNIFY-01`, explícitamente excluido en las restricciones de esta tarea.
- Copy editorial visible de `/sobre-nosotros` (p. ej. "Soy Aitor, un desarrollador independiente...") — no es schema/identidad técnica, es texto natural; no se ha tocado.
- Directorio anidado `kakebo/` en la raíz del repositorio (repositorio git independiente, no registrado como submódulo) — contiene una copia propia de los mismos archivos fuente; está fuera del árbol de trabajo relevante para esta tarea y no se ha tocado.

## 6. Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| `npm run build` | ✅ Compilación exitosa, todas las rutas generadas sin error |
| `npm run lint` | ✅ 0 errores, 76 warnings preexistentes (ninguno en el archivo modificado) |
| `npx tsc --noEmit` | ✅ 0 errores de tipado |
| Render local (`npm run dev`) — `GET /sobre-nosotros` | ✅ HTTP 200 |
| JSON-LD `Person.name` renderizado | ✅ `"Aitor Alarcón"` |
| JSON-LD `Organization.name` renderizado | ✅ `"MetodoKakebo.com"` (sin cambios) |
| Canonical renderizado | ✅ `https://www.metodokakebo.com/sobre-nosotros` (sin cambios) |
| Grep final de `"Aitor Almu"` en `src/` | ✅ 0 ocurrencias |

## 7. Decisión final

`SEO-AUTHOR-ABOUT-NORMALIZE-01` queda **completada**. La entidad `Person` (`@id: .../#person`) usa de forma consistente `"Aitor Alarcón"` en todo el sitio: 29 artículos de blog, metadata global (`layout.tsx`) y ahora también el schema `Organization`/`Person` de `/sobre-nosotros`. No se detectan más inconsistencias de nombre de la misma entidad. La entidad `Organization` (MetodoKakebo.com) permanece sin cambios.

---

*SEO_AUTHOR_ABOUT_NORMALIZE_01.md — creado 2026-07-09*
*Cambio atómico — 1 archivo, 1 línea — sin cambios de contenido editorial, UI, funcionalidad, canonical, hreflang, sitemap, robots ni siteName*
