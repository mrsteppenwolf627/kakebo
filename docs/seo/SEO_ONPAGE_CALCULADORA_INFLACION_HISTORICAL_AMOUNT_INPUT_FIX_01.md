# SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-AMOUNT-INPUT-FIX-01

## Objetivo

Corregir el defecto H1 (severidad alta) detectado en la validación de producción de la calculadora de inflación histórica: el campo de cantidad usaba `type="number" min="0"`, lo que activaba la validación nativa HTML5 del navegador y bloqueaba silenciosamente el envío del formulario para valores inválidos (`-1`, `+`, `-`, `.`), tanto por clic como por Enter, sin que el `onSubmit` de React llegara a ejecutarse. Como consecuencia no se mostraba `invalidAmountError` y quedaba visible el resultado anterior.

## Commit base

`732fcdeca2490b8833fad7a56be5488764bfdd6a` (docs(validation): verify historical inflation production).

## Defecto reproducido

Reproducido en un harness Vite aislado (`.tmp-amount-fix-qa/harness`, eliminado tras la validación) que renderiza `CalculatorInflationHistorical` de forma independiente, evitando la inestabilidad conocida del servidor de desarrollo Next/Turbopack en este entorno.

Antes del cambio:
- Escribir `-1` en el campo y pulsar "Calcular inflación histórica" (clic real de ratón) o Enter no mostraba ningún mensaje de error.
- El resultado previamente calculado permanecía visible sin cambios.
- La causa: `type="number" min="0"` hace que el navegador intercepte el evento de envío mediante la validación de restricciones nativa (`validity.rangeUnderflow` / `validity.badInput`) antes de que React reciba el `submit`.

## Causa raíz

El `<input>` de cantidad usaba `type="number" min="0" step="any"`. La lógica de validación estricta en React (`STRICT_AMOUNT_PATTERN`, `parseStrictAmount`, `handleSubmit`) ya era correcta, pero nunca llegaba a ejecutarse para ciertos valores porque el navegador bloqueaba el evento `submit` de forma nativa y silenciosa.

## Solución aplicada

Único archivo funcional modificado: `src/components/landing/tools/CalculatorInflationHistorical.tsx`.

Cambio en el input de cantidad (antes):
```tsx
<input
  id={amountInputId}
  type="number"
  min="0"
  step="any"
  placeholder={labels.amountPlaceholder}
  value={amountInput}
  onChange={(e) => setAmountInput(e.target.value)}
  aria-invalid={amountHasError}
  aria-describedby={amountHasError ? describedBy : undefined}
  className="..."
/>
```

Después:
```tsx
<input
  id={amountInputId}
  type="text"
  inputMode="decimal"
  autoComplete="off"
  placeholder={labels.amountPlaceholder}
  value={amountInput}
  onChange={(e) => setAmountInput(e.target.value)}
  aria-invalid={amountHasError}
  aria-describedby={amountHasError ? describedBy : undefined}
  className="..."
/>
```

No se modificó `STRICT_AMOUNT_PATTERN`, `parseStrictAmount`, `handleSubmit`, `DEFAULT_AMOUNT`, ni ninguna otra lógica de dominio: esa lógica ya era correcta y solo necesitaba recibir el evento `submit`.

## Comportamiento anterior vs nuevo

| Caso | Antes | Después |
|---|---|---|
| Clic con valor inválido (p.ej. `-1`) | Sin error, resultado anterior visible sin cambios | `invalidAmountError` visible, resultado anterior limpiado, valor preservado |
| Enter con valor inválido | Igual que el clic (bloqueo nativo) | Igual comportamiento que el clic |
| Clic/Enter con valor válido | Funcionaba correctamente | Sin cambios, sigue funcionando correctamente |

## Validación por clic y por Enter

Confirmado mediante interacción real de ratón y teclado en el harness aislado:
- **Clic real** con `1000abc`: error visible, valor `1000abc` preservado en el campo, resultado anterior sustituido por el mensaje de estado vacío.
- **Enter** con `2500` (válido): recalculado correctamente a 2580,09 €, +3,2%.
- **Enter** con `-1` (inválido): error visible, valor `-1` preservado, resultado anterior (2500) limpiado.

Ambas vías (clic y Enter) muestran comportamiento idéntico, cumpliendo el requisito del defecto.

## Valores válidos comprobados

`0`, `1`, `1000`, `1000.50`, `0.01`, `999999999999` — los seis producen resultado (`hasResult: true`), sin error, sin `NaN`/`Infinity` en el resultado.

## Valores inválidos comprobados

Cadena vacía, `-1`, `+`, `-`, `.`, `1e`, `1000abc`, `1000 200`, `1,5`, `NaN`, `Infinity`, `-Infinity` — los doce producen `invalidAmountError` (`alertShown: true`), sin resultado (`hasResult: false`), sin fuga de `NaN`/`Infinity` en el DOM.

## Limpieza de resultados anteriores

Confirmado explícitamente: tras un envío inválido, el resultado previamente calculado desaparece siempre (el `handleSubmit` ya invocaba `setResult(null)` antes de validar; ahora ese código se ejecuta siempre porque el `submit` ya no es bloqueado).

## Accesibilidad

- Se mantiene `inputMode="decimal"` para conservar el teclado numérico en móviles a pesar de usar `type="text"`.
- Se mantienen `aria-invalid` y `aria-describedby` sin cambios de comportamiento.
- Se añade `autoComplete="off"` para evitar autocompletados del navegador ahora que el campo es de tipo texto libre.
- No se reduce ninguna característica de accesibilidad existente.

## Tests añadidos (o razón para no añadirlos)

No se añadieron tests de componente. Se verificó que no existe una convención/infraestructura establecida en el repositorio para tests de componentes React de esta familia (`CalculatorInflation`, `CalculatorInflationHistorical`): `src/__tests__/` solo contiene tests de `agents`, `agents-v2`, `ai`, `api`, `lib` y `schemas`, ningún test de componente UI. Introducir dicha infraestructura no estaba dentro del alcance de esta tarea (no se permiten nuevas dependencias/infraestructura). En su lugar se realizó una validación manual reproducible y documentada (ver secciones anteriores), ejecutada sobre un harness Vite aislado y mediante interacción real de ratón/teclado.

## Validación responsive

No se realizaron cambios de CSS, `className` ni de estructura de layout: la única modificación es a nivel de atributos del elemento `<input>` (`type`, `inputMode`, `autoComplete`). Por tanto el comportamiento responsive (incluido el desbordamiento horizontal preexistente a 320/375px, fuera de alcance) no se ve alterado por este cambio. Se comprobó además que el comportamiento funcional (mostrar error, preservar valor, limpiar resultado) es independiente del tamaño de ventana, verificado en distintos anchos de viewport disponibles en el entorno de prueba.

## Comandos ejecutados

- `npx vitest run src/__tests__/lib/inflation/historical.test.ts` → 67/67 passed.
- `npm run test` → 572/573 passed (única falla preexistente: `calculate-whatif.test.ts`, fuera de alcance).
- `npx tsc --noEmit` → sin errores.
- `npm run lint` → 0 errores, 76 warnings preexistentes no relacionados con el archivo modificado.
- `npm run build` → build completado correctamente.

## Archivos creados

- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_AMOUNT_INPUT_FIX_01.md` (este documento).

## Archivos modificados

- `src/components/landing/tools/CalculatorInflationHistorical.tsx` (único archivo funcional).
- `PROJECT_STATUS.md`.
- `docs/PROJECT_STATUS.md`.

Archivos temporales creados durante la validación (`.tmp-amount-fix-qa/harness/`) fueron eliminados antes del commit.

## Riesgos pendientes

- El defecto de desbordamiento horizontal a 320/375px sigue presente y no ha sido corregido (fuera de alcance explícito de esta tarea).
- El `NaN` con cantidad cero en modo futuro/proyección sigue presente y no ha sido corregido (fuera de alcance).
- La etiqueta "AÑOS" sin traducir sigue presente y no ha sido corregida (fuera de alcance).
- El test `calculate-whatif.test.ts` sigue fallando por un motivo preexistente no relacionado con esta tarea.

## Siguiente tarea única recomendada

Corregir el defecto preexistente de desbordamiento horizontal a 320/375px en el modo histórico, ya identificado y documentado en la validación de producción anterior, manteniendo fuera de alcance el modo futuro/proyección y sin tocar la lógica de dominio.
