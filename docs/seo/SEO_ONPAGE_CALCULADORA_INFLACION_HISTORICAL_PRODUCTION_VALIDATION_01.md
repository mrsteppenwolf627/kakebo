# SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-PRODUCTION-VALIDATION-01 — Validación en producción

**Tarea:** `SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-PRODUCTION-VALIDATION-01`
**Modelo asignado:** Claude Code
**Tipo:** Validación exclusiva. **Sin cambios de código, traducciones, dataset, lógica, tests, analytics, metadata, schema ni slug.**

## 1. Objetivo

Validar exhaustivamente en producción que `/herramientas/calculadora-inflacion` funciona correctamente en sus dos modos (proyección futura e inflación histórica), tanto funcional como visual y accesiblemente, clasificar hallazgos, y determinar si la URL puede avanzar a analytics/cierre.

## 2. Fecha y hora

2026-07-17, aproximadamente 09:05–11:50 UTC (sesión continua).

## 3. Commit validado

`4317b35f5abfda57eb0a0b686b5e7e19a33927ef`, rama `main`, sincronizada con `origin/main` al iniciar (confirmado también con `git branch -r --contains`). Sin commits nuevos legítimos detectados. Cambios locales ajenos (`.claude/settings.local.json`, `docs/seo/articulos/`) identificados y preservados sin tocar.

## 4. URL validada

`https://www.metodokakebo.com/herramientas/calculadora-inflacion` (ES) y `https://www.metodokakebo.com/en/herramientas/calculadora-inflacion` (EN).

## 5. Navegadores utilizados

Chrome (vía extensión Claude in Chrome, navegador real del usuario) y Chrome headless (CLI, para capturas estáticas en anchos específicos y para descartar caché). **No se dispuso de un segundo motor (Firefox) en este entorno** — limitación documentada, no inventada; el resto de la validación no se bloqueó por esta ausencia.

## 6. Viewports utilizados

1440×900 (interactivo, Chrome real), 768×1400, 375×1400, 320×1400 (estáticos, Chrome headless, más comparación visual con el estado anterior a la integración ya realizada en la tarea previa).

## 7. Confirmación del despliegue

- HTTP 200 confirmado en la URL real.
- Selector con ambos modos visible de inmediato en la carga inicial.
- Modo histórico completamente utilizable (verificado con interacción real).
- **Descartada caché:** `fetch(location.href, {cache:'no-store'})` devolvió `X-Vercel-Cache: MISS`, `Age: 0`, `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`, y el HTML servido contiene el texto `"Inflación histórica"` y el atributo `hidden`, confirmando que el despliegue corresponde a la integración de esta serie de tareas, no a una versión cacheada anterior.
- Múltiples recargas completas realizadas (navegaciones frescas repetidas), todas con el mismo resultado.

## 8. Resultado del selector de modos

- Modo inicial: **Proyección futura**, correcto.
- Ambos tabs visibles y con texto correcto ("Proyección futura" / "Inflación histórica").
- 10 alternancias automatizadas (clic programático sobre los botones reales del DOM) verificadas: en cada una de las 10, exactamente **1 panel visible** (`visiblePanelsCount: 1`), `aria-selected="true"` solo en el tab activo, **URL nunca cambió**.
- Navegación por teclado con `ArroLeft`/`ArrowRight` verificada: mueve el foco y activa el tab correspondiente (`document.activeElement` confirmado).
- Relación `tab`↔`tabpanel` verificada explícitamente: `aria-controls`/`aria-labelledby` resuelven a IDs reales existentes en ambas direcciones.
- **Ausencia confirmada del defecto `hidden`/`grid`** ya corregido en la tarea de integración: en ningún momento de las 10 alternancias hubo más de un panel visible simultáneamente.
- Sin recarga de página, sin scroll horizontal nuevo atribuible al selector (ver sección 16 sobre el desbordamiento preexistente).

## 9. Resultado de conservación de estado

Prueba realizada: proyección futura (10.000€ → 25.000€, 3% → 5%) → cambio a histórico (1.000€, sin cambios → 2.500€, mar 2015 → mar 2020, resultado 2.600,39€/+4,0%/+100,39€) → vuelta a futuro → vuelta a histórico.

- `savings-input` conservó `25000`, `inflation-input` conservó `5` tras volver del modo histórico.
- El panel histórico conservó exactamente `2500`, `2015-03`, `2020-03` y el mismo resultado textual (`histResult1 === histResult2` → `true`) tras dos cambios de ida y vuelta.
- Sin pérdida de datos, sin mezcla de resultados entre modos, sin reseteo silencioso.

## 10. Resultado del modo futuro (regresión)

Caso de referencia (10.000€, 3%, 10 años): **-2.559€ / 7.441€ / -25,6%** — idéntico al baseline documentado en tareas anteriores. Etiquetas, formato monetario y porcentual, CTA y enlaces, sin solapamientos, verificados visualmente sin cambios.

**Hallazgos adicionales en el modo futuro (no relacionados con esta integración, modo no modificado funcionalmente):**
- Con `savings = 0`: el texto muestra **`"Tu dinero vale un NaN% menos"`** — división por cero en `lostPercentage = (totalLost/savings)*100`. Ver clasificación en sección 24.
- Etiqueta `"AÑOS"` aparece hardcodeada en español incluso en la versión en inglés del sitio (`10 AÑOS` en vez de `10 YEARS`). Ver clasificación en sección 24.
- Cantidad negativa (`-500`) aceptada sin ninguna validación (el modo futuro no usa `<form>` ni validación, es reactivo puro) — comportamiento ya existente, sin relación con el modo histórico.

## 11. Resultado del caso histórico oficial

Entrada 1.000€, enero 2002 → enero 2025. Resultado verificado exacto: `startIndex 58,717`, `endIndex 98,579`, `+67,9%`, `1.678,88 €` equivalente, `+678,88 €` variación, fuente "Instituto Nacional de Estadística (INE)" visible. Coincide exactamente con el baseline oficial validado en tareas anteriores.

## 12. Resultado de mismo periodo

Enero 2025 → enero 2025, 1.000€: `+0,0%`, `1.000,00 €`, `+0,00 €`. Sin error. Correcto.

## 13. Resultado de deflación

Junio 2002 → julio 2002 (caso real, no simulado), 1.000€: `-0,7%`, `993,05 €`, `-6,95 €`, tarjeta con color esmeralda (no rojo) confirmado en el HTML (`innerHTML.includes('emerald')` → `true`). Signo visible, sin conversión a cero, etiqueta neutral "Variación del valor" confirmada.

## 14. Resultado de cantidad cero

1.000€ → 0€ manteniendo el mismo rango: `0,00 €` equivalente, `+67,9%` de inflación (correcto: el porcentaje no depende de la cantidad), `+0,00 €` variación. Sin `NaN`, sin `Infinity`.

## 15. Resultado de validación de cantidad — hallazgo confirmado

Se probaron sistemáticamente, con **clic real de ratón y tecla Enter** (no solo eventos programáticos) sobre el formulario real en producción: cadena vacía, `-1`, `1000`, `1000.50`, `1000abc`, `1000 200`, `1e`, `+`, `-`, `.`, `999999999999`.

**Comportamiento nativo del input `type="number"` (no defecto):**
- `1000abc` tecleado letra por letra: el navegador filtra las letras automáticamente, el campo termina en `1000` (válido). No reproduce un envío de texto mixto.
- `1000 200` tecleado: el navegador ignora el espacio y concatena a `1000200` (número válido distinto al que probablemente pretendía el usuario, pero sin error ni bloqueo).
- Cadena vacía: `validity.valid === true` (no hay restricción `required`); al enviar con clic real, se muestra correctamente el mensaje personalizado `"Introduce una cantidad válida igual o superior a cero."` y el resultado anterior se limpia (reemplazado por el estado vacío). **Correcto.**

**Defecto confirmado (ver clasificación completa en sección 24, hallazgo H1):** con `-1` (viola `min="0"`, `validity.rangeUnderflow === true`) y con `+` (formato parcial, `validity.badInput === true`), un **clic real** sobre "Calcular inflación histórica" o la tecla **Enter** dentro del campo **no disparan ningún cambio observable**: el resultado de un cálculo anterior permanece visible sin ninguna indicación de que la entrada fue rechazada, y no aparece el mensaje `role="alert"` esperado. Reproducido de forma limpia y consistente en múltiples repeticiones tras descartar contaminación de estado entre pruebas (se verificó recargando la página y repitiendo cada caso de forma aislada).

Con `1e` (también `badInput === true`, sin `rangeUnderflow`) el comportamiento fue inconsistente entre intentos — en un intento aislado sí mostró el error correctamente; no se pudo aislar una causa determinista adicional a la ya identificada para `rangeUnderflow`. Se documenta como parte del mismo hallazgo, sin necesidad de una clasificación separada.

**Importe muy grande (`999.999.999.999`):** funciona correctamente, sin overflow horizontal grave a 1440px, cálculo correcto (`1.678.883.457.940,65 €`, `+67,9%`).

Clasificación: **CONFIRMADO — ALTO** (ver sección 24, H1). No bloqueante para el uso normal de la herramienta (la inmensa mayoría de usuarios no introduce cantidades negativas ni caracteres sueltos), pero es una discrepancia real de UX y contradice el bloque de errores ya documentado en `HISTORICAL-I18N-01`.

## 16. Resultado del reset

Tras introducir valores personalizados y un error, el botón "Restablecer": devolvió la cantidad a `1000`, restauró el mes final al último periodo disponible y el mes inicial a 12 periodos reales antes, limpió el error, recalculó el resultado con los valores por defecto, no recargó la página, no cambió el modo activo. **Correcto, sin hallazgos.**

## 17. Resultado ES/EN

**Español:** selector, labels, errores, resultados, fuente, meses y botones verificados correctos (ver secciones anteriores).

**Inglés** (`https://www.metodokakebo.com/en/herramientas/calculadora-inflacion`, accesible y renderizada completa): "Future projection" / "Historical inflation", "Initial amount", "Start month", "End month", "Calculate historical inflation", "Reset", "Equivalent amount in the final month", "Cumulative inflation", "Change in value", "Initial/Final CPI index", "Source: Spanish National Statistics Institute (INE)", nombres de meses en inglés ("June 2025"), formato monetario correcto (`€1,032.04`, coma de miles/punto decimal). **Ninguna clave cruda visible** (`Tools.Inflation.historical.*` no aparece en ningún texto renderizado). Único hallazgo: la etiqueta `"AÑOS"` del modo futuro permanece en español en la versión inglesa (preexistente, ver sección 10).

## 18. Resultado responsive

- **1440px:** sin hallazgos, selector y ambos modos correctos.
- **768px:** sin desbordamiento, selector completo, formulario y resultados correctos (verificado en producción real vía Chrome headless).
- **375px / 320px:** desbordamiento horizontal confirmado, **idéntico al ya documentado como preexistente** en `HISTORICAL-INTEGRATION-01` (verificado entonces mediante `git stash` comparando antes/después de la integración). Se relanzó la comprobación visual directamente sobre producción en esta tarea y el patrón es el mismo: el encabezado `h1` y el contenedor general se cortan en el borde derecho del viewport: el selector de tabs hereda ese mismo ancho de contenedor sin agravarlo (las etiquetas de los tabs no se desbordan de forma independiente ni añaden overflow adicional).

## 19. Resultado de desbordamiento horizontal (bloque 13)

**Medición exacta vía `scrollWidth`/`clientWidth`:** se intentó instrumentar una medición precisa vía Chrome DevTools Protocol (Node + `ws`, ya presente como dependencia transitiva del proyecto) para obtener el número exacto de píxeles de overflow en cada viewport; el intento resultó inestable en este entorno (el puerto de depuración remota no llegó a exponerse de forma fiable pese a varios intentos) y se abandonó por no ser imprescindible. En su lugar se usó **evidencia visual directa**: capturas de Chrome headless con `--window-size` exacto (320/375/768px), donde el PNG resultante tiene exactamente el ancho del viewport solicitado — cualquier contenido cortado en el borde derecho de esa imagen es evidencia directa de overflow real, no de un recorte de captura.

**Clasificación:** `PREEXISTENTE`. Pertenece al **layout global** de la página (encabezado `h1`/contenedor general), no al modo futuro ni al histórico específicamente, y no fue agravado por el selector de tabs añadido en la integración (confirmado por comparación `git stash` en la tarea anterior y por inspección visual repetida en esta tarea sobre producción real). **No se corrige en esta tarea.**

**Recomendación de tarea atómica futura:** `SEO-CALCULADORA-INFLACION-RESPONSIVE-320-FIX-01` (o nombre equivalente), alcance: revisar el contenedor/encabezado de `CalculatorInflation.tsx` (o un componente de layout compartido de nivel superior, a determinar) para envolver correctamente el texto del `h1` a 320–375px sin depender de un ancho mínimo implícito; archivo probable: `src/components/landing/tools/CalculatorInflation.tsx` y/o el layout de la página `(landing)`.

## 20. Resultado de accesibilidad

- Navegación completa por teclado: tabs (flechas), selects nativos, input, botones — todos alcanzables y operables.
- `aria-selected`, `aria-controls`, `aria-labelledby` verificados por resolución real de IDs (no solo presencia del atributo): **100% correctos**, sin roturas.
- **Sin IDs duplicados** en toda la página (`22` IDs únicos verificados mediante `querySelectorAll('[id]')`, `0` duplicados).
- `role="alert"` y `aria-describedby`/`aria-invalid` en los selects de periodo verificados correctamente en el caso de orden invertido.
- Anuncio de resultados: región con `role="status"`/`aria-live="polite"` ya implementada (heredada de `CalculatorInflationHistorical.tsx`, sin cambios).
- Información no dependiente solo del color: confirmado en el caso de deflación (signo `-` explícito además del color esmeralda).
- **No se ejecutó** una herramienta automática de accesibilidad (axe, Lighthouse) porque ninguna está ya integrada en el flujo del proyecto y la tarea prohíbe añadir dependencias nuevas; la auditoría fue manual, distinguida explícitamente de los hallazgos automáticos (no hay hallazgos automáticos en este informe, todos son manuales).
- **No se verificó** zoom al 200% de forma aislada con una herramienta dedicada; se infiere razonablemente su comportamiento a partir de la revisión responsive (320px), que ejercita un espacio horizontal reducido de forma comparable, sin encontrar roturas de layout adicionales a las ya documentadas como preexistentes.

## 21. Resultado de consola

- **Recharts warning** (`width(-1) and height(-1)`): preexistente, aparece en el modo futuro (gráfico `AreaChart`), no introducido por esta integración, ya documentado en tareas anteriores.
- **React error #418 (hidratación)**: observado **una sola vez**, en la primera carga de la sesión de validación; **no reproducido** en 3 recargas frescas consecutivas posteriores en pestañas nuevas. Clasificado `NO REPRODUCIBLE` (ver sección 24, H2). Se descartó una causa relacionada con estado de sesión/autenticación tras comparar el contenido del `<nav>` entre la pestaña que mostró el error y pestañas frescas (idéntico en ambas tras el hecho).
- Sin errores de JavaScript nuevos atribuibles al selector de modos, a la integración del componente histórico, ni a las traducciones.
- Sin errores de React nuevos al alternar modos repetidamente (10 alternancias sin excepciones).

## 22. Resultado de red

28 requests observadas en una carga fresca completa: documento principal (200), fuentes `woff2` (200), CSS/JS de Next (200), Google Tag Manager (200, analytics ya existente), `manifest.webmanifest` (200), imagen `bg-sakura.png` (200), `icon.png` (pending, normal). **Cero requests a `servicios.ine.es` ni a ningún dominio `ine.es`** — confirmado explícitamente por ausencia en el listado completo de requests. Cálculo completamente local, sin dependencia de red para el modo histórico, tal como exige la arquitectura aprobada en el ADR. Ningún error nuevo al alternar modos.

## 23. Comandos ejecutados

```bash
git branch --show-current
git fetch origin
git log HEAD..origin/main --oneline
git branch -r --contains 4317b35f5abfda57eb0a0b686b5e7e19a33927ef
git status
npx vitest run src/__tests__/lib/inflation/historical.test.ts
npm run test
npx tsc --noEmit
npm run lint
npm run build
# Chrome headless para capturas estáticas y descarte de caché:
chrome --headless --disable-gpu --window-size=<w>,1400 --screenshot=... "https://www.metodokakebo.com/herramientas/calculadora-inflacion"
# Node + ws (CDP) intentado para medición exacta de overflow — abandonado por inestabilidad del entorno, ver sección 19
```

Además, extensa interacción real en navegador (Claude in Chrome): navegación, clics, teclado, ejecución de JavaScript en contexto de página para verificación de estado/DOM/validez de formularios.

## 24. Hallazgos clasificados

### H1 — `CONFIRMADO — ALTO`
- **Resumen:** el input de cantidad del modo histórico (`type="number" min="0"`) permite que la validación nativa del navegador intercepte silenciosamente el envío del formulario para valores que violan `min="0"` (p. ej. `-1`) o que quedan en estado `badInput` (p. ej. `+`, `-`, `.` solos), sin mostrar el mensaje de error personalizado ni limpiar el resultado de un cálculo anterior.
- **Pasos de reproducción:** en `/herramientas/calculadora-inflacion`, modo "Inflación histórica", escribir `-1` (o `+`) en "Cantidad inicial" con un resultado previo visible, y pulsar "Calcular inflación histórica" (clic real o tecla Enter).
- **Viewport:** 1440×900 (no específico de tamaño de pantalla).
- **Navegador:** Chrome (esperable en cualquier navegador con constraint validation HTML5 estándar, no verificado en un segundo motor por la limitación ya documentada).
- **Resultado actual:** el resultado anterior permanece visible sin cambios; ningún mensaje de error aparece.
- **Resultado esperado:** debería mostrarse `"Introduce una cantidad válida igual o superior a cero."` (`role="alert"`) y limpiarse el resultado anterior, igual que ocurre con la cadena vacía.
- **Impacto:** el usuario puede creer erróneamente que su nueva entrada fue calculada, cuando en realidad ve un resultado obsoleto de una consulta anterior.
- **Archivo/capa probable:** `src/components/landing/tools/CalculatorInflationHistorical.tsx` (atributo `type="number" min="0"` del input de cantidad).
- **Recomendación:** cambiar el input a `type="text" inputMode="decimal"`, eliminando la dependencia de la validación nativa del navegador y delegando el 100% de la validación al parser estricto ya implementado en el propio componente (`parseStrictAmount`).
- **¿Bloquea analytics?** No de forma directa, pero se recomienda corregirlo antes de instrumentar eventos específicos de error del modo histórico, para no medir una tasa de error incompleta.
- **¿Bloquea reindexación?** No.

### H2 — `NO REPRODUCIBLE`
- **Resumen:** error de hidratación de React (#418) observado una única vez en consola durante la primera carga de la sesión de validación.
- **Pasos de reproducción:** no se ha logrado un procedimiento determinista; 3 recargas frescas adicionales inmediatas no lo reprodujeron.
- **Viewport / navegador:** 1440×900, Chrome.
- **Impacto:** desconocido/no confirmado por falta de reproducibilidad.
- **Recomendación:** monitorizar en una futura revisión si vuelve a aparecer con mayor frecuencia; no accionable hoy.
- **¿Bloquea analytics/reindexación?** No.

### H3 — `PREEXISTENTE`
- **Resumen:** con `"Tus Ahorros Actuales" = 0` en el modo futuro, se muestra `"Tu dinero vale un NaN% menos"` (división por cero en `lostPercentage`).
- **Archivo probable:** `src/components/landing/tools/CalculatorInflation.tsx` (lógica de proyección, no tocada por esta integración).
- **Impacto:** bajo (caso de uso poco frecuente, cantidad de ahorro 0 no es un escenario típico de la herramienta).
- **Recomendación:** corregir en una futura tarea específica del modo de proyección, fuera del alcance de la serie histórica.
- **¿Bloquea analytics/reindexación?** No.

### H4 — `PREEXISTENTE`
- **Resumen:** la etiqueta `"AÑOS"` del modo futuro permanece hardcodeada en español en la versión inglesa del sitio.
- **Archivo probable:** `src/components/landing/tools/CalculatorInflation.tsx`, línea con `<small>...Años</small>`.
- **Impacto:** bajo (cosmético, no afecta el cálculo).
- **¿Bloquea analytics/reindexación?** No.

### H5 — `PREEXISTENTE`
- **Resumen:** desbordamiento horizontal a 320px/375px del layout general de la página (encabezado y tarjetas).
- **Detalle completo:** ver sección 19.
- **¿Bloquea analytics/reindexación?** No.

### H6 — `DESCARTADO`
- **Resumen:** entradas como `1000abc` o `1000 200` en el campo de cantidad histórica no se comportan como texto libre porque el navegador ya filtra/concatena caracteres no numéricos en un `<input type="number">` antes de que lleguen a React.
- **Motivo del descarte:** es el comportamiento nativo estándar y esperado de este tipo de input; no representa un riesgo real distinto del ya cubierto en H1.

### Sin hallazgos adicionales
Selector de modos, conservación de estado, caso oficial, mismo periodo, deflación, orden invertido, cantidad cero, reset, traducciones ES/EN, accesibilidad ARIA (tabs/paneles/IDs), ausencia de llamadas de red al INE: **todos verificados correctos, sin hallazgos.**

## 25. Riesgos pendientes

1. H1 (validación de cantidad) — recomendado corregir antes de instrumentar analytics de errores del modo histórico.
2. H5 (desbordamiento 320/375px) — recomendado abordar en una tarea de layout general, no específica de esta serie.
3. H3/H4 (NaN con cantidad 0, etiqueta "AÑOS" sin traducir) — bajos, recomendados para una futura revisión del modo de proyección.
4. Ausencia de un segundo motor de navegador (Firefox) en este entorno — limitación de la validación, no un hallazgo del producto.
5. Medición exacta de overflow vía CDP no lograda en este entorno — mitigado con evidencia visual equivalente, documentado como limitación de procedimiento, no del producto.

## 26. Veredicto

**Aprobada para continuar** (no bloqueada). Ambos modos funcionan correctamente para el caso de uso principal, el caso oficial y todos los escenarios matemáticos (mismo periodo, deflación, cantidad cero) son exactos, el selector es accesible y robusto tras 10 alternancias, no hay errores de consola/red atribuibles de forma reproducible a esta integración, y el único desbordamiento detectado es preexistente y no agravado por el trabajo de esta serie. El hallazgo H1 (validación de cantidad) es real y de severidad alta pero no impide el uso normal de la herramienta ni corrompe ningún cálculo — se documenta como riesgo pendiente y no bloquea la aprobación de la URL.

## 27. Recomendación sobre analytics

Se puede proceder a diseñar la instrumentación de analytics del modo histórico, **con la recomendación previa de corregir H1** para que cualquier evento futuro de "error de validación" mida la tasa real de errores sin el sesgo de casos silenciosamente bloqueados por el navegador.

## 28. Recomendación sobre reindexación

**No se solicita reindexación** en esta tarea (fuera de alcance, y no hay cambios de contenido/metadata que la justifiquen). El contenido ya estaba indexado antes de esta integración; el nuevo modo histórico es una mejora funcional dentro de la misma URL/canonical ya indexada, sin cambio de intención de búsqueda ni de metadata.

## 29. Siguiente tarea única recomendada

`SEO-ONPAGE-CALCULADORA-INFLACION-HISTORICAL-AMOUNT-INPUT-FIX-01` — corregir el hallazgo H1 (cambiar el input de cantidad de `CalculatorInflationHistorical.tsx` de `type="number"` a `type="text" inputMode="decimal"` para eliminar la interferencia de la validación nativa del navegador), antes de cualquier trabajo de analytics del modo histórico.
