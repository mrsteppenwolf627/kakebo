# SEO-ONPAGE-CALCULADORA-INFLACION-CONCATENATED-TEXT-01 — Corregir textos concatenados

**Tarea:** `SEO-ONPAGE-CALCULADORA-INFLACION-CONCATENATED-TEXT-01`
**Tipo:** Corrección de semántica HTML y accesibilidad. Sin cambios de copy, diseño, funcionalidad, metadata ni lógica matemática.

## 1. Objetivo

Corregir los fragmentos de texto que aparecen concatenados en el HTML/DOM de `https://www.metodokakebo.com/herramientas/calculadora-inflacion`, mejorando exclusivamente semántica HTML, separación textual y accesibilidad — sin modificar copy, diseño, funcionalidad, metadata ni la lógica matemática de la calculadora.

## 2. Commit base

`56b86325ec8185f0fe8a300e7081e57147025e07` (`content(seo): actualizar fuentes de calculadora de inflación`, `SEO-ONPAGE-CALCULADORA-INFLACION-CONTENT-01`), rama `main`, sincronizada con `origin/main` al iniciar.

## 3. Fragmentos originales

Reproducidos y confirmados mediante `document.body.textContent` en un navegador real (Chrome, servidor local de producción, `npm run build && npm run start`), no solo mediante inspección de código:

1. `"Pérdida de Valor Real-2559 €Tu dinero vale un 25.6% menos"`
2. `"Poder de Compra Futuro7441 €Equivalente actual de tus ahorros"`
3. `"Crear cuenta gratisVer regla 50/30/20"`

## 4. Causa raíz

Los tres fragmentos proceden de elementos `<span>`/`<Link>` hermanos, hijos directos de un contenedor `flex flex-col` (o `flex flex-col sm:flex-row` en el caso del CTA), sin ningún nodo de texto ni carácter de separación entre ellos en el JSX de `src/components/landing/tools/CalculatorInflation.tsx`. El espaciado visual entre ellos lo produce únicamente el CSS (`space-y-2`, `gap-6`), que no añade ningún carácter al flujo de texto plano del DOM. Por eso el resultado se veía correctamente separado en pantalla, pero se leía concatenado al extraer `textContent` (o al ser interpretado por un rastreador de texto lineal como SE Ranking).

## 5. Estructura DOM anterior

Bloque "Pérdida de Valor Real" (`CalculatorInflation.tsx`, líneas ~191-204 antes de esta tarea):

```jsx
<div className="... flex flex-col justify-center text-center space-y-2">
    <span className="...">{t('results.lossLabel')}</span>
    <span className="...">-{formatMoney(totalLost)}</span>
    <span className="...">{t.rich('results.lossText', {...})}</span>
</div>
```

Bloque "Poder de Compra Futuro": misma estructura de 3 `<span>` hermanos sin separador.

Bloque CTA: dos `<Link>` hermanos dentro de `<div className="flex flex-col sm:flex-row gap-6 justify-center">`, sin ningún nodo de texto entre ellos.

## 6. Corrección aplicada

Se insertó un `<span className="sr-only">` con el carácter de puntuación/separación adecuado entre cada par de elementos hermanos afectados. `sr-only` es la utilidad estándar de Tailwind (`position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); ...`), que **saca el elemento del flujo visual sin afectar el layout** (al ser `position: absolute` no consume espacio ni es tratado como ítem flex/grid por los hermanos), pero mantiene el texto disponible en `textContent`, en el HTML servido y, según el navegador, en el árbol de accesibilidad.

- Entre la etiqueta y el valor numérico: `<span className="sr-only">: </span>`
- Entre el valor numérico y el texto explicativo: `<span className="sr-only">. </span>`
- Entre los dos botones del CTA: `<span className="sr-only"> </span>`

No se ha modificado ningún texto de `messages/es.json` ni `messages/en.json` — la corrección es puramente estructural (JSX), no de copy, cumpliendo la restricción de no reescribir traducciones salvo puntuación/separación (en este caso, ni eso fue necesario).

**Diff aplicado** (`src/components/landing/tools/CalculatorInflation.tsx`, 5 líneas añadidas, 0 eliminadas):

```diff
 <span className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-widest">
     {t('results.lossLabel')}
 </span>
+<span className="sr-only">: </span>
 <span className="text-5xl font-serif text-red-600 dark:text-red-300">
     -{formatMoney(totalLost)}
 </span>
+<span className="sr-only">. </span>
 <span className="text-red-400 font-light text-lg">
     {t.rich('results.lossText', {...})}
 </span>
```

(Mismo patrón para el bloque "Poder de Compra Futuro" y un único `<span className="sr-only"> </span>` entre los dos `<Link>` del CTA.)

## 7. Texto resultante

Verificado con `document.body.textContent` en el navegador tras el cambio, con varios valores de entrada:

- `"Pérdida de Valor Real: -2559 €. Tu dinero vale un 25.6% menos"` (estado inicial, 10.000€/3%/10 años)
- `"Poder de Compra Futuro: 7441 €. Equivalente actual de tus ahorros"`
- Tras cambiar el input a 25.000€: `"Pérdida de Valor Real: -6398 €. Tu dinero vale un 25.6% menosPoder de Compra Futuro: 18.602 €. Equivalente actual de tus ahorros"` — cada bloque queda correctamente puntuado y separado internamente (la concatenación entre el final de un bloque y el inicio del siguiente, p. ej. "...menosPoder...", corresponde a los ticks del eje del gráfico Recharts intercalados entre ambos bloques visuales en el DOM, no forma parte de los tres fragmentos objetivo de esta tarea y no estaba entre los hallazgos a corregir).
- `"Crear cuenta gratis Ver regla 50/30/20"`

Confirmado con `regressionCheck`: `full.includes('Real-2559')` → `false`; `full.includes('Futuro7441')` → `false`; `full.includes('gratisVer regla')` → `false`.

## 8. Estado de "Aceptar0k"

**NO REPRODUCIBLE.** Verificado en el navegador (Chrome, DOM hidratado, `localStorage` sin consentimiento previo para forzar la aparición del `CookieBanner`):

- `document.body.textContent` contiene tanto `"Aceptar"` (botón del `CookieBanner`) como `"0k"` (tick del eje Y del gráfico Recharts, que solo se renderiza tras la hidratación en cliente), pero **no son adyacentes**: en el texto plano normalizado, `"0k"` aparece en la posición ~3878 y `"Aceptar"` en la posición ~9044 — más de 5.000 caracteres de distancia. El árbol de accesibilidad confirma la misma separación: el `button "Aceptar"` aparece justo antes del `contentinfo` (footer), muy lejos del bloque `application` que contiene el gráfico.
- `full.includes('Aceptar0k')` → `false`, en el estado inicial y tras interactuar con la calculadora.
- Causa probable (no confirmada, ya documentada como hipótesis en `SEO-ONPAGE-CALCULADORA-INFLACION-VALIDATION-01`): el informe de SE Ranking pudo generar esa adyacencia a partir de un método de extracción/resumen de texto distinto al orden real del DOM (p. ej. muestreo o truncamiento de fragmentos no contiguos), no a partir de una concatenación real en el HTML.
- **No se ha aplicado ningún cambio** relacionado con `CookieBanner.tsx` ni con el gráfico Recharts, conforme a la instrucción de no realizar cambios especulativos y no rediseñar esos componentes.

## 9. Archivos modificados

- `src/components/landing/tools/CalculatorInflation.tsx` (único archivo de código modificado; 5 líneas añadidas).
- `PROJECT_STATUS.md`
- `docs/PROJECT_STATUS.md`
- `docs/seo/SEO_ONPAGE_CALCULADORA_INFLACION_CONCATENATED_TEXT_01.md` (nuevo, este documento).

`messages/es.json` y `messages/en.json` **no se han tocado** en esta tarea.

## 10. Validaciones realizadas

- `npx tsc --noEmit` ✅ 0 errores.
- `npm run lint` ✅ 0 errores (76 warnings preexistentes, sin cambios respecto a la tarea anterior).
- `npm run build` ✅ Compiled successfully.
- Servidor local (`npm run start`) + navegador real (Chrome vía automatización):
  - `document.body.textContent` confirma la separación de los 3 fragmentos objetivo, en el estado inicial y tras cambiar el input de ahorros (10.000€ → 25.000€), con decimales y valores positivos/negativos correctos.
  - Captura visual (escritorio, ~1568px) confirma que los bloques "Pérdida de Valor Real" / "Poder de Compra Futuro" y los botones del CTA se ven exactamente igual que antes — ningún salto de línea ni cambio de espaciado introducido por los `<span className="sr-only">`.
  - Árbol de accesibilidad (`read_page`) confirma: un único `<h1>`, un único `contentinfo` (footer), un único conjunto de headings "Producto"/"Cuenta"/"Legal", los 3 inputs de la calculadora, el botón "Aceptar" del `CookieBanner`, y los enlaces del CTA (`/login?source=calculator_inflation`, `/herramientas/regla-50-30-20`) — todos intactos.
  - El gráfico Recharts se renderiza correctamente en cliente (ticks "0k"–"10k"/"26k" visibles tras interacción).
  - `meta description`, `title`, `canonical` sin cambios respecto a las tareas anteriores (no se ha tocado `page.tsx`).
  - Schema (`SoftwareApplication`, `FAQPage`, `DefinedTerm`, `BreadcrumbList`) intacto — no se ha modificado `page.tsx`.

## 11. Confirmación de ausencia de cambios funcionales

- Fórmula de cálculo (`Valor Real = Ahorros / (1 + tasa/100)^años`), inputs (`savings`, `inflationRate`, `years`) y outputs (pérdida, valor real, gráfico) sin ninguna modificación — solo se han añadido `<span>` visualmente ocultos, sin lógica.
- Tracking (`analytics.track` en `tool_viewed`, `use_inflation_calculator`, `click_tool_to_app`, `tool_interaction`) sin cambios.
- CTA y sus destinos (`/login?source=calculator_inflation`, `/herramientas/regla-50-30-20`) sin cambios.
- Metadata, schema, canonical, headings y el único Footer (corregido en `SEO-ONPAGE-CALCULADORA-INFLACION-HEADINGS-01`) permanecen intactos — no se ha tocado `page.tsx` en esta tarea.
- No se ha modificado ninguna otra herramienta (`regla-50-30-20`, `calculadora-ahorro`) ni el slug de esta URL.

## 12. Riesgos pendientes

- El eje del gráfico Recharts (ticks "0k", "2.5k", "5k"...) sigue generando texto sin separadores entre sí en el DOM (p. ej. "0k2.5k5k7.5k10k") — no estaba entre los 3 fragmentos objetivo de esta tarea ni en los hallazgos confirmados de la auditoría original, por lo que no se ha corregido; queda como posible mejora futura si se detecta como hallazgo en una auditoría posterior.
- "Aceptar0k" queda documentado como no reproducible con la evidencia disponible; si una herramienta externa lo vuelve a reportar en un snapshot futuro, se recomienda solicitar la captura exacta de esa herramienta antes de intervenir, para no aplicar cambios especulativos sobre `CookieBanner` o el gráfico.
- La solución con `sr-only` no ha sido probada con un lector de pantalla real (NVDA/VoiceOver), solo mediante el árbol de accesibilidad de Chrome; el comportamiento debería ser equivalente pero no se ha verificado de forma exhaustiva con todos los lectores de pantalla.

## 13. Siguiente tarea única recomendada

`SEO-ONPAGE-CALCULADORA-INFLACION-BACKLINKS-01` — investigación de backlinks y autoridad externa (hallazgo 9 de la auditoría original), pendiente de herramienta de análisis de backlinks, único hallazgo de la auditoría inicial que queda sin cerrar junto con la comparación de contenido frente a la SERP (fuera de alcance de código).
