# SEO-ONPAGE-ALTERNATIVAS-FINTONIC-VALIDATION-02

**Tipo:** Validación SEO/técnica/editorial (diagnóstico, sin implementación)
**Fecha de ejecución:** 2026-07-20
**URL objetivo:** `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias`

---

## 1. Resumen ejecutivo

La URL es una comparativa madura, ya optimizada dos veces (P0.7 — expansión de contenido a 8 apps; SEO-CTR-FINTONIC-01 — optimización de title/excerpt/intro). El artículo tiene buena profundidad, tabla comparativa, 5 fichas Pros/Contras/Para quién, FAQ con schema, enlazado interno saludable (4 entrantes + 1 desde herramienta) y datos factuales verificados como vigentes (Spendee y Toshl siguen operativos en 2026, sin discontinuación).

El hallazgo más relevante y accionable es un **problema de snippet no resuelto por la optimización anterior**: el `title` actual (94 caracteres) **no contiene la palabra "Fintonic"** — la keyword que domina el 100% del cluster de consultas objetivo (`alternativas a fintonic`, `fintonic alternativas`, etc.) — y excede ampliamente el límite visible en SERP, con alto riesgo de reescritura por parte de Google. La meta description (178 caracteres) también excede el límite recomendado. Esto es coherente con el CTR bajo (0,87 %) pese a posición media razonable (8,19).

Se detecta también una discrepancia técnica menor entre el `Link` HTTP header (que anuncia `hreflang="en"`) y las etiquetas `<link>` en el `<head>` (que correctamente omiten `en` porque la variante inglesa tiene `noindex`). El sitemap.xml y el `<head>` están bien resueltos; el HTTP header es la única señal inconsistente.

No se ha detectado canibalización entre variantes: `/es/` redirige 308 a la URL canónica sin prefijo, y `/en/` sirve `noindex, nofollow` correctamente, excluida del sitemap.

No se ha modificado ningún archivo de código, contenido, metadata ni configuración. Este documento es el único entregable de contenido nuevo, junto con la actualización de estado.

---

## 2. Estado del repositorio

Ejecutado según metodología obligatoria (Fase 0):

| Comprobación | Resultado |
|---|---|
| `git status` | Working tree con cambios locales preexistentes **ajenos a esta tarea**: `.claude/settings.local.json` modificado, submódulo `kakebo` con commits nuevos no trackeados, y untracked: `CLAUDE.md`, `SEO_MAP_V1.md`, `docs/seo/fondo_emergencia/`, `docs/seo/regla502030/`, `imagenes/blog/`, `imagenes/kakebo online gratis.png`. Ninguno de estos ha sido tocado, leído en profundidad ni alterado. |
| `git branch --show-current` | `main` |
| `git fetch origin` | Sin cambios remotos nuevos respecto al último pull de la sesión |
| `git log -1 --oneline` (local) | `85dcffa docs(analytics): close historical inflation rollout` |
| `git log origin/main -1 --oneline` | `85dcffa docs(analytics): close historical inflation rollout` |
| `git diff origin/main..HEAD` | Vacío — rama local idéntica a `origin/main` |

**Conclusión Fase 0:** repositorio sincronizado con `origin/main`. Existen cambios locales sin commitear que pertenecen a trabajo previo del usuario (SEO fondo de emergencia, regla 50/30/20, imágenes de blog) y no se ha interactuado con ellos. Es seguro proceder.

---

## 3. Archivos implicados

| Función | Ruta |
|---|---|
| Contenido fuente ES | `src/content/blog/alternativas-a-app-bancarias.es.mdx` |
| Contenido fuente EN | `src/content/blog/alternativas-a-app-bancarias.en.mdx` |
| Ruta dinámica + generación de metadata + JSON-LD + breadcrumbs | `src/app/[locale]/(public)/blog/[slug]/page.tsx` |
| Componentes MDX usados (`FaqSection`, `FaqItem`, `SimpleCTA`) | `src/components/mdx/MDXComponents.tsx` |
| Componente de posts relacionados | `src/components/mdx/RelatedPosts.tsx` |
| Lógica de obtención de posts / noindex | `src/lib/blog.ts` |
| Enrutado i18n / prefijo de locale | `src/i18n/routing.ts` |
| Middleware de locale | `src/middleware.ts` |
| Sitemap | `src/app/sitemap.ts` |
| Robots | `src/app/robots.ts` |
| Enlace entrante desde herramienta | `src/components/landing/tools/CalculatorInflation.tsx` (+ `messages/es.json`, clave `content.link1`) |
| Enlaces entrantes desde otros artículos (`related` + enlace en cuerpo) | `src/content/blog/peligros-apps-ahorro-automatico.es.mdx`, `src/content/blog/kakebo-vs-ynab.es.mdx`, `src/content/blog/kakebo-online-gratis.es.mdx`, `src/content/blog/como-ahorrar-dinero-cada-mes.es.mdx` |
| Rutas legacy / redirecciones | No existe archivo de redirects dedicado; la redirección `/es/` → sin prefijo la resuelve `next-intl` (`localePrefix: 'as-needed'`) vía middleware, sin configuración adicional |

No se han encontrado archivos de schema separados: el JSON-LD se genera inline en `page.tsx`.

---

## 4. Datos GSC de partida (proporcionados por el usuario)

| Métrica | Valor |
|---|---|
| Clics | 4 |
| Impresiones | 459 |
| CTR | ≈ 0,87 % |
| Posición media ponderada | ≈ 8,19 |

**Variantes agregadas:** `/blog/alternativas-a-app-bancarias`, `/es/blog/alternativas-a-app-bancarias`, `/en/blog/alternativas-a-app-bancarias`.

**Verificación de coherencia:** no hay acceso a la API de GSC desde este entorno, por lo que estos datos no se han podido re-verificar directamente. Sí se ha comprobado su **coherencia histórica** contra snapshots documentados en `docs/PROJECT_STATUS.md` y `PROJECT_STATUS.md`:

| Fecha aprox. | Impresiones | Clics | CTR | Posición | Fuente |
|---|---|---|---|---|---|
| Pre-optimización | 284 | 2 | 0,7 % | 8,49 | `docs/PROJECT_STATUS.md:1952` |
| 2026-06-26 (antes de SEO-CTR-FINTONIC-01) | 310 | 2 | 0,65 % | 7,95 | `PROJECT_STATUS.md:2812` |
| 2026-07-20 (dato de esta tarea) | 459 | 4 | 0,87 % | 8,19 | Prompt de tarea |

La tendencia (crecimiento de impresiones, ligera mejora de CTR, posición estable en el rango 8) es consistente y no presenta anomalías. Se da por válido el dato de partida.

---

## 5. Resultado de la validación de producción

Metodología: `curl` con cabeceras completas (`-D -`) contra las 3 variantes, más inspección del HTML servido y del sitemap.xml en producción. No limitado al código fuente del repo.

### 5.1 `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias` (canónica)

| Elemento | Valor |
|---|---|
| HTTP status | `200 OK` |
| `X-Matched-Path` | `/[locale]/blog/[slug]` |
| `robots` (meta) | `index, follow` |
| `canonical` | `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias` (self-referencial, correcto) |
| `hreflang` en `<head>` | `es` → sin prefijo, `x-default` → sin prefijo. **No incluye `en`** (correcto, ya que EN es noindex) |
| `hreflang` en HTTP `Link` header | `en`, `es`, `x-default` — **incluye `en`**, inconsistente con el `<head>` |
| `lang` del documento | `es` |
| `title` | `Alternativas a Apps Bancarias para Controlar Gastos sin Conectar el Banco (2026) \| Blog Kakebo` — **94 caracteres** |
| `meta description` | `Comparativa 2026: las mejores alternativas a apps bancarias y Fintonic para controlar tus gastos sin conectar el banco ni ceder tus datos. Incluye Kakebo AI, Spendee, YNAB y más.` — **178 caracteres** |
| H1 | Idéntico al `title` de frontmatter (94 car., sin "Fintonic") |
| H2 (8) | Comparativa · Las 5 mejores alternativas a Fintonic, analizadas · El modelo de negocio · Automatización frente a registro consciente · Kakebo AI: la alternativa · Privacidad frente a comodidad · Preguntas frecuentes · Prueba Kakebo AI (CTA) + "Artículos relacionados" |
| H3 (9 en contenido) | Spendee, Toshl Finance, Money Manager, Emma, YNAB, "1. Comisiones por referidos", "2. Datos agregados...", "¿Cómo funciona...?", "Por qué no requiere conexión bancaria" — jerarquía correcta, sin saltos |
| JSON-LD | `BlogPosting`, `BreadcrumbList` (3 ítems), `FAQPage` (5 preguntas) — sin `SoftwareApplication` (correcto, reservado solo a `plantilla-kakebo-excel`) |
| Breadcrumbs visuales | No se renderiza breadcrumb visible en el DOM — solo existe como JSON-LD, no como UI |
| Imágenes | 5 imágenes (`hero` + figura interna + 3 en `RelatedPosts`), **todas con `alt` descriptivo** |
| Enlaces internos salientes | `/`, `/blog`, `/blog/kakebo-online-gratis`, `/blog/kakebo-vs-ynab`, `/blog/metodo-kakebo-guia-definitiva`, `/blog/peligros-apps-ahorro-automatico`, `/herramientas/*` (navbar), `/login?mode=signup` (CTA) |
| Enlaces externos | **Ninguno.** El artículo menciona Fintonic, Spendee, Toshl, Money Manager, Emma, YNAB pero no enlaza a ninguna de sus webs oficiales |
| Fecha publicación / actualización | `date: 2026-01-13`, `updatedDate: 2026-07-01` — coherente con `dateModified` en JSON-LD |
| Fragmentos concatenados | No se detectan (a diferencia de incidentes previos documentados en calculadora de inflación) |
| Contenido oculto / no renderizado | No se detecta contenido oculto vía CSS o JS; el HTML servido en el primer request ya contiene el artículo completo (SSR) |
| Footer | Único, no duplicado |

### 5.2 `https://www.metodokakebo.com/es/blog/alternativas-a-app-bancarias`

| Elemento | Valor |
|---|---|
| HTTP status | `308 Permanent Redirect` |
| `Location` | `/blog/alternativas-a-app-bancarias` |
| Comportamiento | Correcto: `next-intl` con `localePrefix: 'as-needed'` y `defaultLocale: 'es'` fuerza la redirección permanente de `/es/*` a la ruta sin prefijo. No es una variante indexable independiente. |

### 5.3 `https://www.metodokakebo.com/en/blog/alternativas-a-app-bancarias`

| Elemento | Valor |
|---|---|
| HTTP status | `200 OK` |
| `robots` (meta) | `noindex, nofollow` — correcto, coincide con `noindex: true` en frontmatter |
| `canonical` | `https://www.metodokakebo.com/en/blog/alternativas-a-app-bancarias` (self-referencial) |
| `lang` | `en` |
| `title` | `Mint and Fintonic Alternative without Bank Connection: Reclaim your Privacy \| Blog Kakebo` |
| `meta description` | Menciona "Mint", no "Fintonic" |
| H1 | Igual al title |
| Contenido | **Sustancialmente distinto y desactualizado respecto a la versión ES**: menciona "Mint (rest in peace)" como competidor activo, no incluye la tabla comparativa de 8 apps, no incluye las fichas Spendee/Toshl/Money Manager/Emma/YNAB, solo 2 FAQ (vs. 5 en ES) |
| Presencia en `sitemap.xml` | **No aparece** — confirmado por inspección directa de `https://www.metodokakebo.com/sitemap.xml`, que solo lista la URL ES sin prefijo |

**Conclusión Fase 2:** la implementación técnica funciona como está diseñada (redirect 308 en `/es/`, `noindex` real y confirmado en `/en/`, exclusión correcta del sitemap). La única anomalía es la discrepancia del HTTP `Link` header en la variante canónica (ver hallazgo técnico T-01).

---

## 6. Comparación de variantes

| Variante | Rol | Indexable | Contenido |
|---|---|---|---|
| Sin prefijo (`/blog/...`) | **Canónica real** para ES (locale por defecto sin prefijo) | Sí | Versión completa y actualizada (2026-07-01) |
| `/es/blog/...` | No es una variante real de contenido — es puramente un alias que redirige 308 | N/A (redirect) | N/A |
| `/en/blog/...` | Variante EN deliberadamente desindexada | No (`noindex, nofollow`) | Versión antigua, distinta en enfoque y desactualizada (menciona Mint) |

**Fragmentación de señales en GSC:** las 459 impresiones agregadas por el usuario incluyen probablemente tráfico residual indexado bajo `/es/blog/...` antes de que la redirección 308 se consolidara en el índice de Google, y posiblemente impresiones residuales de `/en/...` previas a la aplicación de `noindex`. Esto es una hipótesis razonable pero **no verificable sin acceso a GSC por URL individual** — clasificada como DUDOSA (ver tabla de hallazgos).

**Riesgo de canibalización internacional:** descartado. La variante EN no compite por las mismas queries en español y no está indexada.

---

## 7. Diagnóstico de intención

- La intención principal que resuelve la URL es **comparativa/decisional** ("alternativas a X"), correctamente alineada con el cluster de consultas (`alternativas a fintonic`, `fintonic alternativas`, etc.).
- El artículo **se desvía deliberadamente** del framing "Fintonic" hacia "apps bancarias" en general — decisión tomada explícitamente en P0.9/P0.7 y documentada (título cambiado de "Alternativas a Fintonic" a "Alternativas a Apps Bancarias"). Esto amplía el alcance semántico pero diluye la señal de relevancia exacta para el cluster de consultas objetivo, que es 100 % "Fintonic".
- No mezcla intención informativa/transaccional de forma confusa: es comparativa con una capa transaccional clara al final (CTA a Kakebo AI), estructura habitual y aceptable en este tipo de contenido.
- Queda razonablemente claro para quién está escrito: usuarios que evalúan compartir credenciales bancarias con apps de terceros.

---

## 8. Diagnóstico de snippet

- **Title (94 caracteres):** muy por encima del límite visible en SERP (~55-60 caracteres / ~600px). Alto riesgo de truncamiento o reescritura automática por Google. Además, **no contiene "Fintonic"** en ningún punto del title, pese a que el 100 % del cluster de consultas objetivo (`alternativas a fintonic`, `fintonic alternativas`, `alternativa a fintonic`, `alternativa fintonic`, `alternativas fintonic`) lo usa como término literal.
- **Meta description (178 caracteres):** por encima del límite recomendado (~155-160 caracteres). Sí menciona "Fintonic" explícitamente, un punto a favor, pero el riesgo de truncamiento reduce su efectividad como snippet completo.
- **H1:** idéntico al title (94 caracteres, sin "Fintonic") — no aporta una segunda oportunidad de reforzar la keyword en el snippet visual ni en la comprensión semántica de la página por el buscador.
- **Diferenciación frente a competidores:** el excerpt sí comunica una propuesta de valor diferenciada ("sin conectar el banco ni ceder tus datos"), lo cual es un punto fuerte frente a comparadores genéricos.
- **Causa más probable del CTR bajo (0,87 % en posición 8,19):** la ausencia de "Fintonic" en el elemento más visible del snippet (title) combinada con longitud excesiva de title y description, en un contexto donde el usuario que busca "alternativas a fintonic" no ve la keyword exacta que motivó su búsqueda.

---

## 9. Diagnóstico de contenido

- **Actualidad de las alternativas:** verificado mediante búsqueda web (2026-07-20) que Spendee y Toshl Finance siguen operativas y sin discontinuación; los rangos de precio citados en el artículo (Spendee ~2,99 €/mes, Toshl ~3,33 €/mes) son consistentes con los precios actuales reportados (Toshl Pro $2,99-4,99/mes según plan). No se detectan apps desaparecidas o con cambio de modelo relevante entre las 8 listadas.
- **Criterios de comparación:** consistentes entre las 5 fichas — precio, conexión bancaria, plataforma, para quién — con Pros/Contras explícitos. Buena profundidad editorial.
- **Primer bloque visible:** el párrafo 1 no menciona "Fintonic"; aparece por primera vez en el párrafo 2 ("Apps como Fintonic..."). Aceptable pero no inmediato.
- **Claims sin fuente:** la sección "El modelo de negocio de las apps financieras gratuitas" hace afirmaciones genéricas sobre el sector fintech (comisiones por referidos, *data brokerage*) sin citar fuente o estudio. Están razonablemente matizadas ("no todas las apps hacen esto") y no se atribuyen a ninguna app concreta por nombre, lo que reduce el riesgo, pero siguen siendo afirmaciones factuales sin respaldo verificable.
- **Redundancia:** las secciones "Kakebo AI: la alternativa sin conexión bancaria" y "Privacidad frente a comodidad: no son excluyentes" repiten en gran medida el mismo mensaje (Kakebo AI no requiere banco, usa IA conversacional, mejora la consciencia del gasto) con distinta redacción. No es contenido erróneo, pero sí parcialmente redundante.
- **Conflicto de objetividad:** el artículo se presenta como comparativa neutral de 8 apps, pero la FAQ y el cuerpo empujan de forma consistente hacia el producto propio (Kakebo AI) como respuesta "mejor" en casi todas las preguntas. Esto no es necesariamente negativo para conversión, pero es relevante para el diagnóstico de intención/E-E-A-T (ver sección 11 y hallazgo C-03).

---

## 10. Diagnóstico de estructura y GEO

- **Tabla comparativa:** presente, clara, 8 filas × 5 columnas — buen candidato a extracción por LLMs/AI Overviews.
- **Índice/TOC:** no existe tabla de contenidos ni anclas de navegación dentro del artículo (los `href="#alternatives"`, `#faq`, `#features` detectados en el HTML pertenecen al menú de navegación global, no a un índice del artículo).
- **Secciones por alternativa:** presentes y bien delimitadas (H3 por app).
- **Conclusión:** no existe un bloque de "Conclusión" o resumen explícito que recapitule la recomendación por perfil de usuario antes del CTA — la sección "Privacidad frente a comodidad" hace de cierre temático pero no de síntesis editorial.
- **FAQ:** 5 preguntas, con schema `FAQPage` correcto y coherente con el contenido.
- **CTA:** un único CTA final, claro, sin fricción.
- **Extraíbilidad GEO:** la tabla y las FAQ son fácilmente extraíbles como respuestas directas. La ausencia de una sección de conclusión estructurada reduce ligeramente la capacidad de un LLM de citar una recomendación de cierre única y bien delimitada.

---

## 11. Diagnóstico de enlazado

- **Entrantes:** 4 artículos del blog (`peligros-apps-ahorro-automatico`, `kakebo-vs-ynab`, `kakebo-online-gratis`, `como-ahorrar-dinero-cada-mes`) enlazan a esta URL, tanto vía `related` (RelatedPosts) como vía enlace contextual en el cuerpo. Además, `CalculatorInflation.tsx` (herramienta calculadora de inflación) enlaza con el anchor "Alternativas a las apps bancarias que leen tus datos". Anchors variados y naturales, ninguno es exact-match "alternativas a fintonic", aunque `kakebo-online-gratis.es.mdx` usa "Alternativa a Fintonic sin conexión bancaria".
- **Salientes:** enlaces internos correctos, sin enlaces rotos detectados.
- **Sin enlaces externos:** el artículo no enlaza a ninguna de las 8 apps competidoras mencionadas. Esto es neutral a nivel SEO (no hay fuga de PageRank) pero reduce el valor editorial/E-E-A-T de la comparativa (no hay forma de que el lector verifique las afirmaciones sobre precio/features directamente).
- **Profundidad de clics:** no está enlazada desde la home ni desde `/blog` de forma destacada (aparece en el listado estándar del índice de blog, no en ningún módulo destacado); accesible en 2 clics desde home vía `/blog`.
- **No hay enlaces hacia competidores** de la herramienta propia (Kakebo AI) en el sentido de herramientas SaaS externas — coherente con la estrategia del sitio.

---

## 12. Tabla de hallazgos

### Técnicos

| ID | Hallazgo | Estado | Evidencia | Archivo/URL | Impacto | Prioridad | Riesgo de modificar | Tarea recomendada |
|---|---|---|---|---|---|---|---|---|
| T-01 | El HTTP `Link` header de la respuesta anuncia `hreflang="en"`, mientras que el `<head>` HTML (correcto) lo omite por ser `noindex` | CONFIRMADO | `curl -D -` muestra `Link: ...hreflang="en"...` vs. `grep '<link rel="alternate"'` sin `en` en el mismo response | `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias` (respuesta HTTP) | Bajo-medio — señal duplicada e inconsistente, riesgo de interpretación confusa por crawlers que lean headers en vez de HTML | Baja | Bajo — corrección puramente técnica, no toca contenido ni slug | Tarea técnica independiente: investigar origen del `Link` header (posible comportamiento de Next.js/Vercel al no purgar cache de build anterior a `e1d962a`) |
| T-02 | No existe breadcrumb visual en el DOM, solo JSON-LD | CONFIRMADO | Inspección HTML — no se encuentra `<nav aria-label="breadcrumb">` ni equivalente visible | `page.tsx` | Bajo — no afecta indexación, sí a UX/rich snippet visual en SERP (Google puede o no mostrar breadcrumb rich result sin nodo visible asociado) | Baja | Bajo | Podría evaluarse en una tarea de UI, fuera de alcance SEO puro |

### Indexación e internacionalización

| ID | Hallazgo | Estado | Evidencia | Impacto | Prioridad | Riesgo | Tarea recomendada |
|---|---|---|---|---|---|---|---|
| I-01 | `/es/blog/...` redirige 308 correctamente a la URL sin prefijo | DESCARTADO (no es un problema) | `curl -D -` → `308 Permanent Redirect` | — | — | — | — |
| I-02 | `/en/blog/...` sirve `noindex, nofollow` y está excluida del sitemap | DESCARTADO (funciona como se diseñó) | `curl` + inspección de `sitemap.xml` | — | — | — | — |
| I-03 | Fragmentación de señales GSC entre variantes por indexación histórica previa a las correcciones de `noindex`/redirect | DUDOSO | No verificable sin acceso a GSC por URL individual; es una hipótesis razonable dado el histórico de cambios documentado | Medio (afectaría a la interpretación de los 459 impresiones agregados) | Media | N/A (no accionable sin más datos) | `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-KEYWORD-SERP-02` puede incorporar una revisión de GSC por URL si hay acceso a la consola |

### Snippet y CTR

| ID | Hallazgo | Estado | Evidencia | Impacto | Prioridad | Riesgo de modificar | Tarea recomendada |
|---|---|---|---|---|---|---|---|
| S-01 | `title` (94 car.) no contiene "Fintonic", keyword del 100% del cluster objetivo | CONFIRMADO | HTML servido: `<title>Alternativas a Apps Bancarias...\| Blog Kakebo</title>` | Alto — probable causa principal del CTR bajo (0,87%) en posición media razonable (8,19) | Alta | Medio — cambiar title es señal orgánica sensible, requiere tarea dedicada con evidencia adicional de SERP (cluster keyword) antes de tocarlo | `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-KEYWORD-SERP-02` |
| S-02 | `title` excede longitud recomendada (94 vs. ~60 car.) | CONFIRMADO | Medición directa: 94 caracteres | Medio-alto — riesgo de truncamiento/reescritura por Google | Alta | Medio | Misma tarea que S-01 |
| S-03 | `meta description` excede longitud recomendada (178 vs. ~155-160 car.) | CONFIRMADO | Medición directa: 178 caracteres | Medio | Media | Bajo-medio | Misma tarea que S-01 |
| S-04 | H1 idéntico al title, sin segunda oportunidad de incluir "Fintonic" | CONFIRMADO | HTML: H1 = title de frontmatter | Medio | Media | Medio (H1 es señal orgánica) | Misma tarea que S-01 |

### Contenido e intención

| ID | Hallazgo | Estado | Evidencia | Impacto | Prioridad | Riesgo | Tarea recomendada |
|---|---|---|---|---|---|---|---|
| C-01 | Apps mencionadas (Spendee, Toshl) siguen operativas y con precios consistentes en 2026 | DESCARTADO (contenido vigente) | Verificación web 2026-07-20 | — | — | — | — |
| C-02 | Claims genéricos sobre modelo de negocio fintech sin fuente citada | DUDOSO | Sección "El modelo de negocio..." sin referencias externas | Bajo — afirmaciones matizadas, no atribuidas a apps concretas | Baja | Bajo | Podría evaluarse añadir 1-2 fuentes en tarea editorial futura |
| C-03 | Sesgo hacia producto propio en una comparativa que se presenta como neutral | DUDOSO | FAQ y cuerpo recomiendan Kakebo AI en 4 de 5 preguntas | Bajo-medio (percepción de objetividad, no técnico) | Baja | N/A | Fuera de alcance de esta tarea — anotar para revisión editorial futura |
| C-04 | Contenido parcialmente redundante entre 2 secciones sobre Kakebo AI | DUDOSO | Comparación de texto "Kakebo AI: la alternativa..." vs. "Privacidad frente a comodidad" | Bajo | Baja | Bajo | Evaluar en tarea de refresco de contenido, no ahora |

### Estructura y GEO

| ID | Hallazgo | Estado | Evidencia | Impacto | Prioridad | Riesgo | Tarea recomendada |
|---|---|---|---|---|---|---|---|
| G-01 | No hay tabla de contenidos ni sección de conclusión explícita | CONFIRMADO | Inspección de estructura H2/H3 del artículo | Bajo-medio (afecta extraíbilidad GEO y UX en artículo largo) | Media | Bajo | Podría añadirse en una tarea de estructura, no ahora |
| G-02 | Tabla comparativa y FAQ son extraíbles para GEO/AI Overviews | DESCARTADO (positivo, no es un problema) | Inspección directa | — | — | — | — |

### Enlazado interno

| ID | Hallazgo | Estado | Evidencia | Impacto | Prioridad | Riesgo | Tarea recomendada |
|---|---|---|---|---|---|---|---|
| L-01 | 4 artículos + 1 herramienta enlazan a la URL con anchors variados | DESCARTADO (saludable) | Grep en `src/` | — | — | — | — |
| L-02 | Ningún enlace externo hacia las apps comparadas | DUDOSO | Inspección HTML — 0 `href` externos | Bajo (E-E-A-T, no indexación) | Baja | Bajo | Evaluar en tarea editorial, no técnica |
| L-03 | No hay enlaces rotos | DESCARTADO | Verificación de todos los `href` internos contra rutas existentes | — | — | — | — |

### Conversión

| ID | Hallazgo | Estado | Evidencia | Impacto | Prioridad | Riesgo | Tarea recomendada |
|---|---|---|---|---|---|---|---|
| V-01 | CTA único, claro, alineado con intención transaccional final | DESCARTADO (funciona correctamente) | Inspección de `page.tsx` + MDX | — | — | — | — |
| V-02 | Potencial conflicto entre recomendar apps de terceros y promocionar producto propio | DUDOSO | Ver C-03 | Bajo | Baja | N/A | Fuera de alcance |

### Mantenimiento / frescura

| ID | Hallazgo | Estado | Evidencia | Impacto | Prioridad | Riesgo | Tarea recomendada |
|---|---|---|---|---|---|---|---|
| M-01 | `updatedDate` (2026-07-01) coherente con `dateModified` en JSON-LD | DESCARTADO | Comparación frontmatter vs. JSON-LD renderizado | — | — | — | — |
| M-02 | Ninguna app mencionada requiere actualización por discontinuación | DESCARTADO | Verificación web 2026-07-20 (sección 9) | — | — | — | — |

---

## 13. Riesgos

- **Riesgo de no actuar sobre S-01/S-02/S-03/S-04:** el CTR bajo puede persistir o degradarse relativamente si la competencia mejora sus snippets, dado que la URL ya tiene posición media aceptable (8,19) pero no capitaliza la keyword exacta en el elemento más visible del SERP.
- **Riesgo de actuar sin evidencia adicional de SERP:** modificar el title para reintroducir "Fintonic" sin antes correr un análisis de SERP/keyword (tarea siguiente) podría optimizar para una keyword sin validar si Google ya interpreta correctamente la relevancia semántica actual (posición 8,19 en un artículo que no usa "Fintonic" en el title sugiere que sí hay cierta comprensión semántica, lo cual es información valiosa a considerar antes de reescribir).
- **Riesgo del hallazgo T-01 (Link header):** bajo, pero desconocido su origen exacto — no se ha llegado a una causa raíz definitiva, lo que en sí es un riesgo de mantenimiento (podría repetirse en otras URLs del blog).

---

## 14. Elementos que deben protegerse

- El `slug` (`alternativas-a-app-bancarias`) — no debe cambiarse bajo ninguna circunstancia (señales orgánicas activas).
- El `canonical` actual (autoreferencial, sin prefijo) — correcto, no tocar.
- La estructura `noindex` de la variante EN — correcta y deliberada, no tocar.
- La tabla comparativa y las 5 fichas de apps — contenido de valor validado como vigente.
- El schema `FAQPage`/`BlogPosting`/`BreadcrumbList` — correctamente implementado, cualquier cambio debe mantener la estructura.
- El histórico de commits de P0.7 y SEO-CTR-FINTONIC-01 — referencia obligatoria antes de reescribir title/excerpt de nuevo, para no revertir aprendizajes ya documentados.

---

## 15. Conclusión

La URL está técnicamente sana (redirects, noindex, sitemap y schema correctos) y editorialmente sólida (contenido vigente, buena profundidad, buen enlazado interno). El principal freno al rendimiento no es un problema estructural sino de **snippet**: el title actual no contiene la keyword literal que domina el 100% de las consultas del cluster ("Fintonic") y excede los límites de longitud recomendados tanto en title como en description. Esto es coherente con un CTR de 0,87% en una posición media de 8,19, que no es mala para el volumen de impresiones que recibe.

No se ha modificado código, contenido ni metadata. El hallazgo técnico T-01 (discrepancia de `hreflang` en el HTTP header) queda documentado para investigación en una tarea técnica independiente, sin bloquear la recomendación principal.

---

## 16. Recomendación para la siguiente tarea

Se recomienda continuar con:

**`SEO-ONPAGE-ALTERNATIVAS-FINTONIC-KEYWORD-SERP-02`**

Objetivo sugerido para esa tarea: analizar la SERP actual para el cluster "alternativas a fintonic" (competidores, snippets reales, longitud de titles ganadores) antes de decidir si se reintroduce "Fintonic" en el title/H1 de esta URL, y en qué formato, sin exceder límites de longitud ni repetir los problemas ya corregidos por P0.7 y SEO-CTR-FINTONIC-01.

---

## Validaciones finales ejecutadas

- ✅ Informe con evidencia verificable (comandos `curl`, `grep`, lectura directa de archivos, búsqueda web).
- ✅ No se ha modificado código ni contenido del artículo, metadata, schema, canonical, hreflang, slug, componentes ni enlaces.
- ✅ `git diff --stat` y `git diff` ejecutados antes del commit (ver sección de cierre en `PROJECT_STATUS.md`).
- ✅ Solo se han creado/modificado: este informe, `PROJECT_STATUS.md`, `docs/PROJECT_STATUS.md`.
- ✅ No se han introducido datos inventados: todos los valores técnicos proceden de `curl`/inspección directa; los datos GSC proceden literalmente del prompt de la tarea.
- ✅ Los datos GSC coinciden con el contexto proporcionado (sección 4).
