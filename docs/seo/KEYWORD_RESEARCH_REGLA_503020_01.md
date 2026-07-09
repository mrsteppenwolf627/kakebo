# KEYWORD_RESEARCH_REGLA_503020_01 — Ficha keyword: artículo de respaldo regla 50/30/20

**Fecha:** 2026-07-09
**Tarea:** KEYWORD-RESEARCH-REGLA-503020-01
**Tipo:** Solo investigación, decisión SEO y documentación — sin código, sin MDX, sin contenido, sin publicación
**Commit de referencia (HEAD):** `7da69dd`

---

## 1. Objetivo del keyword research

Decidir, con evidencia documentada (Autocomplete/PAA, SERP manual, Keyword Planner) y cruzando con el cluster editorial existente, cómo debe plantearse un futuro artículo de blog de apoyo a `/herramientas/regla-50-30-20` sin canibalizar la herramienta ni el contenido ya publicado que menciona la regla 50/30/20.

Esta tarea ejecuta la idea prioritaria #1 identificada en `SEO_CONTENT_BACKLOG_CLUSTERS_01.md` §6-8.

## 2. Fuentes usadas

- Google Autocomplete / People Also Ask / búsquedas relacionadas (aportadas en el brief de tarea)
- SERP manual (aportada en el brief de tarea)
- Google Keyword Planner (datos aportados en el brief de tarea)
- `docs/seo/PLAN_SEO_GEO_METODOKAKEBO.md`
- `docs/seo/SEO_CONTENT_BACKLOG_CLUSTERS_01.md`
- `docs/seo/SEO_ROADMAP_RESUME_2026_07_09.md`
- `docs/seo/SEO_MAP_V1.md`
- `docs/PROJECT_STATUS.md` · `PROJECT_STATUS.md` (raíz)
- `src/app/[locale]/(landing)/herramientas/regla-50-30-20/page.tsx` (código real de la herramienta, title/H1/meta/schema actuales)
- `messages/es.json` (namespace `Tools.Rule503020.meta`)
- `src/content/blog/*.mdx` — grep de menciones a "50/30/20": `fondo-de-emergencia.es.mdx`, `como-hacer-un-presupuesto-personal.es.mdx`, `como-ahorrar-dinero-cada-mes.es.mdx`, `regla-30-dias.es.mdx`, `metodo-kakebo-guia-definitiva.es.mdx` (+ equivalentes EN)

## 3. Verificación previa: qué dice ya el sitio sobre la regla 50/30/20

| Ubicación | Qué dice ya |
|---|---|
| `/herramientas/regla-50-30-20` (herramienta) | H1 "Calculadora 50/30/20 Gratis". Explica los 3 bloques (necesidades/deseos/ahorro), pasos de aplicación (`HowTo` schema con 4 pasos), sin ejemplos numéricos por sueldo concreto, sin FAQ, sin comparación con otras reglas |
| `como-hacer-un-presupuesto-personal.es.mdx` §"La regla 50/30/20: el método más conocido" | Define brevemente la regla dentro de una tabla comparativa de métodos (junto a Kakebo, presupuesto base cero), con `ToolCTA` hacia la herramienta. No desarrolla ejemplos por sueldo ni límites de la regla |
| `fondo-de-emergencia.es.mdx` | Menciona la regla como referencia del bloque 20% de ahorro, sin desarrollar |
| `como-ahorrar-dinero-cada-mes.es.mdx` | Mención de paso, sin desarrollo |
| `regla-30-dias.es.mdx` | Mención de paso, sin desarrollo |
| `metodo-kakebo-guia-definitiva.es.mdx` | Mención comparativa breve frente al método Kakebo |

**Consecuencia directa:** el "qué es la regla 50/30/20" ya está cubierto, aunque de forma breve, en el pilar `como-hacer-un-presupuesto-personal`. Un artículo nuevo **no puede repetir esa explicación básica como eje central** sin duplicar contenido ya publicado. El hueco real es la **ausencia total de ejemplos numéricos por sueldo, de sus límites prácticos y de comparación desarrollada con otras reglas (70/20/10)** — nada de esto existe hoy en el sitio, ni en el pilar ni en la propia herramienta.

## 4. Cómo encaja en el cluster

| Cluster relacionado | Relación con el futuro artículo |
|---|---|
| Regla 50/30/20 | Cluster propio — hoy solo tiene la herramienta, sin pieza editorial de respaldo (gap confirmado en `SEO_MAP_V1.md` desde 2026-06-30 y en `SEO_CONTENT_BACKLOG_CLUSTERS_01.md`) |
| Ahorro mensual | El bloque "20% ahorro" de la regla conecta directamente con `como-ahorrar-dinero-cada-mes` y `calculadora-ahorro` |
| Presupuesto personal | El pilar `como-hacer-un-presupuesto-personal` ya menciona la regla como una de las 4 opciones de método — el nuevo artículo debe enlazar aquí para el contexto comparativo general, no repetirlo |
| Método Kakebo | Ángulo diferencial explícito del brief: mostrar la regla 50/30/20 como punto de partida y el método Kakebo como capa de control más fino cuando la regla no basta |
| Calculadora de ahorro | Conexión secundaria — el bloque 20% de ahorro de la regla puede derivar hacia `calculadora-ahorro` para el cálculo del fondo de emergencia u objetivo concreto |
| Plantilla Excel | Keyword secundaria "regla 50 30 20 excel" con volumen — mención breve posible, sin desarrollar una plantilla descargable nueva (fuera de alcance; `plantilla-kakebo-excel` es un activo protegido y no se toca) |
| Fondo de emergencia | Conexión secundaria — el 20% de ahorro es el origen habitual del fondo de emergencia, ya tratado en `fondo-de-emergencia.es.mdx` |

**Conclusión de encaje:** el artículo no crea un cluster nuevo — cierra el cluster "Regla 50/30/20" que hoy solo tiene la herramienta, y conecta de forma natural con los clusters de ahorro mensual, presupuesto personal y método Kakebo ya existentes, sin necesidad de repetir su contenido.

## 5. Intención de búsqueda clasificada

| Keyword | Intención | Volumen (Keyword Planner) | Cobertura actual |
|---|---|---|---|
| regla 50 30 20 calculadora | Calculadora / transaccional | 500/mes, Ads bajo, índice 13 | **Ya cubierta por la herramienta** — debe seguir siendo su territorio |
| tabla para ahorrar dinero mensual | Tabla de ahorro mensual | 500/mes, Ads alto, índice 70 | No cubierta — intención distinta (más genérica, no específica de la regla) |
| regla 50 30 20 excel | Excel / plantilla | 50/mes, Ads medio, índice 61 | No cubierta en profundidad — mención breve posible en el artículo, sin plantilla nueva |
| regla 50 30 20 ejemplo | Ejemplo práctico | 50/mes, Ads bajo, índice 18 | **Hueco real, no cubierta** — recomendada como objetivo del artículo |
| regla de ahorro 70 20 10 | Comparación / explicación básica | 50/mes, Ads bajo, índice 11 | No cubierta — válida como sección comparativa del artículo |
| regla de ahorro 70 20 10 calculadora | Calculadora (regla distinta) | 50/mes, Ads bajo, índice 6 | No cubierta — fuera de alcance (no es la herramienta propia, solo mención comparativa) |
| ahorro diario tabla de ahorro mensual | Tabla de ahorro mensual | 50/mes, Ads alto, índice 100 | No cubierta — intención distinta, alta competencia Ads, no prioritaria |
| regla 50 30 20 online | Online / calculadora | Sin dato claro | Parcialmente cubierta por la herramienta (es "online" por definición) |
| cómo funciona la regla 50/30/20 | Explicación básica | (PAA) | Parcialmente cubierta en el pilar — el artículo debe remitir, no repetir |
| cómo funciona el sistema 50/30/20 | Explicación básica (variante) | (PAA) | Misma cobertura que la anterior |
| qué es la regla 70/20/10 del ahorro | Explicación básica (regla distinta) | (PAA) | No cubierta — válida como sección breve comparativa |
| cuánto ahorrar diariamente para 100.000€ en un año | Cálculo ajeno al tema central | (PAA) | Fuera de alcance — intención distinta, no forzar encaje |

**Intención principal recomendada para el artículo: ejemplo práctico / aplicación real** — es la única familia con hueco real confirmado, tanto en el sitio propio como (según lectura SERP) en gran parte de la competencia, que trata la regla de forma genérica sin ejemplos por sueldo.

## 6. Riesgo de canibalización

| Pregunta | Respuesta |
|---|---|
| ¿Qué keyword debe atacar la herramienta? | `regla 50 30 20 calculadora` (y variantes "online") — ya es su territorio natural: title actual "Calculadora 50/30/20 Gratis", intención transaccional, mayor volumen (500/mes) y menor dificultad relativa (índice 13) |
| ¿Qué keyword debe atacar el futuro artículo? | `regla 50 30 20 ejemplo` — intención práctica/explicativa distinta, sin solapamiento con la intención transaccional de la herramienta |
| ¿Cómo debe enlazar el artículo hacia la herramienta? | Mediante `ToolCTA` (mismo patrón ya usado en `como-hacer-un-presupuesto-personal.es.mdx` línea 132-137) situado justo después de presentar el primer ejemplo numérico, invitando a "calcula tu propia distribución" — refuerzo, no duplicación |
| ¿Debe la herramienta seguir siendo la URL principal para "regla 50 30 20 calculadora"? | Sí, sin ambigüedad. El artículo no debe usar esa keyword como title ni H1, y debe evitar repetir el copy transaccional ("calculadora gratis") como eje — su copy debe ser explicativo/narrativo ("ejemplo", "cómo aplicar", "cuándo no funciona") |
| ¿Hay riesgo de solapamiento con `como-hacer-un-presupuesto-personal`? | Bajo, si se respeta la delimitación de esta ficha: el pilar mantiene la explicación básica dentro de su tabla comparativa de métodos; el nuevo artículo no debe repetir esa comparativa completa, solo enlazarla, y debe centrarse en profundidad de ejemplo que el pilar no desarrolla |

**Conclusión de riesgo:** bajo, si el artículo respeta estrictamente el ángulo "ejemplo práctico + límites de la regla" y evita el copy transaccional ya propio de la herramienta.

## 7. Análisis de competencia (SERP manual)

**Por qué la SERP es difícil:**
- Dominada por bancos (BBVA, CaixaBank, N26) con autoridad de dominio alta y contenido genérico de marca sobre "qué es la regla 50/30/20".
- Presencia de blogs financieros consolidados (Domestica tu economía, HelpMyCash y similares) con audiencia y backlinks propios.
- La mayoría de resultados explican la regla de forma teórica, sin ejemplos numéricos concretos por nivel de sueldo ni sin abordar sus límites reales (alquiler alto, ciudades caras, sueldos bajos).

**Qué hueco puede ocupar MetodoKakebo.com:**
- Ningún competidor detectado en la SERP combina la explicación práctica con una **calculadora interactiva propia** integrada — MetodoKakebo.com ya tiene esa pieza construida (`/herramientas/regla-50-30-20`), igual que ocurrió con el patrón ya validado en `CONTENT-01`/`CONTENT-02` (`cuentas-remuneradas` → `calculadora-ahorro`, `fondo-de-emergencia` → `calculadora-ahorro`).
- Ejemplos reales por tramo de sueldo (p. ej. 1.200€, 1.800€, 2.500€ netos/mes), replicando el patrón de tabla ya validado en `cuentas-remuneradas` y `fondo-de-emergencia`.
- Honestidad sobre los límites de la regla — ningún competidor detectado en la SERP aborda de forma clara cuándo la regla 50/30/20 *no* funciona (alquiler que supera el 50%, ciudades caras, ingresos muy variables), lo cual conecta de forma natural y honesta con el método Kakebo como alternativa más flexible.

**Por qué el artículo no debe competir contra la herramienta:**
- El artículo ataca una intención de "entender y ver un ejemplo antes de decidir", mientras que la herramienta ataca "quiero calcular ya con mis propios números" — son dos momentos distintos del mismo recorrido de usuario, no la misma búsqueda.
- Si el artículo usara title/H1 centrados en "calculadora", competiría por el mismo intent y podría fragmentar señal de la propia herramienta en GSC — exactamente el tipo de canibalización que el Plan Maestro pide evitar.

**Qué NO debemos copiar de bancos y comparadores:**
- No adoptar el tono corporativo/institucional de bancos (BBVA, CaixaBank, N26).
- No prometer que la regla 50/30/20 "funciona para todo el mundo" — instrucción explícita del brief; el artículo debe mostrar honestamente sus límites (alquiler alto, gastos fijos elevados, ingresos irregulares).
- No convertir el artículo en una comparativa de productos bancarios ni de apps de terceros — mantener el enfoque práctico y neutral ya característico del sitio (política aplicada en `cuentas-remuneradas` y `fondo-de-emergencia`: sin afiliación, sin recomendación de entidades).
- No intentar competir por `regla 50 30 20 calculadora` como eje del artículo — ese territorio pertenece a la herramienta.

## 8. Oportunidad SEO

- Cierra el gap editorial más antiguo del cluster "Regla 50/30/20", documentado sin resolver desde `SEO_MAP_V1.md` (2026-06-30) y confirmado como prioridad alta en `SEO_CONTENT_BACKLOG_CLUSTERS_01.md` (2026-07-09).
- Long tail con intención clara y baja dificultad relativa (`regla 50 30 20 ejemplo`: 50/mes, Ads bajo, índice 18) frente al término dominado por bancos.
- Expande un cluster con señal de tracción indirecta ya confirmada: la propia herramienta tiene el CTR histórico más alto del sitio en su categoría (`calculadora-ahorro` 35,9%, patrón de "herramienta con snippet muy alineado a la intención" que puede repetirse aquí).
- Sigue el mismo patrón que ya funcionó en `CONTENT-01` y `CONTENT-02`: cluster con herramienta ya construida, artículo de apoyo con keyword long tail de menor fricción, refuerzo bidireccional herramienta↔artículo.

## 9. Oportunidad GEO

- Pregunta-respuesta directa y citable: "¿Cómo se aplica la regla 50/30/20 a un sueldo de 1.500€?" con ejemplo numérico exacto es el tipo de contenido que un motor generativo puede citar sin ambigüedad, algo que ningún competidor detectado en la SERP resuelve con cifras concretas.
- Tabla comparativa por tramos de sueldo (mismo formato ya validado y citable en `cuentas-remuneradas` y `fondo-de-emergencia`).
- Sección honesta sobre límites de la regla —contenido factual, no promocional— refuerza la señal de fiabilidad que motores generativos priorizan al citar.
- Comparación breve con la regla 70/20/10 aporta contexto comparativo estructurado (formato tabla o lista), favorable para respuestas tipo "diferencia entre..." en motores generativos.

## 10. Oportunidad de enlazado interno

**Entrante (desde el nuevo artículo hacia contenido existente):**
- `/herramientas/regla-50-30-20` — CTA principal, para calcular con números propios (`ToolCTA`)
- `/blog/como-hacer-un-presupuesto-personal` — para el contexto comparativo de métodos (evita repetir la tabla completa)
- `/blog/metodo-kakebo-guia-definitiva` — para presentar el método Kakebo como alternativa más flexible cuando la regla no encaja
- `/herramientas/calculadora-ahorro` — para profundizar el cálculo del bloque de ahorro (20%) hacia un objetivo concreto
- `/blog/fondo-de-emergencia` — mención breve del destino habitual del 20% de ahorro

**Saliente (desde contenido existente hacia el nuevo artículo, en una tarea de enlazado interno futura, no en esta):**
- `como-hacer-un-presupuesto-personal` podría enlazar desde su sección "La regla 50/30/20" hacia el nuevo artículo para el ejemplo práctico y los límites.
- La propia herramienta `/herramientas/regla-50-30-20` podría, en una tarea futura, enlazar hacia el artículo para profundidad editorial (no se toca en esta ficha — la tarea prohíbe tocar herramientas).

## 11. Oportunidad de monetización futura (documentada, no implementada)

El artículo puede, en el futuro, servir de puente hacia:
- **Plantilla Excel** — si se decide en el futuro crear una plantilla descargable específica de la regla 50/30/20 (distinta de `plantilla-kakebo-excel`, que está protegida y no se toca).
- **Calculadora 50/30/20 y calculadora de ahorro** — conversión hacia registro en la app, mismo patrón ya validado en `cuentas-remuneradas` y `fondo-de-emergencia`.
- **Herramientas de presupuesto en general** — refuerzo cruzado con el pilar `como-hacer-un-presupuesto-personal`.
- **Cuentas remuneradas** — conexión secundaria posible vía el bloque de ahorro/fondo de emergencia.
- **Afiliación bancaria futura** — posible en un horizonte posterior, pero **no se añade ahora**, siguiendo la misma política ya aplicada en `cuentas-remuneradas` y `fondo-de-emergencia` (sin afiliación, sin recomendación de entidades).

## 12. Evaluación de keyword principal del artículo

| Opción | Evaluación |
|---|---|
| A. `regla 50/30/20` | Descartada como objetivo directo — término padre de alta competencia, dominado por bancos; sin diferenciación clara frente al pilar `como-hacer-un-presupuesto-personal`, que ya lo menciona |
| B. `regla 50 30 20 calculadora` | Descartada — pertenece a la herramienta; usarla en el artículo generaría canibalización directa con `/herramientas/regla-50-30-20` |
| C. **`regla 50 30 20 ejemplo`** | **Recomendada** — hueco real confirmado, intención práctica clara, sin solapamiento con la herramienta ni con el pilar, dificultad baja (índice 18) |
| D. `regla 50 30 20 excel` | Descartada como objetivo principal — volumen bajo (50/mes) y competencia Ads media (índice 61); válida solo como mención secundaria breve, no como eje, para no prometer una plantilla descargable que no existe hoy |
| E. `regla de ahorro 70 20 10` | Descartada como objetivo principal — es una regla distinta; válida únicamente como sección comparativa breve dentro del artículo, no como eje |

**Decisión:**
- **Keyword padre (tema):** `regla 50/30/20`
- **Keyword principal de la herramienta:** `regla 50 30 20 calculadora`
- **Keyword objetivo inicial del artículo:** `regla 50 30 20 ejemplo`

## 13. Keywords secundarias a cubrir en el cuerpo del artículo (sin canibalizar)

- regla 50 30 20 calculadora (mención natural con enlace a la herramienta, no como target de title)
- regla 50 30 20 excel (mención breve, sin prometer plantilla descargable)
- regla 50 30 20 online (mención natural, remite a la herramienta)
- regla de ahorro 70 20 10 (sección comparativa breve)
- regla de ahorro 70 20 10 calculadora (mención breve dentro de la comparación, sin desarrollar una calculadora propia para esta regla)
- cómo funciona la regla 50/30/20 (breve, con enlace al pilar para la explicación completa)
- cómo funciona el sistema 50/30/20 (variante de la anterior, mismo tratamiento)
- tabla para ahorrar dinero mensual (mención natural si aplica al ejemplo por tramos, sin forzar como eje — intención algo distinta y alta competencia Ads)

**No usar como eje del artículo:** "regla 50 30 20 calculadora" (→ herramienta), "qué es la regla 50/30/20" en profundidad (→ pilar de presupuesto personal).

## 14. Title / H1 / meta description provisionales (no implementar)

**Opciones de title SEO:**
1. `Regla 50/30/20: ejemplo real con tu sueldo (y cuándo no funciona)`
2. `Regla 50/30/20 con ejemplos: cómo aplicarla a tu sueldo real`
3. `Ejemplo práctico de la regla 50/30/20 según tu sueldo`

**Opciones de H1:**
1. `Regla 50/30/20: un ejemplo real con tu sueldo`
2. `Cómo aplicar la regla 50/30/20 a tu sueldo (con ejemplos)`
3. `La regla 50/30/20 explicada con ejemplos reales`

**Opciones de meta description:**
1. `Descubre cómo aplicar la regla 50/30/20 con ejemplos reales por sueldo, cuándo deja de funcionar y cómo calcular tu propia distribución.`
2. `Ejemplos prácticos de la regla 50/30/20 según distintos sueldos, sus límites reales y una calculadora para aplicarla a tu caso.`

## 15. Estructura recomendada (outline, no implementar)

| Sección | Keyword asignada | Intención cubierta | Enlace interno | CTA |
|---|---|---|---|---|
| Respuesta rápida (bloque inicial) | regla 50 30 20 ejemplo | Ejemplo práctico | — | — |
| H2: Qué es la regla 50/30/20 (breve, 2-3 líneas + enlace) | regla 50/30/20, cómo funciona la regla 50/30/20 | Explicación básica (remite al pilar) | `como-hacer-un-presupuesto-personal` | — |
| H2: Ejemplo de la regla 50/30/20 por tramo de sueldo | regla 50 30 20 ejemplo | Ejemplo práctico | `herramientas/regla-50-30-20` | ToolCTA hacia calculadora |
| H3: Ejemplo con 1.200€ netos/mes | — | Ejemplo práctico | — | — |
| H3: Ejemplo con 1.800€ netos/mes | — | Ejemplo práctico | — | — |
| H3: Ejemplo con 2.500€ netos/mes | — | Ejemplo práctico | — | — |
| H2: Cuándo la regla 50/30/20 no funciona | — | Práctica/límites (diferenciador editorial) | `metodo-kakebo-guia-definitiva` | — |
| H2: Regla 50/30/20 vs regla 70/20/10 | regla de ahorro 70 20 10, regla de ahorro 70 20 10 calculadora | Comparación | — | — |
| H2: Qué hacer con el 20% de ahorro | — | Práctica/complementaria | `herramientas/calculadora-ahorro`, `fondo-de-emergencia` | ToolCTA hacia calculadora de ahorro |
| H2: Regla 50/30/20 en Excel u online | regla 50 30 20 excel, regla 50 30 20 online | Excel/online (breve, sin prometer plantilla) | `herramientas/regla-50-30-20` | — |
| H2: Preguntas frecuentes | cómo funciona el sistema 50/30/20, regla 50 30 20 calculadora | Informativa/calculadora (mención, no eje) | — | — |
| Conclusión + CTA final | — | — | — | ArticleCTA hacia registro |

---

## 16. Decisión final

**Producir.** El keyword research confirma:
1. Existe una intención real con hueco confirmado (`regla 50 30 20 ejemplo`: 50/mes, Ads bajo, índice 18), no resuelta en profundidad por el sitio ni por la mayoría de la SERP analizada.
2. El hueco es genuino: ni la herramienta ni el pilar de presupuesto personal desarrollan ejemplos numéricos por sueldo, límites reales de la regla, ni comparación con la 70/20/10.
3. El ángulo diferenciador (ejemplos por sueldo + honestidad sobre límites + conexión con Kakebo como alternativa más flexible) es ejecutable con contenido y herramientas que **ya existen** en el sitio — no requiere desarrollo nuevo.
4. El riesgo de canibalización es bajo si se respeta estrictamente la delimitación de esta ficha: la herramienta conserva `regla 50 30 20 calculadora` como su territorio; el artículo no repite el copy transaccional ni la explicación básica ya cubierta en el pilar, solo los enlaza.
5. Sigue el mismo patrón que ya funcionó en `CONTENT-01` y `CONTENT-02`: cluster con herramienta ya construida y con señal de intención fuerte, keyword long tail de menor fricción, refuerzo bidireccional herramienta↔artículo.

**No se ha creado ningún artículo, MDX ni contenido en esta tarea** — esta ficha es la base para una tarea de redacción futura, separada y explícita.

## 17. Siguiente tarea recomendada

**Producir el artículo** siguiendo exactamente el outline, keyword objetivo, title/H1/meta y restricciones de canibalización definidos en esta ficha, con el mismo estándar editorial ya aplicado en `CONTENT-01`/`CONTENT-02` (sin afiliación, sin comparativa comercial, sin promesas de que la regla funciona para todo el mundo, enlazado interno hacia el pilar de presupuesto, `metodo-kakebo-guia-definitiva`, `calculadora-ahorro` y `fondo-de-emergencia`).

**Nota sobre timing:** esta ficha no determina por sí sola si procede publicar ya. Según `SEO_ROADMAP_RESUME_2026_07_09.md`, el bloque de contenido nuevo permanece condicionado al snapshot GSC 2026-07-17/31, salvo que se decida ejecutar esta pieza de forma aislada y justificada (mismo criterio ya aplicado a `CONTENT-02`/`fondo-de-emergencia`, cuyo keyword research se aprobó antes de ese snapshot). Esa decisión de timing queda fuera del alcance de esta ficha — corresponde a una tarea de redacción (`CONTENT-03` o equivalente) explícitamente autorizada.

---

*KEYWORD_RESEARCH_REGLA_503020_01.md — creado 2026-07-09*
*Solo investigación, decisión SEO y documentación — sin código, sin MDX, sin contenido publicado*
