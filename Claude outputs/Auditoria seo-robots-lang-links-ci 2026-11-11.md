# Auditoría seo-robots-lang-links-ci — 2026-11-11

Cinco ramas, todas creadas desde `main` (`b84c92b`), empujadas, sin merge, sin despliegue, sin tocar Vercel ni borrar ramas.

| Tarea | Rama | Commit |
|---|---|---|
| A · robots sin `?utm_` | `seo-robots-utm` | `abf6474` (sobre `822b10f`, cherry-pick de `2f64bd4`) |
| B · selector de idioma como enlace | `seo-lang-switch-links` | `7e865b4` |
| C · enlaces internos | `seo-internal-links-uncrawled` | `cf1d156` |
| D · línea base de CI | `fix-ci-baseline` | `2f6133c` |
| E · versionar audit de logs | `chore-audit-logs` | `5111513` + este informe |

## 1. Por tarea: ficheros y cambios

### A · `seo-robots-utm`
- `src/app/robots.ts`: se retiran `/*?utm_` y `/*&utm_` (resto intacto: `/api/`, rutas heredadas, bloqueo de previews, sitemap). No había otro sitio que las duplicara (`grep utm_`).
- `src/__tests__/seo/robots-noindex.test.ts`: las dos URL `?utm_` salen de `BLOCKED_PATHS` y `?ref=`, `?utm_*` pasan a `INDEXABLE_PATHS`.
- `src/__tests__/seo/tracking-params-canonical.test.tsx` (del cherry-pick): `?utm_` y `?ref=` ya no están bloqueados y ninguna regla contiene `utm_`.
- `README.md`, `CHANGELOG.md`, `docs/seo/ESTADO_SEO_TECNICO_2026-11-11.md`, `docs/seo/RENDER_MAP_01.md` y el informe anterior de parámetros: texto actualizado.
- `next build && next start`: `/robots.txt` tiene 0 líneas con `utm_`; `/?utm_source=test`, `/blog?a=1&utm_medium=y` y `/?ref=producthunt` dan 200 con `x-nextjs-prerender: 1` y canonical limpia.

### B · `seo-lang-switch-links`
- **Qué era:** `src/components/LanguageSwitcher.tsx` es un componente cliente con un `<button>` y `router.replace(pathname, { locale })`. Sin `<a href>`, por eso no había enlaces a `/en` en el HTML estático. Se usa en `Navbar.tsx` (2 veces) y `TopNav.tsx` (2 veces).
- **Cambios:**
  - `src/components/LanguageSwitcher.tsx`: ES → EN es un `Link` de next-intl con `locale="en"` (genera `<a hrefLang="en" href="/en/…">`). EN → ES es un `next/link` a la ruta sin prefijo: el `Link` de next-intl con `locale="es"` genera `href="/es/…"` (un 308), así que se evitó. Mismas clases, `aria-label` y estructura interna; `replace` y `prefetch={false}`. No lee `searchParams`, `headers()` ni `cookies()`.
  - `src/lib/lang-switch.ts` (nuevo): `englishEquivalentLinkable(pathname)`. Solo se emite el enlace si existe la versión EN **y es indexable**. Si no, se conserva el botón anterior.
  - Tests: `lang-switch.test.ts` (la lista contra los `.mdx`), `LanguageSwitcher.test.tsx` (12 casos con el `Link` real) y un ajuste en `premium-seo-pass.test.tsx`, que buscaba `role="button"`.
- **Verificación en el HTML del build:** 58 páginas cambian solo en el selector (`<a hrefLang aria-label href>`), 36 sin cambios y 0 con otros cambios. Los `<link rel="alternate" hrefLang>` del `<head>` son idénticos en las 94. Ejemplos: `es.html` → `href="/en"`, `es/blog.html` → `/en/blog`, `es/herramientas/calculadora-ahorro.html` → `/en/herramientas/calculadora-ahorro`; `en.html` → `href="/"`.

**Grafo (sitemap, 62 URL, desde la home):**

| | Antes (`main`) | Después (B) |
|---|---|---|
| URL del sitemap alcanzables | 45 | **62** |
| Huérfanas | 17 | **0** |
| Páginas `/en` (17) alcanzables | 0 | **17** |
| Profundidad de `/en` | n/a | `/en`: 1 · otras 13: 2 · **3: 3** |

Las tres a profundidad 3 (no cumplen el objetivo de ≤ 2) son `/en/blog/como-hacer-un-presupuesto-personal`, `/en/blog/como-ahorrar-dinero-cada-mes` y `/en/blog/eliminar-gastos-hormiga`. Se alcanzan desde `/en/blog`, desde `/en/herramientas/calculadora-ahorro` o desde su versión ES, y todas esas están a profundidad 2. Ninguna está enlazada directamente desde `/en` (la home EN solo enlaza dos artículos EN), y el selector solo enlaza páginas equivalentes.

**Sin enlace (se mantiene el botón):** 28 URL del sitio: 2 plantillas y 13 de vivienda (solo español: su `/en/…` da 404) y 13 artículos ES sin EN indexable (3 sin versión EN y 10 con EN `noindex`).

### C · `seo-internal-links-uncrawled`
- `src/content/blog/kakebo-vs-ynab.es.mdx` y `kakebo-online-guia-completa.es.mdx`: una línea cada una, añadiendo `peligros-apps-ahorro-automatico` a `related` (componente `RelatedPosts`, tarjeta con el título del artículo).
- Premisa del enunciado: en el grafo de `main` las 9 URL ya tenían **≥ 3 enlaces entrantes** y las ES profundidad ≤ 2. Solo `peligros-apps-ahorro-automatico` tenía < 3 *contextuales* (2). Se actuó solo sobre esa.

| URL | Entrantes antes → después | Contextuales* antes → después | Prof. desde `/` antes → después |
|---|---|---|---|
| `/blog/eliminar-gastos-hormiga` | 11 → 11 | 10 → 10 | 2 → 2 |
| `/blog/kakebo-sueldo-minimo` | 5 → 5 | 4 → 4 | 2 → 2 |
| `/blog/peligros-apps-ahorro-automatico` | 3 → **5** | 2 → **4** | 2 → 2 |
| `/blog/regla-30-dias` | 4 → 4 | 3 → 3 | 2 → 2 |
| `/herramientas/regla-50-30-20` | 53 → 53 | 23 → 23 | 1 → 1 |
| `/en/blog/como-ahorrar-dinero-cada-mes` | 5 → 5 | 4 → 4 | 2 desde `/en` |
| `/en/herramientas/calculadora-inflacion` | 35 → 35 | 18 → 18 | 1 desde `/en` |
| `/en/herramientas/regla-50-30-20` | 35 → 35 | 18 → 18 | 1 desde `/en` |
| `/en/terms` | 35 → 35 | 19 → 19 | 1 desde `/en` |

\*Contextuales: sin `/app/*`, login, páginas legales, índices `/blog` y `/herramientas`, ni vivienda.

`/en/terms` ya estaba enlazada desde el footer EN. Las URL `/en/*` no tienen profundidad desde `/` en `main` (de eso se encarga B: `/en` queda a 1 clic, así que +1).

### D · `fix-ci-baseline`
- `src/components/mdx/NewsletterConfirmationNotice.tsx`: lee la query con `useSyncExternalStore` (snapshot `""` en servidor, así que no cambia la hidratación) y ajusta el estado durante el render en vez de `setState` en un efecto. El efecto solo limpia la URL. Mismo comportamiento visible; sus 4 tests pasan.
- 6 archivos de test corregidos (ver tabla).

**Clasificación de los 10 fallos:**

| # | Test | Causa raíz | Clase | Arreglo |
|---|---|---|---|---|
| 1 | `Navbar.test.tsx` · menú móvil | El mock de `useTranslations` no tiene `menuOpen`/`menuClose`; el botón tomaba su nombre de esas claves y el test buscaba «menú» | (i) test | Añadidas las dos claves al mock |
| 2-5 | `plus-pages-and-nav.test.tsx` · flag apagado (×4) | Buscaba el texto «Acceso Completo Gratuito»; la pantalla `LegacyFreePlan` se rediseñó y ahora dice «Plan actual: gratuito» | (i) test | Texto actualizado; el resto de aserciones (sin botones, sin consultas) intactas |
| 6 | `authIntent.test.ts` | Esperaba `source=a%20b%26c`; `URLSearchParams` codifica el espacio como `+` (equivalente en una query) | (i) test | Se espera `a+b%26c` y se comprueba que el valor se recupera como `a b&c` |
| 7 | `plus-foundation-sql-behavior.test.ts` | Suponía que las migraciones Plus son las 7 últimas; después se añadieron 3 migraciones de marketing | (i) test | Comprueba que forman un bloque contiguo y ordenado |
| 8 | `plus-migrations-guard.test.ts` · versiones | Mismo supuesto (Plus como las últimas) | (i) test | Bloque contiguo, posterior a todo lo anterior |
| 9 | `plus-migrations-guard.test.ts` · pack premium | Línea base `b8e9468` desfasada: cambios legítimos posteriores (`120056c` analítica de checkout, `1615788` textos legales) | (i) test | Base `1615788` |
| 10 | `plus-stripe-guards.test.ts` · pack premium | Igual que el 9 | (i) test | Base `1615788` |

Ninguno es defecto del código ni dependencia de entorno (no se ha omitido ningún test). Los de los puntos 9 y 10 ya se saltan solos si no hay git o la referencia.

### E · `chore-audit-logs`
- `5111513`: `scripts/audit-access-logs.mjs`, `docs/seo/AUDIT_ACCESS_LOGS.md` y el script `audit:logs` de `package.json`, sin modificar. `node --check` pasa; `npm run audit:logs -- --help` y sin argumentos muestran el uso (exit 0). Los tres estaban en el árbol de trabajo.

## 2. Verificación frente a la línea base de `main`
Línea base: lint 1 error + 66 warnings; tests 10 fallos en 6 archivos.

| Comando | A | B | C | D | E |
|---|---|---|---|---|---|
| `type-check` | exit 0 | exit 0 | exit 0 | exit 0 | exit 0 |
| `lint` | 1 error / 66 w (igual) | igual | igual | **0 errores** / 66 w | igual |
| `test` | 10 fallos (igual), 2813 ok | 10 fallos (igual), 2803 ok* | 10 fallos (igual), 2782 ok | **0 fallos**, 2792 ok | 10 fallos (igual), 2782 ok |
| `test:graph` | 92 pág., 0 huérfanas | ídem | ídem | ídem | ídem |
| `build` | exit 0 | exit 0 | exit 0 | exit 0 | exit 0 |

\*B introdujo 2 fallos (el selector ya no tiene `role="button"` en `premium-seo-pass.test.tsx`); se corrigió el test en la misma rama y quedó en 10.
Ninguna rama introduce fallos nuevos; D reduce la línea base a cero.

## 3. Riesgos y decisiones tomadas sin consultar
- **A:** al quitar `?utm_` Googlebot podrá rastrear esas URL (las sirve el CDN y su canonical es la URL limpia). Es lo que se buscaba, pero el rastreo de variantes puede subir. Conviene vigilar en Search Console el informe «Indexada, pero bloqueada por robots.txt» para ver si esas URL desaparecen.
- **A:** el cherry-pick de `2f64bd4` trajo también el informe anterior; se le añadió una nota de actualización.
- **B:** el selector solo enlaza páginas con equivalente EN **indexable** (decisión conservadora): evita enlaces a 404 y a páginas `noindex`. Quedan 28 URL con botón sin `href`.
- **B:** en EN → ES se usa `next/link` en lugar del `Link` de next-intl para no emitir `/es/…` (un 308). Si había una cookie de idioma que dependiera de `router.replace`, no la he comprobado (la detección está desactivada, así que no afecta al ruteo).
- **B:** las páginas `/app/*` (noindex) también pasan a mostrar enlace en su `TopNav`.
- **B:** 3 páginas EN quedan a profundidad 3 desde la home (objetivo ≤ 2 no alcanzado en esas 3).
- **C:** solo se tocó 1 de las 9 URL: el resto ya cumplía en el grafo. El cambio añade una tarjeta visible en «Artículos relacionados» de 2 artículos.
- **D:** las correcciones de los puntos 9 y 10 mueven la base de la guarda del pack premium a `1615788`: protege contra cambios posteriores a esa fecha, no contra los anteriores (ya revisados y en producción).
- **D:** el arreglo del lint usa un ajuste de estado durante el render; está documentado en React, pero es un patrón menos habitual.
- **Todas:** `package.json` solo se versiona en `chore-audit-logs`; en las demás ramas quedó sin commitear con tu cambio.
