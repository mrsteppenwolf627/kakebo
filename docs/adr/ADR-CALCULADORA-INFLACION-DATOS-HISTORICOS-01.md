# ADR — Arquitectura de datos para el cálculo histórico de inflación

**Estado:** **ACEPTADO**
**Fecha de creación:** 2026-07-16
**Fecha de aceptación:** 2026-07-16
**Tarea de origen:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-ARCHITECTURE-01`
**Tarea de spike:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-SPIKE-01`
**Tarea de aceptación:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-DATASET-01`
**Documentos de soporte:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_ARCHITECTURE_01.md`, `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_SPIKE_01.md`, `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_DATASET_01.md`

## Decisión aprobada por el usuario (2026-07-16)

El usuario aprueba explícitamente, con este alcance exacto:

- Rango histórico de la primera versión: **enero de 2002 – presente**.
- Fuente: serie oficial **`IPC290751`** del INE.
- Canal: **API JSON Tempus3** (`https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290751`) como fuente estructurada.
- Los datos permanecen **versionados dentro del repositorio** (`src/lib/inflation/data/ipc-nacional-es.json`).
- **Cero llamadas al INE durante el uso normal de la calculadora** — el dataset se genera/actualiza únicamente mediante `scripts/update-ipc-dataset.ts`, ejecutado de forma manual o vía CI disparado a mano.
- **Enero de 1961 – diciembre de 2001** queda excluido de esta versión, como **ampliación futura no resuelta** (sin canal estructurado confirmado, ver `HISTORICAL_SPIKE_01.md`).

Como consecuencia de esta aprobación, este ADR pasa de **Propuesto** a **ACEPTADO** con el alcance exacto arriba descrito. El dataset y el script de actualización correspondientes se implementaron en `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-DATASET-01` — ver `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_DATASET_01.md` para el detalle completo de la implementación, validaciones ejecutadas y resultados.

**No implementado todavía por esta aceptación** (fuera de alcance de `HISTORICAL-DATASET-01`, corresponde a tareas futuras): UI, selector de modo histórico, campos de fecha, fórmula de cálculo de inflación/pérdida de poder adquisitivo, componentes React, traducciones, eventos de analytics.

## Condición de revisión de este ADR

Este ADR debe revisarse (no necesariamente revertirse) si ocurre cualquiera de estos eventos:

1. **Cambio de base del INE** que altere el código de la serie `IPC290751` (detectado automáticamente por el script: aborta si `COD` devuelto no coincide con el esperado).
2. **Desaparición o cambio de contrato** del endpoint `https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290751` (detectado por el script: aborta ante HTTP no-200, contenido no-JSON, o formato de respuesta inesperado).
3. **Aparición de un canal oficial estructurado** (JSON/CSV/PXWeb) para la serie larga 1961–2001, que permitiría ampliar el rango sin depender de HTML no estructurado.

## Evidencia nueva aportada por el spike (`HISTORICAL-SPIKE-01`)

- **Confirmado:** el rango 2002–presente (serie `IPC290751`, endpoint `GET /wstempus/js/ES/DATOS_SERIE/IPC290751`) es accesible de forma estructurada, JSON, sin autenticación, y coincide exactamente (67,9%, al margen de redondeo) con el resultado de la herramienta oficial `varipc` del INE para el caso Ene 2002 → Ene 2025.
- **Confirmado:** el INE dispone internamente de una serie enlazada 1961–presente (verificado: la herramienta oficial `varipc` calcula correctamente 1995→2025 y el rango máximo 1961→2026), pero **no se ha encontrado ningún canal JSON/CSV/PXWeb estructurado** que exponga los valores brutos de esa serie para el periodo 1961–2001. Todos los intentos sobre la tabla `24077` (que declara en su metadato `Anyo_Periodo_ini:"1961"`) devolvieron únicamente la serie corta 2002–presente.
- **Confirmado:** el propio INE documenta textualmente por qué la serie moderna empieza en 2002 (*"los datos de los nuevos Grupos de la ECOICOP ver. 2 están disponibles desde 2002"*).
- **Confirmado:** existe ya una "Base 2025" vigente (posterior a la "Base 2021" asumida en la arquitectura original), evidenciando que el INE puede rebasear de nuevo en el futuro.

## Contexto

`/herramientas/calculadora-inflacion` solo ofrece hoy una proyección futura con una tasa de inflación introducida manualmente por el usuario, sin datos reales. La investigación de keywords indica que parte relevante de la demanda de búsqueda ("calcular inflación entre dos fechas", "calcular IPC acumulado", "actualizar el valor de una cantidad", "comparar poder adquisitivo entre periodos") requiere un segundo modo que use datos oficiales españoles del IPC entre dos fechas concretas, manteniendo la URL actual y el modo existente.

El proyecto no tiene precedente de dependencias externas críticas en el render de páginas públicas: todo el contenido de `metodokakebo.com` es SSG/ISR sin backend de datos externos en el camino crítico.

## Opciones evaluadas

- **A. Dataset estático versionado en el repositorio.**
- **B. Descarga periódica automatizada que regenera un dataset local** (sigue siendo estático en runtime).
- **C. Consulta en tiempo real a la API del INE desde el servidor** en cada render/build.
- **D. Modelo híbrido:** dataset local versionado (A) + script de actualización ejecutado manualmente o vía CI disparado a mano (B), sin ninguna llamada de red en el camino crítico de render, dejando abierta la puerta a un fallback no crítico futuro.

Comparadas en 13 criterios (fiabilidad, rendimiento, dependencia externa, complejidad, mantenimiento, actualización, caché, coste, privacidad, SEO/renderizado, riesgo de caída, facilidad de test, adecuación al proyecto) — matriz completa en el documento de soporte, sección Fase 3.

## Decisión recomendada

**Opción D (modelo híbrido)**, con el dataset (A) como pieza central: un dataset JSON versionado en el repositorio, generado y actualizado mediante un script ejecutado manualmente (o vía CI disparado a mano, nunca un cron job en producción), sin ninguna consulta a la API del INE en tiempo de ejecución de la página pública.

## Motivos

1. **Coherencia arquitectónica con el resto del proyecto** — ninguna otra herramienta pública depende de un servicio externo en su camino de render.
2. **Cero dependencia crítica en tiempo real** — si el INE cambia su API, sufre una caída o modifica el formato, la calculadora sigue funcionando con el último dataset válido; nunca se rompe una página pública por un tercero.
3. **Rendimiento y SEO óptimos** — el HTML se sirve completo sin esperar ninguna llamada de red externa, evitando repetir el problema ya detectado en la auditoría original (el gráfico Recharts actual no se renderiza en el HTML inicial).
4. **Testabilidad** — un dataset fijo permite tests deterministas, reproducibles y comparables con ejemplos oficiales del INE sin mocks de red frágiles.
5. **Mantenimiento simple** — actualizar el dataset es un PR normal con revisión, revertible con `git revert`; no requiere infraestructura nueva, secretos, ni monitorización de un cron job.
6. **No se elige automáticamente la opción más compleja (C)** — se prioriza estabilidad, auditabilidad y mantenimiento sencillo, tal como exige el alcance de la tarea.

## Consecuencias positivas

- La calculadora sigue siendo 100% autosuficiente en producción, sin nuevas superficies de fallo externas.
- Los datos usados son auditables en el propio repositorio (diff de cada actualización visible en `git log`).
- El coste operativo es cero (ni infraestructura de caché, ni gestión de rate limits, ni secretos).
- Los resultados son deterministas y reproducibles en tests y en CI.
- Compatible sin cambios con SSG/ISR y con el modelo Server Component + Client Component ya usado en la página.

## Consecuencias negativas

- El dataset puede quedar desactualizado si nadie ejecuta el script de actualización — mitigado mostrando siempre la fecha de última actualización junto al resultado.
- El rango histórico inicial recomendado (2002–presente, ver sección "Riesgos") es más corto que el rango completo que el INE ofrece en su tabla larga (1961–presente), porque el acceso machine-readable a esa serie larga vía la API JSON no se ha confirmado todavía.
- Cualquier revisión posterior de un dato del INE (revisiones históricas del IPC, documentadas como práctica habitual de institutos estadísticos) no se reflejará en el sitio hasta la siguiente actualización manual del dataset.

## Riesgos

1. **Rango histórico limitado en la primera versión** (2002–presente) frente a la demanda de búsqueda que podría incluir fechas anteriores — mitigable en una fase posterior si se resuelve el acceso a la serie larga.
2. **Dataset desactualizado** si el proceso de actualización manual no se ejecuta con la cadencia acordada.
3. **Interpretación errónea por parte del usuario** de "inflación acumulada" vs. "inflación media anual" — mitigado con copy explícito, ya validado como patrón en `SEO-ONPAGE-CALCULADORA-INFLACION-CONTENT-01`.
4. **Percepción de "calculadora oficial del INE"** — debe quedar explícito en el copy que la herramienta usa datos oficiales pero no es una herramienta del INE ni ofrece asesoramiento financiero o legal (mismo patrón de descargo ya existente).
5. **Incógnita técnica pendiente** (ver "Condiciones para aprobar la implementación") sobre el identificador exacto de la serie larga en la API JSON — no bloquea la decisión arquitectónica en sí, pero sí condiciona el alcance del rango histórico de la primera versión.

## Estrategia de actualización

- Script `scripts/update-ipc-dataset.ts` (**creado en `HISTORICAL-DATASET-01`**) que consulta `GET https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290751`, valida la respuesta y regenera el dataset versionado (`src/lib/inflation/data/ipc-nacional-es.json`) con sus metadatos (`updatedAt`, `coverageStart`/`coverageEnd`, `source`, `license`).
- Ejecución **manual** o vía **workflow de CI disparado manualmente** — explícitamente **no** un cron job automático en esta fase, conforme a la restricción de la tarea de origen.
- Cadencia recomendada: mensual (ideal, alineado con la publicación mensual del IPC) o trimestral (mínimo aceptable) — a confirmar por el usuario.

## Estrategia de validación

- El script de actualización debe rechazar sobrescribir el dataset si detecta huecos mensuales, valores duplicados, o un rango de cobertura que retroceda respecto al dataset anterior.
- Antes de fusionar cualquier actualización del dataset a `main`, deben pasar los tests automatizados: ausencia de huecos/duplicados, comparación con al menos 5 casos oficiales del INE (`https://www.ine.es/varipc/`) dentro del margen de redondeo documentado por el propio INE, y regresión del modo de proyección existente (mismos resultados que hoy para los mismos inputs).
- Cualquier cambio en el dataset se revisa como un PR normal, con el diff del propio JSON visible para auditoría humana antes de aprobar.

## Rango recomendado (actualizado tras el spike)

**Enero de 2002 – presente**, usando la serie `IPC290751` vía `GET https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290751`. El rango 1961–2002 queda excluido de la primera versión por ausencia de un canal estructurado confirmado, no por falta de relevancia — ver `HISTORICAL_SPIKE_01.md` sección 16 para la justificación completa basada en evidencia.

## Fuente estructurada recomendada

`GET https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290751?nult=<N>&det=0` — API JSON pública del INE (Tempus3), sin autenticación, licencia CC BY-SA 4.0, verificada en directo en dos tareas independientes (`HISTORICAL-ARCHITECTURE-01` y `HISTORICAL-SPIKE-01`).

## Incertidumbres resueltas

- El rango real de datos accesibles vía JSON estructurado (2002–presente, no 1961–presente pese a la declaración de metadatos de la tabla `24077`).
- La explicación oficial de por qué 2002 es el punto de partida de la serie moderna.
- La coincidencia exacta de la fórmula propuesta con el resultado oficial del INE, verificada con datos reales.

## Incertidumbres pendientes

- Canal machine-readable oficial para los valores brutos del IPC entre 1961 y 2001 (no encontrado; posible ampliación futura, requiere nuevo spike o contacto directo con el INE).
- Todas las decisiones pendientes ya listadas en el documento de arquitectura (cadencia de actualización y responsable, tratamiento de eventos de analytics, persistencia del modo en la URL, decimales de presentación) — ninguna resuelta por el spike, siguen abiertas.

## Condiciones para aprobar la implementación (histórico — todas satisfechas al aceptar este ADR)

1. ~~Resolver si la serie larga (1961–presente) es accesible de forma machine-readable~~ — **resuelto por el spike**: no lo es dentro de las fuentes investigadas; el rango inicial queda fijado en 2002–presente de forma deliberada y documentada.
2. ~~Aprobación explícita del usuario sobre el rango 2002–presente como definitivo para la primera versión~~ — **satisfecho**: aprobado explícitamente por el usuario (ver "Decisión aprobada por el usuario" arriba).
3. Aprobación explícita del usuario sobre el resto de decisiones pendientes (cadencia de actualización y responsable, tratamiento de eventos de analytics, persistencia del modo en la URL, decimales de presentación) — **siguen pendientes**, no forman parte del alcance aprobado para `HISTORICAL-DATASET-01`; deberán resolverse antes de las tareas de UI/lógica de cálculo.
4. ~~Aprobación explícita de este ADR~~ — **satisfecho**: estado cambiado a ACEPTADO el 2026-07-16.
5. Ninguna tarea de implementación de UI, fórmula de cálculo, componentes React, traducciones o analytics debe iniciarse sin resolver primero el punto 3.
