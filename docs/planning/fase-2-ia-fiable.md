# Fase 2 — IA fiable

**Estado:** Completada en código local (2026-09-14 → 2026-09-15). **No desplegada.** Pendiente: revisión del propietario, ejecución manual de 5 migraciones en Supabase SQL Editor, commit, push y validación en producción.

Este documento es el registro técnico completo de la Fase 2. Distingue explícitamente **hechos verificados por lectura de código y por tests locales** de **aspectos que solo se podrán confirmar tras aplicar las migraciones y desplegar** (marcados como "⏳ Pendiente de verificar en producción").

---

## 0. Resumen ejecutivo

La Fase 2 sustituyó, en el flujo del chat **realmente conectado** (`agent-v2` en streaming — ver §1), varios comportamientos que mezclaban datos entre usuarios, resolvían ámbitos de forma poco fiable, ejecutaban escrituras sin confirmación verificable, o carecían de cualquier métrica de coste/uso persistente. Cada tarea (2.A a 2.I) se implementó, probó y corrigió de forma incremental dentro de esta misma sesión — incluidas dos rondas de corrección de seguridad/privacidad sobre el propio trabajo de fases anteriores (2.E y 2.G tuvieron correcciones posteriores tras detectarse fallos concretos).

**No se tocó la arquitectura v1** (`src/lib/agents/nodes/*`, `/api/ai/agent`, `src/lib/agents-v2/function-caller.ts` + `/api/ai/agent-v2` no-streaming) — confirmado huérfana de frontend desde la Fase 0.1, y verificada sin cambios en cada tarea de esta fase.

---

## 1. Arquitectura activa real (verificado por lectura de código)

El chat visible en la app (`FloatingAgentChat`, `src/app/[locale]/app/agent/page.tsx`) → `AIChat.tsx` → hook `useAgentStream` (`src/hooks/useAgent.ts`) → `POST /api/ai/agent-v2/stream` → `processFunctionCallingStream` (`src/lib/agents-v2/stream-caller.ts`) → modelo `DEFAULT_MODEL = "gpt-5-nano"` (`src/lib/ai/client.ts`, sin cambios en esta fase).

Este es el **único** flujo que recibió cambios de comportamiento en Fase 2. La ruta no-streaming (`/api/ai/agent-v2`, `function-caller.ts`) y la v1 original (`/api/ai/agent`, `src/lib/agents/nodes/*`) siguen sin ningún llamador en componentes visibles.

---

## 2. Tareas completadas

### 2.A — Ciclos seguros en herramientas IA, ownership de feedback, protección de embeddings

- `createTransaction`/`updateTransaction` (`src/lib/agents/tools/*.ts`): nunca escriben en un ciclo cerrado ni sin `month_id` — reutilizan los mismos helpers de ciclo que la Fase 1 (`src/lib/months.ts`).
- `submitSearchFeedback`: verifica que cada `expense_id` referenciado pertenece al usuario autenticado antes de guardar feedback — un ID ajeno o inexistente se rechaza sin insertar.
- `POST`/`GET /api/ai/process-embeddings`: `INTERNAL_API_SECRET` pasa a ser **siempre obligatorio** — si no está configurado, la ruta se rechaza (401) en vez de saltarse la comprobación como antes.

### 2.B/2.C — Subcategorías y ciclos reales en búsquedas

- Catálogo de subcategorías (`src/lib/subcategories.ts`, 14 valores, fuente única de verdad) + columna `expenses.subcategory` (nullable, sin backfill).
- `searchExpenses` acepta `cycle_scope` (`current`/`specific`/`all_history`, resuelto SIEMPRE por `month_id` real vía `src/lib/agents/tools/utils/cycle-scope.ts`, nunca por rango de fecha de calendario) y `subcategories` (filtro exacto).
- Corrección de fiabilidad: `cycle_scope` se **compone** con la consulta de texto del usuario (nunca la sustituye) — ver `filterCycleExpensesByQuery` en `search-expenses.ts`. El límite técnico de la búsqueda semántica de respaldo ya no trunca a 200 candidatos fijos; usa el tamaño real del ámbito y avisa (`semanticCoverageMayBeIncomplete`) si el backend de embeddings pudo quedarse corto.
- `totalCount`/`totalAmount` se calculan siempre sobre TODOS los coincidentes, nunca solo sobre lo devuelto en `expenses` (que puede estar limitado por `limit`).

### 2.D — Ámbito obligatorio antes de analizar

- `searchExpenses` exige el campo `search_intent` (`"individual_lookup"` | `"analysis"`) en el propio esquema de function calling — su ausencia se trata siempre como `"analysis"` (conservador).
- Puerta determinista (`src/lib/agents/tools/utils/search-scope-gate.ts`), evaluada en `stream-caller.ts` **antes** de ejecutar la tool: toda consulta de análisis sin `cycle_scope` se bloquea y se pregunta el ámbito con un mensaje fijo (no generado por el modelo) — ahorra una llamada al modelo en ese turno.
- Desambiguación de alimentación básica vs. comer fuera, con la misma prioridad de preguntas (ámbito primero, nunca dos preguntas en el mismo turno).

### 2.E — Confirmación de escrituras con popup, ajuste persistente e identificador de un solo uso

Implementada y **corregida dos veces** tras detectarse fallos de seguridad reales:

1. **Primera versión:** el popup existía pero el servidor confiaba en el `tool_call`/argumentos que el propio navegador reenviaba al confirmar.
2. **Corrección de seguridad:** rediseñado para que el cliente solo reciba y reenvíe un **`confirmationId` opaco**. La acción real se persiste en una tabla nueva y exclusiva de servidor, `ai_pending_actions` (`src/lib/agents-v2/pending-actions.ts`), consumida de forma **atómica** (`UPDATE ... WHERE status = 'pending' ... RETURNING`, garantiza ejecución exactamente una vez incluso ante doble clic, reintento de red o repetición manual del mismo id).
3. **Segunda corrección (aislamiento):** `ai_pending_actions` tenía políticas RLS que permitían a un usuario leer/modificar su propia fila pendiente directamente vía Supabase (viendo `tool_call`/`arguments` antes de confirmar). Corregido: RLS activado **sin ninguna política** para `authenticated`/`anon` — la tabla solo es accesible desde servidor vía `createAdminClient()` (`src/lib/supabase/admin.ts`); el aislamiento por usuario lo aplica la propia consulta (`user_id = userId`), no RLS.

Ajuste persistente `user_settings.ai_confirm_writes` (activado por defecto), visible en Settings. `ENABLE_WRITE_CONFIRMATION` pasa de mecanismo principal a **interruptor de seguridad global** (`=false` desactiva para todos, cualquier otro valor deja decidir al ajuste individual).

### 2.F — Análisis de hábitos determinista por ciclos

`analyzeSpendingPattern`, en el flujo activo, dejó de resolver por mes de calendario (comportamiento legado, todavía usado por v1/`function-caller.ts`, sin tocar) y pasó a:

- Exigir `cycle_scope` en toda llamada (sin excepción "individual_lookup" — por definición siempre es agregada), con la misma puerta determinista que 2.D (`src/lib/agents/tools/utils/analyze-habits-scope-gate.ts`).
- Calcular **todo** de forma determinista (`src/lib/agents/tools/analyze-habits.ts`, función pura `computeHabitAggregate`, testeada sin base de datos): totales, recuento, distribución por categoría/subcategoría, gastos más frecuentes, mayores gastos.
- Comparación entre ciclos **solo si se pide explícitamente** (`compare: true` + `compare_cycle_scope`) — nunca por defecto.
- Distinguir observación (hecho verificable) / posible patrón (señal, nunca certeza) / recomendación (genérica, solo si hay patrón) — nunca diagnósticos psicológicos/médicos/financieros personalizados.
- `limited: true` cuando hay menos de 5 gastos en el ámbito: no se buscan patrones ni se generan recomendaciones, se avisa explícitamente.

### 2.G — Aprendizaje personal aislado; sin aprendizaje colectivo activo

Auditoría inicial encontró **cuatro** mecanismos que mezclaban datos entre usuarios sin consentimiento: ejemplos globales de `correction_examples`, feedback global de `search_feedback`, y contribución/lectura global de `merchant_rules`. Decisión final, tras dos rondas de corrección de privacidad:

- **`correction_examples`** (ejemplos globales, `user_id IS NULL`, con nota/concepto casi literal): desactivado por completo. `getRelevantExamples`/`getSimilarExamples` filtran siempre `user_id = userId` — nunca leen la RPC `get_relevant_examples` (su fallback global vive en SQL).
- **`search_feedback`** (`getGlobalFeedback`, consenso cruzado entre usuarios sobre `expense_id`): desactivado por completo, devuelve siempre vacío. `getHybridFeedback` queda equivalente a feedback personal.
- **`merchant_rules`** (sugerencia de categoría por comercio): **corrección final** — aunque el dato en sí (`merchant` + `category`, sin nota/importe/fecha) parecía razonablemente minimizado, no hay forma de demostrar que una fila global histórica proceda solo de usuarios con consentimiento (no guardan procedencia por voto), y `merchant` es texto derivado de lo que escribió el usuario. Se desactivó también por completo: `suggestCategory` descarta cualquier resultado `source: "global_rule"`; `suggestCategoriesBatch` ya no consulta la tabla global; `learnFromCorrection` ya no incrementa ningún voto global (se eliminó la función `incrementGlobalRuleVoteIfMatches`), **incluso con el ajuste de consentimiento activado**.
- Nuevo ajuste `user_settings.allow_collective_learning` (desactivado por defecto): se conserva en Settings como preferencia para una **futura** vía de aprendizaje colectivo bien diseñada (con procedencia y consentimiento verificable por contribución) — hoy activarlo no comparte ningún dato, y el copy de Settings lo dice explícitamente.
- El aprendizaje **personal** (reglas propias por `user_id`, correcciones propias) sigue funcionando exactamente igual, con o sin ese ajuste.
- **Hallazgo de la revisión de cierre de fase:** la descripción de la tool `searchExpenses` (enviada al modelo en cada llamada) seguía afirmando "Aprende de TODOS los usuarios, así que mejora con el tiempo" — una frase preexistente al margen del prompt principal, que sobrevivió sin querer a la Fase 2.D. Corregida en esta misma revisión de cierre; se añadió un test de regresión (`search-expenses-definition.test.ts`) que falla si cualquier descripción de tool vuelve a afirmar aprendizaje colectivo activo.

### 2.I — Métricas privadas y persistentes del chat activo

- Nueva función `logAgentTurnMetrics` (`src/lib/ai/metrics.ts`), reutilizando la tabla `ai_logs` ya existente (`type: "agent_v2"`, nueva columna `turn_type`).
- Exactamente una métrica por petición al stream, en 6 categorías técnicas: `direct_response`, `tool_query`, `confirmation_proposed`, `confirmation_executed`, `scope_blocked`, `error`.
- **Nunca** persiste mensaje, historial, respuesta de IA, nota/importe/fecha de gasto, argumentos de herramientas, `confirmationId` ni IDs de gasto — solo `user_id`, modelo, tokens, coste **estimado** (`cost_usd_estimated`, nombre explícito para dejar claro que no es una factura real de OpenAI), latencia, nombres de herramientas (nunca argumentos) y éxito/tipo de error seguro.
- Un fallo al persistir la métrica se captura internamente (doble capa: dentro de `logAgentTurnMetrics` y en el punto de llamada de `stream-caller.ts`) — nunca rompe el streaming ni afecta una escritura ya ejecutada.
- **Corrección posterior:** los `COMMENT ON COLUMN` finales de la migración no estaban protegidos si `ai_logs` no existía; el contrato TypeScript (`AILogEntry.type`, `AIMetrics.byType`) no reconocía `agent_v2`. Ambos corregidos — ver §3.
- No se muestra ninguna métrica en la interfaz todavía (fuera de alcance, deliberado).

---

## 3. Migraciones pendientes (no aplicadas)

Ninguna se ha ejecutado contra Supabase. Todas son **idempotentes** (seguras de re-ejecutar) y usan `IF EXISTS`/`IF NOT EXISTS`/guardas `to_regclass` para no fallar si la tabla de destino no existe todavía. **No hay dependencias estrictas entre ellas** (cada una toca una tabla/columna distinta); el orden que sigue es por trazabilidad de fase, no por necesidad técnica:

1. `supabase/migrations/20260914_add_expense_subcategory.sql` (2.B) — añade `expenses.subcategory` (nullable) + `CHECK` contra el catálogo + índice parcial.
2. `supabase/migrations/20260914_add_ai_confirm_writes_setting.sql` (2.E) — añade `user_settings.ai_confirm_writes boolean NOT NULL DEFAULT true`.
3. `supabase/migrations/20260914_add_allow_collective_learning_setting.sql` (2.G) — añade `user_settings.allow_collective_learning boolean NOT NULL DEFAULT false`.
4. `supabase/migrations/20260914_add_ai_pending_actions.sql` (2.E) — crea la tabla nueva `ai_pending_actions` (RLS activado, **sin políticas** — solo accesible vía `createAdminClient()`).
5. `supabase/migrations/20260914_add_ai_logs_agent_v2_turn_metrics.sql` (2.I) — altera `ai_logs`: `input` pasa a nullable, añade `turn_type` (con `CHECK`), amplía el `CHECK` de `type` para admitir `'agent_v2'`.

**Precondición para la migración 5:** `ai_logs` no tiene una migración local propia — se creó (si existe ya en el proyecto de destino) a partir del SQL embebido `AI_LOGS_TABLE_SQL` (`src/lib/ai/metrics.ts`), que ahora **ya incluye** el estado final (coherente con la migración 5, sin esquemas contradictorios — verificado por test). Si `ai_logs` no existe todavía en el proyecto de destino, la migración 5 es un no-op seguro (no crea la tabla) — en ese caso, ejecutar primero `AI_LOGS_TABLE_SQL` directamente. ⏳ **Pendiente de verificar cuál es el caso en el proyecto Supabase real.**

Migración pre-existente `supabase/migrations/20260217_security_audit.sql`: no forma parte de esta fase, no se ha tocado.

---

## 4. Garantías de privacidad (verificadas por test, no en runtime real)

- `ai_pending_actions`: sin políticas RLS para usuarios; solo servidor. Test estático (`admin-client-isolation.test.ts`) confirma que ningún módulo `"use client"` importa el cliente administrador ni referencia la service role key.
- Métricas del chat (`logAgentTurnMetrics`): tipo TypeScript deliberadamente estrecho que no admite contenido de conversación; test (`stream-caller.turn-metrics.test.ts`) inyecta un importe/email/nota reales de prueba y verifica que no aparecen en el payload persistido, en ningún tipo de turno.
- Aprendizaje colectivo: cero lectura/escritura cruzada entre usuarios verificada en `collective-learning-minimization.test.ts` (payloads sin `merchant`/nota/importe/email/user_id ajeno).
- **Todo lo anterior está verificado contra mocks de Supabase en tests locales — ⏳ pendiente de confirmar el comportamiento real de RLS/políticas contra el proyecto Supabase de producción, que solo puede hacerse después de aplicar las migraciones.**

---

## 5. Límites conocidos (deliberados, fuera de alcance de Fase 2)

- No se sustituyó ni se propuso sustituir el modelo (`gpt-5-nano` sigue siendo el único, sin fallback). Ver auditoría 2.H para el análisis de alternativas — es un análisis, no una decisión tomada.
- No se rediseñó el esquema de `merchant_rules`/`correction_examples`/`search_feedback` — se desactivó su uso colectivo en vez de arreglarlo, porque un rediseño con procedencia/consentimiento verificable es un cambio de esquema mayor, explícitamente fuera de alcance.
- No hay rate limiting ni cuota de uso de IA por usuario (hallazgo de la auditoría 2.H, no corregido en esta fase — no se pidió).
- Las métricas de 2.I no se muestran todavía en ninguna interfaz (ajuste deliberado del alcance de la tarea).
- No se tocó v1 en ningún momento.

---

## 6. Validación ejecutada en esta sesión (local)

- **Tests:** `npx vitest run` (suite completa) → **863/864**, estable en 2 ejecuciones consecutivas tras la corrección de estabilidad de 2026-09-15 (ver más abajo). Un único fallo, preexistente y ajeno a Fase 2:
  - `calculate-whatif.test.ts` ("should create a scenario with monthly savings calculation"): **preexistente**, no es un archivo de Fase 2. Usa una fecha objetivo hardcodeada `2026-08-01`, ya pasada respecto a la fecha real del sistema (hoy 2026-09-15). Ya documentado como preexistente desde la Fase 1.
  - **Corrección de estabilidad aplicada (2026-09-15):** `process-embeddings.test.ts` pasaba 5/5 en aislamiento pero fallaba de forma intermitente por timeout (2-3 de sus 5 tests, número variable entre ejecuciones) al correr dentro de la suite completa (864 tests en paralelo, cada uno con su propio entorno jsdom). Diagnóstico confirmado: los 5 tests son deterministas y no dejan trabajo asíncrono pendiente (todas las dependencias externas mockeadas, cada test resuelve en un tick) — el timeout por defecto de Vitest (5000ms) se superaba solo por contención de CPU/IO del runner bajo carga completa, nunca por una promesa sin resolver ni por un cambio de comportamiento del código. Corrección mínima: se sube el timeout SOLO de esos 5 tests (tercer argumento de `it(...)`, `STABILITY_TIMEOUT_MS = 15000`), documentado en el propio archivo — el `testTimeout` global de `vitest.config.ts` no se tocó. Verificado estable en 2 ejecuciones completas consecutivas tras la corrección.
- **Lint:** `npx eslint .` (proyecto completo) → **0 errores nuevos**. 7 errores preexistentes, los tres en archivos completamente ajenos a Fase 2 (`scripts/debug-agent.js`, `scripts/update_mdx.js`, `tailwind.config.ts` — nunca tocados). 75 warnings preexistentes, verificados uno a uno contra `git diff` en cada tarea de esta fase — ninguno introducido por Fase 2.
- **Build:** `npm run build` → compilación y `tsc` correctos, todas las rutas generadas sin error, incluida la nueva `/api/ai/agent-v2/cancel-confirmation`.
- **`git diff --check`:** sin errores (solo avisos de fin de línea LF→CRLF, normales en Windows).
- **Hallazgo corregido durante la revisión de cierre:** ver §2 (2.G) — frase residual de aprendizaje colectivo en `search-expenses-definition.ts`, corregida y con test de regresión.

⏳ **No verificado en esta sesión** (requiere migraciones aplicadas + despliegue real): comportamiento de RLS contra Supabase real, coste real de OpenAI (`cost_usd` sigue siendo una estimación local, nunca una factura verificada), latencia real en producción, y si `ai_logs` ya existe o no en el proyecto de destino.
