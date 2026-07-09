# SEO_SITENAME_UNIFY_01 — Unificación de siteName / entidad editorial

**Fecha:** 2026-07-09
**Tarea:** SEO-SITENAME-UNIFY-01
**Tipo:** Corrección técnica de metadata/schema — cambio atómico
**Commit de referencia (HEAD antes de esta tarea):** `2f7af28`

---

## 1. Objetivo

Unificar el nombre del sitio y la entidad editorial en metadata, Open Graph, Twitter metadata, JSON-LD y constantes internas, eliminando inconsistencias entre "Kakebo", "Metodo Kakebo", "MetodoKakebo" y "MetodoKakebo.com" — sin tocar el nombre del producto/app ("Kakebo AI") ni el concepto del método japonés ("método Kakebo"), que son entidades distintas y legítimas.

## 2. Nombre canónico definido

| Rol | Valor canónico |
|---|---|
| Marca/editorial del sitio (`siteName`, `Organization.name`, `publisher.name`) | **MetodoKakebo.com** |
| Entidad `@id` Organization | `https://www.metodokakebo.com/#organization` |
| Autor persona | **Aitor Alarcón** (sin cambios en esta tarea — ya fijado en `SEO-AUTHOR-NORMALIZATION-01`) |
| Dominio canónico | `https://www.metodokakebo.com` |
| Producto/app (categoría distinta, no tocada) | **Kakebo AI** |
| Concepto del método japonés (categoría distinta, no tocada) | **método Kakebo** |

## 3. Método

Búsqueda exhaustiva en `src/`, `messages/es.json` y `src/content/blog/*.mdx` de las variantes: `Kakebo`, `Metodo Kakebo`, `Método Kakebo`, `MetodoKakebo`, `MetodoKakebo.com`, `Kakebo App`, `Kakebo Online`, `Kakebo AI`. Cada aparición se clasificó antes de tocar nada, siguiendo las categorías A-G definidas en la tarea. No se hizo ninguna sustitución masiva o automática.

## 4. Variantes encontradas y clasificación

### A/F/G — Marca/editorial/schema/metadata (en scope)

| Ubicación | Valor encontrado | Clasificación | Acción |
|---|---|---|---|
| `src/app/[locale]/layout.tsx:53` — `openGraph.siteName` | `"Kakebo AI"` | F/G — inconsistente con `creator`/`publisher` del mismo archivo (ya `"MetodoKakebo.com"`) y con `calculadora-inflacion` | **Corregido → `"MetodoKakebo.com"`** |
| `src/app/[locale]/(public)/sobre-nosotros/page.tsx:38` — `Organization.name` | `"Kakebo AI"` | F — mismo `@id` (`.../#organization`) declarado con `"MetodoKakebo.com"` en Home, blog index, hub herramientas y las 3 herramientas; contradicción directa de entidad estructurada | **Corregido → `"MetodoKakebo.com"`** |
| `layout.tsx` — `creator`, `publisher` | `"MetodoKakebo.com"` | F — ya correcto | Sin cambios |
| `calculadora-inflacion/page.tsx:27` — `openGraph.siteName` | `"MetodoKakebo.com"` | G — ya correcto (era la única excepción "buena" señalada en la auditoría RB-03) | Sin cambios |
| Home (`page.tsx`), blog index (`blog/page.tsx`), hub herramientas (`herramientas/page.tsx`), `calculadora-ahorro/page.tsx`, `calculadora-inflacion/page.tsx`, `blog/[slug]/page.tsx` — `Organization.name` / `publisher.name` / `author.name` | `"MetodoKakebo.com"` en las 6 ubicaciones | F — ya correcto | Sin cambios |
| Todos los `@id` de tipo Organization en el repo | `https://www.metodokakebo.com/#organization` (8 ocurrencias) | F — ya consistente | Sin cambios |
| Todas las URLs canónicas (`alternates.canonical`) revisadas | `https://www.metodokakebo.com/...` | — ya consistente | Sin cambios |
| `twitter.site` | No existe en ningún archivo (solo `twitter.creator: "@kakebo_ai"`, que es un handle real, no un nombre de marca) | G | No aplica |

### C — Producto/app (fuera de scope, ya correcto y consistente)

| Ubicación | Valor | Motivo para no tocar |
|---|---|---|
| `src/app/manifest.ts` — `name`/`short_name` | `"Kakebo AI: Finanzas Zen"` / `"Kakebo AI"` | Nombre del PWA instalable — es el producto, no el sitio editorial |
| `src/app/[locale]/layout.tsx` — `appleWebApp.title` | `"Kakebo AI"` | Título de acceso directo iOS, coherente con `manifest.ts` |
| `src/app/[locale]/layout.tsx` — `openGraph.images[0].alt` | `"Kakebo AI Dashboard"` | Describe el contenido de la captura (dashboard de la app), no la entidad del sitio |
| Home `page.tsx` — `SoftwareApplication.name` (schema `@graph`) | `"Kakebo AI"` | Correcto: es el nombre del producto (`SoftwareApplication`), distinto de `Organization.name` |
| `src/components/seo/SoftwareAppJsonLd.tsx` — `name` | `"Kakebo AI"` | Nombre de producto correcto. **Nota:** este componente no está importado en ningún lugar de `src/` (verificado por búsqueda de uso) — es código muerto, no afecta al schema real servido. No se elimina en esta tarea por no ser objetivo de la misma. |
| `src/app/api/og/route.tsx` — título por defecto | `"Kakebo AI"` | Fallback del generador de imágenes OG dinámicas cuando no se pasa `?title=` — es branding de producto |
| `src/components/reports/ReportPDF.tsx` | `"Kakebo AI"` | Marca visible en el PDF exportado por la herramienta — funcionalidad de producto |
| `src/lib/ai/assistant.ts` — system prompt | `"Eres Kakebo AI..."` | Persona del asistente de IA, es el producto |
| `src/lib/api/openapi.ts` | `"Kakebo AI API"` | Nombre de la API del producto |
| `messages/es.json` — decenas de apariciones en copy de marketing (`"Kakebo AI, la app gratuita de MetodoKakebo.com"`, títulos de secciones, CTAs) | `"Kakebo AI"` | Patrón ya correcto y consistente en todo el sitio: distingue explícitamente producto (Kakebo AI) de organización (MetodoKakebo.com) |

### B/E — Método japonés / contenido editorial (fuera de scope, no tocado)

| Ubicación | Valor | Motivo |
|---|---|---|
| ~30 artículos `.mdx` (ES+EN) | `"método Kakebo"` / `"method Kakebo"` | Concepto histórico/japonés, uso correcto y ya validado por auditorías previas de terminología (`SEO-GEO-TERMINOLOGY-01`) |
| `messages/es.json` — `Layout.metadata.defaultTitle` | `"Kakebo - Control de Gastos Inteligente"` | Title SEO individual de Home — restricción explícita de la tarea: "No cambiar titles SEO individuales si no es imprescindible". No hay error técnico de schema aquí, es copy editorial de title |
| `messages/es.json` — `Layout.metadata.ogTitle` / `twitterTitle` | `"Kakebo AI: Finanzas Zen"` | Mismo motivo — title/OG title de Home, no el campo `siteName` |
| `messages/es.json` — `Layout.metadata.templateTitle` | `"%s \| Kakebo AI: Ahorro Japonés"` | Clave huérfana: no se usa en `layout.tsx` (el `title.template` está hardcodeado a `"%s"` en código). No se toca — no forma parte del schema/metadata realmente servido y limpiarla no es el objetivo de esta tarea |
| `src/app/api/og/route.tsx` — texto del logo renderizado (`"Kakebo"`) | `"Kakebo"` | Marca visual estilizada dentro de la imagen OG generada, no un campo de metadata |

### Hallazgo adyacente registrado, no corregido (fuera de scope)

`sobre-nosotros/page.tsx` línea 52 — `Person.name: "Aitor Almu"` en el schema JSON-LD, mientras que la decisión canónica de autoría (`SEO-AUTHOR-NORMALIZATION-01`) fija **"Aitor Alarcón"** como persona autora en todo el sitio. Esta tarea es sobre `siteName`/`Organization`, no sobre autoría de `Person` — no se modifica aquí para mantener el cambio atómico. Se deja documentado como candidato a una tarea futura de autoría (`SEO-AUTHOR-NORMALIZATION-02` o similar).

## 5. Qué se corrigió

1. `src/app/[locale]/layout.tsx:53` — `openGraph.siteName`: `"Kakebo AI"` → `"MetodoKakebo.com"`
2. `src/app/[locale]/(public)/sobre-nosotros/page.tsx:38` — `Organization.name` (JSON-LD): `"Kakebo AI"` → `"MetodoKakebo.com"`

**2 archivos, 1 línea cada uno.**

## 6. Qué se dejó igual y por qué

- Todo lo clasificado en categoría C (producto "Kakebo AI"): ya es consistente en sí mismo y semánticamente correcto — es el nombre del producto, no del sitio/editor.
- Todo lo clasificado en categoría B/E (método Kakebo, titles SEO, copy editorial): protegido explícitamente por las restricciones de la tarea.
- `plantilla-kakebo-excel.es.mdx` — revisado, no contiene ningún campo de tipo `siteName` en su frontmatter ni inconsistencia técnica de entidad. No se ha tocado, según la restricción explícita de la tarea.
- `SoftwareAppJsonLd.tsx` — componente sin usar (código muerto), valores ya correctos; no se elimina por no ser objetivo de esta tarea.
- `Person.name: "Aitor Almu"` en `sobre-nosotros` — inconsistencia real detectada pero fuera del alcance de `siteName`; documentada para tarea futura.
- `messages/es.json` `templateTitle` huérfano — no se limpia, no afecta al schema servido.

## 7. Archivos modificados

- `src/app/[locale]/layout.tsx`
- `src/app/[locale]/(public)/sobre-nosotros/page.tsx`

## 8. Validaciones

| Validación | Resultado |
|---|---|
| `npm run build` | ✅ Compilación exitosa, todas las rutas generadas sin error |
| `npm run lint` | ✅ 0 errores, 76 warnings preexistentes (ninguno relacionado con los archivos tocados) |
| `npx tsc --noEmit` | ✅ 0 errores de tipado |
| Grep final de `siteName` en `src/` | ✅ 2 ocurrencias, ambas `"MetodoKakebo.com"` (`layout.tsx`, `calculadora-inflacion/page.tsx`) |
| Grep de `Organization.name`/`publisher.name` en todo `src/app` | ✅ Todas las ocurrencias devuelven `"MetodoKakebo.com"` |
| `@id` de Organization | ✅ Sin cambios — sigue siendo `https://www.metodokakebo.com/#organization` en las 8 ubicaciones donde aparecía |
| Canonical / hreflang / sitemap / robots | ✅ Sin cambios — no se tocó ningún archivo de esos sistemas |
| `plantilla-kakebo-excel` | ✅ Sin cambios |
| `BlogPosting` schema | ✅ Sin cambios estructurales — `publisher.name` ya era `"MetodoKakebo.com"` antes de esta tarea |
| `SoftwareApplication` schema (calculadora-ahorro, calculadora-inflacion, Home, hub herramientas) | ✅ Sin cambios — ya usaban `"MetodoKakebo.com"` como `author`/`publisher` |
| Render local — `/sobre-nosotros` (`npm run dev`) | ✅ HTTP 200; JSON-LD `Organization` renderizado confirma `"name":"MetodoKakebo.com"` con el mismo `@id` usado en el resto del sitio |
| Render local — Home | ✅ JSON-LD `Organization.name` = `"MetodoKakebo.com"`, `SoftwareApplication.name` = `"Kakebo AI"` (sin cambios, correcto) |
| Render local — `/herramientas/calculadora-inflacion` | ✅ `<meta property="og:site_name" content="MetodoKakebo.com"/>` presente y correcto (no tocado, ya era correcto) |

### Hallazgo estructural adicional detectado durante validación (no corregido, fuera de alcance)

Al renderizar Home y `/herramientas/calculadora-ahorro` en local se observó que **no emiten `<meta property="og:site_name">` en absoluto** (ni antes ni después de esta corrección). Causa: el objeto `openGraph` de Next.js Metadata API no hace *deep merge* entre `layout.tsx` y el `generateMetadata` de cada página — cuando una página define su propio `openGraph` (como Home y `calculadora-ahorro`) sin repetir `siteName`, ese campo simplemente desaparece del HTML en lugar de heredarse del layout padre. Es un comportamiento preexistente de arquitectura de metadata, no una inconsistencia de *valor* de `siteName` (que era el objetivo de esta tarea), y corregirlo requeriría tocar el objeto `openGraph` de cada página individualmente — fuera del alcance de un cambio atómico. Se documenta aquí como candidato a una tarea técnica futura independiente (p. ej. `SEO-OG-SITENAME-INHERITANCE-01`).

## 9. Decisión final

`SEO-SITENAME-UNIFY-01` queda **completada**. El sitio unifica de forma consistente:
- La entidad editorial/organización en `MetodoKakebo.com` (metadata, OG, JSON-LD `Organization`, `publisher`, `author` de schema).
- El producto/app en `Kakebo AI`, mantenido como entidad distinta y complementaria (ya correcto y no modificado).
- El concepto del método japonés en `método Kakebo`, sin cambios de contenido.

No quedan inconsistencias de `siteName` ni de `Organization.name` en `src/`. Se documenta un hallazgo adyacente de autoría (`Person.name: "Aitor Almu"`) para una tarea futura independiente.

---

*SEO_SITENAME_UNIFY_01.md — creado 2026-07-09*
*Cambio atómico — 2 archivos, 1 línea cada uno — sin cambios de contenido editorial, UI, funcionalidad, canonical, hreflang, sitemap ni robots*
