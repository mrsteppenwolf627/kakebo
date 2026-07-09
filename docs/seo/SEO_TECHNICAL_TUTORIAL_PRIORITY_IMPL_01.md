# SEO_TECHNICAL_TUTORIAL_PRIORITY_IMPL_01 — Ajuste de prioridad sitemap de /tutorial

**Fecha:** 2026-07-09
**Tarea:** SEO-TECHNICAL-TUTORIAL-PRIORITY-IMPL-01
**Tipo:** Corrección técnica de sitemap — cambio atómico
**Commit de referencia (HEAD antes de esta tarea):** `0490071`

---

## 1. Decisión aplicada

Implementa la recomendación de `SEO-TECHNICAL-TUTORIAL-PRIORITY-01` (`docs/seo/SEO_TECHNICAL_TUTORIAL_PRIORITY_01.md`, opción B — "mantener indexada, sin priorizar"): bajar la `priority` de `/tutorial` en el sitemap de `0.8` a `0.5`, para que la señal de prioridad de crawl refleje su función real de onboarding de producto en lugar de tratarla como una URL de captación SEO principal.

## 2. Valor anterior / valor nuevo

| Campo | Antes | Después |
|---|---|---|
| `priority` de `/tutorial` en `coreRoutes` | `0.8` | `0.5` |

## 3. Archivo modificado

`src/app/sitemap.ts` — 1 línea (línea 18 del array `coreRoutes`)

```diff
- { path: '/tutorial', priority: 0.8, changeFrequency: 'monthly' as const },
+ { path: '/tutorial', priority: 0.5, changeFrequency: 'monthly' as const },
```

`changeFrequency` (`'monthly'`) no se tocó. Ninguna otra entrada de `coreRoutes` se modificó.

## 4. Qué se dejó fuera de alcance

- `title`, `H1`, meta description, `canonical`, `hreflang`, `openGraph`, `robots` y contenido de `src/app/[locale]/(public)/tutorial/page.tsx` — sin tocar.
- No se añadió JSON-LD a `/tutorial` (ausencia ya documentada en la auditoría previa como observación adyacente, no como objetivo de esta tarea).
- No se aplicó `noindex`.
- No se hizo ninguna redirección.
- Prioridades del resto de `coreRoutes` (`sobre-nosotros: 0.7`, `blog: 0.8`, `herramientas: 0.8`, herramientas individuales: `0.9`, páginas legales: `0.1`) — sin cambios.
- El hallazgo de posible solapamiento de intención entre `/tutorial` y `/blog/metodo-kakebo-guia-definitiva` (documentado en la auditoría previa) — sigue pendiente de validación con datos GSC, no se actúa sobre él en esta tarea.
- Artículos de blog, herramientas y `/blog/plantilla-kakebo-excel` — sin tocar.

## 5. Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| `npm run build` | ✅ Compilación exitosa, todas las rutas generadas sin error |
| `npm run lint` | ✅ 0 errores, 76 warnings preexistentes (ninguno en `sitemap.ts`) |
| `npx tsc --noEmit` | ✅ 0 errores de tipado |
| `/sitemap.xml` (render local, `npm run dev`) | ✅ `/tutorial` (ES) y `/en/tutorial` presentes, ambas con `<priority>0.5</priority>` |
| `/sitemap.xml` — resto de `coreRoutes` | ✅ Sin cambios (`/sobre-nosotros: 0.7`, etc., verificado en el XML generado) |
| Render local — `GET /tutorial` | ✅ HTTP 200 |
| Render local — `title` | ✅ Sin cambios: `"Cómo usar el Método Kakebo \| Tutorial completo de Ahorro"` |
| Render local — `canonical` | ✅ Sin cambios: `https://www.metodokakebo.com/tutorial` |
| Render local — H1 | ✅ Sin cambios: `"Tutorial del Método Kakebo"` |
| Render local — `<meta name="robots">` | ✅ Sin cambios: `"index, follow"` — sigue indexable |
| Render local — `og:site_name` | ✅ Sin cambios: `"MetodoKakebo.com"` |

## 6. Confirmación: /tutorial sigue en el sitemap

Sí. `/tutorial` y `/en/tutorial` siguen presentes en `/sitemap.xml` con `changefreq: monthly` y ahora `priority: 0.5` (antes `0.8`). No se ha eliminado del sitemap ni se ha marcado como no indexable.

## 7. Decisión final

`SEO-TECHNICAL-TUTORIAL-PRIORITY-IMPL-01` queda **completada**. Cierra formalmente el hallazgo T-12 de `SEO_GEO_DEEP_AUDIT_01.md`, abierto desde `SEO-TECHNICAL-TUTORIAL-01` (2026-07-01) y confirmado por la auditoría `SEO-TECHNICAL-TUTORIAL-PRIORITY-01` (2026-07-09). `/tutorial` permanece indexada y funcional, ahora con una señal de prioridad de sitemap coherente con su rol real de onboarding de producto.

---

*SEO_TECHNICAL_TUTORIAL_PRIORITY_IMPL_01.md — creado 2026-07-09*
*Cambio atómico — 1 archivo, 1 línea — sin cambios de contenido, metadata, canonical, hreflang, robots ni schema*
