# SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-INTEGRATION-01 — Integración del modo histórico

**Tarea:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-INTEGRATION-01`
**Modelo asignado:** Claude Code
**Tipo:** Integración de UI. **Sin analytics, sin metadata, sin schema, sin contenido editorial nuevo.**

## 1. Objetivo

Integrar `CalculatorInflationHistorical` (ya aprobado en `HISTORICAL-UI-REVIEW-01`) dentro de la calculadora pública `/herramientas/calculadora-inflacion` mediante un selector accesible de dos modos (proyección futura / inflación histórica), preservando intacto el modo actual y sin crear una URL nueva.

## 2. Commit base

`8af5ce4d24828fa3b70454a0c779086705090ebf`, rama `main`, sincronizada con `origin/main` al iniciar. Sin commits nuevos legítimos entre el commit base y el inicio de esta tarea.

## 3. Baseline confirmado antes de modificar

- Test específico de inflación: `67/67` ✅
- Suite completa: `572/573` (único fallo preexistente `calculate-whatif.test.ts`)
- `npx tsc --noEmit`: limpio
- `npm run build`: limpio
- Render local de `/herramientas/calculadora-inflacion`: HTTP 200, modo actual funcionando (10.000€/3%/10 años → -2.559€/7.441€, valores ya verificados en tareas anteriores)

## 4. Arquitectura de integración

Un único componente público de entrada (`CalculatorInflation.tsx`) sigue siendo el que se renderiza desde `page.tsx` (sin cambios en la página ni en el slug). Dentro de él:

- Se añade un `useState<"future" | "historical">("future")` para el modo activo — estado local simple, sin URL, sin `localStorage`, sin cookies, sin estado global.
- `useLocale()` de `next-intl` (patrón ya usado en `LanguageSwitcher.tsx`/`MonthSelector.tsx`) obtiene el locale actual para pasarlo a `CalculatorInflationHistorical`.
- El bloque JSX existente del modo futuro (grid de inputs + resultados + gráfico + CTA) se envuelve en un `role="tabpanel"` sin modificar su contenido interno.
- `CalculatorInflationHistorical` se renderiza en un segundo `role="tabpanel"`, recibiendo `labels` (construido desde `t("historical.*")`, namespace `Tools.Inflation.historical` creado en `HISTORICAL-I18N-01`) y `locale`.
- Cero duplicación de lógica: la fórmula de proyección sigue siendo la misma inline ya existente (no tocada); la fórmula histórica sigue exclusivamente dentro de `src/lib/inflation/historical.ts`, consumida únicamente a través de `CalculatorInflationHistorical`, sin acceso directo al dataset ni a `calculateHistoricalInflation` desde `CalculatorInflation.tsx`.
- La sección editorial SEO/GEO (definiciones, tabla, FAQ, enlaces internos) permanece fuera de ambos paneles, sin cambios y visible siempre, independiente del modo seleccionado.

## 5. Selector de modo

Implementado como **tabs accesibles** (patrón WAI-ARIA Tabs), no como botones simples ni radio group, por ser la semántica más precisa para "dos vistas alternativas de la misma herramienta que no coexisten":

- `role="tablist"` con `aria-label` (`t("modeSelector.label")` = "Tipo de cálculo"/"Calculation type").
- Dos `role="tab"` (`<button type="button">`) con `id`, `aria-selected`, `aria-controls` apuntando al panel correspondiente, `tabIndex` gestionado manualmente (`0` para el tab activo, `-1` para el inactivo, patrón roving tabindex).
- Dos `role="tabpanel"` con `aria-labelledby` apuntando al tab correspondiente.
- IDs únicos generados con `useId()` (mismo patrón ya usado y auditado en `CalculatorInflationHistorical.tsx`), evitando colisiones si el componente se monta más de una vez.
- Navegación por teclado: `ArrowLeft`/`ArrowRight` alternan el modo y mueven el foco al tab recién activado (`handleTabKeyDown`), además del comportamiento nativo de `Enter`/`Espacio` en un `<button>`.
- Indicación visual del modo activo mediante fondo sólido + texto en negrita (no solo color): el tab inactivo usa `text-muted-foreground`, el activo usa fondo `bg-stone-900`/`bg-stone-100` con texto invertido — combinación de forma, contraste y posición, no solo tono.

## 6. Claves de traducción añadidas

`Tools.Inflation.modeSelector` en `messages/es.json` y `messages/en.json`:

```json
{
  "label": "Tipo de cálculo" / "Calculation type",
  "future": "Proyección futura" / "Future projection",
  "historical": "Inflación histórica" / "Historical inflation"
}
```

Las 22 claves de `Tools.Inflation.historical` creadas en `HISTORICAL-I18N-01` **no se modificaron** (confirmado por diff: solo se añadió la nueva sub-clave `modeSelector`, sin tocar `historical`).

## 7. Conexión con las 22 etiquetas históricas

`CalculatorInflation.tsx` construye un objeto `historicalLabels: CalculatorInflationHistoricalLabels` mapeando explícitamente cada una de las 22 propiedades del contrato a `t("historical.<key>")`, sin hardcodear ningún texto y sin omitir ninguna clave (TypeScript obliga a la correspondencia exacta con la interfaz importada desde `CalculatorInflationHistorical.tsx`, lo que garantiza en tiempo de compilación que no falte ninguna etiqueta).

## 8. Preservación del modo futuro

Verificado en el harness de QA (ver sección 12): con el mismo input por defecto (10.000€, 3%, 10 años) el resultado es idéntico al ya verificado en tareas anteriores (pérdida -2.559€, valor real 7.441€, -25,6%). El modo futuro es el modo inicial al cargar el componente (`useState<CalculatorMode>("future")`), preservando la primera impresión de un usuario que ya conocía la herramienta. Ningún id existente (`savings-input`, `inflation-input`, `years-input`) fue renombrado. Ninguna traducción de `inputs`/`results`/`chart`/`content` fue modificada. El evento `tool_viewed` sigue disparándose igual en el montaje del componente (sin cambios en su lógica ni en su payload).

## 9. Gestión del estado entre modos

**Decisión: ambos paneles permanecen montados en todo momento**, ocultos mediante el atributo HTML `hidden` (no mediante renderizado condicional/desmontaje). Esto preserva el estado interno de `CalculatorInflationHistorical` (cantidad, periodos, resultado, error) al alternar de modo, sin necesidad de levantar ese estado al padre ni de añadir persistencia externa. Verificado explícitamente: tras introducir `cantidad=0`, `mes inicial=mes final=mayo de 2010` en modo histórico, cambiar a modo futuro y volver a modo histórico, los valores y el resultado seguían exactamente igual. No se usó `localStorage`, cookies, URL ni estado global, conforme a la restricción de la tarea.

## 10. Defecto real encontrado y corregido (único cambio de comportamiento fuera de la integración pura)

Durante la validación visual se detectó que el panel del modo futuro **seguía siendo visible** (con `offsetParent` real y `getBoundingClientRect()` no vacío) pese a tener el atributo `hidden` aplicado correctamente en el DOM. Causa raíz: ese `<div>` combinaba `hidden` con la clase Tailwind `grid` en el mismo elemento; la regla `[hidden] { display: none }` del user-agent stylesheet tiene la misma especificidad que la regla de utilidad `.grid { display: grid }` generada por Tailwind, y esta última gana la cascada por ser una hoja de estilos de autor (de origen posterior/mayor prioridad que la hoja UA), independientemente del orden de atributos en el HTML. Esto haría que, en producción real (no solo en el harness), el panel futuro permaneciera visible y superpuesto al cambiar a modo histórico.

**Corrección aplicada** (única modificación de `CalculatorInflation.tsx` motivada por un defecto, no por preferencia estética): se separó el wrapper `role="tabpanel"`/`hidden` (sin ninguna clase de `display`) del `<div className="grid lg:grid-cols-12 gap-8 items-start">` interno, añadiendo un nivel de anidamiento extra. Verificado tras el fix mediante inspección directa del DOM (`getBoundingClientRect()` vacío y `offsetParent: null` cuando `hidden` está activo) y visualmente (el panel futuro deja de mostrarse por completo al activar el modo histórico).

Este hallazgo se limita estrictamente a corregir el defecto (no se tocó ningún otro aspecto del modo futuro ni del componente histórico), conforme a la instrucción de la tarea de detenerse y documentar cualquier ajuste imprescindible.

## 11. Accesibilidad

- Nombre accesible del grupo: `aria-label` en el `tablist`.
- Estado seleccionado: `aria-selected` en cada `tab`.
- Navegación por teclado: flechas izquierda/derecha alternan y mueven el foco; `Tab` entra/sale del grupo de forma estándar gracias al patrón roving `tabIndex`.
- Foco visible: `focus-visible:outline` ya usado en el resto del proyecto, replicado en los botones del selector.
- Asociación tab↔panel: `aria-controls` / `aria-labelledby` cruzados correctamente (verificado con `read_page` del navegador: solo el panel activo aparece en el árbol de accesibilidad, el inactivo queda completamente excluido por `hidden`).
- Sin información transmitida solo por color: el tab activo se distingue también por fondo sólido invertido y negrita, no solo por tono.
- IDs únicos vía `useId()`, sin colisión si se monta más de una instancia.

## 12. Validación visual realizada

**Entorno de QA:** el servidor de desarrollo Next.js local (Turbopack) sufrió el mismo problema ya documentado en `HISTORICAL-UI-REVIEW-01` (inestabilidad/recarga del router local, en este caso un panic recurrente de Turbopack en una ruta no relacionada que forzaba recargas completas del cliente y reseteaba el estado de React antes de poder capturar cada interacción). Se reprodujo el mismo mecanismo de mitigación ya usado en esa tarea: un harness temporal aislado con Vite (`.tmp-ui-integration-qa/`, **eliminado por completo antes del commit**, no versionado) que renderiza `<CalculatorInflation />` real envuelto en `NextIntlClientProvider` con los mensajes reales de `messages/es.json`, con stubs solo para `@/i18n/routing` (Link) y `@/lib/analytics` (console.log), sin tocar la lógica de negocio.

**Casos verificados de forma interactiva (navegador real vía extensión Claude in Chrome, más una comprobación estática adicional con Chrome headless sobre el servidor Next real para confirmar HTTP 200 y el layout del modo futuro):**

- Estado inicial del modo futuro: idéntico a lo esperado (10.000€/3%/10 años → -2.559€/7.441€/-25,6%).
- Cambio futuro → histórico: renderiza `CalculatorInflationHistorical` con labels reales en español (Cantidad inicial, Mes inicial, Mes final, Calcular inflación histórica, Resultado de la inflación histórica, Variación del valor, Índice IPC inicial/final, Fuente: Instituto Nacional de Estadística (INE)).
- Caso oficial con valores por defecto del componente (junio 2025 → junio 2026, 1.000€): +3,2%, 1.032,04€, variación +32,04€.
- Deflación real (2002-06 → 2002-07, 1.000€): -0,7%, 993,05€, variación -6,95€, color esmeralda (no rojo), sin forzar a cero.
- Periodo invertido (2025-01 → 2002-01): error mostrado correctamente ("El mes inicial no puede ser posterior al mes final."), resultado anterior limpiado.
- Mismo periodo con cantidad 0 (mayo 2010 → mayo 2010, 0€): 0,00€, +0,0%, sin error.
- Cambio histórico → futuro → histórico: estado del panel histórico preservado exactamente (cantidad 0, mismo periodo, mismo resultado).
- Navegación por teclado: `ArrowLeft` desde el tab histórico activo mueve el foco y activa el tab "Proyección futura" (confirmado con `document.activeElement`).
- Responsive 768px: selector de tabs sin desborde, ambas etiquetas completas y legibles.
- Responsive 320px/375px: se detectó un desbordamiento horizontal del contenedor principal (encabezado y tarjetas cortados en el borde derecho) — **verificado como defecto preexistente, no introducido por esta integración**: se reprodujo el mismo desbordamiento, en los mismos puntos, en la versión del componente previa a esta tarea (`git stash` temporal de los 3 archivos modificados, captura de comparación, y `git stash pop` para restaurar). El selector de tabs no añade desbordamiento adicional: ocupa el mismo ancho de contenedor que el resto de la página y se corta en el mismo punto que el título y las tarjetas ya existentes. No se ha intentado corregir este defecto preexistente por estar fuera del alcance de esta tarea.

**Comprobación adicional de integridad tras el fix de la sección 10:** `getBoundingClientRect()` y `offsetParent` del panel oculto confirmados vacíos/`null` mediante `javascript_tool` en el navegador real.

## 13. Comandos ejecutados

```bash
git branch --show-current
git fetch origin
git log HEAD..origin/main --oneline
git status
npm run dev                      # servidor Next real, para HTTP 200 y capturas estáticas
npx tsc --noEmit
npx vitest run src/__tests__/lib/inflation/historical.test.ts
npm run test
npm run lint
npm run build
npx vite --config .tmp-ui-integration-qa/harness/vite.config.ts   # harness temporal, eliminado tras uso
git stash push -- src/components/landing/tools/CalculatorInflation.tsx messages/es.json messages/en.json
git stash pop
```

## 14. Tests

- Test específico de inflación (`src/__tests__/lib/inflation/historical.test.ts`): **67/67** ✅, sin modificar.
- No existían tests previos de `CalculatorInflation.tsx`/`CalculatorInflationHistorical.tsx` (confirmado por búsqueda) — no se ha creado una suite nueva de UI, conforme a la restricción de la tarea (no hay infraestructura de tests de componentes ya establecida para calculadoras en este proyecto).
- Suite completa: **572/573**, único fallo preexistente y ajeno (`calculate-whatif.test.ts`), no corregido.

## 15. TypeScript

`npx tsc --noEmit` → ✅ Exit 0, sin errores.

## 16. Lint

`npm run lint` → ✅ Exit 0, 0 errores, 76 warnings preexistentes (ninguno nuevo).

## 17. Build

`npm run build` → ✅ Exit 0, build completo sin errores, ruta `/herramientas/calculadora-inflacion` presente sin cambios de tamaño relevantes.

## 18. Archivos creados

- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_INTEGRATION_01.md`

(El harness temporal `.tmp-ui-integration-qa/` fue creado y **eliminado completamente antes del commit**, no forma parte de los archivos creados finales.)

## 19. Archivos modificados

- `src/components/landing/tools/CalculatorInflation.tsx` (selector de modo, integración del componente histórico, fix del bug `hidden`/`display`)
- `messages/es.json` (+5 líneas, `Tools.Inflation.modeSelector`)
- `messages/en.json` (+5 líneas, `Tools.Inflation.modeSelector`)
- `PROJECT_STATUS.md`
- `docs/PROJECT_STATUS.md`

## 20. Confirmación de ausencia de analytics

No se ha añadido ningún evento nuevo de analytics ni modificado el payload de los existentes (`tool_viewed`, `use_inflation_calculator`, `click_tool_to_app`, `tool_interaction` permanecen exactamente igual, sin parámetro `mode`). Esta decisión (ampliar o no el shape de analytics con el modo) sigue pendiente y fuera de alcance, tal como ya señalaba `HISTORICAL-ARCHITECTURE-01`.

## 21. Confirmación de que no cambiaron dataset, lógica ni tests

`git diff --name-only` no incluye `src/lib/inflation/**` ni `src/__tests__/lib/inflation/historical.test.ts` ni `scripts/update-ipc-dataset.ts`. Confirmado.

## 22. Confirmación de que no cambiaron metadata, schema ni slug

`src/app/[locale]/(landing)/herramientas/calculadora-inflacion/page.tsx` no aparece en el diff. El slug, el `SCHEMA` JSON-LD, el `BREADCRUMB_SCHEMA` y `generateMetadata` permanecen sin cambios.

## 23. Riesgos pendientes

1. **Desbordamiento horizontal preexistente a 320px/375px** (sección 12) — no introducido por esta tarea, pero heredado por el selector de tabs al compartir el mismo contenedor. Se recomienda una tarea de corrección específica del layout general de la página, fuera del alcance de la integración del modo histórico.
2. **Validación nativa del navegador en el input de cantidad histórica** (`type="number" min="0"` en `CalculatorInflationHistorical.tsx`, no modificado en esta tarea): al introducir un valor negativo y enviar el formulario con el ratón/teclado, el navegador puede mostrar su propio globo de validación HTML5 en lugar de (o antes de) que se muestre el mensaje `invalidAmountError` traducido, porque la restricción nativa `min="0"` intercepta el envío del formulario antes de que se ejecute el `onSubmit` de React. Detectado durante la validación visual de esta integración; **no corregido** por pertenecer al componente histórico ya aprobado en `HISTORICAL-UI-REVIEW-01` y no ser bloqueante para la integración en sí (el componente sigue funcionando correctamente vía teclado/Enter directo en el campo, y la validación de dominio sigue siendo correcta si el envío llega a ejecutarse). Se recomienda evaluarlo en una futura revisión específica del componente histórico.
3. Decisión pendiente (heredada, no resuelta aquí): si se debe añadir un parámetro `mode` a los eventos de analytics existentes o crear eventos específicos del modo histórico.
4. El fallo preexistente en `calculate-whatif.test.ts` permanece sin corregir (fuera de alcance).

## 24. Siguiente tarea recomendada

Decidir y documentar la estrategia de analytics para distinguir el uso del modo histórico frente al modo de proyección futura (`SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-ANALYTICS-01` o similar), antes de cualquier ampliación de metadata/schema que mencione el nuevo modo.
