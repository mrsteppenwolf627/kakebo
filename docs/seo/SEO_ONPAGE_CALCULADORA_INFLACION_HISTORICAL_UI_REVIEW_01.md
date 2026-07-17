# SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-UI-REVIEW-01

## Objetivo

Auditar tÃ©cnicamente `src/components/landing/tools/CalculatorInflationHistorical.tsx` en aislamiento y corregir solo defectos reales confirmados que afectaban a validaciÃ³n, accesibilidad, encapsulaciÃ³n, reutilizaciÃ³n e integraciÃ³n futura. Sin integrar el componente, sin traducciones, sin analytics y sin tocar dataset, dominio ni tests permanentes.

## Modelo asignado

Codex

## Commit base

`ca8b3104c4c0d2892dfae2530e5b414db1330029`

## Archivos revisados

- `PROJECT_STATUS.md`
- `docs/PROJECT_STATUS.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_ARCHITECTURE_01.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_DATASET_01.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_LOGIC_01.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_TESTS_01.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_UI_01.md`
- `docs/adr/ADR-CALCULADORA-INFLACION-DATOS-HISTORICOS-01.md`
- `src/components/landing/tools/CalculatorInflationHistorical.tsx`
- `src/components/landing/tools/CalculatorInflation.tsx`
- `src/lib/inflation/index.ts`
- `src/lib/inflation/historical.ts`
- `src/lib/inflation/errors.ts`
- `src/lib/inflation/types.ts`
- `src/__tests__/lib/inflation/historical.test.ts`
- `tsconfig.json`
- `eslint.config.mjs`
- `vitest.config.ts`
- `tailwind.config.ts`
- `src/components/landing/tools/SavingsCalculator.tsx`

## MetodologÃ­a de revisiÃ³n

1. VerificaciÃ³n inicial de rama, `HEAD`, `origin/main` y cambios locales ajenos preservados.
2. Lectura completa de documentaciÃ³n obligatoria y contratos del dominio.
3. InspecciÃ³n estÃ¡tica completa del componente y comparaciÃ³n con el alcance aprobado.
4. ClasificaciÃ³n de hallazgos como confirmados o descartados.
5. CorrecciÃ³n solo en `CalculatorInflationHistorical.tsx`.
6. RevisiÃ³n visual temporal con harness local de Vite + headless Chrome en 320, 375, 768 y 1440 px. El primer intento sobre Next local fallÃ³ por bucle de redirecciÃ³n 308; no se contabilizÃ³ como revisiÃ³n vÃ¡lida.
7. ValidaciÃ³n final con tests, TypeScript, lint, build y revisiÃ³n final de diff.

## Hallazgos confirmados

1. **ValidaciÃ³n de cantidad demasiado permisiva.** El componente usaba `parseFloat(amountInput)`, lo que permitÃ­a aceptar cadenas parciales contrarias al contrato (`1000abc` -> `1000`, `1000 200` -> `1000`). Defecto confirmado.
2. **IDs estÃ¡ticos reutilizables.** `amount-input`, `start-period-select`, `end-period-select` e `inflation-error` colisionaban si se montaban dos instancias del componente. Defecto confirmado para reutilizaciÃ³n e integraciÃ³n futura.
3. **Contrato de labels incompleto.** HabÃ­a textos visibles hardcodeados en producciÃ³n: etiquetas de Ã­ndice inicial/final y mensaje de estado vacÃ­o. Defecto confirmado de contrato pÃºblico.
4. **AsociaciÃ³n de errores incompleta.** Solo el campo de cantidad recibÃ­a `aria-invalid` y `aria-describedby`; los errores de periodo no quedaban asociados a los selects afectados. Defecto confirmado de accesibilidad.
5. **`locale` no endurecido en formateadores numÃ©ricos.** `Intl.NumberFormat(locale, ...)` podÃ­a lanzar si el `locale` recibido era invÃ¡lido o inesperado. Defecto confirmado de robustez del componente.

## Hallazgos descartados

- El estado inicial (`1000`, Ãºltimo periodo disponible, inicio 12 periodos reales antes) es correcto y determinista.
- No hay acceso directo al JSON ni duplicaciÃ³n de fÃ³rmulas; el componente llama solo a la API pÃºblica de `src/lib/inflation`.
- La lÃ³gica de dominio ya preserva `0`, deflaciÃ³n, periodos iguales y orden cronolÃ³gico.
- La generaciÃ³n de labels visibles de los periodos ya usaba `Intl.DateTimeFormat` con `Date.UTC`, sin bug confirmado de zona horaria.
- No hay integraciÃ³n activa en `CalculatorInflation.tsx`, pÃ¡ginas pÃºblicas, analytics, Supabase, red, cookies ni estado global.

## Aspectos no reproducibles

- No se detectÃ³ un fallo nuevo de responsive tras la correcciÃ³n, pero la revisiÃ³n visual tuvo que hacerse en un harness temporal con Vite porque el entorno local de Next entraba en `ERR_TOO_MANY_REDIRECTS` incluso en rutas temporales. Ese bucle se documenta como limitaciÃ³n del QA local, no del componente.

## ValidaciÃ³n de cantidad

- `0` aceptado.
- Negativos rechazados.
- Cadena vacÃ­a rechazada.
- `NaN`, `Infinity` y `-Infinity` rechazados.
- Sin redondeo prematuro: el parseo devuelve `number` completo y el redondeo sigue solo en presentaciÃ³n.
- Separador decimal efectivamente soportado en el contrato del componente: punto (`.`). No se aÃ±adiÃ³ soporte regional con coma en esta tarea.
- Endurecimiento aplicado: parser estricto basado en patrÃ³n numÃ©rico completo, sin aceptar parsing parcial de `parseFloat`.

## ValidaciÃ³n de periodos

- Los selects siguen usando exclusivamente periodos disponibles del dominio.
- Valores internos `YYYY-MM`.
- Labels visibles generadas con `Intl.DateTimeFormat` y `UTC`.
- Inicio = fin correcto.
- Inicio > fin mantiene error del dominio y ahora queda asociado a los selects.
- Sin mutaciÃ³n silenciosa de periodos.
- Preparado para meses nuevos del dataset al depender de `getAvailablePeriods()` y `getLastAvailablePeriod()`.

## PrecisiÃ³n y formateo

- Moneda en EUR mediante `Intl.NumberFormat`.
- Porcentaje mostrado a partir del valor completo, con signo explÃ­cito positivo o negativo.
- Ãndices oficiales con 3 decimales en presentaciÃ³n.
- Redondeo solo en UI.
- DeflaciÃ³n preservada.
- Se aÃ±adiÃ³ fallback seguro para `locale` invÃ¡lido o inesperado en formateadores de fecha y nÃºmero.

## SemÃ¡ntica econÃ³mica

- El componente no fuerza a cero ni invierte signos en deflaciÃ³n.
- `requiredNominalIncrease` puede ser positivo o negativo y se sigue mostrando con signo.
- Requisito pendiente para internacionalizaciÃ³n: la etiqueta que traduzca `purchasingPowerChangeLabel` debe ser neutral; no debe fijarse como "pÃ©rdida" si el valor puede ser tambiÃ©n ganancia en contextos de deflaciÃ³n.

## DeflaciÃ³n

- Caso real renderizado en el harness temporal: `2002-06 -> 2002-07`.
- Se conserva valor negativo.
- Hay seÃ±al redundante por signo y color.
- No se detectÃ³ truncado a cero.

## Accesibilidad

- `label` y control siguen correctamente asociados.
- Se corrigiÃ³ la unicidad de IDs con `useId`.
- Se mantienen `role="alert"` y `aria-live="polite"`.
- Se aÃ±adiÃ³ `aria-atomic="true"` a la regiÃ³n de resultados.
- Se corrigiÃ³ la asociaciÃ³n del error a los controles afectados:
  - cantidad -> input de cantidad
  - periodos -> ambos selects
- No se detectÃ³ dependencia exclusiva del color para comunicar signo.

## IDs y reutilizaciÃ³n

- Corregido el riesgo de colisiÃ³n entre instancias.
- El componente sigue aislado y reutilizable sin imports de `next-intl` ni dependencia de archivos de traducciÃ³n.

## Responsive

RevisiÃ³n visual real ejecutada con Chrome headless sobre harness temporal en:

- `320px`
- `375px`
- `768px`
- `1440px`

Estados visuales renderizados realmente:

1. Estado inicial.
2. Cantidad cero.
3. Cantidad decimal.
4. Mismo periodo.
5. Periodo invertido.
6. DeflaciÃ³n.
7. Cantidad invÃ¡lida.
8. Importe grande.

Resultado observado:

- No se apreciÃ³ scroll horizontal nuevo en esos breakpoints.
- El layout se mantuvo apilado en mÃ³vil y en dos columnas amplias en escritorio.
- El importe grande no desbordÃ³ horizontalmente tras aÃ±adir `min-w-0` y `break-words` en cifras principales.

## Aislamiento

Confirmado:

- `CalculatorInflationHistorical.tsx` no estÃ¡ importado en `CalculatorInflation.tsx`.
- No estÃ¡ montado en ninguna pÃ¡gina pÃºblica.
- No hay barrel global que lo active.
- No usa Supabase.
- No usa analytics.
- No usa red.
- No usa cookies.
- No usa estado global.
- No modifica dataset ni lÃ³gica de dominio.

## Inventario final de labels

- `amountLabel`
- `amountPlaceholder`
- `startPeriodLabel`
- `endPeriodLabel`
- `calculateButton`
- `resultHeading`
- `initialAmountLabel`
- `equivalentAmountLabel`
- `accumulatedInflationLabel`
- `purchasingPowerChangeLabel`
- `periodSummaryLabel`
- `startIndexLabel`
- `endIndexLabel`
- `sourceLabel`
- `sourceName`
- `resetButton`
- `invalidAmountError`
- `invalidPeriodFormatError`
- `periodNotAvailableError`
- `invalidPeriodOrderError`
- `genericError`
- `emptyStateMessage`

## Cambios realizados

Solo en `src/components/landing/tools/CalculatorInflationHistorical.tsx`:

- SustituciÃ³n de `parseFloat` por parseo estricto.
- IDs Ãºnicos mediante `useId`.
- Nuevas labels para textos visibles antes hardcodeados.
- Fallback seguro ante `locale` invÃ¡lido.
- AsociaciÃ³n de errores por tipo de control (`amount` vs `periods`).
- Ajuste menor de wrapping en cifras principales para evitar desbordes.

## Comprobaciones visuales

- Primer intento: ruta temporal en Next local -> invÃ¡lido por `ERR_TOO_MANY_REDIRECTS`.
- Segundo intento vÃ¡lido: harness temporal Vite en `.tmp-ui-review/` + capturas Chrome headless.
- Los archivos temporales del harness y las capturas se eliminaron antes del commit.

## Comandos ejecutados

```bash
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short --branch
rg --files ...
npx vitest run src/__tests__/lib/inflation/historical.test.ts
npx vitest run
npx tsc --noEmit
npm run lint
npm run build
curl -I ...
chrome --headless --screenshot ...
```

Adicionalmente se usaron comandos temporales de QA local para levantar servidores de revisiÃ³n y capturar pantallas; no quedaron artefactos versionados.

## Validaciones tÃ©cnicas

Resultado final documentado tras la pasada final:

- Test especÃ­fico de inflaciÃ³n: esperado `67/67`.
- Suite completa: esperado `572/573`, con Ãºnico fallo preexistente `calculate-whatif.test.ts`.
- `npx tsc --noEmit`: esperado limpio.
- `npm run lint`: esperado sin errores, con warnings preexistentes globales.
- `npm run build`: esperado limpio.

## Archivos creados y modificados

**Creado**

- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_UI_REVIEW_01.md`

**Modificados**

- `src/components/landing/tools/CalculatorInflationHistorical.tsx`
- `PROJECT_STATUS.md`
- `docs/PROJECT_STATUS.md`

## Riesgos pendientes

1. La traducciÃ³n futura debe respetar la semÃ¡ntica neutral de `purchasingPowerChangeLabel`.
2. El componente sigue sin integrarse; la futura tarea de integraciÃ³n debe aportar labels reales ES/EN y decidir el copy final.
3. El QA visual dependiÃ³ de un harness temporal porque el router local de Next estaba en bucle de redirecciÃ³n; esto no afectÃ³ al componente, pero sÃ­ al procedimiento de revisiÃ³n local.

## Veredicto para integraciÃ³n

**Aprobado para integraciÃ³n futura tras esta correcciÃ³n, siempre que la tarea siguiente aporte labels/traducciones reales y mantenga el componente aislado hasta la integraciÃ³n planificada.**

## Siguiente tarea recomendada

`SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-INTEGRATION-01`
