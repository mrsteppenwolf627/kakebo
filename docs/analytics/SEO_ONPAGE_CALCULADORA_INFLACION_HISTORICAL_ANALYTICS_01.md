# SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-ANALYTICS-01

## Objetivo

Implementar los eventos de analytics necesarios para medir el uso real del modo histórico de la calculadora de inflación (`https://www.metodokakebo.com/herramientas/calculadora-inflacion`), sin modificar su funcionamiento, diseño, contenido SEO, metadata, schema ni dataset.

## Commit base

`c6e4279cdcded9f3e8ebd0da0fb6bf58dada4168` (fix(ui): handle invalid historical inflation amounts).

## Sistema analytics existente

Utilidad centralizada única: `src/lib/analytics.ts`, clase singleton `Analytics` expuesta como `analytics`.

- `analytics.track(name: EventName, properties: EventProperties = {})`.
- `EventName` es una unión de literales de string cerrada — cada evento nuevo debe añadirse explícitamente a esa unión.
- `EventProperties = Record<string, string | number | boolean>`.
- Protección ante analytics no disponible: comprueba `typeof window !== "undefined" && typeof window.gtag === "function"` antes de invocar `window.gtag`; si no existe, simplemente no envía nada (no lanza error).
- Comportamiento en desarrollo: si `process.env.NODE_ENV === "development"`, además hace `console.log("[Analytics] ${name}", properties)`.
- Eventos ya existentes en las calculadoras: `tool_viewed`, `use_inflation_calculator`, `use_savings_calculator`, `use_503020_calculator`, `click_tool_to_app`, `tool_interaction`, `savings_calculator_calculate`, `savings_calculator_goal_result`.
- No existe Google Tag Manager, ni sistema de consentimiento adicional, ni cookies propias de analytics: `window.gtag` se carga mediante `src/components/analytics/GoogleAnalytics.tsx` (no modificado en esta tarea).

Se reutiliza esta utilidad tal cual; no se ha creado un sistema nuevo.

## Eventos implementados

### 1. `inflation_calculator_mode_change`

**Punto de disparo:** `src/components/landing/tools/CalculatorInflation.tsx`, en una nueva función `handleModeChange(next)` que centraliza el cambio de modo. Se invoca desde el `onClick` de ambos botones del selector (`role="tab"`) y desde `handleTabKeyDown` (flechas izquierda/derecha), sustituyendo las llamadas directas a `setMode(...)`.

```ts
const handleModeChange = (next: CalculatorMode) => {
    if (next === mode) return;
    analytics.track("inflation_calculator_mode_change", {
        mode_from: mode,
        mode_to: next,
        source_page: "/herramientas/calculadora-inflacion",
    });
    setMode(next);
};
```

**Parámetros:**

| Parámetro | Tipo | Justificación |
|---|---|---|
| `mode_from` | `"future" \| "historical"` | Permite calcular la dirección del cambio (a qué modo se abandona) sin guardar histórico de sesión. |
| `mode_to` | `"future" \| "historical"` | Modo de destino; junto con `mode_from` permite distinguir "primera visita al histórico" de "retorno al futuro". |
| `source_page` | `"/herramientas/calculadora-inflacion"` | Identifica la URL de origen sin depender del locale, evitando cardinalidad extra por idioma. |

**Protección contra duplicados:** el guard `if (next === mode) return;` evita disparar el evento si el usuario pulsa la pestaña ya activa (clic redundante) y evita cualquier disparo durante el render inicial, porque solo se invoca desde manejadores de evento (`onClick`/`onKeyDown`), nunca desde un efecto o durante el render.

### 2. `historical_inflation_calculation`

**Punto de disparo:** `src/components/landing/tools/CalculatorInflationHistorical.tsx`, dentro de `handleSubmit`, inmediatamente después de `setResult(calculation)` en la rama de éxito del `try`. Se dispara una única vez por envío válido (una sola ruta de código la alcanza).

```ts
const trackHistoricalCalculation = (result: HistoricalInflationResult) => {
  analytics.track("historical_inflation_calculation", {
    start_period: result.startPeriod,
    end_period: result.endPeriod,
    interval_months: getIntervalMonths(result.startPeriod, result.endPeriod),
    result_type: getResultType(result.cumulativeInflationPercentage),
    source_page: SOURCE_PAGE,
  });
};
```

**Parámetros:**

| Parámetro | Tipo | Justificación |
|---|---|---|
| `start_period` / `end_period` | `"YYYY-MM"` | Permiten analizar qué intervalos temporales usan los usuarios, tomados directamente de `HistoricalInflationResult` (mismo valor ya validado por el dominio, sin recalcular). |
| `interval_months` | `number` | Distancia mensual entre periodos, calculada de forma determinista con una utilidad local nueva (`getIntervalMonths`), sin tocar la lógica de dominio. |
| `result_type` | `"inflation" \| "deflation" \| "no_change"` | Derivado exclusivamente de `result.cumulativeInflationPercentage` (positivo/negativo/cero), sin duplicar la fórmula económica. |
| `source_page` | string fija | Igual que en el evento 1. |

**Datos explícitamente excluidos:** cantidad introducida (`amount`), cantidad equivalente (`equivalentAmountAtEnd`), variación monetaria exacta (`requiredNominalIncrease`), índices IPC (`startIndex`/`endIndex`), y el porcentaje exacto (`cumulativeInflationPercentage`) — solo se envía su categoría (`result_type`), no el valor numérico.

### 3. `historical_inflation_error`

**Punto de disparo:** mismo `handleSubmit`, en el punto exacto donde ya se fijaba el mensaje de error visible (validación de cantidad antes del `try`, y cada rama del `catch`), sin alterar ese flujo existente. Se dispara una única vez por envío fallido, porque cada rama de error es mutuamente excluyente.

```ts
type HistoricalErrorCode =
  | "INVALID_AMOUNT"
  | "INVALID_PERIOD_FORMAT"
  | "PERIOD_NOT_AVAILABLE"
  | "INVALID_PERIOD_ORDER"
  | "DATASET_INCONSISTENCY"
  | "UNEXPECTED_ERROR";

const trackHistoricalError = (errorCode: HistoricalErrorCode) => {
  analytics.track("historical_inflation_error", {
    error_code: errorCode,
    source_page: SOURCE_PAGE,
  });
};
```

**Mapeo de códigos:** `InflationError.code` (dominio) tiene 5 valores: `INVALID_AMOUNT`, `INVALID_PERIOD_FORMAT`, `PERIOD_NOT_AVAILABLE`, `INVALID_PERIOD_ORDER`, `DATASET_INTEGRITY_ERROR`. Los cuatro primeros se mapean 1:1. El quinto (`DATASET_INTEGRITY_ERROR`, la rama `default` del `switch`, la única que puede alcanzarla dado que el tipo de dominio solo tiene esos 5 códigos) se expone como `DATASET_INCONSISTENCY` en analytics, tal como pedía la tarea explícitamente con ese nombre estable. Cualquier excepción que no sea `InflationError` (rama `else`) se reporta como `UNEXPECTED_ERROR`, distinguiendo errores controlados de errores inesperados.

**Parámetros:**

| Parámetro | Tipo | Justificación |
|---|---|---|
| `error_code` | unión cerrada de 6 literales | Código estable, no traducido, no depende del idioma ni del mensaje mostrado al usuario. |
| `source_page` | string fija | Igual que en los otros eventos. |

**Datos explícitamente excluidos:** el valor introducido en el campo de cantidad (`amountInput`), y el mensaje traducido mostrado en pantalla (`labels.*Error`) — solo se envía el código.

## Cálculo de `interval_months`

Utilidad local en `CalculatorInflationHistorical.tsx` (no forma parte de `src/lib/inflation`, para no tocar la lógica de dominio solo por analytics):

```ts
const getIntervalMonths = (startPeriod: string, endPeriod: string): number => {
  const [startYear, startMonth] = startPeriod.split("-").map(Number);
  const [endYear, endMonth] = endPeriod.split("-").map(Number);
  return (endYear - startYear) * 12 + (endMonth - startMonth);
};
```

Verificado con los ejemplos del enunciado: `2002-01 → 2002-01 = 0`, `2002-01 → 2002-02 = 1`, `2024-01 → 2025-01 = 12`, y con el caso oficial `2002-01 → 2025-01 = 276`.

## Clasificación de `result_type`

```ts
const getResultType = (cumulativeInflationPercentage: number): "inflation" | "deflation" | "no_change" => {
  if (cumulativeInflationPercentage > 0) return "inflation";
  if (cumulativeInflationPercentage < 0) return "deflation";
  return "no_change";
};
```

Basada exclusivamente en el signo de `cumulativeInflationPercentage`, ya calculado por `calculateHistoricalInflation`, sin reimplementar la fórmula.

## Protección contra duplicados

- **Cambio de modo:** guard `next === mode` antes de trackear; el tracking vive únicamente en manejadores de evento (`onClick`, `onKeyDown` vía `handleModeChange`), nunca en un `useEffect` ni durante el render, evitando eventos en el montaje inicial o en re-renders.
- **Cálculo y error:** ambos eventos viven dentro de `handleSubmit`, que solo se ejecuta una vez por envío real de formulario (`e.preventDefault()` + flujo síncrono), y cada rama (éxito / cada tipo de error) es mutuamente excluyente dentro del mismo `try/catch`, por lo que nunca se disparan dos eventos para el mismo envío.

## Comportamiento sin analytics

Sin cambios respecto al comportamiento ya existente de `analytics.track`: si `window.gtag` no existe (GA4 no cargado, bloqueado por el usuario, entorno de desarrollo o tests), la función simplemente no reenvía el evento a GA4 y no lanza ninguna excepción. Ninguno de los tres nuevos puntos de instrumentación añade manejo de errores adicional, porque no era necesario: la función ya es segura por diseño y ese es el patrón ya usado por todos los demás eventos del proyecto. Verificado con un test unitario dedicado (`src/__tests__/lib/analytics.test.ts`) y con un test de componente que simula un `analytics.track` que no hace nada.

## Tests añadidos

Se detectó que `@testing-library/react` y `@testing-library/jest-dom` **ya están instalados** como dependencias del proyecto (`package.json`), y que Vitest ya está configurado con `environment: "jsdom"` y el plugin de React (`vitest.config.ts`), aunque no existía previamente ningún test de componente en el repositorio. Usar esa infraestructura ya presente no constituye añadir una dependencia nueva, así que se optó por escribir tests de componente reales en lugar de limitarse a validación manual.

- `src/__tests__/lib/analytics.test.ts` (2 tests): confirma que `analytics.track` no lanza excepción sin `window.gtag`, y que reenvía correctamente el evento cuando `window.gtag` sí existe.
- `src/__tests__/components/CalculatorInflationHistorical.analytics.test.tsx` (8 tests): cubre el evento de cálculo (caso oficial `2002-01 → 2025-01`, intervalo 276, `result_type: "inflation"`), deflación real (`2002-06 → 2002-07`, `result_type: "deflation"`), mismo periodo (`2025-01 → 2025-01`, `result_type: "no_change"`), error `INVALID_AMOUNT`, error `INVALID_PERIOD_ORDER`, ausencia de la cantidad exacta en cualquier payload trackeado, ausencia de tracking en el render inicial, y que un `analytics.track` que no hace nada no rompe el envío del formulario.

**Sobre el evento de cambio de modo (`CalculatorInflation.tsx`):** no se añadió un test de componente automatizado para este evento. `CalculatorInflation.tsx` usa `t.rich(...)` de `next-intl` en múltiples puntos (con `chunks` JSX interpolados) y renderiza gráficas de `recharts` y un `Link` de `@/i18n/routing` acoplado al router de Next; mockear correctamente `t.rich` sin reimplementar su lógica de interpolación no es trivial y no existe precedente en el repositorio para renderizar este componente en tests. Introducir ese mock específicamente para esta tarea se consideró desproporcionado frente al alcance (un evento de tracking). En su lugar, se validó manualmente con un harness Vite aislado que renderiza el componente real con `NextIntlClientProvider` y los mensajes reales de `messages/es.json` (ver sección siguiente), igual que en tareas anteriores de esta serie.

No se modificaron los 67 tests de dominio ni se intentó corregir `calculate-whatif.test.ts`.

## Validación manual

**Evento de cambio de modo** (harness Vite temporal en `.tmp-analytics-qa/harness`, eliminado tras la validación, renderizando `CalculatorInflation` real con `NextIntlClientProvider` + mensajes reales de `es.json` + un stub de `@/i18n/routing`):

- Clic en "Inflación histórica" (primera vez): 1 evento `inflation_calculator_mode_change` con `mode_from: "future", mode_to: "historical"`.
- Clic en "Proyección futura" (retorno): 1 evento con `mode_from: "historical", mode_to: "future"`.
- Clic de nuevo en "Proyección futura" (pestaña ya activa): **0 eventos adicionales** (confirmado con un espía en `window.gtag`, solo 2 llamadas totales tras 3 clics + 1 tecla).
- Tecla `→` con foco en la pestaña activa: 1 evento adicional `mode_from: "future", mode_to: "historical"`, confirmando que el teclado también dispara el evento.
- Render inicial: solo se registró `tool_viewed` (evento preexistente), ningún `inflation_calculator_mode_change`.
- Payload confirmado vía `window.__gtagCalls`: `[["event","inflation_calculator_mode_change",{"mode_from":"historical","mode_to":"future","source_page":"/herramientas/calculadora-inflacion"}],["event","inflation_calculator_mode_change",{"mode_from":"future","mode_to":"historical","source_page":"/herramientas/calculadora-inflacion"}]]`.

**Eventos de cálculo y error:** confirmados mediante los 8 tests automatizados descritos arriba, que ejercitan el mismo `handleSubmit` que usa la UI real (sin mocks de lógica de dominio, solo de `@/lib/analytics`).

## Test específico de inflación

`npx vitest run src/__tests__/lib/inflation/historical.test.ts` → ✅ 67/67.

## Suite completa

`npm run test` → ✅ 582/583 (572 previos + 10 nuevos; único fallo ajeno preexistente: `calculate-whatif.test.ts`).

## TypeScript

`npx tsc --noEmit` → ✅ sin errores.

## Lint

`npm run lint` → ✅ 0 errores, 76 warnings preexistentes no relacionados con los archivos modificados.

## Build

`npm run build` → ✅ completado correctamente.

## Archivos creados

- `docs/analytics/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_ANALYTICS_01.md` (este documento).
- `src/__tests__/lib/analytics.test.ts`.
- `src/__tests__/components/CalculatorInflationHistorical.analytics.test.tsx`.

## Archivos modificados

- `src/lib/analytics.ts` — añadidos los 3 nombres de evento a la unión `EventName`.
- `src/components/landing/tools/CalculatorInflation.tsx` — añadida `handleModeChange`, sustituidas las llamadas directas a `setMode` en los `onClick` y en `handleTabKeyDown`.
- `src/components/landing/tools/CalculatorInflationHistorical.tsx` — añadidas las utilidades locales de tracking (`getIntervalMonths`, `getResultType`, `trackHistoricalCalculation`, `trackHistoricalError`) y las llamadas correspondientes dentro de `handleSubmit`.
- `PROJECT_STATUS.md`.
- `docs/PROJECT_STATUS.md`.

Archivos temporales (`.tmp-analytics-qa/harness/`) creados durante la validación fueron eliminados antes del commit.

## Confirmaciones de privacidad y alcance

- No se envía la cantidad monetaria exacta en ningún evento.
- No se envían identificadores personales, correo, user ID, IP ni datos de sesión adicionales.
- No se cambió el dataset ni la lógica matemática de `src/lib/inflation`.
- No se cambiaron traducciones, metadata ni schema.
- No se añadió ninguna dependencia nueva.
- No se corrigió el desbordamiento móvil, el NaN del modo futuro ni la etiqueta "AÑOS" sin traducir (fuera de alcance, aún pendientes).

## Riesgos pendientes

- No existe validación automatizada del evento de cambio de modo (validado solo manualmente, ver justificación en la sección de tests).
- Los hallazgos preexistentes documentados en tareas anteriores (desbordamiento 320/375px, NaN en modo futuro con cantidad cero, etiqueta "AÑOS" sin traducir) siguen abiertos.
- El fallo preexistente y ajeno en `calculate-whatif.test.ts` sigue presente.
- Esta tarea no valida en producción real que GA4 reciba los eventos (explícitamente fuera de alcance; pendiente de una tarea de validación posterior).

## Siguiente tarea recomendada

Validar en producción real (tras el despliegue) que los tres eventos nuevos llegan correctamente a GA4 con los parámetros esperados, sin introducir cambios de código — tarea exclusivamente de validación, análoga a `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-PRODUCTION-VALIDATION-01`.
