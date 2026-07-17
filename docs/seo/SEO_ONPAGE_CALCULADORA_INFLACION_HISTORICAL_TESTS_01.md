# SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-TESTS-01 — Tests unitarios de la lógica histórica

**Tarea:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-TESTS-01`
**Tipo:** Tests unitarios permanentes. **Sin UI, sin traducciones, sin analytics, sin cambios en el dataset.**

## 1. Objetivo

Crear una suite de tests unitarios permanente y exhaustiva para la lógica de dominio del cálculo histórico de inflación (`src/lib/inflation/`), cubriendo cobertura del dataset, fórmulas, precisión, validación de entradas, errores, periodos iguales, deflación, encapsulación/inmutabilidad y el contrato público, sin modificar la lógica de producción salvo defecto real detectado.

## 2. Commit base

`a3ded6568ab24991a07a9a91bd3bfa0269126661`, rama `main`, sincronizada con `origin/main` al iniciar. Sin commits nuevos legítimos entre el commit base y el inicio de esta tarea.

## 3. Baseline inicial (confirmado por ejecución real antes de escribir el test)

```
Test Files  1 failed | 38 passed (39)
     Tests  1 failed | 505 passed (506)
```

Único fallo: `src/__tests__/agents/tools/calculate-whatif.test.ts` (`"200€/mes"` vs. `"200€ al mes"`), preexistente y ajeno a la lógica de inflación.

## 4. Ubicación de los tests

`src/__tests__/lib/inflation/historical.test.ts`

Sigue la convención ya establecida y verificada en el repositorio: un árbol centralizado `src/__tests__/` que espeja la estructura de `src/lib/` (ver `src/__tests__/lib/ai/learning-metrics.test.ts`, `src/__tests__/lib/ai/embeddings-filters.test.ts`, `src/__tests__/lib/logger.test.ts`), en vez de carpetas `__tests__` colocadas junto al código fuente. No se ha inventado una convención nueva.

## 5. Funciones públicas cubiertas

Todas importadas desde el punto de entrada público `@/lib/inflation` (= `src/lib/inflation/index.ts`), tal como lo consumirá la futura UI:

- `calculateHistoricalInflation`
- `getDatasetCoverage`
- `getFirstAvailablePeriod`
- `getLastAvailablePeriod`
- `getTotalPeriods`
- `getAvailablePeriods`
- `getIndexForPeriod`
- `InflationError` (clase) y `inflationErrors` (fábricas), probadas por su comportamiento observable (código, nombre, instancia)

No se han importado internals de `historical.ts`/`errors.ts` directamente; todo pasa por el barrel `index.ts`.

## 6. Casos cubiertos (por bloque)

1. **Cobertura del dataset:** primer periodo (`2002-01`), último periodo (`2026-06`), total (`294`), longitud de la lista, orden cronológico, ausencia de huecos mes a mes, coherencia entre `getDatasetCoverage()` y los helpers individuales.
2. **Consulta de índices:** valores exactos conocidos (`2002-01` → `58.717`, `2025-01` → `98.579`), periodo intermedio finito y positivo, estabilidad entre llamadas repetidas, `undefined` para periodos bien formados fuera de cobertura (sin fallback al mes más cercano), ausencia de interpolación.
3. **Caso oficial de referencia** (ver sección 7).
4. **Mismo periodo** (ver sección 8).
5. **Deflación** (ver sección 9).
6. **Cantidades:** entero positivo, decimal positivo, `0`, muy pequeña, grande pero finita, negativa, `NaN`, `Infinity`, `-Infinity`, string forzado con `as unknown as number`.
7. **Formatos de periodo inválidos:** 13 variantes (`""`, `" "`, `"2025"`, `"2025-1"`, `"25-01"`, `"2025-00"`, `"2025-13"`, `"2025-01-01"`, `"2025/01"`, `"2025-01 "`, `" 2025-01"`, `"abcd-ef"`, `"202501"`) más los dos casos de periodo bien formado pero fuera de cobertura (antes/después), distinguiendo explícitamente `INVALID_PERIOD_FORMAT` de `PERIOD_NOT_AVAILABLE`.
8. **Orden cronológico:** inicio < fin (válido), inicio = fin (válido), inicio > fin con ambos periodos válidos y disponibles (error `INVALID_PERIOD_ORDER`).
9. **Contrato de errores:** instancia de `InflationError`/`Error`, `name === "InflationError"`, los 5 códigos documentados, `details` adjuntos en errores de periodo, ausencia de claves de traducción de UI en el mensaje técnico.
10. **Inmutabilidad y encapsulación:** intento de mutar el array devuelto por `getAvailablePeriods()` y por `coverage.periods` (ambos lanzan `TypeError` al estar congelados con `Object.freeze`, confirmando que el estado interno no se altera en llamadas posteriores).
11. **Determinismo:** mismo input → mismo resultado en llamadas repetidas; el objeto de entrada no se muta.
12. **Exportaciones públicas:** las 9 exportaciones documentadas existen y tienen el tipo esperado (`function`/`object`).

## 7. Caso oficial de referencia (2002-01 → 2025-01, 1.000€)

Verificado contra los valores exactos del dataset (`startIndex = 58.717`, `endIndex = 98.579`):

- `adjustmentFactor` ≈ `98.579 / 58.717` (comparado con `toBeCloseTo`, precisión 12 decimales)
- `cumulativeInflationRate` ≈ `98.579/58.717 - 1`
- `cumulativeInflationPercentage` ≈ `(98.579/58.717 - 1) × 100` (precisión 10 decimales) — valor completo verificado: `67.888345794233...`, sin redondear a `67.9` antes de comparar
- `equivalentAmountAtEnd` ≈ `1000 × (98.579/58.717)`
- `requiredNominalIncrease` ≈ equivalente − `1000`
- Test adicional que confirma que el valor redondeado a 1 decimal coincide con el `67,9%` oficial ya validado en `HISTORICAL-SPIKE-01`/`HISTORICAL-DATASET-01`, sin que ese redondeo sustituya la comprobación de la cifra completa.

## 8. Caso de periodos iguales

Tres tests: `2025-01 → 2025-01` (interior del rango) y `2002-01 → 2002-01` (límite de cobertura), ambos con `adjustmentFactor: 1`, `cumulativeInflationRate: 0`, `cumulativeInflationPercentage: 0`, `equivalentAmountAtEnd` igual a la cantidad de entrada, `requiredNominalIncrease: 0`; más un tercer test con `amount: 0` confirmando que el resultado económico es `0` sin lanzar error.

## 9. Caso de deflación

Caso real del dataset, `2002-06 → 2002-07` (índice `60.277 → 59.858`, deflación real, no simulada): índice final menor que el inicial, `adjustmentFactor < 1`, tasa y porcentaje negativos, cantidad equivalente menor que la inicial, incremento nominal negativo y explícitamente distinto de `0` (no forzado a cero).

## 10. Entradas inválidas comprobadas

Cantidades: negativa, `NaN`, `Infinity`, `-Infinity`, string forzada en runtime — las 5 producen `INVALID_AMOUNT`. Formatos de periodo: 13 variantes inválidas → `INVALID_PERIOD_FORMAT`. Periodos bien formados fuera de cobertura → `PERIOD_NOT_AVAILABLE`. Orden invertido con periodos válidos → `INVALID_PERIOD_ORDER`.

## 11. Errores comprobados

Se valida el contrato estable (clase `InflationError`, `name`, `code`, `details` en errores de periodo) mediante los tests de la sección "contrato de errores", sin acoplar ningún test al texto completo del mensaje (solo se comprueba que no empieza por un patrón de clave de traducción `Tools.Inflation.*`, para verificar la decisión arquitectónica ya documentada en `HISTORICAL-LOGIC-01` de que el mensaje es técnico, no una clave i18n). No se ha podido ni se ha intentado provocar `DATASET_INTEGRITY_ERROR` sin alterar el JSON real (el dataset versionado es válido por construcción); en su lugar, se comprueba el comportamiento observable de la fábrica `inflationErrors.datasetIntegrityError(...)` directamente, sin mutar el dataset ni añadir hooks de test artificiales.

## 12. Encapsulación e inmutabilidad

`getAvailablePeriods()` y `getDatasetCoverage().periods` devuelven el mismo array congelado con `Object.freeze` (implementado en `historical.ts` desde la tarea anterior). Los tests intentan `push()` y asignación por índice sobre el array devuelto y confirman que ambas operaciones lanzan `TypeError` (comportamiento de un array congelado en modo estricto de ES modules) y que una llamada posterior a `getAvailablePeriods()`/`getDatasetCoverage()` sigue devolviendo el estado original intacto.

## 13. Mocks utilizados

**Ninguno.** Se usa el dataset real versionado (`src/lib/inflation/data/ipc-nacional-es.json`) en todos los casos, incluido el caso de deflación (real, no simulado). No se mockea `fetch`, la API del INE, React, Next.js, ni fechas del sistema — la lógica de dominio no depende de ninguno de ellos (confirmado por inspección de `historical.ts`: el único `import` externo es el propio JSON del dataset).

## 14. Defectos encontrados

**Ninguno.** Los 67 tests nuevos pasan contra la implementación existente sin necesidad de modificar `src/lib/inflation/types.ts`, `errors.ts`, `historical.ts` ni `index.ts`.

## 15. Comandos ejecutados

```bash
npx vitest run src/__tests__/lib/inflation/historical.test.ts   # test específico
npm run test                                                     # suite completa
npx tsc --noEmit
npm run lint
npm run build
```

## 16. Total final de archivos y tests

- **Archivos de test:** 40 (39 preexistentes + 1 nuevo)
- **Tests totales:** 573 (506 preexistentes + 67 nuevos)
- **Tests nuevos:** 67, todos en `src/__tests__/lib/inflation/historical.test.ts`

## 17. Resultado del test específico

```
✓ src/__tests__/lib/inflation/historical.test.ts (67 tests)
Test Files  1 passed (1)
     Tests  67 passed (67)
```

## 18. Resultado de la suite completa

```
Test Files  1 failed | 39 passed (40)
     Tests  1 failed | 572 passed (573)
```

## 19. Fallo preexistente

Idéntico al baseline (sección 3): `src/__tests__/agents/tools/calculate-whatif.test.ts`, discrepancia `"200€/mes"` vs. `"200€ al mes"`, ajeno a `src/lib/inflation/`, no corregido conforme al alcance de esta tarea.

## 20. TypeScript

`npx tsc --noEmit` → ✅ Exit 0, sin errores.

## 21. Lint

`npm run lint` → ✅ Exit 0, 0 errores, 76 warnings preexistentes idénticos a los ya documentados (ninguno en el archivo de test nuevo).

## 22. Build

`npm run build` → ✅ Exit 0, build de producción completo sin errores.

## 23. Archivos creados

- `src/__tests__/lib/inflation/historical.test.ts`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_TESTS_01.md`

## 24. Archivos modificados

- `PROJECT_STATUS.md`
- `docs/PROJECT_STATUS.md`

Ningún archivo de `src/lib/inflation/{types,errors,historical,index}.ts` fue modificado (no se encontró ningún defecto). El dataset (`data/ipc-nacional-es.json`) y el script (`scripts/update-ipc-dataset.ts`) tampoco se modificaron.

## 25. Riesgos pendientes

1. El caso `DATASET_INTEGRITY_ERROR` solo se prueba a través de la fábrica de errores, no de un fallo real de carga del módulo (deliberado, para no mutar el dataset versionado ni añadir un mecanismo de inyección de datos ficticio); si se necesita cubrir ese camino de carga en el futuro, requeriría una decisión explícita sobre cómo simular un dataset corrupto sin tocar el real (p. ej. un dataset de fixture aislado, fuera del alcance de esta tarea).
2. El fallo preexistente en `calculate-whatif.test.ts` permanece sin corregir (fuera de alcance).
3. El rango 1961–2001 sigue sin resolverse (heredado de tareas anteriores, no afecta a esta suite).
4. No se han añadido tests de integración de UI (no existe UI todavía) ni de accesibilidad — corresponden a tareas futuras (`HISTORICAL-UI-01`).

## 26. Siguiente tarea recomendada

`SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-UI-01` — construir el selector de modo y el subcomponente de UI histórica (`CalculatorInflationHistorical.tsx` o equivalente), integrando traducciones ES/EN, accesibilidad y analytics, consumiendo `calculateHistoricalInflation` y las funciones de cobertura ya probadas en esta tarea.
