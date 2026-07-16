# SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-DATASET-01 — Dataset histórico oficial del IPC

**Tarea:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-DATASET-01`
**Tipo:** Implementación de datos e infraestructura de actualización. **Sin UI, sin fórmula de cálculo, sin analytics.**

## 1. Objetivo

Crear un dataset local, oficial, versionado y reproducible con la serie mensual del IPC general nacional del INE desde enero de 2002 hasta el último dato publicado, junto con un mecanismo seguro y reproducible para actualizarlo desde la API oficial del INE. Sin implementar todavía el cálculo histórico ni modificar la interfaz de la calculadora.

## 2. Decisión aprobada

El usuario aprobó explícitamente (recogido y documentado en el ADR): rango 2002–presente, serie `IPC290751`, API JSON Tempus3 como fuente, dataset versionado en el repositorio, cero llamadas al INE en runtime, y exclusión provisional de 1961–2001. El ADR (`docs/adr/ADR-CALCULADORA-INFLACION-DATOS-HISTORICOS-01.md`) se actualizó de **Propuesto** a **ACEPTADO** en esta tarea, con fecha de aceptación 2026-07-16.

## 3. Fuente utilizada

- **Serie:** `IPC290751` — "Nacional. Índice general. Índice." (confirmado por el propio campo `Nombre` de la respuesta de la API).
- **Endpoint:** `https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290751`
- **Tabla oficial relacionada:** `https://www.ine.es/jaxiT3/Tabla.htm?t=24077`
- **Licencia:** CC BY-SA 4.0.
- **Autenticación:** ninguna (API pública).

## 4. Ubicación del dataset

`src/lib/inflation/data/ipc-nacional-es.json`

**Justificación de la ubicación:** sigue la convención ya existente del proyecto, donde `src/lib/` agrupa módulos por dominio (`src/lib/agents`, `src/lib/ai`, `src/lib/auth`, `src/lib/schemas`, `src/lib/stripe`, `src/lib/supabase`), sin que existiera todavía un dominio `inflation`. Se crea `src/lib/inflation/data/` como subcarpeta específica para datos versionados de este dominio, dejando el nivel superior `src/lib/inflation/` libre para los módulos de lógica/tipos que corresponden a tareas futuras (`HISTORICAL-LOGIC-01`), sin mezclarlos con esta tarea.

**Justificación del formato (JSON, no `.ts`):** se eligió JSON puro en vez de un módulo `.ts` que exportara un objeto porque (a) `tsconfig.json` ya tiene `resolveJsonModule: true` habilitado, por lo que Next.js/TypeScript pueden importar el archivo directamente y de forma tipada sin ningún paso adicional; (b) un archivo JSON puro es más fácil de diferenciar (`git diff`) fila por fila cuando se actualiza el dataset; (c) mantiene una separación estricta entre datos (JSON) y lógica (que se añadirá en `.ts` en una tarea futura), evitando que esta tarea contenga ninguna función de cálculo de producción, conforme a la restricción explícita de alcance.

## 5. Ubicación y uso del script

`scripts/update-ipc-dataset.ts`

Sigue la convención ya existente del repositorio (carpeta `scripts/` con archivos `.ts` sueltos, p. ej. `scripts/expire-user.ts`, ejecutados vía `npx tsx <script>`, sin necesidad de añadir `tsx` como dependencia declarada — se resuelve mediante `npx` bajo demanda, igual que el resto de scripts del proyecto).

**Comando de ejecución:**
```bash
npx tsx scripts/update-ipc-dataset.ts
```

No requiere variables de entorno ni credenciales (la API del INE es pública).

## 6. Estructura del dataset

```json
{
  "metadata": {
    "source": "Instituto Nacional de Estadística (INE)",
    "seriesId": "IPC290751",
    "seriesName": "Nacional. Índice general. Índice.",
    "sourceUrl": "https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290751",
    "relatedTableUrl": "https://www.ine.es/jaxiT3/Tabla.htm?t=24077",
    "license": "CC BY-SA 4.0",
    "coverageStart": "2002-01",
    "coverageEnd": "2026-06",
    "frequency": "monthly",
    "base": "2025",
    "recordCount": 294,
    "updatedAt": "2026-07-16",
    "generator": "scripts/update-ipc-dataset.ts"
  },
  "data": [
    { "period": "2002-01", "year": 2002, "month": 1, "index": 58.717 },
    { "period": "2002-02", "year": 2002, "month": 2, "index": 58.768 }
  ]
}
```

**Diferencias respecto al formato de ejemplo de la tarea, documentadas:**
- Se añaden `seriesName` (nombre oficial devuelto por la propia API, para trazabilidad), `relatedTableUrl` (tabla JAXI oficial relacionada, documentada en el spike), `license` (CC BY-SA 4.0, confirmada en el spike) y `generator` (referencia al script que lo produjo) — campos adicionales de trazabilidad, no presentes en el ejemplo pero recomendados por la propia tarea ("incluir metadatos suficientes para conocer... organismo, serie, endpoint...").
- `base` documenta el valor conocido en el momento de creación del script ("2025", confirmado en el spike) — es un **valor documentado manualmente, no autodetectado** (ver sección 10, advertencias sobre cambios de base).
- `updatedAt` usa formato `YYYY-MM-DD` (fecha, no fecha+hora) — suficiente para el propósito de mostrar frescura del dato, evita ruido en el diff de git si se ejecuta varias veces el mismo día.
- No se han incluido campos del payload crudo del INE (`Fecha` epoch, `TipoDato`, `Secreto`, `FK_*`) — se descartan explícitamente por ser ruido innecesario para el consumo posterior, conforme a "evitar campos innecesarios procedentes directamente del payload del INE".

## 7. Cobertura obtenida

- **Primer periodo:** `2002-01` (verificado, coincide con el rango aprobado).
- **Último periodo:** `2026-06` (último dato publicado por el INE en la fecha de ejecución de esta tarea, 2026-07-16).
- **Total de registros:** `294` (24 años completos × 12 meses + 6 meses de 2026 = 294, verificado por conteo).
- **Granularidad:** mensual, un registro por mes, sin huecos (validado por el script).

## 8. Validaciones realizadas

Todas ejecutadas dentro del propio script (`normalizeRecords` + `validateDataset`), de forma determinista y con fallo explícito (`process.exit(1)`) ante cualquier incumplimiento:

| Validación | Resultado |
|---|---|
| La serie descargada es `IPC290751` | ✅ Verificado (`COD` de la respuesta comparado explícitamente; el script aborta si no coincide) |
| El primer periodo es `2002-01` | ✅ Verificado |
| El último periodo coincide con el último dato devuelto por el INE | ✅ Verificado (`2026-06`) |
| Exactamente un registro por mes | ✅ Verificado (deduplicación por periodo con preferencia por dato "Definitivo") |
| No existen periodos duplicados | ✅ Verificado (comprobación explícita tras normalizar) |
| No existen huecos dentro del rango | ✅ Verificado (comprobación de continuidad mes a mes, `nextPeriod()`) |
| Los periodos están ordenados | ✅ Verificado (orden ascendente por `period`, `Array.sort`) |
| Todos los valores son numéricos, finitos y positivos | ✅ Verificado (`Number.isFinite(index) && index > 0`) |
| El total declarado en metadata coincide con la longitud del array | ✅ Verificado (`recordCount` se calcula directamente de `records.length`, no puede desincronizarse) |
| Registros sin periodo o valor válido rechazados | ✅ Verificado (0 registros rechazados en la ejecución real; el mecanismo de rechazo se probó por inspección de código y por el hecho de que el conteo final, 294, coincide exactamente con el esperado) |
| No existen periodos futuros | ✅ Verificado (comparación contra el mes actual en UTC) |

**Registros rechazados en la ejecución real:** 0 (los 294 puntos devueltos por el INE eran válidos en su totalidad).

## 9. Comportamiento ante errores

Implementado y documentado en el propio script:

- **Timeout explícito:** 15.000 ms (`AbortController` + `setTimeout`), mensaje claro si se supera.
- **Código HTTP no 200:** aborta con el código y texto de estado exactos.
- **`content-type` no JSON:** aborta con mensaje explícito (posible cambio de formato del servicio).
- **Respuesta vacía:** aborta con mensaje explícito.
- **JSON malformado:** `try/catch` sobre `JSON.parse`, aborta con mensaje explícito.
- **Formato de nivel superior inesperado** (no es un objeto, o es un array cuando se esperaba un objeto, o falta `COD`/`Data`): aborta con mensaje explícito. **Nota de implementación:** se detectó y corrigió durante esta tarea que el endpoint `DATOS_SERIE/{id}` devuelve un **objeto plano**, no un array como `DATOS_TABLA/{id}` — documentado en el propio código con un comentario explicativo tras verificarlo empíricamente.
- **Código de serie inesperado** (`COD !== "IPC290751"`): aborta con un mensaje que advierte explícitamente de un posible cambio de base y de que no debe concatenarse automáticamente con series distintas.
- **Registro individual sin año/mes/valor válido, o marcado `Secreto`:** se descarta el registro individual (no aborta el proceso completo), se cuenta y se muestra un aviso (`⚠`) con el total de registros rechazados.
- **Periodo duplicado con dos registros "Definitivo":** aborta (anomalía real que requiere revisión manual); si uno es "Definitivo" y otro no, se conserva el "Definitivo" automáticamente.
- **Regresión de cobertura** (el dataset nuevo tiene menos registros que el existente): aborta explícitamente, no sobrescribe.

## 10. Tratamiento de cambios de base

Documentado explícitamente en el propio script (comentario junto a `DOCUMENTED_BASE`) y en el ADR:

- El INE puede cambiar de base en el futuro — de hecho, ya lo ha hecho entre la tarea de arquitectura original (que documentaba "Base 2021") y esta tarea (confirmado "Base 2025" en el spike).
- El campo `metadata.base` en el dataset es un **valor documentado manualmente** (constante `DOCUMENTED_BASE` en el script), **no autodetectado** desde la API (la API no expone directamente un campo "base" fiable en la respuesta de la serie).
- El script **no asume silenciosamente que la base nunca cambia**: el único mecanismo automático de detección es la comparación estricta del código de serie (`COD === "IPC290751"`). Si el INE cambia de base y esto se traduce en un código de serie distinto (como ha ocurrido históricamente con otros cambios de base del IPC), el script **aborta con un error claro** en vez de aceptar silenciosamente datos de una serie distinta.
- Un cambio de base **no provoca concatenación automática de series incompatibles** — el script trabaja con una única serie a la vez; si el código cambia, se requiere revisión manual del código fuente del script (actualizar `SERIES_ID` y `DOCUMENTED_BASE` de forma consciente) antes de poder generar un dataset nuevo.
- Cualquier cambio estructural relevante (código de serie distinto, formato de respuesta distinto, cobertura menor a la existente, primer periodo distinto de `2002-01`) **detiene la actualización con un error claro y código de salida distinto de cero**, tal como exige la tarea.

## 11. Resultado de idempotencia

Ejecutado el script dos veces consecutivas en esta tarea:

- **Primera ejecución:** generó el archivo (no existía previamente). Resumen: `¿Hubo cambios?: Sí`.
- **Segunda ejecución (inmediatamente después, sin cambios en el INE):** el script volvió a descargar y normalizar los 294 registros, los comparó con el archivo existente mediante `JSON.stringify(existing.data) === JSON.stringify(new.data)`, y **no reescribió el archivo**. Resumen: `¿Hubo cambios?: No (datos idénticos a los existentes)`.
- Código de salida `0` en ambas ejecuciones.

**Confirmado: la actualización ejecutada dos veces consecutivas produce el mismo resultado cuando el INE no ha publicado datos nuevos**, tal como exige la tarea.

## 12. Resultado de la comprobación enero 2002 → enero 2025

Comprobación aislada y temporal (no guardada como función ni test de producción), ejecutada directamente contra el dataset generado:

```
IPC 2002-01: 58.717
IPC 2025-01: 98.579
Variación calculada: ((98.579 - 58.717) / 58.717) × 100 = 67.888% → redondeado a 1 decimal: 67.9%
Resultado oficial INE (verificado en SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-SPIKE-01): 67.9%
Coincide: true
```

**El dataset contiene los valores exactos necesarios para reproducir el caso ya validado en el spike, sin ninguna discrepancia.**

## 13. Archivos creados y modificados

**Creados:**
- `scripts/update-ipc-dataset.ts` — script de descarga, normalización, validación y escritura del dataset.
- `src/lib/inflation/data/ipc-nacional-es.json` — dataset generado (294 registros, 2002-01 a 2026-06).
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_DATASET_01.md` — este documento.

**Modificados:**
- `docs/adr/ADR-CALCULADORA-INFLACION-DATOS-HISTORICOS-01.md` — estado cambiado a `ACEPTADO`, con la decisión aprobada, alcance exacto y condición de revisión documentados.
- `PROJECT_STATUS.md`
- `docs/PROJECT_STATUS.md`

**No modificados (confirmado):** ningún archivo de UI, página o componente de la calculadora (`page.tsx`, `CalculatorInflation.tsx`), ninguna traducción (`messages/*.json`), ningún archivo de metadata/schema/canonical/slug, ningún archivo de analytics.

## 14. Comandos ejecutados

```bash
npx tsx scripts/update-ipc-dataset.ts          # 1ª ejecución — genera el dataset
npx tsx scripts/update-ipc-dataset.ts          # 2ª ejecución — confirma idempotencia
npx tsc --noEmit                                # TypeScript
npm run lint                                    # ESLint
npm run test                                    # Vitest
npm run build                                   # Build de producción
```

## 15. Resultado de las validaciones técnicas finales

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ Exit 0, sin errores |
| `npm run lint` | ✅ Exit 0, 0 errores, 76 warnings preexistentes (idénticos a los ya documentados en tareas anteriores; `scripts/` no está incluido en el alcance de `eslint src/`, por lo que no introduce warnings nuevos en ese comando) |
| `npm run test` | ⚠️ Exit 1 — **1 test fallando, preexistente y no relacionado con esta tarea** (ver detalle abajo) |
| `npm run build` | ✅ Exit 0, build completo sin errores |

### Fallo preexistente no relacionado — documentado, no corregido

- **Comando:** `npm run test`
- **Archivo:** `src/__tests__/agents/tools/calculate-whatif.test.ts`
- **Test:** `calculateWhatIf > should create a scenario with monthly savings calculation`
- **Error exacto:**
  ```
  AssertionError: expected '⏰ Tienes 1 mes para ahorrar 200€/mes.' to contain '200€ al mes'
  Expected: "200€ al mes"
  Received: "⏰ Tienes 1 mes para ahorrar 200€/mes."
  ```
- **Demostración de que no fue causado por esta tarea:** esta tarea no ha creado, modificado ni tocado ningún archivo bajo `src/lib/agents/` ni `src/__tests__/agents/` — el diff de esta tarea se limita a `scripts/update-ipc-dataset.ts`, `src/lib/inflation/data/ipc-nacional-es.json`, el ADR y los documentos de estado (confirmado con `git diff --name-only`, ver sección 16). El fallo es una discrepancia de formato de texto ("200€/mes" vs "200€ al mes") en la lógica de generación de consejos de ahorro (`calculateWhatIf`), sin ninguna relación con el IPC, el INE o la calculadora de inflación. **No se ha intentado corregir**, conforme a la instrucción explícita de no arreglar fallos ajenos dentro de este alcance.
- **Resto de la suite:** 505 de 506 tests pasan (38 de 39 archivos de test).

## 16. Riesgos pendientes

1. El campo `metadata.base` ("2025") es un valor documentado manualmente en el script; si el INE cambia de base sin que ello se traduzca en un código de serie distinto (escenario no observado hasta ahora, pero no descartable), el script no lo detectaría automáticamente. Mitigación: revisión manual periódica recomendada al ejecutar cada actualización (leer el resumen impreso por el script).
2. El dataset quedará desactualizado si nadie ejecuta el script — no hay automatización (deliberadamente, fuera de alcance). Se recomienda definir la cadencia de actualización y su responsable en una decisión de proceso separada (ya señalada como pendiente en el ADR).
3. El rango 1961–2001 sigue sin resolverse — ampliación futura condicionada a un nuevo spike o a un canal oficial no encontrado todavía.
4. El fallo preexistente en `calculate-whatif.test.ts` permanece sin corregir (fuera de alcance, documentado en la sección 15).
5. No se ha creado todavía ningún test automatizado (Vitest) para el propio dataset o su generación — la validación de esta tarea se apoya en las comprobaciones internas del script (deterministas, con exit code) y en la comprobación manual documentada en la sección 12, no en una suite de tests permanente; se recomienda evaluar si `HISTORICAL-LOGIC-01` debe incluir tests sobre el dataset además de sobre la lógica de cálculo.

## 17. Siguiente tarea recomendada

`SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-LOGIC-01` — extraer la fórmula de proyección actual de forma literal (sin cambios de comportamiento) y crear la función de cálculo histórico (`calculateHistoricalInflation`) junto con la capa de validación de inputs (`zod`), consumiendo el dataset creado en esta tarea, con sus tests unitarios correspondientes. Sin UI todavía.
