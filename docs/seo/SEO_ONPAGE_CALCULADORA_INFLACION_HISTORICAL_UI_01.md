# SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-UI-01 — Interfaz funcional aislada del modo histórico

**Tarea:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-UI-01`  
**Tipo:** Implementación de Frontend (UI aislada)  
**Modelo Asignado:** Gemini CLI  

---

## 1. Objetivo y alcance

El objetivo principal de esta tarea ha sido diseñar y construir un componente de interfaz funcional, accesible y adaptativo para calcular la inflación histórica acumulada entre dos periodos mensuales empleando exclusivamente el dataset oficial del IPC versión 2002–presente de España ya integrado en el proyecto. 

Conforme al **principio de separación**, este componente se mantiene estrictamente aislado:
- No se realiza la integración visual/funcional dentro de `CalculatorInflation.tsx`.
- No se monta el componente en ninguna ruta o página pública activa.
- Todos los textos, etiquetas y mensajes de error visibles se reciben a través de propiedades (props) fuertemente tipadas, evitando modificar archivos de traducción de `next-intl` o acoplar la UI a un único idioma.
- No se añaden llamadas a red en runtime ni dependencias de telemetría o analíticas.

---

## 2. Documentos revisados

Para garantizar que el componente se alinea perfectamente con las decisiones arquitectónicas previas y con el sistema de diseño local, se han leído los siguientes documentos del repositorio:
- `PROJECT_STATUS.md` y `docs/PROJECT_STATUS.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_ARCHITECTURE_01.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_DATASET_01.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_LOGIC_01.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_TESTS_01.md`
- `docs/adr/ADR-CALCULADORA-INFLACION-DATOS-HISTORICOS-01.md`
- `src/components/landing/tools/CalculatorInflation.tsx` (estudio de tokens de estilo, estructura responsive y UX)

---

## 3. Arquitectura del componente y contrato de props

El componente se ha implementado en `src/components/landing/tools/CalculatorInflationHistorical.tsx`. Es un Client Component (`"use client"`) para dar soporte a la interactividad y gestión de estado local de los inputs y el cálculo.

Se ha definido y respetado estrictamente el contrato tipado de propiedades solicitado:

```typescript
export interface CalculatorInflationHistoricalLabels {
  amountLabel: string;
  amountPlaceholder: string;
  startPeriodLabel: string;
  endPeriodLabel: string;
  calculateButton: string;
  resultHeading: string;
  initialAmountLabel: string;
  equivalentAmountLabel: string;
  accumulatedInflationLabel: string;
  purchasingPowerChangeLabel: string;
  periodSummaryLabel: string;
  sourceLabel: string;
  sourceName: string;
  resetButton: string;
  invalidAmountError: string;
  invalidPeriodFormatError: string;
  periodNotAvailableError: string;
  invalidPeriodOrderError: string;
  genericError: string;
}

export interface CalculatorInflationHistoricalProps {
  labels: CalculatorInflationHistoricalLabels;
  locale: string;
}
```

---

## 4. Estados internos e inicialización

El componente gestiona su interactividad utilizando estados locales de React:
- `amountInput`: Guarda la entrada del campo de texto de cantidad (se conserva como string literal para un tecleado cómodo y sin saltos que impidan decimales intermedios).
- `startPeriod`: Cadena en formato `"YYYY-MM"` del mes inicial elegido.
- `endPeriod`: Cadena en formato `"YYYY-MM"` del mes final elegido.
- `error`: Mensaje localizado del error detectado en la validación (se inicializa en `null`).
- `result`: Objeto de tipo `HistoricalInflationResult` o `null`.

### Valores predeterminados en el montaje:
- **Cantidad inicial:** `"1000"` (recomendado en las especificaciones).
- **Mes final:** El último periodo disponible en el dataset real (obtenido dinámicamente llamando a `getLastAvailablePeriod()`).
- **Mes inicial:** Doce meses antes del último periodo disponible (calculado mediante restas de índices sobre el array inmutable de periodos `getAvailablePeriods()`). De este modo, se evita codificar estáticamente junio de 2026.
- **Pre-cálculo inicial:** El componente ejecuta el cálculo sobre estos valores por defecto durante su inicialización en el cuerpo del render, de manera que el usuario percibe un estado "vivo" y con resultados válidos desde el primer instante en lugar de una pantalla en blanco.

---

## 5. Selección y formateo localizado de periodos

La selección de periodos se realiza mediante dos elementos `<select>` nativos para garantizar una excelente accesibilidad en lectores de pantalla y soporte táctil móvil nativo.
- El valor interno asignado a cada `<option>` sigue el estándar ISO de la serie histórica: `YYYY-MM`.
- El texto visible de cada opción se genera dinámicamente empleando `Intl.DateTimeFormat` con el `locale` recibido.
- Se previene cualquier desfase o error de zona horaria parseando la cadena `YYYY-MM` y construyendo el objeto `Date` de forma explícita en el primer día de mes en hora UTC: `new Date(Date.UTC(year, month - 1, 1))` con la opción `{ timeZone: 'UTC' }`.

Ejemplo de resultado visible (según locale):
- **Para locale `"es"`**: `"enero de 2025"`, `"junio de 2026"`
- **Para locale `"en"`**: `"January 2025"`, `"June 2026"`

---

## 6. Flujo de cálculo, redondeo y deflación

### Ejecución:
Al enviar el formulario mediante el botón "Calcular" (o teclear Enter):
1. Se previene la recarga por defecto con `e.preventDefault()`.
2. Se limpian los errores anteriores y resultados previos.
3. Se convierte la cantidad a un flotante (`parseFloat`). Si la conversión falla o es negativa, se establece directamente el error localizado de cantidad.
4. Se llama de forma pura y exclusiva a `calculateHistoricalInflation` con el importe, el periodo inicial y final.
5. Se almacena el resultado exitoso en el estado local.

### Mapeo de errores técnicos:
Los errores lanzados por la lógica de dominio del tipo `InflationError` se capturan en un bloque `catch` y se mapean minuciosamente según su código `code`:
- `INVALID_AMOUNT` $\rightarrow$ `labels.invalidAmountError`
- `INVALID_PERIOD_FORMAT` $\rightarrow$ `labels.invalidPeriodFormatError`
- `PERIOD_NOT_AVAILABLE` $\rightarrow$ `labels.periodNotAvailableError`
- `INVALID_PERIOD_ORDER` $\rightarrow$ `labels.invalidPeriodOrderError`
- Cualquier otro error $\rightarrow$ `labels.genericError`

### Presentación de datos y redondeo:
Para no comprometer la precisión matemática, la lógica calcula sobre valores puros y el redondeo tiene lugar **exclusivamente** durante la presentación en pantalla usando `Intl.NumberFormat` con el `locale` recibido:
- **Importes monetarios:** Formateados en euros (`style: "currency", currency: "EUR"`), mostrando con decimales los resultados del modo histórico dado que en este escenario el ajuste de poder adquisitivo pasado es sensible al céntimo.
- **Porcentajes de inflación acumulada:** Se presentan formateados con exactamente una cifra decimal (p. ej., `+0,7%` o `-0,7%`), prefijados con signo explícito en el porcentaje principal para ilustrar de forma clara las tendencias.
- **Índices del IPC:** Para respetar la precisión oficial del INE, los índices de inicio y fin se muestran en el desglose secundario con sus exactamente tres cifras decimales.
- **Tratamiento de la deflación:** Cuando existe un mes final con índice menor al inicial (deflación real acumulada), la variación nominal es negativa. El componente **no la trunca a cero** ni altera el signo: se muestra con naturalidad el símbolo de resta correspondiente (p. ej., `-6,90 €`), coloreando los resultados de forma diferenciada con tonos verdes (`text-emerald-600`, `bg-emerald-50`) en lugar de los tonos rojos de inflación acumulada positiva.

---

## 7. Estructura visual, responsive y accesibilidad

### Estructura visual:
La arquitectura de marcas HTML imita fielmente la cuadrícula de la calculadora actual:
- **Izquierda (Sidebar de Inputs, `lg:col-span-4`)**: Contiene el formulario, campo numérico de importe, selects nativos para el rango temporal, contenedor del mensaje de error, botón de cálculo ("Calcular") y botón de reinicio ("Reiniciar").
- **Derecha (Visualización de Resultados, `lg:col-span-8`)**: Tarjeta principal que reproduce la estética Kakebo con un borde superior degradado, tarjetas para la cifra principal (Cantidad equivalente final) y la variación porcentual (Inflación acumulada), desglose de variables (Importe inicial, cambio de poder adquisitivo, índices de inicio/fin) y leyenda con la fuente de datos.

### Adaptación móvil y de pantalla (Responsive):
- En pantallas estrechas (móviles), la grid se apila de forma vertical (`grid-cols-1`). Los campos ocupan el ancho completo y el tamaño del botón y de los selects se adapta para ofrecer un área táctil cómoda.
- En pantallas grandes (escritorio), se distribuye en columnas con la proporción del sidebar de inputs fija a la izquierda y los paneles de desglose visualizados de forma clara a la derecha.
- Los textos y los importes largos cuentan con un manejo fluido para evitar desbordamientos horizontales o solapamientos.

### Accesibilidad (A11y):
- **Campos asociados:** Cada input o selector de formulario posee su etiqueta `<label>` vinculada mediante un `htmlFor` y un `id` únicos.
- **Lectores de pantalla:** 
  - El input numérico de cantidad cuenta con atributos `aria-invalid` y `aria-describedby` que apuntan dinámicamente al contenedor de error si éste existe.
  - El bloque de error se declara explícitamente con `role="alert"` para garantizar su lectura inmediata ante un fallo de validación.
  - El bloque de resultados a la derecha posee el atributo `aria-live="polite"`, permitiendo que el cambio de valores sea anunciado a los usuarios de tecnologías de asistencia al actualizar la consulta sin causar interrupciones molestas.
  - Se utilizan marcas `sr-only` para ofrecer una separación textual correcta en desgloses de cifras y leyendas.
- **Teclado:** Orden de tabulación natural y estilos táctiles consistentes. Los botones y elementos de entrada de datos son 100% interactivos empleando el teclado.

---

## 8. Validación técnica ejecutada

Se han ejecutado rigurosamente los comandos definidos en `package.json` para garantizar un estado robusto e impecable:

1. **Test específico de inflación**: `npx vitest run src/__tests__/lib/inflation/historical.test.ts` $\rightarrow$ **Pasan los 67 tests**.
2. **Suite global de tests**: `npx vitest run` $\rightarrow$ **Pasan 572/573 tests** (el único fallo detectado es el esperado, preexistente e independiente en `calculate-whatif.test.ts`, conforme al alcance de la tarea).
3. **Verificación de tipado estático**: `npx tsc --noEmit` $\rightarrow$ **0 errores (proceso limpio, sin incidencias)**.
4. **Análisis estático (Lint)**: `npm run lint` $\rightarrow$ **0 errores en el código nuevo**. El linter confirma un estado 100% impecable en la estructura de `CalculatorInflationHistorical.tsx`.
5. **Compilación de producción**: `npm run build` $\rightarrow$ **Pasa con éxito**.

---

## 9. Registro de cambios locales en git

Antes de concluir la tarea, se ha verificado el estado de cambios locales mediante `git diff --name-only`:
- **Creado:** `src/components/landing/tools/CalculatorInflationHistorical.tsx`
- **Creado:** `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_HISTORICAL_UI_01.md`
- **Modificados:** `PROJECT_STATUS.md` y `docs/PROJECT_STATUS.md`

No se han modificado ni alterado los archivos de datos (dataset), la lógica pura del dominio, traducciones de `next-intl` ni el componente preexistente `CalculatorInflation.tsx`, preservando así el principio de no integración precoz ni afección colateral.

---

## 10. Riesgos pendientes y siguiente tarea única recomendada

### Riesgos identificados:
- Ninguno en esta fase aislada. Al no haberse acoplado el componente con la página de producción ni con el enrutador público, el impacto colateral actual es inexistente.

### Siguiente tarea recomendada:
- **`SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-INTEGRATION-01`**: Creación del selector de modo (Tab switch) dentro de la calculadora pública, adición de traducciones e internacionalización (ES/EN) de etiquetas/errores para el nuevo modo histórico, e integración del subcomponente final en `CalculatorInflation.tsx`.
