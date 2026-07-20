# Estado del Proyecto Kakebo AI

**Última actualización:** 2026-07-20 (SEO-ONPAGE-ALTERNATIVAS-FINTONIC-HEADINGS-02 — 2 headings alineados con la keyword Fintonic)  
**Último commit aceptado:** (ver hash final de esta tarea en el mensaje de cierre)  
**Rama operativa:** `main`

---

## SEO-ONPAGE-ALTERNATIVAS-FINTONIC-HEADINGS-02 — Alineación quirúrgica de 2 headings con la keyword Fintonic

**Fecha:** 2026-07-20
**Modelo:** Claude Code
**Estado:** ✅ Completado — **2 headings corregidos. Resto del artículo intacto.**
**Sprint:** SEO / Implementación editorial quirúrgica
**Tipo:** Corrección de los 2 headings expresamente aprobados en `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-ARCHITECTURE-02` (`6f6a4d8`, sección 7), continuando `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-CONTENT-INTRO-02` (`6ad176d`), para `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias`. **Sin cambios en frontmatter, title, seoTitle, description, H1, introducción, tabla, fichas, FAQ, enlaces, CTA, imágenes ni schema.**
**Documento de referencia:** `docs/seo/SEO_ONPAGE_ALTERNATIVAS_FINTONIC_ARCHITECTURE_02.md`

**Heading 1 (H2, introducción de la tabla):** "Comparativa: Mejores Alternativas a Apps Bancarias en 2026" → **"Comparativa: Alternativas a Fintonic y Apps Bancarias en 2026"** — alinea el heading con la keyword principal manteniendo el framing "Apps Bancarias" (wording literal de la arquitectura, sección 7).

**Heading 2 (H2, introducción de las fichas):** "Las 5 mejores alternativas a Fintonic, analizadas" → **"Las 8 alternativas a Fintonic, analizadas"** — corrige una inconsistencia numérica preexistente (el heading decía "5" mientras el cuerpo siempre comparó 8 apps) y elimina el claim "mejores" no justificado (wording literal de la arquitectura, sección 7).

**Otros headings propuestos en la arquitectura como opcionales** ("¿Qué es una alternativa a Fintonic y cómo elegirla?", "En resumen: ¿cuál elegir?", renombrar el heading de la FAQ) **no se han tocado** en esta tarea por no estar expresamente aprobados como cambio obligatorio — quedan disponibles para una tarea futura si se decide.

**Archivo de contenido modificado:** `src/content/blog/alternativas-a-app-bancarias.es.mdx` (diff de exactamente 2 líneas).

**Inventario de headings:** 8 H2 y 9 H3 en el cuerpo del artículo, idénticos antes y después (solo cambió el texto de 2 H2, ningún heading añadido, eliminado ni movido).

**Validaciones ejecutadas:** `tsc --noEmit` ✅ 0 errores; `eslint` ✅ 0 errores (mismo warning preexistente ajeno); `npm run build` ✅ compilado sin errores; servidor de producción local + `curl`/inspección HTML: 1 title, 1 meta description, 1 H1 (idénticos a `SNIPPET-02`), introducción de `CONTENT-INTRO-02` confirmada intacta, los 2 headings renderizados con el texto exacto aprobado, 9 H2 y 19 H3 totales en la página (incluyendo footer y posts relacionados) sin cambios respecto a la tarea anterior, tabla y fichas verificadas sin cambios, FAQPage (5 preguntas) y BreadcrumbList sin cambios, CTA presente, `/es/` sigue con 308 y `/en/` sigue `noindex, nofollow`; suite de tests: 582/583 (mismo fallo preexistente y ajeno en `calculate-whatif.test.ts`).

**Sin cambios en frontmatter, title, seoTitle, description, H1, introducción, tabla, alternativas, fichas, pros/contras, FAQ, enlaces, CTA, imágenes, fuentes, schema, canonical, hreflang, slug, sitemap ni robots.**

**STOP aplicado — no se inicia `SOURCES-02`, no se modifica ninguna otra parte del artículo.**

**Siguiente tarea recomendada:** `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-SOURCES-02`.

---

## SEO-ONPAGE-ALTERNATIVAS-FINTONIC-CONTENT-INTRO-02 — Optimización editorial quirúrgica de la introducción

**Fecha:** 2026-07-20
**Modelo:** Claude Code
**Estado:** ✅ Completado — **Introducción reescrita. Resto del artículo intacto.**
**Sprint:** SEO / Implementación editorial quirúrgica
**Tipo:** Reescritura de los 3 párrafos introductorios de `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias` (entre el H1 y la tabla comparativa) según el diseño de `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-ARCHITECTURE-02` (`6f6a4d8`), continuando `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-SNIPPET-02` (`de7efe1`). **Sin cambios en frontmatter, title, seoTitle, description, H1, H2/H3, tabla, fichas, FAQ, enlaces, CTA, imágenes ni schema.**
**Documento de referencia:** `docs/seo/SEO_ONPAGE_ALTERNATIVAS_FINTONIC_ARCHITECTURE_02.md`

**Objetivo del nuevo bloque:** responder de forma directa a "qué es una alternativa a Fintonic", cubrir los criterios de comparación (privacidad, precio, automatización, plataforma, forma de registro, perfil de usuario), explicar que no hay una única mejor opción para todos, y transicionar de forma neutral hacia la tabla — sin presentar Kakebo AI como ganador (no se menciona en la intro) y preservando el framing "apps bancarias".

**ANTES (152 palabras, 3 párrafos):** intro genérica centrada en "apps bancarias" sin definición directa de "alternativa a Fintonic", sin mención explícita de los criterios de comparación.

**DESPUÉS (150 palabras, 3 párrafos):** primer párrafo con respuesta directa GEO ("Una alternativa a Fintonic es cualquier aplicación o método..."), segundo párrafo con los 6 criterios de comparación explícitos y la afirmación de que no hay una única mejor opción, tercer párrafo de transición neutral hacia la tabla.

**Archivo de contenido modificado:** `src/content/blog/alternativas-a-app-bancarias.es.mdx` (únicamente los 3 párrafos entre el H1 y el separador previo a la tabla — diff de 3 líneas eliminadas / 3 añadidas, verificado).

**Validaciones ejecutadas:** `tsc --noEmit` ✅ 0 errores; `eslint` ✅ 0 errores (mismo warning preexistente de MDX sin config, ajeno); `npm run build` ✅ compilado sin errores; servidor de producción local + `curl`/inspección HTML: 1 title, 1 meta description, 1 H1 (todos idénticos a `SNIPPET-02`), 9 H2 y 19 H3 sin cambios, `FAQPage` (5 preguntas) y `BreadcrumbList` sin cambios, tabla comparativa (encabezados y fila Kakebo AI) verificada carácter a carácter sin cambios, CTA presente sin cambios, intro anterior confirmada ausente (0 coincidencias) y nueva intro confirmada presente; suite de tests: 582/583 (mismo fallo preexistente y ajeno en `calculate-whatif.test.ts`, no relacionado con blog/SEO).

**Ventana de medición:** contenido introductorio, 4-8 semanas.

**Sin cambios en frontmatter, title, seoTitle, description, H1, headings, tabla, alternativas, pros/contras, FAQ, enlaces, CTA, imágenes, fuentes, schema, canonical, hreflang, slug, sitemap ni robots.**

**STOP aplicado — no se inicia `HEADINGS-02`, no se modifica ninguna otra parte del artículo.**

**Siguiente tarea recomendada:** `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-HEADINGS-02`.

---

## SEO-ONPAGE-ALTERNATIVAS-FINTONIC-SNIPPET-02 — Implementación quirúrgica de title, meta description y H1

**Fecha:** 2026-07-20
**Modelo:** Claude Code
**Estado:** ✅ Completado — **Snippet y H1 implementados en producción.**
**Sprint:** SEO / Implementación on-page quirúrgica
**Tipo:** Implementación de la combinación de title/meta description/H1 aprobada en `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-ARCHITECTURE-02` (`6f6a4d8`) para `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias`. **Sin cambios en cuerpo, headings H2/H3, tabla, fichas, FAQ, enlaces, CTA, canonical, hreflang ni slug.**
**Documento de referencia:** `docs/seo/SEO_ONPAGE_ALTERNATIVAS_FINTONIC_ARCHITECTURE_02.md`

**Desacoplo title/H1:** el sistema de blog usaba un único campo `title` de frontmatter para el `<title>`, OG, Twitter, JSON-LD `headline` y el H1 visible — no permitía valores distintos. Se resolvió de forma localizada y retrocompatible: se añadió el campo opcional `seoTitle?: string` a la interfaz `BlogPost['frontmatter']` (`src/lib/blog.ts`) y se usó `post.frontmatter.seoTitle || post.frontmatter.title` en `generateMetadata()` (`src/app/[locale]/(public)/blog/[slug]/page.tsx`) para `<title>`, `openGraph.title` y `twitter.title`. El H1 y el JSON-LD `headline` siguen leyendo `post.frontmatter.title`. El fallback (`|| post.frontmatter.title`) garantiza que ningún otro post del blog cambia de comportamiento al no definir `seoTitle`. No se tocó el template visual ni ningún componente compartido más allá de este cambio mínimo.

**ANTES:**
- Title: "Alternativas a Apps Bancarias para Controlar Gastos sin Conectar el Banco (2026) | Blog Kakebo" (94 car. sin sufijo, sin "Fintonic")
- Meta description: 178 car.
- H1: idéntico al title

**DESPUÉS (verificado en `curl`/HTML renderizado en local, build de producción):**
- Title: "Alternativas a Fintonic y Apps Bancarias (2026): 8 Opciones | Blog Kakebo" (59 car. sin sufijo, 73 con sufijo)
- Meta description: "Comparamos 8 alternativas a Fintonic en 2026: con y sin conexión bancaria, precio y privacidad. Encuentra la que se adapta a ti, sin ceder tus datos." (149 car.)
- H1: "Alternativas a Fintonic: 8 apps para controlar tus gastos sin ceder tus datos" (77 car., distinto del title)

**Archivos modificados:** `src/content/blog/alternativas-a-app-bancarias.es.mdx` (frontmatter: `title`, `seoTitle` nuevo, `excerpt`, `updatedDate` → `2026-07-20`), `src/lib/blog.ts` (campo opcional `seoTitle` en la interfaz), `src/app/[locale]/(public)/blog/[slug]/page.tsx` (uso de `seoTitle` en metadata).

**Validaciones ejecutadas:** `tsc --noEmit` ✅ 0 errores; `eslint` sobre los 3 archivos ✅ 0 errores (1 warning preexistente y ajeno, import no usado no tocado por este cambio); `npm run build` ✅ compilado sin errores; servidor de producción local + `curl`/inspección HTML: 1 sola `<title>`, 1 sola meta description, 1 solo H1 (distinto del title), OG/Twitter con `seoTitle`, canonical sin cambios, JSON-LD (`BlogPosting` headline, `BreadcrumbList`, `FAQPage` con 5 preguntas) coherente y sin duplicar, tabla/CTA/intro/H2/H3 verificados byte a byte sin cambios, `/es/` sigue con 308 y `/en/` sigue `noindex, nofollow` con su propio contenido sin tocar; suite de tests: 582/583 (1 fallo preexistente y ajeno en `calculate-whatif.test.ts`, no relacionado con blog/SEO).

**Baseline GSC previo (sin modificar en esta tarea, solo de referencia para medición futura):** 4 clics · 459 impresiones · CTR ≈0,87% · posición media ≈8,19 (agregado); cluster Fintonic: 1 clic · 131 impresiones · CTR ≈0,76% · posición ≈9,75.

**Ventana mínima de medición del snippet:** 2-4 semanas antes de evaluar impacto en CTR/posición.

**Sin cambios en cuerpo del artículo, headings H2/H3, tabla, fichas, FAQ, enlaces, CTA, analytics, canonical, hreflang, slug, sitemap ni robots.**

**STOP aplicado — no se inicia `CONTENT-INTRO-02`, no se modifica ninguna otra parte de la URL.**

**Siguiente tarea recomendada:** `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-CONTENT-INTRO-02`.

---

## SEO-ONPAGE-ALTERNATIVAS-FINTONIC-ARCHITECTURE-02 — Arquitectura de optimización SEO/editorial/GEO/CTA

**Fecha:** 2026-07-20
**Modelo:** Claude Code
**Estado:** ✅ Completado — **Arquitectura diseñada. Sin implementación.**
**Sprint:** SEO / Arquitectura on-page (diseño exclusivo, sin cambios de código, contenido ni metadata)
**Tipo:** Diseño de la arquitectura definitiva de optimización de `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias` — snippet, primer bloque visible, jerarquía de headings, tabla comparativa, alternativas, política de fuentes, GEO, FAQ, enlazado interno, CTA y schema — a partir de `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-VALIDATION-02` (`035ed25`) y `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-KEYWORD-SERP-02` (`0a946c3`). **Sin cambios en artículo, metadata, title, description, H1, headings, tabla, alternativas, FAQ, enlaces, CTA, schema, canonical, hreflang, slug ni componentes.**
**Documento:** `docs/seo/SEO_ONPAGE_ALTERNATIVAS_FINTONIC_ARCHITECTURE_02.md`

**Combinación de snippet recomendada (diseño, no implementada):** title `"Alternativas a Fintonic y Apps Bancarias (2026): 8 Opciones"`; meta description centrada en cobertura con/sin conexión bancaria y privacidad; H1 `"Alternativas a Fintonic: 8 apps para controlar tus gastos sin ceder tus datos"`. Preserva explícitamente el framing "apps bancarias" para no perder el 71% de impresiones no-Fintonic.

**Plan de implementación atómico (7 tareas, no ejecutadas):** `SNIPPET` → `CONTENT-INTRO` → `HEADINGS` → `SOURCES` (paralela) → `FAQ-GEO` → `INTERNAL-LINKING` → `PRODUCTION-VALIDATION`. Cada una con archivos, dependencias, riesgos y criterio de cierre definidos. Modelo asignado: Claude Code en todas; revisión con Codex recomendable solo en `SOURCES` (verificación de datos de terceros).

**Elementos protegidos:** slug, canonical, redirect 308 de `/es/`, noindex de EN, tabla comparativa (8 filas), fichas Pros/Contras, FAQ, schema `FAQPage`/`BlogPosting`/`BreadcrumbList`, enlazado entrante, framing "apps bancarias", neutralidad editorial (Kakebo AI tratado en igualdad de condiciones dentro de la comparativa). Hallazgo técnico T-01 (hreflang en HTTP Link header) explícitamente fuera de alcance.

**Sin cambios funcionales de ningún tipo — tarea exclusivamente documental.**

**STOP aplicado — no se implementa ninguna tarea del plan, no se modifica la URL.**

**Siguiente tarea recomendada:** `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-SNIPPET-02` (primera tarea atómica del plan de implementación).

---

## SEO-ONPAGE-ALTERNATIVAS-FINTONIC-KEYWORD-SERP-02 — Investigación de keywords, intención y SERP competitiva

**Fecha:** 2026-07-20
**Modelo:** Claude Code
**Estado:** ✅ Completado — **Investigación documentada. Sin implementación.**
**Sprint:** SEO / Investigación on-page (diagnóstico exclusivo, sin cambios de código, contenido ni metadata)
**Tipo:** Investigación de keyword principal, variantes, intención de búsqueda y SERP competitiva para `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias`, a partir de datos GSC, datos SE Ranking (julio 2026, mercado ES) y observación manual + verificación directa de la SERP para "alternativas a fintonic". Continúa `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-VALIDATION-02` (commit `035ed25`). **Sin cambios en artículo, metadata, title, description, H1, headings, enlaces, schema, canonical, hreflang, slug ni componentes.**
**Documento:** `docs/seo/SEO_ONPAGE_ALTERNATIVAS_FINTONIC_KEYWORD_SERP_02.md`

**Decisión de keyword:** principal `alternativas a fintonic`; variante primaria `alternativa a fintonic`; variantes secundarias `fintonic alternativas`, `alternativa fintonic`, `fintonic alternativa`, `alternativas fintonic` (mismo volumen/dificultad, cubrir semánticamente en cuerpo, no en title/H1). Descartadas: `qué es Fintonic`, `Fintonic es seguro`/`estafa`, `Fintonic empresas`, `Mint` como keyword propia en ES.

**Hallazgo principal:** hipótesis de partida confirmada — la SERP para "alternativas a fintonic" está dominada por listicles con keyword exacta en title/H1, número de alternativas y año 2026 (verificado directamente en Banktrack, posición 2/4, y Cashual, posición 11); el snippet actual de MetodoKakebo.com no sigue ese patrón (sin "Fintonic", sin número, title de 94 caracteres), lo que es coherente con el CTR bajo pese a posición razonable (≈9) y autoridad de página muy baja (Page Trust 3, 0 backlinks).

**Advertencia documentada:** el title mostrado por SE Ranking ("Las 7 Mejores Alternativas a Fintonic en 2026 - Kakebo") es un dato histórico/legacy asociado a la URL `/es/` (que redirige 308), no el snippet actual real, verificado en producción el 2026-07-20.

**Canibalización:** descartada — ninguna otra URL del sitio targetea "Fintonic" como entidad principal; el componente `SoftwareAppJsonLd.tsx` que menciona "Fintonic" no está importado en ningún punto del código y no genera señal SEO real.

**Sin cambios funcionales de ningún tipo — tarea exclusivamente documental.**

**STOP aplicado — no se inicia arquitectura, no se modifica la URL, no se implementa title, meta ni H1.**

**Siguiente tarea recomendada:** `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-ARCHITECTURE-02` (diseño de title, meta, H1, primer bloque visible, jerarquía H2/H3, bloque GEO y descomposición en tareas atómicas de implementación — sin ejecutar la implementación en esa misma tarea).

---

## SEO-ONPAGE-ALTERNATIVAS-FINTONIC-VALIDATION-02 — Validación SEO/técnica/editorial de `alternativas-a-app-bancarias`

**Fecha:** 2026-07-20
**Modelo:** Claude Code
**Estado:** ✅ Completado — **Diagnóstico documentado. Sin implementación.**
**Sprint:** SEO / Validación on-page (diagnóstico exclusivo, sin cambios de código, contenido ni metadata)
**Tipo:** Validación de `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias` (URL priorizada por GSC: 4 clics, 459 impresiones, CTR ≈0,87%, posición media ≈8,19; cluster "alternativas a fintonic"). Cubre repositorio, inventario de archivos, HTML real de producción en 3 variantes (sin prefijo, `/es/`, `/en/`), intención, snippet, contenido, estructura/GEO, enlazado y conversión. **Sin cambios en artículo, metadata, title, description, headings, enlaces, schema, canonical, hreflang, slug ni componentes.**
**Documento:** `docs/seo/SEO_ONPAGE_ALTERNATIVAS_FINTONIC_VALIDATION_02.md`

**Hallazgo principal (CONFIRMADO):** el `title` actual (94 caracteres) no contiene "Fintonic" — keyword del 100% del cluster de consultas objetivo — y excede la longitud recomendada en SERP; la `meta description` (178 caracteres) también la excede. Causa más probable del CTR bajo pese a posición media razonable.

**Hallazgo técnico (CONFIRMADO):** discrepancia entre el HTTP `Link` header (anuncia `hreflang="en"`) y el `<head>` HTML (correctamente sin `en`, por ser la variante EN `noindex`). Origen no determinado — pendiente de investigación técnica independiente.

**Descartado:** canibalización entre variantes (`/es/` redirige 308 correcto; `/en/` sirve `noindex, nofollow` y está excluida del sitemap); apps comparadas desactualizadas (Spendee y Toshl verificadas operativas en 2026 vía búsqueda web); enlaces rotos; contenido oculto o fragmentos concatenados.

**Dudoso:** fragmentación de señales GSC entre variantes por indexación histórica previa a las correcciones ya aplicadas (no verificable sin acceso a GSC por URL); posible sesgo de objetividad por promoción del producto propio dentro de una comparativa neutral; ausencia de fuente en claims genéricos sobre modelo de negocio fintech.

**Validaciones ejecutadas:** `git status`/`fetch`/`log`/`diff` (repositorio limpio y sincronizado con `origin/main` antes de empezar), `curl -D -` contra las 3 variantes de producción, inspección de `sitemap.xml` en producción, verificación web de vigencia de 2 apps competidoras, lectura íntegra de `page.tsx`, `sitemap.ts`, `robots.ts`, `middleware.ts`, `i18n/routing.ts` y ambos `.mdx`.

**Sin cambios funcionales de ningún tipo — tarea exclusivamente documental.**

**STOP aplicado — no se implementan correcciones, no se inicia keyword research, no se modifica la URL.**

**Siguiente tarea recomendada:** `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-KEYWORD-SERP-02` (análisis de SERP del cluster "alternativas a fintonic" antes de decidir cómo reintroducir la keyword en title/H1).

---

## SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-ANALYTICS-PRODUCTION-VALIDATION-01 — Validación de analytics en producción y cierre del bloque

**Fecha:** 2026-07-18
**Modelo:** Claude Code
**Estado:** ✅ Completado — **Analytics validado en producción. Bloque `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL` cerrado formalmente.**
**Sprint:** SEO / QA producción (validación exclusiva, sin cambios de código)
**Tipo:** Validación de los 3 eventos de analytics (`inflation_calculator_mode_change`, `historical_inflation_calculation`, `historical_inflation_error`) en `https://www.metodokakebo.com/herramientas/calculadora-inflacion` (real, sin caché confirmado). **Sin cambios en componentes, analytics funcional, traducciones, dataset, lógica, tests, metadata ni schema.**
**Documentos:** `docs/analytics/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_ANALYTICS_PRODUCTION_VALIDATION_01.md`

**Analytics validado:** los 3 eventos confirmados en producción real mediante interceptación de `window.gtag` y solicitudes de red reales a `google-analytics.com/g/collect`. 5 alternancias de modo contabilizadas exactamente (0 duplicados en clic repetido sobre pestaña activa, 0 eventos en render inicial), caso oficial (2002-01→2025-01, +67,9%) con `interval_months: 276` y `result_type: "inflation"` correctos, mismo periodo (`no_change`), deflación (`deflation`), error de cantidad (`INVALID_AMOUNT`, clic y Enter), error de orden de periodos (`INVALID_PERIOD_ORDER`, sin fuga de periodos en el payload).

**Privacidad confirmada:** ningún payload contiene cantidad inicial, cantidad equivalente, variación monetaria, índices IPC, porcentaje exacto, ni datos personales.

**Consentimiento:** el proyecto no implementa CMP/banner de cookies (arquitectura preexistente); GA4 carga incondicionalmente. No se ha introducido ningún bypass porque no existía mecanismo de consentimiento que sortear.

**Funcionamiento sin analytics:** confirmado en producción con `window.gtag` forzado a `undefined` — cambio de modo y cálculo siguen funcionando sin excepciones ni ruptura de interfaz.

**Hallazgos:** 2 `LIMITACIÓN DE VALIDACIÓN` no bloqueantes (código `503` uniforme en todas las solicitudes de red, atribuible a la herramienta de inspección y no a un rechazo real de GA4; discrepancia entre llamadas JS interceptadas — 5 — y solicitudes de red observadas — 3 — para el cambio de modo, consistente con agrupación de eventos de `gtag.js`, sin evidencia de duplicación real). Ningún hallazgo bloqueante, alto, medio ni bajo.

**Bloque cerrado — completadas:** arquitectura, investigación oficial, dataset, actualización, lógica, tests (67/67), UI, revisión, traducciones, integración, validación de producción, corrección de cantidad, analytics, validación de analytics.

**Estado final de la URL:** `IMPLEMENTACIÓN COMPLETADA — EN FASE DE MEDICIÓN` (no se declara éxito SEO orgánico; pendiente de ventanas de medición GSC de 2–12 semanas).

**Validaciones ejecutadas:** tests de analytics ✅ 10/10, test específico ✅ 67/67, suite completa 582/583 (mismo fallo ajeno), `tsc` ✅, `lint` ✅, `build` ✅.

**Sin cambios funcionales de ningún tipo — tarea exclusivamente documental.**

**STOP aplicado — no se implementan más cambios, no se añaden eventos, no se modifica SEO, no se corrige deuda previa, no se inicia otra optimización de esta URL, no se solicita reindexación.**

**Siguiente tarea recomendada:** ninguna de desarrollo. Próxima acción: medición pasiva en GA4 (desde ya) y en GSC (ventanas de 2–4, 4–8 y 8–12 semanas), sin nueva implementación sobre esta URL salvo que la medición revele un defecto.

---

## SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-ANALYTICS-01 — Medición del modo histórico de inflación

**Fecha:** 2026-07-17
**Modelo:** Claude Code
**Estado:** ✅ Completado
**Sprint:** SEO / Analytics — instrumentación aislada, sin cambios funcionales
**Tipo:** Implementación de eventos de analytics. **Sin cambios en dataset, lógica matemática, traducciones, metadata, schema, ni en el modo futuro salvo la llamada estrictamente necesaria para registrar el cambio de tab.**
**Documentos:** `docs/analytics/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_ANALYTICS_01.md`

**Analytics implementado:** se reutiliza la utilidad centralizada existente `src/lib/analytics.ts` (`analytics.track`), sin crear un sistema nuevo. Tres eventos nuevos añadidos a la unión `EventName`:

1. `inflation_calculator_mode_change` — `{ mode_from, mode_to, source_page }`, disparado desde una nueva función `handleModeChange` en `CalculatorInflation.tsx` (clic y teclado), con guard `next === mode` que evita duplicados y evita disparos en el render inicial.
2. `historical_inflation_calculation` — `{ start_period, end_period, interval_months, result_type, source_page }`, disparado en `CalculatorInflationHistorical.tsx` tras un cálculo válido. `interval_months` se calcula con una utilidad local nueva; `result_type` (`inflation`/`deflation`/`no_change`) se deriva del signo de `cumulativeInflationPercentage` ya calculado por el dominio.
3. `historical_inflation_error` — `{ error_code, source_page }`, con 6 códigos estables (`INVALID_AMOUNT`, `INVALID_PERIOD_FORMAT`, `PERIOD_NOT_AVAILABLE`, `INVALID_PERIOD_ORDER`, `DATASET_INCONSISTENCY`, `UNEXPECTED_ERROR`), disparado en cada rama de error existente de `handleSubmit`.

**Privacidad:** no se envía la cantidad introducida, la cantidad equivalente, la variación monetaria exacta, los índices IPC ni el porcentaje exacto de inflación; tampoco identificadores personales, correo, user ID, IP ni datos de sesión adicionales.

**Validaciones completadas:** test específico ✅ 67/67, suite completa ✅ 582/583 (572 previos + 10 tests nuevos; único fallo ajeno preexistente: `calculate-whatif.test.ts`), `tsc` ✅, `lint` ✅, `build` ✅. Evento de cambio de modo validado manualmente en harness Vite aislado (clic, teclado, sin duplicados en clic repetido sobre la pestaña activa, sin disparo en el render inicial). Eventos de cálculo/error cubiertos por 8 tests de componente nuevos.

**URL pendiente únicamente de validación final y cierre:** el código está listo para producción; queda pendiente una tarea exclusiva de validación en producción real que confirme que GA4 recibe los tres eventos con los parámetros esperados (no realizada en esta tarea, fuera de alcance explícito).

**Hallazgos preexistentes aún abiertos (no tocados):** NaN con cantidad cero en modo futuro; etiqueta "AÑOS" sin traducir; desbordamiento horizontal a 320/375px; fallo preexistente y ajeno en `calculate-whatif.test.ts`.

**STOP aplicado — no se valida en producción, no se modifica metadata/schema, no se solicita reindexación, no se corrigen defectos ajenos, no se inicia el cierre final.**

**Siguiente tarea recomendada:** validar en producción real (tras el despliegue) que los tres eventos nuevos llegan correctamente a GA4 con los parámetros esperados, sin cambios de código.

---

## SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-AMOUNT-INPUT-FIX-01 — Corrección del bloqueo nativo del input de cantidad (H1)

**Fecha:** 2026-07-17
**Modelo:** Claude Code
**Estado:** ✅ Completado
**Sprint:** SEO / QA — corrección de defecto único
**Tipo:** Corrección funcional aislada. **Sin cambios en `CalculatorInflation.tsx`, traducciones, dataset, lógica de dominio, tests de dominio, modo futuro/proyección, analytics, metadata ni schema.**
**Documentos:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_AMOUNT_INPUT_FIX_01.md`

**Defecto corregido (H1):** el input de cantidad del modo histórico usaba `type="number" min="0" step="any"`, lo que permitía que la validación nativa HTML5 del navegador bloqueara silenciosamente el envío del formulario para valores inválidos (`-1`, `+`, `-`, `.`, etc.), tanto por clic como por Enter, sin que el `onSubmit` de React se ejecutara nunca.

**Causa raíz:** atributos nativos de restricción (`type="number"`, `min`, `step`) interceptando el evento `submit` antes de que llegara al handler de React. La lógica de validación estricta (`STRICT_AMOUNT_PATTERN`, `parseStrictAmount`, `handleSubmit`) ya era correcta y no requirió cambios.

**Solución aplicada:** cambio del input a `type="text" inputMode="decimal" autoComplete="off"`, manteniendo el teclado numérico en móviles y sin reducir accesibilidad (`aria-invalid`, `aria-describedby` sin cambios).

**Validación completada:** confirmado por clic real y por Enter que `invalidAmountError` se muestra siempre para valores inválidos, el resultado anterior se limpia siempre, y el valor introducido se preserva. Comprobados los 6 valores válidos (`0`, `1`, `1000`, `1000.50`, `0.01`, `999999999999`) y los 12 valores inválidos (cadena vacía, `-1`, `+`, `-`, `.`, `1e`, `1000abc`, `1000 200`, `1,5`, `NaN`, `Infinity`, `-Infinity`) requeridos. Botón de reset verificado (restaura `1000`, limpia error, recalcula resultado por defecto).

**URL preparada para analytics:** no aplica — esta tarea no instrumenta analytics (fuera de alcance explícito).

**Hallazgos preexistentes aún abiertos (no tocados):** NaN con cantidad cero en modo futuro; etiqueta "AÑOS" sin traducir en inglés; desbordamiento horizontal a 320/375px; fallo preexistente y ajeno en `calculate-whatif.test.ts`.

**Validaciones ejecutadas:** test específico ✅ 67/67, suite completa 572/573 (mismo fallo ajeno), `tsc` ✅, `lint` ✅ (0 errores, warnings preexistentes), `build` ✅.

**STOP aplicado — no se añade analytics, no se corrige el modo futuro, no se corrige el desbordamiento móvil, no se modifican traducciones/metadata/schema, no se solicita reindexación, no se inicia la siguiente tarea.**

**Siguiente tarea recomendada:** corregir el desbordamiento horizontal a 320/375px en el modo histórico (defecto preexistente ya documentado), manteniendo fuera de alcance el modo futuro/proyección.

---

## SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-PRODUCTION-VALIDATION-01 — Validación en producción de ambos modos

**Fecha:** 2026-07-17
**Modelo:** Claude Code
**Estado:** ✅ Completado — **URL aprobada para continuar (no bloqueada)**
**Sprint:** SEO / QA producción (validación exclusiva, sin cambios de código)
**Tipo:** Validación funcional, visual y de accesibilidad en `https://www.metodokakebo.com/herramientas/calculadora-inflacion` (real, sin caché confirmado). **Sin cambios en componentes, traducciones, dataset, lógica, tests, analytics, metadata ni schema.**
**Documentos:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_PRODUCTION_VALIDATION_01.md`

Validado en producción real (HTML sin caché: `X-Vercel-Cache: MISS`, `Age: 0`): selector de modos (10 alternancias, 1 solo panel visible siempre, sin defecto `hidden`/`grid`), conservación de estado entre modos, modo futuro sin regresión (-2.559€/7.441€), caso oficial histórico exacto (+67,9%/1.678,88€/678,88€), mismo periodo (0%), deflación real (-0,7%, color esmeralda), orden invertido (error correcto), cantidad cero (sin NaN/Infinity), reset, traducciones ES/EN completas (sin claves crudas), accesibilidad ARIA (tab/tabpanel, roving tabIndex, sin IDs duplicados), red (0 llamadas a servicios.ine.es, todo local).

**Hallazgo confirmado — ALTO (H1):** el input de cantidad del modo histórico (`type="number" min="0"`) permite que la validación nativa del navegador bloquee silenciosamente el envío con valores como `-1` o `+` (clic real o Enter), sin mostrar el error personalizado ni limpiar el resultado anterior. No bloqueante para el uso normal; recomendado corregir (`type="text" inputMode="decimal"`) antes de instrumentar analytics de errores.

**Otros hallazgos:** error de hidratación React #418 observado una vez, no reproducido en 3 recargas (NO REPRODUCIBLE); NaN con cantidad 0 en modo futuro y etiqueta "AÑOS" sin traducir en inglés (PREEXISTENTES, modo futuro no tocado); desbordamiento horizontal a 320/375px (PREEXISTENTE, confirmado idéntico antes/después de la integración vía `git stash` en la tarea anterior, no agravado por el selector).

**Validaciones ejecutadas:** test específico ✅ 67/67, suite completa 572/573 (mismo fallo ajeno), `tsc` ✅, `lint` ✅, `build` ✅.

**Sin cambios funcionales de ningún tipo — tarea exclusivamente documental.**

**STOP aplicado — no se corrigen defectos, no se añade analytics, no se modifica metadata/schema, no se solicita reindexación, no se inicia la siguiente tarea.**

**Siguiente tarea recomendada:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-AMOUNT-INPUT-FIX-01` (corregir H1).

---

## SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-INTEGRATION-01 — Integración del modo histórico en la calculadora pública

**Fecha:** 2026-07-17
**Modelo:** Claude Code
**Estado:** ✅ Completado — **modo histórico visible en producción tras el próximo deploy; analytics del nuevo modo pendientes (fuera de alcance)**
**Sprint:** SEO / UI (integración, sin analytics)
**Tipo:** Integración de UI en `/herramientas/calculadora-inflacion`. **Sin cambios en dataset, lógica de dominio, tests de dominio, metadata, schema, slug ni analytics.**
**Documentos:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_INTEGRATION_01.md`

Integra `CalculatorInflationHistorical` (aprobado en `HISTORICAL-UI-REVIEW-01`) dentro de `CalculatorInflation.tsx` mediante un selector de tabs accesible (`role="tablist"`/`tab`/`tabpanel`, navegación por flechas, `useId()` para IDs únicos). El modo futuro (proyección) permanece intacto y como modo inicial; ambos paneles quedan montados y ocultos con `hidden` para preservar el estado del modo histórico al alternar. Traducciones conectadas vía `t("historical.*")` desde el namespace `Tools.Inflation.historical` ya creado, más una nueva clave `Tools.Inflation.modeSelector` (label, future, historical) en ES/EN.

**Defecto real encontrado y corregido:** el panel del modo futuro combinaba el atributo `hidden` con la clase Tailwind `grid` en el mismo `<div>`, y la regla de utilidad `.grid{display:grid}` ganaba la cascada sobre `[hidden]{display:none}` del user-agent, dejando el panel visible pese a `hidden`. Corregido separando el wrapper `hidden` de la clase de display en un `<div>` anidado adicional. Verificado con `getBoundingClientRect()`/`offsetParent` tras el fix.

**Validación visual real** (navegador + harness temporal Vite, mismo mecanismo de mitigación que `HISTORICAL-UI-REVIEW-01` por inestabilidad del router local de Next/Turbopack): estado inicial futuro (10.000€/3%/10 años → -2.559€/7.441€), cambio de modo con preservación de estado, caso oficial histórico, deflación real (2002-06→2002-07, -0,7%, color esmeralda), periodo invertido (error mostrado), mismo periodo con cantidad 0, navegación por teclado (flechas), responsive 768px sin desborde. Detectado un desbordamiento horizontal a 320/375px, **confirmado preexistente** (idéntico antes de esta tarea, vía comparación con `git stash`), no introducido por el selector.

**Validaciones ejecutadas:** test específico ✅ 67/67, suite completa 572/573 (mismo fallo ajeno), `tsc` ✅, `lint` ✅ (0 errores, 76 warnings preexistentes), `build` ✅.

**Sin cambios en el dataset, la lógica de dominio, los tests de dominio, la página pública (metadata/schema/slug), ni analytics.**

**STOP aplicado — no se añade analytics, no se modifica metadata/schema, no se inicia la siguiente tarea.**

**Siguiente tarea recomendada:** decidir y documentar la estrategia de analytics para el modo histórico.

---

## SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-I18N-01 — Traducciones del modo histórico de inflación

**Fecha:** 2026-07-17
**Modelo:** Claude Code
**Estado:** ✅ Completado — **componente todavía no integrado en producción (fuera de alcance)**
**Sprint:** SEO / i18n (traducciones del modo histórico, sin integración)
**Tipo:** Traducciones ES/EN (`next-intl`). **Sin cambios en el componente, en la calculadora pública, en el dataset, en la lógica de dominio ni en los tests.**
**Documentos:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_I18N_01.md`

Añade el namespace `Tools.Inflation.historical` en `messages/es.json` y `messages/en.json`, con las 22 claves exactas requeridas por `CalculatorInflationHistoricalLabels` (`src/components/landing/tools/CalculatorInflationHistorical.tsx`). `purchasingPowerChangeLabel` se traduce de forma neutral ("Variación del valor" / "Change in value"), sin usar "pérdida de poder adquisitivo" ni asumir signo, conforme al riesgo ya anticipado en `HISTORICAL-UI-REVIEW-01` (`requiredNominalIncrease` puede ser positivo, cero o negativo). Fuente identificada como "Instituto Nacional de Estadística (INE)" / "Spanish National Statistics Institute (INE)", sin enlaces ni HTML embebido.

**Paridad de claves validada:** 22/22 en ambos idiomas, coincidencia exacta con el contrato de labels, sin claves vacías, sin interpolación de variables no consumidas por el componente.

**Validaciones ejecutadas:** JSON válido ✅, paridad de claves ✅, test específico de inflación ✅ 67/67, suite completa 572/573 (mismo fallo preexistente y ajeno `calculate-whatif.test.ts`), `tsc` ✅, `lint` ✅ (0 errores, 76 warnings preexistentes), `build` ✅.

**Sin cambios en el componente histórico, en `CalculatorInflation.tsx`, en páginas públicas, en el dataset, en la lógica de dominio, en los tests, en analytics ni en dependencias.**

**STOP aplicado — no se integra el componente, no se crea el selector de modos, no se inicia la siguiente tarea.**

**Siguiente tarea recomendada:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-INTEGRATION-01`.

---
## SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-UI-REVIEW-01 — Auditoría técnica del componente histórico aislado

**Fecha:** 2026-07-17
**Estado:** ✅ Completado — **componente aislado aprobado para integración futura; sin integración, sin traducciones, sin analytics**
**Sprint:** SEO / Frontend / QA
**Tipo:** Revisión técnica + corrección acotada en un único componente.
**Documentos:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_UI_REVIEW_01.md`

Audita `src/components/landing/tools/CalculatorInflationHistorical.tsx` frente al alcance aprobado y corrige **5 defectos confirmados** sin tocar dataset, dominio, tests ni la calculadora pública:
- parsing de cantidad demasiado permisivo por `parseFloat` (endurecido con conversión estricta, sin parsing parcial);
- IDs estáticos reutilizables (corregido con `useId`);
- contrato de labels incompleto (añadidos `startIndexLabel`, `endIndexLabel`, `emptyStateMessage`);
- asociación incompleta de errores a controles de periodo (`aria-invalid` / `aria-describedby`);
- formateadores `Intl.NumberFormat` sin fallback ante `locale` inválido.

**Hallazgos descartados:** estado inicial, periodos, deflación, acceso al dominio, aislamiento del componente, ausencia de red/analytics/Supabase y precisión del cálculo.  
**Revisión visual real ejecutada:** harness temporal Vite + Chrome headless en 320, 375, 768 y 1440 px; estados renderizados: inicial, cero, decimal, mismo periodo, periodo invertido, deflación, cantidad inválida e importe grande.  
**Incidencia de QA local documentada:** el primer intento sobre Next local quedó bloqueado por `ERR_TOO_MANY_REDIRECTS`; no se contabilizó como revisión válida.

**Validaciones ejecutadas:** test específico de inflación ✅ 67/67, suite global ✅ 572/573 (único fallo ajeno preexistente permitido: `calculate-whatif.test.ts`), `tsc --noEmit` ✅, `lint` ✅, `build` ✅.

**Sin cambios en** `CalculatorInflation.tsx`, páginas públicas, dataset, lógica de dominio, tests permanentes, traducciones, metadata, schema, analytics o dependencias.

**Siguiente tarea recomendada:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-INTEGRATION-01`.

---


## SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-UI-01 — Interfaz funcional aislada del modo histórico

**Fecha:** 2026-07-17
**Estado:** ✅ Completado — **Aislada, sin integración en la calculadora pública, selector de modo, traducciones ni analytics (fuera de alcance)**
**Sprint:** SEO / Datos / Frontend (UI aislada)
**Tipo:** Componente React cliente aislado (`CalculatorInflationHistorical.tsx`). **Sin cambios en la lógica de dominio, dataset, script de actualización, traducciones ni analytics.**
**Documentos:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_UI_01.md`

Crea `src/components/landing/tools/CalculatorInflationHistorical.tsx` que permite calcular la inflación acumulada utilizando la lógica ya validada de `src/lib/inflation`.
- **Contrato de props:** Toda etiqueta, placeholder y mensaje de error se inyecta desde las props (`labels: CalculatorInflationHistoricalLabels` y `locale: string`), evitando traducciones en duro o importar `useTranslations`.
- **Inicialización:** Carga por defecto con un importe de 1000 €, último mes disponible como mes final, y 12 meses antes como mes inicial (obtenidos dinámicamente). Ejecuta el cálculo al montar para mostrar resultados de inmediato.
- **Formateo localizado:** Usa `Intl.DateTimeFormat` para formatear los periodos a partir de cadenas `"YYYY-MM"` y `Intl.NumberFormat` para importes y porcentajes respetando el `locale`.
- **Lógica e índices:** Los índices del IPC se muestran con sus exactamente 3 decimales nativos. Maneja la deflación con variaciones nominales negativas sin truncar a cero y adaptando el estilo visual (verdes).
- **Accesibilidad y Responsive:** 100% navegable con teclado, inputs vinculados a etiquetas por IDs, contenedor de error con `role="alert"`, resultados con `aria-live="polite"` y grid responsive Tailwind.
- **Acción de reinicio:** Limpia resultados y errores restaurando el pre-cálculo por defecto.

**Validaciones ejecutadas:** test específico de inflación ✅ 67/67, suite global ✅ 572/573 (único fallo ajeno y preexistente permitido), `tsc --noEmit` ✅, `lint` ✅ (0 fallos en código nuevo), `build` ✅.

**Sin cambios en dataset, lógica, tests unitarios, componentes de producción (`CalculatorInflation.tsx`), traducciones ni analytics.**

**STOP aplicado — no se integra en CalculatorInflation.tsx ni se inicia la siguiente tarea.**

**Siguiente tarea recomendada:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-INTEGRATION-01`.

---

## SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-TESTS-01 — Tests unitarios de la lógica histórica

**Fecha:** 2026-07-17
**Estado:** ✅ Completado — **UI, selector de modo, traducciones y analytics siguen sin implementar (fuera de alcance)**
**Sprint:** SEO / Datos (tests de dominio, sin UI)
**Tipo:** Tests unitarios permanentes (Vitest). **Sin cambios en la lógica de producción (no se detectaron defectos), sin cambios en el dataset ni en el script de actualización.**
**Documentos:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_TESTS_01.md`

Crea `src/__tests__/lib/inflation/historical.test.ts` (67 tests) cubriendo: cobertura del dataset (primer/último periodo, total 294, orden cronológico, ausencia de huecos), consulta de índices (valores exactos, sin interpolación ni fallback al mes más cercano), el caso oficial 2002-01→2025-01 (67,888...%, verificado con `toBeCloseTo` sobre la cifra completa, no solo el 67,9% redondeado), periodos iguales (factor 1, incluyendo un límite de cobertura y `amount=0`), deflación real del dataset (2002-06→2002-07, sin forzar a cero), validación de cantidades (negativa, `NaN`, `Infinity`, `-Infinity`, string forzada), 13 formatos de periodo inválidos, orden cronológico, contrato de errores (`InflationError`, 5 códigos), inmutabilidad de `getAvailablePeriods()`/`getDatasetCoverage().periods` (arrays congelados), determinismo y exportaciones públicas. Ningún mock usado (dataset real en todos los casos).

**Ningún defecto encontrado** — no se modificó ningún archivo de `src/lib/inflation/{types,errors,historical,index}.ts`.

**Resultado de la suite completa:** 573 tests (506 preexistentes + 67 nuevos), 572 pasan, 1 falla (mismo fallo preexistente y ajeno: `calculate-whatif.test.ts`).

**Validaciones ejecutadas:** test específico ✅ 67/67, suite completa (572/573, fallo ajeno conocido), `tsc` ✅, `lint` ✅ (0 errores, 76 warnings preexistentes), `build` ✅.

**Sin cambios en el dataset, el script de actualización, componentes React, páginas, traducciones, metadata, schema ni analytics. Sin corrección del test ajeno preexistente.**

**STOP aplicado — no se implementa UI, selector de modo, ni se inicia la siguiente tarea.**

**Siguiente tarea recomendada:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-UI-01`.

---

## SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-LOGIC-01 — Lógica de dominio del cálculo histórico

**Fecha:** 2026-07-17
**Estado:** ✅ Completado — **UI, selector de modo, campos de fecha, traducciones y analytics siguen sin implementar (fuera de alcance)**
**Sprint:** SEO / Datos (lógica de dominio, sin UI)
**Tipo:** Lógica de dominio pura (TypeScript). **Sin componentes React, sin tests unitarios permanentes, sin cambios en el dataset ni en el script de actualización.**
**Documentos:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_LOGIC_01.md`

Crea `src/lib/inflation/{types.ts,errors.ts,historical.ts,index.ts}`: valida la integridad del dataset una sola vez al cargar el módulo (metadata, huecos, duplicados, orden cronológico, cobertura declarada vs. real) y expone `calculateHistoricalInflation({ amount, startPeriod, endPeriod })` con las fórmulas oficiales (`adjustmentFactor = endIndex/startIndex`, `cumulativeInflationPercentage = (endIndex/startIndex - 1) × 100`, `equivalentAmountAtEnd`, `requiredNominalIncrease`), sin redondeo interno. Funciones de acceso a la cobertura (`getDatasetCoverage`, `getFirstAvailablePeriod`, `getLastAvailablePeriod`, `getTotalPeriods`, `getAvailablePeriods`, `getIndexForPeriod`) sin exponer el JSON mutable. Errores tipados (`InflationError` + `code`: `INVALID_AMOUNT`, `INVALID_PERIOD_FORMAT`, `PERIOD_NOT_AVAILABLE`, `INVALID_PERIOD_ORDER`, `DATASET_INTEGRITY_ERROR`).

**Verificado con comprobaciones temporales (no versionadas):** caso oficial 2002-01→2025-01 (67,888...%, coincide con el spike), caso de mismo periodo (factor 1, 0%), deflación real del dataset (2002-06→2002-07, -0,695...%, incremento nominal negativo sin forzar a cero), y 7 casos de error (formato, fecha completa, fuera de cobertura, cantidad negativa/NaN, orden cronológico inválido) — todos con el comportamiento esperado.

**Validaciones ejecutadas:** `tsc` ✅, `lint` ✅ (0 errores, 76 warnings preexistentes, ninguno en `src/lib/inflation/`), `build` ✅. `npm run test`: mismo único fallo preexistente y no relacionado (`calculate-whatif.test.ts`) — 505/506 tests pasan.

**Sin cambios en el dataset, el script de actualización, componentes React, páginas, traducciones, metadata, schema ni analytics.**

**STOP aplicado — no se implementan tests unitarios permanentes, UI, selector de modo, ni se inicia la siguiente tarea.**

**Siguiente tarea recomendada:** tests unitarios permanentes (Vitest) para `src/lib/inflation/` (formato, límites, deflación, integridad del dataset, comparación con casos oficiales del INE), antes de la UI.

---

## SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-DATASET-01 — Dataset histórico oficial del IPC y ADR aceptado

**Fecha:** 2026-07-16
**Estado:** ✅ Completado — **UI, fórmula histórica y analytics siguen sin implementar (fuera de alcance)**
**Sprint:** SEO / Datos (implementación de infraestructura, sin UI)
**Tipo:** Dataset versionado + script de actualización reproducible. **Sin cambios en la calculadora, sin UI, sin lógica de cálculo de producción.**
**Documentos:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_DATASET_01.md`, `docs/adr/ADR-CALCULADORA-INFLACION-DATOS-HISTORICOS-01.md` (**estado: ACEPTADO**)

**Rango aprobado por el usuario:** enero de 2002 – presente, serie `IPC290751`, API JSON Tempus3 del INE, sin llamadas al INE en runtime, 1961–2001 como ampliación futura no resuelta. **ADR aceptado** con este alcance exacto.

Crea `src/lib/inflation/data/ipc-nacional-es.json` (294 registros, 2002-01 a 2026-06, un registro por mes, sin huecos ni duplicados) y `scripts/update-ipc-dataset.ts` (descarga desde `https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290751`, con timeout explícito, validación estructural completa —serie correcta, cobertura, orden, ausencia de huecos/duplicados/periodos futuros, valores finitos positivos—, detección de cambio de base vía comparación de código de serie, y escritura idempotente). Verificado: doble ejecución consecutiva sin cambios en el INE no reescribe el archivo (idempotencia confirmada). Verificado: el dataset reproduce exactamente el resultado oficial ya validado en el spike (Ene 2002→Ene 2025 = 67,9%).

**Validaciones ejecutadas:** `tsc` ✅, `lint` ✅ (0 errores, 76 warnings preexistentes), `build` ✅. `npm run test`: 1 fallo preexistente y no relacionado (`calculate-whatif.test.ts`, discrepancia de texto en consejos de ahorro, sin relación con IPC/INE) — documentado, no corregido, conforme a alcance.

**Sin cambios en UI, páginas, componentes de la calculadora, traducciones, metadata, schema, canonical, slug ni analytics.**

**STOP aplicado — no se implementa la fórmula histórica de producción ni se inicia la siguiente tarea.**

**Siguiente tarea recomendada:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-LOGIC-01`.

---

## SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-SPIKE-01 — Validación de la serie histórica larga del IPC (investigación)

**Fecha:** 2026-07-16
**Estado:** ✅ Investigación completada — **implementación NO iniciada, ADR sigue en estado Propuesto**
**Sprint:** SEO / Arquitectura (spike técnico)
**Tipo:** Investigación pura. **Cero cambios en `src/`, cero dataset definitivo guardado, ADR no aceptado.**
**Documentos:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_SPIKE_01.md`, actualiza `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_ARCHITECTURE_01.md` y `docs/adr/ADR-CALCULADORA-INFLACION-DATOS-HISTORICOS-01.md`

Resuelve la incógnita técnica pendiente de la tarea anterior: **16 peticiones reales** contra la API JSON del INE (Tempus3), el navegador JAXI y la herramienta oficial `varipc` confirman que **el rango 2002–presente es el único accesible de forma estructurada (JSON, sin autenticación)** vía la serie `IPC290751` — verificado con coincidencia exacta (67,9%) frente al resultado oficial del INE para Ene 2002→Ene 2025. La serie larga 1961–presente **existe y el INE la usa en su propia calculadora oficial** (verificado: `varipc` calcula correctamente 1995→2025 y el rango máximo 1961→2026), pero **ningún canal JSON/CSV/PXWeb estructurado la expone** para el tramo 1961–2001, pese a que el metadato de la tabla `24077` declara `Anyo_Periodo_ini:"1961"`.

**Recomendación del spike:** fijar el rango de la primera versión en **enero de 2002 – presente**; el rango 1961–2002 queda como ampliación futura no resuelta. **El ADR permanece en estado Propuesto** — no se recomienda aceptarlo todavía, pendiente de aprobación explícita del usuario sobre el rango y el resto de decisiones ya listadas.

**Sin cambios en `src/`, sin dataset definitivo, sin scripts permanentes, sin implementación de cálculo histórico.**

**STOP aplicado — ninguna tarea de implementación debe iniciarse sin aprobación explícita del usuario.**

**Siguiente tarea recomendada:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-DATASET-01` (solo si se aprueba el rango 2002–presente y se acepta el ADR).

---

## SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-ARCHITECTURE-01 — Arquitectura del cálculo histórico (investigación y diseño)

**Fecha:** 2026-07-16
**Estado:** ✅ Documentación completada — **implementación NO iniciada, pendiente de aprobación**
**Sprint:** SEO / Arquitectura (investigación pura)
**Tipo:** Investigación, arquitectura y documentación. **Cero cambios en `src/`, cero dependencias añadidas, cero implementación.**
**Documentos:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_ARCHITECTURE_01.md`, `docs/adr/ADR-CALCULADORA-INFLACION-DATOS-HISTORICOS-01.md` (estado: Propuesto, no aceptado)

Investiga y documenta la arquitectura para añadir un segundo modo ("inflación histórica entre dos fechas con datos oficiales") a `/herramientas/calculadora-inflacion`, manteniendo el modo actual y la URL. **Fuente oficial verificada en directo**: API JSON del INE (Tempus3, `https://servicios.ine.es/wstempus/js/ES/...`), pública, sin autenticación, licencia CC BY-SA 4.0. Serie `IPC290751` (índice general nacional) verificada con datos reales desde enero de 2002 hasta el último mes publicado (junio de 2026 en el momento de la consulta). Existe además una tabla oficial larga (1961–presente, "Base 2025") en el navegador clásico del INE, cuyo acceso equivalente vía la API JSON moderna **no se ha confirmado** — queda como única incógnita técnica pendiente de un spike futuro.

**Arquitectura recomendada:** dataset JSON estático versionado en el repositorio + script de actualización manual/CI (nunca cron automático), sin ninguna llamada a la API del INE en tiempo real durante el render — evaluadas y descartadas explícitamente las alternativas de consulta en tiempo real desde servidor y de dataset sin versionar.

**Fórmulas, ejemplos verificados con datos reales, estructura de software, plan de tests, riesgos y matriz de decisiones pendientes:** documentados en el entregable principal.

**Sin cambios en `src/`, sin implementación de cálculo histórico, sin nuevas URLs, sin dependencias añadidas.** El ADR permanece en estado **Propuesto**, no aceptado.

**STOP aplicado conforme a instrucción explícita — ninguna tarea de implementación debe iniciarse sin aprobación explícita del usuario.**

**Siguiente tarea recomendada:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-SPIKE-01` (solo si se aprueba continuar).

---

## SEO-ONPAGE-CALCULADORA-INFLACION-INTERNAL-LINKING-01 — Reforzar enlazado interno entrante

**Fecha:** 2026-07-16
**Estado:** ✅ Completado
**Sprint:** SEO / Enlazado interno
**Tipo:** Enlazado interno editorial selectivo, sin nuevas URLs ni cambios en la calculadora. Continúa sobre `SEO-ONPAGE-CALCULADORA-INFLACION-CONCATENATED-TEXT-01` (commit base `af9310c83dee0fc3249eb284fc136a1b71bc8307`).
**Documento:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_INTERNAL_LINKING_01.md`

Audita el enlazado interno hacia `/herramientas/calculadora-inflacion` (antes: 3 globales/navegación, 2 de tarjeta/hub, 4 editoriales reales repartidos en 3 páginas) y añade **3 enlaces editoriales nuevos**, uno por página, en `plantilla-kakebo-excel.es.mdx` (anchor "calcula cómo afecta la inflación a tus ahorros"), `como-hacer-un-presupuesto-personal.es.mdx` (anchor "pérdida de poder adquisitivo") y `regla-50-30-20-ejemplo.es.mdx` (anchor "calculadora de inflación"). Cada enlace es una única frase de transición integrada en un párrafo ya existente, sin reescribir contenido, sin alterar la intención principal de ninguna de las 3 páginas y sin riesgo de canibalización (ninguna compite por la intención "calculadora de inflación").

**Descartadas sin forzar enlace:** `como-ahorrar-dinero-cada-mes`, `ahorro-pareja`, `kakebo-sueldo-minimo` y el pilar semántico `metodo-kakebo-guia-definitiva` (sin sección natural sobre inflación/pérdida de valor donde insertar el enlace).

**Sin cambios en la calculadora** (`page.tsx`, `CalculatorInflation.tsx`, `messages/es.json`, `messages/en.json`) ni en Navbar/Footer/menús globales.

**Siguiente tarea recomendada:** `SEO-ONPAGE-CALCULADORA-INFLACION-BACKLINKS-01`.

---

## SEO-ONPAGE-CALCULADORA-INFLACION-CONCATENATED-TEXT-01 — Corregir textos concatenados

**Fecha:** 2026-07-16
**Estado:** ✅ Completado
**Sprint:** SEO / Corrección On-Page (semántica y accesibilidad)
**Tipo:** Corrección estructural mínima, sin cambios de copy, diseño, funcionalidad, metadata ni schema. Continúa sobre `SEO-ONPAGE-CALCULADORA-INFLACION-CONTENT-01` (commit base `56b86325ec8185f0fe8a300e7081e57147025e07`).
**Documento:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_CONCATENATED_TEXT_01.md`

Corrige los 3 fragmentos de texto concatenado confirmados en la auditoría original ("Pérdida de Valor Real-2559€Tu dinero vale...", "Poder de Compra Futuro7441€Equivalente...", "Crear cuenta gratisVer regla 50/30/20"), reproducidos y verificados en `document.body.textContent` con un navegador real. Causa raíz: `<span>`/`<Link>` hermanos sin separador textual entre ellos, con espaciado solo visual (CSS). **Solución:** 5 `<span className="sr-only">` (utilidad estándar de Tailwind, visualmente oculta y fuera del flujo de layout) insertados entre los elementos afectados en `CalculatorInflation.tsx`, sin tocar ninguna traducción.

**"Aceptar0k" (hallazgo parcial):** confirmado **NO REPRODUCIBLE** — verificado con navegador real que "Aceptar" (CookieBanner) y "0k" (tick del gráfico Recharts) están a más de 5.000 caracteres de distancia en el DOM/`textContent`, sin ninguna adyacencia real. No se ha aplicado ningún cambio especulativo sobre `CookieBanner` ni el gráfico.

**Verificado sin cambios:** fórmula, inputs/outputs, gráfico, CTA y sus destinos, tracking, metadata, schema, canonical, headings y Footer único.

**Siguiente tarea recomendada:** `SEO-ONPAGE-CALCULADORA-INFLACION-BACKLINKS-01`.

---

## SEO-ONPAGE-CALCULADORA-INFLACION-CONTENT-01 — Reforzar precisión, frescura y fuentes oficiales

**Fecha:** 2026-07-16
**Estado:** ✅ Completado
**Sprint:** SEO / Corrección On-Page (contenido)
**Tipo:** Corrección de contenido factual, sin cambios de funcionalidad, metadata ni schema. Continúa sobre `SEO-ONPAGE-CALCULADORA-INFLACION-HEADINGS-01` (commit base `72636cd9b0db145dd9aab24d9bed6854dbc02b1b`).
**Documento:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_CONTENT_01.md`

Audita y corrige el contenido factual de `https://www.metodokakebo.com/herramientas/calculadora-inflacion` (y su versión `/en/`) contra fuentes oficiales (INE, BOE), verificadas mediante consulta directa antes de redactar:

**Eliminado por desactualizado/sin fuente:** "el límite del 3% en España durante 2024-2025" en el bloque de actualización de alquiler (no existe un porcentaje único vigente: desde 2025 el artículo 18 LAU remite, para los contratos a los que aplica, al Índice de Referencia de Arrendamientos de Vivienda que calcula el INE mensualmente, per BOE-A-2024-26685 — confirmado por consulta directa a la fuente); y la cifra "60-70% acumulado / ~1.700€" de la FAQ sobre el valor del dinero desde el año 2000 (sin fuente ni fecha verificable).

**Añadido:** 4 enlaces externos a herramientas oficiales del INE (portal IPC, IRAV, actualización de rentas, simulador de variación) con anchor descriptivo y `target="_blank" rel="noopener noreferrer"`; una nueva sección visible de metodología (H2) y limitaciones (H3, anidada) explicando que la tasa la introduce el usuario, que el cálculo es una proyección matemática y no una predicción garantizada, y que no usa datos históricos del INE; una nota de descargo bajo la tabla comparativa; y una indicación discreta de fecha de revisión y fuentes al final del contenido. Keyword "calculadora de inflación España" incorporada de forma natural en el subtítulo visible, sin forzarla en el resto del contenido.

**Sin cambios de funcionalidad** (inputs, fórmula, outputs, gráfico, CTA, tracking), **metadata**, **schema**, **slug** ni **diseño visual/responsive**.

**Siguiente tarea recomendada:** `SEO-ONPAGE-CALCULADORA-INFLACION-CONCATENATED-TEXT-01` (textos concatenados, hallazgo 5 de la auditoría original).

---

## SEO-ONPAGE-CALCULADORA-INFLACION-HEADINGS-01 — Corrección de estructura semántica y Footer duplicado

**Fecha:** 2026-07-16
**Estado:** ✅ Completado
**Sprint:** SEO / Corrección On-Page
**Tipo:** Corrección mínima de estructura semántica, sobre hallazgos confirmados en `SEO-ONPAGE-CALCULADORA-INFLACION-VALIDATION-01` (commit base `3617fc62f400eb6f4ebd477efcde1f230f037341`).
**Documento de referencia:** `docs/seo/VALIDACION_SEO_ONPAGE_CALCULADORA_INFLACION_01.md`

Corrige exclusivamente los dos hallazgos de estructura confirmados en la auditoría anterior sobre `https://www.metodokakebo.com/herramientas/calculadora-inflacion`:

**1. Salto de heading H1→H3.** Causa raíz: el CTA interno de la calculadora ("Protege tus ahorros del IPC") usaba `<h3>` en `CalculatorInflation.tsx`, apareciendo en el DOM antes del primer `<h2>` de la sección de contenido SEO/GEO. Es un título de bloque de llamada a la acción, no un subtema del contenido informativo, por lo que no debía formar parte del outline de encabezados. **Solución:** cambio de `<h3>` a `<p>` manteniendo exactamente las mismas clases visuales (`text-3xl font-serif`) — sin cambio de texto, estilo ni comportamiento.

**2. Footer duplicado.** Causa raíz: `<Footer />` se renderizaba dos veces — una vez explícitamente en `page.tsx` de la calculadora, y otra vez en `src/app/[locale]/layout.tsx`, que ya renderiza el Footer global para todas las páginas. **Solución:** eliminado el import y la instancia redundante de `<Footer />` en `page.tsx` de la calculadora, manteniendo como único Footer válido el gestionado por el layout raíz. No se modificó `Footer.tsx` ni ninguna otra página (`regla-50-30-20` queda fuera de alcance, según restricción explícita, y conserva su propio `<Footer />` sin tocar).

**Jerarquía de headings — antes:**
H1 → **H3** ("Protege tus ahorros del IPC") → H2 → H2 → H2 → H2 → H3 → H2 → H3×3 → H3 → H3×3 ("Producto"/"Cuenta"/"Legal", **duplicados** por doble Footer).

**Jerarquía de headings — después:**
H1 → H2 → H2 → H2 → H2 → H3 (bajo el H2 anterior, correcto) → H2 → H3×3 (FAQ) → H3 (interlinking) → H3×3 ("Producto"/"Cuenta"/"Legal", **una sola vez**).
Total: 1×H1, 5×H2, 8×H3. Sin saltos de nivel.

**Footers:** 2 → 1 (verificado: `grep -c "<footer" ` sobre el HTML renderizado local devuelve 1).

**Archivos modificados (2, cambio mínimo):**
- `src/app/[locale]/(landing)/herramientas/calculadora-inflacion/page.tsx` — elimina el import de `Footer` y la instancia `<Footer />` (2 líneas).
- `src/components/landing/tools/CalculatorInflation.tsx` — cambia el tag del CTA de `<h3>` a `<p>` (2 líneas), mismas clases.

**Validación ejecutada:**
- `npx tsc --noEmit` ✅ 0 errores.
- `npm run lint` ✅ 0 errores (76 warnings preexistentes, no relacionados).
- `npm run build` ✅ Compiled successfully, `/herramientas/calculadora-inflacion` presente en el build.
- Servidor local (`npm run start`) + inspección del HTML renderizado real (`curl` a `localhost:3000/herramientas/calculadora-inflacion`):
  - Un único H1, sin salto H1→H3, jerarquía H1→H2→...→H3 correcta.
  - Un único `<footer>`, "Producto"/"Cuenta"/"Legal" aparecen una sola vez cada uno.
  - `meta description`, `title`, `canonical` sin cambios (idénticos a los verificados en `SEO-ONPAGE-CALCULADORA-INFLACION-VALIDATION-01`).
  - Schema (`SoftwareApplication`, `FAQPage`, `DefinedTerm`, `BreadcrumbList`) intacto.
  - Los 3 inputs de la calculadora (`savings-input`, `inflation-input`, `years-input`) presentes.
  - CTA "Protege tus ahorros del IPC" sigue visible con el mismo texto y estilo (ahora como `<p>` en vez de `<h3>`); enlaces `/login?source=calculator_inflation` y `/herramientas/regla-50-30-20` intactos.

**Confirmado sin alterar:** funcionalidad de la calculadora (inputs, fórmula, resultados, gráfico), metadata (title/description/canonical/OG/Twitter/hreflang), schema, copy visible, diseño visual/responsive, tracking, otras herramientas (`regla-50-30-20`, `calculadora-ahorro`), slug, redirects.

**Cambios preexistentes ajenos a esta tarea** (`.claude/settings.local.json`, subdirectorio anidado `kakebo`, archivos untracked `CLAUDE.md`, `SEO_MAP_V1.md`, `docs/seo/fondo_emergencia/`, `docs/seo/regla502030/`, `imagenes/blog/`, `imagenes/kakebo online gratis.png`) quedaron intactos, sin stage ni commit.

**Siguiente tarea recomendada:** `SEO-ONPAGE-CALCULADORA-INFLACION-CONTENT-01` — enlazar fuentes oficiales (INE) y verificar vigencia de referencias temporales/legales.

---

## SEO-ONPAGE-CALCULADORA-INFLACION-VALIDATION-01 — Validación técnica y semántica de la calculadora de inflación

**Fecha:** 2026-07-16
**Estado:** ✅ Completado (solo auditoría — sin implementación)
**Sprint:** SEO / Auditoría On-Page
**Tipo:** Validación de código, HTML renderizado y producción. Sin cambios de código, contenido, metadata ni funcionalidad.
**Documento:** `docs/seo/VALIDACION_SEO_ONPAGE_CALCULADORA_INFLACION_01.md`

Auditoría del informe SE Ranking (70/100) sobre `https://www.metodokakebo.com/herramientas/calculadora-inflacion`, cara a la keyword "calculadora de inflación España". De los 10 hallazgos reportados: **6 CONFIRMADOS** (frase exacta ausente; salto de heading H1→H3 causado por el H3 del CTA interno; encabezados "Producto"/"Cuenta"/"Legal" duplicados por doble renderizado de `<Footer />` — en `page.tsx` y en `[locale]/layout.tsx`; 3 de 4 textos concatenados por spans/Links hermanos sin separador textual; cero enlaces externos a fuentes oficiales pese a citar al INE; la herramienta es de proyección futura con tasa manual, sin cálculo histórico entre fechas), **1 DESCARTADO** (meta description sí existe y se renderiza correctamente en producción, verificado con `curl` contra la URL real), **1 PARCIAL** (referencias temporales 2024-2025 presentes mas su vigencia no verificada) y **2 REQUIEREN DATOS ADICIONALES** (comparación con SERP y backlinks, fuera de alcance de esta tarea por restricción explícita).

**Sin cambios de código, contenido, metadata, diseño ni funcionalidad. No se ha creado ninguna URL nueva ni cambiado el slug.**

**Siguiente tarea recomendada:** `SEO-ONPAGE-CALCULADORA-INFLACION-HEADINGS-01` (corregir salto H1→H3 y duplicación de `<Footer />`).

---

## CRO-ACTIVATION-EXCEL-CTA-FIX-01 — Corrección de destino del CTA principal a `/app`

**Fecha:** 2026-07-13
**Estado:** ✅ Completado
**Sprint:** CRO / Activación
**Tipo:** Corrección mínima de destino sobre experimento existente (`CRO-ACTIVATION-EXCEL-CTA-01`)
**Documento:** `docs/analytics/CRO_ACTIVATION_EXCEL_CTA_01.md` (sección 3bis)

El CTA principal del bloque `ChoiceCTA` en `/blog/plantilla-kakebo-excel` apuntaba a `/` (home), añadiendo una pantalla intermedia en el embudo de activación. Se corrigió a `/app`, verificado como ruta canónica: sin sesión redirige a `/login`, con sesión accede directamente a la app.

**Archivo modificado:** `src/content/blog/plantilla-kakebo-excel.es.mdx` (1 línea: `primaryHref="/"` → `primaryHref="/app"`).

**Sin cambios:** texto del CTA, diseño, componente `ChoiceCTA`, CTA secundario, evento `click_cta_login` ni sus parámetros (`cta_location: plantilla_excel_intro`, `source_page`), tracking de `download_template`, resto del artículo, title, meta, H1, canonical, schema.

**Hallazgo independiente no corregido:** en `/login` el texto "Control de gastos" muestra literalmente `<br />` sin interpretar. Documentado, fuera de alcance de esta tarea.

**Validación:** `npm run build` ✅, `npm run lint` ✅ (0 errores, 76 warnings preexistentes), `npx tsc --noEmit` ✅ (0 errores); verificado en navegador que el clic sin sesión lleva a `/app` → `/login`; CTA secundario sigue apuntando a `#descarga-plantilla-excel`.

---

## CRO-ACTIVATION-EXCEL-CTA-01 — Bloque de activación hacia Kakebo Online en `/blog/plantilla-kakebo-excel`

**Fecha:** 2026-07-13
**Estado:** ✅ Completado
**Sprint:** CRO / Activación
**Tipo:** Experimento CRO mínimo y reversible sobre URL protegida — sin cambio de metadata ni de intención SEO
**Documento:** `docs/analytics/CRO_ACTIVATION_EXCEL_CTA_01.md`

**Hipótesis:** un CTA visible hacia Kakebo Online inmediatamente después de la introducción del artículo aumentará `click_cta_login` sin perjudicar la intención de búsqueda ni la descarga de la plantilla Excel.

**Baseline GA4 (2026-06-15 a 2026-07-12):** 82 usuarios activos en la página · 2 usuarios con `click_cta_login` · conversión ≈ 2,44 % · 91 sesiones como landing page.

**Cambio implementado:** nuevo bloque `ChoiceCTA` insertado justo después de la introducción y antes del bloque de descarga existente, con CTA principal ("Usar Kakebo online gratis" → `/`, dispara `click_cta_login` con `cta_location: plantilla_excel_intro`) y CTA secundario ("Prefiero la plantilla Excel" → ancla `#descarga-plantilla-excel` que apunta al `DownloadCTA` ya existente, sin duplicar la descarga).

**Archivos modificados:**
- `src/components/mdx/MDXClientCTAs.tsx` (nuevo componente `ChoiceCTA`)
- `src/components/mdx/MDXComponents.tsx` (registro del componente)
- `src/content/blog/plantilla-kakebo-excel.es.mdx` (bloque + ancla local, solo versión ES)

**Restricciones respetadas:** sin cambios en slug, title, meta description, canonical, hreflang, H1, hero, imagen destacada, schema, FAQ, tabla comparativa, CTA de descarga existente ni CTA final del artículo · sin reordenar el artículo · sin tocar otras URLs.

**Validación:** `npm run build` ✅ (0 errores), `npm run lint` ✅ (0 errores, 76 warnings preexistentes no relacionados), `npx tsc --noEmit` ✅ (0 errores); render local HTTP 200 con un único H1, `canonical` y `title` sin cambios, bloque visible en desktop y verificado responsive (mismas clases Tailwind que `ToolCTA`, ya en producción); CTA secundario verificado en navegador (hace scroll a `#descarga-plantilla-excel`); CTA principal usa el mismo helper `analytics.track("click_cta_login", …)` que `SimpleCTA`/`ToolCTA`.

**Ventana de medición:** 28 días desde el despliegue (ver commit de despliegue).

**Sin cambios en SEO, sitemap, robots, canonical, hreflang, schema global ni en otros artículos.**

---

## CONTENT-03-IMAGE-IMPL-01 — Imagen destacada del artículo regla 50/30/20 ejemplo

**Fecha:** 2026-07-09
**Estado:** ✅ Completado
**Sprint:** Sprint Contenido V1
**Tipo:** Integración de asset — cambio atómico

**Imagen origen:** `docs/seo/regla502030/regla503020.png` (PNG real, 1536×1024, verificado con `file`)
**Imagen pública creada:** `public/images/blog/regla-50-30-20-ejemplo.png`
**Archivo MDX actualizado:** `src/content/blog/regla-50-30-20-ejemplo.es.mdx` — añadido `image: '/images/blog/regla-50-30-20-ejemplo.png'` (1 línea, mismo patrón que `fondo-de-emergencia.es.mdx` y `cuentas-remuneradas.es.mdx`)

**Restricciones respetadas:** Sin cambios en title, H1, meta description, slug, FAQ ni enlaces internos · Sin tocar otros artículos · Sin tocar `/blog/plantilla-kakebo-excel` · Sin tocar `/blog/fondo-de-emergencia` ni `/blog/cuentas-remuneradas` · Sin tocar la herramienta `/herramientas/regla-50-30-20` · Sin tocar sitemap/robots/canonical/hreflang/schema global.

**Validación:** `npm run build`/`lint`/`tsc --noEmit` ✅ sin errores; `/blog/regla-50-30-20-ejemplo` HTTP 200; imagen HTTP 200 (sin 404); `BlogPosting.image` y `og:image` ya usan la imagen específica en lugar del fallback; `FAQPage`/`BreadcrumbList` intactos; `title`/H1/canonical sin cambios; miniatura del listado `/blog` actualizada automáticamente; herramienta y URLs protegidas verificadas sin diff.

**Build:** ✅ Compiled successfully — 0 errores TypeScript, 0 errores de lint (76 warnings preexistentes no relacionados)

---

## CONTENT-03 — Artículo "Regla 50/30/20: ejemplo real con tu sueldo"

**Fecha:** 2026-07-09
**Estado:** ✅ Completado
**Sprint:** Sprint Contenido V1
**Tipo:** Guía evergreen práctica de apoyo a herramienta existente — sin afiliación, sin comparativa bancaria

**URL creada:** `/blog/regla-50-30-20-ejemplo`
**Archivo MDX:** `src/content/blog/regla-50-30-20-ejemplo.es.mdx`
**Documento de research base:** `docs/seo/KEYWORD_RESEARCH_REGLA_503020_01.md`
**Documento de la tarea:** `docs/seo/CONTENT_03_REGLA_503020_EJEMPLO.md`

**Keyword padre:** `regla 50/30/20`
**Keyword protegida de la herramienta (no atacada):** `regla 50 30 20 calculadora`
**Keyword objetivo del artículo:** `regla 50 30 20 ejemplo`

**Enlazado interno activo (6, todos obligatorios y verificados):**
- `/herramientas/regla-50-30-20`
- `/herramientas/calculadora-ahorro`
- `/blog/fondo-de-emergencia`
- `/blog/como-hacer-un-presupuesto-personal`
- `/blog/como-ahorrar-dinero-cada-mes`
- `/blog/metodo-kakebo-guia-definitiva`

**FAQ (6, frontmatter + visible):** cómo funciona la regla, ejemplo, qué pasa si se supera el 50% en necesidades, comparación con la 70/20/10, sueldo bajo, dónde calcularla.

**Nota de no canibalización:** el artículo no usa "calculadora" en title/H1, no repite el copy transaccional de la herramienta y remite a ella únicamente como paso siguiente ("usa la calculadora 50/30/20 con tus propios números"). `/herramientas/regla-50-30-20` no se ha modificado en ningún campo.

**Restricciones respetadas:** Sin comparativa bancaria · Sin afiliación · Sin promesa de que la regla sirve para todo el mundo (sección dedicada "Cuándo no funciona") · No se ha tocado `/blog/plantilla-kakebo-excel` · No se ha tocado `/blog/fondo-de-emergencia` ni `/blog/cuentas-remuneradas` · No se ha modificado la herramienta ni ningún componente global.

**Incidencia técnica:** mismo patrón ya documentado en `CONTENT-02` — el template de blog unifica `title` y `H1` en un único campo de frontmatter; se usó el "Title SEO recomendado" para ambos, documentado en detalle en `CONTENT_03_REGLA_503020_EJEMPLO.md` §3.

**Schema generado automáticamente por el sistema:** `BlogPosting` + `BreadcrumbList` + `FAQPage` (6 preguntas).

**Sin imagen destacada específica** — fallback automático a `/og-image.jpg` (verificado en render local); generación de imagen dedicada queda como tarea futura.

**Ventana de medición SEO:** 8-12 semanas desde publicación (2026-07-09).

**Validación:** `npm run build` ✅, `npm run lint` ✅ (0 errores, 76 warnings preexistentes), `npx tsc --noEmit` ✅ (0 errores), render local (servidor de desarrollo) confirma HTTP 200 en `/blog/regla-50-30-20-ejemplo`, title/H1/canonical correctos, `BlogPosting`/`BreadcrumbList`/`FAQPage` presentes, artículo visible en `/blog`, 6 enlaces internos verificados por conteo en HTML, y las 4 URLs protegidas (`plantilla-kakebo-excel`, `fondo-de-emergencia`, `cuentas-remuneradas`, `/herramientas/regla-50-30-20`) devuelven HTTP 200 sin diff.

---

## KEYWORD-RESEARCH-REGLA-503020-01 — Ficha keyword: artículo de respaldo regla 50/30/20

**Fecha:** 2026-07-09
**Estado:** ✅ Completado — solo investigación y documentación
**Tipo:** Sin código, sin MDX, sin contenido publicado, sin cambios en la herramienta

**Documento creado:** `docs/seo/KEYWORD_RESEARCH_REGLA_503020_01.md`
**Origen:** idea #1 (prioridad alta) de `docs/seo/SEO_CONTENT_BACKLOG_CLUSTERS_01.md`

Define cómo debe plantearse el futuro artículo de blog de apoyo a `/herramientas/regla-50-30-20` sin canibalizarla. Verifica que "qué es la regla 50/30/20" ya se menciona brevemente en `como-hacer-un-presupuesto-personal` y que la herramienta ya cubre `regla 50 30 20 calculadora` (title, meta, `HowTo` schema). El hueco real detectado: ejemplos numéricos por tramo de sueldo, límites prácticos de la regla y comparación con la regla 70/20/10 — nada de esto existe hoy en el sitio.

**Keyword padre:** `regla 50/30/20`.
**Keyword principal de la herramienta (no tocar):** `regla 50 30 20 calculadora`.
**Keyword objetivo inicial del artículo:** `regla 50 30 20 ejemplo`.

**Riesgo de canibalización:** bajo, si el artículo respeta la delimitación de la ficha — no usa copy transaccional de "calculadora" como eje, no repite la explicación básica ya cubierta en el pilar de presupuesto personal.

**Decisión final:** Producir. Mismo patrón que ya funcionó en `CONTENT-01` (`cuentas-remuneradas`) y `CONTENT-02` (`fondo-de-emergencia`).

**Siguiente tarea recomendada:** redacción del artículo (`CONTENT-03` o equivalente), sujeta a decisión de timing frente al snapshot GSC 2026-07-17/31.

**Sin cambios de código, contenido, herramientas ni configuración SEO técnica.**

---

## SEO-CONTENT-BACKLOG-CLUSTERS-01 — Backlog editorial SEO por clusters

**Fecha:** 2026-07-09
**Estado:** ✅ Completado — solo análisis estratégico y documentación
**Tipo:** Sin código, sin MDX, sin contenido nuevo, sin cambios en herramientas ni en artículos existentes

**Documento creado:** `docs/seo/SEO_CONTENT_BACKLOG_CLUSTERS_01.md`

Revisa 10 clusters editoriales (Método Kakebo, Ahorro mensual, Fondo de emergencia, Cuentas remuneradas, Inflación, Presupuesto personal, Regla 50/30/20, Alternativas/Fintonic, Plantillas y Excel, Casos prácticos por perfil) contrastando `PLAN_SEO_GEO_METODOKAKEBO.md`, `SEO_MAP_V1.md`, `SEO_ROADMAP_RESUME_2026_07_09.md`, `KEYWORD_RESEARCH_FONDO_EMERGENCIA_01.md` y el contenido real en `src/content/blog/`.

**Huecos críticos confirmados (heredados de `SEO_MAP_V1.md`, sin cerrar):** sin artículo de respaldo para `/herramientas/regla-50-30-20` ni para `/herramientas/calculadora-inflacion`.

**Fondo de emergencia y Cuentas remuneradas:** clusters en ventana de medición activa — sin hueco editorial priorizable a corto plazo.

**Backlog:** 10 ideas de artículo priorizadas (3 alta, 5 media, 2 baja). Top 3 para keyword research: artículo de respaldo regla 50/30/20, artículo de respaldo calculadora de inflación, Kakebo para primer sueldo/recién graduados.

**Excluidos explícitamente:** comparativas bancarias vivas, "mejores cuentas remuneradas 2026", artículos de afiliación, cualquier pieza del cluster Excel sin autorización explícita, contenido nuevo general hasta el snapshot GSC 2026-07-17/31 (salvo keyword research aislado previo, mismo patrón que `fondo-de-emergencia`).

**Siguiente tarea recomendada:** esperar snapshot GSC 2026-07-17/31; en paralelo, keyword research aislado para el artículo de respaldo de la regla 50/30/20.

**Sin cambios de código, contenido, herramientas ni configuración SEO técnica.**

---

## CONTENT-02-IMAGE-IMPL-01 — Imagen destacada del artículo fondo de emergencia

**Fecha:** 2026-07-09
**Estado:** ✅ Completado
**Sprint:** Sprint Contenido V1
**Tipo:** Integración de asset — cambio atómico

**Imagen origen:** `docs/seo/fondo_emergencia/fondo_emergencia.png` (PNG real, 1536×1024, verificado con `file`)
**Imagen pública creada:** `public/images/blog/fondo-de-emergencia.png`
**Archivo MDX actualizado:** `src/content/blog/fondo-de-emergencia.es.mdx` — añadido `image: '/images/blog/fondo-de-emergencia.png'` (1 línea, mismo patrón que `cuentas-remuneradas.es.mdx`)

**Restricciones respetadas:** Sin cambios en title, H1, meta description, slug, FAQ ni enlaces internos · Sin tocar otros artículos · Sin tocar `/blog/plantilla-kakebo-excel` · Sin tocar herramientas · Sin tocar sitemap/robots/canonical/hreflang/schema global.

**Validación:** `npm run build`/`lint`/`tsc --noEmit` ✅ sin errores; `/blog/fondo-de-emergencia` HTTP 200; imagen HTTP 200 (sin 404); `BlogPosting.image` y `og:image` ya usan la imagen específica en lugar del fallback; `FAQPage`/`BreadcrumbList` intactos; miniatura del listado `/blog` actualizada automáticamente.

**Build:** ✅ Compiled successfully — 0 errores TypeScript, 0 errores de lint (76 warnings preexistentes no relacionados)

---

## CONTENT-02 — Artículo "Fondo de emergencia"

**Fecha:** 2026-07-09
**Estado:** ✅ Completado
**Sprint:** Sprint Contenido V1
**Tipo:** Guía evergreen informativa/práctica — España-first, sin afiliación

**URL creada:** `/blog/fondo-de-emergencia`
**Archivo MDX:** `src/content/blog/fondo-de-emergencia.es.mdx`
**Documento de research base:** `docs/seo/KEYWORD_RESEARCH_FONDO_EMERGENCIA_01.md`
**Documento de la tarea:** `docs/seo/CONTENT_02_FONDO_EMERGENCIA.md`

**Keyword padre:** `fondo de emergencia`
**Keyword objetivo inicial:** `cuánto dinero tener en un fondo de emergencia`

**Enlazado interno activo (6, todos obligatorios y verificados):**
- `/herramientas/calculadora-ahorro`
- `/blog/cuentas-remuneradas`
- `/blog/como-ahorrar-dinero-cada-mes`
- `/blog/como-hacer-un-presupuesto-personal`
- `/herramientas/regla-50-30-20`
- `/herramientas/calculadora-inflacion`

**FAQ (6, frontmatter + visible):** cuánto tener, dónde guardarlo, si invertirlo, cuántos meses, si cuenta remunerada, cómo empezar sin ahorro previo.

**Restricciones respetadas:** Sin comparativa de bancos · Sin recomendación de entidades · Sin afiliación · Sin rentabilidades inventadas · No se ha tocado `/blog/plantilla-kakebo-excel` · No se han modificado herramientas ni componentes globales.

**Incidencia técnica:** el template de blog unifica `title` y `H1` en un único campo de frontmatter — se usó el "Title SEO recomendado" para ambos, documentado en detalle en `CONTENT_02_FONDO_EMERGENCIA.md` §3.

**Schema generado automáticamente por el sistema:** `BlogPosting` + `BreadcrumbList` + `FAQPage` (6 preguntas).

**Sin imagen destacada específica** — fallback automático a `/og-image.jpg`; generación de imagen dedicada queda como tarea futura.

**Ventana de medición SEO:** 8-12 semanas desde publicación (2026-07-09).

**Build:** ✅ Compiled successfully — 0 errores TypeScript, 0 errores de lint (76 warnings preexistentes no relacionados)

---

## KEYWORD-RESEARCH-FONDO-EMERGENCIA-01 — Ficha keyword: fondo de emergencia

**Estado:** ✅ Completado (2026-07-09) — solo investigación y documentación

Documento creado: `docs/seo/KEYWORD_RESEARCH_FONDO_EMERGENCIA_01.md`

**Keyword padre:** `fondo de emergencia`. **Keyword objetivo inicial:** `cuánto dinero tener en un fondo de emergencia` (long tail práctica/cálculo, menor fricción competitiva frente al término genérico dominado por bancos y aseguradoras).

**Hallazgo clave:** "fondo de emergencia" ya se menciona sin desarrollar en `como-hacer-un-presupuesto-personal` (regla 3-6 meses), `cuentas-remuneradas` (dónde guardarlo) y la FAQ de `calculadora-ahorro` (cálculo vía función "Añadir objetivo"). El ángulo diferenciador del nuevo artículo es el **cálculo desde gastos reales conectado con `calculadora-ahorro`**, sin repetir "qué es" ni "dónde guardarlo" como ejes — solo enlazarlos.

**Decisión final:** Producir. Sigue el mismo patrón que funcionó en `CONTENT-01`.

**Siguiente tarea recomendada:** `CONTENT-02` — redacción del artículo `/blog/fondo-de-emergencia` según outline, keyword y restricciones definidas en la ficha.

**Nota:** no se ha creado artículo, MDX ni tocado código en esta tarea.

---

## SEO-BREADCRUMB-TOOLS-IMPL-01 — BreadcrumbList en herramientas individuales

**Estado:** ✅ Completado (2026-07-09)

Documento creado: `docs/seo/SEO_BREADCRUMB_TOOLS_IMPL_01.md`

Añade `BreadcrumbList` (`Inicio > Herramientas > Herramienta`) a `calculadora-ahorro`, `calculadora-inflacion` y `regla-50-30-20`, replicando el patrón ya validado en blog. Cambio atómico, 3 archivos.

**Sin cambios:** title, canonical, hreflang, `openGraph`, H1, contenido; `SoftwareApplication`/`FAQPage`/`HowTo`/`DefinedTerm` verificados intactos. Sin breadcrumb visible en UI.

**Validación:** `npm run build` ✅, `npm run lint` ✅ (0 errores), `npx tsc --noEmit` ✅ (0 errores), render local confirma `BreadcrumbList` correcto en ES y EN de las 3 herramientas.

**Sin cambios de contenido, diseño ni funcionalidad.**

---

## SEO-BREADCRUMB-AUDIT-01 — Auditoría del sistema de breadcrumbs

**Estado:** ✅ Completado (2026-07-09) — solo auditoría y documentación

Documento creado: `docs/seo/SEO_BREADCRUMB_AUDIT_01.md`

Audita `BreadcrumbList` en 10 páginas core. Solo `blog/[slug]/page.tsx` lo implementa (correcto, verificado ES/EN). Hallazgo real: las 3 herramientas individuales carecen de `BreadcrumbList` pese a tener jerarquía real equivalente a la de blog.

**Decisión recomendada:** implementar `BreadcrumbList` en las 3 herramientas individuales.

**Siguiente tarea recomendada:** `SEO-BREADCRUMB-HERRAMIENTAS-IMPL-01`.

**Sin cambios de código ni contenido.**

---

## SEO-TECHNICAL-TUTORIAL-PRIORITY-IMPL-01 — Ajuste de prioridad sitemap de /tutorial

**Estado:** ✅ Completado (2026-07-09)

Documento creado: `docs/seo/SEO_TECHNICAL_TUTORIAL_PRIORITY_IMPL_01.md`

Implementa la decisión de `SEO-TECHNICAL-TUTORIAL-PRIORITY-01`: baja `priority` de `/tutorial` en `src/app/sitemap.ts` de `0.8` a `0.5`. Cambio atómico, 1 archivo, 1 línea. Cierra el hallazgo T-12.

**Sin cambios:** title, H1, canonical, hreflang, robots, `openGraph`, JSON-LD, contenido de `/tutorial`; resto de prioridades del sitemap.

**Validación:** `npm run build` ✅, `npm run lint` ✅ (0 errores), `npx tsc --noEmit` ✅ (0 errores), `/sitemap.xml` confirma `priority: 0.5` para `/tutorial` y `/en/tutorial`; render local confirma que `/tutorial` sigue indexable (HTTP 200, `robots: index, follow`) sin cambios de metadata.

**Sin cambios de contenido ni funcionalidad.**

---

## SEO-TECHNICAL-TUTORIAL-PRIORITY-01 — Auditoría de /tutorial

**Estado:** ✅ Completado (2026-07-09) — solo auditoría y documentación

Documento creado: `docs/seo/SEO_TECHNICAL_TUTORIAL_PRIORITY_01.md`

Audita `/tutorial` (SEO, GEO, arquitectura, producto) y cierra el hallazgo T-12 pendiente desde `SEO-TECHNICAL-TUTORIAL-01`. Confirma función de onboarding real (presente en `TopNav.tsx`, navegación de la app autenticada), contenido no-thin, sin canibalización confirmada por datos.

**Decisión recomendada:** Opción B — mantener indexada, sin priorizar. Bajar `priority` de sitemap de `0.8` a `0.5` en tarea futura (`SEO-TECHNICAL-TUTORIAL-PRIORITY-IMPL-01`).

**Hallazgo nuevo, no confirmado:** posible solapamiento de intención entre `/tutorial` (title: "Cómo usar el Método Kakebo") y el pilar `/blog/metodo-kakebo-guia-definitiva` — pendiente de validar con snapshot GSC 2026-07-17/31, sin acción inmediata.

**Sin cambios de código ni contenido.**

---

## SEO-OG-SITENAME-INHERITANCE-IMPL-01 — og:site_name explícito en páginas afectadas

**Estado:** ✅ Completado (2026-07-09)

Documento creado: `docs/seo/SEO_OG_SITENAME_INHERITANCE_IMPL_01.md`

Añade `siteName: "MetodoKakebo.com"` (literal, sin constante compartida — decisión justificada en el documento) al `openGraph` de las 6 páginas identificadas por la auditoría previa: `/`, `/sobre-nosotros`, `/blog/[slug]`, `/herramientas/calculadora-ahorro`, `/herramientas/regla-50-30-20`, `/tutorial`. Cambio atómico, 6 archivos, 1 línea cada uno.

**Verificado sin cambios:** title, description, canonical, hreflang, schema JSON-LD, H1, contenido, funcionalidad. Páginas ya correctas (`/blog`, `/herramientas`, `calculadora-inflacion`) sin regresión.

**Validación:** `npm run build` ✅, `npm run lint` ✅ (0 errores), `npx tsc --noEmit` ✅ (0 errores), render local confirma `og:site_name: "MetodoKakebo.com"` en las 9 páginas públicas auditadas.

**Sin cambios de contenido ni funcionalidad.**

---

## SEO-OG-SITENAME-INHERITANCE-AUDIT-01 — Auditoría de ausencia de og:site_name

**Estado:** ✅ Completado (2026-07-09) — solo análisis y documentación

Documento creado: `docs/seo/SEO_OG_SITENAME_INHERITANCE_AUDIT_01.md`

Confirma que 6 de 9 páginas públicas (`/`, `/sobre-nosotros`, `/blog/[slug]`, `/herramientas/calculadora-ahorro`, `/herramientas/regla-50-30-20`, `/tutorial`) no emiten `og:site_name` por reemplazo (no fusión) del `openGraph` de `layout.tsx` cuando la página define uno propio — comportamiento de Next.js Metadata API, no un error de valor. `/blog`, `/herramientas` y `calculadora-inflacion` ya son correctas.

**Siguiente tarea recomendada:** `SEO-OG-SITENAME-INHERITANCE-IMPL-01` — añadir `siteName: "MetodoKakebo.com"` (vía constante compartida) al `openGraph` de los 6-7 archivos identificados. Riesgo bajo, no afecta ventanas de medición activas.

**Sin cambios de código ni contenido en esta tarea.**

---

## SEO-AUTHOR-ABOUT-NORMALIZE-01 — Normalización de Person.name en /sobre-nosotros

**Estado:** ✅ Completado (2026-07-09)

Documento creado: `docs/seo/SEO_AUTHOR_ABOUT_NORMALIZE_01.md`

Corrige el hallazgo adyacente detectado en `SEO-SITENAME-UNIFY-01`: `Person.name` en el schema JSON-LD de `/sobre-nosotros` decía `"Aitor Almu"` en lugar del nombre editorial canónico. Cambio atómico de 1 línea.

**Corregido:**
- `src/app/[locale]/(public)/sobre-nosotros/page.tsx` — `Person.name`: `"Aitor Almu"` → `"Aitor Alarcón"`

**Sin tocar:** `Organization.name` (`"MetodoKakebo.com"`), `siteName`, `sameAs`, `contactPoint.email`, canonical/hreflang/sitemap/robots, artículos, herramientas, `plantilla-kakebo-excel`.

**Validación:** `npm run build` ✅, `npm run lint` ✅ (0 errores), `npx tsc --noEmit` ✅ (0 errores), render local confirma `Person.name: "Aitor Alarcón"` y `Organization.name` sin cambios.

**Sin cambios de contenido, herramientas ni SEO técnico global.**

---

## SEO-SITENAME-UNIFY-01 — Unificación de siteName / entidad editorial

**Estado:** ✅ Completado (2026-07-09)

Documento creado: `docs/seo/SEO_SITENAME_UNIFY_01.md`

Fija `MetodoKakebo.com` como nombre canónico de la entidad editorial del sitio, distinto del producto/app (`Kakebo AI`) y del concepto del método japonés (`método Kakebo`), ambos sin tocar. Cambio atómico: 2 archivos, 1 línea cada uno.

**Corregido:**
- `src/app/[locale]/layout.tsx` — `openGraph.siteName`: `"Kakebo AI"` → `"MetodoKakebo.com"`
- `src/app/[locale]/(public)/sobre-nosotros/page.tsx` — `Organization.name` (JSON-LD): `"Kakebo AI"` → `"MetodoKakebo.com"`

**Sin tocar (ya correcto):** `creator`/`publisher` globales, `calculadora-inflacion` (siteName), Organization/publisher/author en Home, blog index, hub herramientas, `calculadora-ahorro`, `blog/[slug]`; todos los `@id` de Organization; canonical/hreflang/sitemap/robots; `plantilla-kakebo-excel`.

**Hallazgos adyacentes documentados, no corregidos:** `Person.name: "Aitor Almu"` en schema de `/sobre-nosotros` (debería ser "Aitor Alarcón"); ausencia de `og:site_name` en Home y `calculadora-ahorro` por comportamiento de no-merge de `openGraph` en Next.js.

**Validación:** `npm run build` ✅, `npm run lint` ✅ (0 errores, 76 warnings preexistentes), `npx tsc --noEmit` ✅ (0 errores), render local confirma JSON-LD/OG correctos.

**Sin cambios de contenido ni funcionalidad.**

---

## SEO-ROADMAP-RESUME-01 — Reconciliación del roadmap SEO/GEO

**Estado:** ✅ Completado (2026-07-09)

Documento creado: `docs/seo/SEO_ROADMAP_RESUME_2026_07_09.md`

Reconcilia el Plan Maestro y el roadmap SEO/GEO (`docs/seo/PLAN_SEO_GEO_METODOKAKEBO.md`, `docs/seo/SEO_ROADMAP_V1.md`, `docs/seo/SEO_GEO_DEEP_AUDIT_01.md`) con el estado real tras el cierre del Sprint SEO Técnico V1 y el avance del Sprint Contenido V1. Confirma cierre de todo el Bloque 1 técnico y la mayor parte del Bloque 2 (arquitectura/autoría); identifica 3 tareas técnicas ejecutables sin dependencias (`SEO-SITENAME-UNIFY-01`, `SEO-TECHNICAL-TUTORIAL-PRIORITY-01`, `SEO-BREADCRUMB-AUDIT-01`); confirma bloqueo del Bloque 4 de contenido hasta el snapshot GSC 2026-07-17/31; documenta que `/blog/cuentas-remuneradas` y `/herramientas/calculadora-ahorro` están en fase de medición y no deben tocarse.

**Deudas resueltas verificadas:** hreflang T-13, publisher G-12, sitemap/schema hub herramientas T-01, `lastModified` T-10, normalización de autoría (7→2 identidades), calculadora de ahorro V2 + SEO/GEO completa, integración post-publicación confirmada externamente en GSC/Rich Results.

**Deuda documental señalada (no corregida en esta tarea):** `docs/PROJECT_STATUS.md` y este archivo estaban desincronizados desde 2026-07-07; existe un `SEO_MAP_V1.md` residual sin trackear en la raíz del repo, superseded por `docs/seo/SEO_MAP_V1.md`.

**Siguiente tarea recomendada:** `SEO-SITENAME-UNIFY-01` — única deuda técnica P1 sin ejecutar y sin dependencias, ejecutable ya sin violar ninguna ventana de medición activa.

**Nota:** no se ha modificado código ni contenido. Solo documentación.

---

## POST-PUBLISH-INDEXATION-CHECK-01 — Verificación post-publicación

**Estado:** ✅ Completado (2026-07-09)

Verificación de rastreabilidad, indexabilidad, sitemap, metadata y schema estructurado para las dos URLs trabajadas en Sprint Contenido V1:
- `/blog/cuentas-remuneradas` (commit `011f42c`)
- `/herramientas/calculadora-ahorro` (commits `e986a1d`, `ea3f17b`, `1b986e2`)

Documento creado: `docs/seo/POST_PUBLISH_INDEXATION_CHECK_2026_07_08.md`  
Resultado: ambas URLs correctamente integradas, en sitemap, sin bloqueos de indexación en producción, metadata y schema (`BlogPosting`, `FAQPage`, `BreadcrumbList`, `SoftwareApplication`, `HowTo`) coherentes. `npm run build`, `lint` y `tsc --noEmit` limpios. Sin cambios de código, contenido ni UI.

**Próximas mediciones recomendadas:**
- Artículo nuevo: revisar rastreo/indexación en 8–12 semanas.
- Cambios title/meta calculadora: revisar CTR/posición en 2–4 semanas.
- FAQ/HowTo visible: revisar rich results en 4–8 semanas.

**Checklist manual pendiente para el usuario:** inspección GSC + Rich Results Test de ambas URLs (ver documento).

**Nota:** se retoma el Plan Maestro SEO/GEO tras este cierre.

---

## SEO-GSC-ANNOTATION-CHANGELOG-01 — Changelog GSC sprint

**Estado:** ✅ Completado (2026-07-03)

Documento de trazabilidad creado: `docs/seo/GSC_CHANGELOG_2026_07_03.md`  
Registra 7 commits del sprint, baseline GSC, métricas a revisar y decisiones vigentes.  
**Próximo snapshot:** entre 2026-07-17 y 2026-07-31.  
Sin cambios en `src/` ni en contenido.

---

## SEO-NOINDEX-SITEMAP-SMOKE-01 — Validación técnica noindex + sitemap

**Estado:** ✅ Completado (2026-07-03)

**Bug detectado y corregido en `sitemap.ts`:**
- `getBlogPosts()` sin argumento → solo lee `.es.mdx` → noindex EN ignorado por el sitemap
- Resultado: las 10 URLs `/en/blog/...` con `noindex: true` EN aparecían igualmente en el sitemap (señal contradictoria)
- Fix: `getBlogPosts('en')` para construir `enNoindexSlugs` y dos guards `if (locale === 'en' && enNoindexSlugs.has(post.slug)) return` — uno al generar la entrada, otro en hreflang `alternates`

**Mecanismo `robots` (page.tsx):** Correcto — `post.frontmatter.noindex && { robots: { index: false, follow: false } }` ✅  
**Mecanismo `sitemap.ts`:** Corregido en este commit. Ahora los 10 slugs EN noindex no generan entrada EN en el sitemap ni en `alternates`.  
**Build:** Limpio.

---

## SEO-LEGACY-EN-NOINDEX-BATCH-01 — noindex batch 7 artículos EN legacy

**Estado:** ✅ Completado (2026-07-03)

**Artículos marcados con `noindex: true`:**
1. `ahorro-pareja.en.mdx` → `/en/blog/ahorro-pareja`
2. `kakebo-sueldo-minimo.en.mdx` → `/en/blog/kakebo-sueldo-minimo`
3. `libro-kakebo-pdf.en.mdx` → `/en/blog/libro-kakebo-pdf`
4. `metodo-kakebo-para-autonomos.en.mdx` → `/en/blog/metodo-kakebo-para-autonomos`
5. `regla-30-dias.en.mdx` → `/en/blog/regla-30-dias`
6. `kakebo-online-guia-completa.en.mdx` → `/en/blog/kakebo-online-guia-completa` ← prioridad por cross-language risk
7. `peligros-apps-ahorro-automatico.en.mdx` → `/en/blog/peligros-apps-ahorro-automatico`

**Acumulado noindex EN:** 10/15 artículos EN ahora excluidos del índice y del sitemap.  
**Excluidos del batch (según decisión):** `como-ahorrar-dinero-cada-mes` · `eliminar-gastos-hormiga` · `metodo-kakebo-guia-definitiva` (dudosos) · `como-hacer-un-presupuesto-personal` (mantener) · `plantilla-kakebo-excel` (protegido).

**Cambio por archivo:** 1 línea `noindex: true` en frontmatter. Cuerpo intacto. Sin tocar `.es.mdx`, Home, herramientas, `sitemap.ts` ni Excel.  
**Build:** Limpio.

---

## SEO-LEGACY-EN-INVENTORY-DECISION-01 — Inventario artículos EN legacy

**Estado:** ✅ Completado (2026-07-03) — solo documentación

**Resultado:** 15 artículos `.en.mdx` clasificados. Ver `docs/seo/SEO_LEGACY_EN_INVENTORY_DECISION_01.md`.

| Decisión | N | Artículos |
|---|---|---|
| ✅ Ya noindex | 3 | kakebo-online-gratis · alternativas-a-app-bancarias · kakebo-vs-ynab |
| 🟢 Mantener indexable | 1 | `como-hacer-un-presupuesto-personal` (2026-06-22 — más reciente, keyword EN real) |
| 🟡 Dudoso / esperar GSC | 3 | `como-ahorrar-dinero-cada-mes` · `eliminar-gastos-hormiga` · `metodo-kakebo-guia-definitiva` |
| 🔴 Candidatos a noindex | 7 | `ahorro-pareja` · `kakebo-sueldo-minimo` · `libro-kakebo-pdf` · `metodo-kakebo-para-autonomos` · `regla-30-dias` · `kakebo-online-guia-completa` · `peligros-apps-ahorro-automatico` |
| ⚪ No tocar | 1 | `plantilla-kakebo-excel` (protegido) |

**Próxima tarea propuesta:** `SEO-LEGACY-EN-NOINDEX-BATCH-01` — noindex en bloque de los 7 candidatos

**Archivo creado:** `docs/seo/SEO_LEGACY_EN_INVENTORY_DECISION_01.md`  
**Sin cambios en frontmatter** — solo documentación.

---

## SEO-KAKEBO-ONLINE-GUIA-SNIPPET-01 — Snippet /blog/kakebo-online-guia-completa

**Estado:** ✅ Completado (2026-07-03) — title y excerpt optimizados

**Archivo modificado:** `src/content/blog/kakebo-online-guia-completa.es.mdx` (frontmatter, 3 líneas)

| Campo | Antes | Después |
|---|---|---|
| `title` | `Kakebo online: guía completa del método Kakebo en formato digital (2026)` (73 chars) | `Kakebo online: guía completa del método Kakebo (2026)` (53 chars) |
| `excerpt` | `Cómo usar el método Kakebo en formato digital: qué herramienta elegir, cómo empezar paso a paso y los errores más comunes...` | `Guía de MetodoKakebo.com para usar el método Kakebo en formato digital: qué herramienta elegir, cómo empezar paso a paso y los errores más habituales...` |
| `updatedDate` | `2026-07-01` | `2026-07-03` |

**Nota técnica:** `description` en frontmatter no se usa en SERP (el sistema de blog usa `excerpt` para meta description y OG). Solo `title` y `excerpt` afectan al snippet.

**Justificación:**
- `title`: "en formato digital" eliminado (redundante con "online") — reduce longitud de 73→53 chars, evitando truncado al añadir " | Blog Kakebo"
- `excerpt`: añadido "Guía de MetodoKakebo.com" al inicio — señal de entidad de marca + señal de intención informativa ("guía")
- Intención informativa mantenida: no cannibaliza Home ("App Gratis") ni Excel ("plantilla")
- Cuerpo del artículo: no tocado · EN no tocado · herramientas: no tocadas

**Build:** Limpio

---

## SEO-LEGACY-EN-NOINDEX-01 — noindex artículos EN legacy

**Estado:** ✅ Completado (2026-07-03)

**Artículos EN revisados (15 total):**

| Archivo | Estado previo | Acción |
|---|---|---|
| `kakebo-online-gratis.en.mdx` | `noindex: true` (cba3fd0) | No tocado ✅ |
| `alternativas-a-app-bancarias.en.mdx` | Indexable | `noindex: true` añadido |
| `kakebo-vs-ynab.en.mdx` | Indexable | `noindex: true` añadido |
| 12 restantes (.en.mdx) | Sin cambio | No estaban en scope GSC — no tocados |

**Mecanismo reutilizado:** frontmatter `noindex: true` → `robots: { index: false, follow: false }` en `blog/[slug]/page.tsx` → exclusión automática de `sitemap.ts`. Implementado en `cba3fd0`. `sitemap.ts` no modificado en esta tarea.

**Archivos modificados:** 2 — solo frontmatter de `.en.mdx`, sin tocar cuerpo, versiones ES, Home, herramientas ni Excel.  
**Build:** Limpio.

---

## SEO-REGLA-503020-SNIPPET-GEO-01 — Snippet y señal GEO /herramientas/regla-50-30-20

**Estado:** ✅ Completado (2026-07-03) — description y ogDescription optimizados

**Cambio aplicado — `messages/es.json` namespace `Tools.Rule503020.meta`:**

| Campo | Antes | Después |
|---|---|---|
| `description` | `Calculadora 50/30/20 gratis para dividir tu sueldo entre necesidades, deseos y ahorro. Introduce tu salario y obtén tu presupuesto mensual al instante.` | `Calcula tu presupuesto mensual con la regla 50/30/20. Divide tus ingresos entre necesidades (50%), deseos (30%) y ahorro o deuda (20%). Herramienta gratuita de MetodoKakebo.com.` |
| `ogDescription` | `Divide tu sueldo entre necesidades (50%), deseos (30%) y ahorro (20%). Calculadora gratuita de presupuesto mensual basada en la regla 50/30/20.` | `Aplica la regla 50/30/20 a tus ingresos mensuales: 50% para necesidades, 30% para deseos y 20% para ahorro o deuda. Calculadora gratuita de MetodoKakebo.com.` |

**Justificación:**
- `tu sueldo` → `tus ingresos (mensuales)`: herramienta válida para cualquier ingreso, no solo salario
- `regla 50/30/20` explícita en description (antes ausente)
- `ahorro o deuda (20%)`: el 20% sirve también para cancelar deuda — mayor fidelidad a la regla original
- `MetodoKakebo.com` en description y ogDescription: señal de entidad de marca
- `title` y `ogTitle`: sin cambios (ya bien estructurados)
- Schema (SoftwareApplication + HowTo), lógica de cálculo, Home, Excel: no tocados

**Archivos modificados:** `messages/es.json` (2 líneas)  
**Build:** Limpio

---

## SEO-HOME-BRAND-ENTITY-COPY-01 — Refuerzo entidad de marca Home

**Estado:** ✅ Completado (2026-07-03) — metadata quirúrgica

**GSC base:** `/` — 892 imp / pos 8.2 / CTR 5.72% · "kakebo" brand query pos 13.74 (snapshot 2026-03-29 → 2026-06-28)

**Problema identificado:** El title "Kakebo Online Gratis | App de Ahorro con el Método Japonés" targetaba la query "kakebo online gratis" (territorio del artículo /blog/kakebo-online-gratis), y la description no incluía señal de entidad de marca ("MetodoKakebo.com" ni "método Kakebo" explícito).

**Cambio aplicado — `messages/es.json` namespace `Landing.meta`:**

| Campo | Antes | Después |
|---|---|---|
| `title` | `Kakebo Online Gratis \| App de Ahorro con el Método Japonés` | `Kakebo AI \| App Gratis del Método Kakebo` |
| `description` | `App Kakebo online gratis para controlar gastos y ahorrar con el método japonés. Sin conectar el banco, 100% privada y con IA integrada.` | `MetodoKakebo.com es la herramienta gratuita para aplicar el método Kakebo online. Controla gastos, organiza tu presupuesto mensual y mejora el ahorro. Sin banco, 100% privada.` |
| `ogTitle` | Igual al title anterior | Igual al title nuevo |
| `ogDescription` | Igual a description anterior | Igual a description nueva |

**Justificación:**
- `Kakebo AI` reemplaza a `Kakebo Online Gratis` en el title: usa el nombre oficial del producto y evita conflicto con /blog/kakebo-online-gratis
- `del Método Kakebo` en el title: señal de relación entre el producto y el método
- Description inicia con `MetodoKakebo.com es la herramienta gratuita...`: señal de entidad de marca explícita
- `el método Kakebo online` en description: keyword exacta en lugar de "el método japonés" (genérico)
- `messages/en.json`: no tocado (título EN ya estructura correcta: "Kakebo AI: Online Kakebo Savings App")

**Archivos modificados:** `messages/es.json` (4 líneas)  
**Build:** Limpio · Sin cambios en schema, diseño, calculadoras, `/blog/plantilla-kakebo-excel`  
**`.claude/settings.local.json`:** No tocado

---

## SEO-KAKEBO-ONLINE-CANIB-01 — Auditoría canibalización (scope ampliado, 2026-07-03)

**Estado:** ✅ Completado — scope extendido a todas las URLs del sitio

**Contexto:** Tarea originalmente completada el 2026-06-30 (solo canibalización EN/ES en `kakebo-online-gratis`). En la sesión de 2026-07-03 se extendió el scope al resto de URLs relacionadas con "kakebo", "método kakebo", Home, herramientas, tutorial y blog index.

**Resultado del scope ampliado:**

| Par de URLs / Query | Estado | Veredicto |
|---|---|---|
| `/en/blog/kakebo-online-gratis` vs `/blog/kakebo-online-gratis` (ES) | 15 clics EN / 1 clic ES | 🔴 CANIBALIZACIÓN CONFIRMADA — ya documentada |
| Home (`/`) vs cluster "kakebo online" | 892 imp Home / 208 imp EN | 🟡 Solapamiento normal — sin acción |
| `/blog/kakebo-online-gratis` vs `/blog/kakebo-online-guia-completa` | 37 imp guia-completa | 🟡 Dato insuficiente — intenciones diferenciadas |
| "kakebo" brand query → Home pos 13.74 | 2 clics / 168 imp | 🟡 Falta autoridad de marca — no canibalización |
| "método kakebo" → metodo-kakebo-guia-definitiva | 6 imp combinadas | ⚪ Dato insuficiente |
| Herramientas vs artículos blog | Sin overlap | 🟢 Segmentación correcta |

**Única acción recomendada:** `SEO-KAKEBO-ONLINE-CANIB-FIX-01` (ya implementado — commit `cba3fd0`)

**Documento:** `docs/seo/SEO_KAKEBO_ONLINE_CANIB_01.md` — apéndice A1-A5 añadido

---

## SEO-CALCULADORA-AHORRO-AUDIT-01 — Auditoría calculadora-ahorro

**Estado:** ✅ Completado (2026-07-03) — auditoría + un fix quirúrgico

**GSC base:** `/es/herramientas/calculadora-ahorro` — 15 clics / 43 imp / CTR 34.88% / pos 10.7 (snapshot 2026-03-29 → 2026-06-28)

**Hallazgos:**

| Hallazgo | Estado | Acción |
|---|---|---|
| `layout.tsx` con metadata de la calculadora 50/30/20 (error de copy-paste) | CONFIRMADO — error técnico | Fix: eliminado export `metadata` del layout |
| `keywords` incorrectas en HTML (consecuencia del layout erróneo) | CONFIRMADO | Resuelto al fix anterior |
| Snippet ya convierte: CTR 34.88% excepcional | DESCARTADO para cambio | No tocado |
| Pos 10.7 — oportunidad si sube a top-7 | ESPERAR DATOS | Próximo snapshot GSC |
| Schema sin campo `author` (presente en calculadora-inflacion) | DESCARTADO (impacto mínimo) | Deuda menor pendiente |

**Fix aplicado:** Eliminado export `metadata` estático de `layout.tsx` que describía la calculadora 50/30/20 en lugar de la calculadora de ahorro. La metadata real ya la gestiona el `generateMetadata` de `page.tsx`. El layout queda como shell puro (`<>{children}</>`).

**Archivos modificados:** `src/app/[locale]/(public)/herramientas/calculadora-ahorro/layout.tsx`  
**Build:** Limpio. Sin cambios en snippet, lógica, diseño, content ni schema.  
**`.claude/settings.local.json`:** No tocado. `/blog/plantilla-kakebo-excel`: no tocado.

---

## SEO-BLOG-INFLACION-01 — Optimiza snippet calculadora de inflación

**Estado:** ✅ Completado (2026-07-02)

**Hallazgo GSC usado:** `/es/herramientas/calculadora-inflacion` — 300 imp / pos 8.94 / CTR 0.33% (snapshot 2026-03-29 → 2026-06-28)

**Archivo modificado:** `messages/es.json` — namespace `Tools.Inflation.meta`

| Campo | Antes | Después |
|---|---|---|
| `title` | `Calculadora de Inflación e IPC 2026 \| ¿Cuánto pierde tu dinero?` | `Calculadora de Inflación e IPC \| Pérdida de Poder Adquisitivo` |
| `description` | `Calcula cuánto pierde tu dinero con la inflación en España. Introduce tus ahorros, IPC y años. Resultado inmediato y gratis, sin registro.` | `Calcula cuánto ha perdido valor tu dinero con la inflación acumulada. Introduce importe, IPC y años: resultado inmediato. Gratis y sin registro.` |
| `ogTitle` | `Calculadora de Inflación e IPC 2026 \| Kakebo` | `Calculadora de Inflación e IPC \| Pérdida de Poder Adquisitivo` |
| `ogDescription` | `Descubre cuánto dinero pierdes por el IPC acumulado. Herramienta de cálculo de inflación para proteger tus ahorros.` | `Descubre cuánto ha perdido valor tu dinero por el IPC acumulado. Calcula la pérdida de poder adquisitivo real. Herramienta gratuita de MetodoKakebo.com.` |

**Justificación de cambios:**
- Eliminado `2026` del title: evita envejecimiento sin actualización anual
- `Pérdida de Poder Adquisitivo` sustituye a `¿Cuánto pierde tu dinero?`: captura mejor la intención de búsqueda financiera específica
- Eliminado `en España` de la description: la herramienta acepta cualquier IPC, no solo español
- Sustituido `tus ahorros` por `importe`: la herramienta sirve para cualquier cantidad monetaria
- Añadido `inflación acumulada` en description: captura queries de cola larga
- Añadido `MetodoKakebo.com` en ogDescription: señal de entidad para motores generativos
- Lógica de cálculo: no tocada
- `/blog/plantilla-kakebo-excel`: no tocado
- `.claude/settings.local.json`: no tocado

**Validación:** `npm run build` limpio · diff solo en `messages/es.json`

---

## SEO-URL-CANONICAL-ES-01 — Redirección URLs /es/ a canónicas

**Estado:** ✅ Auditado y verificado — sin código nuevo (implementación preexistente confirmada)

**Causa raíz:** `next-intl` con `localePrefix: 'as-needed'` sirve contenido ES tanto en `/blog/...` como en `/es/blog/...`. Google indexó históricamente las URLs `/es/` antes de que se desplegaran los redirects.

**Hallazgo:** Los redirects permanentes ya estaban implementados en `next.config.ts` desde el commit `bed1fd1` (2026-03-21), antes del período del snapshot GSC (2026-03-29 — 2026-06-28). La fragmentación en GSC es un lag de consolidación de Google, no un problema de código activo.

**Comportamiento verificado (308 Permanent Redirect):**

| URL solicitada | Código | Destino |
|---|---|---|
| `/es` | 308 | `/` |
| `/es/blog/plantilla-kakebo-excel` | 308 | `/blog/plantilla-kakebo-excel` |
| `/es/herramientas/calculadora-ahorro` | 308 | `/herramientas/calculadora-ahorro` |
| `/es/herramientas/calculadora-inflacion` | 308 | `/herramientas/calculadora-inflacion` |
| `/es/tutorial` | 308 | `/tutorial` |
| `/es/privacy` | 308 | `/privacy` |
| `/es/sobre-nosotros` | 308 | `/sobre-nosotros` |
| `/es/blog/...?utm_source=test` | 308 | `/blog/...?utm_source=test` (QS preservado) |
| `/en/blog/plantilla-kakebo-excel` | 200 | Sin redirect (correcto) |
| `/api/health` | 200 | Sin redirect (correcto) |

**Sitemap:** Sin URLs `/es/` — limpio.  
**Build:** Limpio (`npm run build` sin errores).  
**Tipo de redirect:** 308 (Next.js convierte `permanent: true` en redirects() → 308 en App Router).  
**Archivos modificados:** Solo PROJECT_STATUS.md y docs/PROJECT_STATUS.md (sin cambios de código).  
**`.claude/settings.local.json`:** No tocado.  
**`/blog/plantilla-kakebo-excel`:** No modificado.

**Expectativa SEO:** Google consolidará las URLs `/es/` hacia las canónicas a medida que recrawlee el sitio en las próximas semanas/meses. Los clicks reportados en GSC contra `/es/...` son atribución al URL indexado (redirect source), no al URL servido.

---

## SEO-DATA-PRIORITY-01 — Análisis snapshot GSC 2026-06-30

**Estado:** ✅ Completado (2026-07-02)  

**Fuente:** `docs/seo/gsc_2026_06_30/` (Queries, Pages, Chart, Countries, Devices — Last 3 months)  
**Análisis completo:** `docs/seo/GSC_PRIORITY_ANALYSIS_01.md`

**Resumen ejecutivo:**
- 222 clics / 3,079 impresiones / CTR 7.2% / Pos media 7.7
- España 62.6% del tráfico / Desktop 61.7%
- Artículo tractor: `plantilla-kakebo-excel` (125 clics, 861 imp combinados)

**Hallazgo crítico — URL Fragmentation:**  
El 52% de los clics van a URLs `/es/blog/...` no canónicas. `plantilla-kakebo-excel` recibe 115 clics en `/es/` vs 10 en la URL canónica. Google ha indexado las URLs con prefijo `/es/`. Se requiere nueva tarea `SEO-URL-CANONICAL-ES-01`.

**Mayor oportunidad de CTR:** `calculadora-inflacion` — 300 imp, pos 8.94, CTR 0.33%. → `SEO-BLOG-INFLACION-01`

**Siguiente tarea recomendada:** `SEO-BLOG-INFLACION-01`

---

## HOTFIX-BLOG-ARTICLE-ERROR-01 — Corrige error "Algo salió mal" en artículos blog

**Estado:** ✅ Completado (2026-07-02)  
**Build:** ✅ Compiled successfully  

**Causa raíz:** El commit 800bd32 (SEO-GA4-EVENTS-01) añadió `"use client"` a `MDXComponents.tsx`. Esto convirtió todo el módulo en un client boundary. Cuando `BlogPostPage` (RSC) pasa el objeto `components` exportado desde ese módulo a `MDXRemote` de `next-mdx-remote/rsc` (también RSC), Next.js App Router lanza un error de serialización que el error boundary `[locale]/error.tsx` captura mostrando "Algo salió mal" en todos los artículos.

**Fix aplicado:**
- Eliminado `"use client"` e `import { analytics }` de `MDXComponents.tsx`
- Creado `src/components/mdx/MDXClientCTAs.tsx` con `"use client"` que contiene solo los 4 CTAs con tracking (ToolCTA, SimpleCTA, DownloadCTA, ArticleCTA)
- `MDXComponents.tsx` importa los CTAs desde `MDXClientCTAs.tsx` — patrón correcto de Next.js App Router
- Todos los eventos GA4 conservados sin cambios

**Archivos modificados:**
- `src/components/mdx/MDXComponents.tsx` — removido "use client" y CTAs inline
- `src/components/mdx/MDXClientCTAs.tsx` — nuevo archivo cliente con los 4 CTAs + analytics

---

## SEO-TECHNICAL-LEGAL-PAGES-01 — Canonical, hreflang y sitemap en páginas legales

**Estado:** ✅ Completado (2026-07-02)  
**Build:** ✅ Compiled successfully  

**Objetivo:** Añadir canonical/hreflang explícitos y corregir prioridad en sitemap para `/privacy`, `/terms`, `/cookies`.

**Auditoría previa:**
- Canonical: ❌ Ausente en las 3 páginas → ✅ Añadido
- Hreflang: ❌ Ausente → ✅ Añadido (es, en, x-default)
- Sitemap prioridad: ❌ 0.5 → ✅ Reducida a 0.1 (igual que /login)
- noindex: no aplicado — páginas permanecen indexables para confianza/legalidad
- robots.ts: sin cambios necesarios

**Archivos modificados:**
- `src/app/[locale]/privacy/page.tsx` — canonical + hreflang
- `src/app/[locale]/terms/page.tsx` — canonical + hreflang
- `src/app/[locale]/cookies/page.tsx` — canonical + hreflang
- `src/app/sitemap.ts` — prioridad 0.5 → 0.1

---

## SEO-SCHEMA-BLOG-INDEX-01 — Schema CollectionPage + ItemList en /blog

**Estado:** ✅ Completado (2026-07-02)  
**Build:** ✅ Compiled successfully  

**Objetivo:** Añadir schema JSON-LD a `/blog` para reforzar su función como índice editorial.

**Schema añadido en `src/app/[locale]/(public)/blog/page.tsx`:**

- Tipo principal: `CollectionPage`
- `mainEntity`: `ItemList` con `ListItem` por cada artículo indexable
- Generado dinámicamente en el server component a partir de `getBlogPosts(locale)`
- Posts con `noindex: true` excluidos del ItemList
- URLs absolutas correctas: `https://www.metodokakebo.com/blog/[slug]` (ES) / `https://www.metodokakebo.com/en/blog/[slug]` (EN)

**Campos por artículo:**
- `position` (1, 2, 3…)
- `name` (título del artículo)
- `description` (excerpt)
- `url` (URL absoluta locale-aware)

**Publisher:** `{ "@type": "Organization", "name": "MetodoKakebo.com" }`

**Artículos ES incluidos:** 15 (todos los `.es.mdx` publicados sin noindex)

**No duplica:** el schema `BlogPosting` de artículos individuales — `CollectionPage` representa el índice, no los artículos.

---

## SEO-GEO-SAVINGS-CONTENT-FIX-01 — Corrección explicación ahorro/Kakebo en SavingsCalculator

**Estado:** ✅ Completado (2026-07-02)  
**Build:** ✅ Compiled successfully  

**Objetivo:** Eliminar la asociación incorrecta "ahorro (Extra)" en el texto explicativo de la calculadora de ahorro y usar terminología canónica.

**Clave modificada en `messages/es.json`:**

`Tools.Savings.content.whyText1`

**Texto anterior:**  
"…el 30% a deseos (Ocio + Cultura) y el 20% a ahorro (Extra)."

**Texto nuevo:**  
"…el 30% a gastos no esenciales (Ocio/Vicio y Cultura) y fijar el 20% restante como objetivo de ahorro mensual, separado de las categorías de gasto del método Kakebo."

**Errores corregidos:**
- "ahorro (Extra)" → eliminado: "Extras" en Kakebo son gastos imprevistos, no el objetivo de ahorro
- "Ocio + Cultura" → "Ocio/Vicio y Cultura" (terminología canónica)
- El ahorro pasa a describirse como objetivo del presupuesto, no como categoría de gasto

---

## SEO-GEO-CALCULADORA-AHORRO-SCHEMA-TERMINOLOGY-01 — Auditoría schema/FAQ calculadora-ahorro

**Estado:** ✅ Auditado — sin cambios necesarios (2026-07-02)  
**Build:** sin cambios en código  

**Objetivo:** Verificar y corregir terminología no canónica en el FAQ_SCHEMA y JSON-LD de `calculadora-ahorro/page.tsx`.

**Resultado de la auditoría:**

El `FAQ_SCHEMA` y el contenido visible del schema en `calculadora-ahorro/page.tsx` **ya usan terminología canónica correcta**:
- FAQ pregunta 2 (`¿Cuáles son las 4 categorías del Kakebo?`): "Supervivencia", "**Ocio/Vicio**", "Cultura", "**Extras**" ✅
- Párrafos visibles (líneas 106, 121): "Supervivencia, Ocio/Vicio, Cultura y Extras" ✅
- `SCHEMA` (SoftwareApplication): sin nombres de categorías — sin problema ✅

**Hallazgos fuera del alcance de esta tarea (para futura tarea):**
- `Tools.Savings.content.whyText1` (línea 277): "(Extra)" usado para el 20% de ahorro en contexto 50/30/20 — confusión conceptual (Extra en Kakebo es para imprevistos, no ahorro) + forma no canónica; requiere reescritura de ese párrafo explicativo.
- `Tools.Savings.content.whyText2` (línea 278): `'Ocio'` en pregunta retórica — shorthand aceptable según glosario si el contexto ya establecido.
- Dashboard app (líneas 645-649, 985-988, 1043-1046): `"opcional": "Opcional"` y `"extra": "Extra"` — son etiquetas internas del /app/ que mapean claves de base de datos; fuera de alcance.
- `Tools.Rule503020.legend.wants.label` (línea 310): "30% Deseos (Opcional)" — herramienta diferente, contexto 50/30/20 no Kakebo.

**Archivos NO modificados:** ninguno (auditoría confirmó estado correcto del target).

---

## SEO-GEO-TUTORIAL-TERMINOLOGY-FIX-01 — Corrección terminología categorías en /tutorial

**Estado:** ✅ Completado (2026-07-02)  
**Build:** ✅ Compiled successfully  

**Objetivo:** Sustituir nombres de categorías Kakebo no canónicos en el namespace `Tutorial` de `messages/es.json`.

**Claves modificadas en `messages/es.json` (Tutorial namespace):**

| Clave | Antes | Después |
|---|---|---|
| `content.s2.c2` | `<bold>Opcional:</bold>` | `<bold>Ocio/Vicio:</bold>` |
| `content.s2.c4` | `<bold>Extra:</bold>` | `<bold>Extras:</bold>` |
| `images.img2.alt` | "…Supervivencia, Opcional, Cultura y Extra" | "…Supervivencia, Ocio/Vicio, Cultura y Extras" |

**Archivos NO tocados:** `tutorial/page.tsx` (schema válido), Home, herramientas, blog, inglés.

---

## SEO-GEO-SOBRE-NOSOTROS-01 — Optimización GEO/E-E-A-T de /sobre-nosotros

**Estado:** ✅ Completado (2026-07-02)  
**Build:** pendiente validación  

**Objetivo:** Eliminar superlativos no verificables, terminología no canónica e implicaciones de asesoramiento financiero del namespace `About` en `messages/es.json`. Sin tocar schema, diseño, rutas ni inglés.

**Cambios en `messages/es.json` (About namespace):**

| Campo | Problema | Cambio |
|---|---|---|
| `meta.description` | "mi misión de devolverte el control financiero" + "Sin humo" (1ª persona comercial, coloquial) | Reemplazado por descripción factual de MetodoKakebo.com |
| `meta.ogDescription` | "la app de Kakebo más privada y segura del mercado, diseñada para la tranquilidad mental" (superlativo no verificable, claim subjetivo) | Reemplazado por descripción factual sin superlativos |
| `story.p2` | "(Mindful Spending)" (etiqueta inventada en inglés) + "la solución definitiva" (superlativo) + "avalada por más de un siglo de eficacia empírica" (claim exagerado) | Eliminados; añadida referencia histórica factual (1904, Motoko Hani) y disclaimer de herramienta educativa |
| `values.v2.desc` | "Ocio" (nombre no canónico; falta "/Vicio" y "Extras") | Corregido a "Ocio/Vicio, Cultura y Extras" según glosario |
| `values.v3.desc` | "coach financiero" + "consejos reales y accionables" (implica asesoramiento financiero personalizado) | Reemplazado por descripción factual de qué hace la IA según el método Kakebo |
| `team.desc` | "la mejor herramienta metodológica" (superlativo) | "la mejor" → "una" |

**Archivos NO tocados (confirmado):** `sobre-nosotros/page.tsx` (schema válido), `messages/en.json`, diseño, rutas, imágenes.

---

## SEO-GA4-EVENTS-01 — Eventos GA4 para conversiones SEO

**Estado:** ✅ Completado (2026-07-02)  
**Build:** ✅ Compiled successfully

**Objetivo:** Implementar eventos GA4 para medir conversiones SEO reales sin tocar diseño, copy, rutas ni SEO técnico.

**Eventos implementados:**

| Evento GA4 | Trigger | Archivos | Parámetros |
|---|---|---|---|
| `tool_viewed` | Montaje de cada calculadora | `SavingsCalculator.tsx`, `CalculatorInflation.tsx`, `Calculator503020.tsx` | `tool_name` |
| `use_savings_calculator` | Primera interacción con inputs de `SavingsCalculator` | `SavingsCalculator.tsx` | `tool_name: calculadora_ahorro` |
| `use_inflation_calculator` | Primera interacción con inputs de `CalculatorInflation` | `CalculatorInflation.tsx` | `tool_name: calculadora_inflacion` |
| `use_503020_calculator` | Primera interacción con slider de `Calculator503020` | `Calculator503020.tsx` | `tool_name: regla_50_30_20` |
| `click_tool_to_app` | Clic en CTA de herramientas hacia /login | `SavingsCalculator.tsx`, `CalculatorInflation.tsx`, `Calculator503020.tsx` | `tool_name`, `cta_location` |
| `click_cta_login` | Clic en SimpleCTA, ArticleCTA, ToolCTA (→login) en artículos | `MDXComponents.tsx` | `source_page`, `cta_label`, `cta_location` |
| `download_template` | Clic en DownloadCTA en artículos | `MDXComponents.tsx` | `template_type: excel`, `source_page`, `location` |
| `tool_interaction` | Clic en cross-sell desde CalculatorInflation | `CalculatorInflation.tsx` | `tool_name`, `action: cross_sell` |

**Archivos modificados:**
- `src/lib/analytics.ts` — Nuevos tipos de evento añadidos; `window.gtag` activado con safety check (`typeof window !== 'undefined' && typeof window.gtag === 'function'`)
- `src/components/landing/tools/SavingsCalculator.tsx` — `analytics` import, `tool_viewed` on mount, `use_savings_calculator` on first input, `click_tool_to_app` on CTA
- `src/components/landing/tools/CalculatorInflation.tsx` — `useRef` añadido, `use_inflation_calculator` on first input, estandarización `signup_click` → `click_tool_to_app`
- `src/components/landing/tools/Calculator503020.tsx` — `useRef` añadido, `use_503020_calculator` on first slider, estandarización `signup_click` → `click_tool_to_app`
- `src/components/mdx/MDXComponents.tsx` — `"use client"` añadido, `analytics` import, eventos en `SimpleCTA`, `DownloadCTA`, `ArticleCTA`, `ToolCTA` (solo cuando href → login/app)

**Eventos NO implementados (pendiente):**
- CTA inline en `calculadora-ahorro/page.tsx` (botón "Empezar a usar la App" en sección inferior) — es JSX inline de servidor, requiere extraer a un Client Component separado; riesgo > beneficio en esta tarea.
- Tracking de `click_cta_login` en CTA del bloque final del `tutorial/page.tsx` — mismo motivo.

**Principios de privacidad:**
- No se envían datos personales (nombres, emails, importes concretos).
- Solo se envían: nombre de herramienta, página de origen (pathname), nombre del botón (texto del CTA), ubicación del CTA.
- Todos los eventos fallan silenciosamente si GA4 no está cargado.

---

## SEO-TECHNICAL-TUTORIAL-01 — Auditoría /tutorial: canonical y hreflang

**Estado:** ✅ Completado con cambios (2026-07-01)  
**Archivo:** `src/app/[locale]/(public)/tutorial/page.tsx`  
**Build:** ✅ Compiled successfully

**Auditoría de contenido:**
- Clasificación: **A — Mantener indexable**
- Contenido: 4 secciones (qué es Kakebo, 4 categorías, dashboard, agente IA), imágenes de producto, TOC lateral
- Intención SEO: navegacional/informacional para usuarios que buscan "tutorial Kakebo" o "cómo usar Kakebo"
- No thin content per se — es tutorial de producto con imágenes reales de la app
- No compite directamente con artículos del blog (foco en interfaz del producto, no en el método en general)

**Bug técnico encontrado y corregido:**
- `canonical` apuntaba a `https://www.metodokakebo.com/es/tutorial` (URL con prefijo `/es/` que redirige o no existe)
- `hreflang "es"` y `"x-default"` apuntaban a `/es/tutorial` en lugar de `/tutorial`
- Patrón correcto: `locale === 'es' ? '' : `/${locale}`` (igual que `sobre-nosotros` y artículos del blog)

**Cambios:**
- `canonical`: `/${locale}/tutorial` → `${locale === 'es' ? '' : `/${locale}`}/tutorial`
- `hreflang "es"`: `/es/tutorial` → `/tutorial`
- `hreflang "x-default"`: `/es/tutorial` → `/tutorial`

**Nota técnica (fuera de alcance, para tarea futura):** `messages/es.json` usa "Opcional" y "Extra" como nombres de categoría en la sección de tutorial — terminología no canónica (debería ser "Ocio/Vicio" y "Extras"). Pendiente de corrección en una tarea de contenido separada.

**Sitemap:** `/tutorial` permanece con prioridad 0.8 — correcto para página de onboarding de producto.

---

## SEO-TECHNICAL-SITEMAP-01 — Ajuste sitemap: herramientas y login

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/app/sitemap.ts`  
**Build:** ✅ Compiled successfully

**Auditoría:**
- `/herramientas/calculadora-ahorro` — ✅ ya presente (prioridad 0.9)
- `/herramientas/calculadora-inflacion` — ✅ ya presente (prioridad 0.9)
- `/herramientas/regla-50-30-20` — ✅ ya presente (prioridad 0.9)
- `/login` — prioridad 0.8 → **0.1**; changeFrequency `monthly` → `yearly`

**Cambios realizados:**
- `/login`: prioridad 0.8 → 0.1; changeFrequency `monthly` → `yearly`

**No modificado (ya correcto):**
- Las tres herramientas públicas ya estaban incluidas con prioridad 0.9
- Blog posts usan `updatedDate ?? date` para `lastModified` (patrón correcto, ya implementado en SEO-TECHNICAL-DATEMODIFIED-01)
- Home con prioridad 1.0 — correcto

**Nota técnica:** Las páginas estáticas (core routes) usan `lastModified: new Date()` que marca siempre la fecha actual. Es el patrón existente del repo y no fue modificado en esta tarea.

---

## SEO-GEO-SUPPORT-SUELDO-MINIMO-01 — Optimización SEO/GEO artículo kakebo-sueldo-minimo

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/kakebo-sueldo-minimo.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `description` añadido
- `title`: actualizado a "Cómo ahorrar con el salario mínimo: método Kakebo para ingresos ajustados"
- `excerpt`: "el Método Kakebo es perfecto" → descripción factual; "parece imposible" eliminado
- FAQ Q2: "bueno" → "útil"; "no te juzga" → explicación factual; "Ocio y Vicio" → "Ocio/Vicio"; "tu poco dinero" eliminado
- FAQ Q4: "Rotundamente sí" eliminado; "linterna financiera" eliminado; "Vicio" → "Ocio/Vicio"; "Extra" → "Extras"
- Intro: "gurús financieros americanos", "jubilarse joven en Bali", "nadie se digna a responder" eliminados → explicación directa
- H2: "El gravísimo error occidental" → "Por qué el porcentaje importa más que la cantidad"
- H2: "La salvación Kakebo: Santificar primero tu Hábito. Importar un rábano tu cuota." → "El enfoque del método Kakebo con ingresos ajustados"
- "el 99% de las metodologías americanas" (estadística sin fuente) eliminado
- "letal sentimiento", "precipicio económico familiar" eliminados
- "El as bajo la manga de la mentalidad nipona" eliminado
- "saldo bajo la sombra del reflejo de tu cuenta del BBVA" (marca concreta) eliminado
- Tabla: "Ocio y Vicio" → "Ocio/Vicio"; "Cultura / Extras" (combinados) → filas separadas Cultura 5% + Extras 5%
- ToolCTA: emoji "📥" eliminado del título
- "drásticamente" eliminado
- H2: "Adaptación Extrema: El Kakebo para Estudiantes con Beca o Precariedad" → "Adaptación para estudiantes y situaciones de mayor precariedad"
- "sorprendentemente efectivo, y hasta terapéutico" (lenguaje médico) eliminado
- "miserables euros", "tristes 300€", "burla para un adulto de 40 años" (condescendiente) eliminados
- "compleja red neuronal", "armazón invencible", "cimentando el muro de carga" (pseudociencia/metáforas extremas) eliminados
- `Ocio y Vicio` → `Ocio/Vicio` en todo el artículo
- Figcaption: texto poético → descripción factual del método
- Alt text de imagen: mejorado para SEO y accesibilidad

---

## SEO-GEO-SUPPORT-ELIMINAR-GASTOS-HORMIGA-01 — Optimización SEO/GEO artículo eliminar-gastos-hormiga

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/eliminar-gastos-hormiga.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `description` añadido
- `title`: "El método japonés infalible" eliminado → "Cómo eliminar los gastos hormiga con el método Kakebo"
- `excerpt`: "sin esfuerzo" eliminado → descripción factual del contenido
- FAQ Q1: ampliada para incluir ejemplos concretos y efecto acumulado
- FAQ Q2: "Ocio y Vicio" → "Ocio/Vicio" (terminología canónica); "drásticamente" eliminado; "choque de consciencia" → "tomar consciencia"
- Intro: "antídoto perfecto" y "silencioso y destructivo" eliminados → explicación directa
- Emojis en lista de ejemplos (☕🍫💳📺🛒) eliminados
- H3: "Las matemáticas mortales detrás del 'Factor Latte'" → "El impacto acumulado del gasto pequeño diario"
- "verdaderamente devastador" eliminado
- H2: "La solución japonesa: Kakebo contra la colmena" → "El método Kakebo para detectar gastos hormiga"
- "El secreto ancestral para destruir" eliminado
- H3: "La suma de la vergüenza (y la liberación)" → "Revisar el total de Ocio/Vicio al cierre del mes"
- "absolutamente curativo" eliminado
- "90% de los gastos hormiga" (porcentaje sin fuente) eliminado
- H2: "Kakebo AI: Destruyendo gastos hormiga en 2026" → "Kakebo AI para el registro de gastos hormiga"
- "nosotros hemos creado la solución definitiva" → terminología canónica (Kakebo AI / MetodoKakebo.com)
- "consciencia budista del método original" eliminado
- "la tecnología más punta del momento" eliminado
- Emoji 💬 eliminado del body
- "destructiva categoría de 'Ocio y Vicio'" → "categoría Ocio/Vicio"
- "te manda el aviso" (feature claim no verificado) eliminado
- "informe exacto, forense y detallado" → "informe mensual por categoría"
- "consulta nuestra guía completa" (primera persona) → referencia factual

---

## SEO-GEO-SUPPORT-REGLA-30-DIAS-01 — Optimización SEO/GEO artículo regla-30-dias

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/regla-30-dias.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `title` actualizado: eliminado "El escudo definitivo" → descriptivo y factual
- `description` añadido: describe el contenido con terminología canónica
- `excerpt` actualizado: eliminado "curar tu adicción" y "miles de euros" → descripción factual
- FAQ Q1: ampliada para mayor completitud (incluye el "si sí / si no" del resultado)
- FAQ Q2: eliminado "neocórtex racional" (pseudocientífico) y "80% de los casos" (estadística sin fuente) → explicación conductual factual
- Intro: eliminada narrativa ficticia ("Lunes por la tarde", "¡ALTO! Congela la tarjeta", "antivirus más potente jamás creado") → explicación directa de la regla
- H2 "La Trampa Dopaminérgica" → "Por qué las compras impulsivas son difíciles de evitar"
- Eliminado framing médico: "Para entender cómo curar la enfermedad, primero hay que entender el diagnóstico"
- Eliminado blockquote pseudocientífico: "diseñado quirúrgicamente para hackear tu sistema de recompensa animal"
- Eliminado "estadísticamente imposible" (sin fuente)
- Eliminados superlatiivos: "soberanamente efectiva, absolutamente gratuita", "desarmantemente simple"
- Paso 2: "romper el bucle dopaminérgico" → descripción factual del objetivo
- Paso 4: "80% de los casos según estudios de psicología del consumo" → "Si la urgencia ha desaparecido" (sin porcentaje sin fuente)
- `Ocio y Vicio` → `Ocio/Vicio` (terminología canónica)
- ToolCTA: eliminado emoji `💡` del título; description actualizada (factual)
- H2: "La Fusión Definitiva" → "La regla de los 30 días y el método Kakebo"
- Eliminado "la eficacia se multiplica considerablemente" (sin fuente)
- Eliminado "la mayoría de usuarios que aplican ambos sistemas juntos reportan..." (afirmación sin fuente)
- Eliminado "consulta nuestra guía" (primera persona) → "La guía de ahorro mensual explica..."
- Obstáculo 2: eliminado "La compra emocional es uno de los mayores destructores de la salud financiera"
- Sección Kakebo AI: terminología canónica explícita (Kakebo AI / MetodoKakebo.com diferenciados)
- Anchor text en artículos relacionados: "el método japonés infalible" → eliminado; título simple

---

## ✅ Capítulo Frontend Público/Indexable — CERRADO

**Fecha de cierre:** 2026-06-24  
**Aceptado por usuario:** sí, provisionalmente  
**Último commit del capítulo:** `b924649` — UIUX: harden premium visual system for mobile

El capítulo frontend público/indexable queda cerrado. No se harán más cambios visuales amplios sin una auditoría o incidencia concreta. Si en revisión visual futura aparece un problema concreto, se abrirá como tarea UIUX puntual.

### Áreas cerradas y aceptadas

| Área | Estado |
|---|---|
| Sistema visual premium global (tokens semánticos, MDXComponents, tailwind.config) | ✅ Cerrado |
| Componentes MDX reutilizables (ToolCTA, SimpleCTA, ArticleCTA, DownloadCTA, HorizontalRule, Callout, Blockquote, FaqSection) | ✅ Cerrado |
| Migración de 13 artículos .es.mdx — CTAs y bloques legacy → componentes | ✅ Cerrado |
| Home pública (Hero, Features, HowItWorks, Testimonials, SavingsSimulator, AlternativesSection, FAQ, ToolsSection, SeoContent) | ✅ Cerrado |
| Blog index (/blog) — featured card + grid + separador editorial | ✅ Cerrado |
| Artículo individual (/blog/[slug]) — header editorial, prose refinada, H2/H3/HR, tablas, CTAs | ✅ Cerrado |
| Navbar pública (desktop + mobile, dropdown herramientas, contexto blog) | ✅ Cerrado |
| Mobile 360/390/430px — CTAs, spacing, tablas, Hero, HowItWorks | ✅ Cerrado |
| Dark mode — tokens semánticos en todos los componentes públicos | ✅ Cerrado |
| Analytics GA4 (MED-01) + CSP (MED-02) | ✅ Cerrado |
| Reglas visuales documentadas para futuros artículos (INSTRUCCIONES.md Regla #8 + tabla MDXComponents) | ✅ Cerrado |

### Historial de tareas completadas (capítulo frontend)

| Tarea | Descripción | Commit |
|---|---|---|
| SEO-PILAR-01 | Artículo pilar "Cómo hacer un presupuesto personal" | `38c22ae` |
| DOC-I18N-01 | Política SEO de idiomas | `4b5ea7f` |
| CHECK-I18N-ROUTING-01 | Bug Accept-Language corregido | `5656eef` |
| UIUX-02 a UIUX-14 | Sprint UI/UX completo (max-width, navbar, features, tipografía, testimonials, PH, tokens, sakura, featurecards, hover, a11y, blog CTA, blog index) | `bfde77e`..`d238358` |
| UIUX-MOBILE-NAV-01 | Navbar mobile + hamburguesa | `770b52c` |
| UIUX-MOBILE-HOME-02–04 | AlternativesSection, Hero H1, py-24 → py-16 en 5 secciones | `1162a97`..`a0da677` |
| MED-01 | GA4 integrado | `3a1777b` |
| MED-02 | CSP actualizada para GA4 | `7a08d3d` |
| UIUX-BLOG-PROSE-01 | Tipografía y MDXComponents base | `43269b6` |
| UIUX-PREMIUM-ARTICLE-01 | HorizontalRule, ToolCTA, ArticleCTA, página de artículo premium | `d3ea3cf` |
| UIUX-GLOBAL-PREMIUM-01 | SimpleCTA, DownloadCTA, migración 13 MDX, ToolsSection | `5376fda` |
| UIUX-GLOBAL-MOBILE-PREMIUM-01 | Mobile: overflow fix CTAs, HowItWorks, ToolsSection | `b924649` |

---

## 🔜 Siguiente bloque — SEO

### SEO-GEO-SUPPORT-KAKEBO-ONLINE-GUIA-COMPLETA-01 — Optimización SEO/GEO artículo kakebo-online-guia-completa

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/kakebo-online-guia-completa.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'`, `readingTime` y `faq` añadidos al frontmatter
- `title` y `description` actualizados: sin "método japonés" suelto; descriptivos
- `excerpt` mejorado: factual
- `faq` frontmatter añadido (Q3: sin "categorías japonesas básicas")
- **Categorías corregidas en todo el artículo:** "Opcional" → "Ocio/Vicio"; "Extra" → "Extras" (aparecía 4 veces en el artículo)
- Intro: "filosofía milenaria" → eliminado; "método japonés creado en 1904 por Motoko Hani" como descripción correcta
- "la magia de verdad" → eliminado
- Primera persona: "¿Nuestra recomendación?" → eliminado; "nuestro simulador interactivo de asistente artificial" → descripción factual en ToolCTA
- "Copiloto Financiero personal" → eliminado
- "mata la filosofía del Kakebo" → explicación factual del porqué
- "comodidades exponenciales" → eliminado
- "la consciencia plena del método japonés" → "el mecanismo central del método Kakebo"
- JSON-LD `description`: actualizado con terminología canónica correcta
- Sección "Kakebo online con IA" reescrita: sin narrativa "Imagina que...", sin "máxima expresión"; factual

---

### SEO-GEO-SUPPORT-KAKEBO-AUTONOMOS-01 — Optimización SEO/GEO artículo metodo-kakebo-para-autonomos

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/metodo-kakebo-para-autonomos.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `title` y `excerpt` actualizados: descriptivos y factuales
- FAQ Q1 y Q2: terminología canónica correcta, sin "de hecho es vital"
- Intro reescrita: sin primera persona "te enseñaremos a domesticar", directa sobre el problema
- Sección "El ciclo de gasto": títulos reescritos (sin "Euforia/Pánico"); eliminado "comportamiento financiero bipolar", "asesino de la tranquilidad", lenguaje dramático
- figcaption: sin "la frontera que separa el éxito del fracaso"
- Sección estrategia: título sin "a prueba de balas"; "Los japoneses inventaron" → "creado por Motoko Hani en 1904"; eliminado "La Magia", "el milagro", "Error mortal autónomo", "milimétricamente", "1.500€ sagrados", "genuina magia de la disciplina nipona"
- Tabla: celdas factuales (sin "¡Mes Excelente!", "guardados a fuego", "Sequía total")
- Post-tabla: eliminado "dramática", "ni para pipas", "funcionario del Estado"
- Sección IVA: título sin "El monstruo trimestral"; eliminado "terrorífico", "sudores fríos nocturnos", "Retención Quirúrgica Inmediata", "religiosamente", "polvorienta subcuenta", "apocalíptica avalancha contable"; corregido bug "las urgentes necesidades urgentes"
- Sección categorías: título sin "Nipones"; eliminado "famosas"
- Sección Kakebo AI: sin cambios significativos; terminología canónica mantenida

---

### SEO-GEO-SUPPORT-LIBRO-KAKEBO-PDF-01 — Optimización SEO/GEO artículo libro-kakebo-pdf

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/libro-kakebo-pdf.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `title` actualizado: descriptivo ("formatos disponibles, limitaciones prácticas y alternativas digitales")
- `excerpt` actualizado: sin "la mayoría lo abandona"
- FAQ Q4: eliminado "potente estructura psicológica" y "inmenso valor"; tono factual
- Intro reescrita: sin primera persona comercial ("tenemos que contarte", "te desvelaremos"), sin narrativa asumida
- Link "método zen financiero" → link correcto al método Kakebo
- Terminología: "magia del Kakebo" → eliminado; "método milenario" → eliminado (1904 no es milenario); "asistente neuronal artificial" → "agente de IA"
- Afirmación "el 85% de los usuarios acaban abandonando" → eliminada (no verificada)
- Lenguaje sensacionalista: "en qué demonios", "embriagante romanticismo", "indudablemente infalible", "burdas fotocopias" → tono factual
- Sección "Las 3 trampas" → "Las limitaciones del formato PDF e impreso"
- Sección "Las ediciones" reorganizada: ventajas/limitaciones concretas por formato
- Tabla comparativa: celdas reescritas ("Sufrido a pulmón" → factual; "Crónicamente lento" → factual; "Copiloto proactivo protector" → factual; "quiebra" → eliminado; "asistente neuronal artificial" → "asistida por IA")
- Cierre: eliminado "milimétricamente", "eliminamos quirúrgicamente", "vibrante e intachable", primera persona; tono factual sobre Kakebo AI con terminología canónica

---

### SEO-GEO-SUPPORT-KAKEBO-VS-YNAB-01 — Optimización SEO/GEO artículo kakebo-vs-ynab

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/kakebo-vs-ynab.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `title` actualizado: describe diferencias reales (registro consciente vs. presupuesto base cero)
- `excerpt` actualizado: describe el contenido comparativo con terminología canónica
- FAQ Q1 y Q2 mejoradas: terminología canónica correcta, respuestas factuales
- Intro reescrita: directa sobre el objetivo comparativo
- Sección YNAB: reescrita con ventajas/limitaciones factuales (eliminadas frases como "sagrada y suprema", "curva estresante")
- Sección Kakebo: renombrada "Qué es el método Kakebo" (eliminado "El contendiente nipón"); definición factual del método Kakebo con D-01; terminología canónica correcta
- Sección Wallet/apps: tono factual (eliminadas frases como "destrozan silenciosamente toda la vital intención reflexiva")
- Tabla comparativa: COMPLETAMENTE REESCRITA — los 5 contenidos de celdas originales eran incoherentes ("Proactivo Ansioso: Vives mentalmente en el futuro, asignando neuróticamente euros", etc.)
- **"Veredicto Final" (líneas 115-128): TEXTO COMPLETAMENTE CORRUPTO** — tres párrafos y tres perfiles con repetición masiva de adjetivos aleatorios — reemplazado por sección "Para quién es mejor cada uno" con tres perfiles claros y factuales
- Sección Kakebo AI: mejorada con terminología canónica explícita (Kakebo AI / método Kakebo / MetodoKakebo.com diferenciados)

---

### SEO-GEO-SUPPORT-AHORRO-PAREJA-01 — Optimización SEO/GEO artículo ahorro-pareja

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/ahorro-pareja.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `title` actualizado: añade "presupuesto compartido, gastos comunes y método Kakebo"
- `excerpt` actualizado: descripción factual directa (sin "El dinero es la principal causa de divorcio")
- FAQ Q1: respuesta ligeramente mejorada
- FAQ Q2: "la pestaña de reflexión del método Kakebo" → "el paso de reflexión del método Kakebo"
- Intro reescrita: directa sobre el problema práctico que resuelve el artículo, sin afirmación sobre "principal causa de divorcio a nivel mundial" (sin fuente verificable)
- H2 "Los 3 Errores Mortales" → "Los 3 errores habituales al gestionar el dinero en pareja"
- Sección 1: "brutal asimetría" → "asimetría de información"; tono factual
- Sección 2: "estúpidamente al 50/50" → "a partes iguales al 50/50"
- Sección 3: "ocultismo económico" mantenido como concepto; redacción más factual
- Modelos: "Existen rotundamente tres" → eliminado "rotundamente"; "(El Recomendado por Psicólogos de Pareja)" sin fuente eliminado
- Caso práctico Ana/Luis: mantenido, con "deprimentes 500€" corregido
- Deudas: sección reestructurada, eliminadas frases dramáticas ("transparencia dolorosa", "exactitud milimétrica", "dinámicas tóxicas del tipo Salvador vs. Rescatado")
- H2 "Aplicando la magia del Kakebo" → "Aplicando el método Kakebo en pareja"
- "método organizativo nipón (Kakebo)" → "el método Kakebo"
- "gran palabra mágica redentora" → "cuarto paso del método Kakebo"
- "el Kakebo nipón impone pacíficamente" → "el método Kakebo propone"
- Diálogos: mantenidos (útiles y bien construidos); framing ligeramente ajustado
- Sección "Kakebo AI": explícitamente nombrada como "app gratuita de MetodoKakebo.com"; terminología canónica correcta (método Kakebo / Kakebo AI / MetodoKakebo.com diferenciados)

---

### SEO-GEO-SUPPORT-AHORRAR-DINERO-CADA-MES-01 — Optimización SEO/GEO artículo como-ahorrar-dinero-cada-mes

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/como-ahorrar-dinero-cada-mes.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `title`: eliminado "que sí funcionan" (clickbait); añadido "presupuesto" al subtítulo
- `excerpt` actualizado: incluye "presupuesto personal", "control de gastos", "método Kakebo", "gastos fijos y gastos hormiga"
- FAQ Q1, Q2, Q3 mejoradas: terminología canónica correcta (método Kakebo, Kakebo AI, MetodoKakebo.com); Q3 menciona explícitamente Kakebo AI
- Intro reescrita: explica directamente el proceso de ahorro mensual (4 pasos: registrar ingresos, clasificar gastos, revisar patrones, definir cantidad realista)
- H2 principales renombrados: "Domando la Psicología del Ahorro" → "Estrategias de base: presupuesto y registro de gastos"; "Tácticas de Trinchera" → "Reducción de gastos fijos y variables"
- Sección 3 (método Kakebo): "infalible" eliminado; "magia del Kakebo" eliminado; añadida definición factual del método Kakebo; añadida descripción de Kakebo AI con terminología canónica
- Sección 4: "enemigo letal", "maldita compra impulsiva", "irrefrenable" eliminados; tono factual
- Sección 5: "extenuante semana 52", "sorprendente cifra", "casi sin darte ni cuenta" eliminados; redacción directa
- Sección 8: "La tarjeta Contactless es peligrosa" → descripción factual del efecto de visibilidad del gasto
- Sección 10: "Tu oscura compañía de luz", lenguaje dramático eliminado; redacción factual
- Sección 11: TEXTO COMPLETAMENTE CORRUPTO (repetición aleatoria de adjetivos) → reescrita con descripción factual del redondeo automático
- Sección 12: TEXTO COMPLETAMENTE INCOHERENTE (repetición aleatoria, ilegible) → reescrita con descripción factual del coste por uso
- Sección 15: "IAs conversacionales que apliquen la filosofía del Kakebo" → terminología canónica correcta: Kakebo AI (MetodoKakebo.com), registro activo vs categorización automática

---

### SEO-GEO-SUPPORT-PELIGROS-APPS-AHORRO-01 — Optimización SEO/GEO artículo peligros-apps-ahorro-automatico

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/peligros-apps-ahorro-automatico.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido
- `excerpt` actualizado: eliminado "graves riesgos" y "manipulación psicológica"; reemplazado por descripción factual de los tres aspectos cubiertos
- FAQ frontmatter Q2: "¿Por qué no recomiendan usar apps de ahorro automático?" → "¿Qué limitaciones tienen las apps de ahorro automático?" (elimina el framing de recomendación negativa); respuesta reescrita de forma factual y equilibrada
- Intro reescrita: explica directamente los tres aspectos que trata el artículo, sin alarmismo
- H2 renombrados: "El Panóptico Bancario Permanente" → "Privacidad y acceso a datos bancarios"; "La Desconexión Neuronal" → "Automatización y consciencia del gasto"; "El fuego cruzado publicitario" → "Publicidad y ofertas personalizadas"
- Peligro 1: eliminadas frases como "algo siniestro", "fatídico instante", "devastadoramente personal"; cita especulativa sobre partido político y moteles eliminada; sustituida por descripción factual de qué refleja un historial bancario
- Peligro 2: eliminado "gravísimo", "dictador robótico", "Ceguera Automática Neuronal" (término no establecido); sustituido por explicación factual del principio de registro activo y el método Kakebo
- Peligro 3: eliminado "créditos vampíricos", "cobradores de comisiones más efectivos e inquietantes"; sustituido por descripción factual del modelo de negocio de comisiones por referidos
- Sección Kakebo AI: depersonalizada ("nunca te pediremos" → "Kakebo AI no solicita"); terminología canónica correcta (método Kakebo / Kakebo AI / MetodoKakebo.com diferenciados)
- Sección "El falso mito": renombrada "El equilibrio entre comodidad y control activo"; eliminadas frases absolutistas ("trampa mortal", "cedes el poder a sistemas diseñados para maximizar su beneficio corporativo", estadística sin fuente); reemplazada por análisis factual de para qué sirve cada enfoque

---

### SEO-GEO-SUPPORT-ALTERNATIVAS-APP-BANCARIAS-01 — Optimización SEO/GEO artículo alternativas-a-app-bancarias

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/alternativas-a-app-bancarias.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios:**
- `updatedDate: '2026-07-01'` añadido al frontmatter
- `title` actualizado: "Las 7 Alternativas a Fintonic sin Banco (2026)" → "Alternativas a Apps Bancarias para Controlar Gastos sin Conectar el Banco (2026)" (alinea con slug y semántica del artículo)
- `excerpt` actualizado: incluye "alternativas a apps bancarias", "controlar gastos", "Kakebo AI"
- FAQ frontmatter: Q2 y Q5 mejoradas para incluir "Kakebo AI" y "MetodoKakebo.com" con terminología canónica
- Intro reescrita: explica directamente el problema (controlar gastos sin conectar el banco), elimina lenguaje alarmista
- Sección "El oscuro modelo de negocio" → renombrada "El modelo de negocio de las apps financieras gratuitas", tono más prudente y factual; eliminadas frases como "comisiones abusivas", "intereses usurarios", "obsceno Data Brokerage", cita exagerada
- Sección "El gran cisma: La Automatización Inconsciente" → renombrada "Automatización frente a registro consciente", tono factual, terminología corregida ("método Kakebo" + "Kakebo AI" diferenciados)
- Sección "Kakebo AI" → depersonalizada (eliminado "hemos creado desde cero", "jamás te pediremos", "nuestro sistema", "¿Cómo narices"); descripción factual del producto como herramienta de MetodoKakebo.com
- Sección "El falso dilema" → renombrada "Privacidad frente a comodidad: no son excluyentes", tono más directo y sin superlatiivos; termina con principio del método Kakebo
- Párrafo de transición: "el método Kakebo potenciado con IA" → "Kakebo AI — la app gratuita de MetodoKakebo.com basada en el método Kakebo" (terminología canónica)
- FAQ cuerpo: respuestas ajustadas para incluir "método Kakebo" y "Kakebo AI" con distinción correcta

---

### SEO-GEO-BLOG-KAKEBO-ONLINE-GUIA-COMPLETA-IMAGE-01 — Imagen portada kakebo-online-guia-completa (imagen definitiva)

**Estado:** ✅ Completado (2026-07-01)  
**Archivos:** `public/images/blog/kakebo-online-guia-completa.png` · `src/content/blog/kakebo-online-guia-completa.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios (2):**
- Imagen añadida a `public/images/blog/kakebo-online-guia-completa.png` (~2.1 MB)
- Frontmatter `image`: `"/images/blog/kakebo-online-guia.png"` → `"/images/blog/kakebo-online-guia-completa.png"` (imagen específica del artículo, nombre único)
- Nota: tarea anterior (GUIA-IMAGE-01) ya corrigió `.jpg→.png`; esta tarea asigna la imagen definitiva con nombre inequívoco
- Otros issues del artículo (H1 duplicado, `description:`, `tags:`) no tocados

---

### SEO-GEO-BLOG-KAKEBO-ONLINE-GUIA-IMAGE-01 — Imagen portada kakebo-online-guia-completa

**Estado:** ✅ Completado (2026-07-01)  
**Archivos:** `public/images/blog/kakebo-online-guia.png` · `src/content/blog/kakebo-online-guia-completa.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios (2):**
- Imagen añadida a `public/images/blog/kakebo-online-guia.png` (~2.4 MB)
- Frontmatter `image`: `"/images/blog/kakebo-online-guia.jpg"` → `"/images/blog/kakebo-online-guia.png"` (corrige ruta rota + formato incorrecto)
- Otros issues del artículo (H1 duplicado, `description:`, `tags:`) no tocados — fuera de alcance de esta tarea

---

### SEO-GEO-BLOG-KAKEBO-AUTONOMOS-IMAGE-01 — Imagen portada metodo-kakebo-para-autonomos

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `public/images/blog/kakebo-autonomos.png`  
**Build:** ✅ Compiled successfully

**Cambios (1):**
- Imagen añadida a `public/images/blog/kakebo-autonomos.png` (~2.4 MB)
- MDX no modificado: el frontmatter ya declaraba `image: '/images/blog/kakebo-autonomos.png'` correctamente

---

### SEO-GEO-BLOG-LIBRO-KAKEBO-PDF-IMAGE-01 — Imagen portada libro-kakebo-pdf

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `public/images/blog/libro-kakebo-pdf.png`  
**Build:** ✅ Compiled successfully

**Cambios (1):**
- Imagen añadida a `public/images/blog/libro-kakebo-pdf.png` (~2.1 MB)
- MDX no modificado: el frontmatter ya declaraba `image: '/images/blog/libro-kakebo-pdf.png'` correctamente

---

### SEO-GEO-BLOG-PELIGROS-APPS-AHORRO-IMAGE-01 — Imagen portada peligros-apps-ahorro-automatico

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `public/images/blog/peligros-apps-ahorro.png`  
**Build:** ✅ Compiled successfully

**Cambios (1):**
- Imagen añadida a `public/images/blog/peligros-apps-ahorro.png` (~2.0 MB)
- MDX no modificado: el frontmatter ya declaraba `image: '/images/blog/peligros-apps-ahorro.png'` correctamente

---

### SEO-GEO-BLOG-AHORRO-PAREJA-IMAGE-01 — Imagen portada ahorro-pareja

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `public/images/blog/ahorro-pareja.png`  
**Build:** ✅ Compiled successfully

**Cambios (1):**
- Imagen añadida a `public/images/blog/ahorro-pareja.png` (~2.4 MB)
- MDX no modificado: el frontmatter ya declaraba `image: '/images/blog/ahorro-pareja.png'` correctamente

---

### SEO-GEO-BLOG-KAKEBO-VS-YNAB-IMAGE-01 — Imagen portada kakebo-vs-ynab

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `public/images/blog/kakebo-vs-ynab.png`  
**Build:** ✅ Compiled successfully

**Cambios (1):**
- Imagen añadida a `public/images/blog/kakebo-vs-ynab.png` (~2.3 MB)
- Nota: archivo fuente en `imagenes/blog/` tenía extensión doble (`kakebo-vs-ynab.png.png`) — copiado con nombre correcto
- MDX no modificado: el frontmatter ya declaraba `image: '/images/blog/kakebo-vs-ynab.png'` correctamente

---

### SEO-GEO-BLOG-AHORRAR-DINERO-IMAGE-01 — Imagen portada como-ahorrar-dinero-cada-mes

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `public/images/blog/ahorrar-dinero.png`  
**Build:** ✅ Compiled successfully

**Cambios (1):**
- Imagen añadida a `public/images/blog/ahorrar-dinero.png` (~2.3 MB)
- MDX no modificado: el frontmatter ya declaraba `image: '/images/blog/ahorrar-dinero.png'` correctamente

---

### SEO-GEO-BLOG-METODO-KAKEBO-GUIA-IMAGE-01 — Imagen portada metodo-kakebo-guia-definitiva

**Estado:** ✅ Completado (2026-07-01)  
**Archivos:** `public/images/blog/metodo-kakebo-guia-definitiva.png` · `src/content/blog/metodo-kakebo-guia-definitiva.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios (2):**
- Imagen añadida a `public/images/blog/metodo-kakebo-guia-definitiva.png` (~2.4 MB)
- Frontmatter `image`: `/api/og?title=Método Kakebo: Guía Definitiva&description=...` → **`/images/blog/metodo-kakebo-guia-definitiva.png`** (imagen estática real)
- Activa: portada visual en artículo, OG image, Twitter card, JSON-LD BlogPosting image

---

### SEO-GEO-PILLAR-PRESUPUESTO-PERSONAL-01 — /blog/como-hacer-un-presupuesto-personal

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/como-hacer-un-presupuesto-personal.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios (7):**
- `updatedDate: '2026-07-01'` añadido — activa dateModified en JSON-LD y sitemap
- Intro: párrafo de definición factual GEO-citable ("Un presupuesto personal es...") antes del hook existente — basado en D-12
- FAQ frontmatter Q2: `"calculadora de ahorro de MetodoKakebo"` → **"calculadora de ahorro mensual de MetodoKakebo.com"**
- Línea 111: `"el método japonés"` (ambiguo) → **"el método Kakebo"** (canónico)
- Línea 207: anchor text `"calculadora de ahorro"` → **"calculadora de ahorro mensual"** + `de MetodoKakebo.com`
- FAQ body: mismo fix para anchor text de calculadora de ahorro
- ArticleCTA: `"MetodoKakebo: un diario de gastos digital construido sobre el método japonés"` → **"Kakebo AI, la app gratuita de MetodoKakebo.com, basada en el método Kakebo japonés"**

---

### SEO-GEO-BLOG-KAKEBO-ONLINE-IMAGE-01 — Imagen portada kakebo-online-gratis

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `public/images/blog/kakebo-online-gratis.png`  
**Build:** ✅ Compiled successfully

**Cambios:**
- Imagen añadida a `public/images/blog/kakebo-online-gratis.png` (~2 MB)
- El frontmatter ya declaraba `image: '/images/blog/kakebo-online-gratis.png'` — sin cambios en MDX
- Activa: OG image, Twitter card, JSON-LD BlogPosting image, y portada `<Image>` en el artículo

---

### SEO-GEO-PILLAR-KAKEBO-ONLINE-GRATIS-ES-01 — /blog/kakebo-online-gratis ES

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/kakebo-online-gratis.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios (6):**
- `title`: "La Mejor Aplicación" → **"Aplica el Método Japonés sin Conectar el Banco"** (elimina superlativo)
- `excerpt`: "La alternativa moderna" → "La alternativa digital" (más neutro)
- `updatedDate: '2026-07-01'` añadido
- Intro: definición factual nueva como primera frase + **MetodoKakebo.com** y **Kakebo AI** nombrados
- H2: "¿Es Kakebo AI **la mejor opción**...?" → "¿**Por qué elegir** Kakebo AI...?" + MetodoKakebo.com en cuerpo
- Cierre: "**receta definitiva**" → "**puede ayudarte**" + MetodoKakebo.com

---

### SEO-GEO-PILLAR-METODO-KAKEBO-GUIA-01 — Artículo pilar método Kakebo

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `src/content/blog/metodo-kakebo-guia-definitiva.es.mdx`  
**Build:** ✅ Compiled successfully

**Cambios aplicados (6):**

| Elemento | Cambio |
|---|---|
| `excerpt` | Elimina "hasta un 35% de tu sueldo" (promesa cuantitativa) → descripción factual |
| `updatedDate` | Añadido `2026-07-01` — activa dateModified real en JSON-LD y sitemap |
| FAQ Q1 answer | "necesidades, deseos, cultura y extras" → **"Supervivencia, Ocio/Vicio, Cultura y Extras"** (canónico) |
| Primer párrafo | "es mucho más que una simple técnica" → definición factual GEO-citeable con 家計簿 + MetodoKakebo.com |
| Categoría 3 | "**Cultura (Extra)**" → "**Cultura**" (paréntesis confuso eliminado) |
| Cierre | "garantiza" → "puede ayudarte" · añade "en MetodoKakebo.com" |

---

### SEO-GEO-TOOL-503020-COPY-01 — /herramientas/regla-50-30-20 copy canónico

**Estado:** ✅ Completado (2026-07-01)  
**Archivos:** `regla-50-30-20/page.tsx` + `messages/es.json`  
**Build:** ✅ Compiled successfully

**Cambios en `page.tsx`:**
- `SCHEMA.name`: "Calculadora Regla 50/30/20 Kakebo" → **"Calculadora 50/30/20"** (canónico D-11)
- `SCHEMA.description`: "caprichos" → "deseos" + añade "MetodoKakebo.com"
- `SCHEMA`: añade `publisher → #organization`
- CTA text: elimina promesa de automatización implícita → "Kakebo AI, la app gratuita de MetodoKakebo.com, puede ayudarte"
- CTA button: "Crear cuenta en Kakebo" → **"Crear cuenta en Kakebo AI"**

**Cambios en `messages/es.json` (Rule503020):**
- `cta.text`: "Kakebo clasifica" → "**Kakebo AI** clasifica" · "caprichos" → "deseos"
- `cta.button`: "Empezar gratis con Kakebo" → "Empezar gratis con **Kakebo AI**"
- `content.whatText2`: `<bold>Kakebo</bold>` → `<bold>Kakebo AI</bold>` con referencia a MetodoKakebo.com

---

### SEO-GEO-TOOL-INFLACION-COPY-01 — /herramientas/calculadora-inflacion schema + cta copy

**Estado:** ✅ Completado (2026-07-01)  
**Archivos:** `src/app/[locale]/(landing)/herramientas/calculadora-inflacion/page.tsx` + `messages/es.json`  
**Build:** ✅ Compiled successfully

**Cambios en `page.tsx` (schema + metadata):**
- `openGraph.siteName`: "Kakebo" → "MetodoKakebo.com"
- Schema `SoftwareApplication.name`: "Calculadora de Inflación Kakebo 2026" → **"Calculadora de Inflación e IPC"** (canónico D-10, sin año hardcodeado)
- Schema `SoftwareApplication.description`: añade "MetodoKakebo.com"
- Schema `SoftwareApplication.author.name`: "Kakebo" → "MetodoKakebo.com"
- Schema `SoftwareApplication`: añade `publisher → #organization` (consistencia con Home y calculadora-ahorro)

**Cambios en `messages/es.json`:**
- `Tools.Inflation.cta.text`: "Kakebo es tu herramienta para lograrlo" → "**Kakebo AI**, la herramienta gratuita de **MetodoKakebo.com**, puede ayudarte." (elimina "Kakebo" solo + promesa implícita "lograrlo")

---

### SEO-GEO-TOOL-AHORRO-COPY-01 — /herramientas/calculadora-ahorro copy alineado con glosario

**Estado:** ✅ Completado (2026-07-01)  
**URL:** `/herramientas/calculadora-ahorro`  
**Archivo:** `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx`  
**Build:** ✅ Compiled successfully

**Cambios en copy hardcodeado (3 bloques):**

| Bloque | Cambio |
|---|---|
| Sección "¿Cómo usar?" p.1 | "Nuestra calculadora" → "La calculadora de ahorro mensual de **MetodoKakebo.com**" |
| Sección "¿Cómo usar?" p.2 | "del Kakebo: Supervivencia, **Opcional**" → "del **método Kakebo**: Supervivencia, **Ocio/Vicio**" |
| Sección "¿Cómo usar?" p.3 | "ahorro sólido...sin sacrificar" → lenguaje de estimación, no promesa · elimina "sólido" |
| Sección "¿Qué te dice?" | `"Opcional" o "Vicio"` → **"Ocio/Vicio"** (canónico) · "ya está asegurado" → **"ya está planificado"** |
| CTA final | "registrará...vigilará tu ahorro por ti" → **"te ayudará a registrar...hacer seguimiento"** (elimina promesa de automatización) |

**Metadata y schema:** no modificados (ya correctos desde SEO-SCHEMA-AHORRO-SYNC-01)

---

### SEO-GEO-APP-ENTITY-COPY-01 — Dashboard /app — terminología canónica

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `messages/es.json`  
**Build:** ✅ Compiled successfully

**Hallazgo crítico:** `/app` tiene `robots: { index: false, follow: false }` en `app/layout.tsx`. Es una página autenticada noindex — sin impacto SEO directo. Los cambios aplican por coherencia con el glosario para los usuarios autenticados.

**Cambios aplicados en `Dashboard` namespace:**

| Clave | Cambio |
|---|---|
| `Dashboard.SEO.title` | Añade "el" → "con el método Kakebo" |
| `Dashboard.SEO.p1` | "Kakebo es tu herramienta definitiva" → **"Kakebo AI es la herramienta de MetodoKakebo.com"** · "Ocio" → **"Ocio/Vicio"** |
| `Dashboard.SEO.p2` | "El método japonés Kakebo" → **"El método Kakebo"** (término canónico) |
| `Dashboard.SEO.p3` | "alcanza la libertad financiera" → **"toma mejores decisiones sobre tu dinero"** (elimina promesa financiera) |
| `Dashboard.Onboarding.done.desc` | "tomar control absoluto" → **"la constancia es la clave del método Kakebo"** (elimina superlativo) |

**No modificado:** metadata (ya noindex), schema, routing, Home, artículos, herramientas, lógica app, auth, Supabase, APIs

---

### SEO-GEO-HOME-ENTITY-COPY-01 — Home optimizada como fuente de entidad SEO/GEO

**Estado:** ✅ Completado (2026-07-01)  
**Archivo:** `messages/es.json`  
**Build:** ✅ Compiled successfully

**6 bloques de copy ajustados en `messages/es.json`:**

| Clave | Cambio |
|---|---|
| `Landing.SEO.whatIs.title` | "Qué es Kakebo y para qué sirve" → "Qué es el método Kakebo y MetodoKakebo.com" |
| `Landing.SEO.whatIs.p1` | Añade definición factual del método Kakebo (1904) + MetodoKakebo.com como plataforma gratuita |
| `Landing.SEO.categories` (4 cards) | "Gastos fijos" eliminado · Categorías canónicas: Supervivencia / **Ocio/Vicio** / **Cultura** / **Extras** |
| `Landing.SEO.faqSchema.a2` | "Ocio, Cultura, Extra" → "**Ocio/Vicio**, Cultura y **Extras**" |
| `Landing.Content.article1.p` | Separa método histórico de MetodoKakebo.com como plataforma. Elimina "Kakebo adapta este método" (claim ambiguo) |
| `Landing.Content.article2.p` | "nuestra plataforma" → **Kakebo AI** + **MetodoKakebo.com**. "Extra" → **Extras** |
| `HowItWorks.steps.step3.desc` | "supervivencia, fijos, ocio, cultura" → categorías canónicas completas |

**Metadata y schema:** no modificados (ya correctos desde tareas anteriores)

**No añadido:** enlaces internos nuevos, claims exagerados, ratings, reviews, datos de empresa

---

### SEO-INTERNAL-LINKING-V1-01 — Auditoría y plan de enlazado interno

**Estado:** ✅ Completado (2026-07-01)  
**Tipo:** Solo documentación estratégica — sin cambios en código ni enlaces  
**Documento:** `docs/seo/SEO_INTERNAL_LINKING_V1_01.md`

**17 URLs analizadas · 8 clusters · 4 fases · 7 tareas derivadas**

**URLs que más necesitan autoridad entrante:**
1. `/blog/metodo-kakebo-guia-definitiva` — hub semántico con solo 2 fuentes confirmadas
2. `/herramientas/calculadora-ahorro` — CTR 34,88% pero solo 2 fuentes (ambas en FAQ)
3. `/herramientas/calculadora-inflacion` — 300 imp, 1 clic, 0 enlaces de blog
4. `/herramientas/regla-50-30-20` — 6 imp, 0 clics, 0 enlaces de blog

**Anchors recomendados principales:**
- "el método Kakebo" → `/blog/metodo-kakebo-guia-definitiva`
- "calculadora de ahorro mensual" → `/herramientas/calculadora-ahorro`
- "calculadora de inflación e IPC" → `/herramientas/calculadora-inflacion`
- "plantilla Kakebo Excel gratis" → `/blog/plantilla-kakebo-excel`

**Fases propuestas:**
- Fase 1: Enlazado mínimo de mayor impacto (plantilla-excel → herramientas, cluster → metodo-kakebo)
- Fase 2: Refuerzo kakebo-online/app y presupuesto personal (esperar GSC post-noindex)
- Fase 3: Enlazado hacia calculadora-inflacion (tras crear artículo editorial)
- Fase 4: Revisión y auditoría de impacto

**Tareas derivadas:** `SEO-EXCEL-INTERNAL-LINKS-01` · `SEO-CLUSTER-KAKEBO-CORE-LINKS-01` · `SEO-AHORRO-INBOUND-01` · `SEO-PRESUPUESTO-INBOUND-01` · `SEO-INFLACION-INBOUND-01` · `SEO-503020-INBOUND-01` · `SEO-INTERNAL-LINKING-AUDIT-01`

---

### SEO-SCHEMA-AHORRO-SYNC-01 — Schema calculadora-ahorro sincronizado con glosario

**Estado:** ✅ Completado (2026-07-01)  
**URL:** `/herramientas/calculadora-ahorro`  
**Archivo:** `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx`  
**Build:** ✅ Compiled successfully

**Schema antes:**
- `SCHEMA.name`: "Calculadora de Ahorro Kakebo" (incorrecto per glosario)
- `SCHEMA.description`: usaba "Ocio, Cultura y Ahorro" (nombres de categorías incorrectos); sin MetodoKakebo.com
- `FAQ_SCHEMA` Q2 answer: "Opcional o Vicio" y "Extra" (nombres incorrectos por glosario)
- Sin `publisher`

**Schema después:**
- `SCHEMA.name`: **"Calculadora de Ahorro Mensual"** (canónico per D-09 y glosario)
- `SCHEMA.description`: factual, menciona MetodoKakebo.com, alineada con D-09
- `SCHEMA.publisher`: `{ "@id": "https://www.metodokakebo.com/#organization" }` (consistente con SEO-SCHEMA-HOME-01)
- `FAQ_SCHEMA` Q2 answer: **"Ocio/Vicio"** y **"Extras"** (canónico per glosario)

**Nota sobre FAQ_SCHEMA:** Los textos de las FAQ se renderizan como contenido visible desde el objeto `FAQ_SCHEMA`. La corrección de "Opcional o Vicio" → "Ocio/Vicio" y "Extra" → "Extras" es un cambio de terminología mínimo justificado por el glosario canónico (hallazgo G-09 de SEO_GEO_DEEP_AUDIT_01.md). No se tocó estructura, lógica ni copy fuera de estos dos términos.

---

### SEO-TECHNICAL-DATEMODIFIED-01 — Soporte updatedDate y dateModified real

**Estado:** ✅ Completado (2026-07-01)  
**Build:** ✅ Compiled successfully

**Archivos modificados:**
- `src/lib/blog.ts` — añadido `updatedDate?: string` al tipo `BlogPost['frontmatter']`
- `src/app/[locale]/(public)/blog/[slug]/page.tsx` — `dateModified` usa `updatedDate ?? date`
- `src/app/sitemap.ts` — `lastModified` de blog posts usa `updatedDate ?? date`

**Comportamiento resultante:**
- `datePublished` → siempre `post.frontmatter.date` (sin cambios)
- `dateModified` → `post.frontmatter.updatedDate ?? post.frontmatter.date` (nuevo)
- `lastModified` sitemap → `new Date(post.frontmatter.updatedDate ?? post.frontmatter.date)` (nuevo)
- Artículos sin `updatedDate`: comportamiento idéntico al anterior (fallback a `date`)

**Uso futuro:** Para señalizar una actualización real de un artículo, añadir al frontmatter:
```
updatedDate: 'YYYY-MM-DD'
```
No inventar fechas. Solo usar cuando el contenido realmente se haya actualizado.

**No se añadió `updatedDate` a ningún artículo.** La infraestructura queda lista.

---

### SEO-SCHEMA-HOME-01 — Schema Organization + WebSite + SoftwareApplication en Home

**Estado:** ✅ Completado (2026-06-30)  
**URL afectada:** `/` (Home)  
**Archivo:** `src/app/[locale]/(public)/page.tsx`  
**Build:** ✅ Compiled successfully

**Implementación:**
- El `SoftwareApplication` existente tenía `aggregateRating` con datos inventados (4.8/24) — **eliminado**
- El `SoftwareApplication` existente y el nuevo `Organization` + `WebSite` se unificaron en un único bloque `@graph`
- Se usó `@id` para referencias cruzadas entre entidades

**Schemas en `@graph`:**
- `Organization` (`#organization`): name "MetodoKakebo.com", url, logo (`/logo.png`), sameAs `https://x.com/kakebo_ai`, description factual
- `WebSite` (`#website`): name "MetodoKakebo.com", url, inLanguage "es", publisher → `#organization`, description factual
- `SoftwareApplication` (`#app`): name "Kakebo AI", applicationCategory, operatingSystem, offers (price 0 EUR), description factual, publisher → `#organization`, featureList

**FAQPage (existente):** mantenido sin cambios en script separado

**No añadido:** SearchAction (no hay búsqueda interna real), aggregateRating, sameAs sin documentar, dirección, teléfono, datos legales

---

### SEO-GEO-ENTITY-DEFINITION-01 — Definiciones factuales citables

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo documentación estratégica semántica/GEO — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_GEO_ENTITY_DEFINITIONS_01.md`

**14 entidades definidas** (corta ≤25 palabras + ampliada ≤80 palabras + uso + schema + FAQ + primer párrafo + ejemplos):  
Método Kakebo · Kakebo · MetodoKakebo.com · Kakebo AI · App Kakebo · Kakebo online · Plantilla Kakebo Excel · Herramientas gratuitas · Calculadora de ahorro mensual · Calculadora de inflación e IPC · Calculadora 50/30/20 · Presupuesto personal · Gastos mensuales · Finanzas personales

**Bloques reutilizables creados:**
- 6 bloques por tipo de página (Home, artículo método, plantilla-excel, kakebo-online, herramienta, sobre-nosotros)
- 3 bloques schema (Organization, WebSite, SoftwareApplication Kakebo AI)
- 4 bloques FAQ (método, MetodoKakebo.com, Kakebo AI, diferencia app/plantilla)
- 3 bloques de primer párrafo listos para insertar (metodo-kakebo-guia-definitiva, sobre-nosotros, Home)

**11 frases prohibidas documentadas** (claims exagerados, superlativos, promesas financieras, confusión método/producto)

**Próximas tareas que deben usar este documento:**  
`SEO-GEO-ENTITY-DEFINITION-01` (implementación) · `SEO-SCHEMA-HOME-01` · `SEO-SCHEMA-AHORRO-SYNC-01` · `SEO-EXCEL-TITLE-01` · `SEO-BLOG-INFLACION-01` · `SEO-BLOG-503020-01` · `SEO-INTERNAL-LINKING-V1-01`

---

### SEO-GEO-TERMINOLOGY-01 — Glosario canónico SEO/GEO

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo documentación estratégica — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_GEO_TERMINOLOGY_01.md`

**14 términos definidos:** Método Kakebo · Kakebo · MetodoKakebo.com · Kakebo AI · App Kakebo · Kakebo online · Plantilla Kakebo Excel · Herramientas gratuitas · Calculadora de ahorro mensual · Calculadora de inflación e IPC · Calculadora 50/30/20 · Regla 50/30/20 · Presupuesto personal · Gastos mensuales

**Ambigüedades principales detectadas:**
- "Kakebo" solo es ambiguo entre método histórico y producto digital
- "Kakebo Online" no es un nombre propio — es un descriptor
- "Opcional o Vicio" y "Extra" son nombres incorrectos de categorías (canon: "Ocio/Vicio" y "Extras")
- MetodoKakebo.com apenas aparece como entidad en el contenido actual

**Reglas canónicas más importantes:**
- Método Kakebo = sistema japonés 1904 (Motoko Hani) — NO el producto digital
- Kakebo AI = nombre oficial del producto de MetodoKakebo.com
- MetodoKakebo.com = la plataforma/organización como entidad
- Categorías: Supervivencia / Ocio/Vicio / Cultura / Extras (solo estas formas)
- En schema `Organization.name`: "MetodoKakebo.com" o "Kakebo AI", nunca solo "Kakebo"

**Frases definicionales citables incluidas** (6 frases — para usar en `SEO-GEO-ENTITY-DEFINITION-01`)

**Próximas tareas que deben usar este documento:** `SEO-GEO-ENTITY-DEFINITION-01`, `SEO-SCHEMA-HOME-01`, `SEO-SCHEMA-AHORRO-SYNC-01`, `SEO-EXCEL-TITLE-01`, `SEO-INTERNAL-LINKING-V1-01`, `SEO-BLOG-INFLACION-01`, `SEO-BLOG-503020-01`

---

### SEO-KAKEBO-ONLINE-CANIB-FIX-01 — Implementar noindex en artículo EN

**Estado:** ✅ Completado (2026-06-30)  
**URL afectada:** `/en/blog/kakebo-online-gratis` → ahora con `noindex`  
**Build:** ✅ Compiled successfully

**Implementación:**
- No existía patrón de `noindex` en el sistema — se creó mecanismo mínimo y reutilizable
- `src/lib/blog.ts` — añadido `noindex?: boolean` al tipo `BlogPost['frontmatter']`
- `src/app/[locale]/(public)/blog/[slug]/page.tsx` — `generateMetadata` aplica `robots: { index: false, follow: false }` cuando `frontmatter.noindex === true`
- `src/app/sitemap.ts` — filtra posts con `noindex: true` para excluirlos del sitemap
- `src/content/blog/kakebo-online-gratis.en.mdx` — añadido `noindex: true` en frontmatter

**Verificaciones:**
- `/en/blog/kakebo-online-gratis`: noindex aplicado ✅
- `/blog/kakebo-online-gratis` (ES): sin noindex, sigue indexable ✅
- Canonical y hreflang: no modificados ✅
- Versión española del artículo: no tocada ✅
- robots.txt: no tocado ✅
- Otros artículos EN: no tocados ✅
- Home `/`: no tocada ✅

**Validación en GSC:** Revisar en 2-4 semanas que la URL EN muestre noindex en "Inspect URL". En 6-8 semanas, confirmar que la ES canonical gana impresiones.

---

### SEO-KAKEBO-ONLINE-CANIB-01 — Auditoría canibalización EN/ES kakebo-online-gratis

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo auditoría y documentación — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_KAKEBO_ONLINE_CANIB_01.md`

**Veredicto:** Interferencia EN→ES **CONFIRMADA** por datos reales de GSC

**Causa raíz:** Cross-language URL contamination — el slug `kakebo-online-gratis` contiene la palabra española "gratis" en la URL inglesa `/en/blog/kakebo-online-gratis`. Google asocia esta URL EN con búsquedas españolas y la muestra por encima del ES canonical.

**Datos clave:**
- `/en/blog/kakebo-online-gratis`: 15 clics · 208 imp · pos 6,86
- `/blog/kakebo-online-gratis` (ES canonical): 1 clic · 6 imp · pos 6,0
- Ratio ES:EN = 1:34 en impresiones (anomalía para audiencia 62,6% española)
- Todos los clics EN son de usuarios españoles (queries en español, `kakebo online gratis`)

**Solución recomendada:**  
`noindex` en `kakebo-online-gratis.en.mdx` → eliminar del índice de Google → toda la autoridad migra al ES canonical. Complementar con refuerzo de señales internas hacia `/blog/kakebo-online-gratis`.

**Tarea fix propuesta:** `SEO-KAKEBO-ONLINE-CANIB-FIX-01` ⬅ siguiente P0

---

### SEO-DATA-PRIORITY-01 — Snapshot GSC y priorización SEO por datos reales

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo análisis y documentación — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_DATA_PRIORITY_01.md`  
**Export:** GSC Last 3 months — 2026-03-29 → 2026-06-28

**Métricas del periodo:**
- 222 clics · 3.079 impresiones · CTR 7,21% · 92 días
- Últimos 28 días: 120 clics / 1.355 imp / CTR 8,85%
- Últimos 7 días: 32 clics / 329 imp / CTR 9,73%
- Últimos 3 días: 15 clics / 128 imp / CTR 11,72% / pos 6,35

**Hallazgos clave:**
- `plantilla-kakebo-excel` acumula 125 clics combinados (ES + canónica) — 56% del total
- Home: 51 clics, 892 impresiones, CTR 5,72%
- `calculadora-ahorro` CTR 34,88% confirmado (15 clics, 43 imp, pos 10,7)
- **CONFIRMADO:** `/en/blog/kakebo-online-gratis` captura 15 clics mientras `/es/` tiene 0
- **CONFIRMADO:** `app kakebo` (pos 5,87) y `metodo kakebo app` (pos 8,49) tienen 0 clics
- `calculadora-inflacion`: 300 impresiones, 1 clic, CTR 0,33% — mayor desperdicio del sitio
- España = 62,6% de clics; LatAm = 27%; EEUU = 427 imp (0,47% CTR)
- Desktop = 61% de clics (audiencia en modo investigación)
- Sin rich results confirmados en Search Appearance

**Cambio de prioridad en roadmap:**
- `SEO-KAKEBO-ONLINE-CANIB-01` sube de P2 a **P0** — canibalización confirmada por datos
- `SEO-EXCEL-TITLE-01` se mantiene P0 confirmado
- `SEO-HREFLANG-KAKEBO-ONLINE-01` sube urgencia a P1

**Próximas 5 tareas en orden:**
1. `SEO-KAKEBO-ONLINE-CANIB-01` — resolver canibalización EN/ES confirmada
2. `SEO-EXCEL-TITLE-01` — meta title <65 chars en URL principal
3. `SEO-GEO-TERMINOLOGY-01` — glosario + correcciones siteName
4. `SEO-SCHEMA-HOME-01` — schema Organization + WebSite en Home
5. `SEO-CALCULADORA-AHORRO-AUDIT-01` — entender patrón CTR 34,88%

---

### SEO-ROADMAP-V1-01 — Roadmap SEO/GEO priorizado

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo documentación estratégica — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_ROADMAP_V1.md`

**26 tareas priorizadas** en 7 bloques (P0→P6)  
**5 tareas ejecutables inmediatamente** (sin necesidad de datos GSC)  
**12 tareas bloqueadas** hasta tener `SEO-DATA-PRIORITY-01` completado

**Próximas 5 tareas en orden estricto:**
1. `SEO-DATA-PRIORITY-01` — Snapshot GSC completo (prerequisito crítico)
2. `SEO-GEO-TERMINOLOGY-01` — Glosario canónico + siteName + categorías (paralelo)
3. `SEO-GEO-ENTITY-DEFINITION-01` — Definición factual método + producto
4. `SEO-SCHEMA-HOME-01` — Schema Organization + WebSite en Home
5. `SEO-TECHNICAL-DATEMODIFIED-01` — updatedDate + dateModified real

**Tareas P0 (inmediatas):** `SEO-DATA-PRIORITY-01`, `SEO-GA4-EVENTS-01`  
**Tareas P1 (paralelo):** `SEO-GEO-TERMINOLOGY-01`, `SEO-GEO-ENTITY-DEFINITION-01`, `SEO-SCHEMA-HOME-01`, `SEO-TECHNICAL-DATEMODIFIED-01`

**URLs protegidas:** `/blog/plantilla-kakebo-excel` (solo cambios quirúrgicos), `/herramientas/calculadora-ahorro` (no tocar hasta entender CTR 35,9%), `/blog/como-hacer-un-presupuesto-personal` (dejar madurar)

**Ventana de revisión del roadmap:** 12 semanas → crear `SEO_ROADMAP_V2.md` basado en datos reales

---

### SEO-GEO-DEEP-AUDIT-01 — Auditoría profunda SEO técnico, semántico y GEO

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo documentación — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_GEO_DEEP_AUDIT_01.md`

**32 hallazgos** (12 técnicos · 9 semánticos · 11 GEO)  
**2 riesgos críticos · 7 medios · 8 bajos**

**Hallazgos clave:**
- Problemas P0 del mapa anterior ya RESUELTOS en código (canonical, robots, canonicals herramientas)
- `dateModified` JSON-LD congelado en todos los posts (T-03/T-04)
- Home sin schema `Organization` + `WebSite` (T-07)
- Schema `calculadora-ahorro` desalineado del contenido optimizado (T-05)
- Ambigüedad terminológica crítica: "Kakebo AI" vs "método Kakebo" vs "app" (S-06 + G-02)
- Sin definición factual citable del método o producto en ninguna página (G-01 + G-05)
- 3 herramientas sin artículo editorial de respaldo (S-04)
- Canibalización kakebo-online sin resolver (S-01 + S-02)

**Tareas futuras priorizadas (18 en total):**  
`SEO-EXCEL-TITLE-01` · `SEO-TECHNICAL-DATEMODIFIED-01` · `SEO-TECHNICAL-SITEMAP-01` · `SEO-SCHEMA-HOME-01` · `SEO-GEO-ENTITY-DEFINITION-01` · `SEO-GEO-TERMINOLOGY-01` · `SEO-KAKEBO-ONLINE-CANIB-01` · `SEO-BLOG-INFLACION-01` · `SEO-BLOG-503020-01` · `SEO-INTERNAL-LINKING-V1-01` · `SEO-GA4-EVENTS-01` + más

**Prerequisito bloqueante:** `SEO-DATA-PRIORITY-01` (snapshot GSC actualizado)

---

### SEO-MAP-V1-AUDIT-01 — Mapa maestro SEO V1

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo documentación — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_MAP_V1.md` (sustituye a `SEO_MAP_V1.md` de raíz, 2026-06-17)

**Inventario:**
- 27 URLs ES indexables auditadas
- ~16 URLs EN legacy catalogadas
- ~13 rutas de app (no indexables) listadas
- 1 recurso descargable catalogado
- ~82 URLs totales inventariadas

**Clusters identificados:** 10 (Kakebo Excel, Kakebo Online/App, Herramientas de Ahorro, Presupuesto Personal, Inflación/IPC, Regla 50/30/20, Alternativas/Fintonic, Finanzas Generales, Legal/Institucional, Legacy EN)

**URLs con tracción real documentada:** 4 (`/blog/plantilla-kakebo-excel`, `/herramientas/calculadora-ahorro`, `/herramientas/calculadora-inflacion`, `/blog/alternativas-a-app-bancarias`)

**Riesgos activos:** 7 (title truncado en URL pilar, H3 antes de H2, robots.txt sin `/app/`, canonical herramientas pendiente verificar, canibalización kakebo-online, interferencia EN legacy)

**Gaps críticos:** Sin artículo editorial de respaldo para calculadora-inflacion, regla-50-30-20 y calculadora-ahorro

**Próximas tareas prioritarias:** `SEO-EXCEL-TITLE-01`, `SEO-ROBOTS-01`, `SEO-DATA-PRIORITY-01`

---

### SEO-PILLAR-EXCEL-AUDIT-01 — Auditoría página pilar plantilla-kakebo-excel

**Estado:** ✅ Completado (2026-06-30)  
**Tipo:** Solo documentación — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_PILLAR_EXCEL_AUDIT_01.md`  
**URL auditada:** `/blog/plantilla-kakebo-excel`

**Hallazgos clave:**
- 12 fortalezas SEO identificadas (JSON-LD SoftwareApplication único, keyword exacta en H1, recurso descargable real, FAQPage con 5 preguntas, hreflang/canonical correctos)
- 10 riesgos SEO identificados (meta title truncado ~93 chars, H3 antes de primer H2, dateModified congelado, enlazado interno insuficiente hacia herramientas)
- 8 oportunidades de enlazado interno identificadas (hacia /herramientas/regla-50-30-20, /herramientas/calculadora-inflacion, desde /blog/como-hacer-un-presupuesto-personal, y más)
- 8 tareas futuras propuestas (SEO-EXCEL-TITLE-01, SEO-EXCEL-H3-FIX-01, SEO-EXCEL-DATE-01, SEO-EXCEL-INTERNAL-LINKS-01, SEO-EXCEL-INBOUND-PILAR-01, y más)

**Restricción activa:** No tocar slug, H1, estructura narrativa, hreflang/canonical, imágenes ni contenido EN legacy.

---

### SEO-DATA-PRIORITY-01 — Priorizar oportunidades según Search Console

**Estado:** Pendiente de inicio  
**Prerequisito:** Datos de Search Console actualizados para el dominio metodokakebo.com  
**Descripción:** Analizar rendimiento actual por query, identificar páginas con impresiones altas y CTR bajo, detectar keywords en posiciones 5-20 candidatas a optimización, y establecer prioridades de SEO Sprint 3 basadas en datos reales, no en estimaciones.

**No iniciar** ningún nuevo artículo SEO ni tarea técnica SEO sin haber ejecutado primero SEO-DATA-PRIORITY-01.

---

## UI-CARDS-BRAND-ALIGN-01 — Alineación sistema de tarjetas con brand manual

**Fecha:** 2026-06-26

**Inventario completo auditado:** Features, ToolsSection, SavingsSimulator, Testimonials, FAQ, HowItWorks, AlternativesSection, Blog index, RelatedPosts, MDXComponents, SavingsCalculator, Calculator503020, CalculatorInflation.

**Inconsistencias corregidas (2 archivos):**

| Archivo | Inconsistencia | Corrección |
|---|---|---|
| `SavingsCalculator.tsx` | Tip box `bg-orange-50/border-orange-100` (fuera de paleta) | `bg-muted/50 border-border` (tokens brand) |
| `SavingsCalculator.tsx` | Emoji `💡` en tip box (brand manual: sin emojis) | Eliminado |
| `SavingsCalculator.tsx` | Result card `shadow-xl` (excesiva) | `shadow-sm` (sutil) |
| `SavingsCalculator.tsx` | Progress bar `bg-blue-500` (fuera paleta) | `bg-primary` (terracota brand) |
| `SavingsCalculator.tsx` | Progress bar `bg-purple-500` (fuera paleta) | `bg-accent` (índigo brand) |
| `SavingsCalculator.tsx` | Progress bar `bg-yellow-500` (fuera paleta) | `bg-amber-400` (ámbar, chart-5 del sistema) |
| `HowItWorks.tsx` | Timeline icon `shadow-lg` (único shadow agresivo del sistema) | `shadow-sm` |

**Validado como coherente (no tocado):**
- Sistema de radios en 3 niveles: editorial (sin radius/rounded-sm), componentes (rounded-xl), containers (rounded-2xl) — es intencional
- CalculatorInflation: colores red/stone en stat cards contextuales (pérdida = rojo, real = neutro) — semánticamente correctos
- Calculator503020: colores amber/emerald en legend items — contextualmente apropiados y en paleta cálida
- ToolsSection inflation card usando `destructive` — tarea separada pendiente (`UI-TOOLS-INFLATION-COLOR-01`)
- RelatedPosts `hover:-translate-y-0.5` — sutil, no agresivo
- Blog index `hover:shadow-lg` en featured — diferenciación intencional

**Tipografías globales:** no tocadas.  
**Textos/SEO:** no tocados.  
**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `4781ad0`

---

## UI-TYPOGRAPHY-BRAND-ALIGN-01 — Alineación tipográfica con brand manual

**Fecha:** 2026-06-26  
**Tipo:** Correcciones tipográficas mínimas y globales

**Diagnóstico previo a la tarea:**
- Hero, Features, FAQ, SavingsSimulator, AlternativesSection, ToolsSection, Footer, Navbar: `font-serif` correctamente aplicado en todos los H1/H2/H3 ✅
- Blog articles: `prose-headings:font-serif` en el layout del artículo ✅
- Calculadoras: `font-serif` en H1 y secciones editoriales ✅
- Único problema encontrado: HowItWorks step card H3 sin `font-serif` + tailwind typography prose sin `fontFamily` global

**Cambios aplicados:**

1. `tailwind.config.ts` — Añadido `fontFamily: 'var(--font-playfair), serif'` a los selectores `h2` y `h3` de la configuración `typography`. Garantiza que cualquier bloque `.prose` use Playfair en H2/H3 globalmente, sin depender del modificador `prose-headings:font-serif` en cada uso.

2. `src/components/landing/HowItWorks.tsx` — Añadido `font-serif` al H3 del step card (`Step` component). Los títulos de pasos son "H3 destacados" según el brand manual.

**Zonas validadas:** Home, Blog index, artículos, herramientas, CTAs, navbar, footer, MDXComponents — tipografía coherente en todas.

**Tarjetas/radios/bordes/sombras:** no tocados.  
**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `a62b440`

---

## UI-CTA-EMOJI-REMOVE-01 — Eliminación de emojis en CTAs editoriales

**Fecha:** 2026-06-26  
**Emojis eliminados:** 14 total (12 × `👉🏽` en SimpleCTA, 1 × `📥` en DownloadCTA, 1 × `🔒` en Hero trust signal)

**Artículos modificados (12):**
- `ahorro-pareja.es.mdx`
- `alternativas-a-app-bancarias.es.mdx`
- `como-ahorrar-dinero-cada-mes.es.mdx`
- `eliminar-gastos-hormiga.es.mdx`
- `kakebo-online-gratis.es.mdx`
- `kakebo-sueldo-minimo.es.mdx`
- `kakebo-vs-ynab.es.mdx`
- `libro-kakebo-pdf.es.mdx`
- `metodo-kakebo-para-autonomos.es.mdx`
- `peligros-apps-ahorro-automatico.es.mdx`
- `plantilla-kakebo-excel.es.mdx` (SimpleCTA + DownloadCTA)
- `regla-30-dias.es.mdx`

**`messages/es.json`:** `Hero.trustSignal` — eliminado `🔒`

**Ajustes de copy (donde el texto dependía del gesto del emoji):**
- `peligros-apps-ahorro-automatico`: "Destruye…refugio" → "Cierra tus conexiones Open Banking y únete a Kakebo AI"
- `regla-30-dias`: copy de 100 chars + "dieta extrema" → "Empieza gratis con Kakebo AI y toma el control de tus gastos"
- 3 copies simplificados eliminando openers que funcionaban como hook del emoji ("Olvídate de…", "Olvida…", "Suelta…")

**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `45bab2c`

---

## UI-COLOR-PRIMARY-ALIGN-01 — Alineación color primario con brand manual

**Fecha:** 2026-06-26  
**Cambio:** `#cf5c5c` / `#f87171` → `#cf8c6c` (terracota cálida brand manual)

**Tokens actualizados en `src/app/globals.css`:**

| Token | Antes (light) | Después | Antes (dark) | Después |
|---|---|---|---|---|
| `--primary` | `#cf5c5c` | `#cf8c6c` | `#f87171` | `#cf8c6c` |
| `--primary-foreground` | `#fafaf9` | `#1c1917` | `#1c1917` | sin cambio |
| `--ring` | `#cf5c5c` | `#cf8c6c` | `#f87171` | `#cf8c6c` |
| `--chart-1` | `#cf5c5c` | `#cf8c6c` | `#f87171` | `#cf8c6c` |
| `--sidebar-primary` | `#cf5c5c` | `#cf8c6c` | `#f87171` | `#cf8c6c` |
| `--sidebar-primary-foreground` | `#fafaf9` | `#1c1917` | `#1c1917` | sin cambio |
| `--sidebar-ring` | `#cf5c5c` | `#cf8c6c` | `#f87171` | `#cf8c6c` |

**Hardcodes actualizados:**
- `src/components/reports/ReportPDF.tsx` (×2) — componente interno
- `src/app/api/og/route.tsx` (×1) — gradiente decorativo OG
- `src/components/AIMetricsChart.tsx` (×1) — array de colores de chart interno

**Nota de contraste:** `primary-foreground` actualizado de `#fafaf9` (blanco, 2.6:1 con nuevo primary) a `#1c1917` (piedra oscura, 6.6:1 con nuevo primary) para cumplir WCAG AA. El dark mode ya usaba `#1c1917` — se unifica el sistema.

**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `1d3800d`

---

## UI-BRAND-AUDIT-01 — Auditoría de identidad visual

**Fecha:** 2026-06-26  
**Tipo:** Solo documentación — sin cambios en código  
**Documento:** `docs/brand/UI_BRAND_AUDIT_01.md`

**Resumen:** 12 hallazgos detectados. 2 de alta prioridad (sistémicos), 4 de media, 6 de baja.

| Prioridad | Hallazgo | Tarea futura |
|---|---|---|
| Alta | Color primario #cf5c5c ≠ #CF8C6C del brand manual | UI-COLOR-PRIMARY-ALIGN-01 |
| Alta | Emoji `👉🏽` en 12 CTAs de artículos | UI-CTA-EMOJI-REMOVE-01 |
| Media | Border-radius de CTAs inconsistente | UI-CTA-RADIUS-UNIFY-01 |
| Media | Calculadora de Ahorro ausente de ToolsSection | UI-TOOLS-SECTION-COMPLETE-01 |
| Media | Color `destructive` en inflation card | UI-TOOLS-INFLATION-COLOR-01 |
| Media | "PASO" hardcodeado sin i18n en HowItWorks | UI-HOWITWORKS-I18N-01 |
| Baja | Emoji 🔒 en trust signal Hero | (incluir en emoji task) |
| Baja | Copyright "Kakebo Ahorro" legacy en Footer | UI-FOOTER-COPYRIGHT-01 |
| Baja | Border-radius de cards inconsistente | UI-CARDS-RADIUS-SYSTEM-01 |
| Baja | Dark mode primary demasiado vibrante | (incluir en color task) |
| Baja | SeoContent jerarquía H3/H4 desconectada | UI-SEOCONTENT-HIERARCHY-01 |
| Baja | "Artículo destacado" hardcodeado (no i18n) | (tarea i18n limpieza) |

**Commit:** `5616816`

---

## TOOL-CALCULADORA-AHORRO-V2-IMPL-01 — Calculadora de ahorro V2

**Fecha:** 2026-07-08  
**Estado:** ✅ Completado  
**Commit:** `e986a1d`  
**URL afectada:** `/herramientas/calculadora-ahorro`

**Problema resuelto:**  
La V1 capturaba el campo `fixedExpenses` en estado y UI pero nunca lo usaba en los cálculos. Las barras de progreso estaban hardcodeadas a `w-[50%]`, `w-[20%]`, `w-[10%]` con valores estáticos. La herramienta era funcionalmente un duplicado de la calculadora 50/30/20. El `page.tsx` añadía un `<h1>` duplicado y doble padding (`pt-32 pb-12` + `pt-24 pb-16` en el componente).

**Cambios en V2:**

| Archivo | Cambio |
|---|---|
| `SavingsCalculator.tsx` | Reescritura completa — nueva entrada de gastos variables, cálculo de margen real, barras dinámicas, alertas de estado, sección de objetivo opcional |
| `page.tsx` | Eliminado H1 duplicado, eliminado doble padding, eliminada sección editorial (movida al componente). Reducido a wrapper + schemas JSON-LD |
| `messages/es.json` → `Tools.Savings.*` | Añadidas claves para gastos variables, objetivo de ahorro, estados de resultado, sección goal, disclaimer |
| `src/lib/analytics.ts` | Añadidos `savings_calculator_calculate` y `savings_calculator_goal_result` al tipo `EventName` |

**Lógica de cálculo V2:**
- `margenReal = ingresos − gastosFijos − gastosVariables`
- `tasaAhorro = (margenReal / ingresos) × 100`
- `mesesParaObjetivo = ceil(objetivo / margenReal)` cuando margen > 0
- `ahorroNecesario = ceil(objetivo / plazo)` cuando plazo > 0
- Estado: `deficit` | `zero` | `tight` (<10%) | `below_target` (<20%) | `good` (≥20%)
- Barra apilada con `style={{ width: X% }}` — completamente dinámica

**Analytics GA4 (sin datos personales exactos):**
- `savings_calculator_calculate`: ranges de income, margen, tasa + has_goal, has_deadline, result_status
- `savings_calculator_goal_result`: months_to_goal (rangos), savings_rate_range, result_status

**Restricciones respetadas:**  
Sin tocar otras herramientas · Sin tocar artículos del blog · Sin tocar SEO técnico global · Sin modificar canonical/hreflang/sitemap · Sin datos personales exactos en GA4

**Build:** ✅ Compiled successfully — 0 errores TypeScript, 0 errores de compilación

---

## TOOL-CALCULADORA-AHORRO-SEO-GEO-AUDIT-01 — Auditoría SEO/GEO calculadora de ahorro

**Fecha:** 2026-07-08  
**Estado:** ✅ Completado  
**Commit:** `c123eb0`  
**URL auditada:** `/herramientas/calculadora-ahorro`  
**Archivo creado:** `docs/seo/TOOL_CALCULADORA_AHORRO_SEO_GEO_AUDIT_01.md`

**Hallazgos principales (P0):**
- Imagen Open Graph ausente — ningún `og:image` definido
- FAQPage con solo 3 preguntas — insuficiente cobertura semántica
- Sin bloque introductorio visible antes del calculador — definición, fórmula, diferenciación vs 50/30/20

**Hallazgos P1:**
- Título `"Calculadora de Ahorro Mensual: ¿Cuánto Ahorrar al Mes?"` largo y débil en keyword principal
- Meta description sin diferenciadores V2 (gastos reales, objetivo de ahorro)
- Sin HowTo schema ni sección visible de uso
- Sin sección de interpretación de resultados
- 4 enlaces internos clave ausentes: calculadora-inflacion, como-ahorrar-dinero-cada-mes, cuentas-remuneradas, eliminar-gastos-hormiga
- SoftwareApplication sin `author`, sin `dateModified`, sin `featureList`

**Restricciones respetadas:**  
Sin modificar código · Solo documentación · Sin tocar SEO técnico global · Sin tocar otras herramientas ni artículos

---

## TOOL-CALCULADORA-AHORRO-SEO-GEO-IMPL-01 — Implementación SEO/GEO calculadora de ahorro

**Fecha:** 2026-07-08  
**Estado:** ✅ Completado  
**Commit:** `ea3f17b`  
**URL afectada:** `/herramientas/calculadora-ahorro`

**Cambios implementados:**

| Archivo | Cambio |
|---|---|
| `page.tsx` | Título `"Calculadora de Ahorro Mensual Gratis"`, OG dinámica `/api/og?title=...`, SCHEMA con `author`+`dateModified`+`featureList`, HOW_TO_SCHEMA (4 pasos), FAQPage ×6, sección HowTo + FAQ server-rendered, ajuste `pb-0` en wrapper |
| `SavingsCalculator.tsx` | Bloque introductorio (definición + fórmula + ejemplo GEO + vs 50/30/20), tabla de interpretación de 5 estados, 4 enlaces internos nuevos |
| `messages/es.json` | Meta title/description/ogTitle/ogDescription actualizados, bloque `intro.*` (4 claves), `content.link3-6` (4 claves) |

**Schemas añadidos:**
- `SoftwareApplication`: `author`, `dateModified: 2026-07-08`, `featureList` ×5
- `HowTo` con 4 `HowToStep` — renderizado también como HTML visible
- `FAQPage` expandida a 6 preguntas — renderizada también como HTML server-side

**GEO refuerzo:**
- Ejemplo numérico concreto en intro: `2.000 € ingresos − 800 € fijos − 500 € variables = 700 € (35%)`
- Mención explícita `método Kakebo` y objetivo 20% en intro block
- Publisher MetodoKakebo.com en schema `author`

**Enlazado interno añadido:**
- `/herramientas/calculadora-inflacion` (herramienta hermana)
- `/blog/como-ahorrar-dinero-cada-mes` (cluster ahorro)
- `/blog/cuentas-remuneradas` (cluster ahorro)
- `/blog/eliminar-gastos-hormiga` (cluster ahorro)

**Restricciones respetadas:**  
Sin tocar SEO técnico global · Sin tocar otras herramientas · Sin tocar artículos del blog · Sin rediseño global · Sin nuevas funcionalidades de cálculo · Sin datos personales exactos en GA4 · Cambio atómico en tarea única

**Build:** ✅ Compiled successfully — 0 errores TypeScript, 0 errores de compilación

---

## CONTENT-01 — Artículo "Cuentas remuneradas"

**Fecha:** 2026-07-08  
**Estado:** ✅ Completado  
**Sprint:** Sprint Contenido V1  
**Tipo:** Guía evergreen informativa — España-first, bank-agnostic

**URL creada:** `/blog/cuentas-remuneradas`  
**Archivo MDX:** `src/content/blog/cuentas-remuneradas.es.mdx`  
**Imagen integrada:** `docs/seo/articulos/cuenta_remunerada.png` → `public/images/blog/cuentas-remuneradas.png`

**Objetivo editorial:**  
Explicar qué es una cuenta remunerada, cómo funciona, qué factores revisar antes de contratar una y cuándo encaja dentro de un sistema de ahorro personal tipo Kakebo. No es una comparativa comercial de bancos ni una recomendación de contratación.

**Keyword principal:** `cuentas remuneradas`  
**Keywords secundarias:** `qué es una cuenta remunerada`, `cuenta remunerada ahorro`, `TAE cuenta remunerada`, `fondo de emergencia cuenta remunerada`, `cuentas remuneradas España`, `cuenta remunerada o depósito`

**Hipótesis SEO/GEO:**  
Captar intención informativa sobre cuentas remuneradas y conectar naturalmente el clúster de ahorro mensual, fondo de emergencia, inflación y presupuesto personal ya existente en el sitio.

**Estructura editorial:**  
Respuesta rápida + definición + cómo funciona + tabla comparativa (4 productos) + qué mirar antes de contratar + cuándo tiene/no tiene sentido + ejemplo práctico (1.000 €, 3.000 €, 10.000 €) + fondo de emergencia + errores frecuentes + checklist (tabla) + FAQ (6 preguntas) + conclusión + fuentes oficiales

**Fuentes oficiales integradas:**
- Banco de España (cuentas a la vista, TAE, depósitos a plazo)
- FGD — Fondo de Garantía de Depósitos (cobertura hasta 100.000 € por titular y entidad)
- BOE — Ley 35/2006 del IRPF, artículo 25 (intereses como rendimientos del capital mobiliario)
- BCE (contexto de tipos oficiales, sin previsiones)

**Enlazado interno activo:**
- `/blog/como-hacer-un-presupuesto-personal`
- `/herramientas/calculadora-ahorro`
- `/herramientas/calculadora-inflacion`

**Restricciones respetadas:**  
Sin comparativa comercial · Sin recomendación de entidades · Sin afiliación · Sin promesas de rentabilidad · Sin tabla de "mejores cuentas" · No se ha tocado `/blog/plantilla-kakebo-excel` · No se han modificado componentes globales

**Schema generado automáticamente por el sistema:** `BlogPosting` + `FAQPage` (6 preguntas en frontmatter)

**Ventana de medición SEO:** 8–12 semanas desde publicación

**Build:** ✅ Compiled successfully — 0 errores TypeScript, 0 errores de compilación

---

## SEO-503020-CALCULADORA-01 — Optimización herramienta regla 50/30/20

**Fecha de ejecución:** 2026-06-26  
**URL objetivo:** `/herramientas/regla-50-30-20`  
**Keywords objetivo:** calculadora 50 30 20 (primaria), 50 30 20 calculadora, calculadora presupuesto, calculadora gastos mensuales, necesidades deseos y ahorro

**Cambios realizados:**

| Campo | Antes | Después |
|---|---|---|
| `Rule503020.meta.title` | `"Calculadora 50/30/20: Tu Sueldo Ideal en 1 Clic (Plantilla Gratis)"` (67 chars) | `"Calculadora 50/30/20 Gratis | Necesidades, Deseos y Ahorro"` (58 chars ✓) |
| `Rule503020.meta.description` | 153 chars, empieza "No hagas números" | 151 chars, empieza "Calculadora 50/30/20 gratis para dividir tu sueldo" |
| `Rule503020.meta.ogTitle` | "Distribuye tu Nómina en 1 Clic" | "Tu Presupuesto Mensual Gratis" |
| `Rule503020.header.subtitle` | "Descubre cuánto deberías ahorrar..." | "Divide tu sueldo mensual entre necesidades, deseos y ahorro..." |
| H1 page.tsx (hardcodeado) | `"Calculadora Regla 50/30/20"` | `"Calculadora 50/30/20 Gratis"` |
| Subtítulo page.tsx (hardcodeado) | "Descubre tu sueldo ideal distribuyéndolo..." | "Divide tu sueldo mensual entre necesidades, deseos y ahorro..." |
| H1 duplicado Calculator503020.tsx | `<h1>` | `<h2>` (mismo fix que SEO-AHORRO-H1-DEDUP-01) |

**Archivos modificados:** `messages/es.json`, `page.tsx` (regla-50-30-20), `Calculator503020.tsx`  
**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `bb82137`

---

## SEO-AHORRO-H1-DEDUP-01 — Corrección H1 duplicado en calculadora de ahorro

**Fecha de ejecución:** 2026-06-26  
**URL objetivo:** `/es/herramientas/calculadora-ahorro`  
**Problema:** Dos elementos `<h1>` en la misma página — uno en `page.tsx`, otro en `SavingsCalculator.tsx`

**Corrección aplicada:**
- `src/components/landing/tools/SavingsCalculator.tsx` — `<h1>` → `<h2>` (2 líneas)
- Las clases Tailwind del elemento no cambian → cero impacto visual
- `page.tsx` conserva el único `<h1>` semántico real

**Jerarquía resultante:**
```
<h1> Calculadora de Ahorro Mensual          (page.tsx)
  <h2> Calculadora de Ahorro Mensual        (SavingsCalculator, degradado)
  <h2> ¿Cómo usar esta calculadora...       (sección SEO)
  <h2> ¿Qué te dice el resultado?           (sección SEO)
  <h2> Preguntas frecuentes sobre ahorro    (sección SEO)
```

**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `6d98a8a`

---

## SEO-AHORRO-CALCULADORA-01 — Optimización calculadora de ahorro

**Fecha de ejecución:** 2026-06-26  
**URL objetivo:** `/es/herramientas/calculadora-ahorro`  
**Datos Search Console:** 39 impresiones · 14 clics · CTR 35,9% · posición 8,97  
**Keywords objetivo:** calculadora ahorro (primaria), calculadora de ahorro, cuánto ahorrar al mes, simulador de ahorro mensual, plan de ahorro mensual

**Cambios realizados:**

| Campo | Antes | Después |
|---|---|---|
| `Tools.Savings.meta.title` | `"Calculadora de Ahorro Kakebo: Distribuye tu sueldo"` (50 chars) | `"Calculadora de Ahorro Mensual: ¿Cuánto Ahorrar al Mes?"` (55 chars) |
| `Tools.Savings.meta.description` | 153 chars — enfocada en distribución de ingresos | 141 chars — empieza "Calcula cuánto ahorrar al mes", añade "plan de ahorro mensual" |
| `Tools.Savings.meta.ogTitle` | `"Calculadora de Ahorro Kakebo: Tu sueldo ideal"` | `"Calculadora de Ahorro Mensual | Simula tu Plan de Ahorro"` |
| `Tools.Savings.header.title` (H1 interno) | `"Calculadora de Ahorro Kakebo"` | `"Calculadora de Ahorro Mensual"` — keyword "mensual" |
| `Tools.Savings.header.subtitle` | `"Descubre cómo deberías distribuir tu sueldo..."` | `"¿Cuánto puedes ahorrar al mes? Calcula tu plan..."` — intención directa |
| H1 page.tsx (hardcodeado) | `"Calculadora de Ahorro Kakebo"` | `"Calculadora de Ahorro Mensual"` |
| Subtítulo page.tsx (hardcodeado) | `"Descubre tu potencial de ahorro mensual..."` | `"¿Cuánto deberías ahorrar cada mes? Planifica tu ahorro mensual..."` |

**Nota técnica (pre-existing):** La página tiene dos elementos `<h1>` — uno hardcodeado en `page.tsx` y otro dentro del componente `SavingsCalculator`. No se corrige la estructura en esta tarea.

**Archivos modificados:** `messages/es.json`, `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx`  
**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `8084303`

---

## SEO-HOME-KAKEBO-APP-01 — Optimización Home para kakebo online gratis / kakebo app

**Fecha de ejecución:** 2026-06-26  
**URL objetivo:** `/` (Home ES)  
**Keywords objetivo:** kakebo online gratis (primaria), kakebo online, kakebo app, app kakebo, método kakebo

**Cambios realizados en `messages/es.json`:**

| Campo | Antes | Después |
|---|---|---|
| `Landing.meta.title` | `"Kakebo AI: App Kakebo Online para Ahorro | Sin Banco, Con IA"` (60 chars) | `"Kakebo Online Gratis | App de Ahorro con el Método Japonés"` (59 chars) |
| `Landing.meta.description` | `"Controla tus gastos con el método japonés..."` (109 chars) | `"App Kakebo online gratis para controlar gastos y ahorrar con el método japonés. Sin conectar el banco, 100% privada y con IA integrada."` (135 chars) |
| `Landing.meta.ogTitle` | igual que title anterior | igual que title nuevo |
| `Landing.meta.ogDescription` | igual que description anterior | igual que description nueva |
| `Hero.subtitle` | `"La App de Control de Gastos basada en el Método Japonés..."` | `"La app Kakebo online gratuita para controlar gastos con el Método Japonés..."` |

**H1 (`Hero.title`):** no modificado — ya contenía "Kakebo Online" en posición óptima  
**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `ad9fbf5`

---

## SEO-I18N-KAKEBO-ONLINE-VALIDATE-01 — Validación interferencia ES/EN

**Fecha:** 2026-06-26  
**Tipo:** Validación documental — sin cambios en código ni contenido  
**Documento:** `docs/seo/SEO_I18N_KAKEBO_ONLINE_VALIDATE_01.md`

**URLs revisadas:**
- `/blog/kakebo-online-gratis` — canónica ES (sin prefijo)
- `/es/blog/kakebo-online-gratis` — redirect 301 confirmado en `next.config.ts`
- `/en/blog/kakebo-online-gratis` — versión EN, supera en señales a ES
- `/es/blog/kakebo-online-guia-completa` — redirect 301 confirmado

**Resultado:**

| Interferencia | Clasificación |
|---|---|
| `/es/*` interfiriendo con `/blog/*` | DESCARTADO — 301 en su lugar |
| EN artículo superando ES en señales | DUDOSO — slug EN contiene keyword española "gratis" |
| Canibalización interna ES | DESCARTADO — intención diferenciada |

**Próxima tarea propuesta:** SEO-I18N-EN-SLUG-FIX-01 (pendiente de datos adicionales de GSC)  
**Commit:** `0006a3d`

---

## DOC-BRAND-01 — Manual de identidad visual Kakebo

**Fecha de ejecución:** 2026-06-26  
**Tipo:** Tarea documental — sin cambios en código

**Archivos añadidos a `docs/brand/`:**
- `IDENTIDAD_VISUAL_KAKEBO.md` — Fuente operativa principal: dirección estética, principios visuales, tipografías, paleta, uso del color, fondos, componentes, tono verbal y reglas de implementación
- `PROMPT_VISUAL_KAKEBO.md` — Bloque reutilizable para prompts visuales a Claude, Gemini o Codex
- `identidad-kakebo-01-cover.png` — Portada del manual visual
- `identidad-kakebo-02-logotipo.png` — Logotipo y usos
- `identidad-kakebo-03-paleta.png` — Paleta cromática
- `identidad-kakebo-04-tipografia.png` — Sistema tipográfico
- `identidad-kakebo-05-sistema-visual.png` — Sistema visual completo
- `identidad-kakebo-06-fondos-recursos.png` — Fondos y recursos gráficos
- `identidad-kakebo-07-aplicaciones.png` — Aplicaciones y ejemplos

**Uso futuro:**
- Referencia obligatoria antes de cualquier tarea UIUX, imagen de blog o recurso gráfico
- El prompt de `PROMPT_VISUAL_KAKEBO.md` debe incluirse en tareas visuales a Claude Code, Gemini o Codex
- Las imágenes son referencia visual complementaria; el markdown es la fuente operativa principal

**Nota:** No se tocó código de aplicación, artículos, SEO, UI, routing ni ningún otro área.  
**Commit:** `5249c37`

---

## SEO-CTR-FINTONIC-01 — Detalle técnico

**Fecha de ejecución:** 2026-06-26  
**URL objetivo:** `/es/blog/alternativas-a-app-bancarias`  
**Datos Search Console:** 310 impresiones · 2 clics · CTR 0,65% · posición media 7,95

**Problema diagnosticado:**
- `title` (77 chars) → meta title `{title} | Blog Kakebo` = 91 chars, truncado por Google (~65 max)
- `excerpt` (175 chars) → description sobre el límite ~155, empieza con pregunta pasiva sin CTA concreto
- Keyword "Fintonic" aparece en intro en p.2, "alternativa a Fintonic" no hasta p.4

**Cambios realizados:**
- `title` (frontmatter): `"Las 7 Alternativas a Fintonic sin Banco (2026)"` (47 chars → 61 total con suffix ✓)
- `excerpt` (frontmatter): `"Comparativa 2026: las 7 mejores alternativas a Fintonic. Controla tus gastos sin conectar el banco ni ceder tus datos. Gratis y sin publicidad."` (143 chars, sin emoji)
- Intro p.3: añade "Fintonic y sus alternativas bancarias" para traer el keyword al párrafo 3

**Archivo modificado:** `src/content/blog/alternativas-a-app-bancarias.es.mdx`  
**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `e1f30a5`

---

## SEO-CTR-INFLACION-01 — Detalle técnico

**Fecha de ejecución:** 2026-06-26  
**URL objetivo:** `/es/herramientas/calculadora-inflacion`  
**Datos Search Console:** 353 impresiones · 1 clic · CTR 0,28% · posición media 7,8

**Problema diagnosticado:**
- Title con redacción pasiva ("¿Cuánto *valor* pierde tu dinero?") y keyword IPC al final entre paréntesis
- Description con 164 chars (sobre el límite ~155) + emoji 📊 con riesgo de truncación
- H1 sin referencia a "IPC" — keyword secundaria con alta búsqueda

**Cambios realizados:**
- `messages/es.json` → `Tools.Inflation.meta.title`: `"Calculadora de Inflación e IPC 2026 | ¿Cuánto pierde tu dinero?"` (65 chars)
- `messages/es.json` → `Tools.Inflation.meta.description`: `"Calcula cuánto pierde tu dinero con la inflación en España. Introduce tus ahorros, IPC y años. Resultado inmediato y gratis, sin registro."` (139 chars, sin emoji)
- `messages/es.json` → `Tools.Inflation.meta.ogTitle`: `"Calculadora de Inflación e IPC 2026 | Kakebo"`
- `messages/es.json` → `Tools.Inflation.header.title`: `"Calculadora de <italic>Inflación e IPC</italic> en España"` — añade IPC al H1 visible

**Nota canónica (no bloqueante, no tocada):** El canonical apunta a `https://www.metodokakebo.com/herramientas/calculadora-inflacion` (sin `/es/`), mientras Search Console indexa `/es/herramientas/calculadora-inflacion`. Esto es coherente si la ruta ES es la ruta sin prefijo en producción (configuración i18n default locale). No se toca hasta tener evidencia de error.

**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Commit:** `12b97e0`  
**Archivos modificados:** `messages/es.json`

---

## Estado actual del proyecto (2026-06-26)

| Tarea | Descripción | Commit | Estado |
|---|---|---|---|
| SEO-PILAR-01 | Artículo pilar cluster Presupuesto Personal | `38c22ae` | ✅ Completado |
| DOC-I18N-01 | Política SEO de idiomas documentada | `4b5ea7f` | ✅ Completado |
| CHECK-I18N-ROUTING-01 | Bug `Accept-Language` corregido | `5656eef` | ✅ Completado |
| UIUX-02 a 14 + MOBILE | Sprint UI/UX y mobile completo | `bfde77e`..`a0da677` | ✅ Completado |
| MED-01 + MED-02 | GA4 + CSP | `3a1777b`..`7a08d3d` | ✅ Completado |
| UIUX-BLOG-PROSE-01 + PREMIUM + GLOBAL | Sistema premium de artículos + global + mobile | `43269b6`..`b924649` | ✅ Completado |
| **SEO-CTR-INFLACION-01** | Optimizar CTR snippet calculadora inflación (title, description, H1) | `12b97e0` | ✅ Completado |
| **SEO-CTR-FINTONIC-01** | Optimizar CTR artículo alternativas a Fintonic (title, excerpt, intro) | `e1f30a5` | ✅ Completado |
| **DOC-BRAND-01** | Manual de identidad visual Kakebo en `docs/brand/` | `5249c37` | ✅ Completado |
| **SEO-I18N-KAKEBO-ONLINE-VALIDATE-01** | Validación interferencia ES/EN kakebo-online (DUDOSO) | `0006a3d` | ✅ Completado |
| **SEO-HOME-KAKEBO-APP-01** | Optimizar Home para kakebo online gratis / kakebo app | `ad9fbf5` | ✅ Completado |
| **SEO-AHORRO-CALCULADORA-01** | Optimizar calculadora de ahorro para cuánto ahorrar al mes | `8084303` | ✅ Completado |
| **SEO-AHORRO-H1-DEDUP-01** | Corregir H1 duplicado en calculadora de ahorro | `6d98a8a` | ✅ Completado |
| **SEO-503020-CALCULADORA-01** | Optimizar herramienta regla 50/30/20 para calculadora 50 30 20 | `bb82137` | ✅ Completado |
| **UI-BRAND-AUDIT-01** | Auditoría completa web contra brand manual (12 hallazgos) | `5616816` | ✅ Completado |
| **UI-COLOR-PRIMARY-ALIGN-01** | Alinear color primario #cf5c5c→#cf8c6c (brand manual) | `1d3800d` | ✅ Completado |
| **UI-CTA-EMOJI-REMOVE-01** | Eliminar emojis de CTAs en 12 artículos + Hero trust signal | `45bab2c` | ✅ Completado |
| **UI-TYPOGRAPHY-BRAND-ALIGN-01** | Alinear tipografía: prose h2/h3 fontFamily + HowItWorks H3 serif | `a62b440` | ✅ Completado |
| **UI-CARDS-BRAND-ALIGN-01** | Alinear tarjetas: orange→muted, shadow-xl→sm, progress bars→palette | `4781ad0` | ✅ Completado |
| **SEO-PILLAR-EXCEL-AUDIT-01** | Auditoría página pilar `/blog/plantilla-kakebo-excel` como activo SEO orgánico principal | — | ✅ Completado (2026-06-30) |
| **SEO-MAP-V1-AUDIT-01** | Mapa maestro SEO — inventario completo de URLs, clusters, prioridades y estado | — | ✅ Completado (2026-06-30) |
| **SEO-GEO-DEEP-AUDIT-01** | Auditoría profunda SEO técnico, semántico y GEO — 32 hallazgos | — | ✅ Completado (2026-06-30) |
| **SEO-ROADMAP-V1-01** | Roadmap SEO/GEO priorizado — 26 tareas en 7 bloques | — | ✅ Completado (2026-06-30) |
| **SEO-DATA-PRIORITY-01** | Snapshot GSC (Last 3m) + priorización por datos reales | — | ✅ Completado (2026-06-30) |
| **SEO-KAKEBO-ONLINE-CANIB-01** | Auditoría canibalización EN/ES kakebo-online-gratis — CONFIRMADA + scope ampliado todas las URLs (2026-07-03) | — | ✅ Completado (2026-07-03) |
| **SEO-KAKEBO-ONLINE-CANIB-FIX-01** | noindex en EN kakebo-online-gratis + exclusión de sitemap | `cba3fd0` | ✅ Completado (2026-06-30) |
| **SEO-GEO-TERMINOLOGY-01** | Glosario canónico SEO/GEO — 14 términos definidos | `168165f` | ✅ Completado (2026-06-30) |
| **SEO-GEO-ENTITY-DEFINITION-01** | Definiciones factuales citables — 14 entidades, bloques reutilizables | `96183cc` | ✅ Completado (2026-06-30) |
| **SEO-SCHEMA-HOME-01** | Schema Organization + WebSite + SoftwareApplication en Home | `16653ca` | ✅ Completado (2026-06-30) |
| **SEO-TECHNICAL-DATEMODIFIED-01** | Soporte `updatedDate` en frontmatter + `dateModified` real en JSON-LD y sitemap | `c77d160` | ✅ Completado (2026-07-01) |
| **SEO-SCHEMA-AHORRO-SYNC-01** | Schema calculadora-ahorro sincronizado con glosario canónico y GEO | `3141e9b` | ✅ Completado (2026-07-01) |
| **SEO-INTERNAL-LINKING-V1-01** | Auditoría y plan de enlazado interno — 17 URLs, 8 clusters, 4 fases | `af075f0` | ✅ Completado (2026-07-01) |
| **SEO-GEO-HOME-ENTITY-COPY-01** | Home optimizada como fuente de entidad SEO/GEO — 6 bloques de copy | `f2b1f51` | ✅ Completado (2026-07-01) |
| **SEO-GEO-APP-ENTITY-COPY-01** | Dashboard /app — terminología canónica en bloque SEO y onboarding | `1a4eff7` | ✅ Completado (2026-07-01) |
| **SEO-GEO-TOOL-AHORRO-COPY-01** | /herramientas/calculadora-ahorro — copy alineado con glosario GEO | `aa2432a` | ✅ Completado (2026-07-01) |
| **SEO-GEO-TOOL-INFLACION-COPY-01** | /herramientas/calculadora-inflacion — schema + cta copy alineados | `09f08a8` | ✅ Completado (2026-07-01) |
| **SEO-GEO-TOOL-503020-COPY-01** | /herramientas/regla-50-30-20 — schema + copy Kakebo AI canónico | `ac80f84` | ✅ Completado (2026-07-01) |
| **SEO-GEO-PILLAR-METODO-KAKEBO-GUIA-01** | /blog/metodo-kakebo-guia-definitiva — definición GEO, categorías canónicas, excerpt sin promesa | `aabc03a` | ✅ Completado (2026-07-01) |
| **SEO-GEO-PILLAR-KAKEBO-ONLINE-GRATIS-ES-01** | /blog/kakebo-online-gratis ES — definición GEO, sin superlativos, MetodoKakebo.com | — | ✅ Completado (2026-07-01) |
| **TOOL-CALCULADORA-AHORRO-V2-IMPL-01** | Calculadora de ahorro V2 — cálculo real con gastos fijos + variables | `e986a1d` | ✅ Completado (2026-07-08) |
| **TOOL-CALCULADORA-AHORRO-SEO-GEO-AUDIT-01** | Auditoría SEO/GEO calculadora de ahorro — OG, FAQPage ×6, HowTo, enlaces internos | `c123eb0` | ✅ Completado (2026-07-08) |
| **TOOL-CALCULADORA-AHORRO-SEO-GEO-IMPL-01** | SEO/GEO calculadora de ahorro — título, OG dinámica, schemas, FAQ visible, intro block, tabla interpretación, 4 enlaces | `ea3f17b` | ✅ Completado (2026-07-08) |

**Restricciones activas:**
- No abrir nuevo contenido SEO sin datos de Search Console (SEO-DATA-PRIORITY-01 primero).
- No hacer más cambios frontend amplios sin incidencia concreta.
- No tocar herramienta interna/dashboard.
- No tocar routing/i18n/hreflang/sitemap/middleware.
- No añadir imágenes ni avatares externos.

> Ver historial detallado de sprints SEO y decisiones arquitectónicas en `docs/PROJECT_STATUS.md`.

---

## Política SEO de Idiomas

**Fecha de decisión:** 2026-06-22  
**ID tarea de referencia:** DOC-I18N-01

### Regla activa

**El idioma principal y único activo para la producción de nuevo contenido editorial SEO del blog es el español.**

### Detalle de la política

| Ámbito | Regla |
|---|---|
| Nuevos artículos de blog | Solo se crean en español (`.es.mdx`) |
| Versiones `.en.mdx` nuevas | **No se crean** salvo orden explícita del usuario en la tarea |
| Contenido inglés existente | Se conserva como contenido legacy — no se elimina |
| Contenido inglés legacy | No se amplía, no se prioriza, no se indexa manualmente |
| Roadmap SEO activo | Opera exclusivamente en español |

### Contenido inglés legacy

Los siguientes archivos `.en.mdx` existen como contenido heredado y quedan fuera del roadmap SEO activo. No se tocan salvo instrucción explícita:

```
src/content/blog/ahorro-pareja.en.mdx
src/content/blog/alternativas-a-app-bancarias.en.mdx
src/content/blog/como-ahorrar-dinero-cada-mes.en.mdx
src/content/blog/como-hacer-un-presupuesto-personal.en.mdx   ← creado en SEO-PILAR-01, queda como legacy
src/content/blog/eliminar-gastos-hormiga.en.mdx
src/content/blog/kakebo-online-gratis.en.mdx
src/content/blog/kakebo-online-guia-completa.en.mdx
src/content/blog/kakebo-sueldo-minimo.en.mdx
src/content/blog/kakebo-vs-ynab.en.mdx
src/content/blog/libro-kakebo-pdf.en.mdx
src/content/blog/metodo-kakebo-guia-definitiva.en.mdx
src/content/blog/metodo-kakebo-para-autonomos.en.mdx
src/content/blog/peligros-apps-ahorro-automatico.en.mdx
src/content/blog/plantilla-kakebo-excel.en.mdx
src/content/blog/regla-30-dias.en.mdx
```

### Nota para agentes

Cualquier agente (Claude Code, Codex, u otro) que ejecute una tarea de creación de contenido editorial **debe crear únicamente el archivo `.es.mdx`**. Si la tarea no indica explícitamente que se requiere la versión inglesa, no se crea.

---

## Decisiones Arquitectónicas

### DA-09 — Prioridad de crecimiento temático

**Orden aprobado:**
1. Cluster 1 — Metodología Kakebo
2. Cluster 4 — Comparativas
3. Cluster 2 — Kakebo Digital y Herramientas
4. Cluster 3 — Educación Financiera General

**Justificación estratégica:**
El orden establecido busca consolidar la autoridad temática (Topical Authority) en el "Core Topic" (Método Kakebo) para establecer una base sólida de E-E-A-T frente a los motores de búsqueda antes de atacar verticales más genéricas y competidas. Abordar primero el Cluster 1 asegura el dominio del nicho, mientras que el Cluster 4 aprovecha esa autoridad para captar tráfico con intención comercial o comparativa (BOFU).

## Entidades y subtemas pendientes

**Entidades:**
* Motoko Hani
* Japón
* Minimalismo
* Ikigai
* Fondo de emergencia
* Libertad financiera
* Tasa de ahorro
* Gasto consciente
* Gratificación diferida
* Sistema de sobres
* Presupuesto base cero

**Subtemas:**
* Historia del Kakebo
* Filosofía del Kakebo
* Gestión de deuda
* Educación financiera infantil
* Gestión de ingresos irregulares
* Formatos físicos del método
* Categorización avanzada de gastos

## Candidatos para Content Sprint 1

*(Sujetos a revisión futura)*

**P0:**
* Origen del método Kakebo
* Las 4 categorías de gasto del Kakebo
* Kakebo para salir de deudas
* Las 4 preguntas antes de comprar

**P1:**
* Kakebo vs Sistema de Sobres
* Qué hacer si fallas con tu Kakebo
* Kakebo para niños

**P2:**
* Kakebo vs Regla 50/30/20
* Kakebo y Minimalismo
* Mejores agendas Kakebo físicas

> **Nota:** Los candidatos de Content Sprint 1 no constituyen un backlog definitivo. Su ejecución se revisará tras completar SEO-2.2, SEO-2.3 y SEO-2.4 y tras analizar datos adicionales de Search Console.

---

## Cluster SEO — Presupuesto Personal

**Estado:** En desarrollo activo  
**Decisión estratégica (2026-06-22):** Cluster prioritario siguiente tras consolidar el cluster Kakebo Core. Actúa como puente temático hacia autoridad en finanzas personales generales y da contenido hub a las calculadoras existentes (50/30/20 y ahorro).

### Artículos del cluster — Estado

| ID | Keyword principal | Slug | Prioridad | Estado |
|---|---|---|---|---|
| SEO-PILAR-01 | `como hacer un presupuesto personal` | `como-hacer-un-presupuesto-personal` | P1 — Pilar | ✅ Publicado 2026-06-22 |
| SEO-02 | `fondo de emergencia` | — | P1 | Pendiente |
| SEO-03 | `gastos fijos y variables` | — | P1 | Pendiente |
| SEO-04 | `como organizar finanzas personales` | — | P1 | Pendiente |
| SEO-05 | `regla 50 30 20` | — | P1 | Pendiente |
| SEO-06 | `presupuesto familiar mensual` | — | P2 | Pendiente |
| SEO-07 | `metodo de los sobres` | — | P2 | Pendiente |
| SEO-08 | `cuanto ahorrar al mes` | — | P2 | Pendiente |
| SEO-09 | `presupuesto base cero` | — | P3 | Pendiente |
| SEO-10 | `presupuesto ingresos irregulares` | — | P3 | Pendiente |

### SEO-PILAR-01 — Detalle técnico

**Fecha de publicación:** 2026-06-22  
**Archivos creados:**
- `src/content/blog/como-hacer-un-presupuesto-personal.es.mdx`
- `src/content/blog/como-hacer-un-presupuesto-personal.en.mdx`
- `public/images/blog/como-hacer-un-presupuesto-personal.webp`

**URLs:**
- ES: `https://www.metodokakebo.com/blog/como-hacer-un-presupuesto-personal`
- EN: `https://www.metodokakebo.com/en/blog/como-hacer-un-presupuesto-personal`

**SEO configurado:**
- Meta title, description, Open Graph, Twitter Card vía frontmatter
- JSON-LD: BlogPosting + BreadcrumbList + FAQPage (7 preguntas)
- hreflang ES/EN/x-default
- Canonical URL por locale
- Sitemap: incluido automáticamente vía `getBlogPosts()`

**Herramientas integradas:** calculadora-ahorro (×2), regla-50-30-20 (×1)  
**Enlaces internos:** 9 artículos del blog + 2 herramientas  
**Build:** ✅ Compiled successfully — 0 errores TypeScript  
**Tests:** ✅ 506/506 passing

