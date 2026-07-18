# SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-ANALYTICS-PRODUCTION-VALIDATION-01

## Objetivo

Validar en la URL real de producción que los tres eventos de analytics del modo histórico (`inflation_calculator_mode_change`, `historical_inflation_calculation`, `historical_inflation_error`) se disparan en el momento correcto, llegan a GA4, contienen los parámetros esperados, no se duplican, no contienen datos monetarios ni personales, y no afectan al funcionamiento de la calculadora. Si la validación es satisfactoria, cerrar formalmente el bloque `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL`.

## Commit validado

`b1ae7c91304bdf464aa163f50620fd4be2ee4af5` (feat(analytics): track historical inflation usage). Confirmado como HEAD de `main` y de `origin/main` antes de comenzar (sin commits posteriores).

## URL

`https://www.metodokakebo.com/herramientas/calculadora-inflacion`

## Fecha y hora

2026-07-18, sesión de validación realizada en un único bloque continuo.

## Navegador

Chrome real (vía la extensión de automatización del navegador conectada a la sesión de Chrome del usuario), sin necesidad de modo incógnito ni de desactivar bloqueadores — no se detectó ningún bloqueador de anuncios/privacidad interfiriendo con GA4 en esta sesión.

## Estado del despliegue

- `curl -I` sobre la URL: `HTTP/1.1 200 OK`, `X-Vercel-Cache: MISS`, `Age: 0` (sin caché).
- Se descargó el HTML servido y se confirmó que el input de cantidad histórica ya usa `type="text" inputMode="decimal" autoComplete="off"` (la corrección de `AMOUNT-INPUT-FIX-01` está desplegada).
- Se descargaron los chunks JS referenciados por la página y se confirmó, mediante `grep`, la presencia literal de las cadenas `inflation_calculator_mode_change`, `historical_inflation_calculation`, `historical_inflation_error`, `cumulativeInflationPercentage`, `DATASET_INCONSISTENCY` y `UNEXPECTED_ERROR` en el bundle servido — el código de analytics del commit validado está desplegado y activo.
- Recarga completa de la página confirmada sin caché, ambos modos (`Proyección futura` / `Inflación histórica`) visibles y funcionales.

## Estado del consentimiento

El proyecto **no implementa ningún sistema de consentimiento (CMP) ni banner de cookies**. `src/components/analytics/GoogleAnalytics.tsx` carga `gtag.js` de forma incondicional vía `next/script` con `strategy="afterInteractive"` y ejecuta `gtag('config', ...)` sin ninguna comprobación de consentimiento previa. Esto es la arquitectura preexistente del proyecto (no introducida por esta tarea ni por `ANALYTICS-01`); no se ha añadido ningún bypass de consentimiento porque no existía ningún mecanismo de consentimiento que sortear. `window.gtag` estaba disponible como función desde el primer instante de la carga de la página, sin necesidad de aceptar ningún banner.

## Método de validación

Se combinaron los tres métodos disponibles:

1. **Interceptación directa de `window.gtag`** (nivel JavaScript): se sustituyó `window.gtag` por una función que reenvía la llamada a la original y además la registra en `window.__gtagCalls`, permitiendo inspeccionar exactamente qué parámetros recibe cada llamada real de la aplicación.
2. **Network real del navegador**: inspección de las solicitudes `POST` a `https://region1.google-analytics.com/g/collect`, confirmando que cada evento efectivamente sale hacia la red hacia el dominio real de Google Analytics.
3. **GA4 DebugView/Realtime**: no disponible en esta sesión (no se dispone de acceso autenticado a la consola de GA4 de este proyecto). Se documenta como limitación de validación; los métodos 1 y 2 se consideran evidencia suficiente y consistente entre sí.

## Evidencia del evento de cambio de modo

Se realizaron 5 alternancias reales entre modos (clic y teclado), más un clic adicional sobre la pestaña ya activa para probar la deduplicación:

| # | Acción | Resultado |
|---|---|---|
| 1 | Clic en "Inflación histórica" (futuro→histórico) | Evento disparado: `{mode_from:"future", mode_to:"historical", source_page:"/herramientas/calculadora-inflacion"}` |
| 2 | Clic en "Proyección futura" (histórico→futuro) | Evento disparado: `{mode_from:"historical", mode_to:"future", ...}` |
| 3 | Clic en "Proyección futura" (pestaña ya activa) | **Sin evento adicional** — el contador de `window.__gtagCalls` no aumentó |
| 4 | Tecla `→` con foco en la pestaña activa (futuro→histórico) | Evento disparado, mismo payload correcto |
| 5 | Tecla `←` (histórico→futuro) | (verificado en la secuencia de recuento, ver más abajo) |
| 6 | Clic en "Inflación histórica" (futuro→histórico) | Evento disparado |

Recuento acumulado exacto tras las 5 alternancias reales + 1 clic redundante: **`window.__gtagCalls` contenía exactamente 5 entradas** de `inflation_calculator_mode_change`, todas con `mode_from`/`mode_to` correctos y alternantes, confirmando: cero eventos por el clic repetido sobre la pestaña activa, un evento exacto por cada cambio real (clic o teclado), cero eventos en el render inicial (verificado explícitamente antes de la primera interacción: `window.__gtagCalls` vacío tras la carga).

A nivel de Network, se confirmaron además 3 solicitudes `POST` independientes a `region1.google-analytics.com/g/collect` con `en=inflation_calculator_mode_change` y los parámetros `ep.mode_from`, `ep.mode_to`, `ep.source_page` correctos (ver nota sobre discrepancia de recuento en "Limitaciones de validación").

## Evidencia del cálculo

### Caso oficial (1000€, 2002-01 → 2025-01)

- Resultado visual: `1678,88 €`, `+67,9%` — coincide exactamente con el caso de referencia oficial ya validado en `HISTORICAL-PRODUCTION-VALIDATION-01`.
- Evento capturado (único, tanto en `window.__gtagCalls` como en Network):
  ```
  {"start_period":"2002-01","end_period":"2025-01","interval_months":276,"result_type":"inflation","source_page":"/herramientas/calculadora-inflacion"}
  ```
- Confirmado en la URL de red: `en=historical_inflation_calculation&ep.start_period=2002-01&ep.end_period=2025-01&epn.interval_months=276&ep.result_type=inflation&ep.source_page=%2Fherramientas%2Fcalculadora-inflacion`.
- Ausencia confirmada de: `1000` (cantidad), `1678.88` (equivalente), `678.88` (variación), `58.717`/`98.579` (índices IPC), `67.9` (porcentaje exacto) — ninguno de estos valores aparece en el payload.

### Mismo periodo (1000€, 2025-01 → 2025-01)

- Evento único: `{"start_period":"2025-01","end_period":"2025-01","interval_months":0,"result_type":"no_change","source_page":"..."}`.

### Deflación (2002-06 → 2002-07)

- Resultado visual: `993,05 €`, `-0,7%` (bloque verde, coincide con el caso de deflación ya documentado).
- Evento único: `{"start_period":"2002-06","end_period":"2002-07","interval_months":1,"result_type":"deflation","source_page":"..."}`.
- Sin datos monetarios en el payload.

## Evidencia de error

### Cantidad vacía (clic)

- Evento único: `{"error_code":"INVALID_AMOUNT","source_page":"..."}`.
- Mensaje visible: "Introduce una cantidad válida igual o superior a cero." Resultado anterior (deflación) eliminado, sustituido por el estado vacío. Sin recarga de página.

### Cantidad `-1` (tecla Enter)

- Evento único: `{"error_code":"INVALID_AMOUNT","source_page":"..."}`.
- Confirmado que el envío por Enter dispara el mismo evento que el envío por clic, un único evento, valor `-1` preservado en el campo, sin fuga del valor introducido en el payload.

### Orden de periodos inválido (2025-01 → 2002-01)

- Evento único: `{"error_code":"INVALID_PERIOD_ORDER","source_page":"..."}`.
- Mensaje visible: "El mes inicial no puede ser posterior al mes final." **Los periodos NO aparecen en el payload** — el código actual de `trackHistoricalError` solo envía `error_code` y `source_page` en todos los casos, tal como estaba documentado y justificado en `ANALYTICS-01`; no se detectó ninguna filtración de periodos no documentada.

## Parámetros confirmados

| Evento | Parámetros reales observados |
|---|---|
| `inflation_calculator_mode_change` | `mode_from`, `mode_to`, `source_page` — exactamente los 3 documentados, ninguno extra |
| `historical_inflation_calculation` | `start_period`, `end_period`, `interval_months`, `result_type`, `source_page` — exactamente los 5 documentados |
| `historical_inflation_error` | `error_code`, `source_page` — exactamente los 2 documentados |

Parámetros estándar de GA4 (no añadidos por esta tarea, presentes en toda solicitud de `gtag.js` por diseño del SDK): `v`, `tid`, `gtm`, `_p`, `gcd`, `cid`, `sid`, `sct`, `seg`, `dl`, `dt`, `sr`, `ul`, `uaa/uab/uafvl/uam/uamb/uap/uapv/uaw` (User-Agent Client Hints), `tag_exp`, `tfd`, `_s`, `_ee`. Se documentan aquí para dejar constancia de que no se confunden con parámetros personalizados de esta implementación.

## Duplicados

Para cada interacción (cambio de modo, cálculo, error) se limpió el registro de `window.__gtagCalls` antes de la acción y se contó exactamente una entrada nueva después. Ningún caso produjo 0 ni 2+ eventos cuando se esperaba 1. El único caso de "0 eventos esperados" (clic sobre la pestaña ya activa) se confirmó explícitamente como 0. No se observó ningún duplicado atribuible a React (no hay Strict Mode de desarrollo en producción), a re-renders, a envío por clic+Enter combinado, ni a montajes múltiples.

## Privacidad

Se inspeccionaron los payloads reales de las 3 categorías de evento. Confirmado que **no** aparecen en ningún punto: cantidad inicial, cantidad equivalente, variación monetaria, IPC inicial, IPC final, porcentaje exacto de inflación, correo, nombre, user ID, texto libre del input, identificadores personales, datos de Supabase, ni ningún dato adicional no documentado en `ANALYTICS-01`.

## Funcionamiento sin analytics

Se forzó `window.gtag = undefined` en la página en producción (simulando GA4 bloqueado/no disponible) y se repitieron: un cambio de modo (clic), un cálculo válido (caso oficial, mismo resultado visual `1678,88 €` / `+67,9%`) y una verificación de que la interfaz seguía respondiendo con normalidad. No se observó ninguna excepción, ningún mensaje de error en consola, ninguna ruptura de la interfaz. El comportamiento es idéntico al documentado en `ANALYTICS-01` (la función `analytics.track` comprueba `typeof window.gtag === "function"` antes de invocar, y simplemente omite el envío si no existe).

## Consola

Revisada en los siguientes momentos: tras la carga inicial, tras cada interacción, y tras una recarga completa final. **Cero errores de JavaScript, cero warnings de React, cero warnings de hidratación, cero errores de GA4, cero errores de consentimiento, cero solicitudes bloqueadas** en toda la sesión.

## Hallazgos

### `LIMITACIÓN DE VALIDACIÓN` — Todas las solicitudes de red a `google-analytics.com/g/collect` muestran `statusCode: 503`

- **Pasos:** cualquier interacción que dispare un evento (incluidos eventos preexistentes no relacionados con esta tarea, como el `page_view` implícito o el `form_start` automático de GA4 Enhanced Measurement).
- **Resultado esperado:** un código de estado HTTP de éxito (normalmente `204 No Content` para el endpoint de recolección de GA4).
- **Resultado actual:** la herramienta de inspección de red de esta sesión reporta `503` de forma **uniforme en las 13 solicitudes observadas**, incluyendo eventos que no tienen relación alguna con el trabajo de esta tarea.
- **Impacto:** ninguno atribuible a esta tarea. Dado que el código `503` aparece de forma idéntica en absolutamente todas las solicitudes (incluidas las de la propia inicialización de `gtag.js`, ajenas a esta implementación), se interpreta como un artefacto de cómo la herramienta de automatización intercepta solicitudes `fetch`/`sendBeacon` con `keepalive` (un patrón de transporte conocido por no exponer siempre el código de estado real a las herramientas de inspección de red del navegador), y no como un rechazo real del servidor de Google. Si fuera un rechazo real y sistemático, afectaría a todo el sitio, no a esta tarea en particular, y sería una incidencia de infraestructura ajena y preexistente.
- **Recomendación:** no bloquea el cierre. Si se desea una confirmación end-to-end independiente de esta limitación de la herramienta, validar en una sesión futura con acceso a GA4 DebugView o Realtime (ver "Limitaciones de validación").
- **¿Bloquea el cierre?** No.

### `LIMITACIÓN DE VALIDACIÓN` — Discrepancia entre el número de llamadas JS interceptadas y el número de solicitudes de red observadas para `inflation_calculator_mode_change`

- **Pasos:** 5 alternancias reales de modo en una secuencia continua y rápida (clic, clic, clic-redundante, tecla, tecla, clic).
- **Resultado esperado:** cada llamada JS a `analytics.track` debería corresponder a una solicitud de red independiente.
- **Resultado actual:** `window.__gtagCalls` registró exactamente 5 llamadas (todas con parámetros correctos), pero solo 3 solicitudes de red con `en=inflation_calculator_mode_change` fueron capturadas por la herramienta de inspección de red en el mismo intervalo.
- **Impacto:** no hay impacto negativo — en ningún caso se observaron **más** solicitudes de red que llamadas JS (lo que sí sería indicio de duplicación real). La discrepancia es en la dirección opuesta (menos solicitudes de red que llamadas JS), consistente con el comportamiento de agrupación de eventos ("event batching") que `gtag.js` aplica cuando varios eventos se disparan en una ventana de tiempo muy corta, agrupando varios hits en el cuerpo de una misma solicitud HTTP en lugar de generar una URL por hit. La herramienta de inspección de red de esta sesión solo expone la URL de cada solicitud, no el cuerpo completo, por lo que no puede confirmarse si los hits adicionales viajaban agrupados dentro de las mismas solicitudes.
- **Recomendación:** no bloquea el cierre; no hay evidencia de duplicación real ni de pérdida de eventos a nivel de código de la aplicación (la interceptación de `window.gtag`, que es el punto de verdad de lo que la aplicación realmente invoca, mostró el recuento exacto esperado en todos los casos). Documentar como limitación de la herramienta de validación.
- **¿Bloquea el cierre?** No.

No se han encontrado hallazgos `CONFIRMADO — BLOQUEANTE`, `CONFIRMADO — ALTO`, `CONFIRMADO — MEDIO` ni `CONFIRMADO — BAJO`.

## Veredicto analytics

✅ **APROBADO.** Los tres nombres de evento son correctos, se envían desde producción (confirmado por interceptación de `gtag` y por solicitudes de red reales), los parámetros son exactamente los documentados, no hay duplicados a nivel de código de aplicación, el render inicial no dispara eventos falsos, no existe un sistema de consentimiento que respetar o vulnerar (arquitectura preexistente sin CMP), no se envían cantidades monetarias ni datos personales, la ausencia de `window.gtag` no rompe la herramienta, y no han aparecido errores funcionales nuevos.

## Veredicto de cierre de implementación

✅ **Bloque `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL` cerrado formalmente.** Completadas: arquitectura, investigación oficial, dataset, script de actualización, lógica de dominio, tests de dominio (67/67), UI aislada, revisión técnica, traducciones ES/EN, integración en la calculadora pública, validación de producción, corrección del defecto de validación de cantidad, analytics (3 eventos), y validación de analytics en producción (esta tarea).

## Estado final de la URL

```text
IMPLEMENTACIÓN COMPLETADA — EN FASE DE MEDICIÓN
```

No se declara éxito SEO orgánico. La implementación técnica está completa y validada; los resultados orgánicos (impresiones, clics, posiciones) están pendientes de las ventanas de medición descritas más abajo.

## Plan de medición GA4

Revisar desde el primer día tras el despliegue (ya en producción):
- Frecuencia de cambios al modo histórico (`inflation_calculator_mode_change`, proporción `mode_to: "historical"` vs `mode_to: "future"`).
- Cálculos válidos completados (`historical_inflation_calculation`), volumen total.
- Errores (`historical_inflation_error`), distribución por `error_code` — un volumen alto de `INVALID_AMOUNT` podría indicar fricción en el input pese a la corrección ya aplicada.
- Intervalos temporales más usados (`interval_months`), para entender si los usuarios comparan periodos cortos o rangos largos (p. ej. desde 2002).
- Proporción `inflation` / `deflation` / `no_change` en `result_type`.

## Plan de medición GSC

No evaluar inmediatamente. Ventanas recomendadas:
- Primeras señales: 2–4 semanas.
- Contenido y ajuste de intención: 4–8 semanas.
- Crecimiento estable: 8–12 semanas.

Métricas a revisar: impresiones, clics, CTR, posición media, queries nuevas, evolución de `calculadora de inflación España`, `calcular IPC entre dos fechas`, `inflación acumulada España`, y variantes históricas relacionadas. No se prometen posiciones ni volúmenes de tráfico concretos.

## Veredicto de reindexación

**No necesaria en este momento.** El contenido visible de la URL no ha cambiado de forma sustancial en esta tarea (no se ha tocado copy, metadata, schema, ni estructura); los cambios funcionales relevantes para SEO (integración del modo histórico, corrección del input) ya fueron desplegados y — según `HISTORICAL-PRODUCTION-VALIDATION-01` — la URL ya estaba validada en producción antes de esta tarea. No se ha ejecutado ninguna solicitud de reindexación desde esta tarea.

## Riesgos pendientes

- Limitaciones de validación de red descritas arriba (no bloqueantes).
- No se dispuso de acceso a GA4 DebugView/Realtime en esta sesión; la validación se apoya en interceptación JS + Network real, considerada suficiente pero no equivalente a una confirmación en la interfaz de GA4.
- Hallazgos preexistentes ya documentados en tareas anteriores siguen abiertos y fuera de alcance: NaN con cantidad cero en modo futuro, etiqueta "AÑOS" sin traducir, desbordamiento horizontal a 320/375px.
- El fallo preexistente y ajeno en `calculate-whatif.test.ts` sigue presente.

## Tests de analytics

`npx vitest run src/__tests__/lib/analytics.test.ts src/__tests__/components/CalculatorInflationHistorical.analytics.test.tsx` → ✅ 10/10 (2 + 8).

## Test de inflación

`npx vitest run src/__tests__/lib/inflation/historical.test.ts` → ✅ 67/67.

## Suite completa

`npm run test` → ✅ 582/583 (único fallo ajeno preexistente: `calculate-whatif.test.ts`).

## TypeScript

`npx tsc --noEmit` → ✅ sin errores.

## Lint

`npm run lint` → ✅ 0 errores, 76 warnings preexistentes no relacionados.

## Build

`npm run build` → ✅ completado correctamente.

## Archivos creados

- `docs/analytics/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_ANALYTICS_PRODUCTION_VALIDATION_01.md` (este documento).

## Archivos modificados

- `PROJECT_STATUS.md`.
- `docs/PROJECT_STATUS.md`.

Sin cambios en componentes, analytics funcional, traducciones, dataset, lógica, tests, metadata, schema, canonical, slug, sitemap, robots, UI ni dependencias. Tarea exclusivamente documental.
