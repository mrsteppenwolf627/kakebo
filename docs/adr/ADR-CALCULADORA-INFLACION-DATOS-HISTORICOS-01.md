# ADR — Arquitectura de datos para el cálculo histórico de inflación

**Estado:** Propuesto — **no aceptado**. Requiere aprobación explícita del usuario antes de iniciar cualquier implementación.
**Fecha:** 2026-07-16
**Tarea de origen:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-ARCHITECTURE-01`
**Documento de soporte:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_ARCHITECTURE_01.md`

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

- Script `scripts/update-ipc-dataset.ts` (propuesto, no creado) que consulta `GET https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290751` (serie verificada en directo durante esta tarea), valida la respuesta y regenera el dataset versionado con sus metadatos (`generatedAt`, `coverage`, `source`, `license`).
- Ejecución **manual** o vía **workflow de CI disparado manualmente** — explícitamente **no** un cron job automático en esta fase, conforme a la restricción de la tarea de origen.
- Cadencia recomendada: mensual (ideal, alineado con la publicación mensual del IPC) o trimestral (mínimo aceptable) — a confirmar por el usuario.

## Estrategia de validación

- El script de actualización debe rechazar sobrescribir el dataset si detecta huecos mensuales, valores duplicados, o un rango de cobertura que retroceda respecto al dataset anterior.
- Antes de fusionar cualquier actualización del dataset a `main`, deben pasar los tests automatizados: ausencia de huecos/duplicados, comparación con al menos 5 casos oficiales del INE (`https://www.ine.es/varipc/`) dentro del margen de redondeo documentado por el propio INE, y regresión del modo de proyección existente (mismos resultados que hoy para los mismos inputs).
- Cualquier cambio en el dataset se revisa como un PR normal, con el diff del propio JSON visible para auditoría humana antes de aprobar.

## Condiciones para aprobar la implementación

1. Resolver, mediante un spike de investigación corto y sin código de producción, si la serie larga del IPC (1961–presente) es accesible de forma machine-readable a través de la API JSON del INE, o si el rango inicial se limita a 2002–presente de forma deliberada y documentada.
2. Aprobación explícita del usuario sobre las decisiones pendientes listadas en el documento de soporte (rango histórico inicial, cadencia de actualización y responsable, tratamiento de eventos de analytics, persistencia del modo en la URL, decimales de presentación).
3. Aprobación explícita de este ADR (cambio de estado de "Propuesto" a "Aceptado") por parte del usuario.
4. Ninguna tarea de implementación (`HISTORICAL-DATASET-01`, `HISTORICAL-LOGIC-01`, `HISTORICAL-UI-01`, `HISTORICAL-QA-01`, `HISTORICAL-LAUNCH-01`) debe iniciarse antes de que se cumplan los 3 puntos anteriores.
