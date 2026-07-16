# SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-ARCHITECTURE-01 — Arquitectura del cálculo histórico

**Tarea:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-ARCHITECTURE-01`
**Tipo:** Investigación, arquitectura y documentación. **Sin implementación de código.**

## 1. Objetivo y alcance

Diseñar, validar y documentar la arquitectura técnica para añadir un segundo modo — "Inflación histórica entre dos fechas con datos oficiales de España" — a `/herramientas/calculadora-inflacion`, manteniendo el modo actual (proyección futura con tasa manual) y sin crear una URL nueva. Esta tarea es exclusivamente de investigación y documentación: no se ha modificado ningún archivo de `src/`, no se ha implementado ningún cálculo histórico, no se ha creado ninguna API route ni cron job, y no se ha añadido ninguna dependencia.

## 2. Commit base

`f88feffe8c97dfaaedfe18a076b7254aec515ea3` (`seo: reforzar enlaces internos a calculadora de inflación`, `SEO-ONPAGE-CALCULADORA-INFLACION-INTERNAL-LINKING-01`), rama `main`, sincronizada con `origin/main` al iniciar.

---

## FASE 1 — Auditoría del sistema actual

### 1.1 Archivos que implementan la calculadora actual

- `src/app/[locale]/(landing)/herramientas/calculadora-inflacion/page.tsx` (148 líneas) — route, `generateMetadata`, schema JSON-LD (`SoftwareApplication`, `FAQPage`, `DefinedTerm`), `BreadcrumbList`, renderiza `<Navbar />`, `<CalculatorInflation />`.
- `src/components/landing/tools/CalculatorInflation.tsx` (465 líneas) — único componente cliente (`"use client"`) que contiene estado, inputs, fórmula, gráfico, CTA y todo el contenido SEO/GEO.
- `messages/es.json` / `messages/en.json`, namespace `Tools.Inflation` — todas las cadenas de texto (meta, header, inputs, results, chart, cta, content, FAQ).
- `src/components/landing/tools/EmbedModal.tsx` — modal de embebido compartido con otras herramientas, recibe `toolPath` como prop.
- `src/lib/analytics.ts` — wrapper de tracking (`analytics.track`), usado con eventos `tool_viewed`, `use_inflation_calculator`, `click_tool_to_app`, `tool_interaction`.

### 1.2 Separación actual de responsabilidades

| Capa | Estado actual |
|---|---|
| **Presentación** | Mezclada con el estado y la lógica en `CalculatorInflation.tsx` — no hay separación de componentes de presentación pura |
| **Estado** | 4 `useState` locales (`isEmbedOpen`, `savings`, `inflationRate`, `years`) + 1 `useRef` (`hasTrackedUse`), todo dentro del mismo componente |
| **Lógica matemática** | Inline dentro del cuerpo del componente (líneas ~39-55 antes de esta tarea), recalculada en cada render, **no extraída a una función pura ni a un archivo separado** |
| **Traducciones** | Correctamente separadas en `messages/{es,en}.json`, namespace `Tools.Inflation`, consumidas vía `useTranslations`/`t.rich` |
| **Analytics** | Inline dentro de los `onChange`/`onClick` de los inputs y CTA, sin abstracción adicional |
| **Tests** | **No existen tests para este componente ni para ninguna calculadora del proyecto** (`calculadora-ahorro`, `regla-50-30-20` tampoco tienen tests). El proyecto usa Vitest + Testing Library (`vitest.config.ts`, jsdom, umbral de cobertura 80% global) pero el directorio `src/__tests__/` no contiene ningún test bajo `landing/tools/` |

### 1.3 Fórmula exacta utilizada actualmente

```
Para cada año i de 0 a years:
  realValue(i) = savings / (1 + inflationRate/100) ^ i

finalRealValue = realValue(years)
totalLost = savings - finalRealValue
lostPercentage = (totalLost / savings) * 100   // mostrado con 1 decimal
```

Es una **proyección matemática pura hacia adelante** con una tasa de inflación **constante e introducida manualmente por el usuario** — no consulta ningún dato real, ni pasado ni presente.

### 1.4 Tipos de datos usados actualmente

Ninguno declarado explícitamente (no hay `interface`/`type` propios); los estados son primitivos (`number`) inferidos por TypeScript. El array `data` para el gráfico se construye con `Array.from` y un objeto anónimo `{ year, name, nominal, real, lost }`, sin tipo nombrado.

### 1.5 Dependencias relevantes ya presentes en el proyecto (reutilizables sin añadir nada nuevo)

- `zod` (`^4.3.6`) — ya instalado, ideal para la capa de validación de inputs del modo histórico (rangos de fecha, cantidades).
- `recharts` (`^3.6.0`) — ya usado en el gráfico actual; reutilizable para visualizar la serie histórica.
- `next-intl` (`^4.8.3`) — ya usado para ES/EN; el patrón `t.rich` con renderers de enlace ya se usa en este mismo componente (tarea `CONTENT-01`).
- `Intl.NumberFormat` (nativo) — ya usado para formato monetario; no se necesita ninguna librería de fechas (`date-fns`, `dayjs`) para trabajar solo con granularidad mes/año.

### 1.6 Limitaciones actuales para añadir un segundo modo

1. No existe ningún mecanismo de estado para alternar entre "modos" (no hay tabs, no hay routing por query param, no hay contexto).
2. La lógica de cálculo no está aislada — añadir una segunda fórmula obligaría a mezclar aún más lógica dentro del mismo componente si no se refactoriza primero.
3. No existe ninguna fuente de datos históricos en el proyecto (ni dataset local, ni cliente HTTP, ni caché) — se parte de cero en este aspecto.
4. El componente ya mide 465 líneas; añadir un segundo modo sin dividirlo en subcomponentes degradaría la mantenibilidad.
5. No hay tests que sirvan de red de seguridad contra regresiones del modo actual al modificar el componente.

### 1.7 Componentes/patrones reutilizables identificados

- El patrón `t.rich(...)` con renderers de enlace (`externalLink`) introducido en `SEO-ONPAGE-CALCULADORA-INFLACION-CONCATENATED-TEXT-01`/`CONTENT-01` es directamente reutilizable para enlazar la nueva sección histórica a fuentes oficiales del INE.
- El patrón `sr-only` para separación textual (misma tarea) debería replicarse en cualquier bloque de resultados nuevo para no repetir el problema de textos concatenados.
- `EmbedModal` es reutilizable tal cual (recibe `toolPath`, no depende del modo).
- El esqueleto de `page.tsx` (metadata, schema, `BreadcrumbList`) no necesita cambios estructurales; como mucho, ampliaciones aditivas del schema (fuera de esta tarea).

### 1.8 Riesgos de regresión identificados

- Cualquier refactor que extraiga la lógica actual a una función pura debe reproducir exactamente `data`, `finalRealValue`, `totalLost`, `lostPercentage` para no romper el modo existente (ya cubierto por textos ya corregidos en tareas anteriores — un cambio de fórmula alteraría los `results.lossText`/`realText` ya redactados).
- Si se introduce un selector de modo, debe preservarse el `id` de los inputs actuales (`savings-input`, `inflation-input`, `years-input`) si el modo por defecto sigue siendo "Proyección futura", para no romper posibles integraciones externas (`EmbedModal`, iframes) ni tracking histórico en GA4 basado en esos IDs.
- Los eventos de analytics actuales (`tool_viewed`, `use_inflation_calculator`) usan `tool_name: "calculadora_inflacion"` sin distinguir modo — si se mantiene así tras el cambio, se perderá la capacidad de medir qué modo se usa más; si se añade un parámetro nuevo, hay que decidirlo explícitamente (ver Fase 5.16).

---

## FASE 2 — Investigación de datos oficiales

Toda la información de esta fase proviene de **fuentes oficiales verificadas en directo** (llamadas reales a la API pública del INE y lectura de páginas oficiales de `ine.es`) durante esta tarea, salvo que se indique explícitamente como hipótesis o pendiente de verificar.

### 2.1 Fuente oficial identificada: API JSON del INE (Tempus3)

- **Documentación oficial:** `https://www.ine.es/dyngs/DAB/index.htm` (Datos abiertos → API JSON).
- **Especificación OpenAPI/Swagger:** `https://www.ine.es/OpenAPI/includes/files/es/wstempus.yaml` — **verificado**: define los servidores base `https://servicios.ine.es/wstempus/js/ES` y `https://servicios.ine.es/wstempus/js/EN`, con endpoints `GET /DATOS_SERIE/{IdSERIE}`, `GET /SERIE/{IdSERIE}`, `GET /DATOS_TABLA/{IdTABLA}`, `GET /SERIES_TABLA/{IdTABLA}`, entre otros.
- **Autenticación:** **verificado** — ninguna. Es una API pública sin API key; cualquier petición GET bien formada devuelve datos directamente.
- **Licencia de reutilización:** **verificado** — CC BY-SA 4.0 (declarado en la página de documentación de la API JSON del INE).
- **Formatos:** JSON (nativo de Tempus3), y también CSV/PC-Axis/XLSX a través de otros mecanismos de descarga de INEbase (no de la misma API JSON, sino de los exportadores de tabla clásicos).

### 2.2 Prueba directa realizada contra la API (verificado en esta tarea)

```
GET https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/24077?nult=3&det=0
→ 200 OK
[{"COD":"IPC290751","Nombre":"Nacional. Índice general. Índice. ","FK_Unidad":133,"FK_Escala":1,
  "Data":[
    {"Fecha":1780264800000,"FK_TipoDato":1,"FK_Periodo":6,"Anyo":2026,"Valor":103.598,"Secreto":false},
    {"Fecha":1777586400000,"FK_TipoDato":1,"FK_Periodo":5,"Anyo":2026,"Valor":102.951,"Secreto":false},
    {"Fecha":1774994400000,"FK_TipoDato":1,"FK_Periodo":4,"Anyo":2026,"Valor":102.883,"Secreto":false}
  ]}]
```

Esto confirma en directo:
- Serie `IPC290751` = "Nacional. Índice general. Índice." (índice general nacional, base vigente).
- Periodicidad **mensual** (`FK_Periodo` 4/5/6 = abril/mayo/junio).
- 3 decimales.
- **El último dato disponible en la fecha de esta investigación (2026-07-16) es junio de 2026** — confirma un desfase de publicación de aproximadamente un mes, coherente con el calendario público de difusión del IPC.

```
GET https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290751?nult=900&det=0
→ 294 registros, desde enero de 2002 hasta junio de 2026 (294 = 24 años × 12 + 6, verificado por conteo)
```

**Hallazgo verificado importante:** la serie `IPC290751` (índice general nacional, base vigente actual) **solo contiene datos desde enero de 2002**. Antes de esa fecha, esta serie concreta no tiene datos (petición `date=19600101:19630101` devolvió `Data: []`, verificado).

### 2.3 Serie histórica larga (1961–presente)

Búsqueda y verificación adicional confirman que el INE publica, en su navegador de tablas clásico (`jaxiT3`, sistema PC-Axis), una tabla específica: **"Índice general nacional. Series desde enero de 1961"** (`https://www.ine.es/jaxiT3/Tabla.htm?t=24077`), **verificado en directo**: la página, servida por `ine.es`, contiene un selector de periodo con opciones desde `1961M01` hasta el mes más reciente, etiquetado como "Base 2025" en el momento de la consulta, con un total de 786 periodos disponibles.

- Existe también la tabla equivalente de tasas de variación: "Tasa de variación del índice general nacional. Series desde enero de 1961" (tabla `24075`).
- Existe una tercera tabla asociada, `268`, con el mismo título — probablemente una versión/base anterior de la misma tabla larga.

**Importante — hecho verificado vs. pendiente de verificar:**
- **Verificado:** la tabla larga (1961–presente) existe, es oficial, y el INE la mantiene activamente ("Base 2025" sugiere que el INE reindexa/actualiza esta tabla larga cada vez que cambia de base, aplicando el empalme metodológicamente).
- **Verificado:** el identificador `24077` usado en `DATOS_TABLA/24077` de la API **wstempus (JSON)** apunta a la serie corta `IPC290751` (2002–presente), **no** a la tabla larga 1961–presente del navegador `jaxiT3`. Los espacios de identificadores del sistema clásico `jaxiT3`/PC-Axis y de la API moderna `wstempus` **no son intercambiables directamente**, pese a compartir el número "24077" por coincidencia aparente.
- **Pendiente de verificar antes de implementar:** el identificador de serie/tabla exacto que expone la tabla larga (1961–presente) **a través de la API JSON `wstempus`** (si existe uno) no se ha confirmado en esta tarea. Es la única incógnita técnica relevante que queda abierta y debe resolverse en un spike corto antes de aprobar la implementación (ver sección "Condiciones para aprobar la implementación" del ADR).

### 2.4 Granularidad

- **Mensual**, confirmada como la periodicidad nativa de la serie (`FK_Periodicidad`). El INE no ofrece IPC diario ni semanal.
- También existen "medias anuales" como tabla derivada (`https://www.ine.es/dynt3/inebase/index.htm?padre=8435&capsel=8435`), pero para el caso de uso de esta calculadora (comparar dos fechas concretas) la granularidad mensual es la correcta y suficiente.

### 2.5 Fecha inicial disponible

- Serie corta (base vigente, acceso confirmado vía API JSON): **enero de 2002**.
- Serie larga (base 2025, navegador clásico, acceso vía API JSON no confirmado): **enero de 1961**.
- Anterior a 1961 existen índices históricos con nombres distintos ("Índices del Coste de la Vida", bases 1936-39, 1958, 1968) documentados en la "Síntesis histórica y metodológica de los Índices de Precios" del INE, pero **fuera del alcance recomendado** para esta funcionalidad (ver Fase 4.2, rango recomendado).

### 2.6 Frecuencia de actualización

Mensual, coherente con el calendario de publicación del IPC (el dato de un mes se publica aproximadamente a mediados del mes siguiente; verificado indirectamente por el hecho de que, a fecha 2026-07-16, el último dato disponible era junio de 2026).

### 2.7 Revisiones históricas

No verificado directamente en esta tarea (requeriría comparar dos snapshots temporales de la misma serie), pero es conocido y documentado por el propio INE que el dato "avance" de cada mes puede sufrir pequeñas revisiones en publicaciones posteriores. **Se documenta como riesgo** (Fase 8), no como hecho verificado con evidencia propia.

### 2.8 Disponibilidad y estabilidad técnica

**Verificado en esta tarea:** las 6 peticiones realizadas contra `servicios.ine.es` y `www.ine.es` respondieron todas con HTTP 200, sin errores, sin necesidad de reintentos, con tiempos de respuesta aceptables para uso puntual. No se ha realizado una prueba de carga ni de disponibilidad a largo plazo (fuera de alcance de esta tarea).

### 2.9 Condiciones de reutilización

CC BY-SA 4.0 — reutilización libre, incluso comercial, citando la fuente y compartiendo bajo la misma licencia si se redistribuye el dataset derivado. Compatible con mostrar los datos en la calculadora citando al INE como fuente (ya es una práctica establecida en el proyecto desde `SEO-ONPAGE-CALCULADORA-INFLACION-CONTENT-01`).

### 2.10 Posibilidad de automatización

Alta: al ser una API JSON pública sin autenticación, es trivialmente automatizable desde un script de build o un job programado, sin necesidad de credenciales ni de gestionar secretos.

### 2.11 Qué ocurre cuando todavía no existe dato para el último mes

Verificado indirectamente: la API simplemente no devuelve un registro para ese periodo (no hay un valor `null` para el mes en curso; el último registro disponible es el último mes efectivamente publicado). La aplicación debe tratar "fecha final = mes actual sin dato aún" limitando el rango seleccionable al último dato realmente disponible, no asumiendo que el mes en curso tiene dato.

### 2.12 Diferencias metodológicas entre periodos, bases y empalmes de series

**Verificado (por búsqueda de fuentes oficiales, no por lectura completa del PDF metodológico):**
- El IPC español ha cambiado de base varias veces (bases históricas 1936-39, 1958, 1968; y bases modernas hasta 2021 y, aparentemente, una "Base 2025" ya vigente en la tabla larga a fecha de esta investigación).
- Antes de 1976 el indicador se llamaba "Índices del Coste de la Vida", no IPC.
- En enero de 2002 hubo una "renovación metodológica completa" del IPC (nuevo sistema de cálculo, ponderaciones actualizadas con mayor frecuencia).
- El INE publica una síntesis técnica oficial ("Síntesis histórica y metodológica de los Índices de Precios", PDF en `ine.es`) que documenta el empalme entre bases — **no se ha leído el documento completo en esta tarea**; se recomienda hacerlo como parte del spike técnico antes de implementar, para no reinventar la metodología de empalme cuando el INE ya la resuelve en su tabla larga oficial.
- **Implicación de diseño clave:** no se debe intentar empalmar manualmente índices de bases distintas multiplicando series por separado. Se debe usar la tabla larga ya empalmada por el propio INE (sección 2.3) como fuente única para el rango histórico completo, evitando así introducir un error metodológico propio.

---

## FASE 3 — Comparación de arquitecturas

### 3.1 Alternativas evaluadas

- **A. Dataset estático versionado en el repositorio** — se descarga una vez (manual o por script) la serie completa del INE y se versiona como JSON/TS dentro de `src/`, actualizándose mediante un PR puntual cuando se decide refrescar.
- **B. Descarga periódica automatizada + generación de dataset local** — un script (ejecutado en CI o manualmente) vuelve a descargar la serie del INE con cierta cadencia y regenera el dataset versionado, pero **sigue siendo estático en tiempo de ejecución** (no hay llamada a la API en producción).
- **C. Consulta en tiempo real a la API del INE desde el servidor** (Route Handler / Server Component) en cada petición o build.
- **D. Modelo híbrido** — dataset local (como A/B) + actualización programada (como B) + *fallback* controlado si en el futuro se decide añadir una consulta puntual opcional (p. ej. para el último mes) sin que sea una dependencia crítica del render principal.

### 3.2 Matriz comparativa

| Criterio | A. Estático versionado | B. Descarga periódica + dataset local | C. Tiempo real desde servidor | D. Híbrido |
|---|---|---|---|---|
| Fiabilidad | Alta (no depende de nada externo en runtime) | Alta | Media (depende de disponibilidad del INE en cada request/build) | Alta |
| Rendimiento | Excelente (dato local, SSG posible) | Excelente | Peor (latencia de red externa) | Excelente |
| Dependencia externa | Ninguna en runtime | Ninguna en runtime (solo en el job de actualización) | Alta, en cada render | Ninguna en runtime; opcional en un fallback futuro |
| Complejidad | Baja | Media (requiere script/job) | Media-alta (manejo de errores de red, timeouts, caché) | Media |
| Mantenimiento | Manual, requiere disciplina para actualizar | Automatizado, requiere mantener el job | Ninguno de dataset, pero sí de resiliencia ante fallos | Medio |
| Actualización | Manual (PR) | Automática (cadencia definida) | Instantánea (siempre el último dato) | Automática, con posibilidad de forzar lo más reciente en el futuro |
| Caché | No aplica (ya es local) | No aplica | Necesaria (ISR/`revalidate`, o caché en memoria) | No aplica para el dataset base |
| Coste | Cero | Cero (solo minutos de CI) | Cero monetario, pero consumo de cuota/latencia | Cero |
| Privacidad | Sin problema (dato público agregado) | Sin problema | Sin problema | Sin problema |
| SEO/renderizado | Óptimo (SSG/ISR total, HTML completo en el primer render) | Óptimo | Peor si se bloquea el render esperando la API externa | Óptimo |
| Riesgo de caída | Ninguno (el sitio no depende del INE para funcionar) | Ninguno | Alto — una caída del INE rompe la funcionalidad en vivo | Ninguno (el fallback es opcional, no crítico) |
| Facilidad de test | Alta (dataset fijo, deterministe) | Alta | Baja (hay que mockear red, manejar flakiness) | Alta |
| Adecuación al proyecto | Alta — coherente con el resto del sitio (contenido estático/SSG, sin backend propio de datos) | Alta | Baja — el proyecto no tiene precedente de dependencias externas críticas en el render de páginas públicas | Alta |

### 3.3 Arquitectura recomendada: **D (Híbrido), con énfasis en A/B como base**

Se recomienda un **dataset estático versionado dentro del repositorio** (como A), generado y refrescado mediante un **script de actualización periódico** (como B, pero ejecutado manualmente o vía un workflow de CI disparado a mano — no un cron job en producción, que está explícitamente excluido de esta tarea), **sin ninguna consulta a la API del INE en tiempo real durante el render de la página en producción**. Se etiqueta como "híbrido" (D) porque dentro del propio dataset se documenta una fecha de última actualización y una fuente, dejando la puerta abierta a que, en una fase posterior y opcional, se evalúe un mecanismo de fallback no crítico (p. ej. mostrar un aviso "datos hasta [mes]" si el dataset lleva mucho tiempo sin actualizarse) — pero **sin introducir ninguna llamada de red bloqueante para el usuario**.

**Motivos:**
1. **Coherencia con el proyecto:** todo el contenido público de `metodokakebo.com` es SSG/ISR sin backend de datos externos en el camino crítico de render; la calculadora de ahorro y la de la regla 50/30/20 tampoco dependen de servicios externos.
2. **Cero dependencia crítica en tiempo real** (requisito explícito de la tarea) — si el INE cae, cambia de URL o modifica el formato de su API, la calculadora sigue funcionando con el último dataset válido.
3. **Rendimiento y SEO óptimos** — el HTML se sirve completo sin esperar a ninguna API externa, evitando el problema ya detectado en `VALIDATION_01` de que el gráfico Recharts actual no se renderiza en el HTML inicial; no se debe repetir ese patrón con los nuevos datos históricos.
4. **Testabilidad** — un dataset fijo permite tests deterministas y reproducibles, incluyendo la comparación exacta con ejemplos oficiales del INE (Fase 4.6).
5. **No se selecciona la opción más compleja (C)** de forma automática, conforme a la instrucción explícita de la tarea; se prioriza estabilidad y mantenimiento simple.

---

## FASE 4 — Definición del cálculo

### 4.1 Inputs

1. Cantidad inicial (`amount`): número positivo, en euros.
2. Fecha inicial: mes + año (`monthFrom`, `yearFrom`).
3. Fecha final: mes + año (`monthTo`, `yearTo`).

### 4.2 Reglas

- La fecha final debe ser **posterior o igual** a la fecha inicial (si son iguales, el resultado es 0% de variación, caso trivial pero válido).
- **Rango disponible recomendado:** enero de 2002 hasta el último mes publicado, usando la serie corta ya confirmada como accesible vía API JSON (`IPC290751`). El rango 1961–2001 queda **fuera del alcance de la primera implementación**, documentado como ampliación futura condicionada a resolver la incógnita de la sección 2.3 (acceso machine-readable a la tabla larga). Esta es una decisión de alcance, no una limitación técnica insalvable.
- Meses sin dato: si el usuario selecciona un mes-año para el que no existe todavía dato publicado (p. ej. el mes en curso), la interfaz debe impedir la selección (deshabilitar esas opciones) en lugar de fallar en el cálculo.
- Último dato publicado: debe leerse dinámicamente del propio dataset (su fecha máxima), no hardcodearse en el código, para que sea la actualización del dataset (Fase 5.9-5.11) la que mueva el límite superior automáticamente.
- Valores nulos: no deberían producirse en el dataset final (validado en el propio proceso de generación, Fase 5.6), pero la capa de validación de inputs debe rechazar explícitamente un cálculo si el índice de alguna de las dos fechas no está presente en el dataset, en lugar de calcular con `undefined`/`NaN`.
- Importes negativos o cero: rechazados por validación (`amount > 0`), con mensaje de error, igual que ya ocurre implícitamente en el modo actual (el input tiene `min="0"` pero no bloquea 0; se recomienda corregir este mismo matiz también en el modo histórico, sin tocar el modo actual en esta tarea).
- Límites de cantidad: se recomienda un máximo razonable (p. ej. 100.000.000 €) solo para evitar overflow de formato visual, no por motivo de negocio.
- Redondeo: ver 4.5.

### 4.3 Outputs

1. **Inflación acumulada** entre las dos fechas (%).
2. **Valor equivalente final** — cuánto necesitarías hoy (fecha final) para tener el mismo poder adquisitivo que la cantidad inicial tenía en la fecha inicial.
3. **Pérdida o ganancia de poder adquisitivo** de esa cantidad si se mantiene fija (no actualizada) durante el periodo — expresado en % y en €.
4. **Diferencia monetaria** absoluta entre el importe nominal y el importe ajustado.
5. **Periodo analizado** (fechas exactas, mes y año, en ambos extremos).
6. **Fuente y fecha de actualización** de los datos usados (metadato del propio dataset, mostrado siempre junto al resultado).

### 4.4 Fórmulas matemáticas — y distinción explícita entre los 4 conceptos pedidos

Sea `IPC_inicial` el índice del mes/año inicial y `IPC_final` el índice del mes/año final (ambos de la misma serie, mismo tipo de dato, verificado que existan en el dataset).

**a) Evolución del nivel de precios (inflación acumulada, %):**
```
inflacion_acumulada (%) = ((IPC_final - IPC_inicial) / IPC_inicial) × 100
```
Esta es exactamente la fórmula oficial que ya usa el INE (documentada y verificada en `SEO-ONPAGE-CALCULADORA-INFLACION-CONTENT-01`, sección de fuentes del INE) para "¿Cuánto ha variado el IPC desde...?".

**b) Cantidad necesaria en la fecha final para conservar el poder adquisitivo (actualización de una renta/cantidad):**
```
cantidad_actualizada = cantidad_inicial × (IPC_final / IPC_inicial)
```
Es la misma fórmula que el INE usa para actualizar rentas de alquiler (ya documentada y enlazada en `content.rentText` desde `CONTENT_01`), aplicada aquí a una cantidad genérica, no solo a una renta.

**c) Valor equivalente de una cantidad histórica expresado en euros de la fecha final ("cuánto valen hoy X euros de [año]"):**
Es el mismo cálculo que (b): `cantidad_inicial × (IPC_final / IPC_inicial)`. Conceptualmente es la misma fórmula, pero conviene presentarla como una pregunta distinta en la UI/copy porque el usuario la formula de otra manera ("¿cuánto valen hoy 1.000€ de 2010?" en vez de "actualiza mi renta").

**d) Pérdida de poder adquisitivo de una cantidad que permanece fija (no se actualiza):**
```
valor_real_final = cantidad_inicial / (IPC_final / IPC_inicial)
perdida_eur = cantidad_inicial - valor_real_final
perdida_pct (%) = (perdida_eur / cantidad_inicial) × 100
```
Esta es la fórmula conceptualmente equivalente al modo actual de la calculadora (proyección futura), pero aplicada con la variación **real** del IPC entre dos fechas en vez de una tasa constante estimada por el usuario.

**Distinción clave que debe quedar clara en la UI/copy (Fase 6):** (a) mide cuánto han subido los precios; (b)/(c) responden "cuánto necesito hoy para lo mismo" o "cuánto vale hoy una cantidad de entonces" (misma fórmula, dos preguntas); (d) responde "cuánto he perdido si no hice nada con mi dinero" — son las 4 formulaciones habituales que la keyword research (`calcular inflación entre dos fechas`, `actualizar el valor de una cantidad`, `comparar poder adquisitivo`) confirma que los usuarios buscan indistintamente.

### 4.5 Ejemplos verificables

Usando datos reales obtenidos en esta tarea (`IPC290751`): IPC junio 2026 = 103,598; IPC abril 2026 = 102,883 (ambos verificados por API en directo, sección 2.2).

**Ejemplo 1 — inflación acumulada abril→junio 2026:**
```
((103.598 - 102.883) / 102.883) × 100 = 0,695 %
```

**Ejemplo 2 — actualización de una cantidad de 1.000 € entre abril y junio 2026:**
```
1.000 × (103.598 / 102.883) = 1.006,95 €
```

**Ejemplo 3 — pérdida de poder adquisitivo de 1.000 € mantenidos fijos entre abril y junio 2026:**
```
valor_real = 1.000 / (103.598 / 102.883) = 993,10 €
pérdida = 1.000 - 993,10 = 6,90 €  (0,69 % aprox.)
```

Estos tres ejemplos son matemáticamente consistentes entre sí (la pérdida en (d) y la ganancia en (b) son simétricas respecto al mismo cociente de índices, como corresponde) y usan datos reales verificados, no inventados — cumpliendo el requisito de "ejemplos verificables" y de coherencia matemática exigido en la validación final.

### 4.6 Precisión

- **Decimales internos:** mantener el índice IPC con los 3 decimales que publica el INE (`Decimales: 3`, verificado en el metadato de la serie); no redondear antes de dividir.
- **Redondeo presentado:** 1 decimal para porcentajes (coherente con el modo actual, que ya usa `toFixed(1)`); 0 o 2 decimales para importes en €, a decidir en Fase 6 (se recomienda 2 decimales para el modo histórico, dado que aquí los importes pueden ser más sensibles que en la proyección orientativa actual).
- **Formato monetario:** reutilizar `Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" })`, igual que el modo actual.
- **Porcentaje:** con signo explícito (+/-) para dejar claro si hubo ganancia o pérdida real de poder adquisitivo (relevante en periodos de deflación puntual, que existen en la serie histórica del IPC español).
- **Tratamiento de índices:** el cociente `IPC_final / IPC_inicial` no debe redondearse intermedio; solo el resultado final se redondea para presentación (igual que documenta el propio INE en su página de actualización de rentas, sección 2.12).

### 4.7 Comparación con la calculadora oficial del INE

**Estrategia de verificación propuesta (no ejecutada aún, es un test a implementar):**
1. Tomar como mínimo 5 pares de fechas dentro del rango 2002–presente.
2. Calcular el resultado con la fórmula propuesta usando el dataset local.
3. Reproducir el mismo cálculo manualmente contra la herramienta oficial del INE "¿Cuánto ha variado el IPC desde...?" (`https://www.ine.es/varipc/`), verificada como accesible en esta tarea (redirige a `varipc/index.do`, herramienta interactiva oficial).
4. Confirmar que la diferencia entre ambos resultados es 0 o está dentro del margen de redondeo a 3 decimales que el propio INE documenta como su margen de tolerancia (verificado textualmente en `SEO-ONPAGE-CALCULADORA-INFLACION-CONTENT-01`, fuente INE: *"el resultado puede diferir en algunos decimales, debido al redondeo"*).
5. Documentar los 5 casos y sus resultados en el propio código de test (Fase 7.9), no solo en este documento, para que sea una comparación reproducible en CI.

---

## FASE 5 — Arquitectura de software

**Todo lo siguiente es una propuesta de diseño, no implementada. Ningún archivo listado aquí ha sido creado ni modificado en esta tarea.**

### 5.1 Nuevos archivos necesarios (propuesta)

```
src/lib/inflation/
  types.ts                     — tipos TypeScript compartidos
  formulas.ts                  — funciones puras de cálculo (proyección Y histórico)
  historical-dataset.ts        — carga y acceso tipado al dataset (import estático JSON)
  validation.ts                — esquemas zod para inputs de ambos modos
  data/ipc-nacional-es.json    — dataset versionado (serie IPC290751, generado por script)
  data/ipc-nacional-es.meta.json — metadatos: fuente, fecha de generación, rango cubierto, licencia

scripts/
  update-ipc-dataset.ts        — script de generación/actualización del dataset (ejecución manual o CI, no cron)

src/components/landing/tools/
  CalculatorInflationHistorical.tsx   — subcomponente del modo histórico (inputs de fecha, resultado)
  CalculatorInflationModeSwitch.tsx   — selector de modo (pestañas), opcional si se decide extraerlo

src/__tests__/lib/inflation/
  formulas.test.ts
  validation.test.ts
  historical-dataset.test.ts
```

### 5.2 Archivos existentes que se modificarían (en la implementación futura, no en esta tarea)

- `src/components/landing/tools/CalculatorInflation.tsx` — se convertiría en un contenedor que orquesta el selector de modo y delega en dos subcomponentes (el actual, extraído tal cual a `CalculatorInflationProjection.tsx`, y el nuevo `CalculatorInflationHistorical.tsx`), reutilizando `formulas.ts` para la parte de proyección también (extrayendo la fórmula actual de forma literal, sin cambiarla).
- `messages/es.json` / `messages/en.json` — nuevas claves bajo `Tools.Inflation.historical.*` y `Tools.Inflation.modeSwitch.*`, sin tocar las claves existentes.
- `src/app/[locale]/(landing)/herramientas/calculadora-inflacion/page.tsx` — sin cambios obligatorios; opcionalmente, ampliar el schema `SoftwareApplication.featureList` para mencionar el nuevo modo (cambio aditivo, fuera de alcance de esta tarea de diseño).

### 5.3 Tipos TypeScript propuestos

```typescript
// src/lib/inflation/types.ts
export interface IpcDataPoint {
  year: number;
  month: number; // 1-12
  value: number; // índice, 3 decimales
}

export interface IpcDataset {
  source: string;        // "INE - Índice de Precios de Consumo (IPC290751)"
  sourceUrl: string;     // URL oficial del INE
  license: string;       // "CC BY-SA 4.0"
  generatedAt: string;   // ISO date del momento de generación del dataset
  coverage: { from: { year: number; month: number }; to: { year: number; month: number } };
  points: IpcDataPoint[];
}

export interface HistoricalInflationInput {
  amount: number;
  from: { year: number; month: number };
  to: { year: number; month: number };
}

export interface HistoricalInflationResult {
  accumulatedInflationPct: number;
  updatedAmount: number;
  realValueIfKeptFixed: number;
  purchasingPowerLossPct: number;
  purchasingPowerLossEur: number;
  period: { from: string; to: string }; // formateado para presentación
  sourceMeta: Pick<IpcDataset, "source" | "sourceUrl" | "generatedAt">;
}

export type CalculatorMode = "projection" | "historical";
```

### 5.4 Formato del dataset (propuesta)

JSON plano, importado estáticamente (no `fetch` en runtime), indexable por `year*100+month` para búsqueda O(1) en un `Map` construido una vez al cargar el módulo. Tamaño estimado: ~294 puntos actuales (2002–2026) × ~30 bytes ≈ 9 KB sin comprimir — impacto de bundle despreciable (ver 5.18).

### 5.5 Funciones puras de cálculo

`formulas.ts` exportaría, como funciones puras sin estado ni efectos (fácilmente testeables):

```typescript
export function calculateProjection(savings: number, rate: number, years: number): ProjectionResult[]
export function calculateHistoricalInflation(dataset: IpcDataset, input: HistoricalInflationInput): HistoricalInflationResult
export function findIpcValue(dataset: IpcDataset, year: number, month: number): number | undefined
```

`calculateProjection` sería la extracción literal de la lógica ya existente (sin cambios de comportamiento), solo movida de dentro del componente a este módulo, para poder testearla igual que la nueva.

### 5.6 Capa de validación

`validation.ts` con esquemas `zod` (ya instalado, sin nueva dependencia):

```typescript
export const historicalInputSchema = z.object({
  amount: z.number().positive().max(100_000_000),
  from: z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }),
  to: z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }),
}).refine(/* to >= from */).refine(/* ambas fechas dentro de dataset.coverage */);
```

También validaría, en el propio script `update-ipc-dataset.ts`, que el dataset generado no tenga huecos mensuales ni valores `null`/duplicados antes de sobrescribir el archivo versionado (evita publicar un dataset corrupto).

### 5.7 Capa de presentación

Componentes de presentación "tontos" (reciben `result` ya calculado por props, sin lógica), replicando el patrón de separación de resultados ya usado (bloques con `sr-only` para separación textual, mismo estilo visual `bg-red-50`/`bg-stone-50` que el modo actual para consistencia).

### 5.8 Integración con traducciones ES/EN

Nuevas claves bajo el mismo namespace `Tools.Inflation`, con la misma convención de `t.rich` + tags personalizados para enlaces (`ipcLink`, `varipcLink`, ya usados) que se reutilizarían para citar la fuente del dataset en el propio resultado, no solo en el contenido editorial.

### 5.9 Estrategia de actualización del dataset

Script `scripts/update-ipc-dataset.ts` (Node, ejecutable con `tsx`/`ts-node`, ya disponible en el proyecto vía Next.js toolchain) que:
1. Llama a `GET https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290751?nult=<N>&det=0`.
2. Valida la respuesta (sin huecos, formato esperado).
3. Escribe `data/ipc-nacional-es.json` y `data/ipc-nacional-es.meta.json` (con `generatedAt: new Date().toISOString()`).
4. Se ejecuta **manualmente** o mediante un workflow de CI **disparado manualmente** (no automático/cron, conforme a la restricción explícita de esta tarea) — la cadencia recomendada se define en la Fase 8.8, pero su activación queda fuera del alcance aprobado hasta que se decida explícitamente.

### 5.10 Control de versión de los datos

El dataset se versiona como cualquier otro archivo del repositorio (commit + PR), lo que da trazabilidad completa vía `git log`/`git blame` de cada actualización — sin necesidad de un sistema de versionado de datos adicional.

### 5.11 Fecha de última actualización

Se lee del propio `ipc-nacional-es.meta.json` (`generatedAt`) y se muestra en la UI junto al resultado (ya contemplado como output en 4.3.6), reutilizando el patrón de "fecha de última revisión" ya introducido en `content.revisionNote` (`CONTENT_01`).

### 5.12 Fallback si el dataset falla

Al ser un import estático (no una llamada de red en runtime), no hay "fallo" posible en producción salvo un error de build (que ya bloquearía el despliegue, comportamiento deseable). El único "fallback" real es de UX: si el usuario selecciona un rango fuera de `coverage`, la interfaz debe deshabilitar esas opciones antes de permitir el envío, no mostrar un error tras el cálculo.

### 5.13 Manejo de errores

- Errores de validación (`zod`) → mensaje de campo, sin bloquear el resto del formulario.
- Fecha fuera de rango → opciones deshabilitadas en el selector, con tooltip/texto explicando el rango disponible.
- Nunca debería llegar un error de "IPC no encontrado" al usuario si la validación de rango es correcta; si ocurriera (bug), se recomienda un mensaje genérico no técnico más un log a analytics para detectarlo (ver 5.16).

### 5.14 Accesibilidad

- Selector de modo: `role="tablist"`/`role="tab"` con `aria-selected`, navegable por teclado (flechas + Tab), siguiendo el patrón ya usado en el dropdown accesible de `Navbar.tsx` ("UIUX-12 accessible dropdown" mencionado en el propio código).
- Inputs de fecha: `<select>` nativo para mes/año (mejor soporte de accesibilidad y móvil que un date picker custom) con `<label>` asociado, igual que los inputs actuales.
- Resultados: aplicar el mismo patrón `sr-only` de separación textual ya validado en `CONCATENATED-TEXT-01`, desde el primer commit de este modo (evitar reintroducir el mismo problema).

### 5.15 Responsive

Sin rediseño: reutilizar la misma grid `lg:grid-cols-12` (sidebar de inputs + panel de resultados) ya validada visualmente en el modo actual.

### 5.16 Analytics

Se recomienda ampliar (no romper) los eventos existentes añadiendo un parámetro `mode: "projection" | "historical"` a `tool_viewed` y `use_inflation_calculator`, manteniendo `tool_name: "calculadora_inflacion"` igual — esto es una **decisión que requiere aprobación** porque modifica el "shape" de eventos ya en producción (ver sección de decisiones pendientes).

### 5.17 Compatibilidad con SSR/SSG

Total: al ser el dataset un import estático de JSON, es compatible sin cambios con el modelo actual de la página (Server Component en `page.tsx` + Client Component `CalculatorInflation*.tsx`). El dataset podría incluso cargarse en el Server Component y pasarse como prop serializado al cliente, evitando duplicar el JSON en el bundle de cliente si el tamaño creciera en el futuro — optimización opcional, no necesaria a 9 KB.

### 5.18 Impacto en el bundle

Estimado en **~10-15 KB** adicionales sin comprimir (dataset + lógica nueva + subcomponente), frente a los ~9 KB del dataset ya estimados en 5.4 — impacto bajo, no requiere `dynamic import` ni code-splitting adicional para el volumen actual de datos (2002–presente). Si en el futuro se incorpora la serie larga 1961–presente (~786 puntos), el tamaño seguiría siendo del orden de 25-30 KB, igualmente asumible.

---

## FASE 6 — Propuesta de experiencia de usuario

Sin diseño visual ni programación — solo interacción mínima.

1. **Estado predeterminado:** el modo "Proyección futura" permanece como modo por defecto al cargar la página (no se cambia el comportamiento actual ni la primera impresión del usuario que ya conoce la herramienta).
2. **Persistencia del modo:** no persistir entre sesiones (sin `localStorage`) para mantener la simplicidad; opcionalmente reflejar el modo en un query param (`?modo=historico`) para permitir compartir/enlazar directamente a un modo concreto sin crear una URL nueva — evaluado como mejora opcional, no obligatoria.
3. **Labels del selector:** "Proyección futura" / "Inflación histórica (datos oficiales INE)" — el segundo label debe dejar claro desde el primer vistazo que usa datos reales, diferenciándolo del primero.
4. **Mensajes de validación:** en español natural, sin jerga técnica — p. ej. "La fecha final debe ser posterior a la inicial" / "Solo hay datos disponibles hasta [mes/año]".
5. **Resultados:** mismo patrón visual de tarjetas que el modo actual (pérdida/ganancia destacada + cifra secundaria), evitando reintroducir texto concatenado (separadores `sr-only` desde el primer commit).
6. **Nota metodológica:** breve, visible junto al resultado, explicando que se usa el IPC general nacional oficial del INE y qué fórmula se aplica — sin tecnicismos innecesarios, siguiendo el tono ya establecido en `content.methodologyList`.
7. **Fuente:** enlace visible al INE (mismo patrón de enlace externo `target="_blank" rel="noopener noreferrer"` ya usado).
8. **Fecha de actualización del dataset:** visible junto al resultado, no solo al final de la página.
9. **Comportamiento móvil:** el selector de modo debe apilarse correctamente en pantallas estrechas (reutilizar breakpoints Tailwind ya usados, `sm:`/`lg:` como en el resto del componente).
10. **Navegación por teclado:** selector de modo operable con Tab + flechas + Enter/Espacio; selects de fecha nativos ya accesibles por teclado por defecto.
11. **Lectores de pantalla:** anunciar el cambio de modo (`aria-live="polite"` en la región de resultados) para que un cambio de pestaña no pase desapercibido.

**No se propone ningún rediseño completo** — la propuesta reutiliza la misma paleta, tipografía y estructura de tarjetas ya existentes.

---

## FASE 7 — Plan de tests

1. **Tests unitarios de fórmulas** (`formulas.test.ts`) — cada una de las 4 fórmulas de la Fase 4.4 probada de forma aislada con valores conocidos.
2. **Tests del dataset** (`historical-dataset.test.ts`) — sin huecos mensuales, orden cronológico, `coverage` coincide con el primer/último punto real, sin duplicados.
3. **Tests de límites temporales** — fecha fuera de rango (antes de 2002 o después del último dato), fecha final = fecha inicial (0%), fecha final anterior a la inicial (rechazado).
4. **Tests de validación** (`validation.test.ts`) — `amount` negativo/cero/no numérico rechazado; meses fuera de 1-12 rechazados; combinaciones válidas aceptadas.
5. **Tests de redondeo** — verificar que el resultado presentado coincide con el redondeo esperado a 1 decimal (%) y 2 decimales (€) sin errores de coma flotante (usar comparación con tolerancia, no igualdad estricta).
6. **Tests de traducciones** — snapshot o verificación de que todas las claves nuevas existen en `es.json` y `en.json` con la misma estructura (evitar el error ya documentado de claves faltantes que rompería `next-intl`).
7. **Tests de accesibilidad** — usando Testing Library + `jest-axe` (verificar si ya está instalado; si no, es una decisión que requeriría añadir una dependencia de test, fuera de esta tarea) o, como mínimo, tests de que los roles ARIA (`tablist`, `tab`) y `aria-selected` se comportan correctamente al cambiar de modo.
8. **Tests de integración** — render del componente completo, cambio de modo, introducción de inputs, verificación del resultado mostrado en el DOM (React Testing Library, patrón ya usado en el resto del proyecto para otros módulos).
9. **Comparación con casos oficiales del INE** — los 5 pares de fechas descritos en la Fase 4.7, con los resultados oficiales anotados como comentario/fixture en el propio test, fallando el test si la implementación se desvía más del margen de redondeo documentado.
10. **Regresión del modo futuro existente** — test que verifica que `calculateProjection` extraída produce exactamente los mismos números que la implementación inline actual, para los mismos inputs (10.000€/3%/10 años → mismos resultados ya verificados en tareas anteriores: pérdida -2.559€, valor real 7.441€).

### Matriz de casos (extracto ilustrativo, a completar con los valores reales del dataset en el momento de implementar)

| # | Caso | Input | Output esperado | Tipo |
|---|---|---|---|---|
| 1 | Rango válido reciente | 1.000€, abril 2026 → junio 2026 | +0,70% aprox., 1.006,95€ (ver Fase 4.5) | Feliz |
| 2 | Fecha final = inicial | 1.000€, junio 2026 → junio 2026 | 0% variación | Límite |
| 3 | Fecha final < inicial | — | Rechazado por validación | Error |
| 4 | Fecha antes de 2002 | — | Rechazado (fuera de `coverage`) | Límite |
| 5 | Fecha futura sin dato | — | Rechazado / opción deshabilitada | Límite |
| 6 | Cantidad = 0 | 0€, cualquier rango | Rechazado por validación | Error |
| 7 | Cantidad negativa | -100€ | Rechazado por validación | Error |
| 8 | Periodo de deflación (si existe en la serie) | A determinar con dato real | % negativo mostrado correctamente con signo | Feliz (caso real) |
| 9 | Regresión modo proyección | 10.000€/3%/10 años | -2.559€ / 7.441€ (idénticos a los ya verificados) | Regresión |
| 10 | Comparación oficial INE | 5 pares de fechas documentados | Coincide dentro del margen de redondeo | Verificación externa |

---

## FASE 8 — Seguridad y mantenimiento

1. **Riesgos de depender de una fuente externa:** mitigado por la arquitectura D — no hay dependencia en tiempo real; el único momento de dependencia es al ejecutar manualmente el script de actualización.
2. **Riesgos de datos obsoletos:** el dataset puede quedar desactualizado si nadie ejecuta el script de actualización; mitigado mostrando siempre la fecha de última actualización (5.11) para que sea transparente, nunca oculto.
3. **Riesgos de interpretación errónea:** un usuario podría confundir "inflación acumulada" con "inflación media anual" — el copy debe diferenciarlo explícitamente (ya hay precedente de este cuidado en `content.accumulatedText`).
4. **Riesgos legales o financieros:** ya mitigado por el patrón de descargo ya introducido en `CONTENT_01` (`limitationsList.noAdvice`) — debe extenderse literalmente al nuevo modo, dejando claro que **no es una calculadora oficial del INE** (requisito explícito del contexto de esta tarea) aunque use sus datos.
5. **Advertencia orientativa:** reutilizar y extender el bloque de metodología/limitaciones ya existente, no crear un patrón nuevo.
6. **Detección de fallos de actualización:** dado que no hay proceso automático (excluido explícitamente de esta tarea), la detección sería manual — se recomienda documentar en `PROJECT_STATUS.md` la fecha de la última actualización del dataset como parte del checklist de mantenimiento periódico del proyecto (decisión de proceso, no técnica).
7. **Quién actualizaría el dataset:** el mismo flujo de trabajo actual del proyecto (agente/desarrollador ejecuta el script y abre un PR), sin automatización nueva en esta fase.
8. **Cadencia recomendada:** mensual o trimestral es razonable dado que el IPC se publica mensualmente pero no varía de forma crítica para esta herramienta educativa entre actualizaciones; se recomienda **trimestral como mínimo aceptable** y mensual como ideal, decisión a confirmar por el usuario.
9. **Procedimiento de rollback:** al estar versionado en git, revertir el dataset es un `git revert` del commit de actualización — no requiere ningún procedimiento especial.
10. **Procedimiento de validación antes de publicar nuevos datos:** el propio script (5.6) debe rechazar generar un archivo con huecos, valores duplicados o un rango que retroceda respecto al anterior, antes de que ese cambio pueda mezclarse a `main`.

---

## Estructura de software propuesta (resumen)

Ver Fase 5 completa. Resumen de archivos nuevos: 4 módulos de lógica (`types.ts`, `formulas.ts`, `historical-dataset.ts`, `validation.ts`) + 2 archivos de dataset versionado + 1 script de actualización + 2 componentes React nuevos + 3 archivos de test. Ningún archivo existente de `src/` se ha tocado en esta tarea.

## Archivos previstos (para la implementación futura, no creados en esta tarea)

Listados íntegramente en la Fase 5.1 y 5.2.

## División de la implementación en tareas atómicas (propuesta para el futuro, sujeta a aprobación)

1. `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-SPIKE-01` — resolver la incógnita de la sección 2.3 (ID de serie/tabla de la serie larga 1961–presente accesible vía API JSON, si existe) y leer la síntesis metodológica oficial del INE. Sin código de producción.
2. `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-DATASET-01` — crear `scripts/update-ipc-dataset.ts` y generar el dataset inicial versionado (2002–presente), con sus tests.
3. `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-LOGIC-01` — extraer `calculateProjection` de forma literal (sin cambios) y crear `calculateHistoricalInflation` + validación + tests unitarios (Fases 4 y 7.1-7.5).
4. `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-UI-01` — construir el selector de modo y `CalculatorInflationHistorical.tsx`, integrando traducciones ES/EN, accesibilidad y analytics (Fases 5.7-5.16, 6).
5. `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-QA-01` — tests de integración, comparación con casos oficiales del INE, verificación de regresión del modo actual, revisión de accesibilidad (Fase 7.6-7.10).
6. `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-LAUNCH-01` — actualización de schema/metadata (aditiva), documentación final y cierre.

## Decisiones que requieren aprobación explícita del usuario

1. **Confirmar el rango histórico inicial** (2002–presente) frente a esperar a resolver el acceso a la serie larga (1961–presente) antes de lanzar la primera versión.
2. **Cadencia de actualización del dataset** (mensual vs. trimestral) y quién es responsable de ejecutarla.
3. **Si se modifica el "shape" de los eventos de analytics existentes** (añadir `mode` a `tool_viewed`/`use_inflation_calculator`) o se crean eventos nuevos separados para no tocar el histórico de datos ya recogido.
4. **Si se persiste el modo seleccionado en la URL** (`?modo=historico`) o no.
5. **Decimales de presentación monetaria** en el modo histórico (2 decimales propuesto vs. 0 como en el modo actual).
6. **Aprobación del ADR** (`docs/adr/ADR-CALCULADORA-INFLACION-DATOS-HISTORICOS-01.md`) — permanece en estado "Propuesto" hasta que el usuario lo apruebe explícitamente.
7. **Autorización para iniciar la implementación** — ninguna de las tareas atómicas listadas debe comenzar sin aprobación explícita, conforme al "STOP OBLIGATORIO" de esta tarea.

## Siguiente tarea única recomendada

`SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-SPIKE-01` — spike de investigación corto (sin código de producción) para resolver la única incógnita técnica pendiente: el identificador de serie/tabla que expone la serie larga del IPC (1961–presente) a través de la API JSON del INE, y lectura de la síntesis metodológica oficial de empalme de bases. Una vez resuelto, y con aprobación explícita del ADR y de las decisiones pendientes listadas arriba, podría comenzar `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-DATASET-01`.
