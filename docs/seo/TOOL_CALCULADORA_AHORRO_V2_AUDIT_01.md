# TOOL-CALCULADORA-AHORRO-V2-AUDIT-01
## Auditoría funcional y UX — Calculadora de Ahorro Mensual

**Fecha:** 2026-07-08  
**URL auditada:** `/herramientas/calculadora-ahorro`  
**Sprint:** Sprint Contenido V1  
**Estado:** Auditoría completada — sin cambios en código

---

## 1. Inventario de archivos

| Archivo | Rol |
|---|---|
| `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx` | Página principal: metadata, JSON-LD, editorial wrapper |
| `src/app/[locale]/(public)/herramientas/calculadora-ahorro/layout.tsx` | Layout trivial (passthrough — sin valor real) |
| `src/components/landing/tools/SavingsCalculator.tsx` | Componente principal: inputs, cálculo, outputs |
| `src/components/landing/tools/EmbedModal.tsx` | Modal de embed compartida entre herramientas |
| `src/lib/analytics.ts` | Singleton de eventos GA4 |
| `messages/es.json` → `Tools.Savings.*` | Textos i18n del componente |

**Tests:** No existen tests de ningún tipo para este componente.  
**Documentación previa:** No existe auditoría anterior específica de esta herramienta.

---

## 2. Estado actual — análisis completo

### 2.1 Inputs actuales

| Input | Implementado | Usado en cálculo |
|---|---|---|
| Ingresos netos mensuales (€) | ✅ Sí | ✅ Sí |
| Gastos fijos actuales (€) | ✅ Sí (UI visible) | ❌ **No** — ignorado por completo |

### 2.2 Outputs actuales

| Output | Descripción |
|---|---|
| Capacidad de ahorro | 20% fijo de ingresos brutos |
| Supervivencia | 50% fijo de ingresos brutos |
| Ocio y Vicio | 30% × 0.66 = ~20% de ingresos brutos |
| Cultura | 30% × 0.34 = ~10% de ingresos brutos |
| Extras | Calculado como 0, no mostrado |

### 2.3 Lógica de cálculo actual

```js
const idealSurvival  = income * 0.5;
const idealWants     = income * 0.3;
const idealSavings   = income * 0.2;
const distribution   = {
    survival:        idealSurvival,        // 50%
    optional:        idealWants * 0.66,    // ~20%
    culture:         idealWants * 0.34,    // ~10%
    extra:           0,                    // nunca mostrado
    savingPotential: idealSavings,         // 20%
};
```

---

## 3. Problemas detectados

### P0 — Crítico (rompe la promesa de la herramienta)

#### P0.1 — `fixedExpenses` se recoge pero se ignora completamente
El campo "Gastos Fijos Actuales" tiene estado, tiene UI y tiene label descriptiva. Pero en ninguna línea del código interviene en los cálculos. El resultado siempre es el mismo para cualquier valor de gastos fijos — incluso si el usuario introduce un gasto fijo mayor que sus ingresos.

Impacto: el usuario percibe que la calculadora es inútil porque no responde a su situación real. El output no varía con uno de sus dos inputs.

#### P0.2 — Las barras de progreso son hardcoded, no dinámicas
Las barras visuales tienen clases `w-[50%]`, `w-[20%]`, `w-[10%]` hardcodeadas en el JSX. No se calculan en función del valor real. Si el reparto cambiase, las barras no reflejarían nada diferente.

#### P0.3 — La calculadora es un duplicado funcional de `/herramientas/regla-50-30-20`
Ambas herramientas aplican exactamente el mismo split 50/30/20 sobre ingresos brutos. No existe diferenciación real de utilidad entre las dos páginas. La calculadora de ahorro debería responder una pregunta distinta: "¿cuánto puedo ahorrar realmente dado lo que ya gasto en fijos?". Actualmente no lo hace.

---

### P1 — Alto (degradan significativamente la UX)

#### P1.1 — No existe cálculo orientado a objetivo
La herramienta no responde ninguna de estas preguntas que son las más comunes en la intención de búsqueda de "calculadora ahorro":
- ¿Cuánto tiempo tardaré en ahorrar X euros?
- ¿Qué ahorro mensual necesito para llegar a mi objetivo en Y meses?
- ¿Mi objetivo es realista?

#### P1.2 — No se muestra el "margen real disponible" (income − fixedExpenses)
El dato más útil para el usuario es saber cuánto le queda realmente después de pagar los fijos. Actualmente la calculadora no calcula ni muestra este dato.

#### P1.3 — Sin validación de inputs
Si el usuario introduce ingresos = 0, el resultado muestra 0€ en todo sin mensajes de error. Si los gastos fijos superan los ingresos, no hay aviso. Si se introducen valores negativos, la calculadora los acepta sin protesta.

#### P1.4 — Los `<label>` no están asociados a los `<input>` mediante `htmlFor`/`id`
Las etiquetas usan solo `className`, sin `htmlFor` apuntando a un `id` del input. Los lectores de pantalla no pueden asociar label con campo. Incumple WCAG 2.1 criterio 1.3.1 (Info and Relationships).

#### P1.5 — Las barras de progreso carecen de ARIA
Los `<div>` que simulan barras de progreso no tienen `role="progressbar"`, `aria-valuenow`, `aria-valuemin` ni `aria-valuemax`. No son accesibles.

---

### P2 — Medio (mejoras relevantes pero no bloquean el uso)

#### P2.1 — Doble sección editorial descoordinada
- `SavingsCalculator.tsx` renderiza su propio bloque `content.whyTitle` con texto sobre 50/30/20.
- `page.tsx` renderiza por separado otras dos secciones editoriales ("¿Cómo usar esta calculadora?" y "¿Qué te dice el resultado?") que también hablan del mismo método.
- El resultado: tres bloques editoriales desconectados visualmente en la misma página.

#### P2.2 — H1 de la página vs H2 del componente duplican el título
`page.tsx` renderiza: `<h1>Calculadora de Ahorro Mensual</h1>`  
`SavingsCalculator.tsx` renderiza: `<h2>{t('header.title')}</h2>` → "Calculadora de Ahorro Mensual"

Ambos títulos son idénticos. La jerarquía de headings queda rota.

#### P2.3 — Padding doble entre page.tsx y el componente
`page.tsx` tiene `pt-32` antes del componente.  
`SavingsCalculator.tsx` tiene internamente `pt-24 pb-16`.  
Resultado: exceso de espacio en la parte superior (56px + 96px).

#### P2.4 — `extra: 0` en el distribution object es código muerto
Está calculado (o más bien fijado a cero), forma parte del objeto pero nunca se usa ni se muestra. Es ruido en el código.

#### P2.5 — EmbedModal apunta a dominio incorrecto
El código del embed genera `https://kakebo.ai/es/herramientas/calculadora-ahorro` pero el dominio de producción activo es `metodokakebo.com`. Si este embed se usa externamente, las iframes apuntarán a un dominio diferente.

#### P2.6 — El panel de resultados usa `bg-stone-900` hardcodeado
No usa tokens del design system (`bg-foreground` o similar). Si el tema cambia, este panel queda huérfano.

#### P2.7 — Sin enlazado interno a la herramienta de inflación
La calculadora de ahorro tiene una relación directa con la calculadora de inflación (cuánto vale ese ahorro en el futuro). No hay enlace entre ellas. El artículo `cuentas-remuneradas.es.mdx` sí conecta ambas pero la herramienta no lo hace.

#### P2.8 — Sin enlace al artículo "cómo hacer un presupuesto personal"
El artículo de presupuesto personal existente en el blog (`/blog/como-hacer-un-presupuesto-personal`) es el complemento editorial natural de esta herramienta. No está enlazado desde la calculadora.

---

### P3 — Bajo / Deuda técnica

#### P3.1 — Layout `calculadora-ahorro/layout.tsx` es trivial
El único contenido es `return <>{children}</>`. No aporta nada que no haría el layout padre. Se puede eliminar.

#### P3.2 — Eventos GA4 sin propiedades de valor
`use_savings_calculator` se dispara al primer cambio de input pero no incluye datos del resultado (income, ahorro calculado, porcentaje). Esto impide cualquier análisis de uso real en GA4.

#### P3.3 — No existe evento `savings_result_shown` o equivalente
No hay tracking del valor calculado cuando el usuario obtiene un resultado real. No es posible saber qué rango de ingresos tienen los usuarios que usan la herramienta.

---

## 4. Tabla resumen de problemas

| ID | Severidad | Problema | Afecta |
|---|---|---|---|
| P0.1 | Crítico | `fixedExpenses` ignorado en cálculo | Lógica |
| P0.2 | Crítico | Barras hardcodeadas, no dinámicas | UI |
| P0.3 | Crítico | Duplicado funcional de 50/30/20 | Utilidad |
| P1.1 | Alto | Sin cálculo orientado a objetivo | Utilidad |
| P1.2 | Alto | Sin "margen real disponible" | Output |
| P1.3 | Alto | Sin validación de inputs | UX |
| P1.4 | Alto | Labels sin `htmlFor`/`id` | Accesibilidad |
| P1.5 | Alto | Barras sin ARIA | Accesibilidad |
| P2.1 | Medio | Editorial descoordinada (3 bloques) | UX |
| P2.2 | Medio | H1/H2 duplicados | SEO / Estructura |
| P2.3 | Medio | Padding doble | UI |
| P2.4 | Medio | `extra: 0` — código muerto | Técnico |
| P2.5 | Medio | EmbedModal dominio incorrecto | Funcional |
| P2.6 | Medio | `bg-stone-900` hardcoded | Design tokens |
| P2.7 | Bajo | Sin enlace a calculadora inflación | Contenido |
| P2.8 | Bajo | Sin enlace a artículo presupuesto | Contenido |
| P3.1 | Bajo | Layout trivial innecesario | Técnico |
| P3.2 | Bajo | Eventos GA4 sin propiedades | Analytics |
| P3.3 | Bajo | Sin evento de resultado calculado | Analytics |

---

## 5. Comparativa: herramienta actual vs herramienta ideal

| Pregunta que el usuario quiere responder | Versión actual | Versión ideal V2 |
|---|---|---|
| ¿Cuánto me sobra después de pagar mis fijos? | ❌ No calcula | ✅ Margen real = ingresos − fijos |
| ¿Cuánto debería ahorrar según mi sueldo? | ✅ Muestra 20% | ✅ Muestra 20% + % real sobre margen |
| ¿Cuánto me queda para gastar en ocio/cultura? | ⚠️ Genérico (30% bruto) | ✅ Calculado sobre margen real |
| ¿Cuánto tardaré en ahorrar X euros? | ❌ No existe | ✅ Resultado condicional si el usuario lo pide |
| ¿Qué ahorro mensual necesito para llegar antes? | ❌ No existe | ✅ Campo opcional de objetivo y plazo |
| ¿Mis gastos fijos son sostenibles? | ❌ No avisa | ✅ Alerta si fijos > 50% de ingresos |
| ¿Cómo afecta la inflación a mi ahorro? | ❌ Sin conexión | ✅ Enlace contextual a calculadora inflación |

---

## 6. Propuesta V2 — Especificación sin implementar

### 6.1 Inputs recomendados

| Campo | Tipo | Por defecto | Obligatorio |
|---|---|---|---|
| Ingresos netos mensuales (€) | number | 1.500 | Sí |
| Gastos fijos mensuales (€) | number | 600 | Sí |
| Objetivo de ahorro (€) | number | — | No (opcional) |
| Plazo para alcanzarlo (meses) | number | — | No (opcional, solo si hay objetivo) |

### 6.2 Outputs recomendados

**Bloque A — Siempre visible:**

| Output | Fórmula | Ejemplo (1.500€ / 600€ fijos) |
|---|---|---|
| Margen disponible | ingresos − fijos | 900 € |
| Ahorro sugerido Kakebo (20%) | ingresos × 0.2 | 300 € |
| % de ingresos que representan los fijos | (fijos / ingresos) × 100 | 40% |
| Gasto variable máximo (80% − fijos) | ingresos − fijos − ahorro_20 | 600 € |

**Bloque B — Condicional (si objetivo introducido):**

| Output | Fórmula | Nota |
|---|---|---|
| Ahorro mensual sugerido para objetivo en plazo | objetivo / plazo | Si hay plazo definido |
| Meses para alcanzar objetivo al ritmo actual | objetivo / ahorro_20 | Si hay objetivo pero sin plazo |
| Fecha estimada de llegada | hoy + meses calculados | Mostrar mes y año |

**Bloque C — Alertas contextuales:**

| Condición | Mensaje |
|---|---|
| fijos ≥ ingresos × 0.5 | "Tus gastos fijos representan más del 50% de tus ingresos. Es posible que necesites ajustar alguna partida grande (alquiler, suministros) antes de optimizar el ahorro." |
| fijos ≥ ingresos | "Tus gastos fijos superan tus ingresos. Esta calculadora no puede ofrecer un plan de ahorro realista con estos datos." |
| ingresos ≤ 0 | "Introduce tus ingresos netos mensuales para calcular tu plan." |
| ahorro mensual necesario > margen disponible | "El ahorro mensual necesario para ese objetivo supera tu margen disponible. Prueba un plazo más largo o un objetivo más pequeño." |

### 6.3 Fórmulas de cálculo

```
margen_disponible = max(0, ingresos - gastos_fijos)
ahorro_sugerido_20 = ingresos * 0.2
gasto_variable_max = max(0, margen_disponible - ahorro_sugerido_20)
pct_fijos_sobre_ingresos = (gastos_fijos / ingresos) * 100

// Condicional — si se introduce objetivo:
meses_al_objetivo = Math.ceil(objetivo / ahorro_sugerido_20)
ahorro_necesario_en_plazo = Math.ceil(objetivo / plazo)
```

### 6.4 Estructura de bloques visuales recomendada

```
[INPUT CARD]
  - Ingresos netos (€)
  - Gastos fijos (€)
  - [+ Añadir objetivo de ahorro] (toggle opcional)
    - Objetivo (€)
    - Plazo (meses)

[RESULT CARD — siempre visible]
  Margen real: XXX €    |  X% de tus ingresos
  Ahorro Kakebo 20%: XXX €
  Gasto variable máx.: XXX €

  [Barra horizontal — muestra proporciones reales]
  ■ Fijos   ■ Ahorro   ■ Variable

[GOAL CARD — si hay objetivo]
  A tu ritmo: alcanzas tu objetivo en X meses (mes/año)
  Para llegar en Y meses: necesitas ahorrar Z €/mes

[ALERT — si aplica]
  ⚠ Tus fijos suponen el X% de tus ingresos...

[LINKS INTERNOS]
  → Ver cómo hacer un presupuesto personal
  → Calculadora de inflación

[CTA → /login?mode=signup]
```

### 6.5 Microcopy recomendado

| Elemento | Copia actual | Copia V2 recomendada |
|---|---|---|
| Label input gastos fijos | "Gastos Fijos Actuales (Aprox.)" | "Gastos fijos mensuales (alquiler, suministros, seguros…)" |
| Sublabel gastos fijos | "Alquiler, hipoteca, luz, agua, internet..." | Mantener o ligeramente expandir |
| Resultado principal | "Capacidad de Ahorro" | "Tu margen real de ahorro" |
| Badge de referencia | "20% Recomendado" | "20% según método Kakebo" |
| Tip box | "El secreto Kakebo: gasta con intención" | Mantener — es el diferenciador editorial |
| CTA resultados | "Crear mi Kakebo Gratis" | Mantener |

### 6.6 Eventos GA4 recomendados

| Evento | Cuándo disparar | Propiedades recomendadas |
|---|---|---|
| `tool_viewed` | On mount | `tool_name: "calculadora_ahorro"` |
| `use_savings_calculator` | Primera interacción con cualquier input | `tool_name: "calculadora_ahorro"` |
| `savings_calculator_result` | Cuando el resultado cambia y hay ingresos > 0 | `income, fixed_expenses, real_margin, savings_20pct, pct_fixed` |
| `savings_calculator_goal_set` | Cuando se introduce un objetivo > 0 | `goal_amount, months_to_goal` |
| `click_tool_to_app` | CTA resultados | `tool_name, cta_location: "calculator_results"` |

Para añadir `savings_calculator_result` y `savings_calculator_goal_set` hay que actualizar el tipo `EventName` en `src/lib/analytics.ts`.

### 6.7 Estados vacíos y de error

| Estado | Tratamiento recomendado |
|---|---|
| Ingresos = 0 o vacío | Mostrar bloque de resultado vacío con texto "Introduce tus ingresos para calcular" |
| Gastos fijos ≥ ingresos | Mostrar alerta roja y bloquear el resultado de distribución |
| Gastos fijos = 0 | Calcular normalmente (caso válido: sin gastos fijos significativos) |
| Objetivo > 0, plazo = 0 | Calcular tiempo con ahorro 20%; no mostrar "ahorro necesario en plazo" |
| Plazo > 0, objetivo = 0 | No mostrar bloque de objetivo |

---

## 7. Riesgos técnicos de la implementación V2

| Riesgo | Descripción | Mitigación |
|---|---|---|
| Cambio de lógica de cálculo | El nuevo cálculo usa `income - fixedExpenses`, no solo `income`. Puede desconcertar a usuarios que ya usaban la herramienta. | El cambio es una corrección, no una regresión. Microcopy explica el cambio. |
| Campos opcionales de objetivo aumentan complejidad de estado | Los campos condicionales requieren estados adicionales y lógica de visibilidad. | Implementar como toggle progresivo, no como form siempre visible. |
| Barras de progreso dinámicas requieren CSS dinámico | Tailwind purga clases generadas dinámicamente. | Usar `style={{ width: '${pct}%' }}` en lugar de clases dinámicas, o safelist de Tailwind. |
| Actualizar eventos en `analytics.ts` require tipo nuevo | El tipo `EventName` está cerrado en un union type. | Añadir los dos eventos nuevos al union type. |
| i18n de los nuevos campos | El objetivo y el plazo requieren nuevas claves en `messages/es.json`. Si existe versión EN activa, también habrá que actualizarla. | Verificar si hay `messages/en.json` y actualizarla. |

---

## 8. Archivos a modificar en la siguiente tarea de implementación

| Archivo | Cambios necesarios |
|---|---|
| `src/components/landing/tools/SavingsCalculator.tsx` | Reescritura completa: lógica de cálculo, estados, barras dinámicas, alertas, sección de objetivo |
| `src/app/[locale]/(public)/herramientas/calculadora-ahorro/page.tsx` | Eliminar H1 duplicado, coordinar con header del componente, actualizar editorial de apoyo, añadir enlace a `/blog/como-hacer-un-presupuesto-personal` |
| `messages/es.json` → `Tools.Savings.*` | Añadir claves para: campos de objetivo/plazo, mensajes de alerta, outputs nuevos |
| `src/lib/analytics.ts` | Añadir `savings_calculator_result` y `savings_calculator_goal_set` al union type `EventName` |
| `src/app/[locale]/(public)/herramientas/calculadora-ahorro/layout.tsx` | Opcional: eliminar (es trivial y sin valor) |

---

## 9. Restricciones para la implementación V2

- No tocar la calculadora de inflación ni la 50/30/20.
- No tocar artículos del blog salvo para añadir enlace entrante desde el artículo de presupuesto personal si procede de forma natural.
- No tocar SEO técnico global (canonical, hreflang, sitemap).
- No tocar la URL de la herramienta.
- No modificar componentes compartidos (`EmbedModal`, `Navbar`, `Footer`) salvo el bug del dominio en EmbedModal si se aborda.
- Mantener el JSON-LD `SoftwareApplication` y `FAQPage` en `page.tsx`.
- Mantener el botón de embed.
- No introducir nuevas dependencias de paquetes.

---

## 10. Validación prevista para la siguiente tarea

### Funcional
- [ ] Cambiar gastos fijos produce un resultado diferente en el output
- [ ] Barras de progreso cambian proporcionalmente al introducir valores
- [ ] Con ingresos 0, no se muestra resultado sino estado vacío
- [ ] Con fijos > ingresos, se muestra alerta y no distribución
- [ ] Con objetivo y sin plazo: se muestra tiempo estimado
- [ ] Con objetivo y plazo: se muestra ahorro mensual necesario
- [ ] Resultado es coherente matemáticamente para casos de prueba manuales

### Accesibilidad
- [ ] Cada `<input>` tiene `id` y su `<label>` tiene `htmlFor` correspondiente
- [ ] Las barras de progreso tienen `role="progressbar"` y `aria-valuenow`

### SEO / Estructura
- [ ] No hay H1 duplicado en la página
- [ ] El H1 lo emite `page.tsx` y el componente usa H2 para su sección interna

### Analytics
- [ ] `savings_calculator_result` se dispara al cambiar inputs con ingresos > 0
- [ ] Propiedades del evento incluyen `income`, `fixed_expenses`, `real_margin`, `pct_fixed`

### Build
- [ ] `npm run build` sin errores TypeScript
- [ ] No se introducen advertencias de lint nuevas

---

## 11. Hipótesis de mejora de conversión

La corrección del bug P0.1 (usar `fixedExpenses` en el cálculo) y la adición de la funcionalidad de objetivo son las dos mejoras con mayor impacto potencial en engagement:

- Un usuario que introduce sus gastos fijos reales y ve un margen real (no un 50% teórico) tiene más probabilidad de confiar en el resultado y hacer clic en el CTA.
- Un usuario que puede introducir "quiero ahorrar 3.000 €" y ver "a tu ritmo lo consigues en X meses" tiene una razón concreta para registrarse en Kakebo y hacer seguimiento.

**Ventana de medición:** 4–6 semanas desde despliegue V2.  
**Métrica primaria:** evento `click_tool_to_app` desde esta herramienta.  
**Métrica secundaria:** evento `savings_calculator_goal_set` (indicador de usuario comprometido).
