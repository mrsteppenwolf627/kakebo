# Auditoría de URLs con parámetro de seguimiento — 2026-11-11

> **Actualización (rama `seo-robots-utm`):** las reglas `/*?utm_` y `/*&utm_` de `robots.ts` se han retirado; donde este informe dice que `utm_` está bloqueado, describe el estado anterior.

Rama: `seo-params-canonical` (desde `main` = `b84c92b`). Sin merge, sin despliegue, sin cambios de configuración de Vercel.

## Resumen
- **El problema de partida no existe en el código.** `/?ref=producthunt` ya declara como canonical la URL limpia (`https://www.metodokakebo.com`), no a sí misma. Devuelve 200 con la home estática servida desde el CDN (`X-Vercel-Cache: HIT`, misma `Age` que `/`).
- **Decisión: opción (a)**, que ya es el comportamiento actual. El cambio de esta rama es solo de protección: 28 tests de regresión que fijan ese comportamiento. No hay cambios en código de aplicación, `robots.ts` ni `middleware.ts`.

## Fase A · Evidencia (producción, sin seguir redirecciones)

| URL | Código | Cache-Control | X-Vercel-Cache | Canonical | robots meta | og:url |
|---|---|---|---|---|---|---|
| `/` | 200 | `public, max-age=0, must-revalidate` | HIT | `https://www.metodokakebo.com` | `index, follow` | `https://www.metodokakebo.com` |
| `/?ref=producthunt` | 200 | idem | HIT (Age idéntica a `/`) | `https://www.metodokakebo.com` | `index, follow` | idem |
| `/?utm_source=test` | 200 | idem | HIT | `https://www.metodokakebo.com` | `index, follow` | idem |
| `/?ref=x&utm_medium=y` | 200 | idem | HIT | `https://www.metodokakebo.com` | `index, follow` | idem |
| `/blog?ref=producthunt` | 200 | idem | HIT | `https://www.metodokakebo.com/blog` | `index, follow` | (no declara) |
| `/en?ref=producthunt` | 200 | idem | HIT | `https://www.metodokakebo.com/en` | `index, follow` | `https://www.metodokakebo.com/en` |

- Ninguna lleva `X-Robots-Tag`. La cabecera `Link` es la misma que la de la URL limpia: `hreflang` es, en y x-default sin parámetros. En el HTML, `<link rel="alternate" hrefLang>` también va sin parámetros.
- **Canonical de `/?ref=producthunt`: apunta a `/` sin parámetro**, no a sí misma.

## Fase A · Código
- **Canonical y alternates:** cada página fija una cadena absoluta en `generateMetadata({ params })` (por ejemplo `src/app/[locale]/(public)/page.tsx:30`, `blog/page.tsx`, `herramientas/...`). Nunca recibe `searchParams`, así que no puede incluir la query. Tampoco hay helper de URL que la lea.
- **robots.ts:** bloquea `/api/`, `/history`, `/settings`, `/new` (con y sin `/en`), `/*?utm_` y `/*&utm_`. `?ref=` no está bloqueado.
- **sitemap.ts:** emite 62 URL limpias, sin parámetros (comprobado en el build y en producción).
- **middleware.ts:** solo `next-intl` (prefijo de idioma y `Link` de hreflang). No lee ni reescribe la query.
- **Parámetro `ref`:** ningún código lo lee (ni `searchParams`, ni `useSearchParams`, ni `document.referrer`, ni eventos de analítica). Solo aparece como parámetro en URLs externas. La atribución es de GA4, que en `gtag('config', id)` (`GoogleAnalytics.tsx`) envía la `page_location` completa desde el navegador, con `?ref=` incluido. Es lectura en cliente; el servidor no interviene.
- **SSG:** ninguna página pública ni layout público usa `searchParams`, `headers()`, `cookies()` ni `force-dynamic`. La home es `● /[locale]` (SSG) en el build. Leer `ref` en servidor sí la volvería dinámica.

## Fase A · Parámetros de seguimiento y su tratamiento

| Parámetro | Origen | Canonical | robots.txt | Redirección |
|---|---|---|---|---|
| `ref` | Enlaces externos (Product Hunt) | URL limpia | Permitido | No |
| `utm_*` | Campañas externas | URL limpia | **Bloqueado** (`/*?utm_`, `/*&utm_`) | No |
| `source` | Interno: `/login?source=…` (atribución de la app) | `/login` limpia; la página lleva `noindex` | Permitido | No |
| `mode` | `/login?mode=signup` o `?mode=login` | `/login` limpia; `noindex` | Permitido | No |
| `ym` | `/app?ym=…` (panel) | no aplica; `noindex` | Permitido | No |
| `newsletter`, `checkout` | Retornos de flujos; el cliente los quita con `history.replaceState` | URL limpia | Permitido | No |
| `page` | **No existe**: el sitio no pagina | URL limpia | Permitido | No |

## Fase B · Decisión
**(a) Canonical a la URL limpia en todas las variantes, sin redirigir.** Es lo que hay hoy, y conserva todo lo que se pide:
- No rompe el SSG ni el caché del CDN: el servidor ignora la query y sirve el mismo HTML estático (comprobado en producción y con `next start`).
- No rompe GA4: el navegador conserva `?ref=` y GA4 lo recibe en `page_location`.
- No toca parámetros legítimos: `?mode=`, `?ym=`, `?source=` siguen funcionando.

**Por qué no (b), redirección 308:** el navegador llegaría a `/` sin `?ref=` y GA4 perdería la atribución, salvo que el middleware la capturara antes, y hoy no existe esa captura. Además añadiría un salto por cada visita y por cada rastreo de Googlebot, sin ningún beneficio de indexación sobre el canonical.

**Por qué no (c), bloqueo en `robots.txt`:** impide que Google descargue la página y vea la canonical limpia. Por eso `?ref=` se deja rastreable.

**`/?page=N`:** el sitio no tiene paginación. Cualquier `?page=N` tiene hoy como canonical la URL limpia, y esta rama no cambia eso.

## Fase C · Cambios
Un solo archivo nuevo: `src/__tests__/seo/tracking-params-canonical.test.tsx` (28 tests):
1. Canonical limpia con y sin `?ref=`, `?utm_*`, `?source=` y `?page=` en home (ES/EN), calculadora de ahorro (ES/EN) y login (ES). Sin `?` ni `#`, y los `hreflang` no cambian.
2. Guarda del SSG: ninguna página ni layout público (21 archivos) puede usar `searchParams`, `useSearchParams`, `headers()`, `cookies()`, `connection()`, `noStore` ni `force-dynamic`.
3. `robots.txt`: `?ref=` no está bloqueado y `?utm_` sigue bloqueado.

Sin cambios en `src/app`, `robots.ts`, `middleware.ts` ni en la configuración.

## Fase C · Resultados de los comandos (en la rama)

| Comando | Resultado |
|---|---|
| `npm run type-check` | exit 0 |
| `npm run lint` | exit 1 por **1 error preexistente**: `src/components/mdx/NewsletterConfirmationNotice.tsx:34:5` («Calling setState synchronously within an effect can trigger cascading renders»). 66 warnings, igual que en `main` |
| `npm run test` (vitest) | 2810 pasan, 10 fallan en 6 archivos: **los mismos 10 de `main`** (Navbar, plus-pages-and-nav ×4, authIntent, plus-foundation-sql-behavior, plus-migrations-guard ×2, plus-stripe-guards); no los toca esta rama. Los 28 tests nuevos pasan |
| `npm run test:graph` | exit 0: 92 páginas, 62 URL, 0 huérfanas |
| `next build` | exit 0 |

### `next start` sobre el build (local, puerto 3112)
- `/`, `/?ref=producthunt`, `/?utm_source=test` y `/?ref=x&utm_medium=y`: todas con `x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`, `Cache-Control: s-maxage=31536000` y canonical `https://www.metodokakebo.com`.
- El HTML de las tres variantes con parámetro es **idéntico** al de `/` (comparación normalizada). No hay renderizado dinámico distinto.
- `/blog?ref=producthunt` y `/en?ref=producthunt`: mismas cabeceras estáticas y canonical limpia propia (`/blog`, `/en`).

## Riesgos pendientes
1. **`/*?utm_` y la canonical.** Esas URL no se pueden descargar, así que Google no ve su canonical. Si las enlaza alguien desde fuera, podrían aparecer en Search Console como «Indexada, pero bloqueada por robots.txt». Es una decisión de crawl anterior a esta rama y no la he cambiado. Conviene vigilar ese informe.
2. **Rastreo de `?ref=`.** Googlebot seguirá pidiendo variantes con parámetro. Son baratas (HIT del CDN), pero no se pueden evitar sin bloquear (c) o redirigir (b).
3. **Atribución de `ref`.** Depende de que GA4 se cargue en el cliente (consentimiento de cookies, bloqueadores). No lo he medido en GA4.
4. **La guarda del SSG** revisa el código fuente de páginas y layouts; no sustituye mirar la leyenda del build (`●` SSG, `ƒ` dinámico).
5. **Sin verificar:** no he consultado Search Console para ver cuáles de estas URL tiene Google indexadas.
