# SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-SPIKE-01 — Disponibilidad estructurada de la serie histórica larga del IPC

**Tarea:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-SPIKE-01`
**Tipo:** Investigación técnica pura. **Sin implementación de código, sin cambios en `src/`, sin dataset definitivo guardado, sin aceptación del ADR.**

## 1. Objetivo

Resolver si es posible obtener, mediante una fuente estructurada y oficial del INE, la serie nacional del IPC desde enero de 1961 hasta el último dato publicado, para determinar el rango temporal real de la primera versión de la calculadora histórica.

## 2. Commit base

`0c1ccabc0b4069ce8dd6cebc737a8c58eef9523e` (`docs(seo): diseñar cálculo histórico de inflación`), rama `main`, sincronizada con `origin/main` al iniciar.

## 3. Fuentes oficiales consultadas

Todas en el dominio `ine.es` o `servicios.ine.es` (INE), sin blogs, bancos, comparadores, GitHub de terceros, Kaggle ni datasets republicados:

- `https://servicios.ine.es/wstempus/js/ES/...` — API JSON (Tempus3), REST, pública.
- `https://www.ine.es/OpenAPI/includes/files/es/wstempus.yaml` — especificación OpenAPI de la API.
- `https://www.ine.es/jaxiT3/Tabla.htm?t=24077` — navegador de tabla clásico (JAXI/PC-Axis).
- `https://www.ine.es/jaxiT3/files/t/es/json/24077.json` — exportador JSON estático de tabla JAXI.
- `https://www.ine.es/varipc/verVariaciones.do` — herramienta oficial "¿Cuánto ha variado el IPC desde...?", endpoint GET parametrizado.
- `https://www.ine.es/dyngs/DAB/index.htm` — documentación de datos abiertos / API JSON.

## 4. Tabla larga identificada

**Hecho confirmado:** existe una tabla oficial titulada **"Índice general nacional. Series desde enero de 1961"**, accesible en `https://www.ine.es/jaxiT3/Tabla.htm?t=24077`.

| Campo | Valor | Estado |
|---|---|---|
| Título oficial | "Índice general nacional. Series desde enero de 1961" | Confirmado (título de la página, `<title>`) |
| URL (navegador clásico) | `https://www.ine.es/jaxiT3/Tabla.htm?t=24077` | Confirmado (HTTP 200) |
| Código de tabla (JAXI) | `24077` | Confirmado (`var tablaId = 24077`) |
| Fecha inicial declarada en el selector | `1961-01-01` (`fechaInicio="1961-01-01"`) | Confirmado |
| Total de periodos en el selector | 786 | Confirmado (texto "Total: 786" en la página) |
| Base estadística mostrada | "Base 2025" | Confirmado (título visible en la tabla) |
| Organismo responsable | Instituto Nacional de Estadística (INE) | Confirmado |
| Periodicidad | Mensual | Confirmado (selector mes/año) |
| Tablas relacionadas | `24075` (tasa de variación, mismo rango), `268` (misma tabla, versión/base anterior) | Confirmado por título de resultados de búsqueda oficial, no verificado su contenido individual |

**Coincidencia parcial y aclaración importante:** este mismo identificador numérico, `24077`, también existe como `IdTABLA` en la API JSON moderna (`wstempus`), pero **apunta a un contenido distinto** (ver secciones 5-6). Los espacios de identificadores del sistema clásico JAXI y de la API moderna `wstempus` no son intercambiables de forma fiable pese a compartir el número por coincidencia.

## 5. Identificadores encontrados

| Identificador | Sistema | Qué representa | Verificado |
|---|---|---|---|
| `24077` | JAXI (`jaxiT3/Tabla.htm?t=`) | Tabla larga 1961–presente (786 periodos, interfaz interactiva) | Sí (interfaz) |
| `24077` | wstempus (`DATOS_TABLA/24077`) | Misma tabla, pero **solo devuelve la serie corta 2002–presente** | Sí (petición real) |
| `IPC290751` | wstempus (`SERIE`, `DATOS_SERIE`) | "Nacional. Índice general. Índice." — serie corta, base vigente | Sí (petición real) |
| `24075` | JAXI | Tabla de tasas de variación, mismo título "desde enero de 1961" | Solo por título, no probado su contenido |
| `268` | JAXI | Misma tabla, versión/base anterior aparente | Petición de exportación JSON devolvió error (ver sección 14) |
| `IPC` (`Codigo`) | wstempus (`OPERACION/IPC`) | Operación estadística "Índice de Precios de Consumo (IPC)", `Id=25` | Sí |

**Hallazgo clave (confirmado mediante petición real, no inferido):** el catálogo de tablas de la operación 25 en la API moderna (`TABLAS_OPERACION/25`) **sí lista** la tabla `24077` con metadato `"Anyo_Periodo_ini":"1961"` — es decir, la propia API declara que esa tabla "empieza en 1961". Sin embargo, al pedir los datos reales de esa tabla (`DATOS_TABLA/24077`), la API **solo devuelve puntos desde enero de 2002**. Esto es una discrepancia real y reproducible entre el metadato declarado y los datos efectivamente accesibles — no una suposición.

## 6. Endpoints probados

| # | Endpoint | Resultado |
|---|---|---|
| 1 | `GET /wstempus/js/ES/DATOS_TABLA/24077?nult=3&det=0` | 200 OK, serie `IPC290751`, 3 puntos (abr–jun 2026) |
| 2 | `GET /wstempus/js/ES/DATOS_SERIE/IPC290751?nult=900&det=0` | 200 OK, **294 puntos exactos**, ene 2002 – jun 2026 |
| 3 | `GET /wstempus/js/ES/DATOS_SERIE/IPC290751?date=19600101:19630101` | 200 OK, `Data: []` (vacío — sin datos pre-2002) |
| 4 | `GET /wstempus/js/ES/SERIE/IPC290751` | 200 OK, metadatos: `Decimales:3`, `FK_Periodicidad:1` (mensual), `FK_Operacion:25` |
| 5 | `GET /wstempus/js/ES/SERIES_TABLA/24077?det=0` | 200 OK, **solo 1 serie listada**: `IPC290751` |
| 6 | `GET /wstempus/js/ES/DATOS_TABLA/24077?date=19610101:20261231&det=0` | 200 OK, sigue devolviendo solo 294 puntos (2002–2026), pese al rango de fechas solicitado desde 1961 |
| 7 | `GET /wstempus/js/ES/TABLAS_OPERACION/25?det=0` | 200 OK, 59 tablas listadas; tabla `24077` con `Anyo_Periodo_ini:"1961"` |
| 8 | `GET /wstempus/js/ES/OPERACIONES_DISPONIBLES` | 200 OK; **solo existe una operación IPC** en el catálogo moderno (no hay una operación separada para el IPC pre-2002) |
| 9 | `GET /jaxiT3/files/t/es/json/24077.json[?L=0\|nocab=1\|tip=AM\|p=1961]` | 200 OK, pero **siempre** el mismo archivo: 294 puntos, 2002–2026, idéntico en todos los parámetros probados |
| 10 | `GET /jaxiT3/files/t/es/json/268.json` | **HTTP 500** |
| 11 | `GET /jaxiT3/files/t/es/json/24075.json` | **HTTP 500** |
| 12 | `GET /wstempus/js/ES/DATOS_SERIE/IPC999999?det=0` (código inventado) | **HTTP 404**, respuesta HTML de error (no JSON) |
| 13 | `GET /wstempus/js/ES/DATOS_SERIE/IPC290751?date=19000101:19100101` | 200 OK, `Data: []` (rango sin ningún dato, sin error) |
| 14 | `GET https://www.ine.es/varipc/verVariaciones.do?idmesini=1&anyoini=2002&idmesfin=1&anyofin=2025&ntipo=1` | 200 OK, HTML, resultado: **67,9%** |
| 15 | `GET https://www.ine.es/varipc/verVariaciones.do?idmesini=1&anyoini=1995&idmesfin=1&anyofin=2025&ntipo=1` | 200 OK, HTML, resultado: **104,1%** (fecha anterior a 2002, **sí calcula**) |
| 16 | `GET https://www.ine.es/varipc/verVariaciones.do?idmesini=1&anyoini=1961&idmesfin=6&anyofin=2026&ntipo=1` | 200 OK, HTML, resultado: **4.717,0%** (rango máximo 1961–2026, **sí calcula**) |

## 7. Comandos reproducibles (curl)

```bash
# Metadatos de la serie
curl -s "https://servicios.ine.es/wstempus/js/ES/SERIE/IPC290751"

# Últimos 3 periodos
curl -s "https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290751?nult=3&det=0"

# Rango completo accesible (2002-presente)
curl -s "https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290751?nult=900&det=0"

# Prueba de rango pre-2002 (devuelve vacío)
curl -s "https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290751?date=19600101:19630101"

# Catálogo de tablas de la operación IPC (Id=25), muestra Anyo_Periodo_ini=1961 para la tabla 24077
curl -s "https://servicios.ine.es/wstempus/js/ES/TABLAS_OPERACION/25?det=0"

# Herramienta oficial de variaciones (HTML, parametrizada, no JSON)
curl -s "https://www.ine.es/varipc/verVariaciones.do?idmesini=1&anyoini=1961&idmesfin=6&anyofin=2026&ntipo=1"

# Prueba de código de serie inexistente (comportamiento de error)
curl -s -o /dev/null -w "%{http_code}\n" "https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC999999"
```

No se ha usado ningún token, credencial ni cabecera de autenticación en ninguna petición — confirmado que ninguno de los endpoints la requiere.

## 8. Respuestas observadas (ejemplos verificados)

```json
// DATOS_SERIE/IPC290751?nult=3
[{"COD":"IPC290751","Nombre":"Nacional. Índice general. Índice. ","FK_Unidad":133,"FK_Escala":1,
  "Data":[
    {"Fecha":1780264800000,"FK_Periodo":6,"Anyo":2026,"Valor":103.598,"Secreto":false},
    {"Fecha":1777586400000,"FK_Periodo":5,"Anyo":2026,"Valor":102.951,"Secreto":false},
    {"Fecha":1774994400000,"FK_Periodo":4,"Anyo":2026,"Valor":102.883,"Secreto":false}
  ]}]
```

Valores de índice verificados en puntos de control (misma serie `IPC290751`):

| Fecha | Valor IPC290751 |
|---|---:|
| Enero 2002 | 58,717 |
| Enero 2010 | 72,759 |
| Enero 2020 | 82,032 |
| Enero 2025 | 98,579 |
| Junio 2026 | 103,598 |

## 9. Cobertura temporal

- **Confirmada vía API JSON (`DATOS_SERIE`/`DATOS_TABLA`):** enero de 2002 – junio de 2026 (294 puntos exactos, verificado por conteo directo, invariable frente a distintos parámetros de fecha/`nult`).
- **Confirmada vía herramienta oficial `varipc` (HTML parametrizada):** enero de 1961 – junio de 2026 (el cálculo máximo probado, 1961→2026, devolvió un resultado numérico válido, `4.717,0%`).
- **Confirmada vía interfaz JAXI interactiva:** selector con 786 periodos desde `1961M01`.
- **No confirmada vía ningún mecanismo JSON/CSV/PXWeb automatizable probado en esta tarea:** el acceso machine-readable directo a los valores de índice individuales anteriores a 2002.

## 10. Granularidad

Mensual en todas las fuentes probadas — no se ha encontrado granularidad diaria ni semanal en ningún endpoint (coherente con la investigación de la arquitectura previa).

## 11. Metodología de bases y empalmes

**Hechos confirmados en esta tarea:**
- La nota oficial visible en la propia herramienta `varipc` dice literalmente: *"Los datos de los nuevos Grupos de la ECOICOP ver. 2 están disponibles desde 2002."* — esta es la explicación oficial y textual, citada directamente por el INE, de por qué la serie moderna (`IPC290751`, Grupos ECOICOP ver. 2) solo tiene datos desde 2002, y **confirma y explica** el límite encontrado empíricamente en la API JSON.
- La etiqueta "sistema IPC base 2025" que aparece en los resultados de `varipc` y en la tabla JAXI `24077` confirma que el INE ya ha aplicado un nuevo cambio de base (posterior a la base 2021 usada en la investigación de la arquitectura original), vigente en la fecha de esta tarea.
- La herramienta oficial `varipc` **sí calcula variaciones para periodos anteriores a 2002** (verificado: 1995→2025 y 1961→2026 devuelven resultados numéricos), lo que demuestra que el INE **sí dispone internamente de una serie larga enlazada** y la usa en sus propias herramientas oficiales — no es una limitación de los datos en sí, sino del canal de acceso machine-readable probado en esta tarea.
- La nota **(**)** sobre el Índice de Referencia de Arrendamientos de Vivienda (IRAV) y la Ley 12/2023, ya documentada en `SEO-ONPAGE-CALCULADORA-INFLACION-CONTENT-01`, aparece de nuevo confirmada textualmente en esta herramienta oficial.

**Respuestas a las preguntas del alcance de esta fase:**

1. **¿La serie larga está oficialmente enlazada?** Sí — evidenciado indirectamente por el hecho de que `varipc` calcula correctamente variaciones que cruzan el cambio de base de 2002 (p. ej. 1995→2025) sin que el usuario tenga que hacer nada especial; el INE resuelve el empalme internamente.
2. **¿Puede usarse directamente el cociente `IPC_final / IPC_inicial`?** Sí, **dentro de la serie corta (2002–presente)**, ya verificado y confirmado numéricamente (sección 12). Para periodos que crucen antes de 2002, la fórmula sigue siendo válida en principio (es la misma que usa `varipc` internamente), pero **esta tarea no ha podido obtener los valores de índice brutos pre-2002 de forma estructurada** para aplicarla de forma independiente — solo se ha podido reproducir el resultado final ya calculado por el INE a través de `varipc`.
3. **¿Hay periodos que no deban compararse directamente?** No se ha encontrado ninguna advertencia oficial en ese sentido dentro de las fuentes consultadas en esta tarea (más allá de la nota ya conocida sobre ECOICOP ver. 2 desde 2002, que es informativa, no una prohibición de comparar).
4. **¿Existe una serie homogénea oficial?** Sí, aparentemente sí (la tabla larga JAXI `24077`, "Base 2025"), pero su acceso estructurado JSON/CSV directo no se ha logrado confirmar en esta tarea.
5. **¿La calculadora oficial del INE usa esta misma serie?** Todo indica que sí — `varipc` y la tabla JAXI comparten el mismo título ("Índice general nacional. Series desde enero de 1961") y la misma base declarada ("Base 2025").
6. **¿Debe mostrarse una advertencia metodológica al usuario?** Sí, se recomienda mantener la ya diseñada en la arquitectura (`content.methodologyList`/`limitationsList`), añadiendo que los datos anteriores a 2002 (si se incorporan en el futuro) proceden de una serie enlazada por el propio INE, no de un empalme manual del proyecto.
7. **¿Qué referencia debe mostrarse como fuente?** "Instituto Nacional de Estadística (INE) — Índice de Precios de Consumo, Índice General Nacional", con enlace a `https://www.ine.es/jaxiT3/Tabla.htm?t=24077` (tabla larga) para el rango completo, o a la serie `IPC290751` vía API para el rango 2002–presente.

**No se ha empalmado ni extrapolado ningún dato manualmente en esta tarea** — se ha usado exclusivamente la serie enlazada oficial (`varipc`) para verificar valores agregados, sin construir ninguna serie propia.

## 12. Comparación de series (Fase 4)

**Resultado principal de esta fase:** no fue posible obtener, mediante ningún endpoint estructurado probado, un conjunto de valores de índice para la "serie larga" que fuera distinto de los ya disponibles en `IPC290751`. Todos los intentos de acceder a la tabla `24077` a través de la API JSON (`DATOS_TABLA`, `SERIES_TABLA`) devolvieron exactamente la misma serie corta. Por tanto, la tabla comparativa solicitada solo puede completarse dentro del periodo solapado (2002–presente), donde **ambas fuentes son la misma fuente**:

| Fecha | Serie larga (vía API JSON) | IPC290751 | Diferencia absoluta | Diferencia relativa |
|---|---:|---:|---:|---:|
| Enero 2002 | 58,717 (mismo dato) | 58,717 | 0 | 0% |
| Enero 2010 | 72,759 (mismo dato) | 72,759 | 0 | 0% |
| Enero 2020 | 82,032 (mismo dato) | 82,032 | 0 | 0% |
| Enero 2025 | 98,579 (mismo dato) | 98,579 | 0 | 0% |
| Junio 2026 | 103,598 (mismo dato) | 103,598 | 0 | 0% |

**Interpretación:** no son "dos fuentes que coinciden" en sentido estricto — son la **misma fuente numérica** accedida por el mismo endpoint, ya que no se logró aislar un canal JSON/CSV distinto para la tabla larga. La diferencia real solo podría documentarse si se obtuvieran valores pre-2002, lo cual no fue posible en esta tarea por vía estructurada.

**Comparación de variaciones (3 periodos), calculadas con `IPC290751` y verificadas contra `varipc`:**

| Periodo | Variación calculada (`IPC290751`) | Variación oficial (`varipc`) | Diferencia |
|---|---:|---:|---:|
| Ene 2002 → Ene 2025 | 67,887% → redondeado 67,9% | 67,9% | 0 |
| Ene 2002 → Jun 2026 | 76,436% (calculado: (103.598-58.717)/58.717×100) | No probado directamente en `varipc` con estas fechas exactas | — |
| Ene 2010 → Ene 2020 | 12,745% (calculado: (82.032-72.759)/72.759×100) | No probado directamente en `varipc` con estas fechas exactas | — |

## 13. Comparación con la calculadora oficial del INE (Fase 5)

| # | Fecha inicial | Fecha final | Tipo de caso | Variación oficial INE (`varipc`) | Variación calculada (`IPC290751`) | Diferencia |
|---|---|---|---|---:|---:|---:|
| 1 | Enero 2025 | Junio 2026 (últimos ~1,5 años) | Periodo reciente corto | No ejecutado en esta tarea (caso pendiente de completar en la siguiente fase) | (103.598-98.579)/98.579×100 = 5,091% | — |
| 2 | Enero 2002 | Enero 2025 (23 años) | Periodo reciente largo | **67,9%** (verificado en directo) | **67,887% → 67,9%** | **0** (coincide exactamente al redondeo) |
| 3 | Enero 1995 | Enero 2025 (cruza el cambio de base de 2002) | Cambio de base | **104,1%** (verificado en directo) | No calculable con `IPC290751` (sin dato pre-2002) | No aplicable — solo verificable vía `varipc` |
| 4 | Enero 1961 | Enero 1995 (anterior a 2002) | Anterior a 2002 | No ejecutado de forma aislada (sí incluido en el caso 5, rango máximo) | No calculable con `IPC290751` | — |
| 5 | Enero 1961 | Junio 2026 (rango máximo disponible) | Periodo máximo | **4.717,0%** (verificado en directo) | No calculable con `IPC290751` | No aplicable — solo verificable vía `varipc` |

**Fórmula utilizada:** `((IPC_final − IPC_inicial) / IPC_inicial) × 100`, idéntica en los 2 casos verificables con datos propios (caso 2), con coincidencia exacta al margen de redondeo a 1 decimal frente al resultado oficial del INE.

**Redondeo:** el INE presenta sus resultados con 1 decimal en `varipc`; el cálculo propio con los 3 decimales del índice, redondeado igual, coincide sin margen de error en el único caso donde ambas fuentes usaron el mismo dato bruto.

**Tolerancia aceptable:** 0 en los casos donde se dispone del mismo dato bruto (caso 2); indeterminada para los casos 3-5 porque no se dispuso de los valores brutos pre-2002 para hacer el cálculo independiente — solo se pudo verificar el resultado final ya calculado por el INE, no reproducirlo desde cero.

**No se ha dado por válida ninguna fuente solo por responder HTTP 200** — el hallazgo central de esta tarea (endpoint 9, tabla 12) es precisamente que varias respuestas 200 OK contenían datos idénticos/insuficientes pese a parecer, por su URL o su metadato declarado, que deberían cubrir un rango distinto.

## 14. Errores y endpoints descartados

- `GET /jaxiT3/files/t/es/json/268.json` → **HTTP 500**, descartado.
- `GET /jaxiT3/files/t/es/json/24075.json` → **HTTP 500**, descartado.
- Variaciones de query string (`?L=0`, `?nocab=1&L=0`, `?tip=AM`, `?p=1961`) sobre `jaxiT3/files/t/es/json/24077.json` → sin efecto, siempre el mismo archivo de 294 puntos; descartado como vía para obtener el rango completo.
- `GET /wstempus/js/ES/DATOS_SERIE/IPC999999` (código inventado) → HTTP 404 con página HTML de error (no JSON) — documentado como comportamiento de error real de la API, relevante para el manejo de errores de la futura implementación (la API no siempre devuelve JSON en caso de error).
- No se ha intentado reconstruir el protocolo POST del formulario interactivo de JAXI (`Datos.htm`) para seleccionar los 786 periodos manualmente — se ha descartado por su complejidad y porque equivaldría a una forma de automatización frágil no oficialmente documentada como API, más cercana a scraping de formulario que a un endpoint estructurado, lo cual está fuera de las fuentes permitidas para esta tarea.

## 15. Riesgos

1. **No se ha confirmado ningún canal JSON/CSV/PXWeb oficial para los datos brutos pre-2002** — sigue siendo una incertidumbre técnica real, no resuelta por este spike.
2. **La tabla `24077` en `wstempus` declara `Anyo_Periodo_ini:"1961"` pero no lo cumple en la práctica** — riesgo de que una futura implementación confíe en ese metadato sin volver a verificar el rango real de datos devueltos.
3. **El único mecanismo verificado que sí calcula correctamente el rango 1961-presente (`varipc`) es HTML, no JSON**, y devuelve solo el resultado agregado (%) entre dos fechas, no la serie completa de valores de índice mensuales — no es apto para poblar un dataset local de forma eficiente (requeriría cientos de peticiones HTML, una por cada mes, con parsing de HTML, lo cual se acerca a scraping y contradice la arquitectura recomendada de dataset estático limpio).
4. **Posible cambio de base futuro** — el hecho de que ya exista una "Base 2025" (más reciente que la "Base 2021" documentada en la arquitectura original) confirma que el INE puede rebasear de nuevo, lo que obligaría a revalidar los identificadores de serie periódicamente.
5. **Revisiones históricas** no verificadas directamente en esta tarea (mismo riesgo ya documentado en la arquitectura, sin evidencia adicional).

## 16. Recomendación del rango

**Rango recomendado para la primera versión: B. Enero de 2002 – presente.**

**Justificación basada en evidencia:**
- Es el único rango con **datos brutos verificados, accesibles vía JSON estructurado, sin autenticación, reproducibles y estables** (`DATOS_SERIE/IPC290751`).
- El propio INE documenta y explica textualmente por qué este es el punto de partida natural de la serie moderna homogénea ("Grupos ECOICOP ver. 2... desde 2002").
- El rango 1961–2002, aunque demostrablemente calculable por el INE en su propia herramienta oficial, **no tiene un canal machine-readable confirmado en esta tarea** — incorporarlo ahora obligaría a depender de scraping de HTML del formulario `varipc` (frágil, no recomendado, fuera de las fuentes permitidas) o de un mecanismo aún no identificado.
- El coste de mantenimiento, la facilidad de validación y el volumen del dataset son netamente mejores con el rango 2002–presente (294 puntos, ~9 KB) que con un hipotético dataset 1961–presente construido de forma no oficialmente estructurada.
- Desde el punto de vista de experiencia de usuario y valor SEO, un rango de 24 años (2002–2026) ya cubre ampliamente la intención de búsqueda dominante identificada ("calcular inflación entre dos fechas", "actualizar el valor de una cantidad") para la inmensa mayoría de casos de uso reales de un usuario particular.
- El riesgo de errores se minimiza al no depender de ningún parsing de HTML ni de un endpoint no confirmado.

**El rango 1961–2002 queda documentado como ampliación futura posible**, condicionada a un nuevo spike específico (fuera del alcance de esta tarea) que identifique un canal JSON/CSV/PXWeb oficial confirmado para esos datos, o a una decisión explícita de aceptar un mecanismo de obtención distinto (p. ej., solicitud directa al INE, o scraping puntual y documentado del formulario `varipc` con las debidas salvedades) — **decisión que no se toma en esta tarea**.

## 17. Decisiones pendientes

1. Confirmar si se acepta el rango 2002–presente como definitivo para la primera versión, o si se prioriza un nuevo spike para intentar acceder al rango 1961–2002 antes de implementar.
2. Si en el futuro se decide incorporar el rango 1961–2002, decidir el mecanismo de obtención (contacto directo con el INE, nueva búsqueda de un endpoint no encontrado en este spike, o aceptación explícita de un mecanismo menos ideal).
3. Confirmar que la cita de fuente en la UI use la tabla `24077`/serie `IPC290751` con su nombre oficial completo.
4. Todas las decisiones pendientes ya listadas en el ADR original (cadencia de actualización, shape de analytics, persistencia de modo en URL, decimales) siguen abiertas y no se han resuelto en esta tarea.

## 18. Recomendación sobre aprobación del ADR

**No se recomienda aceptar el ADR todavía.** El spike confirma y refuerza la decisión arquitectónica de fondo (dataset estático versionado, sin dependencia en tiempo real), pero dos condiciones del ADR original siguen sin cumplirse: (a) el rango histórico inicial debe fijarse explícitamente en 2002–presente con esta evidencia, y (b) sigue pendiente la aprobación explícita del usuario sobre las decisiones de la sección 17 y las ya listadas en el ADR. Se recomienda que el usuario revise esta evidencia y, si la acepta, autorice el cambio de estado del ADR a "Aceptado" en una interacción explícita separada — no como parte automática del cierre de esta tarea.

## 19. Siguiente tarea única

Si el usuario aprueba el rango 2002–presente y acepta el ADR: `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-DATASET-01` (crear el script de generación del dataset versionado y el dataset inicial, con sus tests, según la Fase 5 de la arquitectura). Si el usuario prefiere primero agotar la investigación del rango 1961–2002: un spike adicional específico para ese propósito, no iniciado en esta tarea.
