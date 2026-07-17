# SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-I18N-01 — Traducciones del modo histórico

**Tarea:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-I18N-01`
**Modelo asignado:** Claude Code
**Tipo:** Traducciones ES/EN. **Sin integración del componente, sin selector de modos, sin analytics.**

## 1. Objetivo

Crear las traducciones completas en español e inglés que necesita `CalculatorInflationHistorical` (contrato `CalculatorInflationHistoricalLabels`), respetando la estructura existente de `next-intl` y la terminología económica correcta, dejando un namespace consumible por la futura tarea de integración sin montar el componente todavía.

## 2. Commit base

`2422636298253308348e1f3a0afa2e4f1879c857`, rama `main`, sincronizada con `origin/main` al iniciar. Sin commits nuevos legítimos detectados entre el commit base y el inicio de esta tarea.

## 3. Archivos revisados antes de modificar nada

- `PROJECT_STATUS.md`, `docs/PROJECT_STATUS.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_ARCHITECTURE_01.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_LOGIC_01.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_UI_REVIEW_01.md` (incluye el inventario final de labels y el riesgo pendiente sobre neutralidad de `purchasingPowerChangeLabel`, ya anticipado por Codex)
- `docs/adr/ADR-CALCULADORA-INFLACION-DATOS-HISTORICOS-01.md`
- `src/components/landing/tools/CalculatorInflationHistorical.tsx` (contrato `CalculatorInflationHistoricalLabels`, uso exacto de cada label, ausencia de interpolación de variables)
- `src/components/landing/tools/CalculatorInflation.tsx` (confirmado: no importa el componente histórico, no se toca)
- `messages/es.json` / `messages/en.json` (namespace `Tools.Inflation`, convenciones de nombres de sub-claves ya existentes: `meta`, `header`, `inputs`, `results`, `chart`, `cta`, `content`)

## 4. Namespace elegido

`Tools.Inflation.historical`, añadido como nueva sub-clave dentro del namespace **ya existente** de la calculadora de inflación (`Tools.Inflation`), al mismo nivel que `meta`/`header`/`inputs`/`results`/`chart`/`cta`/`content`. No se usó la jerarquía `CalculatorInflation.historical` propuesta como ejemplo conceptual en la tarea, porque el repositorio ya usa `Tools.Inflation` (no `CalculatorInflation`) como namespace real para esta herramienta — se prioriza la convención existente sobre el ejemplo conceptual, tal como exige la tarea. El contenido del modo de proyección actual (`inputs`, `results`, `chart`, `content`) queda completamente intacto y separado.

## 5. Contrato de labels cubierto

Las 22 claves exactas requeridas por `CalculatorInflationHistoricalLabels` (`src/components/landing/tools/CalculatorInflationHistorical.tsx`), sin omisiones ni claves adicionales sin uso:

```
amountLabel, amountPlaceholder, startPeriodLabel, endPeriodLabel, calculateButton,
resultHeading, initialAmountLabel, equivalentAmountLabel, accumulatedInflationLabel,
purchasingPowerChangeLabel, periodSummaryLabel, startIndexLabel, endIndexLabel,
sourceLabel, sourceName, resetButton, invalidAmountError, invalidPeriodFormatError,
periodNotAvailableError, invalidPeriodOrderError, genericError, emptyStateMessage
```

## 6. Tabla completa español/inglés

| Clave | Español | Inglés |
|---|---|---|
| `amountLabel` | Cantidad inicial | Initial amount |
| `amountPlaceholder` | Introduce una cantidad | Enter an amount |
| `startPeriodLabel` | Mes inicial | Start month |
| `endPeriodLabel` | Mes final | End month |
| `calculateButton` | Calcular inflación histórica | Calculate historical inflation |
| `resultHeading` | Resultado de la inflación histórica | Historical inflation result |
| `initialAmountLabel` | Cantidad inicial | Initial amount |
| `equivalentAmountLabel` | Cantidad equivalente en el mes final | Equivalent amount in the final month |
| `accumulatedInflationLabel` | Inflación acumulada | Cumulative inflation |
| `purchasingPowerChangeLabel` | Variación del valor | Change in value |
| `periodSummaryLabel` | Periodo analizado | Analysed period |
| `startIndexLabel` | Índice IPC inicial | Initial CPI index |
| `endIndexLabel` | Índice IPC final | Final CPI index |
| `sourceLabel` | Fuente | Source |
| `sourceName` | Instituto Nacional de Estadística (INE) | Spanish National Statistics Institute (INE) |
| `resetButton` | Restablecer | Reset |
| `invalidAmountError` | Introduce una cantidad válida igual o superior a cero. | Enter a valid amount equal to or greater than zero. |
| `invalidPeriodFormatError` | El formato del periodo seleccionado no es válido. | The selected period format is invalid. |
| `periodNotAvailableError` | No hay datos disponibles para uno de los periodos seleccionados. | Data is not available for one of the selected periods. |
| `invalidPeriodOrderError` | El mes inicial no puede ser posterior al mes final. | The start month cannot be later than the end month. |
| `genericError` | No se ha podido realizar el cálculo. Inténtalo de nuevo. | The calculation could not be completed. Please try again. |
| `emptyStateMessage` | Introduce una cantidad y selecciona dos meses para calcular la inflación acumulada. | Enter an amount and select two months to calculate cumulative inflation. |

Textos usados literalmente tal como recomendados por la tarea, sin alterar su significado.

## 7. Criterio terminológico

Español natural de España, sin tecnicismos financieros innecesarios (mismo tono ya usado en `content.methodologyIntro`/`limitationsList` del namespace existente). Inglés neutral, equivalencia semántica (no traducción palabra por palabra): p. ej. `sourceName` usa "Spanish National Statistics Institute (INE)" en vez de una traducción literal de "Instituto Nacional de Estadística", igual que ya hace `content.revisionNote` en inglés para la misma institución. Coherencia de puntuación: los mensajes de error terminan en punto en ambos idiomas; los labels cortos (botones, encabezados de campo) no llevan punto final, siguiendo el mismo patrón que `inputs`/`results` del modo de proyección existente.

## 8. Tratamiento neutral de inflación y deflación

`purchasingPowerChangeLabel` se tradujo como "Variación del valor" / "Change in value" — **no** como "pérdida de poder adquisitivo" ni "aumento necesario", exactamente conforme al riesgo ya anticipado en `HISTORICAL-UI-REVIEW-01` (`requiredNominalIncrease` puede ser positivo, cero o negativo). `accumulatedInflationLabel` ("Inflación acumulada" / "Cumulative inflation") se mantiene como una única etiqueta neutral, sin variante para deflación: el componente ya comunica el signo mediante el valor numérico con `+`/`-` explícito y color (ver `CalculatorInflationHistorical.tsx`, líneas 358-384), no mediante texto condicional en la traducción. No se ha añadido lógica condicional dentro de los mensajes ni una segunda etiqueta para deflación, conforme a la restricción explícita de la tarea.

## 9. Mensajes de error

Los 5 mensajes de error explican qué debe corregir el usuario sin exponer los códigos técnicos internos (`INVALID_AMOUNT`, `INVALID_PERIOD_FORMAT`, `PERIOD_NOT_AVAILABLE`, `INVALID_PERIOD_ORDER`) ni el texto de `InflationError.message` (que permanece en español técnico dentro de `src/lib/inflation/errors.ts`, sin traducir directamente — el componente ya realiza el mapeo `code → label` en su propio `handleSubmit`, ver líneas 178-205 de `CalculatorInflationHistorical.tsx`). Ningún mensaje culpa al usuario ("cantidad inválida" se reformula como instrucción positiva: "Introduce una cantidad válida..."). Puntuación consistente (punto final) y equivalencia semántica exacta entre ambos idiomas.

## 10. Fuente

`sourceLabel`/`sourceName` identifican claramente al INE en ambos idiomas, sin enlaces, URLs ni HTML embebido en los valores (la futura integración decide cómo enlazar la fuente oficial, igual que ya ocurre con `ipcLink`/`rentToolLink`/`varipcLink` en el namespace `content` del modo de proyección, que sí usa tags de interpolación mediante `t.rich`, un patrón distinto no replicado aquí porque el componente histórico no lo consume todavía).

## 11. Validación de paridad entre idiomas

Ejecutada mediante script Node ad hoc (no versionado) que compara las claves de `Tools.Inflation.historical` en ambos JSON:

```
ES keys count: 22
EN keys count: 22
Keys match exactly: true
Matches contract exactly: true (contra las 22 claves de CalculatorInflationHistoricalLabels)
Missing in ES vs contract: []
Extra in ES vs contract: []
```

Sin claves vacías en ninguno de los dos idiomas (comprobado explícitamente). No se ha usado interpolación (`{variable}`) en ninguna clave nueva, porque el componente no consume ninguna variable de traducción para estas labels (confirmado por inspección: todas se usan como `labels.<key>` directo, sin `t.rich`/`t(..., {values})`).

## 12. Ausencia de integración

`src/components/landing/tools/CalculatorInflationHistorical.tsx` y `src/components/landing/tools/CalculatorInflation.tsx` no fueron modificados en esta tarea (confirmado por `git diff --name-only`). El componente histórico sigue sin montarse en ninguna página pública, sin selector de modos y sin `next-intl` importado dentro de él — solo se le ha preparado el namespace de traducciones que la futura tarea de integración pasará como prop `labels`.

## 13. Comandos ejecutados

```bash
node -e "..."   # validación de JSON válido + paridad de claves + contrato completo (script ad hoc, no versionado)
npx vitest run src/__tests__/lib/inflation/historical.test.ts
npm run test
npx tsc --noEmit
npm run lint
npm run build
```

## 14. Validaciones técnicas

| Comando | Resultado |
|---|---|
| Validación JSON (`require` de ambos archivos) | ✅ ambos parsean sin error |
| Paridad de claves ES/EN | ✅ 22/22, coincidencia exacta con el contrato |
| Test específico de inflación | ✅ 67/67 |
| Suite completa | ⚠️ 572/573 — único fallo preexistente y ajeno (`calculate-whatif.test.ts`), no corregido |
| `npx tsc --noEmit` | ✅ Exit 0, sin errores |
| `npm run lint` | ✅ Exit 0, 0 errores, 76 warnings preexistentes (ninguno nuevo) |
| `npm run build` | ✅ Exit 0, build completo sin errores |

## 15. Archivos creados

- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_I18N_01.md`

## 16. Archivos modificados

- `messages/es.json` (+24 líneas, nueva clave `Tools.Inflation.historical`)
- `messages/en.json` (+24 líneas, nueva clave `Tools.Inflation.historical`)
- `PROJECT_STATUS.md`
- `docs/PROJECT_STATUS.md`

Diff limpio y localizado: `git diff --stat` confirma únicamente inserciones (24+24 líneas) en los dos archivos de traducción, sin reordenar ni reformatear secciones no relacionadas.

## 17. Confirmación de que no se integró el componente

Confirmado: `CalculatorInflationHistorical.tsx` y `CalculatorInflation.tsx` no aparecen en el diff de esta tarea. No se ha creado ningún selector de modos, ninguna página pública fue tocada, y no se añadió ningún import de `next-intl` dentro del componente histórico.

## 18. Riesgos pendientes

1. La futura integración debe pasar `labels` construidos a partir de `Tools.Inflation.historical` (vía `useTranslations("Tools.Inflation.historical")` o equivalente) y `locale` al componente — no se ha verificado en esta tarea el "wiring" real de `next-intl` porque el componente sigue sin montarse.
2. Si en el futuro se decide enlazar la fuente oficial (INE) con una URL, habrá que decidir si se reutiliza el patrón `t.rich` con tags (`ipcLink`, etc.) ya usado en `content`, lo cual requeriría cambiar el contrato de `sourceName`/`sourceLabel` de string simple a un patrón con children — decisión explícitamente fuera de esta tarea.
3. El fallo preexistente en `calculate-whatif.test.ts` permanece sin corregir (fuera de alcance).
4. El rango 1961–2001 sigue sin resolverse (heredado, no afecta a esta tarea).

## 19. Siguiente tarea recomendada

`SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-INTEGRATION-01` — integrar `CalculatorInflationHistorical` en `CalculatorInflation.tsx` mediante un selector de modos, consumiendo el namespace `Tools.Inflation.historical` creado en esta tarea vía `next-intl`, sin analytics todavía.
