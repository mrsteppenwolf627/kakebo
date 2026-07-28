# SEO-TECH-SITEMAP-VALIDATION-01 — Validación de hallazgos de sitemap (auditoría SE Ranking)

**Fecha de la validación:** 2026-07-28
**Modelo:** Claude Code
**Estado:** ✅ Completado — **Tarea exclusivamente de diagnóstico y documentación. Ningún archivo funcional modificado.**
**Rama operativa:** `main` (sincronizada con `origin/main`; commit `12d12969d2472429e7f8316736db9345fcdad61c` confirmado presente en `origin/main` antes de iniciar esta validación)

---

## 1. Auditoría utilizada y fecha

Auditoría de referencia: **SE Ranking, 28 de julio de 2026**. Hallazgos reportados:

1. URLs 4XX incluidas en el sitemap (3 URLs en inglés del blog).
2. URLs `noindex` incluidas en el sitemap (las mismas 3 URLs).
3. URLs no canónicas incluidas en el sitemap (`/login` y `/en/login`).

Esta tarea valida cada hallazgo contra el sitemap real de producción, las respuestas HTTP reales
y el código fuente actual (`main` @ `12d1296`), sin asumir que la herramienta tiene razón.

## 2. Sitemap real inspeccionado

- **URL:** `https://www.metodokakebo.com/sitemap.xml`
- **Descarga:** `curl -s https://www.metodokakebo.com/sitemap.xml` → HTTP 200, 50 `<url>` entries.
- **`robots.txt`** (`https://www.metodokakebo.com/robots.txt`) confirma que este es el único
  sitemap declarado: `Sitemap: https://www.metodokakebo.com/sitemap.xml`. No existe sitemap index
  ni sitemap secundario.
- **Generador:** `src/app/sitemap.ts` (Next.js `MetadataRoute.Sitemap`, generado en build/request
  time, no es un fichero estático).

## 3. Tabla URL por URL

| URL | En sitemap prod. | HTTP real | Redirecciones | Meta robots | Canonical | hreflang declarado | Contenido real | Origen en código |
|---|---|---|---|---|---|---|---|---|
| `https://www.metodokakebo.com/en/blog/cuentas-remuneradas` | Sí (líneas 228-230 del sitemap) | **404** | Ninguna (directo) | **Dos tags conflictivos**: `noindex` (inyectado por el boundary `notFound()` de Next.js) y `index, follow` (heredado del layout raíz) | Ausente | Solo homepage (`es`→home, `en`→`/en`, `x-default`→home); no específico del post | **No existe** — no hay `src/content/blog/cuentas-remuneradas.en.mdx` | `src/app/sitemap.ts` líneas 59-80 (bucle de blog); render 404 real en `src/app/[locale]/(public)/blog/[slug]/page.tsx` línea 84-86 (`if (!post) notFound()`) |
| `https://www.metodokakebo.com/en/blog/fondo-de-emergencia` | Sí (líneas 196-198) | **404** | Ninguna | Igual que arriba | Ausente | Igual que arriba | **No existe** — no hay `fondo-de-emergencia.en.mdx` | Igual que arriba |
| `https://www.metodokakebo.com/en/blog/regla-50-30-20-ejemplo` | Sí (líneas 212-214) | **404** | Ninguna | Igual que arriba | Ausente | Igual que arriba | **No existe** — no hay `regla-50-30-20-ejemplo.en.mdx` | Igual que arriba |
| `https://www.metodokakebo.com/login` | Sí (línea 140, `coreRoutes`) | **200** | Ninguna | `index, follow` | `https://www.metodokakebo.com/es/login` (⚠️ URL que a su vez redirige) | `es`→`/es/login`, `en`→`/en/login`, `x-default`→`/es/login` | Sí, página real (formulario de login) | `src/app/[locale]/login/layout.tsx` (metadata **estática**, no depende de `locale`) |
| `https://www.metodokakebo.com/en/login` | Sí (línea 132) | **200** | Ninguna | `index, follow` | `https://www.metodokakebo.com/es/login` (idéntico al de `/login`, mismo bug) | Idéntico al de `/login` | Sí, misma página (mismo layout, mismo `<title>` en español: `"Iniciar Sesión \| Kakebo"`) | Igual que arriba |

Verificación adicional: `https://www.metodokakebo.com/es/login` (el propio destino del
`canonical` declarado) devuelve **HTTP 308** con `Location: /login`. Es decir: el canonical de
`/login` y de `/en/login` apunta a una URL que **no es un destino final, sino una redirección**.

## 4. Resultado HTTP (resumen)

- Las 3 URLs `/en/blog/*` señaladas: **404 real, confirmado**. No hay redirección — Next.js
  ejecuta `notFound()` porque `getBlogPost(slug, 'en')` no encuentra el fichero `.en.mdx`.
- `/login` y `/en/login`: **200 real**, páginas funcionales y existentes.
- `/es/login` (destino del canonical roto): **308**, redirige a `/login`.

## 5. Robots y canonical (detalle)

- Las 3 páginas 404 en inglés muestran **dos etiquetas `<meta name="robots">` distintas y
  conflictivas** en el mismo `<head>`:
  1. `content="noindex"` — inyectada automáticamente por el boundary `notFound()` de Next.js App
     Router para respuestas 404 (comportamiento nativo del framework; no hay ningún
     `export const metadata` con `noindex` en `src/app/[locale]/not-found.tsx` ni en el
     `[slug]/page.tsx`, que para post inexistente retorna metadata vacía `{}`).
  2. `content="index, follow"` — heredada del layout raíz `src/app/[locale]/layout.tsx`
     (`robots: { index: isProduction, follow: isProduction }`), que se aplica a todas las rutas
     bajo `[locale]` incluida la resolución 404, porque Next.js compone metadata de toda la
     cadena de layouts aunque un segmento hijo llame a `notFound()`.
  - No hay `<link rel="canonical">` en estas páginas (metadata vacía para post inexistente).
- `/login` y `/en/login` declaran **el mismo canonical fijo** (`.../es/login`) sin importar el
  locale real de la URL visitada, porque `login/layout.tsx` exporta un objeto `metadata` estático
  (no una función `generateMetadata` parametrizada por `locale`, a diferencia de `privacy`,
  `terms` y `cookies`, que sí calculan el canonical dinámicamente:
  `` `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}/privacy` ``).
  - Efecto colateral verificado: `/en/login` sirve `<title>Iniciar Sesión | Kakebo</title>`
    (título en español) porque la metadata es literalmente idéntica para ambos locales.

## 6. Origen en código (mecanismo exacto del bug del blog EN)

`src/app/sitemap.ts` líneas 53-80:

```ts
const enPosts = getBlogPosts('en');
const enNoindexSlugs = new Set(
    enPosts.filter((p) => p.frontmatter.noindex).map((p) => p.slug)
);

posts.filter((post) => !post.frontmatter.noindex).forEach((post) => {
    locales.forEach((locale) => {
        if (locale === 'en' && enNoindexSlugs.has(post.slug)) return;
        // genera la URL /en/blog/{slug} igualmente si no está en enNoindexSlugs
        ...
    });
});
```

`getBlogPosts('en')` (en `src/lib/blog.ts`) solo lee ficheros que **existen** con sufijo
`.en.mdx`. Para los 3 slugs afectados no existe ningún fichero `.en.mdx`, así que **nunca
aparecen en `enPosts`**, y por tanto tampoco en `enNoindexSlugs`. La condición
`enNoindexSlugs.has(post.slug)` es `false` para ellos — no porque estén indexables, sino porque
el generador nunca comprobó si el fichero EN existe en absoluto. El sitemap genera la URL
`/en/blog/{slug}` (y su entrada `alternates.languages.en`) para **todo** post ES no-noindex,
asumiendo implícitamente que la traducción inglesa existe.

**Contraprueba (mecanismo funciona correctamente en el caso para el que fue diseñado):** posts
con `.en.mdx` real y `noindex: true` explícito (p. ej. `ahorro-pareja.en.mdx`,
`kakebo-vs-ynab.en.mdx`, 10 casos en total) **sí están correctamente excluidos** del sitemap —
verificado: `/en/blog/ahorro-pareja` no aparece en `/sitemap.xml`, solo la entrada `es`. El fallo
es específico del caso "no existe fichero EN en absoluto", no del mecanismo de exclusión en
general.

## 7. Búsqueda de casos equivalentes no reportados por SE Ranking

- **Blog EN faltante:** comparando todos los slugs `.es.mdx` contra todos los `.en.mdx`, el
  conjunto de posts ES sin contraparte EN es exactamente `{cuentas-remuneradas,
  fondo-de-emergencia, regla-50-30-20-ejemplo}` — **idéntico** al conjunto reportado por SE
  Ranking. No se han encontrado casos adicionales no reportados.
- **Canonical estático con URL `/es/` incorrecta:** búsqueda de `metodokakebo.com/es/` en todo
  `src/app` → **único resultado**: `src/app/[locale]/login/layout.tsx` (3 apariciones, todas en el
  mismo fichero). No hay otra página con este patrón de canonical roto.
- **Otras rutas core del sitemap** (`/`, `/tutorial`, `/sobre-nosotros`, `/blog`, `/herramientas`,
  las 3 calculadoras, `/privacy`, `/terms`, `/cookies`) usan `generateMetadata` dinámico con
  cálculo de canonical dependiente de `locale` — no comparten el bug de `/login`.

## 8. Clasificación de cada hallazgo

| # | Hallazgo SE Ranking | Clasificación | Justificación |
|---|---|---|---|
| 1 | 3 URLs `/en/blog/*` con 4XX en sitemap | **CONFIRMADO** | HTTP 404 real verificado directamente contra producción; el sitemap las incluye por un fallo real de `sitemap.ts` (no comprueba existencia del fichero EN antes de generar la URL) |
| 2 | Las mismas 3 URLs, `noindex` | **CONFIRMADO (con matiz)** | Sí llevan una etiqueta `noindex`, pero **no es una decisión editorial** — es el `noindex` automático que Next.js inyecta en cualquier 404, en conflicto con un segundo tag `index, follow` heredado del layout. El síntoma reportado es real; la causa no es "contenido marcado noindex a propósito" sino "URL que no debería existir en el sitemap" |
| 3 | `/login` y `/en/login` no canónicas | **CONFIRMADO** | El canonical declarado (`/es/login`) no es la URL visitada, no coincide con el patrón de URL del sitio (`localePrefix: 'as-needed'` nunca usa `/es/`) y además esa URL redirige (308) — es decir, el canonical apunta a una redirección, un antipatrón SEO reconocido. Además, ambos locales declaran el mismo canonical, por lo que Google podría tratar `/en/login` como duplicado de una URL (`/es/login`) que ni siquiera es la forma real de `/login` |
| — | ¿Deberían `/login` y `/en/login` estar en el sitemap? | **DUDOSO / decisión de producto, no un bug técnico** | Su inclusión es **intencional** (están explícitamente en `coreRoutes` de `sitemap.ts` con prioridad 0.1). Es una práctica cuestionable incluir páginas transaccionales/auth en el sitemap, pero no es un error técnico — es una decisión editorial que esta tarea no evalúa ni corrige, solo señala como punto a decidir en una tarea de corrección futura |

**Ningún hallazgo de SE Ranking resultó ser un falso positivo puro.** Los 3 hallazgos reportados
tienen una causa real verificable en código y en producción.

## 9. Causa raíz

- **Hallazgos 1 y 2 (blog EN):** `src/app/sitemap.ts` genera la URL `/en/blog/{slug}` para todo
  post en español no marcado `noindex`, sin comprobar si existe el fichero de contenido
  `{slug}.en.mdx`. El único chequeo existente (`enNoindexSlugs`) presupone que el fichero EN
  existe; cuando no existe, el post nunca entra en ese conjunto y la exclusión no se dispara. El
  resultado colateral (el doble meta-robots conflictivo) es un efecto del comportamiento nativo de
  Next.js ante `notFound()` combinado con el layout raíz, no una configuración explícita del
  proyecto.
- **Hallazgo 3 (login):** `src/app/[locale]/login/layout.tsx` define `metadata` como un objeto
  estático en vez de una función `generateMetadata({ params })` parametrizada por `locale`, a
  diferencia del resto de páginas legales del proyecto (`privacy`, `terms`, `cookies`), que sí
  calculan canonical/hreflang/título de forma dinámica. El valor fijo usado (`/es/login`) además
  usa un prefijo `/es/` que no es válido en ningún otro lugar del sitio, dado que
  `routing.ts` configura `localePrefix: 'as-needed'` (el locale por defecto, `es`, nunca lleva
  prefijo).

## 10. Riesgo SEO real

- **Blog EN 404 en sitemap:** riesgo **medio**. Google Search Console reportará "Enviada, no
  encontrada (404)" para estas 3 URLs, lo que no penaliza el dominio pero degrada la señal de
  calidad del sitemap y puede ralentizar el rastreo de URLs nuevas legítimas si se acumulan más
  casos similares. El doble meta-robots no cambia el resultado práctico (la URL de todos modos es
  404 y no se indexará), pero es una señal técnica sucia que herramientas de auditoría seguirán
  marcando.
- **`/login` no canónica:** riesgo **bajo-medio**. Es poco probable que Google indexe agresivamente
  una página de login de baja prioridad (0.1), pero el canonical roto (apuntando a una URL que
  redirige y que no es la URL real visitada) es un problema de higiene técnica que confunde el
  rastreo de esa URL concreta y, si se replicase el patrón a páginas de mayor prioridad, sería más
  grave. El hecho de que `/en/login` sirva metadata y título en español es un problema de
  experiencia/i18n adicional detectado durante esta validación, más allá del canonical en sí.
- **Impacto en el resto del sitio:** ninguno detectado. Los mecanismos de exclusión de `noindex`
  EN y de cálculo de canonical dinámico funcionan correctamente en todos los demás casos
  verificados (10 posts EN `noindex` reales, correctamente excluidos; 3 páginas legales con
  canonical dinámico correcto).

## 11. Tareas de corrección propuestas (orden recomendado, NO ejecutadas en esta tarea)

1. **SEO-TECH-SITEMAP-FIX-BLOG-EN-01** — Modificar `src/app/sitemap.ts` para que la generación de
   la entrada `/en/blog/{slug}` (y su `alternates.languages.en`) compruebe la **existencia real**
   del fichero `{slug}.en.mdx` (vía `getBlogPost(slug, 'en')` o equivalente a `enPosts`), no solo
   la ausencia en `enNoindexSlugs`. Elimina el 404 y el doble meta-robots de las 3 URLs
   directamente, sin tocar contenido ni URLs visibles.
2. **SEO-TECH-LOGIN-CANONICAL-FIX-01** — Convertir `src/app/[locale]/login/layout.tsx` de
   `metadata` estático a `generateMetadata({ params })` dinámico, replicando el patrón ya usado en
   `privacy`/`terms`/`cookies` (canonical = `` `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}/login` ``),
   y traducir el `title`/`description` según `locale`. Corrige simultáneamente el canonical y el
   bug de metadata en español en la versión inglesa.
3. **SEO-TECH-LOGIN-SITEMAP-DECISION-01** (tarea de decisión, no solo técnica) — Decidir de forma
   explícita si `/login` y `/en/login` deben permanecer en el sitemap. Si se decide excluirlas
   (patrón común para páginas transaccionales/auth), retirarlas de `coreRoutes` en
   `src/app/sitemap.ts`; si se mantienen, la tarea 2 ya deja su canonical correcto.
4. **SEO-TECH-SITEMAP-REVALIDATION-01** — Tras aplicar 1-3, volver a descargar `/sitemap.xml` de
   producción y volver a verificar HTTP/canonical/robots de las 5 URLs de esta tabla, para cerrar
   el ciclo con evidencia (mismo método que esta tarea).

## 12. Elementos expresamente descartados / fuera de esta validación

- No se ha evaluado ni corregido el contenido de las 3 páginas de blog en español (existen y
  funcionan correctamente).
- No se ha evaluado si los 3 posts *deberían* traducirse al inglés (decisión editorial, no
  técnica).
- No se ha auditado el resto de las 50 URLs del sitemap más allá de la búsqueda dirigida de casos
  equivalentes a los 2 patrones reportados (secciones 7).
- No se ha modificado `robots.txt`, `hreflang`, ningún `canonical`, ningún `layout.tsx` ni
  `sitemap.ts`.
- No se ha evaluado el resto de bugs de metadata de `login/layout.tsx` no relacionados con
  canonical (p. ej. copy exacto del `title`/`description` en inglés), más allá de señalar su
  existencia como contexto de la causa raíz.

## STOP de implementación

**Esta tarea es exclusivamente de diagnóstico.** No se ha modificado `sitemap.ts`, `robots.txt`,
ningún `canonical`, ningún `hreflang`, ningún contenido ni ninguna metadata. Las 4 tareas de
corrección de la sección 11 quedan propuestas y documentadas, pero **no ejecutadas**. No se inicia
ninguna otra tarea.
