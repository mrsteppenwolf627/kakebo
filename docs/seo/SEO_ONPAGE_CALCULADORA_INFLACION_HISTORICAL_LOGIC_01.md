# SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-LOGIC-01 — Lógica de dominio del cálculo histórico

**Tarea:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-LOGIC-01`
**Tipo:** Implementación de lógica de dominio pura. **Sin UI, sin tests unitarios permanentes, sin traducciones, sin analytics.**

## 1. Objetivo

Implementar una capa de dominio pura, determinista y reutilizable que calcule la inflación histórica acumulada entre dos meses exactos usando exclusivamente el dataset local oficial del IPC (`src/lib/inflation/data/ipc-nacional-es.json`), dejando preparada la lógica de producción que la futura UI consumirá.

## 2. Contexto

Tarea anterior (`HISTORICAL-DATASET-01`) dejó el dataset oficial del IPC versionado (serie `IPC290751`, 2002-01–2026-06, 294 registros) y el ADR aceptado. Esta tarea añade la lógica de cálculo sobre ese dataset, sin tocarlo.

## 3. Commit base

`fc956e224d98cf889eaa494cc6be561f0875178b`, rama `main`, sincronizada con `origin/main` al iniciar. Sin commits nuevos legítimos detectados entre el commit base y el inicio de esta tarea.

## 4. Archivos revisados antes de modificar código

- `PROJECT_STATUS.md`, `docs/PROJECT_STATUS.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_ARCHITECTURE_01.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_SPIKE_01.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_DATASET_01.md`
- `docs/adr/ADR-CALCULADORA-INFLACION-DATOS-HISTORICOS-01.md`
- `src/lib/inflation/data/ipc-nacional-es.json` (estructura completa, primer y último registro)
- `scripts/update-ipc-dataset.ts` (convenciones de tipos y estructura del dataset)
- `src/lib/api/errors.ts` y `src/lib/schemas/common.ts` (convención de errores y validación ya adoptada en el repositorio: clases de error con `code`, mensajes técnicos en español)

## 5. Arquitectura elegida

Módulo cohesionado en `src/lib/inflation/`, independiente de React/Next.js, sin hooks, sin `window`, sin red, sin estado global, sin efectos secundarios, ejecutable en Node.js:

```text
src/lib/inflation/
  types.ts       — tipos de dominio (HistoricalInflationInput/Result, InflationDatasetCoverage)
  errors.ts      — InflationError (clase con `code` discriminante) + fábricas inflationErrors.*
  historical.ts  — carga/validación del dataset al cargar el módulo, funciones de acceso y calculateHistoricalInflation
  index.ts       — barrel público
```

Se descartó dividir en `formulas.ts`/`historical-dataset.ts`/`validation.ts` separados (propuesta original de `ARCHITECTURE-01`) porque la lógica completa de esta tarea cabe con claridad en un único archivo (~200 líneas); se prioriza cohesión y sencillez, conforme a la instrucción explícita de no crear varios archivos si una estructura menor es suficiente. No se ha extraído `calculateProjection` (fuera de alcance de esta tarea: no se ha tocado `CalculatorInflation.tsx`).

## 6. Rutas creadas

- `src/lib/inflation/types.ts` (nuevo)
- `src/lib/inflation/errors.ts` (nuevo)
- `src/lib/inflation/historical.ts` (nuevo)
- `src/lib/inflation/index.ts` (nuevo)

Ninguna ruta existente modificada.

## 7. Contrato público

```ts
interface HistoricalInflationInput {
  amount: number;
  startPeriod: string; // "YYYY-MM"
  endPeriod: string;   // "YYYY-MM"
}

interface HistoricalInflationResult {
  amount: number;
  startPeriod: string;
  endPeriod: string;
  startIndex: number;
  endIndex: number;
  adjustmentFactor: number;
  cumulativeInflationRate: number;        // decimal, sin redondear
  cumulativeInflationPercentage: number;  // porcentaje, sin redondear
  equivalentAmountAtEnd: number;
  requiredNominalIncrease: number;
}

function calculateHistoricalInflation(input: HistoricalInflationInput): HistoricalInflationResult;

// Funciones de acceso a la cobertura del dataset:
function getDatasetCoverage(): InflationDatasetCoverage;
function getFirstAvailablePeriod(): string;
function getLastAvailablePeriod(): string;
function getTotalPeriods(): number;
function getAvailablePeriods(): readonly string[];
function getIndexForPeriod(period: string): number | undefined;
```

El consumidor no accede nunca al JSON crudo ni a estructuras mutables: `getAvailablePeriods()`/`getDatasetCoverage().periods` devuelven un array congelado (`Object.freeze`), y el `Map` interno de índices no se expone.

## 8. Fórmulas implementadas

```text
adjustmentFactor = endIndex / startIndex
cumulativeInflationRate = adjustmentFactor - 1
cumulativeInflationPercentage = (endIndex / startIndex - 1) * 100
equivalentAmountAtEnd = amount * adjustmentFactor
requiredNominalIncrease = equivalentAmountAtEnd - amount
```

Idénticas a las especificadas en la tarea, sin redondeo intermedio ni final.

## 9. Validación de entradas

- **Cantidad (`amount`):** debe ser `number`, finita (`Number.isFinite`), no `NaN`, no negativa. **Se permite `amount = 0`** (decisión de dominio, ver sección 12) — el resultado económico es `0` sin lanzar error, consistente con `nonNegativeAmountSchema` ya existente en `src/lib/schemas/common.ts`.
- **Formato de periodo:** regex estricta `^\d{4}-(0[1-9]|1[0-2])$`, igual convención que `ymSchema` en `src/lib/schemas/common.ts`. Rechaza formatos con día (`2025-01-01`), mes fuera de 01–12, cadenas vacías, espacios o texto adicional.
- **Periodo disponible:** tras validar formato, se busca el periodo exacto en el `Map` construido al cargar el módulo; si no existe (anterior a la cobertura, posterior, o simplemente no existe pese a formato válido), lanza `PERIOD_NOT_AVAILABLE`. No se interpola ni se busca el mes más cercano.
- **Orden cronológico:** `startPeriod > endPeriod` (comparación de cadenas `"YYYY-MM"`, válida lexicográficamente) lanza `INVALID_PERIOD_ORDER`. Periodos iguales están permitidos explícitamente.

## 10. Tratamiento de periodos

Formato exclusivo `YYYY-MM`. Caso de periodos iguales verificado: `adjustmentFactor = 1`, `cumulativeInflationRate = 0`, `cumulativeInflationPercentage = 0`, `equivalentAmountAtEnd = amount`, `requiredNominalIncrease = 0` (ver resultado del caso 2 en la sección 15).

## 11. Tratamiento de deflación

No se asume `endIndex >= startIndex`. Verificado con un intervalo real de deflación existente en el dataset (2002-06 → 2002-07, índice 60.277 → 59.858): `adjustmentFactor = 0.993...`, `cumulativeInflationPercentage = -0.695...%`, `equivalentAmountAtEnd = 993.05€`, `requiredNominalIncrease = -6.95€` — ningún valor se fuerza a cero (ver sección 15).

## 12. Política de precisión y redondeo

Se usan los valores del dataset (3 decimales del IPC) y aritmética `number` estándar de JS/TS, sin librería decimal nueva. No se usa `toFixed`, ni redondeo a N decimales, ni formateadores de moneda/porcentaje dentro del dominio — todos los campos de `HistoricalInflationResult` devuelven el valor de coma flotante completo (ver ejemplo: `cumulativeInflationPercentage: 67.88834579423335`). El redondeo de presentación queda explícitamente delegado a la futura capa de UI.

**Decisión sobre `amount = 0`:** se permite, siguiendo el precedente de `nonNegativeAmountSchema` (vs. `amountSchema`, que exige `> 0`) ya presente en el repositorio; el caso de uso de esta calculadora (explorar el efecto de la inflación sobre una cantidad) no tiene ninguna razón de negocio para prohibir `0`, y permitirlo simplifica la validación sin introducir un error espurio.

## 13. Comportamiento de errores

Se optó por una clase de error única `InflationError extends Error` con una propiedad `code: InflationErrorCode` discriminante (unión de literales), siguiendo el mismo patrón ya adoptado por `ApiError` en `src/lib/api/errors.ts` (clase + `code` + mensaje), pero **sin ninguna dependencia de Next.js/HTTP** (no se reutiliza `ApiError` directamente porque pertenece a la capa de API, no de dominio). Fábricas `inflationErrors.*` centralizan la construcción de cada mensaje.

Códigos distinguidos: `INVALID_AMOUNT`, `INVALID_PERIOD_FORMAT`, `PERIOD_NOT_AVAILABLE`, `INVALID_PERIOD_ORDER`, `DATASET_INTEGRITY_ERROR`.

**Idioma de los mensajes:** se mantienen en español, siguiendo la convención ya existente y verificada en `src/lib/api/errors.ts` (`apiErrors.*`) y `src/lib/schemas/common.ts` (mensajes de zod) — el proyecto no separa estrictamente errores técnicos de mensajes traducibles en esta capa; los mensajes de `InflationError` son para logs/desarrollo, no se muestran literalmente al usuario final sin pasar por la futura capa de UI/traducciones.

## 14. Protección frente a inconsistencias del dataset

`buildValidatedIndex()` se ejecuta **una sola vez**, al cargar el módulo (nivel superior de `historical.ts`, no dentro de cada llamada a `calculateHistoricalInflation`), y valida:

- Existencia de `metadata` y de un array `data`.
- `metadata.recordCount === data.length`.
- Cada registro tiene `period` con formato válido, e `index` finito y positivo.
- Ausencia de periodos duplicados.
- Orden cronológico estricto (cada periodo es estrictamente mayor que el anterior).
- `metadata.coverageStart`/`coverageEnd` coinciden con el primer y último periodo reales.

Cualquier incumplimiento lanza `DATASET_INTEGRITY_ERROR` al importar el módulo (falla rápido, antes de cualquier cálculo). No se repite esta validación en cada llamada — el resultado (`Map` + array de periodos congelado) se calcula una única vez y se reutiliza.

## 15. Resultados de las comprobaciones temporales

Ejecutadas mediante un script temporal (`scratch-check-historical.ts`, creado en la raíz del repo y **eliminado antes del commit**, no versionado):

**Caso 1 — 2002-01 → 2025-01, 1.000€:**
```
startIndex: 58.717, endIndex: 98.579
adjustmentFactor: 1.6788834579423335
cumulativeInflationPercentage: 67.88834579423335
equivalentAmountAtEnd: 1678.8834579423335
requiredNominalIncrease: 678.8834579423335
```
Coincide con el resultado oficial ya validado en `HISTORICAL-SPIKE-01`/`HISTORICAL-DATASET-01` (67,9% al redondeo).

**Caso 2 — mismo periodo (2025-01 → 2025-01), 1.000€:**
```
adjustmentFactor: 1, cumulativeInflationRate: 0, cumulativeInflationPercentage: 0
equivalentAmountAtEnd: 1000, requiredNominalIncrease: 0
```
Exactamente como exige la tarea.

**Caso 3 — errores:**

| Caso | Código de error |
|---|---|
| Formato `2025-1` | `INVALID_PERIOD_FORMAT` |
| Fecha completa `2025-01-01` | `INVALID_PERIOD_FORMAT` |
| Periodo futuro sin dato (`2099-01`) | `PERIOD_NOT_AVAILABLE` |
| Periodo anterior a cobertura (`1990-01`) | `PERIOD_NOT_AVAILABLE` |
| Cantidad negativa (`-100`) | `INVALID_AMOUNT` |
| Cantidad `NaN` | `INVALID_AMOUNT` |
| Orden cronológico inválido (inicio > fin) | `INVALID_PERIOD_ORDER` |
| Cantidad `0` | Aceptado (no es error), resultado económico = 0 |
| Deflación real (2002-06 → 2002-07) | Aceptado, `cumulativeInflationPercentage: -0.695...%`, `requiredNominalIncrease: -6.95...` |

Todos los resultados coincidieron con el comportamiento especificado.

## 16. Comandos ejecutados

```bash
npx tsx scratch-check-historical.ts   # comprobaciones temporales, script eliminado después
npx tsc --noEmit
npm run lint
npm run test
npm run build
```

## 17. Validaciones técnicas

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ Exit 0, sin errores |
| `npm run lint` | ✅ Exit 0, 0 errores, 76 warnings preexistentes (ninguno en `src/lib/inflation/`) |
| `npm run test` | ⚠️ Exit 1 — 505 de 506 tests pasan; único fallo preexistente y no relacionado: `src/__tests__/agents/tools/calculate-whatif.test.ts` (`"200€/mes"` vs. `"200€ al mes"`), documentado y no corregido, sin relación con la lógica de inflación |
| `npm run build` | ✅ Exit 0, build completo sin errores, ruta `/herramientas/calculadora-inflacion` presente sin cambios |

## 18. Ausencia de dependencias de red y UI

`src/lib/inflation/historical.ts` importa el dataset mediante `import rawDataset from "./data/ipc-nacional-es.json"` (import estático, resuelto en build time gracias a `resolveJsonModule: true` en `tsconfig.json`), sin `fetch`, sin `XMLHttpRequest`, sin acceso a `window`/`document`, sin hooks de React, sin `"use client"`. No se ha modificado ningún componente, página, traducción, evento de analytics, schema ni metadata.

## 19. Riesgos pendientes

1. La lógica no tiene todavía tests unitarios permanentes (Vitest) — deliberadamente fuera de alcance de esta tarea; la siguiente tarea debe cubrir formato, límites, deflación, integridad del dataset y comparación con casos oficiales del INE.
2. El fallo preexistente en `calculate-whatif.test.ts` permanece sin corregir (fuera de alcance).
3. El rango 1961–2001 sigue sin resolverse (heredado de tareas anteriores, no afecta a esta lógica).
4. `PERIOD_NOT_AVAILABLE` no distingue explícitamente "anterior a cobertura" de "posterior a cobertura" ni de "hueco interno" (no debería haber huecos, garantizado por `DATASET_INTEGRITY_ERROR` en la carga) — se consideró innecesario añadir más granularidad de código de error sin un caso de uso de UI concreto que la requiera todavía.

## 20. Siguiente tarea recomendada

`SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-LOGIC-TESTS-01` (o el nombre que decida el usuario) — crear la suite de tests unitarios permanentes (Vitest) para `src/lib/inflation/`: formato de periodo, límites de cobertura, deflación, integridad del dataset, y comparación con los casos oficiales del INE ya documentados en `HISTORICAL-SPIKE-01`. Sin UI todavía.
