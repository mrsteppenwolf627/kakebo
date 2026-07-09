# KEYWORD_RESEARCH_FONDO_EMERGENCIA_01 — Ficha keyword: fondo de emergencia

**Fecha:** 2026-07-09
**Tarea:** KEYWORD-RESEARCH-FONDO-EMERGENCIA-01
**Tipo:** Solo investigación, decisión SEO y documentación — sin código, sin MDX, sin contenido, sin publicación
**Commit de referencia (HEAD):** `984b3fc`

---

## 1. Objetivo del keyword research

Decidir, con evidencia documentada (GSC, autocomplete/PAA, SERP manual, Keyword Planner) y cruzando con el cluster editorial ya existente en `src/content/blog/`, si procede producir un artículo sobre "fondo de emergencia", con qué keyword objetivo, qué intención cubrir y qué ángulo lo diferencia de la competencia y del contenido propio ya publicado.

## 2. Documentos y contenido revisados

- `docs/seo/PLAN_SEO_GEO_METODOKAKEBO.md` (Fase 5 — criterios antes de crear un artículo)
- `docs/seo/SEO_ROADMAP_RESUME_2026_07_09.md`
- `docs/seo/SEO_MAP_V1.md`
- `docs/PROJECT_STATUS.md` · `PROJECT_STATUS.md` (raíz)
- `src/content/blog/cuentas-remuneradas.es.mdx`
- `src/content/blog/como-hacer-un-presupuesto-personal.es.mdx`
- `src/content/blog/como-ahorrar-dinero-cada-mes.es.mdx`
- `src/content/blog/kakebo-sueldo-minimo.es.mdx`
- `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx`
- `src/app/[locale]/(landing)/herramientas/calculadora-inflacion/page.tsx`
- `src/app/[locale]/(landing)/herramientas/regla-50-30-20/page.tsx`

## 3. Hallazgo crítico previo a la decisión: "fondo de emergencia" ya existe en el sitio

Antes de decidir la keyword y el ángulo, se verificó qué dice ya el sitio sobre este tema, para evitar canibalización:

| Ubicación | Qué dice ya |
|---|---|
| `como-hacer-un-presupuesto-personal.es.mdx` §"El primer objetivo para cualquier persona: el fondo de emergencia" | Define el concepto y fija la regla de **3-6 meses de gastos básicos**; ejemplo numérico (María, objetivo 1.350 €, 9 meses) |
| `cuentas-remuneradas.es.mdx` §"Cuenta remunerada y fondo de emergencia" | Explica **dónde guardarlo** (cuenta remunerada vs. corriente vs. inversión); FAQ dedicada: *"¿Sirve para guardar el fondo de emergencia?"* |
| `calculadora-ahorro` (FAQ del schema) | *"¿Cómo calculo el dinero que necesito para un fondo de emergencia?"* → responde con la regla 3-6 meses y remite a la función **"Añadir objetivo"** de la propia calculadora |
| `como-ahorrar-dinero-cada-mes.es.mdx` | Menciona el fondo de emergencia como destino del ahorro fijo (ejemplo del 5%) |
| `regla-50-30-20` (herramienta) | Menciona el fondo de emergencia como destino del bloque 20% de ahorro |

**Consecuencia directa para esta ficha:** el sitio ya cubre "qué es" y "regla 3-6 meses" en `como-hacer-un-presupuesto-personal` (pilar existente) y "dónde guardarlo" en `cuentas-remuneradas`. Un artículo nuevo **no puede repetir esas dos preguntas como eje central** sin canibalizar contenido ya publicado y funcionando. El hueco real está en la **profundidad del cálculo** ("cuánto, exactamente, para mi caso") — nadie en el sitio hace ese cálculo en detalle todavía, solo lo menciona de pasada.

## 4. Cómo encaja en el cluster

| Cluster relacionado | Relación con "fondo de emergencia" |
|---|---|
| Método Kakebo | Contexto metodológico: el fondo de emergencia es la aplicación práctica del ahorro sistemático que promueve el método |
| Ahorro mensual (`como-ahorrar-dinero-cada-mes`) | Ya menciona el fondo de emergencia como destino del ahorro — enlace natural bidireccional |
| Presupuesto personal (`como-hacer-un-presupuesto-personal`, pilar) | Ya define "qué es" y la regla 3-6 meses — el nuevo artículo debe enlazar aquí para la definición base, no repetirla |
| Calculadora de ahorro | Ya tiene la función "Añadir objetivo" que calcula esto — el nuevo artículo es la pieza editorial que le falta a esta herramienta (cierra un gap real, similar al patrón ya ejecutado con `cuentas-remuneradas` → `calculadora-ahorro`) |
| Cuentas remuneradas | Ya resuelve "dónde guardarlo" — el nuevo artículo debe enlazar aquí, no duplicar esa sección |
| Inflación | Conexión secundaria: el fondo de emergencia parado pierde poder adquisitivo — enlace natural hacia `calculadora-inflacion` |
| Regla 50/30/20 | Conexión secundaria: el 20% de ahorro incluye el fondo de emergencia como primer destino |

**Conclusión de encaje:** el artículo no crea un cluster nuevo — expande y conecta el cluster de ahorro ya existente, ocupando el hueco específico de "cálculo práctico" que hoy solo se menciona de forma superficial en 3 piezas distintas sin que ninguna lo desarrolle en profundidad.

## 5. Intención de búsqueda clasificada

| Keyword | Intención |
|---|---|
| fondo de emergencia | Informativa (tema padre, alta competencia) |
| fondo emergencia | Informativa (variante corta) |
| fondo de emergencia qué es / que es | Informativa — **ya cubierta** en `como-hacer-un-presupuesto-personal` |
| **cuánto dinero tener en un fondo de emergencia** | **Práctica/cálculo** — hueco real, no cubierta en profundidad |
| de cuánto debe ser mi/un fondo de emergencia | Práctica/cálculo — misma familia que la keyword objetivo |
| fondo de emergencia cuánto | Práctica/cálculo |
| crear fondo de emergencia / crear un fondo de emergencia | Práctica/acción — cómo empezar |
| para qué sirve un fondo de emergencia | Informativa — parcialmente cubierta |
| fondo de emergencia dónde guardarlo / dónde guardar el fondo de emergencia | Dónde guardar el dinero — **ya cubierta** en `cuentas-remuneradas` |
| fondo de emergencia remunerado | Dónde guardar el dinero + comparación con cuentas remuneradas — **ya cubierta** en `cuentas-remuneradas` |
| fondo de emergencia España | España — modificador geográfico, aplicable a cualquier ángulo |

**Intención principal recomendada para el nuevo artículo: práctica/cálculo** — es la única familia de intención con volumen real (~50 búsquedas/mes por variante, según Keyword Planner) que **no** está resuelta en profundidad por ningún contenido existente del sitio.

## 6. Keyword padre y keyword objetivo inicial

**Opciones evaluadas:**

| Opción | Evaluación |
|---|---|
| A. `fondo de emergencia` | Descartada como objetivo directo — 500 búsquedas/mes pero SERP dominada por bancos (BBVA, Sabadell, Bankinter), aseguradoras (AXA, Allianz, Mapfre) y medios (Finect, Reddit). Competir de frente ahora, sin autoridad de dominio ni backlinks, es una apuesta de bajo retorno a corto plazo |
| B. **`cuánto dinero tener en un fondo de emergencia`** | **Recomendada** — long tail con intención de cálculo clara, menor fricción competitiva, y es exactamente el hueco que ni el sitio propio ni (según la lectura SERP) los competidores resuelven con una herramienta interactiva real |
| C. `fondo de emergencia dónde guardarlo` | Descartada como objetivo principal — ya resuelta por `cuentas-remuneradas`; usarla forzaría canibalización interna |
| D. `fondo de emergencia España` | Descartada como objetivo principal — modificador geográfico débil como eje único, mejor integrado como keyword secundaria transversal |
| E. `crear fondo de emergencia` | Descartada como objetivo principal, pero válida como sección del artículo (paso a paso de "cómo empezar") |

**Decisión:**
- **Keyword padre (tema):** `fondo de emergencia`
- **Keyword objetivo inicial:** `cuánto dinero tener en un fondo de emergencia`

## 7. Keywords secundarias a cubrir en el cuerpo (sin canibalizar)

- fondo de emergencia (mención natural, no como target de title)
- fondo emergencia
- crear fondo de emergencia / crear un fondo de emergencia
- de cuánto debe ser mi/un fondo de emergencia
- fondo de emergencia cuánto
- fondo de emergencia España
- para qué sirve un fondo de emergencia (breve, con enlace a la definición completa en el pilar)
- fondo de emergencia dónde guardarlo / fondo de emergencia remunerado (mención breve + enlace fuerte a `cuentas-remuneradas`, sin desarrollar la comparativa de nuevo)

**No usar como eje del artículo (ya resueltas en otras piezas):** "fondo de emergencia qué es" (→ pilar presupuesto), "dónde guardar el fondo de emergencia" en profundidad (→ cuentas remuneradas).

## 8. Análisis de competencia (SERP manual)

**Por qué la SERP es difícil:**
- Dominada por bancos (BBVA, Sabadell, Bankinter) y aseguradoras (AXA, Allianz, Mapfre) con autoridad de dominio muy alta y contenido genérico de marca.
- Presencia de un organismo regulador internacional (Consumer Financial Protection Bureau) y medios financieros especializados (Finect, La Hormiga Capitalista, Pepper Finance) con audiencia y backlinks consolidados.
- Reddit indica que hay también demanda de respuestas informales/comunitarias, no solo institucionales.
- Competencia Ads baja (según Keyword Planner) pero eso no reduce la dificultad orgánica — solo indica poca presión publicitaria.

**Por qué la long tail es mejor para MetodoKakebo.com:**
- Ningún competidor detectado en la SERP ofrece una **calculadora interactiva** integrada en el propio artículo para resolver "cuánto, exactamente, para mi caso" — la mayoría da rangos genéricos (3-6 meses) sin cálculo personalizado.
- MetodoKakebo.com ya tiene esa pieza construida (`calculadora-ahorro`, función "Añadir objetivo") — el artículo puede ofrecer un cálculo real accionable en el momento, no solo una cifra teórica.
- La long tail de cálculo tiene menos jugadores especializados compitiendo directamente por esa intención concreta que por el término genérico.

**Qué hueco podemos ocupar:**
- Guía práctica de cálculo por perfil de gasto real (no un rango genérico "3-6 meses" sin más), con ejemplos numéricos concretos como ya se hace en `cuentas-remuneradas` (1.000 €/3.000 €/10.000 €) y en `como-hacer-un-presupuesto-personal` (ejemplo de María).
- Conexión directa y funcional con una herramienta propia ya existente — algo que bancos y aseguradoras no ofrecen de forma neutral (sus calculadoras, si existen, suelen empujar hacia producto propio).

**Qué NO debemos intentar copiar de bancos/comparadores:**
- No convertir el artículo en una comparativa de productos bancarios para "guardar" el fondo (eso ya lo hace `cuentas-remuneradas`, y duplicarlo sería canibalización, no expansión).
- No adoptar el tono corporativo/institucional de bancos y aseguradoras — mantener el enfoque práctico, España-first y sin venta de producto financiero de terceros que ya caracteriza al sitio (política ya aplicada en `cuentas-remuneradas`: "sin comparativa comercial, sin recomendación de entidades, sin afiliación").
- No intentar competir por el término genérico `fondo de emergencia` como title principal — sería previsiblemente un esfuerzo de bajo retorno sin autoridad de dominio consolidada.

## 9. Oportunidad SEO

- Long tail con intención de cálculo real, sin resolver en profundidad por el sitio ni (aparentemente) por gran parte de la SERP.
- Expande un cluster (ahorro/presupuesto) donde GSC ya muestra señal fuerte (Kakebo, plantilla Excel, Kakebo app/online, alternativas a Fintonic) — no es una apuesta a ciegas en un cluster sin ninguna tracción, sino una expansión natural de un cluster con actividad confirmada.
- Cierra el mismo tipo de gap editorial que ya se cerró con éxito en `CONTENT-01` (`cuentas-remuneradas` → apoya `calculadora-ahorro`): aquí el artículo apoyaría también a `calculadora-ahorro`, reforzando la misma herramienta desde un segundo ángulo editorial.

## 10. Oportunidad GEO

- Pregunta-respuesta directa y citable: "¿Cuánto dinero debo tener en mi fondo de emergencia?" con fórmula clara (gastos fijos mensuales × 3 a 6) es exactamente el tipo de contenido que un motor generativo puede citar sin ambigüedad.
- Puede incluir una tabla de ejemplo por perfil de gasto (igual que la tabla de `cuentas-remuneradas` con 1.000 €/3.000 €/10.000 €), formato ya validado como citable en el sitio.
- Refuerza el glosario canónico ya aplicado (Ocio/Vicio, Extras, MetodoKakebo.com vs. Kakebo AI) sin introducir términos nuevos.

## 11. Oportunidad de enlazado interno

**Entrante (desde el nuevo artículo hacia contenido existente):**
- `/blog/como-hacer-un-presupuesto-personal` — para la definición base y la regla 3-6 meses (evita repetirla)
- `/herramientas/calculadora-ahorro` — CTA principal, para el cálculo personalizado real vía "Añadir objetivo"
- `/blog/cuentas-remuneradas` — para "dónde guardarlo" (evita repetir esa sección)
- `/herramientas/calculadora-inflacion` — para el impacto de la inflación sobre el fondo parado
- `/blog/como-ahorrar-dinero-cada-mes` — para cómo generar el margen mensual que alimenta el fondo

**Saliente (desde contenido existente hacia el nuevo artículo, en una tarea de enlazado interno futura, no en esta):**
- `como-hacer-un-presupuesto-personal` podría enlazar desde su sección del fondo de emergencia hacia el nuevo artículo para profundidad de cálculo.
- `cuentas-remuneradas` podría enlazar desde su sección "Cuenta remunerada y fondo de emergencia" hacia el nuevo artículo.
- La FAQ de `calculadora-ahorro` podría, en una tarea futura, enlazar su respuesta hacia el nuevo artículo para profundidad editorial (no se toca en esta ficha).

## 12. Oportunidad de monetización futura (documentada, no implementada)

El artículo puede, en el futuro, servir de puente hacia:
- **Cuentas remuneradas** — ya existe el artículo puente (`cuentas-remuneradas`); el nuevo artículo reforzaría ese enlace desde una intención de búsqueda distinta y complementaria.
- **Comparativa de cuentas remuneradas** — si en el futuro se decide crear una pieza comparativa con productos reales, el fondo de emergencia es la intención de entrada más natural para ese contenido.
- **Herramientas propias** (`calculadora-ahorro`) — conversión hacia registro en la app, mismo patrón ya validado en `cuentas-remuneradas`.
- **Afiliación bancaria futura** — posible en un horizonte posterior, pero **no se añade ahora**, siguiendo la misma política ya aplicada en `cuentas-remuneradas` (sin afiliación, sin recomendación de entidades).

## 13. Title / H1 / meta description provisionales (no implementar)

**Opciones de title SEO:**
1. `Cuánto dinero tener en tu fondo de emergencia (con cálculo real)`
2. `Fondo de emergencia: cuánto ahorrar según tus gastos reales`
3. `Cuánto ahorrar para un fondo de emergencia en España`

**Opciones de H1:**
1. `Cuánto dinero necesitas en tu fondo de emergencia`
2. `Fondo de emergencia: cuánto ahorrar y cómo calcularlo`
3. `Tu fondo de emergencia, calculado a partir de tus gastos reales`

**Opciones de meta description:**
1. `Descubre cuánto dinero necesitas en tu fondo de emergencia según tus gastos reales, con ejemplos prácticos y una calculadora para saber tu objetivo exacto.`
2. `Guía práctica para calcular tu fondo de emergencia en España: cuánto ahorrar, cómo empezar y dónde guardarlo mientras tanto.`

## 14. Estructura recomendada (outline, no implementar)

| Sección | Keyword asignada | Intención cubierta | Enlace interno | CTA |
|---|---|---|---|---|
| Respuesta rápida (bloque inicial) | cuánto dinero tener en un fondo de emergencia | Práctica/cálculo | — | — |
| H2: Qué es un fondo de emergencia (breve, 2-3 líneas + enlace) | fondo de emergencia, fondo emergencia | Informativa (remite al pilar) | `como-hacer-un-presupuesto-personal` | — |
| H2: Cuánto dinero debe tener tu fondo de emergencia | de cuánto debe ser mi/un fondo de emergencia, fondo de emergencia cuánto | Práctica/cálculo | `herramientas/calculadora-ahorro` | ToolCTA hacia calculadora |
| H3: Fórmula y ejemplos por perfil de gasto | — | Práctica/cálculo | — | — |
| H3: Casos con gastos fijos de 600 €, 1.000 € y 1.800 € | — | Práctica/cálculo | — | — |
| H2: Cómo crear tu fondo de emergencia paso a paso | crear fondo de emergencia, crear un fondo de emergencia | Práctica/acción | `como-ahorrar-dinero-cada-mes` | — |
| H2: Dónde guardar el fondo de emergencia (breve, con enlace fuerte) | fondo de emergencia dónde guardarlo, fondo de emergencia remunerado | Dónde guardar (remite al artículo dedicado) | `cuentas-remuneradas` | — |
| H2: Fondo de emergencia y la pérdida de poder adquisitivo | — | GEO/complementaria | `calculadora-inflacion` | ToolCTA hacia calculadora inflación |
| H2: Errores frecuentes al calcular el fondo de emergencia | — | Práctica | — | — |
| H2: Preguntas frecuentes | fondo de emergencia qué es, para qué sirve un fondo de emergencia, fondo de emergencia España | Informativa/España | — | — |
| Conclusión + CTA final | — | — | — | ArticleCTA hacia registro |

## 15. Decisión final

**Producir.** El keyword research confirma:
1. Existe una intención real, aunque de bajo-medio volumen (~500/mes en el término padre, ~50/mes por variante long tail), no descartada por GSC (que aún no valida el tema pero tampoco lo contradice — es expansión de cluster, no apuesta a ciegas).
2. Hay un hueco genuino: ninguna pieza propia ni (según la lectura SERP) la mayoría de competidores resuelven el cálculo personalizado con una herramienta interactiva real.
3. El ángulo diferenciador (cálculo desde gastos reales + conexión con `calculadora-ahorro`) es ejecutable con contenido y herramientas que **ya existen** en el sitio — no requiere desarrollo nuevo.
4. El riesgo de canibalización es bajo si se respeta estrictamente la delimitación de esta ficha: no repetir "qué es" (pilar de presupuesto) ni "dónde guardarlo" (cuentas remuneradas) como ejes, solo enlazarlos.
5. Sigue el mismo patrón que ya funcionó en `CONTENT-01` (`cuentas-remuneradas`): cluster con señal GSC indirecta, keyword long tail de menor fricción, apoyo directo a una herramienta ya construida.

**No se ha creado ningún artículo, MDX ni contenido en esta tarea** — esta ficha es la base para una tarea de redacción futura, separada y explícita.

## 16. Siguiente tarea recomendada

**`CONTENT-02`** — redactar el artículo `/blog/fondo-de-emergencia` siguiendo exactamente el outline, keyword objetivo, title/H1/meta y restricciones de canibalización definidos en esta ficha, con el mismo estándar editorial ya aplicado en `CONTENT-01` (fuentes oficiales donde aplique, sin afiliación, sin comparativa comercial, España-first, enlazado interno hacia el pilar de presupuesto, `cuentas-remuneradas` y `calculadora-ahorro`).

---

*KEYWORD_RESEARCH_FONDO_EMERGENCIA_01.md — creado 2026-07-09*
*Solo investigación, decisión SEO y documentación — sin código, sin MDX, sin contenido publicado*
