# RENDER_MAP_01 — Modo de renderizado e indexación por ruta

Rama: `feat/render-map-ssg-ssr-csr` (base `71bfa98`, = `origin/feat/anthropic-provider-migration`).
Next 16.1.2 App Router, next-intl 4 (prefijo `as-needed`), grupos `(landing)` y `(public)`.
Test de regresión: `src/__tests__/seo/render-map.test.ts` (constante `ROUTE_RENDER_MAP`; falla si aparece un `page.tsx` sin clasificar).

## Leyenda

| Modo | Significado |
|---|---|
| SSG | Prerenderizada en build, sin dependencia de la petición. `setRequestLocale(locale)` + `generateStaticParams` si hay segmento dinámico. |
| SSG + isla CSR | Página servidor estática con componentes `"use client"`. Texto, H1, FAQ y JSON-LD en el HTML inicial. |
| SSR | Depende de usuario/petición (sesión Supabase, `searchParams`, `force-dynamic`). |
| CSR | Página mínima que monta un `*Client`; datos cargados en el navegador. El shell sale prerenderizado (● en el build) pero sin contenido propio. |
| REDIRECT | Sin página: redirección declarada en `next.config.ts` (307), o página que solo hace `redirect()`. |
| API | Route handler dinámico. |

## Tabla final

Todas las rutas existen en `/` (ES, sin prefijo) y `/en/` (EN), salvo las pSEO/plantillas que solo tienen ES.

| Ruta | Grupo | Modo | Indexación | Justificación | Verificación |
|---|---|---|---|---|---|
| `/` | (public) | SSG | index | Landing, contenido fijo | build ●; curl 200, `s-maxage=31536000`, `index, follow` |
| `/blog` | (public) | SSG | index | Listado de MDX en build | build ●; test |
| `/blog/[slug]` | (public) | SSG | index (noindex por post vía frontmatter) | MDX en build, `generateStaticParams` por locale+slug | build ●; curl `plantilla-kakebo-excel` 200 `index, follow` |
| `/tutorial` | (public) | SSG | index | Contenido fijo | build ●; test |
| `/sobre-nosotros` | (public) | SSG | index | Contenido fijo | build ●; test |
| `/herramientas` | (public) | SSG | index | Hub de herramientas | build ●; test |
| `/privacy`, `/terms`, `/cookies` | raíz [locale] | SSG | index | Legales fijas | build ●; test |
| `/plantillas/[slug]` | (public) | SSG (pSEO, `dynamicParams=false`) | index | JSON en build | build ●; curl `kakebo-para-imprimir` `index, follow` |
| `/ahorro-entrada-vivienda` | (public) | SSG (pSEO, `dynamicParams=false`) | index | Hub pSEO | build ●; test |
| `/ahorro-entrada-vivienda/[provincia]` | (public) | SSG (pSEO, `dynamicParams=false`) | index | Datos estáticos por provincia | build ●; curl `madrid` `index, follow` |
| `/herramientas/calculadora-ahorro` | (public) | SSG + isla CSR | index | Calculadora cliente; texto/FAQ/JSON-LD en servidor | build ●; curl `index, follow`, h1 en HTML |
| `/herramientas/calculadora-inflacion` | (landing) | SSG + isla CSR | index | Ídem | build ●; test |
| `/herramientas/regla-50-30-20` | (landing) | SSG + isla CSR | index | Ídem | build ●; test |
| `/herramientas/plantilla-kakebo-excel-premium` | (public) | SSG + isla CSR | index | Botones de compra cliente | build ●; curl `index, follow` |
| `/login` | raíz [locale] | SSG + isla CSR (page cliente, shell estático) | **noindex, follow** | Sin valor de búsqueda; fuera del sitemap | curl `/login` y `/en/login`: `noindex, follow`; sitemap sin `login` |
| `/auth/callback` | raíz [locale] | CSR | **noindex, nofollow** | Callback OAuth en navegador | curl `noindex, nofollow` (layout nuevo) |
| `/app` | app | SSR | noindex | Lee sesión Supabase y `searchParams` en servidor | build ƒ; curl `private, no-store`, `noindex, nofollow` |
| `/app/agent` | app | SSR | noindex | `force-dynamic`, lee acceso Plus | build ƒ |
| `/app/scanner` | app | SSR | noindex | `force-dynamic`, `createClient` servidor | build ƒ; curl `private, no-store`, `noindex, nofollow` |
| `/app/subscription` | app | SSR | noindex | `force-dynamic`, `searchParams`, acceso Plus | build ƒ; curl `noindex, nofollow` |
| `/app/admin` | app | CSR | noindex | Envoltorio de `AdminClient` | build ●; test |
| `/app/ai-metrics` | app | CSR | noindex | Envoltorio de `AIMetricsClient` (el build lo marca ƒ: ver notas) | build ƒ; test |
| `/app/cancel-subscription` | app | CSR | noindex | Envoltorio de `CancelClient` | build ●; test |
| `/app/fixed` | app | CSR | noindex | Page `"use client"`, Supabase en navegador | build ●; test |
| `/app/history` | app | CSR | noindex | Page `"use client"` | build ●; curl `noindex, nofollow` |
| `/app/history/[ym]` | app | CSR | noindex | Page `"use client"`, sin `generateStaticParams` | build ƒ; test |
| `/app/new`, `/app/new-income` | app | CSR | noindex | Envoltorios de `*Client` | build ●; test |
| `/app/settings` | app | CSR | noindex | Envoltorio de `SettingsClient` | build ●; curl `noindex, nofollow` |
| `/app/fixed-expenses` | app | REDIRECT → `/app/fixed` | noindex (layout) | `redirect()` puro | test |
| `/history`, `/history/:ym`, `/settings`, `/new` (y `/en/...`) | next.config.ts | REDIRECT 307 → `/app/*` (sin page.tsx) | n/a | Redirección de plataforma, sin invocar páginas en servidor; conserva idioma y query | curl 307 con `Location` (incl. `/new?ym=2026-11`) |
| `/api/*` (incl. `/api/og`) | api | API | no indexable | Route handlers dinámicos; `/api/og` no se toca | build ƒ |

## Cambios realizados

1. **`/login`**: `robots: { index: false, follow: true }` en `login/layout.tsx` (canonical y alternates intactos); eliminado de `sitemap.ts`; test de sitemap actualizado.
2. **`/auth/callback`**: la página es cliente y heredaba el robots global (indexable en producción). Nuevo `auth/callback/layout.tsx` con `robots: { index: false, follow: false }` (metadata de servidor).
3. **`setRequestLocale(locale)`** añadido a 9 páginas SSG que no lo llamaban (home, blog, herramientas, sobre-nosotros, plantillas/[slug], calculadora-ahorro, calculadora-inflacion, regla-50-30-20, plantilla-excel-premium). Ya eran ● porque usan `getTranslations({ locale })` explícito; ahora quedan blindadas.
4. Tests existentes que mockean `next-intl/server` ampliados con `setRequestLocale: vi.fn()` (mismo patrón que `vivienda.test.ts`).

5. **`robots.ts`**: bloquea `/api/`, las redirecciones heredadas con y sin prefijo `/en` (`/history`, `/settings`, `/new`) y `?utm_`; `/app`, `/auth/`, `/docs/`, `?mode=` y `?ym=` no se bloquean porque sirven `noindex`; disallow total en `VERCEL_ENV=preview` y sitemap con URL fija `https://www.metodokakebo.com/sitemap.xml`.

## Notas y puntos abiertos

- **Rutas heredadas**: ya no existen como páginas. Las 4 (`/history`, `/history/:ym`, `/settings`, `/new`) eran `redirect()` puros y ahora son 8 redirecciones 307 en `next.config.ts` (con y sin `/en`, conservando la query). No emiten HTML, así que el noindex efectivo es el de la página destino (`/app/*`). Se eliminaron los 4 `page.tsx`, por lo que desaparecen del mapa y del build (`/[locale]/new` ya no es ruta dinámica).
- `/app/ai-metrics` y `/app/history/[ym]` aparecen como ƒ en el build (el primero lee `params` de forma síncrona; el segundo no tiene `generateStaticParams`). Irrelevante para SEO (noindex); no se modifica.
- `/` y `/tutorial` declaran `robots: { index: true }` explícito, lo que **anula** el gating por entorno del layout raíz (`NEXT_PUBLIC_APP_URL`): en un preview esas dos rutas saldrían indexables. No se cambia aquí; conviene revisarlo.
- El gating de indexación depende de `NEXT_PUBLIC_APP_URL === "https://www.metodokakebo.com"` **en build**. La verificación `index, follow` se hizo con un build con esa variable; sin ella todo el sitio sale `noindex` (comportamiento previsto en previews/local).
- Lint: 1 error preexistente (`NewsletterConfirmationNotice.tsx:34`, `setState` en efecto), idéntico en la línea base.

## Tabla de `next build` (tal como salió, tras eliminar las rutas heredadas)

```
Route (app)
┌ ○ /_not-found
├ ● /[locale]
│ ├ /en
│ └ /es
├ ● /[locale]/ahorro-entrada-vivienda
│ └ /es/ahorro-entrada-vivienda
├ ● /[locale]/ahorro-entrada-vivienda/[provincia]
│ ├ /es/ahorro-entrada-vivienda/malaga
│ ├ /es/ahorro-entrada-vivienda/sevilla
│ ├ /es/ahorro-entrada-vivienda/zaragoza
│ └ [+9 more paths]
├ ƒ /[locale]/app
├ ● /[locale]/app/admin
│ ├ /en/app/admin
│ └ /es/app/admin
├ ƒ /[locale]/app/agent
├ ƒ /[locale]/app/ai-metrics
├ ● /[locale]/app/cancel-subscription
│ ├ /en/app/cancel-subscription
│ └ /es/app/cancel-subscription
├ ● /[locale]/app/fixed
│ ├ /en/app/fixed
│ └ /es/app/fixed
├ ● /[locale]/app/fixed-expenses
│ ├ /en/app/fixed-expenses
│ └ /es/app/fixed-expenses
├ ● /[locale]/app/history
│ ├ /en/app/history
│ └ /es/app/history
├ ƒ /[locale]/app/history/[ym]
├ ● /[locale]/app/new
│ ├ /en/app/new
│ └ /es/app/new
├ ● /[locale]/app/new-income
│ ├ /en/app/new-income
│ └ /es/app/new-income
├ ƒ /[locale]/app/scanner
├ ● /[locale]/app/settings
│ ├ /en/app/settings
│ └ /es/app/settings
├ ƒ /[locale]/app/subscription
├ ● /[locale]/auth/callback
│ ├ /en/auth/callback
│ └ /es/auth/callback
├ ● /[locale]/blog
│ ├ /en/blog
│ └ /es/blog
├ ● /[locale]/blog/[slug]
│ ├ /en/blog/como-hacer-un-presupuesto-personal
│ ├ /en/blog/como-ahorrar-dinero-cada-mes
│ ├ /en/blog/kakebo-online-guia-completa
│ └ [+30 more paths]
├ ● /[locale]/cookies
│ ├ /en/cookies
│ └ /es/cookies
├ ● /[locale]/herramientas
│ ├ /en/herramientas
│ └ /es/herramientas
├ ● /[locale]/herramientas/calculadora-ahorro
│ ├ /en/herramientas/calculadora-ahorro
│ └ /es/herramientas/calculadora-ahorro
├ ● /[locale]/herramientas/calculadora-inflacion
│ ├ /en/herramientas/calculadora-inflacion
│ └ /es/herramientas/calculadora-inflacion
├ ● /[locale]/herramientas/plantilla-kakebo-excel-premium
│ ├ /en/herramientas/plantilla-kakebo-excel-premium
│ └ /es/herramientas/plantilla-kakebo-excel-premium
├ ● /[locale]/herramientas/regla-50-30-20
│ ├ /en/herramientas/regla-50-30-20
│ └ /es/herramientas/regla-50-30-20
├ ● /[locale]/login
│ ├ /en/login
│ └ /es/login
├ ● /[locale]/plantillas/[slug]
│ ├ /es/plantillas/kakebo-para-imprimir
│ └ /es/plantillas/kakebo-2027
├ ● /[locale]/privacy
│ ├ /en/privacy
│ └ /es/privacy
├ ● /[locale]/sobre-nosotros
│ ├ /en/sobre-nosotros
│ └ /es/sobre-nosotros
├ ● /[locale]/terms
│ ├ /en/terms
│ └ /es/terms
├ ● /[locale]/tutorial
│ ├ /en/tutorial
│ └ /es/tutorial
├ ƒ /api/admin/grant-vip
├ ƒ /api/admin/list-vip-users
├ ƒ /api/admin/marketing-audience
├ ƒ /api/admin/marketing-campaign
├ ƒ /api/ai/agent
├ ƒ /api/ai/agent-v2
├ ƒ /api/ai/agent-v2/cancel-confirmation
├ ƒ /api/ai/agent-v2/stream
├ ƒ /api/ai/assistant
├ ƒ /api/ai/classify
├ ƒ /api/ai/feedback
├ ƒ /api/ai/metrics
├ ƒ /api/ai/migrate-embeddings
├ ƒ /api/ai/process-embeddings
├ ƒ /api/ai/search
├ ƒ /api/communication-preferences
├ ƒ /api/cron/marketing
├ ƒ /api/docs
├ ƒ /api/expenses
├ ƒ /api/expenses/[id]
├ ƒ /api/fixed-expenses
├ ƒ /api/fixed-expenses/[id]
├ ƒ /api/health
├ ƒ /api/incomes
├ ƒ /api/marketing/leads
├ ƒ /api/marketing/leads/confirm
├ ƒ /api/marketing/leads/unsubscribe
├ ƒ /api/marketing/unsubscribe
├ ƒ /api/months
├ ƒ /api/months/[id]
├ ƒ /api/og
├ ƒ /api/premium/checkout
├ ƒ /api/premium/claim
├ ƒ /api/premium/download
├ ƒ /api/reports
├ ƒ /api/scanner/capability
├ ƒ /api/scanner/cleanup
├ ƒ /api/scanner/quota
├ ƒ /api/scanner/tickets
├ ƒ /api/scanner/tickets/[ticketId]
├ ƒ /api/scanner/tickets/[ticketId]/complete-upload
├ ƒ /api/scanner/tickets/[ticketId]/confirm
├ ƒ /api/scanner/tickets/[ticketId]/discard
├ ƒ /api/scanner/tickets/[ticketId]/draft
├ ƒ /api/scanner/tickets/[ticketId]/process
├ ƒ /api/scanner/tickets/[ticketId]/upload-authorization
├ ƒ /api/settings
├ ƒ /api/stripe/cancel
├ ƒ /api/stripe/checkout
├ ƒ /api/stripe/portal
├ ƒ /api/stripe/sync
├ ƒ /api/webhooks/stripe
├ ƒ /api/webhooks/stripe-subscriptions
├ ○ /icon.png
├ ○ /manifest.webmanifest
├ ○ /robots.txt
└ ○ /sitemap.xml


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```
