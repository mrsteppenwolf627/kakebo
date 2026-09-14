# Fase 1 — Ciclos libres

**Fecha:** 2026-09-14
**Commit base:** rama `main`, tras el commit `3365934` (Fase 0.1)
**Alcance:** solo ciclos libres. Sin Stripe, pagos, trial, acceso fundador, límite de 30 gastos, modo consulta, correos, publicidad, afiliados ni cambios de IA.

---

## 1. Problema original

Objetivo de producto: un usuario debe poder cerrar su ciclo Kakebo cualquier día. Al cerrarlo, se abre inmediatamente el siguiente ciclo y puede registrar gastos sin esperar al día 1. El gasto conserva siempre su fecha real; su imputación al ciclo depende del ciclo **abierto** en el que se registra, no de que la fecha pertenezca al mes natural mostrado por el nombre del ciclo.

Ejemplo de referencia: el usuario cierra el ciclo de septiembre el 28 de septiembre. El siguiente ciclo queda abierto de inmediato. Un gasto creado el 29 de septiembre conserva fecha 29 de septiembre, pero pertenece al ciclo siguiente ya abierto.

### 1.1 Causa técnica identificada

La tabla `months` ya modela ciclos como `(user_id, year, month, status)`, y `PATCH /api/months/[id]` ya bloqueaba escritura en ciclos cerrados (`status === "closed"`). El problema no era el bloqueo en sí, sino **cómo se decidía a qué ciclo pertenece un gasto nuevo**:

- `POST /api/expenses` (sin `month_id` explícito) calculaba el mes natural (`year`, `month`) a partir de la **fecha real del gasto** y buscaba/creaba esa fila exacta de `months`.
- El flujo manual de la app (`NewExpenseClient.tsx`) hacía lo mismo: por defecto (botón genérico "Añadir gasto", sin `?ym=` en la URL) resolvía el mes objetivo a partir de la fecha de **hoy**.

Cerrar un ciclo antes de fin de mes no cambia el mes natural real de "hoy" ni de los días restantes. Por tanto, cualquier gasto con fecha real dentro de ese mes natural seguía resolviendo a la misma fila de `months`, ahora cerrada, y era rechazado con 409 — exactamente el bug reportado: "después de cerrar un ciclo antes del día 1, no se puede registrar un gasto con fecha real de los días restantes". No existía en ningún punto del código el concepto de "ciclo actualmente abierto" independiente del mes natural de la fecha del gasto.

Nota: dos componentes (`DashboardMoneyPanel.tsx`, `ExpenseCalendar.tsx`) ya tenían, de una sesión anterior, un botón de cierre que crea/reutiliza el siguiente ciclo directamente contra Supabase (comentario en código: "Auto-open next cycle (idempotent)"). Esa parte del problema (abrir el siguiente ciclo al cerrar) ya funcionaba parcialmente a nivel de UI; lo que faltaba era que la creación de gastos supiera leer y usar ese ciclo recién abierto en vez de recalcular por fecha.

---

## 2. Diseño aplicado

Cambio mínimo sobre la estructura de datos existente (`months` con `user_id, year, month, status`), **sin migración de base de datos**: la etiqueta `(year, month)` de un ciclo pasa a tratarse como su nombre, no como una restricción sobre qué fechas reales puede contener.

### 2.1 Nuevo helper `src/lib/months.ts`

- `nextYm(year, month)`: siguiente `(year, month)`, con salto de año en diciembre.
- `getOrCreateMonth(supabase, userId, year, month)`: get-or-create idempotente de un ciclo (mismo comportamiento que ya tenía `POST /api/months`, ahora extraído para reutilizarse).
- `getOpenMonth(supabase, userId)`: devuelve el ciclo `status = 'open'` más reciente del usuario, o `null` si no tiene ninguno todavía.
- `ensureNextCycleOpen(supabase, userId, fromYear, fromMonth)`: al cerrar un ciclo, abre o reutiliza idempotentemente el siguiente. Nunca reabre un ciclo ya cerrado — si el siguiente slot natural ya estuviera cerrado por algún motivo excepcional, avanza hasta encontrar uno abierto o inexistente (bucle acotado a 60 iteraciones como salvaguarda, no alcanzable en el uso normal).

### 2.2 Cierre de ciclo abre el siguiente (`PATCH /api/months/[id]`)

Al recibir `{ status: "closed" }`, además de marcar el ciclo actual como cerrado (comportamiento ya existente, sin cambios), llama a `ensureNextCycleOpen` con el año/mes del ciclo recién cerrado. Se mantiene sin cambios el rechazo de reapertura de un ciclo cerrado (`{status: "open"}` sobre un ciclo `closed"` sigue devolviendo 409).

### 2.3 Resolución de ciclo al crear un gasto (`POST /api/expenses`)

- **Sin `month_id` explícito** (caso general): se resuelve `getOpenMonth(user)`. Si existe, el gasto se imputa a ese ciclo, **sin mirar la fecha real del gasto en absoluto**. Si el usuario no tiene ningún ciclo todavía (alta completamente nueva), se hace *bootstrap* creando un ciclo para el mes natural de la fecha del gasto — único caso en que la fecha decide el ciclo, porque no hay ningún ciclo abierto al que recurrir.
- **Con `month_id` explícito** (navegación deliberada a un ciclo concreto, p. ej. desde el historial): se añadió una comprobación de estado que antes no existía en este camino — si ese ciclo está cerrado, se rechaza con 409, igual que en el camino implícito. Antes, un `month_id` explícito se aceptaba sin comprobar su estado, dependiendo únicamente de que el cliente ya lo hubiera comprobado.

### 2.4 Alta manual desde la app (`NewExpenseClient.tsx`)

- Sin `?ym=` en la URL (botón genérico "Añadir gasto"): nueva función `ensureCurrentOpenCycle` resuelve el ciclo abierto del usuario (mismo criterio que el servidor) y lo usa como destino, en vez de derivarlo de la fecha de hoy.
- Con `?ym=` en la URL (navegación deliberada a un mes concreto): comportamiento exacto anterior, sin cambios — se resuelve ese mes exacto y se bloquea si está cerrado.
- El campo de fecha del formulario no sufre ningún recorte (`clampDateToYm`) en el caso genérico; el usuario puede introducir cualquier fecha real y se envía tal cual al backend.

### 2.5 Lo que no se tocó

- `expenses/[id]/route.ts` (PATCH/DELETE): ya bloqueaba correctamente edición y borrado en ciclos cerrados mediante el `month_id` del gasto (no depende de fechas). No se modificó su lógica; se añadieron pruebas porque no existían.
- `DashboardMoneyPanel.tsx` / `ExpenseCalendar.tsx`: su lógica de cierre (llamada directa a Supabase que ya abre el siguiente ciclo) no se tocó — sigue funcionando igual, y ahora la creación de gastos sabe aprovechar el ciclo que abren.
- Ninguna tabla, columna, RLS ni política de Supabase remoto.
- Arquitectura de IA (v1/v2), Stripe, correos, publicidad, analytics de monetización: sin cambios.

---

## 3. Archivos afectados

**Nuevo:**
- `src/lib/months.ts`

**Modificados:**
- `src/app/api/months/route.ts` — POST reutiliza `getOrCreateMonth`.
- `src/app/api/months/[id]/route.ts` — PATCH abre el siguiente ciclo al cerrar.
- `src/app/api/expenses/route.ts` — resolución de ciclo vía `getOpenMonth`/`getOrCreateMonth`; bloqueo también con `month_id` explícito.
- `src/app/[locale]/app/new/NewExpenseClient.tsx` — resolución de ciclo abierto en el alta genérica.

**Tests nuevos:**
- `src/__tests__/lib/months.test.ts`
- `src/__tests__/api/months-id.test.ts`
- `src/__tests__/api/expenses-id.test.ts`

**Tests actualizados:**
- `src/__tests__/api/expenses.test.ts`
- `src/__tests__/components/NewExpenseClient.analytics.test.tsx`

**Documentación:**
- `CONTEXT.md` (bloque "Estado operativo vigente" + nueva entrada "Fase 1")
- Este documento

---

## 4. Límites explícitos de la fase

No implementado en esta fase, a propósito:

- Stripe, pagos, checkout, portal, webhooks.
- Trial de 30 días.
- Acceso fundador.
- Límite de 30 gastos por mes natural.
- Modo consulta.
- Correos transaccionales.
- Publicidad ni afiliados.
- Cambios en la arquitectura de IA (v1/v2 sin tocar, prompts sin tocar, modelos sin tocar).
- Migraciones de base de datos: ninguna. El esquema `(user_id, year, month, status)` ya existente es suficiente para ciclos libres tal como se ha implementado.
- Datos históricos: ningún gasto existente fue modificado, reasignado ni migrado.

---

## 5. Pruebas ejecutadas y resultado

Todas las pruebas de esta sección se ejecutaron en esta sesión (Fase 1), no son resultados históricos.

### 5.1 Suite completa

```
npx vitest run
```

**653/654 tests pasan.**

El único fallo es **preexistente y ajeno a esta fase**:

- `src/__tests__/agents/tools/calculate-whatif.test.ts` → `calculateWhatIf > should create a scenario with monthly savings calculation`.
- Causa: el test usa `targetDate: "2026-08-01"` hardcodeado, que ya quedó en el pasado respecto a la fecha real del sistema en el momento de ejecutar la suite (2026-09-14). El código bajo test (`src/lib/agents/tools/calculate-whatif.ts`) calcula el ahorro mensual necesario en función de "hoy", así que una fecha objetivo ya pasada produce el mensaje de aviso en vez del cálculo esperado.
- Ni el archivo de test ni el código que prueba fueron tocados en esta fase (verificado con `git status`/`git diff`). No se atribuye a Fase 1.

### 5.2 Pruebas específicas nuevas/afectadas por esta fase

Todas en verde:

| Archivo | Resultado | Cubre |
|---|---|---|
| `src/__tests__/lib/months.test.ts` | 3/3 ✅ | `nextYm` (avance normal, rollover diciembre→enero) |
| `src/__tests__/api/months.test.ts` | 8/8 ✅ | GET/POST `/api/months`, incl. 2 tests preexistentes que ya simulaban el patrón get-or-create del siguiente ciclo |
| `src/__tests__/api/months-id.test.ts` | 4/4 ✅ (nuevo) | cerrar antes de día 1 abre el siguiente ciclo; rollover diciembre→enero; reapertura de ciclo cerrado sigue rechazada; cerrar un ciclo no toca la tabla `expenses` |
| `src/__tests__/api/expenses.test.ts` | 9/9 ✅ | creación imputada al ciclo abierto; bloqueo con `month_id` explícito a ciclo cerrado; bootstrap sin ciclo previo; gasto con fecha real de septiembre imputado a ciclo abierto etiquetado octubre, fecha real preservada |
| `src/__tests__/api/expenses-id.test.ts` | 2/2 ✅ (nuevo) | PATCH y DELETE de un gasto en ciclo cerrado, ambos rechazados |
| `src/__tests__/components/NewExpenseClient.analytics.test.tsx` | 8/8 ✅ | incl. nuevo test: alta genérica se imputa al ciclo abierto (no al mes natural de hoy) y conserva la fecha real introducida |

### 5.3 Lint

```
npx eslint <archivos tocados>
```

**0 errores**, 4 warnings — todos preexistentes (variables/importaciones no usadas en líneas que esta fase no modificó; confirmado con `git diff` que esas líneas no forman parte del cambio).

### 5.4 Build

```
npm run build
```

Compilación y verificación de TypeScript correctas; todas las rutas se generan sin error, incluidas `/api/months`, `/api/months/[id]` y `/api/expenses`.

---

## 6. Confirmación explícita de alcance

Esta fase **no** introduce: límite de gastos, trial, acceso fundador, Stripe, pagos, correos transaccionales, publicidad, afiliados, ni cambios en rutas/componentes/arquitectura de IA. Solo modifica la resolución de ciclo/mes para gastos nuevos y el comportamiento de cierre de ciclo. No se tocó ningún archivo `.env*`, secreto, configuración de Stripe, Supabase remoto ni Vercel.
