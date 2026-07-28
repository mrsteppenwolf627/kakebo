# SEO-TECH-LOGIN-METADATA-FIX-01 — Cierre

**Fecha:** 2026-07-28
**Modelo:** Claude Code
**Estado:** ✅ Completado (validación local); validación de producción pendiente de despliegue

## Causa raíz

Confirmada en `docs/seo/SEO_TECH_SITEMAP_VALIDATION_01.md`: `src/app/[locale]/login/layout.tsx`
exportaba un objeto `metadata: Metadata` **estático**, no una función `generateMetadata`
parametrizada por `locale`, a diferencia de `privacy`, `terms` y `cookies`, que sí calculan
canonical/hreflang/título dinámicamente según el idioma. Como resultado, `/login` y `/en/login`
servían exactamente la misma metadata (incluido el `title` en español para la ruta inglesa) y el
mismo `canonical` fijo `https://www.metodokakebo.com/es/login` — una URL que ni sigue el patrón
real de URLs del sitio (`localePrefix: 'as-needed'` nunca usa `/es/`) ni es un destino final (308
→ `/login`).

## Metadata anterior

```ts
export const metadata: Metadata = {
    title: "Iniciar Sesión | Kakebo",
    description: "Accede a tu cuenta de Kakebo para gestionar tus gastos y presupuestos mensuales. Método japonés de ahorro digitalizado.",
    alternates: {
        canonical: "https://www.metodokakebo.com/es/login",
        languages: {
            "es": "https://www.metodokakebo.com/es/login",
            "en": "https://www.metodokakebo.com/en/login",
            "x-default": "https://www.metodokakebo.com/es/login"
        }
    },
};
```

Idéntica para `/login` y `/en/login` — no dependía en absoluto de `locale`.

## Solución aplicada

`src/app/[locale]/login/layout.tsx` reemplaza el objeto estático por `generateMetadata({ params
})`, replicando exactamente el patrón ya usado en `privacy`/`terms`/`cookies/page.tsx`
(`getTranslations` server-side + canonical calculado a partir de `locale`):

```ts
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Auth.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}/login`,
            languages: {
                "es": "https://www.metodokakebo.com/login",
                "en": "https://www.metodokakebo.com/en/login",
                "x-default": "https://www.metodokakebo.com/login"
            }
        },
    };
}
```

Se añadió el namespace de traducción `Auth.meta` (título/descripción) en `messages/es.json` y
`messages/en.json`, siguiendo el mismo patrón `<Namespace>.meta.{title,description}` que ya usan
`Privacy`, `Rule503020`, `Savings`, etc. El `<title>`/`<description>` visibles no cambian de texto
para `/login` (se conserva el copy español exacto que ya existía); se añade por primera vez un
`<title>`/`<description>` **en inglés real** para `/en/login`, que antes servía el título español.

`login/page.tsx` (formulario de autenticación, `"use client"`) no se ha tocado: sigue siendo un
Client Component y por eso la metadata debe vivir en el `layout.tsx` del segmento, no en la
página — Next.js no permite exportar `metadata`/`generateMetadata` desde un Client Component.

## Canonical por idioma

| Locale | Canonical final |
|---|---|
| `es` (`/login`) | `https://www.metodokakebo.com/login` |
| `en` (`/en/login`) | `https://www.metodokakebo.com/en/login` |

Ninguna variante declara ya `https://www.metodokakebo.com/es/login`.

## Hreflang resultante

Idéntico para ambos locales (igual que el patrón de `privacy`/`terms`/`cookies`):

- `es` → `https://www.metodokakebo.com/login`
- `en` → `https://www.metodokakebo.com/en/login`
- `x-default` → `https://www.metodokakebo.com/login` (URL canónica española, mismo criterio que
  el resto del sitio: el locale por defecto de `routing.ts` es `es`)

Ambas URLs de destino (`/login` y `/en/login`) devuelven HTTP 200 verificado (ver sección de
validación local). Ninguna referencia a `/es/login`.

## Tratamiento de URLs con parámetros

`generateMetadata` en un `layout.tsx` de Next.js **no recibe `searchParams`** (solo las páginas los
reciben) — el canonical se construye exclusivamente a partir de `params.locale`, sin acceso alguno
a la query string. Esto garantiza por diseño, sin lógica adicional, que:

- `/login?mode=signup`
- `/login?mode=signup&source=calculadora_ahorro`
- `/login?source=calculator_503020`
- `/login?source=calculator_inflation`
- y sus equivalentes `/en/login?...`

resuelven exactamente el mismo canonical limpio que `/login` o `/en/login` sin parámetros.
Verificado explícitamente en local con `curl` sobre `/login?mode=signup&source=calculadora_ahorro`
y `/en/login?mode=signup` (ver validación local).

## Titles y descriptions resultantes

| Locale | Title | Description |
|---|---|---|
| `es` | "Iniciar Sesión \| Kakebo" (sin cambios respecto al anterior) | "Accede a tu cuenta de Kakebo para gestionar tus gastos y presupuestos mensuales. Método japonés de ahorro digitalizado." (sin cambios) |
| `en` | "Log In \| Kakebo" (**nuevo**, antes servía el título en español) | "Access your Kakebo account to manage your monthly expenses and budgets. The Japanese savings method, digitized." (**nuevo**, antes servía la descripción en español) |

## Archivos modificados

- `src/app/[locale]/login/layout.tsx` — metadata estática → `generateMetadata` dinámica.
- `messages/es.json` — añadido `Auth.meta.{title,description}` (mismo texto que la metadata
  estática anterior, ahora vía i18n).
- `messages/en.json` — añadido `Auth.meta.{title,description}` (texto nuevo en inglés real).
- `src/__tests__/app/login-metadata.test.ts` — **nuevo**, 7 tests.

No se ha modificado `login/page.tsx` (formulario, OAuth, redirects, tracking de `source`/`mode`
sin cambios), `src/app/sitemap.ts`, `robots.txt`, ni ninguna otra página legal/transaccional.

## Tests

`src/__tests__/app/login-metadata.test.ts` (7 tests, `next-intl/server` mockeado con un
diccionario determinista, independiente del contenido real de `messages/*.json`):

1. Canonical español = `https://www.metodokakebo.com/login`.
2. Canonical inglés = `https://www.metodokakebo.com/en/login`.
3. Ninguna metadata (ES o EN) contiene la cadena `/es/login`.
4. Title y description localizados correctamente por idioma.
5. `alternates.languages` exacto: `es`/`en`/`x-default` con las 2 URLs limpias esperadas.
6. `x-default` apunta al canonical español.
7. El canonical nunca contiene `?` (no hay forma de que incluya query params, dado que
   `generateMetadata` de un layout no recibe `searchParams`).

## Validación local

- `npm run build` → **PASS**.
- `npm run lint` → **0 errores** (76 warnings preexistentes, sin cambios, ningún warning nuevo).
- `npm test` → **602/603** (7 tests nuevos, todos en verde; único fallo preexistente y ajeno en
  `calculate-whatif.test.ts`, no relacionado con este fix).
- HTML renderizado localmente (`npm run start` + `curl`):
  - `/login` → HTTP 200; `<title>Iniciar Sesión | Kakebo</title>`; canonical `.../login`;
    hreflang `es→/login`, `en→/en/login`, `x-default→/login`.
  - `/en/login` → HTTP 200; `<title>Log In | Kakebo</title>` (antes: español); canonical
    `.../en/login`; mismo bloque hreflang.
  - `/login?mode=signup&source=calculadora_ahorro` → canonical `.../login` (limpio, sin query).
  - `/en/login?mode=signup` → canonical `.../en/login` (limpio, sin query).
  - `/es/login` → sigue devolviendo HTTP 308 → `/login`, sin cambios (no se ha tocado el
    redirect; simplemente ya no se referencia desde ninguna metadata).
  - Formulario de login verificado presente sin cambios: campos de email/password y botón de
    Google OAuth siguen renderizando en `/login`.

## Validación de producción

**Pendiente de despliegue**, igual que en el ciclo de la tarea anterior
(`SEO-TECH-SITEMAP-FIX-BLOG-EN-01` → `SEO-TECH-SITEMAP-FIX-BLOG-EN-PRODUCTION-VALIDATION-01`). Tras
el despliegue de este commit, queda pendiente repetir el mismo método contra
`https://www.metodokakebo.com/login` y `https://www.metodokakebo.com/en/login`: confirmar HTTP
200 en ambas, canonical/hreflang/title correctos y ausencia total de `/es/login` en el HTML
servido. Se recomienda una tarea de seguimiento
`SEO-TECH-LOGIN-METADATA-FIX-PRODUCTION-VALIDATION-01`.

## Confirmación: sitemap fuera de alcance

No se ha modificado `src/app/sitemap.ts` ni la presencia de `/login`/`/en/login` en
`coreRoutes`. La decisión de si estas rutas deben permanecer en el sitemap
(`SEO-TECH-LOGIN-SITEMAP-DECISION-01`, propuesta en `SEO_TECH_SITEMAP_VALIDATION_01.md`) sigue
sin tomarse, tal y como exige el alcance de esta tarea. Tampoco se ha modificado `robots.txt` ni el
estado `index`/`noindex` de estas páginas (ambas siguen sirviendo `robots: index, follow`, sin
cambios respecto a antes de este fix).
