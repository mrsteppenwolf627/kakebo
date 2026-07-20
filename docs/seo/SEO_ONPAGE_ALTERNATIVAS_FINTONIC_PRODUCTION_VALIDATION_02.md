# SEO-ONPAGE-ALTERNATIVAS-FINTONIC-PRODUCTION-VALIDATION-02

**Tipo:** Validación integral en producción y cierre documental de milestone (validación exclusiva, sin implementación)
**Fecha y hora de validación:** 2026-07-20, 09:27–09:31 UTC
**Milestone:** SEO-ONPAGE-ALTERNATIVAS-FINTONIC-02
**Commit base validado:** `afa4959`
**URL canónica:** `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias`

---

## 1. Resumen ejecutivo

Se ha validado en producción real (HTTP directo, sin caché de este entorno, mediante `curl` con headers completos) que las 9 tareas del milestone `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-02` están desplegadas correctamente: snippet (title/meta/H1), introducción SEO/GEO, 2 headings corregidos, corrección factual de Spendee, 6 fuentes oficiales, FAQ de 6 preguntas sincronizada con el schema, y el enlace interno hacia la calculadora de ahorro. No se ha detectado ninguna regresión técnica, editorial, de indexación ni de navegación. Las validaciones técnicas locales (TypeScript, ESLint, build, suite de tests) son consistentes con lo observado en producción.

**Veredicto: el milestone se cierra formalmente. La URL pasa a fase de medición pasiva.**

---

## 2. Fecha y hora de validación

2026-07-20, 09:27–09:31 UTC (validación HTTP en producción real). Validaciones técnicas locales ejecutadas inmediatamente después, mismo día.

---

## 3. Commit base

`afa4959` — confirmado como `HEAD` local y `origin/main` antes de iniciar la validación.

---

## 4. Estado del repositorio

| Comprobación | Resultado |
|---|---|
| `git status` | Mismos cambios locales ajenos preexistentes de todo el milestone (`.claude/settings.local.json`, submódulo `kakebo`, y untracked `CLAUDE.md`, `SEO_MAP_V1.md`, `docs/seo/fondo_emergencia/`, `docs/seo/regla502030/`, `imagenes/blog/`, `imagenes/kakebo online gratis.png`). No se ha tocado ninguno. |
| `git branch --show-current` | `main` |
| `git fetch origin` | Sin cambios remotos nuevos |
| `git log -1 --oneline` (local) | `afa4959 seo(fintonic): strengthen internal linking` |
| `git log origin/main -1 --oneline` | `afa4959 seo(fintonic): strengthen internal linking` |
| `git diff origin/main..HEAD` | Vacío — rama local idéntica a `origin/main` |

Se releyeron íntegramente `PROJECT_STATUS.md`, `docs/PROJECT_STATUS.md`, los 6 documentos SEO del milestone, el MDX actual, la lógica de metadata (`page.tsx`), la generación de schema y el test de sincronía FAQ (`alternativas-a-app-bancarias-faq-sync.test.ts`) antes de iniciar la validación de producción.

---

## 5. Confirmación del despliegue

**Producción está actualizada — no bloqueada por despliegue pendiente.** Todos los valores nuevos (title, H1, headings, intro, FAQ, fuentes, enlace interno, corrección Spendee) se observan directamente en el HTML servido por `https://www.metodokakebo.com`, y todos los valores antiguos (title sin Fintonic, heading "Las 5 mejores...", heading antiguo de la tabla, pregunta FAQ antigua, "austriaca") están confirmados ausentes (0 coincidencias en cada búsqueda). Se procede con la validación completa.

---

## 6. URLs comprobadas

- `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias` (canónica)
- `https://www.metodokakebo.com/es/blog/alternativas-a-app-bancarias` (variante legacy)
- `https://www.metodokakebo.com/en/blog/alternativas-a-app-bancarias` (variante EN)
- `https://www.metodokakebo.com/sitemap.xml`
- `https://www.metodokakebo.com/robots.txt`
- Las 6 fuentes oficiales externas (Fintonic, Spendee, Toshl/EU Digital Finance Platform, Realbyte, Emma, YNAB)
- `https://www.metodokakebo.com/herramientas/calculadora-ahorro` (destino del enlace interno nuevo)

---

## 7. Validación HTTP

| URL | Código | Notas |
|---|---|---|
| Canónica | `200 OK` | `X-Matched-Path: /[locale]/blog/[slug]`, sin cadena de redirecciones |
| `/es/...` | `308 Permanent Redirect` | `Location: /blog/alternativas-a-app-bancarias` — destino directo, sin cadena de redirecciones |
| `/en/...` | `200 OK` | Contenido propio distinto, confirmado (`title` distinto: "Mint and Fintonic Alternative...") |

**HTTP `Link` header:** persiste la discrepancia ya documentada en `VALIDATION-02` (hallazgo técnico T-01) — el header anuncia `hreflang="en"` mientras que el `<head>` HTML solo incluye `es` y `x-default`. Se registra que **sigue presente**, sin corregirse, conforme a la instrucción explícita de esta tarea de no tocarlo salvo evidencia de daño real. No se ha encontrado evidencia de daño real (el `<head>` HTML, que es la señal primaria que procesa Google, es correcto; el sitemap solo lista la URL canónica; `/en/` está `noindex`).

---

## 8. Validación de variantes

- **`/es/blog/alternativas-a-app-bancarias`:** `308` directo a la ruta canónica, sin cadena de redirecciones, comportamiento idéntico al validado en tareas anteriores.
- **`/en/blog/alternativas-a-app-bancarias`:** `200 OK`, `<meta name="robots" content="noindex, nofollow">` confirmado, `canonical` autoreferencial a `/en/...`, contenido en inglés propio y distinto del español (no es un duplicado del contenido actualizado), excluida del `sitemap.xml` (confirmado — solo aparece la URL canónica sin prefijo).

---

## 9. Metadata

| Elemento | Esperado | Producción | Estado |
|---|---|---|---|
| `<title>` (único) | "Alternativas a Fintonic y Apps Bancarias (2026): 8 Opciones \| Blog Kakebo" | Idéntico, 1 sola ocurrencia | Conforme |
| Meta description (única) | "Comparamos 8 alternativas a Fintonic en 2026: con y sin conexión bancaria, precio y privacidad. Encuentra la que se adapta a ti, sin ceder tus datos." | Idéntica, 1 sola ocurrencia | Conforme |
| Canonical (único) | `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias` | Idéntico | Conforme |
| `og:title` | Igual al `seoTitle` (sin sufijo) | "Alternativas a Fintonic y Apps Bancarias (2026): 8 Opciones" | Conforme |
| `og:description` | Igual a la meta description | Idéntica | Conforme |
| `og:url` | Canónica | `https://www.metodokakebo.com/blog/alternativas-a-app-bancarias` | Conforme |
| `twitter:title` | Igual al `seoTitle` | Idéntico | Conforme |
| `twitter:card` | `summary_large_image` | Confirmado | Conforme |
| Duplicados / concatenación / marca doble | Ausentes | Ausentes (verificado: 1 sola `<title>`, 1 sola description, sin "Blog Kakebo" repetido) | Conforme |
| Title/description antiguos | Ausentes | 0 coincidencias | Conforme |

---

## 10. Contenido visible

- **H1:** único, coincide exactamente con "Alternativas a Fintonic: 8 apps para controlar tus gastos sin ceder tus datos".
- **Introducción:** presente completa, comienza con "Una **alternativa a Fintonic** es cualquier aplicación o método para controlar tus gastos y presupuestar..." (confirmado en HTML); introducción antigua ("Controlar los gastos personales sin conectar el banco a una app de terceros...") confirmada ausente (0 coincidencias).
- **Headings modificados:** "Comparativa: Alternativas a Fintonic y Apps Bancarias en 2026" y "Las 8 alternativas a Fintonic, analizadas" — ambos presentes exactamente como aprobados; los headings antiguos ("Comparativa: Mejores Alternativas a Apps Bancarias en 2026", "Las 5 mejores alternativas...") confirmados ausentes.
- **Total de headings:** 9 H2 y 19 H3 — sin regresión respecto a las tareas anteriores del milestone (mismo conteo verificado en `SNIPPET-02` a `INTERNAL-LINKING-02`).
- **Tabla:** las 8 alternativas presentes (Kakebo AI, Fintonic, Spendee, Toshl Finance, Money Manager, Emma, YNAB, Excel/Papel), 1 fila cada una, sin celdas vacías inesperadas, sin contenido concatenado detectado.
- **Fichas:** orden conservado, Pros/Contras presentes (verificación puntual: "Interfaz visual cuidada e intuitiva" de Spendee, presente y correcta).
- **CTA:** presente ("Regístrate en Kakebo AI sin conectar el banco ni introducir tarjetas"), 1 sola ocurrencia.
- **Contenido oculto / bloques duplicados:** no se ha detectado ninguno; las coincidencias adicionales de textos en el HTML corresponden al payload RSC de hidratación (patrón ya observado y documentado en tareas anteriores), no a contenido duplicado visible.

---

## 11. Tabla y fichas

Validado en la sección 10. Sin hallazgos.

---

## 12. Corrección factual (Spendee)

Confirmado: `<a href="https://www.spendee.com/about" target="_blank" rel="noopener noreferrer" ...>checa</a>` presente en el párrafo descriptivo de la ficha Spendee. El texto "austriaca" aplicado a Spendee está confirmado ausente (0 coincidencias en toda la página).

---

## 13. FAQ visible y FAQPage

**6 preguntas visibles y 6 entidades `Question` en el JSON-LD, en el mismo orden:**

1. ¿Cuál es la mejor alternativa a Fintonic?
2. ¿Hay una alternativa a Fintonic sin conectar el banco? *(reformulada)*
3. ¿Qué aplicación es más privada que Fintonic?
4. ¿Hay alternativas gratuitas a Fintonic?
5. ¿Cuál es mejor para controlar gastos personales sin complicarse?
6. ¿Es mejor usar una app automática o registrar los gastos manualmente? *(nueva)*

La pregunta antigua ("¿Existe una alternativa a apps bancarias sin conexión bancaria?") está confirmada ausente. No se detectan preguntas duplicadas. El JSON-LD es parseable (extraído y validado como texto JSON válido durante la inspección). Las respuestas modificadas responden directamente en su primera frase ("Sí. Money Manager y Kakebo AI son alternativas a Fintonic..." / "Depende de tu prioridad: la automatización ahorra tiempo..."). Ninguna respuesta presenta a Kakebo AI como ganador único; la pregunta 6 menciona Kakebo AI junto a Money Manager (registro manual) y Fintonic/Emma/Spendee (automatización) sin declarar preferencia. Ninguna pregunta invade la intención "Fintonic es seguro" ni "qué es Fintonic" — todas permanecen dentro del alcance comparativo/decisional aprobado en `ARCHITECTURE-02`.

---

## 14. Schema

- **`BlogPosting`:** `headline` = "Alternativas a Fintonic: 8 apps para controlar tus gastos sin ceder tus datos" (coherente con el H1); `dateModified` = "2026-07-20" (coherente con `updatedDate` del frontmatter tras `SNIPPET-02`); `mainEntityOfPage` con URL correcta; sin duplicados (1 sola ocurrencia de `"@type":"BlogPosting"`).
- **`FAQPage`:** 1 sola ocurrencia, 6 preguntas, contenido sincronizado con el visible (validado también por el test automatizado — ver sección 18).
- **`BreadcrumbList`:** 1 sola ocurrencia, ruta canónica (Inicio → Blog → título del artículo), sin `/es/` legacy como destino.

No se ha modificado ni añadido ningún schema en esta tarea.

---

## 15. Fuentes externas

| Aplicación | Anchor | URL declarada | HTTP | Dominio | Redirección | `target` | `rel` |
|---|---|---|---|---|---|---|---|
| Fintonic | "según su propio modelo de negocio" | https://www.fintonic.com/es-ES/inicio/ | 200 | fintonic.com | Ninguna | `_blank` | `noopener noreferrer` |
| Spendee | "checa" | https://www.spendee.com/about | 200 | spendee.com | Ninguna | `_blank` | `noopener noreferrer` |
| Toshl Finance | "eslovena" | https://digital-finance-platform.ec.europa.eu/observatory/eu-fintech-map/toshl | 200 | ec.europa.eu | Ninguna | `_blank` | `noopener noreferrer` |
| Money Manager | "coreana" | https://www.realbyteapps.com/ | 200 | realbyteapps.com | Ninguna | `_blank` | `noopener noreferrer` |
| Emma | "británica" | https://emma-app.com/plans/compare-emma-plans | 200 | emma-app.com | Ninguna | `_blank` | `noopener noreferrer` |
| YNAB | "con planes exclusivamente de pago" | https://www.ynab.com/pricing | 200 | ynab.com | Ninguna | `_blank` | `noopener noreferrer` |

Los 6 enlaces están presentes, apuntan a dominios oficiales, sin parámetros de tracking, sin `nofollow`, con `noopener noreferrer` (comportamiento estándar del componente `CustomLink`, no modificado en esta tarea). Ninguno es de afiliación. Ninguno falló en la comprobación (no fue necesario repetir ninguna verificación por error temporal).

---

## 16. Enlace interno

- **Anchor:** "calculadora de ahorro"
- **Destino:** `/herramientas/calculadora-ahorro`
- **Ubicación:** confirmada dentro de la sección "Privacidad frente a comodidad: no son excluyentes", inmediatamente antes de la FAQ.
- **HTML:** `<a class="text-primary hover:underline font-medium decoration-primary/30 underline-offset-4 transition-colors" href="/herramientas/calculadora-ahorro">calculadora de ahorro</a>` — URL relativa correcta, sin `target="_blank"` (correcto para enlace interno), sin `nofollow`.
- **Destino:** `200 OK`, canonical propio sin alterar, sin redirección.
- **Integración:** natural, dentro de una frase completa ("Una vez elijas la alternativa que mejor encaja contigo, el siguiente paso es ponerle una meta: la calculadora de ahorro te ayuda a calcular cuánto puedes ahorrar cada mes.").
- **Duplicados cercanos:** ninguno — las otras 2 ocurrencias de `href="/herramientas/calculadora-ahorro"` en la página pertenecen al footer global (anchor distinto, "Calculadora Ahorro"), no son parte del cuerpo del artículo ni están cerca del enlace contextual.
- **Enlaces internos anteriores** (`/blog/kakebo-vs-ynab`, `/blog/metodo-kakebo-guia-definitiva`): confirmados presentes sin cambios.

---

## 17. Validación visual y responsive

No se dispuso de navegador automatizado en esta sesión de validación. Se realizó una validación estructural equivalente mediante inspección directa del HTML renderizado por el servidor (SSR completo, sin JavaScript adicional necesario para el contenido principal): tabla con `overflow-x-auto` ya presente en el componente `Table` de `MDXComponents.tsx` (no modificado en este milestone, por lo que el scroll horizontal en móvil ya estaba resuelto antes de esta URL y no ha sido tocado), ausencia de HTML roto o mal cerrado en las secciones inspeccionadas, ausencia de headings duplicados. **No verificable en esta tarea:** captura visual real en viewport móvil/escritorio ni consola del navegador — se documenta como limitación de esta validación, no como hallazgo negativo, dado que la estructura HTML no muestra ninguna señal de regresión visual.

---

## 18. Validaciones locales

| Validación | Resultado |
|---|---|
| `tsc --noEmit` | ✅ 0 errores |
| `eslint` (archivos del milestone) | ✅ 0 errores (1 warning preexistente y ajeno: MDX sin configuración de lint específica) |
| `npm run build` | ✅ Compilado sin errores, 29 rutas generadas |
| Test de sincronía FAQ (`alternativas-a-app-bancarias-faq-sync.test.ts`) | ✅ 3/3 — mismo número de preguntas, sin duplicados, mismo orden/texto entre frontmatter y `FaqSection` |
| Suite completa (`vitest run`) | 585/586 — **único fallo:** `calculate-whatif.test.ts` (calculadora de escenarios "qué pasaría si", no relacionado con blog/SEO), confirmado preexistente y ajeno en todas las tareas del milestone desde `SNIPPET-02` |

---

## 19. Comparación contra la arquitectura

| Elemento | Arquitectura aprobada | Producción | Estado |
|---|---|---|---|
| Title | "Alternativas a Fintonic y Apps Bancarias (2026): 8 Opciones" | Idéntico | Conforme |
| Meta description | "Comparamos 8 alternativas a Fintonic en 2026: con y sin conexión bancaria, precio y privacidad. Encuentra la que se adapta a ti, sin ceder tus datos." | Idéntica | Conforme |
| H1 | "Alternativas a Fintonic: 8 apps para controlar tus gastos sin ceder tus datos" | Idéntico | Conforme |
| Introducción | Respuesta directa GEO + criterios + "no hay una única mejor" + transición a tabla | Presente, verificada | Conforme |
| Heading de tabla | "Comparativa: Alternativas a Fintonic y Apps Bancarias en 2026" | Idéntico | Conforme |
| Heading de alternativas | "Las 8 alternativas a Fintonic, analizadas" | Idéntico | Conforme |
| Número de alternativas | 8 (sin añadir ni quitar) | 8 confirmadas en tabla | Conforme |
| Fuentes oficiales | 6, una por app externa con ficha propia + nota Fintonic | 6 confirmadas, todas HTTP 200 | Conforme |
| Corrección Spendee | "austriaca" → "checa" | Confirmado | Conforme |
| FAQ | 5 → 6 preguntas, 1 reformulada, 1 añadida | Confirmado | Conforme |
| FAQPage | 6 `Question`, sincronizado | Confirmado + test automatizado | Conforme |
| Enlace a calculadora | `/herramientas/calculadora-ahorro`, anchor "calculadora de ahorro" | Confirmado | Conforme |
| Canonical | Sin prefijo, autoreferencial | Confirmado | Conforme |
| Redirect `/es/` | 308 directo | Confirmado | Conforme |
| `noindex` `/en/` | `noindex, nofollow` | Confirmado | Conforme |
| Schema | `BlogPosting`/`FAQPage`/`BreadcrumbList` sin cambios estructurales | Confirmado | Conforme |
| CTA | Sin cambios, único | Confirmado | Conforme |
| Neutralidad editorial | Kakebo AI sin presentarse como ganador único | Confirmado en FAQ e intro | Conforme con observación (ver hallazgo dudoso heredado de `VALIDATION-02`, no agravado en este milestone) |

---

## 20. Hallazgos confirmados

Ninguno nuevo. Todos los elementos aprobados están correctamente desplegados en producción, tal como se detalla en las secciones 9-16 y 19.

---

## 21. Hallazgos descartados

- Riesgo de canibalización de la variante `/en/` — descartado: `noindex, nofollow` confirmado, excluida del sitemap, contenido propio distinto.
- Riesgo de duplicidad de metadata — descartado: 1 sola `<title>`, 1 sola meta description, 1 solo H1, 1 solo canonical.
- Riesgo de enlaces rotos (fuentes + enlace interno) — descartado: los 7 destinos verificados devuelven `200 OK`.
- Riesgo de desincronía FAQ/schema — descartado: verificado manualmente y mediante test automatizado (3/3).

---

## 22. Hallazgos dudosos o preexistentes

- **T-01 (preexistente, documentado desde `VALIDATION-02`):** el HTTP `Link` header sigue anunciando `hreflang="en"` pese a que el `<head>` HTML (correcto) no lo incluye. Persiste sin corregir, conforme a la instrucción explícita de esta tarea. No bloquea el cierre — no hay evidencia de daño real (el sitemap y el `<head>` HTML, señales primarias, son correctos).
- **Riesgo de percepción de neutralidad (heredado de `VALIDATION-02`, hallazgo C-03/V-02):** Kakebo AI sigue apareciendo en 4 de 6 preguntas de la FAQ. No se ha agravado durante este milestone (la nueva pregunta 6 es la más equilibrada de todas, mencionando 4 apps de terceros junto a Kakebo AI sin preferencia declarada) y sigue fuera del alcance de esta tarea de validación de producción.
- **Fallo preexistente y ajeno confirmado:** `calculate-whatif.test.ts` — no relacionado con este milestone, no corregido, tal como exige la restricción del prompt.

---

## 23. Riesgos

- Ninguno bloqueante detectado.
- El hallazgo T-01 debe seguir monitorizándose; si se detecta algún día evidencia de que afecta a la indexación real (por ejemplo, Search Console reportando un hreflang inconsistente para esta URL), debería abrirse una tarea técnica dedicada, no forzada en este milestone.

---

## 24. Veredicto

**VALIDACIÓN SUPERADA.** Producción refleja exactamente lo aprobado en la arquitectura y todas las tareas de implementación del milestone. No existen regresiones bloqueantes, ni de metadata, ni de indexación, ni de contenido, ni de schema, ni de enlazado. El único fallo de test es preexistente y ajeno al milestone.

---

## 25. Decisión de cierre

**El milestone `SEO-ONPAGE-ALTERNATIVAS-FINTONIC-02` se cierra formalmente.** Se cumplen todas las condiciones de la regla de cierre del prompt: producción contiene todos los cambios aprobados, no hay regresiones bloqueantes, la metadata es correcta, canonical y variantes son correctos, FAQ y schema están sincronizados (verificado por test automatizado), los enlaces funcionan, el build pasa, y el único fallo de test es preexistente y ajeno.

---

## 26. Baseline de medición

**Agregado de la URL (pre-milestone):**

| Métrica | Valor |
|---|---|
| Clics | 4 |
| Impresiones | 459 |
| CTR | ≈ 0,87 % |
| Posición media | ≈ 8,19 |

**Cluster Fintonic (pre-milestone):**

| Métrica | Valor |
|---|---|
| Clics | 1 |
| Impresiones | 131 |
| CTR | ≈ 0,76 % |
| Posición media | ≈ 9,75 |

**Estado final de la URL:** `IMPLEMENTACIÓN COMPLETADA — EN FASE DE MEDICIÓN`.

---

## 27. Ventanas de medición

| Bloque | Ventana |
|---|---|
| Snippet (title/meta/H1) | Primeras señales en 2-4 semanas |
| Introducción, headings, FAQ y fuentes | 4-8 semanas |
| Enlazado interno | 4-8 semanas |
| Tendencia estable | 8-12 semanas |

**Métricas a monitorizar:** clics, impresiones, CTR, posición (agregado y cluster Fintonic), queries Fintonic, queries "apps bancarias" (para confirmar que no se pierden), URL canónica vs. variantes legacy en GSC, sesiones orgánicas, engagement, clics hacia `/herramientas/calculadora-ahorro` desde este artículo (si hay atribución disponible), uso del CTA (`click_cta_login` con `cta_location: "blog_simple_cta"`, ya instrumentado).

**Condiciones para no tocar la URL:** no modificarla por fluctuaciones diarias; no evaluar el resultado al día siguiente; no reescribir antes de que termine la ventana mínima de 2-4 semanas del snippet; no reaccionar a una caída aislada de pocos días dado el volumen bajo (131 impresiones/mes en el cluster Fintonic).

**Condiciones para reabrir la URL:** regresión técnica confirmada; caída sostenida de CTR o posición durante varias semanas consecutivas; pérdida de indexación; nueva evidencia relevante de GSC; cambios importantes en las aplicaciones comparadas (discontinuación, cambio de precio/modelo significativo); enlaces oficiales rotos en una futura comprobación; datos factuales desactualizados; conflicto de intención confirmado con evidencia SERP nueva.

---

## 28. Archivos creados o modificados en esta tarea

- `docs/seo/SEO_ONPAGE_ALTERNATIVAS_FINTONIC_PRODUCTION_VALIDATION_02.md` (nuevo)
- `PROJECT_STATUS.md`
- `docs/PROJECT_STATUS.md`

---

## 29. Confirmación de que no se modificó código ni contenido

Confirmado. Esta tarea ha sido exclusivamente de validación mediante `curl`, inspección de HTML/JSON-LD en producción, y ejecución de comandos de validación técnica ya existentes (`tsc`, `eslint`, `vitest`, `npm run build`) sin modificar ningún archivo de código, contenido, test ni configuración.

---

## 30. Siguiente acción recomendada

Ninguna de desarrollo. Medición pasiva en GSC (ventanas de 2-4, 4-8 y 8-12 semanas indicadas en la sección 27), sin nueva implementación sobre esta URL salvo que la medición revele una regresión o se cumplan las condiciones de reapertura de la sección 27.
