# SEO_OG_SITENAME_INHERITANCE_AUDIT_01 — Auditoría de ausencia de og:site_name

**Fecha:** 2026-07-09
**Tarea:** SEO-OG-SITENAME-INHERITANCE-AUDIT-01
**Tipo:** Solo análisis y documentación — sin cambios en código, contenido ni configuración SEO
**Commit de referencia (HEAD):** `8e99d59`

---

## 1. Problema detectado

Durante `SEO-SITENAME-UNIFY-01` (commit `217565a`) se observó, como hallazgo adyacente fuera de alcance, que algunas páginas públicas no emiten la etiqueta `<meta property="og:site_name">` en el HTML renderizado, a pesar de que `src/app/[locale]/layout.tsx` define `openGraph.siteName: "MetodoKakebo.com"` a nivel global. Esta tarea audita exactamente qué páginas están afectadas, confirma la causa técnica y propone (sin implementar) una solución segura.

## 2. Nombre canónico aprobado

`MetodoKakebo.com` — sin cambios respecto a `SEO-SITENAME-UNIFY-01`.

## 3. Páginas auditadas

| Página | Archivo | ¿Define `openGraph` propio? |
|---|---|---|
| Layout global (fuente por defecto) | `src/app/[locale]/layout.tsx` | Sí — `siteName: "MetodoKakebo.com"` (fijado en `SEO-SITENAME-UNIFY-01`) |
| Home (`/`) | `src/app/[locale]/(public)/page.tsx` | Sí — sin `siteName` |
| `/sobre-nosotros` | `src/app/[locale]/(public)/sobre-nosotros/page.tsx` | Sí — sin `siteName` |
| Blog index (`/blog`) | `src/app/[locale]/(public)/blog/page.tsx` | **No** — sin bloque `openGraph` |
| Artículo de blog (`/blog/[slug]`) | `src/app/[locale]/(public)/blog/[slug]/page.tsx` | Sí — sin `siteName` |
| Hub herramientas (`/herramientas`) | `src/app/[locale]/(public)/herramientas/page.tsx` | **No** — sin bloque `openGraph` |
| Calculadora de ahorro (`/herramientas/calculadora-ahorro`) | `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx` | Sí — sin `siteName` |
| Calculadora de inflación (`/herramientas/calculadora-inflacion`) | `src/app/[locale]/(landing)/herramientas/calculadora-inflacion/page.tsx` | Sí — **con `siteName: "MetodoKakebo.com"` explícito** |
| Regla 50/30/20 (`/herramientas/regla-50-30-20`) | `src/app/[locale]/(landing)/herramientas/regla-50-30-20/page.tsx` | Sí — sin `siteName` |
| Tutorial (`/tutorial`) | `src/app/[locale]/(public)/tutorial/page.tsx` | Sí — sin `siteName` |

9 páginas públicas indexables auditadas, más el layout global como fuente por defecto.

## 4. Clasificación

### A. Páginas que sí exponen `og:site_name` correcto (por definirlo explícitamente)

| Página | Valor |
|---|---|
| `/herramientas/calculadora-inflacion` | `MetodoKakebo.com` |

### B. Páginas que NO exponen `og:site_name` (openGraph propio sin `siteName`)

| Página | Causa concreta |
|---|---|
| `/` (Home) | `openGraph` propio en `page.tsx` sin `siteName` |
| `/sobre-nosotros` | `openGraph` propio sin `siteName` |
| `/blog/[slug]` (15 artículos ES + variantes EN indexables) | `openGraph` propio sin `siteName` |
| `/herramientas/calculadora-ahorro` | `openGraph` propio sin `siteName` |
| `/herramientas/regla-50-30-20` | `openGraph` propio sin `siteName` |
| `/tutorial` | `openGraph` propio sin `siteName` |

### C. Páginas donde `openGraph` propio sobrescribe la metadata global

Coincide exactamente con el conjunto B — son las mismas páginas. La definición de un `openGraph` propio en `generateMetadata` de la página reemplaza por completo (no fusiona) el `openGraph` del layout padre, incluido el campo `siteName` que la página no repite.

### D. Páginas sin `openGraph` propio que heredan correctamente

| Página | Resultado |
|---|---|
| `/blog` (índice de blog) | Hereda el `openGraph` completo de `layout.tsx`, incluido `siteName: "MetodoKakebo.com"` |
| `/herramientas` (hub) | Hereda el `openGraph` completo de `layout.tsx`, incluido `siteName: "MetodoKakebo.com"` |

### E. Páginas donde no es necesario intervenir

Ninguna de las páginas auditadas cae en esta categoría de forma trivial — todas son públicas e indexables y se benefician de un `og:site_name` correcto para presentación en redes sociales y buscadores. Quedan explícitamente fuera del alcance de esta auditoría (no auditadas): páginas de la app autenticada (`/app/*`), auth, páginas legales (`/privacy`, `/terms`, `/cookies`) y `login`, por no formar parte de la superficie prioritaria de indexación/compartición social.

## 5. Validación local ejecutada

Se levantó el servidor de desarrollo (`npm run dev`) y se inspeccionó el HTML renderizado de las 9 rutas auditadas, buscando `<meta property="og:site_name">`:

| Ruta | `og:site_name` presente | Valor |
|---|---|---|
| `/` | ❌ Ausente | — |
| `/sobre-nosotros` | ❌ Ausente | — |
| `/blog` | ✅ Presente | `MetodoKakebo.com` |
| `/blog/cuentas-remuneradas` | ❌ Ausente | — |
| `/herramientas` | ✅ Presente | `MetodoKakebo.com` |
| `/herramientas/calculadora-ahorro` | ❌ Ausente | — |
| `/herramientas/calculadora-inflacion` | ✅ Presente | `MetodoKakebo.com` |
| `/herramientas/regla-50-30-20` | ❌ Ausente | — |
| `/tutorial` | ❌ Ausente | — |

**Resultado:** 6 de 9 páginas auditadas no emiten `og:site_name` en absoluto. Las 3 que sí lo hacen usan correctamente `"MetodoKakebo.com"` — no hay ningún caso donde se emita un valor incorrecto (p. ej. `"Kakebo AI"`); el problema es únicamente de **ausencia**, no de valor erróneo. Esto confirma que `SEO-SITENAME-UNIFY-01` resolvió completamente el problema de "valor incorrecto" y que lo que queda es un problema estructural distinto: "campo ausente por sobrescritura".

## 6. Causa técnica

Confirmada por lectura directa del código y validación empírica: **no-merge de objetos anidados en Next.js Metadata API**.

Next.js App Router fusiona los campos de metadata escalares (`title`, `description`, etc.) entre `layout.tsx` y el `generateMetadata` de cada página, pero los campos de tipo objeto como `openGraph` y `twitter` **no se fusionan en profundidad**: si una página define su propio `openGraph`, ese objeto **reemplaza por completo** al `openGraph` del layout padre, campo por campo ausente incluido. Como la mayoría de páginas definen `openGraph.title`, `openGraph.description` e `openGraph.images` propios (necesarios para su snippet específico) pero no repiten `siteName`, ese campo desaparece silenciosamente del HTML en vez de heredarse.

Las dos páginas sin `openGraph` propio (`/blog`, `/herramientas`) no sufren el problema porque no hay objeto que sobrescriba — heredan el de `layout.tsx` íntegro. La única página con `openGraph` propio que sí funciona (`calculadora-inflacion`) lo hace porque repite `siteName` manualmente dentro de su propio objeto.

No se trata de: un helper SEO incompleto (no existe tal helper — cada página construye su metadata de forma independiente), metadata duplicada, ni ausencia de una constante centralizada per se — aunque la ausencia de una constante centralizada es parte de por qué el patrón es inconsistente entre páginas (cada una decide si repetir `siteName` o no, sin una convención forzada).

## 7. Recomendación de implementación (no aplicada en esta tarea)

### Patrón recomendado

Repetir explícitamente `siteName: "MetodoKakebo.com"` dentro de cada objeto `openGraph` que las páginas definen localmente — el mismo patrón que ya usa `calculadora-inflacion` — en lugar de intentar cambiar el comportamiento de merge de Next.js (no es configurable) o restructurar el árbol de layouts (alto riesgo, fuera de proporción para este problema).

Para evitar que el valor se repita como literal string en 6 archivos distintos (riesgo de que una futura tarea de rebranding tenga que tocar 6+1 archivos de nuevo), se recomienda **extraer una constante compartida**, por ejemplo:

```ts
// src/lib/seo/constants.ts
export const SITE_NAME = "MetodoKakebo.com";
```

e importarla en `layout.tsx` y en cada página que defina `openGraph` propio, sustituyendo el literal `"MetodoKakebo.com"` por `SITE_NAME`.

### Archivos candidatos (para una tarea de implementación futura)

1. `src/lib/seo/constants.ts` (nuevo) — o ubicación equivalente ya existente en `src/lib/` si el proyecto prefiere no crear un archivo nuevo de una sola constante
2. `src/app/[locale]/layout.tsx` — sustituir literal por `SITE_NAME`, y esto ya está correcto en valor (`SEO-SITENAME-UNIFY-01`)
3. `src/app/[locale]/(public)/page.tsx` — añadir `siteName: SITE_NAME` al `openGraph`
4. `src/app/[locale]/(public)/sobre-nosotros/page.tsx` — añadir `siteName: SITE_NAME`
5. `src/app/[locale]/(public)/blog/[slug]/page.tsx` — añadir `siteName: SITE_NAME` (afecta a 15+ artículos de una sola vez, un único punto de código)
6. `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx` — añadir `siteName: SITE_NAME`
7. `src/app/[locale]/(landing)/herramientas/regla-50-30-20/page.tsx` — añadir `siteName: SITE_NAME`
8. `src/app/[locale]/(landing)/herramientas/calculadora-inflacion/page.tsx` — opcional: sustituir el literal ya correcto por `SITE_NAME` para consistencia de patrón (no imprescindible, ya funciona)
9. `src/app/[locale]/(public)/tutorial/page.tsx` — añadir `siteName: SITE_NAME`

**No requiere tocar** `blog/page.tsx` ni `herramientas/page.tsx` (hub) — ya heredan correctamente al no definir `openGraph` propio.

### ¿Constante o repetición local?

Se recomienda **constante compartida** frente a repetir el literal `"MetodoKakebo.com"` en cada archivo, porque:
- El propio `SEO-SITENAME-UNIFY-01` demostró que el valor puede divergir por descuido (`"Kakebo AI"` en 2 sitios) — una constante hace ese error estructuralmente imposible en el futuro.
- El coste de crear y mantener una constante de una línea es mínimo comparado con el riesgo de una nueva regresión de nombre.

### Riesgo

**Bajo.** Añadir una propiedad a un objeto de metadata ya existente no cambia ninguna otra señal (title, description, canonical, images, type). No afecta a `BlogPosting`, `SoftwareApplication`, sitemap, robots ni hreflang — son sistemas independientes del bloque `openGraph`.

### Validación necesaria (para la tarea de implementación)

- `npm run build`, `npm run lint`, `npx tsc --noEmit` sin errores.
- Render local de las 7 páginas a modificar (sección 7, puntos 3-9) confirmando `<meta property="og:site_name" content="MetodoKakebo.com">` presente en cada una.
- Confirmar que `/blog` y `/herramientas` (no tocadas) siguen mostrando el mismo valor correcto que ya mostraban.
- Rich Results Test / Facebook Sharing Debugger opcional sobre 1-2 URLs representativas, si se quiere verificación externa adicional (no bloqueante).

### ¿Una tarea o varias?

**Una sola tarea**, por el propio principio de `SEO_ROADMAP_V1.md` ("una tarea, un commit, un objetivo"): aunque toca 7-8 archivos, es un único objetivo atómico (añadir el mismo campo con el mismo valor a cada `openGraph` ya existente), sin mezclar con ningún otro tipo de cambio. Dividirla en 7 tareas separadas añadiría fricción de proceso sin reducir el riesgo real, que ya es bajo y uniforme en los 7 archivos.

## 8. Decisión final

**Implementar en una tarea futura dedicada** (propuesta de nombre: `SEO-OG-SITENAME-INHERITANCE-IMPL-01`), no en esta auditoría. Esta tarea es solo de análisis y documentación por restricción explícita.

Justificación de no implementar todavía:
- Es una corrección de baja severidad (campo ausente, no campo incorrecto — ya confirmado en la sección 5 que ningún valor emitido es erróneo).
- El Plan Maestro SEO/GEO prioriza no mezclar auditoría y ejecución en la misma tarea, y esta auditoría fue solicitada explícitamente como paso previo.
- No bloquea ni afecta a la ventana de medición activa de `/blog/cuentas-remuneradas` ni `/herramientas/calculadora-ahorro` (no toca `title`, `description` ni ningún campo ya medido) — puede ejecutarse en cualquier momento sin reiniciar esas ventanas, incluso durante el periodo de espera del snapshot GSC del 2026-07-17/31.

---

*SEO_OG_SITENAME_INHERITANCE_AUDIT_01.md — creado 2026-07-09*
*Solo análisis y documentación — sin cambios en código, contenido ni configuración SEO*
