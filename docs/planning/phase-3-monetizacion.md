# Fase 3 — Monetización: Auditoría y Plan Técnico

> Documento de planificación. Generado por auditoría estática del repo `kakebo/kakebo`
> en 2026-09-16. No se consultó Stripe ni Vercel en ningún momento de esta fase.

## Estado de implementación de 3.B (2026-09-16)

**IMPLEMENTACIÓN LOCAL PREPARADA, NO APLICADA NI PUBLICADA.**

El contrato de acceso de 3.A y el diseño de 3.B (ambos aprobados tras varias
revisiones) se han implementado como código y migraciones **locales**, en el
árbol de trabajo de este repositorio. Nada de esto se ha:
- commiteado ni empujado (`git commit`/`git push`);
- aplicado contra Supabase remoto (`supabase db push` ni ningún equivalente);
- desplegado en Vercel;
- ejecutado contra Stripe (no se instaló el SDK, no hay Checkout ni webhooks reales).

El **procedimiento de captura de fundadores** (`supabase/manual-ops/founder_capture_activation.sql`)
está escrito pero **no se ha ejecutado ni se ejecutará hasta el día real de
activación de monetización**, cuando la Fase 3.C esté terminada y el propietario
decida el instante de lanzamiento — ver advertencia en la cabecera de ese archivo.

### Archivos nuevos/modificados en esta implementación

| Archivo | Qué es |
|---|---|
| `src/lib/auth/access-state.ts` | Resolvedor central de acceso (puro, sin UI ni red) — los 6 `AccessState` + matriz de permisos |
| `src/__tests__/lib/auth/access-state.test.ts` | Tests del resolvedor: prioridad de estados, legado ignorado, permisos IA/exportación, cálculo de periodo Europe/Madrid |
| `supabase/migrations/20260916_phase3b_monetization_foundation.sql` | Migración completa: columnas nuevas en `profiles`, tablas `founder_cutoff`/`subscriptions`/`expense_monthly_usage`/`stripe_webhook_events`, `handle_new_user` con lock advisory + trial 30 días, `fn_resolve_access_state`, `fn_create_expense`, cierre de grants (marcado pendiente de preflight remoto) |
| `supabase/manual-ops/founder_capture_activation.sql` | Procedimiento manual de activación de fundadores — **no ejecutado, no se ejecuta hasta el lanzamiento real** |
| `supabase/tests/phase3b_security_checks.sql` | Comprobaciones SQL de seguridad (singleton, inmutabilidad, grants, `fn_create_expense`) — documentadas, no ejecutables en este entorno (sin Postgres local) |
| `src/app/api/expenses/route.ts` | Ruta manual migrada a `fn_create_expense` (RPC) en vez de `INSERT` directo |
| `src/lib/ai/tool-executor.ts` | Asistente legado (`/api/ai/assistant`) migrado a la misma RPC |
| `src/lib/agents/tools/create-transaction.ts` | Compartido por agent-v2 (chat y streaming) — rama de gasto migrada a la RPC; rama de ingreso sin cambios |
| `src/lib/api/errors.ts` | Mapeo de los códigos `KB001` (límite alcanzado → 409) y `KB002` (validación/propiedad → 400 genérico, sin fuga de datos) |
| `src/__tests__/api/expenses.test.ts` | Actualizado para mockear `.rpc()` en vez del segundo `.single()`; añadidos casos de límite alcanzado y error genérico |
| `src/__tests__/agents/tools/create-transaction.test.ts` | Actualizado para mockear `.rpc()` en los casos de gasto; añadido caso de límite alcanzado |
| `src/__tests__/lib/ai/tool-executor-create-expense.test.ts` | Nuevo — cubre el canal del asistente legado usando la RPC |

### Qué requerirá tu aprobación manual más adelante

1. **Preflight remoto de `profiles`/`expenses`** (§3.B.4 precondición 4 y nueva):
   confirmar contra el proyecto real los grants/triggers/políticas exactos antes
   de aplicar las secciones 9 y 10 de la migración (los `REVOKE`).
2. **Aplicar la migración** contra un entorno de prueba real (local con Docker o
   staging) — no hay entorno Postgres local configurado en este repo hoy (ver
   §3.B.5); esta implementación no lo instaló ni lo asumió.
3. **Desplegar el código de las 3 rutas junto con la migración**, nunca por
   separado — si el código que llama a `fn_create_expense` se despliega antes
   de que la función exista en la base remota, la creación de gastos se rompe.
4. **Ejecutar `founder_capture_activation.sql`** — una sola vez, manualmente, el
   día real de activación, después de que Stripe (3.C) esté operativo.
5. **3.C completo** (Checkout, webhooks reales, `stripe.subscriptions.retrieve`)
   — el esquema (`subscriptions`, `stripe_webhook_events`) está preparado pero
   sin ninguna lógica de Stripe implementada todavía, tal como se pidió.

## 0. Resumen ejecutivo

El hallazgo histórico **se confirma**: cualquier usuario autenticado tiene hoy acceso completo, sin gating alguno. Stripe fue desactivado a nivel funcional (rutas devuelven `410`/`200` vacío) pero **no se limpió del repo**: quedan tipos, columnas de perfil y stubs. Existe una tabla `profiles` real en producción (con `tier`, `trial_ends_at`, `stripe_customer_id`, `stripe_subscription_id`, `manual_override`) pero **su migración de creación no está versionada en git** — se creó fuera de banda (SQL editor / trigger `handle_new_user` cuya definición tampoco está en el repo). Esto es el mayor riesgo estructural para la Fase 3: hay que recuperar/versionar el esquema real de `profiles` antes de tocarlo.

---

## 1. Auditoría confirmada por archivo

### 1.1 Autenticación y control de acceso

- `src/middleware.ts` (11 líneas, completo) — **solo** enrutamiento i18n (`next-intl`). No verifica sesión, no protege rutas, no refresca cookies de Supabase.
- `src/components/AuthGate.tsx` — único guard real, **client-side**: en `useEffect` llama `supabase.auth.getSession()`, se suscribe a `onAuthStateChange`, y si no hay sesión hace `router.replace("/login")`. Depende de que cada página se envuelva manualmente con `<AuthGate>`.
- `src/lib/auth/access-control.ts` (24 líneas, completo):
  ```ts
  // La herramienta es gratuita. Todo usuario autenticado tiene acceso completo.
  export function canUsePremium(profile: Profile | null): boolean {
      return profile !== null;
  }
  export const canUseAI = canUsePremium;
  export function getTrialDaysLeft(_profile: Profile | null): number { return 0; }
  ```
  **Confirma el hallazgo histórico**: el gate de acceso es un no-op — devuelve `true` para cualquier perfil no nulo.
- `src/components/saas/SubscriptionGuard.tsx` — passthrough total (`return <>{children}</>`).
- `src/lib/api/auth.ts` — `requireAuth()` solo verifica sesión Supabase, no consulta `tier` ni ningún campo de plan.

### 1.2 Perfiles y fecha de alta

- **No existe `CREATE TABLE profiles` en ninguna migración del repo.** Se referencia en `supabase/migrations/20260217_security_audit.sql` (RLS/GRANT sobre una tabla que se asume ya existe), y se menciona un trigger `handle_new_user` (`GRANT EXECUTE ON FUNCTION public.handle_new_user TO service_role`) cuya definición no está versionada.
- El único documento fiable de las columnas reales es el tipo TS `Profile` en `src/lib/auth/access-control.ts:3-12`:
  ```ts
  export interface Profile {
      id: string;
      email: string;
      tier: SubscriptionTier; // 'free' | 'pro'
      trial_ends_at: string | null;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      is_admin?: boolean;
      manual_override?: boolean;
  }
  ```
  Confirmado en uso real por `scripts/expire-user.ts` (actualiza `profiles.trial_ends_at` y `profiles.tier`) y `src/app/api/admin/grant-vip/route.ts` (actualiza `profiles.manual_override`).
- **No hay `created_at` declarado explícitamente** en ningún sitio del código para `profiles` (Supabase suele añadirlo por defecto a nivel de tabla, pero no está confirmado en el repo).
- **"founder"/"fundador": no encontrado** en ningún archivo. No existe hoy ningún mecanismo de congelar quién es fundador.
- El admin actual **no es un flag de BD `is_admin`**, sino la env var `NEXT_PUBLIC_ADMIN_EMAILS` comparada contra `user.email` (`src/app/api/admin/grant-vip/route.ts:22-24`).

### 1.3 Restos de Stripe (confirmado, no limpiado)

| Archivo | Estado |
|---|---|
| `package.json` | Sin dependencia `stripe` instalada |
| `src/lib/stripe/server.ts` | `export const stripe = null;` (comentario: "Stripe has been removed") |
| `src/app/api/webhooks/stripe/route.ts` | `POST()` devuelve `200` vacío, sin lógica |
| `src/app/api/stripe/checkout/route.ts` | `POST()` devuelve `410` |
| `src/app/api/stripe/cancel/route.ts` | `410` |
| `src/app/api/stripe/portal/route.ts` | `410` |
| `src/app/[locale]/app/subscription/page.tsx` + `SubscriptionClient.tsx` | Página "Acceso Gratuito", solo texto |
| `.env.example` | Variables Stripe comentadas bajo `# [OBSOLETAS - Kakebo es ahora gratuito, Stripe está desactivado]` |

### 1.4 Creación de gastos y límites

- `POST /api/expenses` (`src/app/api/expenses/route.ts:99-215`): valida con Zod, resuelve/crea el mes, **solo bloquea si el mes está `closed`** (`:127-131`). **No hay ningún `count()` ni límite de gastos por mes, ni rate limiting, ni chequeo de plan.**
- Esto significa: el endpoint es directamente vulnerable a que un límite "30 gastos/mes" implementado solo en cliente sea eludido con llamadas API directas.

### 1.5 Modo de solo lectura

- No existe ningún concepto de "read-only" global ni "solo consulta". Lo que existe es el **cierre de mes (`months.status`)**: bloquea POST/PATCH/DELETE de expenses cuando el mes está `closed`, comprobado de forma duplicada en tres endpoints (`expenses/route.ts`, `expenses/[id]/route.ts` x2). Es un lock por mes, no un estado de cuenta — reutilizable como *patrón* (chequeo que devuelve 409), no como mecanismo directo.

### 1.6 Exportaciones/informes

- Existen ya, **100% client-side**: `src/components/reports/ReportButton.tsx`, `ReportDialog.tsx` (consulta Supabase directo desde el browser + CSV/Excel vía Blob), `ReportPDF.tsx` (PDF vía `@react-pdf/renderer`). **Sin endpoint servidor**, sin límite de uso ni chequeo de plan hoy.

### 1.7 Ajustes de usuario

- `src/app/api/settings/route.ts` (GET/PATCH) sobre tabla `user_settings` (presupuestos, ingreso mensual, balance). No contiene campos de plan/tier — esos viven en `profiles`.

### 1.8 Correos transaccionales

- **No existe ninguna integración de email transaccional** en el producto (sin `resend`, `sendgrid`, `nodemailer`, etc. en dependencias). Solo existe `kakebo/nanobot/nanobot/channels/email.py`, un canal IMAP/SMTP de un framework de agentes aparte, no conectado a la app Next.js.

### 1.9 Analytics (GA4)

- Inicializado en `src/components/analytics/GoogleAnalytics.tsx`, montado en `src/app/[locale]/layout.tsx`. Wrapper de eventos en `src/lib/analytics.ts`.
- Eventos actuales (todos en páginas públicas/landing, **ninguno de producto**): `tool_viewed`, `tool_interaction`, `download_template`, `click_cta_login`, `click_tool_to_app`, `use_savings_calculator`, `use_inflation_calculator`, `use_503020_calculator`, `savings_calculator_calculate`, `savings_calculator_goal_result`, `inflation_calculator_mode_change`, `historical_inflation_calculation`, `historical_inflation_error`. `signup_click` está declarado en el tipo pero sin ningún call site.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` se usa en código pero **no aparece en `.env.example`** (gap de documentación).

### 1.10 Tablas SQL versionadas en el repo

- `supabase/migrations/20260217_security_audit.sql` — solo RLS/GRANT sobre `profiles`, `expenses`, `incomes`, `budgets`, `documents`, `embeddings` (no las crea).
- `src/migrations/001_merchant_rules.sql`, `002_correction_examples.sql` — crean `merchant_rules`, `correction_examples`.
- `migrations/auto_embeddings_setup.sql` — crea `expense_counter`.
- SQL embebido en TS (no migraciones reales): `ai_logs` (`src/lib/ai/metrics.ts:253`), `expense_embeddings` (`src/lib/ai/embeddings.ts:356`), variante de `expense_counter` (`src/lib/ai/auto-embeddings.ts:199`).

---

## 2. Puntos desconocidos que requieren decisión/verificación del propietario

1. **Esquema real de `profiles` en Supabase remoto** no está versionado en git. Antes de tocar nada hay que volcar el `CREATE TABLE profiles` real (columnas, tipos, defaults, triggers) a una migración versionada de "captura de estado actual" (sin aplicarla — solo para tener control de versiones). Esto se hace consultando el dashboard/CLI de Supabase, no en esta sesión.
2. **Definición de `handle_new_user`**: ¿qué hace exactamente al crear un perfil nuevo hoy? ¿asigna `tier='free'` y algún `trial_ends_at` por defecto? No está en el repo — hay que recuperarla.
3. **Lista real de "usuarios ya registrados antes del lanzamiento"**: ¿se define por fecha de corte en `auth.users.created_at`, por una tabla de snapshot, o por un flag que hay que congelar ahora vía script one-off? Requiere decidir la fecha de corte exacta y el mecanismo de congelación (ver §5.1).
4. **`is_admin`**: hoy es solo `NEXT_PUBLIC_ADMIN_EMAILS` (env var), no columna de BD verificada. ¿Se mantiene así o se migra a columna?
5. **Nombre de la ruta pública de precios/checkout** y si ya existe algún componente de landing con precios (fuera de alcance de esta auditoría, que evitó tocar páginas públicas/SEO por instrucción explícita).
6. **Política exacta de devoluciones manuales**: quién la ejecuta (soporte vía email, panel admin) — no hay UI de soporte hoy.

---

## 3. Propuesta de tareas 3.A – 3.G

### 3.A — Contrato de acceso, fundadores y estados de suscripción (detallado)

> **Estado: APROBADO por el propietario (2026-09-16), revisión 2.** Contrato cerrado — sirve de base para 3.B en adelante. Nada de esto se ha implementado todavía (sigue siendo documento).

#### 3.A.0 Contrato final — resumen de referencia rápida

**6 estados, en este orden de evaluación:**

| # | Estado | Condición |
|---|---|---|
| 1 | `founder` | `is_founder = true` |
| 2 | `plus_active` | `now() < plus_access_until` y no cancelada |
| 3 | `plus_canceled_pending` | `now() < plus_access_until` y cancelada (mismos permisos que `plus_active`) |
| 4 | `trialing` | `now() < trial_ends_at` |
| 5 | `free_under_limit` | trial vencido, sin Plus, `< 30` gastos este mes natural |
| 6 | `free_readonly` | trial vencido, sin Plus, `>= 30` gastos este mes natural |

**Matriz de permisos:**

| Estado | Crear/editar gasto | Consultar | IA | Exportar | Gestionar pago |
|---|---|---|---|---|---|
| `founder` | sí | sí | sí | sí | n/a |
| `plus_active` / `plus_canceled_pending` | sí | sí | sí | sí | sí |
| `trialing` | sí | sí | sí | no | ver upgrade |
| `free_under_limit` | sí (hasta 30) | sí | no | no | ver upgrade |
| `free_readonly` | no | sí | no | no | ver upgrade |

**Principios estructurales fijados:**
- `plus_manual` no existe como estado; `manual_override` es dato heredado pendiente de revisión en 3.B.
- Fundadores: corte inmutable server-only (`founder_cutoff`), nunca fecha manual improvisada; `founder_captured_at` significa exclusivamente "capturado por el corte automático".
- Pago: derecho normalizado `plus_access_until`, escrito solo por webhook verificado; cancelación no lo modifica, solo marca informativo.
- Límite de 30: mes natural Europe/Madrid, por `created_at` de servidor, atómico, sin depender de `payment_cycles`.
- `profiles` es estrictamente server-write-only; las preferencias de usuario ya viven aparte en `user_settings`.

El detalle y la justificación de cada punto quedan en §3.A.1–§3.A.7 más abajo (sin cambios respecto a la revisión 2 ya aprobada).

#### 3.A.1 Estados de acceso (`access_state`) — 6 estados, no 7

`plus_manual` se elimina: no es una función de producto aprobada. Los usuarios existentes se vuelven fundadores por el corte de activación (§3.A.3), no por una bandera de "acceso manual perpetuo". `manual_override` (columna heredada, ya con 3 filas en producción) se trata como **dato legacy a revisar/migrar en 3.B** — no se documenta aquí como un estado de acceso válido a futuro.

| # | access_state | Condición exacta de entrada |
|---|---|---|
| 1 | `founder` | `profile.is_founder = true` |
| 2 | `plus_active` | `now() < profile.plus_access_until` AND suscripción sin cancelar (ver §3.A.5) |
| 3 | `plus_canceled_pending` | `now() < profile.plus_access_until` AND suscripción marcada para cancelar al fin de periodo — **mismos permisos que `plus_active`**, se distingue solo para mostrar el aviso correcto en UI, no cambia la matriz |
| 4 | `trialing` | `now() < profile.trial_ends_at` AND ninguno de los anteriores |
| 5 | `free_under_limit` | trial vencido, sin Plus vigente, y `expenses_creados_mes_natural_Europe_Madrid < 30` |
| 6 | `free_readonly` | trial vencido, sin Plus vigente, y `expenses_creados_mes_natural_Europe_Madrid >= 30` |

Se evalúa **en ese orden**: `founder` corta primero siempre, antes de mirar ningún dato de Stripe o de trial.

#### 3.A.2 Matriz de permisos por estado (corregida)

| access_state | Crear gasto | Editar/borrar | Consultar | IA | Exportar | Gestionar pago | Cancelar |
|---|---|---|---|---|---|---|---|
| `founder` | sí | sí | sí | sí | **sí** | n/a — nunca se le cobra | n/a |
| `plus_active` | sí | sí | sí | sí | **sí** | sí (portal Stripe) | sí |
| `plus_canceled_pending` | sí (hasta `plus_access_until`) | sí | sí | sí | **sí** | sí (reactivar) | ya cancelado |
| `trialing` | sí | sí | sí | **sí** | **no** | ver upgrade (opcional) | n/a |
| `free_under_limit` | sí (hasta 30) | sí | sí | **no** | **no** | ver upgrade | n/a |
| `free_readonly` | no | no | sí | **no** | **no** | ver upgrade | n/a |

Cambios respecto a la versión anterior, aplicando tus correcciones:
- **Exportar**: exclusivo de `founder`/Plus (activo o con acceso pagado vigente aunque cancelado). `trialing` y ambos estados gratuitos → no.
- **IA**: sí para `founder`, Plus vigente y `trialing` (los 30 días de prueba incluyen IA). No hay créditos ni uso de IA gratuito una vez terminada la prueba sin plan — `free_under_limit` y `free_readonly` → no.

Sustituye por completo a `canUsePremium()`/`canUseAI()` actuales. Implementación futura (3.B+): una única función pura `resolveAccessState(profile, expensesThisMonth): AccessState` + un mapa `PERMISSIONS[AccessState]`, sin lógica duplicada en otro sitio.

#### 3.A.3 Mecanismo de captura de fundadores — corte inmutable, sin condición de carrera

Problema con el diseño anterior (`WHERE founder_captured_at IS NULL`, usando `now()` implícito en el momento del `UPDATE`): una transacción de registro que **empezó antes** del despliegue pero **confirma (`COMMIT`) después** de que el `UPDATE` de captura ya se haya ejecutado quedaría fuera para siempre, aunque su `created_at` sea anterior al lanzamiento — porque el `UPDATE` solo ve filas ya confirmadas en el instante en que corre, no filas con un timestamp "correcto" pero aún en vuelo (MVCC de Postgres). Usar `now()` como corte implícito es frágil precisamente por eso.

**Diseño corregido**: el corte es un valor **fijo, decidido de antemano, guardado en servidor** — no algo calculado en el momento de la captura.

1. **Tabla de configuración server-only**: `founder_cutoff` (una sola fila) — `id, cutoff_at timestamptz NOT NULL, set_at timestamptz DEFAULT now()`. RLS totalmente cerrado: **cero grants** a `anon`/`authenticated`, solo legible/escribible por `service_role`. No es una columna de `profiles`, es una tabla aparte para que ningún flujo de usuario pueda siquiera verla.
2. **Antes del despliegue**, se decide y se escribe `cutoff_at` con un **margen de seguridad hacia el pasado** respecto al instante real del despliegue (p. ej. "el corte es 10-15 minutos antes de que arranque la migración"), precisamente para dar tiempo a que cualquier transacción de registro en vuelo en ese margen termine de confirmar antes de que se evalúe el corte. Esto no es una "fecha manual elegida a dedo" en el sentido de negocio — es un margen técnico de seguridad alrededor del momento real de activación, documentado y trazable en `founder_cutoff.set_at`.
3. **La captura usa el corte fijo, no `now()`**:
   ```sql
   -- Ilustrativo, no se aplica en esta tarea
   UPDATE public.profiles p
   SET is_founder = true, founder_captured_at = now()
   FROM public.founder_cutoff c
   WHERE p.created_at < c.cutoff_at
     AND p.founder_captured_at IS NULL;
   ```
   Como `cutoff_at` es fijo y ya pasado (por el margen de seguridad) en el momento en que esta sentencia corre, **todas** las filas con `created_at < cutoff_at` están garantizado que ya han confirmado — no hay ventana de ambigüedad. Es seguro re-ejecutar esta sentencia en cualquier momento posterior (la condición `founder_captured_at IS NULL` evita duplicar efecto), incluso días después del despliegue, con el mismo resultado.
4. **Cómo se protege a los usuarios posteriores al corte** (lo que pediste explicar): `handle_new_user` (o su reemplazo) **consulta explícitamente `founder_cutoff.cutoff_at`** al crear el perfil, no se limita a dejar `is_founder` en su default:
   ```sql
   -- Ilustrativo
   INSERT INTO public.profiles (id, tier, trial_ends_at, is_founder)
   SELECT new.id, 'free', now() + interval '30 days',
          false  -- explícito: cualquier alta pasa por este trigger, nunca por el corte
   ```
   La garantía real no depende de que el trigger "consulte y compare" contra el corte en cada alta (sería redundante, porque el corte ya pasó y es fijo) — depende de que **el trigger nunca asigna `true`**, bajo ninguna condición, y de que la sentencia de captura del punto 3 solo se ejecuta una vez, contra un corte que ya quedó en el pasado antes de que el trigger empezara a servir altas nuevas. El trigger consultando el corte explícitamente (en vez de solo confiar en el `DEFAULT false` de la columna) es una capa defensiva adicional: si alguna vez se refactoriza el `INSERT` y alguien olvida el default, la comparación explícita contra `founder_cutoff.cutoff_at` sigue bloqueando cualquier fila cuyo `created_at` sea posterior.
5. **`founder_captured_at` significa exclusivamente "capturado por el corte automático"** — corregido según tu punto 5. Una concesión manual futura (ver punto 6 más abajo) **nunca** escribe en esta columna, y no existe ningún flujo que pueda revocar a un fundador ya capturado por el corte (ni Stripe, ni admin, ni ningún endpoint tiene permiso de escritura sobre `is_founder`/`founder_captured_at` de una fila que ya los tenga puestos — ver §3.A.6 sobre separación de datos).
6. **Compensaciones manuales futuras** (si algún día hace falta, p. ej. soporte a un usuario con un problema de facturación): **no usan `manual_override` ni tocan `is_founder`/`founder_captured_at`**. Sería un mecanismo aparte, explícitamente temporal y auditable — p. ej. una fila en una tabla `support_grants(profile_id, granted_by, reason, expires_at, created_at)` que el cálculo de `access_state` consulta como una fuente más (equivalente a un `plus_access_until` extendido temporalmente con motivo registrado), nunca como un campo perpetuo en `profiles`. El diseño exacto de esta tabla es un detalle de 3.B, no se cierra aquí — solo se deja establecido el principio: temporal, revocable, con motivo obligatorio, y sin tocar las columnas de fundador.

#### 3.A.4 Límite de 30 gastos/mes — diseño cerrado, atómico

- **Qué cuenta**: creaciones de gasto **exitosas** (no ediciones, no gastos ya existentes) — **borrar un gasto no libera cupo**, para impedir el ciclo crear→borrar→crear como forma de eludir el límite.
- **Periodo**: mes natural en zona horaria **Europe/Madrid** (no UTC, no la zona del navegador del usuario), calculado con `now() AT TIME ZONE 'Europe/Madrid'` en servidor — Postgres ajusta el cambio de horario de verano/invierno automáticamente al usar el nombre de zona (no un offset fijo).
- **Nunca se cuenta por `expenses.date`** (editable por el usuario) **ni por `payment_cycles`** (confirmado por ti: el límite gratuito siempre es mes natural, independientemente del ciclo de nómina que tenga configurado el usuario para sus presupuestos).
- **Atomicidad**: no un `SELECT count(*)` desprotegido (vulnerable a que dos peticiones concurrentes lean el mismo conteo antes de que ninguna inserte). Diseño: tabla contadora dedicada con clave única, incrementada con `INSERT ... ON CONFLICT DO UPDATE ... WHERE` para que el límite se aplique de forma serializada por el propio motor de base de datos:
  ```sql
  -- Ilustrativo, no se aplica en esta tarea
  CREATE TABLE expense_monthly_usage (
      user_id uuid NOT NULL,
      period  text NOT NULL,  -- 'YYYY-MM' en Europe/Madrid, calculado en servidor
      count   integer NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, period)
  );

  -- En la misma transacción que crea el gasto:
  INSERT INTO expense_monthly_usage (user_id, period, count)
  VALUES ($user_id, $period, 1)
  ON CONFLICT (user_id, period)
  DO UPDATE SET count = expense_monthly_usage.count + 1
  WHERE expense_monthly_usage.count < 30
  RETURNING count;
  -- Si no devuelve fila (WHERE no cumplido) → límite alcanzado, abortar transacción,
  -- NO insertar en expenses, responder 409.
  -- Si devuelve fila → proceder a insertar el gasto, en la misma transacción.
  ```
  El `UPDATE` dentro del `ON CONFLICT` adquiere un lock de fila sobre `(user_id, period)`, así que dos peticiones concurrentes del mismo usuario se serializan ahí — no pueden las dos leer "29" y las dos insertar el gasto número 30 y 31 a la vez. Esto debe ejecutarse como una única operación atómica en base de datos (función/RPC o transacción explícita), no como dos llamadas separadas desde el servidor de Next.js con un `await` entre medias.
- Perfiles exentos (`founder`, `plus_active`, `plus_canceled_pending`, `trialing`) **no pasan por esta tabla en absoluto** — el chequeo de límite solo se invoca para `free_under_limit`/`free_readonly`.

#### 3.A.5 Derecho de pago normalizado — `plus_access_until`

En vez de que los permisos lean directamente `subscription_status`/`stripe_subscription_id` (interpretación frágil de los estados crudos de Stripe), se define un campo propio: `profiles.plus_access_until timestamptz`. Regla única: **`plus_access_until` solo lo escribe el webhook de Stripe ya verificado (firma comprobada), nunca el checkout, nunca el cliente.**

- Alta/renovación de pago confirmada (`invoice.paid` / `checkout.session.completed` con pago real) → `plus_access_until = current_period_end` (tal cual lo reporta Stripe para esa suscripción).
- Cancelación (`customer.subscription.updated` con `cancel_at_period_end=true`, o `customer.subscription.deleted`) → **no se toca `plus_access_until`** — el usuario conserva Plus hasta esa fecha ya fijada, exactamente como pide el enunciado de producto ("conserva Plus hasta el final del periodo ya pagado"). Solo se actualiza un campo informativo (p. ej. `subscription_will_renew boolean`) para que la UI muestre "se cancela el [fecha]" en vez de "renueva el [fecha]" — ese campo no afecta a `access_state`, que sigue siendo `plus_active`/`plus_canceled_pending` mientras `now() < plus_access_until`.
- Fallo de pago / evento no reconocido → **no se toca `plus_access_until`** (fail-safe: nunca degradar por un evento que no se entiende del todo; la política exacta de dunning queda pendiente de decidir en 3.C).
- `access_state = plus_active`/`plus_canceled_pending` se resuelve **únicamente** comparando `now() < plus_access_until` — nunca leyendo `subscription_status` como fuente de verdad para permisos (ese campo, si se guarda, es solo para mostrar UI/soporte).

#### 3.A.6 Separación de datos editables vs. datos de acceso/pago (corregido)

Tu objeción es correcta: decir "revocar `UPDATE`" sin más rompería cualquier futura preferencia de usuario en `profiles`. La auditoría real (3.0) ya muestra que esto **no hace falta inventarlo** — la separación ya existe físicamente en el esquema actual:

- `public.profiles` **no tiene hoy ninguna columna pensada para ser editada por el usuario** — todas sus columnas (`tier`, `trial_ends_at`, `stripe_customer_id`, `stripe_subscription_id`, `manual_override`, y las nuevas `is_founder`/`founder_captured_at`/`plus_access_until`) son de control de acceso/facturación, gestionadas por servidor.
- Las preferencias que el usuario sí edita (presupuestos, ingreso mensual, balance, `ai_confirm_writes`, `allow_collective_learning`) **ya viven en `public.user_settings`**, una tabla aparte, con su propio `PATCH /api/settings`.
- **Conclusión de diseño**: no hace falta partir `profiles` en dos tablas nuevas. Basta con que `profiles` pase a ser **estrictamente de escritura server-only** — ningún `GRANT UPDATE` para `authenticated` sobre ninguna columna de `profiles` (ni siquiera parcial/column-level), toda escritura vía `service_role` (rutas de servidor, funciones `SECURITY DEFINER` para el webhook). Si en el futuro apareciera una preferencia de usuario que lógicamente encajara en `profiles` (poco probable dado su propósito actual), la vía correcta sería añadirla a `user_settings` o exponerla mediante una función RPC estrictamente acotada (`update_my_preference(field, value)` con lista blanca de campos permitidos), nunca ampliando el `GRANT UPDATE` genérico sobre `profiles`.
- Esto sigue pendiente de verificar (no confirmado en esta sesión, ver §5 bis): si existe algún trigger `BEFORE UPDATE` en `profiles` que ya mitigue parcialmente esto, y si conviene añadir además una política `RESTRICTIVE` explícita como capa adicional a la revocación de grants.

#### 3.A.7 Objetivo, archivos, riesgos, pruebas y criterio de commit

- **Objetivo**: dejar aprobado el contrato de estados (6), la matriz de permisos, el mecanismo de captura de fundadores sin condición de carrera, el diseño atómico del límite de 30 gastos, el derecho de pago normalizado (`plus_access_until`) y la estrategia de separación de datos — todo como documento, sin tocar código ni base de datos.
- **Archivos/sistemas que probablemente tocaría cuando se implemente** (no en esta tarea): `src/lib/auth/access-control.ts` (`resolveAccessState`, tipos ampliados), nuevo `src/lib/auth/permissions.ts`, `src/app/api/expenses/route.ts` (chequeo atómico de límite), función/RPC de captura de fundadores, handler de webhook Stripe (escritura de `plus_access_until`).
- **Riesgos**: (a) el margen de seguridad del corte de fundadores (§3.A.3.2) debe ser suficiente para el volumen de registros esperado en ese momento — un margen demasiado corto reintroduce el riesgo original; (b) la tabla `expense_monthly_usage` necesita una política de limpieza/archivado a largo plazo (no definida aquí) para no crecer indefinidamente; (c) `plus_access_until` depende de que el webhook sea 100% fiable — cualquier evento perdido de Stripe deja el campo desactualizado hasta la siguiente sincronización (a diseñar en 3.C, p. ej. reconciliación periódica).
- **Pruebas necesarias** (cuando se implemente): unitarias de `resolveAccessState` sobre las 6 combinaciones; test de concurrencia real (N peticiones simultáneas) contra el diseño de `expense_monthly_usage` verificando que nunca se superan 30 inserciones; test de que borrar un gasto no decrementa el contador; test de la captura de fundadores con filas cuyo `created_at` cae justo antes/después del `cutoff_at`.
- **Criterio de aprobación de este documento**: pendiente de tu confirmación explícita — no se avanza a 3.B hasta que digas que este contrato queda aprobado.

### 3.B — Migraciones y acceso servidor (revisión 2)

> **Estado: NO APROBADO todavía.** Diseño de la migración que implementaría el contrato de 3.A. Nada de esto se ha creado, aplicado ni ejecutado — es documento, no código. Revisión 3 (2026-09-16) tras nuevas correcciones: captura de fundadores realmente serializada por lock transaccional (no "dos pasadas con margen"), protección de `subscriptions` contra webhooks fuera de orden, endurecimiento completo de `fn_create_expense` (identidad de servidor, `search_path` fijo, validación de propiedad, contador solo en `free_under_limit`, errores sin fuga de datos), aclaración del legado `tier`/`manual_override`, y nota de interfaz futura para 3.E.

#### 3.B.1 Alcance: qué cambia en el esquema

**A) `public.profiles` — columnas nuevas**

| Columna | Tipo | Default | Escritura permitida |
|---|---|---|---|
| `is_founder` | `boolean` | `false` | Solo por la sentencia de captura/reconciliación (§3.B.4), nunca por app/webhook |
| `founder_captured_at` | `timestamptz` | `NULL` | Igual que arriba |
| `trial_started_at` | `timestamptz` | `NULL` | **Solo por `handle_new_user`, una única vez, en el `INSERT` inicial. Ningún otro código (checkout, cancelación, reintento de pago, ninguna API de cliente) puede escribirla jamás — ni siquiera el webhook de Stripe.** |
| `trial_ends_at` | `timestamptz` | (ya existe) | Igual que `trial_started_at`: calculada una vez como `trial_started_at + interval '30 days'` en el mismo `INSERT`, nunca reescrita después. Registrar, cancelar o reintentar un pago no la toca bajo ninguna circunstancia — es el mecanismo concreto que impide que la prueba se reinicie. |
| `plus_access_until` | `timestamptz` | `NULL` | Solo por el handler de webhook Stripe verificado, y solo como **copia derivada** de `current_period_end` tomado de la fila correspondiente en el modelo de suscripción (punto B) — nunca se calcula ni se escribe de forma independiente |

`tier` y `manual_override` se conservan sin borrar, únicamente como **datos históricos**: tras activar el nuevo resolvedor de acceso, ninguna de las dos columnas concede ni condiciona ningún permiso — no hay una redefinición de uso pendiente ni ninguna decisión que tomar al respecto, quedan documentadas como legado de solo lectura para auditoría/soporte (desarrollado en §3.B.3 bis).

**B) Modelo privado de suscripción — tabla nueva `public.subscriptions`** (separada de `profiles`, corrección obligatoria #1)

`plus_access_until` en `profiles` sigue siendo el campo rápido que lee el chequeo de permisos (evita un `JOIN` en cada request), pero **no es la fuente de verdad** — es una copia derivada. La fuente de verdad es esta tabla:

```
user_id                 uuid NOT NULL REFERENCES auth.users(id),
stripe_customer_id      text NOT NULL,
stripe_subscription_id  text NOT NULL,
status                  text NOT NULL,        -- valor crudo recibido de Stripe, sin interpretar
plan_interval           text NOT NULL,        -- 'monthly' | 'annual'
current_period_end      timestamptz NOT NULL,
cancel_at_period_end    boolean NOT NULL DEFAULT false,
last_event_id           text,                 -- id del último evento Stripe aplicado (Event.id)
last_event_at           timestamptz,          -- Event.created (hora de Stripe, NO hora de recepción)
created_at              timestamptz NOT NULL DEFAULT now(),
updated_at              timestamptz NOT NULL DEFAULT now(),
PRIMARY KEY (user_id, stripe_subscription_id)
```

- Escritura: **solo** por el handler de webhook, `SECURITY DEFINER`/`service_role`.
- RLS: activado, **sin ninguna política para `authenticated`/`anon`** — cero `SELECT`/`UPDATE`/`INSERT`/`DELETE` desde cliente. Ver §3.B.8 para cómo se expone un resumen a la UI sin exponer esta tabla directamente.
- Guarda `status` tal cual (crudo, sin interpretar) precisamente para no repetir el error original de leer estados de Stripe como fuente de permisos (§3.A.5) — sirve para soporte/auditoría, no para gatear acceso.

**Corrección obligatoria — no confiar en `event.created` como criterio de orden.** Stripe no garantiza orden de entrega, y dos eventos relevantes pueden compartir marca temporal (la resolución de `event.created` es de segundos, insuficiente para desambiguar). El diseño anterior basado en comparar timestamps queda descartado.

**Diseño corregido: el servidor nunca aplica los datos que trae el propio evento del webhook — siempre recupera el estado canónico actual de la suscripción directamente de la API de Stripe antes de escribir.**

1. **Idempotencia y auditoría por `event_id`** (se mantiene): `INSERT INTO stripe_webhook_events (stripe_event_id, event_type, processed_at) VALUES (...)`. Si viola la `PRIMARY KEY` (evento ya visto), responder `200` sin más acción — protege contra reintentos del *mismo* evento. Esto ya no decide nada sobre orden, solo evita reprocesar un evento idéntico.
2. **Filtrar solo eventos relevantes** (`customer.subscription.*`, `invoice.paid`, etc. — lista exacta a definir en 3.C). Para un evento relevante nuevo (no duplicado), el handler extrae únicamente el `stripe_subscription_id` del payload — **no usa ningún otro campo del evento para decidir el nuevo estado**.
3. **Consulta a la API de Stripe por el estado canónico actual**: `stripe.subscriptions.retrieve(stripe_subscription_id)` (llamada real a Stripe, sale del alcance de "solo lectura local" — se ejecuta en 3.C, no en esta auditoría). La respuesta de esa llamada, en el momento en que se hace, es la única fuente que se usa para actualizar `subscriptions`/`plus_access_until` — el `event.type`/`event.data.object` del webhook solo sirve como disparador ("algo cambió en esta suscripción, ve a comprobar el estado real"), nunca como fuente de datos.
4. **Exclusión mutua determinista por suscripción — adquirida ANTES de llamar a Stripe, liberada después de escribir** (corrección obligatoria, sustituye el `SELECT ... FOR UPDATE` suelto anterior, que solo protegía la escritura, no la lectura). Orden exacto de la operación completa, tal como exige la corrección:

   1. **Validar e insertar `event_id`** para idempotencia (paso 1 de arriba) — transacción corta e independiente, ya resuelta antes de este bloque.
   2. **Adquirir exclusión mutua por suscripción**: `SELECT pg_advisory_xact_lock(hashtext('kakebo:sub:' || $stripe_subscription_id))`. Clave determinista (mismo `stripe_subscription_id` → mismo entero de lock siempre), así que dos webhooks para la **misma** suscripción se serializan entre sí; dos webhooks de suscripciones **distintas** no se bloquean mutuamente (claves distintas). El lock se adquiere al abrir una transacción SQL explícita que permanece abierta durante todo el resto de la operación.
   3. **Recuperar el estado canónico desde Stripe** (`stripe.subscriptions.retrieve(stripe_subscription_id)`) — ejecutado **mientras la transacción y el lock siguen abiertos**. Esto es la parte del diseño que requiere una nota de implementación explícita: mantener una transacción SQL abierta durante una llamada de red externa es un patrón que no se recomendaría en un sistema de alto volumen (retiene una conexión de base de datos ociosa durante el round-trip HTTP a Stripe), pero es un trade-off consciente y razonable aquí dado el volumen esperado de webhooks de esta app (unos pocos eventos por hora, no por segundo). Mitigación obligatoria: fijar un timeout explícito y corto en la llamada al SDK de Stripe (p. ej. unos pocos segundos) para que, si Stripe no responde, la transacción haga `ROLLBACK` (liberando el lock automáticamente) en vez de quedarse colgada reteniendo el lock indefinidamente — Stripe reintregará el webhook más tarde si se responde con error.
   4. **Normalizar** `status`, `current_period_end`, `cancel_at_period_end`, `plan_interval` desde la respuesta canónica de Stripe, y derivar `plus_access_until = current_period_end`.
   5. **Actualizar las tablas locales en una única transacción** (la misma que ya tiene el lock abierto):
      ```sql
      -- Ilustrativo — misma transacción que adquirió el advisory lock en el paso 2
      INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status,
          plan_interval, current_period_end, cancel_at_period_end, last_event_id, updated_at)
        VALUES ($user_id, $customer_id, $sub_id, $canon_status, $canon_interval,
          $canon_period_end, $canon_cancel_flag, $event_id, now())
        ON CONFLICT (user_id, stripe_subscription_id) DO UPDATE
        SET status = EXCLUDED.status, current_period_end = EXCLUDED.current_period_end,
            cancel_at_period_end = EXCLUDED.cancel_at_period_end,
            plan_interval = EXCLUDED.plan_interval, last_event_id = EXCLUDED.last_event_id,
            updated_at = now();
      UPDATE profiles SET plus_access_until = $canon_period_end WHERE id = $user_id;
      ```
      `last_event_id` se conserva solo como referencia de auditoría ("qué evento disparó esta comprobación"), no como criterio de si aplicar los datos — el criterio de aplicar ya no depende de comparar nada, porque la exclusión mutua garantiza que solo una escritura para esa suscripción ocurre a la vez, siempre basada en una lectura fresca de Stripe hecha bajo el propio lock.
   6. **`COMMIT`** — libera el `pg_advisory_xact_lock` automáticamente (es un lock de transacción). Cualquier otro webhook para la misma suscripción que estuviera esperando en el paso 2 puede ahora adquirir el lock y repetir el ciclo completo (incluida su propia llamada fresca a Stripe) — nunca reutiliza el estado canónico que leyó el anterior.

   **Por qué esto cierra el caso que rechazaste**: con el lock adquirido *antes* de la llamada a Stripe y liberado *después* de escribir, es estructuralmente imposible que dos procesamientos para la misma suscripción se solapen en ningún punto — ni en la lectura a Stripe, ni en la normalización, ni en la escritura. El segundo procesamiento no empieza su propia llamada a Stripe hasta que el primero ha terminado y confirmado (o revertido) por completo, así que no hay "orden de llamadas" que pueda invertirse: son estrictamente secuenciales para una misma suscripción, cualquiera que sea su duración individual.

5. **Reducción legítima de `current_period_end` — documentado, no dejado abierto**:
   - **La cancelación que ofrecerá la app será siempre "al final del periodo", nunca inmediata**: la implementación de "cancelar" en 3.C debe llamar a `stripe.subscriptions.update(id, { cancel_at_period_end: true })`, **nunca** a `stripe.subscriptions.cancel(id)` (que sería cancelación inmediata). Con esa restricción, el objeto canónico de Stripe para una suscripción cancelada por este flujo **sigue reportando el `current_period_end` del periodo ya pagado** hasta que ese periodo termina de verdad — así que `plus_access_until`, al copiarse siempre del `current_period_end` canónico, **conserva automáticamente el acceso hasta el final del periodo pagado**, sin necesitar ninguna lógica especial de "no reducir".
   - **Retirada anticipada de acceso o reembolso**: explícitamente **fuera de esta fase** — será una política manual futura (soporte revisa caso a caso y actúa, p. ej. cancelando de forma inmediata en el propio dashboard de Stripe si corresponde, lo cual el webhook capturaría igual que cualquier otro cambio de estado real). No se construye aquí ningún mecanismo automático de reembolso ni de retirada anticipada.

**C) `public.founder_cutoff`** — tabla singleton real (corrección obligatoria: el diseño anterior con `id uuid DEFAULT gen_random_uuid()` no impedía múltiples filas, lo que permitía que una re-ejecución insertara un segundo corte y que un `ORDER BY set_at DESC` eligiera el más reciente — capturando erróneamente como fundadores a usuarios registrados después de la activación real):

```sql
-- Ilustrativo
CREATE TABLE public.founder_cutoff (
  id        boolean PRIMARY KEY DEFAULT true,
  CHECK (id),  -- fuerza que la única fila posible tenga id = true; ninguna otra puede existir
  cutoff_at timestamptz NOT NULL,
  set_at    timestamptz NOT NULL DEFAULT now(),
  set_by    text  -- ver nota más abajo: anotación libre, no una referencia verificada
);
```

`id boolean PRIMARY KEY` + `CHECK (id)` es el patrón estándar de "tabla singleton" en Postgres: la clave primaria garantiza unicidad por valor, y el `CHECK` prohíbe que ese valor sea `false`, así que como máximo puede existir una fila, siempre con `id = true`. Ya no hay ni hace falta `ORDER BY set_at DESC` en ningún sitio del diseño.

**Inmutabilidad reforzada a nivel de base de datos** (añadido, no solo una convención documentada): un trigger rechaza cualquier intento de `UPDATE`/`DELETE` sobre esta tabla, incluso desde `service_role`:
```sql
-- Ilustrativo
CREATE OR REPLACE FUNCTION public.reject_founder_cutoff_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'founder_cutoff es inmutable: no se permite UPDATE ni DELETE';
END;
$$;

CREATE TRIGGER founder_cutoff_immutable
BEFORE UPDATE OR DELETE ON public.founder_cutoff
FOR EACH ROW EXECUTE FUNCTION public.reject_founder_cutoff_mutation();
```
Así, "nunca actualizarlo, borrarlo ni sustituirlo" no depende de que nadie se equivoque al escribir el script de activación — queda garantizado por el propio esquema.

**`set_by` — corregido, sin placeholder ejecutable sin definir**: hoy no existe ningún sistema de administración/roles en la app (confirmado en §3.A.6 — el admin actual es solo una lista de emails en una env var, no una identidad verificable en base de datos). Como la activación es, según lo ya acordado, una operación interna ejecutada manualmente por ti directamente contra la base de datos (no un endpoint, no un flujo de la app), `set_by` es un campo **opcional, de texto libre, puramente informativo** — una anotación manual de quién ejecutó la activación (p. ej. `'activación manual, YYYY-MM-DD'`), **no** una referencia a `auth.users` ni nada que el sistema verifique. Si se deja `NULL`, el diseño funciona exactamente igual — es un campo de contexto/auditoría, no un requisito de seguridad (la seguridad la da que esto se ejecuta con acceso directo a la base de datos, no vía ninguna API pública).

**D) Tabla nueva `public.expense_monthly_usage`** (contador atómico) — sin cambios de esquema, ver §3.B.3 para el detalle de operación:
```
user_id uuid NOT NULL REFERENCES auth.users(id),
period  text NOT NULL,  -- 'YYYY-MM', Europe/Madrid, calculado en servidor
count   integer NOT NULL DEFAULT 0,
PRIMARY KEY (user_id, period)
```
RLS: `authenticated` puede `SELECT` su propia fila (para mostrar "17/30"); cero escritura desde cliente.

**E) Tabla nueva `public.stripe_webhook_events`** (idempotencia, sin cambios):
```
stripe_event_id text PRIMARY KEY,
event_type text NOT NULL,
processed_at timestamptz NOT NULL DEFAULT now()
```

**F) `handle_new_user`**: además de `tier='free'`, ahora inserta `trial_started_at = now()`, `trial_ends_at = now() + interval '30 days'`, `is_founder = false` explícito.

#### 3.B.2 `fn_create_expense` — operación atómica única, endurecida (corrección #3)

Una **única función `SECURITY DEFINER`**, `fn_create_expense(...)`, es el único punto de entrada para crear un gasto — tanto desde `POST /api/expenses` (flujo manual) como desde el tool-executor de IA (`src/lib/ai/tool-executor.ts`, que hoy hace su propio `INSERT` independiente y tendría que dejar de hacerlo). Sin esta unificación, el límite sería trivialmente eludible creando gastos por el canal de IA.

**Cierre del INSERT directo — sin esto, `fn_create_expense` es decorativa (corrección obligatoria).** Si `authenticated` conserva permiso de `INSERT` directo sobre `public.expenses`, cualquier cliente puede seguir eludiendo el contador llamando a `supabase.from('expenses').insert(...)` sin pasar por la función. El diseño se completa así:

1. **Revocar `INSERT` (y `UPDATE`/`DELETE` de las columnas relevantes al límite, si aplica) sobre `public.expenses` para `authenticated` y `anon`** — no se ha verificado todavía si ese grant existe hoy (la auditoría de 3.0 solo comprobó `profiles`, no `expenses`); se añade como precondición nueva junto a las de §3.B.4, a confirmar con otra lectura puntual antes de aplicar.
2. **`SELECT` sobre `expenses` se conserva sin cambios** para `authenticated` (con RLS ya existente por `user_id`) — la lectura no está en riesgo ni se toca; el enunciado de tu corrección pide explícitamente no abrir una vía alternativa de *inserción*, no restringir lectura.
3. **Única vía de creación permitida**: `fn_create_expense`, invocada como RPC (`supabase.rpc('fn_create_expense', {...})`) — al ser `SECURITY DEFINER`, se ejecuta con los privilegios de su propietario (no los de `authenticated`), así que sigue pudiendo insertar en `expenses` aunque el `GRANT INSERT` directo para `authenticated` ya no exista. Esta es la única forma en que un cliente autenticado puede crear un gasto tras el cierre.
4. **Auditoría de rutas actuales que hoy insertan en `expenses` directamente** (verificado por lectura estática del código, sin tocar Supabase remoto) — **son tres, no una sola**, y las tres tendrían que migrarse a llamar `fn_create_expense`:
   - `src/app/api/expenses/route.ts:153-164` (flujo manual, `POST /api/expenses`).
   - `src/lib/ai/tool-executor.ts:130-141` (asistente legado, servido por `POST /api/ai/assistant` — sigue activo, no solo agent-v2).
   - `src/lib/agents/tools/create-transaction.ts` (`createTransaction()`), compartido por **ambos** `POST /api/ai/agent-v2` y `POST /api/ai/agent-v2/stream` (confirmado: `src/lib/agents-v2/tools/executor.ts:260-261` delega en esta misma función — no hay una cuarta ruta duplicada, agent-v2 no tiene su propio `INSERT`).
   Las tres duplican hoy, además, la lógica de resolución/creación de mes (`months`) de forma independiente — el mismo refactor que las unifica en `fn_create_expense` debería absorber también esa lógica una sola vez, no solo el `INSERT` de `expenses`.
5. **Lo que se conserva sin abrir vía alternativa**: cualquier operación permitida hoy que no sea "crear un gasto" (lectura de `expenses`, creación/lectura de `months`, `incomes`, `fixed_expenses`, etc.) sigue exactamente igual — el cierre de permisos de este punto se limita estrictamente a `INSERT` sobre `expenses`, no se extiende a otras tablas salvo las ya cubiertas en `profiles` (§3.B.4).

**Identidad del usuario — auditada contra el código real, no asumida**

Verificado por lectura estática (local, sin consultas remotas) cómo autentica cada uno de los tres canales identificados en el punto anterior:

| Canal | Ruta | Cliente Supabase usado | Verificado en |
|---|---|---|---|
| Manual | `POST /api/expenses` | `createClient()` de `src/lib/supabase/server.ts` (SSR, `createServerClient` + cookies de sesión, **JWT del usuario**) vía `requireAuth()` | `src/lib/api/auth.ts:28`, `src/app/api/expenses/route.ts:32,102` |
| IA — asistente legado | `POST /api/ai/assistant` | Mismo `createClient()` (idéntico, JWT del usuario) | `src/app/api/ai/assistant/route.ts:2,58` |
| IA — agent-v2 (chat y streaming) | `POST /api/ai/agent-v2`, `POST /api/ai/agent-v2/stream` | Mismo `createClient()` (idéntico, JWT del usuario) | `src/app/api/ai/agent-v2/route.ts:3,107`, `src/app/api/ai/agent-v2/stream/route.ts:30,84` |

`createAdminClient()` (cliente `service_role`, sin JWT de usuario) **solo se usa** en `src/app/api/admin/list-vip-users/route.ts` y `src/app/api/admin/grant-vip/route.ts` (confirmado por búsqueda global) — ninguna ruta relacionada con creación de gastos lo usa hoy.

**Decisión final, según el código real**: los tres canales actuales pasan invariablemente por el cliente de sesión del usuario (`createClient()`), nunca por el cliente admin. Esto significa que `auth.uid()` **sí resuelve correctamente y sin excepción al usuario que actúa** en cualquiera de los tres, incluidos los dos canales de IA (el asistente actúa siempre "en nombre de" la sesión HTTP del usuario que abrió el chat, no con un usuario propio). Se confirma el diseño original: la función **no acepta `user_id` como parámetro** — su firma solo recibe los datos propios del gasto (`date`, `amount`, `category`, `note`, `month_id`); el usuario objetivo se resuelve exclusivamente con `auth.uid()` dentro de la función, y si es `NULL` la función aborta (no autenticado). No hace falta, con el código de hoy, una vía alternativa para un "canal admin" — no existe ninguno cerca de la creación de gastos.

**Riesgo residual explícito**: esta conclusión es válida *para el código auditado en esta fecha*. Si en el futuro se añade cualquier vía nueva de creación de gastos que use `createAdminClient()` (p. ej. una importación masiva, una herramienta de soporte), `auth.uid()` devolvería `NULL` bajo esa conexión y `fn_create_expense` la rechazaría por diseño (fallo seguro, no un permiso implícito) — lo correcto en ese caso sería crear una función interna **distinta**, explícitamente restringida a `service_role` (nunca expuesta como RPC pública), que reciba un `target_user_id` verificado por otros medios — nunca reutilizar `fn_create_expense` para ese propósito ni añadirle un parámetro `user_id` opcional "por si acaso". Esto queda como decisión a tomar solo si/cuando aparezca esa necesidad, no ahora.

**`search_path` fijo (obligatorio en toda función `SECURITY DEFINER`)**: la definición debe incluir `SET search_path = public, pg_temp` en la propia declaración de la función (no confiar en el `search_path` de sesión del invocador). Sin esto, un `SECURITY DEFINER` es vulnerable a que alguien con permiso de crear objetos en un esquema anterior en el `search_path` del invocador "secuestre" una referencia de tabla/función no cualificada dentro del cuerpo de la función. Todas las referencias a tablas dentro de `fn_create_expense` deben ir además cualificadas (`public.expenses`, `public.months`, `public.expense_monthly_usage`) como defensa adicional, no solo confiar en el `search_path` fijado.

**Cierre del permiso de ejecución — `anon` no debe poder ni intentarlo (corrección obligatoria)**: por defecto, Postgres concede `EXECUTE` sobre una función recién creada a `PUBLIC` (lo que incluye a `anon`). Esto debe revocarse explícitamente y conceder `EXECUTE` únicamente a `authenticated`:
```sql
-- Ilustrativo
REVOKE EXECUTE ON FUNCTION public.fn_create_expense(...) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_create_expense(...) TO authenticated;
```
Esto es una capa de defensa **anterior** a la comprobación interna de `auth.uid()`: si por cualquier motivo esa comprobación interna fallara, tuviera un error de lógica, o se ejecutara en un orden distinto al previsto en una futura modificación de la función, `anon` ni siquiera llegaría a invocar la función — quedaría rechazado a nivel de permisos de PostgreSQL antes de que se ejecute una sola línea del cuerpo. No se depende de que la validación interna sea perfecta; el propio motor de permisos es la primera barrera.

**Validación de propiedad y estado, replicando lo que ya protege la API actual** (no se puede perder al mover la inserción a esta función):
1. `SELECT status, user_id FROM public.months WHERE id = $month_id FOR UPDATE` — si no existe, o `user_id <> auth.uid()`, o `status = 'closed'` → abortar (mismo comportamiento que hoy en `src/app/api/expenses/route.ts:127-131` y `src/app/api/expenses/[id]/route.ts`, ahora reforzado dentro de la función en vez de solo en la capa Next.js).
2. Validación de tipos/rangos de `amount`/`category`/`date` — la función no debe asumir que el llamador (ruta Next.js o tool-executor) ya validó correctamente; repite las comprobaciones mínimas de integridad (equivalentes al `createExpenseSchema` de Zod actual) como `CHECK`/`RAISE` dentro de la función, para que no dependa solo de la capa de aplicación.

**Contador — solo aplica a `free_under_limit`**:
1. Resuelve `access_state` del usuario (mismo criterio que §3.A.1, portado a SQL o vía una función auxiliar `fn_resolve_access_state(auth.uid())`).
2. Si es `founder`, `plus_active`, `plus_canceled_pending` o `trialing` → inserta el gasto directamente, **sin tocar `expense_monthly_usage` en absoluto** (ni lectura ni escritura) — estos estados no consumen ni necesitan cupo.
3. Si es `free_readonly` → aborta con el error de límite alcanzado (defensa en profundidad: aunque la API ya no debería dejar llegar aquí a un usuario en este estado, la función no confía en eso).
4. Si es `free_under_limit`:
   ```sql
   -- Ilustrativo
   INSERT INTO expense_monthly_usage (user_id, period, count)
   VALUES (auth.uid(), $period, 1)
   ON CONFLICT (user_id, period) DO UPDATE
   SET count = expense_monthly_usage.count + 1
   WHERE expense_monthly_usage.count < 30
   RETURNING count;
   ```
   Si no devuelve fila → límite alcanzado, `RAISE EXCEPTION` con un código distinguible (ver más abajo), la transacción entera se deshace, no se inserta el gasto ni queda incrementado nada.
   Si devuelve fila → continúa e inserta el gasto en la misma transacción; si esa inserción falla después por cualquier motivo, la excepción resultante también deshace el incremento del contador ya hecho (mismo mecanismo que antes: una función completa es una unidad transaccional, una excepción no capturada revierte todos sus efectos).
5. **Concurrencia**: el `UPDATE` dentro del `ON CONFLICT` bloquea la fila `(user_id, period)` en cuanto la primera llamada la toca; una segunda llamada simultánea para el mismo usuario/periodo espera a que la primera confirme o aborte antes de leer/escribir esa fila — nunca pueden dos llamadas leer "29" a la vez e insertar el gasto 30 y 31.
6. **Borrar no libera cupo**: `DELETE` sobre `expenses` no toca `expense_monthly_usage` bajo ningún caso.
7. **IA y manual usan exactamente esta función** — no hay una segunda ruta de creación de gasto en el código; `src/lib/ai/tool-executor.ts` debe invocar el mismo RPC, con los mismos parámetros (sin `user_id` explícito, resuelto igual por `auth.uid()` de la sesión del usuario en cuyo nombre actúa el asistente).

**Distinguir "límite alcanzado" de otros errores, sin filtrar datos ajenos**: la función usa un código de error propio y estable para el caso de límite (p. ej. `RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'monthly_limit_reached'`), que la capa de API mapea explícitamente a `409` con un mensaje de usuario claro. **Cualquier otra excepción** (mes no encontrado, mes de otro usuario, mes cerrado, validación fallida) se mapea a una respuesta genérica (`403`/`404`/`400` según corresponda) con un mensaje neutro — sin exponer si el `month_id` existe pero pertenece a otro usuario frente a si simplemente no existe (evita que un cliente malicioso pueda enumerar IDs ajenos observando diferencias en la respuesta).

#### 3.B.3 Captura de fundadores — dos capas: lock de tabla para la activación + advisory lock para el régimen posterior

**Por qué el diseño solo-advisory-lock de la revisión anterior era incompleto**: el `pg_advisory_xact_lock` solo funciona si **ambas partes** deciden cooperativamente pedirlo — es un mecanismo *convencional*, no impuesto por el motor sobre la operación real de escritura. El nuevo `handle_new_user` (con el `PERFORM pg_advisory_xact_lock(...)` añadido) lo respeta, pero **la versión anterior del trigger, ya desplegada en producción antes de este cambio, no lo conoce ni lo pide** — si en el instante exacto de desplegar la nueva versión hay una transacción todavía en curso ejecutando el trigger *viejo* (sin la llamada al lock), esa transacción inserta su fila con un `INSERT` normal, sin pasar por el lock advisory en absoluto, y el advisory lock no tiene forma de detectarla ni de esperarla — porque nunca la pidió. La captura, esperando solo ese lock, podría ejecutar su `UPDATE` sin saber que esa fila legada todavía no existe, perdiéndola.

**Corrección**: la activación de fundadores (ejecución única, no el régimen posterior) no se apoya en el advisory lock para su propia corrección — usa un **bloqueo de tabla real**, que el motor impone sobre *cualquier* `INSERT`/`UPDATE` sobre `profiles`, sea cual sea el código que lo emita (trigger viejo, trigger nuevo, cualquier cosa), precisamente porque no depende de que ese código coopere ni sepa nada del lock.

**Procedimiento de activación, una única transacción, 6 pasos tal como los pediste:**

```sql
-- Ilustrativo, ejecución única durante la activación
BEGIN;

-- 1. Bloqueo breve de escritura sobre profiles: SHARE ROW EXCLUSIVE conflictúa con el
--    modo ROW EXCLUSIVE que Postgres adquiere automáticamente en TODO INSERT/UPDATE/DELETE
--    (lo pida el trigger viejo, el nuevo, o cualquier otro código) -- pero NO conflictúa con
--    ACCESS SHARE (SELECT), así que las lecturas de profiles siguen funcionando con
--    normalidad durante este bloqueo breve. No hace falta parar la app ni poner
--    ningún modo mantenimiento manual: cualquier INSERT/UPDATE que llegue mientras este
--    lock está activo simplemente queda encolado por el propio Postgres hasta el COMMIT.
LOCK TABLE public.profiles IN SHARE ROW EXCLUSIVE MODE;

-- 2. Esta misma sentencia LOCK TABLE es la que "espera a cualquier escritura previa en
--    curso": si ya existe una transacción con una fila de profiles a medio insertar
--    (sosteniendo ROW EXCLUSIVE, sea el trigger viejo o el nuevo), nuestro LOCK TABLE
--    no se concede hasta que esa transacción haga COMMIT o ROLLBACK. La espera la
--    gestiona el motor, no un temporizador ni una decisión nuestra de cuánto aguardar.

-- 3. Con el lock ya concedido (garantía de que no queda ninguna escritura de profiles
--    en vuelo), se fija el corte -- SOLO SI NO EXISTE YA. Si la tabla singleton ya
--    tiene su fila (de una activación anterior que hizo COMMIT), este INSERT no hace
--    nada (ON CONFLICT DO NOTHING) y el cutoff_at existente se conserva intacto --
--    nunca se sustituye por uno nuevo:
INSERT INTO public.founder_cutoff (id, cutoff_at, set_at, set_by)
VALUES (true, now(), now(), 'activación manual, ver registro de despliegue')
ON CONFLICT (id) DO NOTHING;

-- Se lee siempre la única fila posible (sea la recién insertada o la ya existente
-- de una ejecución anterior) -- no hay ORDER BY porque no puede haber más de una:
DECLARE v_cutoff timestamptz;
SELECT cutoff_at INTO v_cutoff FROM public.founder_cutoff WHERE id = true;

-- 4. Captura de todos los perfiles con created_at anterior al corte (siempre el
--    mismo v_cutoff, se ejecute la primera vez o se repita la operación):
UPDATE public.profiles
SET is_founder = true, founder_captured_at = now()
WHERE created_at < v_cutoff
  AND founder_captured_at IS NULL;

-- 5. Verificación, dentro de la misma transacción, de que no queda ningún perfil
--    pre-corte sin capturar -- si la hay, aborta la activación entera (ROLLBACK
--    automático al lanzar la excepción) en vez de confirmar un estado a medias:
DO $$
DECLARE pending_count integer;
BEGIN
  SELECT count(*) INTO pending_count
  FROM public.profiles
  WHERE created_at < v_cutoff
    AND founder_captured_at IS NULL;
  IF pending_count > 0 THEN
    RAISE EXCEPTION 'Captura de fundadores incompleta: % perfiles pendientes', pending_count;
  END IF;
END $$;

-- 6. Solo si la verificación no lanzó excepción, se confirma -- esto libera el
--    SHARE ROW EXCLUSIVE automáticamente, y cualquier INSERT/UPDATE que estuviera
--    encolado desde el paso 1 prosigue con normalidad a partir de aquí.
COMMIT;
```
*(Nota: el `DECLARE v_cutoff` y su `SELECT ... INTO` son pseudocódigo ilustrativo — en la implementación real, todo este procedimiento se escribiría como un único bloque `DO $$ ... $$` o una función PL/pgSQL, ya que mezclar una variable procedural con sentencias SQL sueltas no es sintaxis válida de `psql` tal cual está escrito arriba. La estructura lógica de los 6 pasos es la que importa en esta fase de diseño, no la sintaxis exacta del script, que se pulirá al implementar.)*

**Comportamiento ante reejecución del procedimiento completo (corrección obligatoria, explícito):**

- **Si una activación anterior hizo `COMMIT`**: `founder_cutoff` ya tiene su única fila; el `INSERT ... ON CONFLICT (id) DO NOTHING` no inserta nada nuevo, y el `SELECT cutoff_at ... WHERE id = true` devuelve exactamente el mismo `v_cutoff` que se usó la primera vez. El `UPDATE` del paso 4 solo afecta a filas con `founder_captured_at IS NULL` — y como todos los perfiles elegibles (`created_at < v_cutoff`) ya quedaron marcados en la ejecución anterior, este `UPDATE` afecta **cero filas**. La verificación del paso 5 sigue dando `0` pendientes (trivialmente, porque no había ninguno que capturar). **Resultado: repetir la operación no puede ampliar el grupo de fundadores bajo ninguna circunstancia** — ni aunque se ejecute cien veces, ni aunque hayan pasado meses y se hayan registrado miles de usuarios nuevos desde entonces (esos usuarios nuevos tienen `created_at > v_cutoff`, nunca entran en el `WHERE`).
- **Si la transacción anterior hizo `ROLLBACK` completo** (p. ej. la verificación del paso 5 lanzó la excepción, o cualquier fallo intermedio): al ser todo — el `LOCK TABLE`, el `INSERT` en `founder_cutoff`, el `UPDATE` de captura y la verificación — una única transacción, un `ROLLBACK` deshace absolutamente todo, incluido el `INSERT` en `founder_cutoff`. La tabla queda vacía, exactamente como si la activación nunca se hubiera intentado. **No quedan ni un corte fijado a medias ni fundadores parciales** — la siguiente ejecución parte de cero de forma segura, con un `cutoff_at` nuevo (el `now()` de ese nuevo intento), sin ningún residuo del intento fallido.

**Las dos capas, explícitas y con roles distintos (no son redundantes, son complementarias):**

- **El lock de tabla (`SHARE ROW EXCLUSIVE`), solo en este procedimiento de activación**: cubre exactamente el hueco que el advisory lock no puede cubrir por sí solo — **transacciones heredadas** que arrancaron con el trigger *antiguo* (sin ninguna noción del lock advisory) y que podrían seguir insertando en el instante de la activación. Es un mecanismo no cooperativo, impuesto por el motor sobre el modo de acceso real a la tabla, así que protege sin importar qué código esté escribiendo.
- **El advisory lock (`pg_advisory_xact_lock`) en el `handle_new_user` nuevo**: protege el **régimen posterior a la activación** — coordinación ligera entre altas nuevas (que ya corren con el trigger actualizado) y cualquier futura re-ejecución de una reconciliación o consulta de mantenimiento que también lo pida deliberadamente. Es barato (no bloquea el resto de la tabla, solo compite con quien pida exactamente esa misma clave) y sigue siendo útil como defensa en profundidad una vez que todo el código en producción ya conoce la convención — pero **no es el mecanismo que garantiza la corrección de la activación en sí**, que recae enteramente en el `LOCK TABLE` de este procedimiento.

**Usuarios antes/después del corte, con las dos capas ya explicadas:**
- **Antes del corte**: capturados exclusivamente por el `UPDATE` del paso 4, dentro de una transacción que ya tiene la garantía del `LOCK TABLE` de que ninguna escritura anterior (vieja o nueva) sigue pendiente — cubre tanto al trigger heredado como a cualquier inserción hecha ya con el trigger nuevo.
- **Después del corte**: cualquier `INSERT` que estuviera encolado esperando el `LOCK TABLE` se ejecuta tras el `COMMIT` del paso 6, con `created_at` necesariamente posterior a `cutoff_at` — el trigger nuevo, con su advisory lock, sigue funcionando con normalidad a partir de ahí para el régimen ordinario (no vuelve a competir con la activación, que ya terminó).

#### 3.B.3 bis — Legado `tier`/`manual_override` (corrección #4)

- **Todos los perfiles existentes entran en la captura de fundadores**, sin excepción y sin distinción por su `tier` o `manual_override` actual — el criterio de captura es únicamente `created_at < cutoff_at`, no el valor de esas columnas. Esto incluye a las 3 filas con `manual_override=true` (VIP concedido manualmente en el pasado) y a las 7 filas con `tier='pro'`: todas son perfiles existentes hoy, todas quedan `is_founder=true` igual que el resto.
- **Tras activar `resolveAccessState`/`fn_resolve_access_state`**, `tier` y `manual_override` se conservan en la tabla (no se borran, no se migran, no se transforman) pero **dejan de leerse en ningún punto de la resolución de acceso, sin excepción** — el nuevo resolvedor solo mira `is_founder`, `plus_access_until` y `trial_ends_at` (§3.A.1). Son datos exclusivamente históricos, visibles para auditoría/soporte si hace falta consultarlos manualmente, pero **no conceden ni condicionan ningún permiso** desde el momento en que se despliega 3.B. No queda ninguna redefinición de su uso pendiente de decidir — su papel es únicamente el de registro histórico.
- **No hace falta decidir un destino especial para esas filas antes de 3.B** — la captura de fundadores ya las cubre a todas por igual, y el resolvedor nuevo las ignora por igual. Cualquier limpieza futura de esas dos columnas (renombrar, documentar su uso legado, o retirarlas del todo) es una decisión de mantenimiento posterior, no un bloqueante de esta tarea, y no cambia nada de lo anterior mientras no se ejecute.

#### 3.B.4 Cierre de permisos de `profiles` — precondición, no hecho resuelto (corrección #6)

Lo que en la versión anterior se presentaba como un paso de la migración se reformula como **condición previa obligatoria, con verificación explícita, antes de escribir ningún `REVOKE`/`GRANT`/política nueva**:

- **Precondición 1**: verificar mediante lectura (requiere tu autorización puntual de nuevo, no asumida aquí) si existe algún trigger `BEFORE UPDATE`/`AFTER UPDATE` sobre `public.profiles`, y su definición completa si existe.
- **Precondición 2**: volver a listar `pg_policies` sobre `profiles` sin el filtro que usé en 3.0 (confirmar que no hay políticas `RESTRICTIVE` adicionales que no se vieron, y confirmar el listado completo de políticas, no solo las dos que aparecieron).
- **Precondición 3**: confirmar de nuevo los `column_privileges` en el momento de aplicar (podrían haber cambiado desde el 2026-09-16).
- **Precondición 4 (nueva)**: confirmar los `column_privileges`/`pg_policies` reales de `public.expenses` — no verificados en 3.0 (solo se auditó `profiles`). Necesario antes de poder `REVOKE INSERT` con seguridad (§3.B.2, cierre del INSERT directo).
- **Solo si** las tres precondiciones se verifican y no revelan un trigger o política que dependa de que `authenticated` pueda escribir en `profiles`, se procede a diseñar el `REVOKE UPDATE ON profiles FROM authenticated, anon` + política `RESTRICTIVE` como en la propuesta anterior. Hasta entonces, esto queda como **diseño condicional**, no como parte fija de la migración.

#### 3.B.5 Validación — sin asumir Docker/Supabase local (corrección #5)

Verificado en esta sesión: el repositorio **no tiene** `supabase/config.toml` ni entorno de desarrollo local de Supabase configurado (`supabase/` solo contiene `migrations/`, sin `supabase init` aplicado). No se asume por tanto que exista un entorno local para aplicar y probar la migración con `supabase start`.

Validación propuesta en su lugar:
1. **Validación estática**: revisión manual línea por línea del SQL (DDL, `REVOKE`/`GRANT`, políticas RLS, funciones `SECURITY DEFINER`) contra el esquema real ya volcado en 3.0, más un linter de SQL si el proyecto lo incorpora (no confirmado que exista hoy). Comprobación de que cada `CREATE TABLE`/`ALTER TABLE` no colisiona con nombres ya existentes (ya verificado en 3.0 que no hay tablas `subscriptions`, `founder_cutoff`, `expense_monthly_usage` ni `stripe_webhook_events` hoy).
2. **Si en el futuro se decide instalar el entorno local** (`supabase init` + Docker) — sería un prerequisito de infraestructura a decidir y aprobar aparte, no algo que esta tarea de planificación deba asumir como ya disponible.
3. **Aplicación real**: siempre en un entorno controlado por ti, en un momento decidido por ti, nunca como parte de un "commit/push" automático — igual que la lectura puntual de 3.0, cada aplicación de esquema contra Supabase remoto requiere tu autorización explícita en el momento.

#### 3.B.6 Secuencia de despliegue (actualizada — ya no depende de márgenes de tiempo)

1. Esquema nuevo (columnas + tablas: `founder_cutoff`, `expense_monthly_usage`, `stripe_webhook_events`, `subscriptions`) desplegado con la app **todavía en comportamiento actual** — sin cambiar `handle_new_user` todavía (sigue dando 14 días y sin lock), sin activar límite, sin checkout.
2. Reemplazar `handle_new_user` por la versión con lock advisory **y** trial de 30 días con `trial_started_at`/`trial_ends_at` inmutables. No es una precondición estricta del paso 3 (el `LOCK TABLE` del procedimiento de activación cubre tanto al trigger viejo como al nuevo por igual), pero conviene desplegarlo antes para que, al terminar la activación, el régimen ordinario ya quede con el advisory lock en vigor desde el primer momento.
3. Ejecutar el **procedimiento de activación completo** de §3.B.3 (una única transacción: `LOCK TABLE`, fijar `cutoff_at`, capturar, verificar, `COMMIT`) — no requiere parar la app ni coordinarse manualmente con nada más; el propio `LOCK TABLE` espera lo que haga falta.
4. Activar `fn_create_expense` como único punto de entrada (manual + IA) y el enforcement del límite de 30.
5. Cierre de permisos de `profiles`/`expenses`, **solo si** las precondiciones de §3.B.4 se verifican sin hallazgos bloqueantes.
6. Stripe/checkout/webhooks (3.C) — después de que 1-5 estén verificados, nunca antes.

#### 3.B.8 Nota de interfaz futura para 3.E (corrección #5)

`subscriptions` no tendrá **ningún** acceso directo de cliente (ni `SELECT`), confirmado en §3.B.1.B. Cuando se aborde 3.E (interfaz de estado/upgrade/cancelación), esa tarea deberá exponer un **endpoint de servidor de solo lectura** (p. ej. `GET /api/account/plan-summary`), ejecutado con `service_role`, que lea `subscriptions`/`profiles` internamente y devuelva **únicamente** el resumen mínimo necesario para la UI:
- Estado visible simplificado (equivalente a `access_state`, no el `status` crudo de Stripe).
- Fecha de renovación o de fin de acceso (`plus_access_until`), y si está marcada para cancelar (`cancel_at_period_end`) o no.
- Plan (`plan_interval`), sin exponer `stripe_customer_id`/`stripe_subscription_id` al cliente salvo que 3.E justifique una necesidad concreta (p. ej. redirigir al portal de Stripe, que puede hacerse desde servidor sin exponer el ID al navegador).

Esto es solo una nota de alcance para no perder de vista esta dependencia al diseñar 3.E — no se detalla más aquí porque corresponde a esa tarea, no a 3.B.

#### 3.B.9 Objetivo, archivos, riesgos, pruebas, criterio de commit

- **Objetivo**: dejar un diseño de migración completo, revisado, con la captura de fundadores demostrablemente correcta (no dependiente de temporización), protección de orden en webhooks, `fn_create_expense` endurecida, y sus precondiciones de verificación explícitas — sin crear ni aplicar nada todavía.
- **Archivos/sistemas**: nueva migración en `supabase/migrations/`; `src/lib/auth/access-control.ts`; `src/app/api/expenses/route.ts` y `src/lib/ai/tool-executor.ts` (ambos deben converger en `fn_create_expense`); reemplazo de `handle_new_user` (lock advisory + trial 30 días); handler de webhook Stripe (orden por `event.created`, idempotencia por `event_id`); futuro endpoint de resumen de plan (§3.B.8, implementado en 3.E).
- **Riesgos**: (a) el `LOCK TABLE ... SHARE ROW EXCLUSIVE` de la activación (§3.B.3) bloquea brevemente todo `INSERT`/`UPDATE` sobre `profiles` mientras dura esa transacción — a volumen de registro bajo es un instante imperceptible y nada se pierde (las altas concurrentes solo quedan encoladas hasta el `COMMIT`), pero conviene no ejecutar la activación en un pico real de tráfico de registro; (b) migrar solo dos de los tres canales de creación de gastos a `fn_create_expense` y olvidar el tercero (el asistente legado `tool-executor.ts` es el más fácil de pasar por alto, al no ser la ruta "principal" hoy) deja el límite eludible; (c) cerrar permisos sin verificar las precondiciones de §3.B.4 (incluida la nueva #4 sobre `expenses`) podría romper un trigger o flujo no detectado, o revocar un `INSERT` que en realidad no existía y no cambiar nada; (d) un `search_path` mal fijado en `fn_create_expense`/`handle_new_user`, o olvidar el `REVOKE EXECUTE FROM PUBLIC` de `fn_create_expense`, reabre vectores clásicos de `SECURITY DEFINER`; (e) mantener la transacción SQL abierta durante la llamada a `stripe.subscriptions.retrieve()` (§3.B.1.B) retiene una conexión de base de datos durante el round-trip HTTP — aceptable al volumen esperado de webhooks, pero requiere el timeout explícito ya señalado para no dejar conexiones colgadas si Stripe tarda; (f) la implementación de cancelación en 3.C debe usar `cancel_at_period_end: true` y nunca `subscriptions.cancel()` inmediato — un desliz aquí rompe la garantía de "Plus hasta fin de periodo".
- **Pruebas necesarias**: validación estática (§3.B.5); test de concurrencia simulando N llamadas paralelas a `fn_create_expense` para el mismo usuario/periodo; test de que un gasto que falla su validación no deja el contador incrementado; test de concurrencia real entre un `INSERT` de `handle_new_user` y la captura de fundadores compitiendo por el lock (verificando que ambos casos A y B de §3.B.3 dan el resultado correcto); test de que, tras revocar `INSERT` en `expenses`, un `supabase.from('expenses').insert(...)` directo desde un cliente autenticado de prueba falla, mientras que las tres rutas migradas (`POST /api/expenses`, `/api/ai/assistant`, `/api/ai/agent-v2` y `/stream`) siguen creando gastos correctamente vía RPC; test de que `fn_create_expense` rechaza un `month_id` de otro usuario sin distinguir en la respuesta si existe o no.
- **Criterio de aprobación de este documento**: pendiente de tu confirmación — no se avanza a 3.C hasta que apruebes esta revisión de 3.B.

### 3.C — Stripe Checkout y webhooks idempotentes
- **Objetivo**: reactivar `src/app/api/stripe/checkout/route.ts` (Checkout Session mensual/anual) y `src/app/api/webhooks/stripe/route.ts` (idempotente vía `stripe_event_id` almacenado, verificación de firma).
- **Archivos/sistemas**: `src/lib/stripe/server.ts` (reinstanciar cliente), las tres rutas Stripe existentes, nueva tabla `stripe_events` (idempotencia) — a confirmar si se prefiere una tabla dedicada o un campo único en `profiles`.
- **Riesgos**: es el punto de mayor riesgo de negocio — un webhook duplicado o mal verificado puede otorgar/quitar acceso indebidamente (ver §5 para el diseño concreto de idempotencia).
- **Pruebas**: Stripe CLI en modo test **no usado en esta auditoría por instrucción explícita** — pero será obligatorio en la tarea real (`stripe trigger`, webhooks de prueba, casos: pago inicial, renovación, fallo de pago, cancelación, reembolso manual).
- **Criterio de commit/push**: firma de webhook verificada, tests de idempotencia (mismo evento procesado 2 veces = mismo resultado) en verde, ningún cambio de estado sin persistir el `stripe_event_id` procesado.

### 3.D — Prueba de 30 días, límite de 30 gastos y modo consulta
- **Objetivo**: enforcement server-side en `POST /api/expenses` (`src/app/api/expenses/route.ts:99`) del límite de 30 gastos/mes natural para plan gratuito post-trial, y bloqueo (409) de escritura para modo consulta.
- **Archivos/sistemas**: `src/app/api/expenses/route.ts`, `src/app/api/expenses/[id]/route.ts`, `src/app/api/months/[id]/route.ts` (posible reutilización del patrón 409 ya usado para meses cerrados), `src/lib/auth/access-control.ts`.
- **Riesgos**: condición de carrera en conteo (dos requests simultáneas superan el límite) — ver §5.4 para mitigación.
- **Pruebas**: test de integración creando 31 gastos en el mismo mes natural para un perfil `free`, verificando el 409 en el nº 31 y reset el día 1 del mes siguiente.
- **Criterio de commit/push**: tests de límite y de reset mensual en verde; verificación manual de que un usuario `founder`/`trialing`/`pro` nunca es bloqueado (matriz de 3.A).

### 3.E — Interfaz de estado, upgrade, cancelación y exportación Plus
- **Objetivo**: UI que muestre estado actual (trial restante, gastos usados/30, botón upgrade/cancelar), y gating de `ReportButton`/`ReportDialog`/`ReportPDF` a solo Plus/founder.
- **Archivos/sistemas**: `src/app/[locale]/app/subscription/page.tsx` + `SubscriptionClient.tsx` (reactivar), `src/components/saas/SubscriptionGuard.tsx` (dejar de ser passthrough), `src/components/reports/ReportButton.tsx`.
- **Riesgos**: gating solo en cliente es inútil si el servidor no valida — el `ReportDialog` hoy consulta Supabase directo desde el browser, así que el gating real debe apoyarse en RLS o en un endpoint servidor intermedio, no solo en ocultar el botón.
- **Pruebas**: pruebas manuales de UI en navegador (visual) + test de que un usuario `free_readonly` no puede generar el PDF/CSV vía llamada directa si se decide mover la exportación a un endpoint servidor.
- **Criterio de commit/push**: verificación en navegador real de los 3 estados principales (trial, free_readonly, plus) sin regresiones visuales.

### 3.F — Correos transaccionales
- **Objetivo**: aviso in-app + email al terminar la prueba (y opcionalmente confirmación de pago/cancelación). No existe infraestructura de email hoy — requiere elegir proveedor (Resend es la integración nativa del Vercel Marketplace, a confirmar con el propietario cuando toque implementar, fuera del alcance de esta auditoría).
- **Archivos/sistemas**: nuevo `src/lib/email/` (o similar), plantilla en español, trigger (cron/Supabase Edge Function o webhook de Stripe/expiración de trial).
- **Riesgos**: enviar emails duplicados o a usuarios equivocados si el trigger no es idempotente.
- **Pruebas**: envío a inbox de prueba, verificación de idempotencia del trigger.
- **Criterio de commit/push**: al menos un email de extremo a extremo verificado en modo test/sandbox del proveedor, sin credenciales reales en el repo.

### 3.G — Analytics de monetización y pruebas finales
- **Objetivo**: eventos GA4 mínimos para medir fin de prueba, decisión de pago y alta de suscriptor, sin duplicar los 13 eventos ya existentes (todos de landing/marketing).
- **Archivos/sistemas**: `src/lib/analytics.ts` (ampliar `EventName`), puntos de disparo en el flujo de checkout/expiración.
- **Riesgos**: mezclar eventos de producto con los de marketing en el mismo dataset sin distinguir por propiedad puede ensuciar los embudos existentes.
- **Pruebas**: verificación en GA4 DebugView (no se hizo en esta auditoría), QA manual de cada evento disparándose una sola vez por acción real.
- **Criterio de commit/push**: eventos verificados en DebugView, nombres no colisionan con los 13 existentes.

---

## 4. Riesgos y orden recomendado

1. **3.A → 3.B → 3.D → 3.C → 3.E → 3.F → 3.G.** Razón: el contrato de acceso y el esquema deben existir antes de tocar límites o Stripe; el límite de 30 gastos (3.D) es independiente de Stripe y de bajo riesgo, conviene publicarlo antes de reactivar cobros reales; Stripe (3.C) es el paso de mayor riesgo de negocio y debe ir después de tener el contrato de estados sólido y probado; UI (3.E), emails (3.F) y analytics (3.G) son las capas finales, cada una desplegable de forma independiente y de bajo riesgo si las anteriores están bien probadas.
2. **Mayor riesgo global**: aplicar una migración sobre `profiles` sin haber confirmado su esquema real primero (§2.1). Recomendación: antes de 3.B, hacer una tarea "3.0 — Volcar esquema real de profiles" puramente de lectura (Supabase MCP/dashboard), sin escribir nada.
3. Segundo mayor riesgo: que el gating de exportación/acceso solo viva en cliente (React) sin respaldo server-side, dado que `ReportDialog` ya consulta Supabase directo desde el browser — cualquier gating de Plus tiene que reforzarse con RLS o con mover la consulta a un endpoint servidor.

---

## 5. Decisiones técnicas — propuesta de diseño (para validar con el propietario, no implementado)

### 5.1 Congelar quién es fundador de forma fiable
**Superado por el diseño detallado en §3.A.3** (captura transaccional dentro de la propia migración de activación, sin fecha manual, con `founder_captured_at` como evidencia del corte real y ruta admin separada para excepciones). Se mantiene aquí solo el principio general: el chequeo de acceso debe mirar `is_founder` primero, antes que `tier`/`subscription_status`, y cortocircuitar siempre a "acceso completo" (ver §3.A.1).

### 5.2 Evitar que la prueba se reinicie al cancelar o crear otra suscripción
El trial debe anclarse a un campo inmutable en `profiles`, p.ej. `trial_started_at` (asignado una única vez en `handle_new_user`, nunca sobrescrito). El estado derivado `trialing` se calcula siempre como `now() < trial_started_at + 30 días`, nunca se "resetea" por acciones del usuario (cancelar, volver a suscribirse). Cualquier código que toque `profiles` en checkout/cancelación debe tener explícitamente prohibido escribir `trial_started_at`/`trial_ends_at` tras la primera asignación (a nivel de código, y opcionalmente reforzado con un trigger `BEFORE UPDATE` que rechace el cambio si ya está poblado).

### 5.3 Estado exacto que permite gastar, consultar, exportar o gestionar pagos
**Superado por §3.A.1/§3.A.2** (revisión 2, 6 estados, sin `plus_manual`, exportación e IA corregidas, pago normalizado vía `plus_access_until`). Esta sección se deja solo como referencia histórica de la primera versión; la matriz vigente es la de §3.A.2.

### 5.4 Impedir que el límite de 30 gastos se eluda desde API
**Superado por §3.A.4** (diseño cerrado): tabla contadora `expense_monthly_usage` con clave única `(user_id, period)`, incrementada atómicamente con `INSERT ... ON CONFLICT DO UPDATE ... WHERE count < 30`, período calculado en servidor en Europe/Madrid (nunca `expenses.date` ni `payment_cycles`), sin decrementar al borrar. Enforcement solo en servidor, dentro de la misma transacción que el `INSERT` en `expenses`.

### 5.5 Garantizar que Stripe/webhooks no otorguen o retiren acceso por error
- Verificar siempre la firma del webhook (`stripe.webhooks.constructEvent` con el secret) antes de procesar.
- Persistir `stripe_event_id` procesados (tabla o campo único) y descartar duplicados — idempotencia real, no solo confiar en que Stripe no reenvíe.
- El webhook debe ser la **única** vía que escribe `plus_access_until` (ver §3.A.5) — el Checkout inicial solo crea la sesión, no otorga acceso hasta que el webhook confirma el pago real.
- Nunca degradar por un evento que no se entiende: ante un `event.type` no manejado explícitamente, no tocar el perfil (fail-safe a "no hacer nada" en vez de "revocar acceso"). Una cancelación no borra `plus_access_until`, solo marca un flag informativo (§3.A.5).
- `is_founder`/`founder_captured_at` nunca deben ser tocados por ningún código de Stripe — ni siquiera tienen `GRANT` de escritura para ese rol (ver §3.A.6) — el chequeo de acceso corta antes de mirar `plus_access_until` si `is_founder = true` (ver §3.A.1).

### 5.6 Eventos GA4 estrictamente necesarios (sin duplicar los 13 existentes)
Los 13 eventos actuales son de landing/marketing (calculadoras, CTAs). Para monetización, mínimo necesario y no solapado:
- `trial_completed` (al llegar al día 30 sin plan activo)
- `paywall_hit` (usuario llega a `free_readonly` por límite de gastos o trial vencido)
- `checkout_started` (clic en upgrade, con propiedad `plan: monthly|annual`)
- `subscription_activated` (webhook confirma pago — disparado desde servidor, no cliente, para evitar falsos positivos si el usuario cierra la pestaña)
- `subscription_canceled` (cancelación solicitada)

Ninguno de estos nombres colisiona con los 13 existentes.

---

## 5 bis. Tarea 3.0 — Esquema real de `profiles` (verificado contra Supabase remoto, solo lectura)

> Autorizado explícitamente por el propietario el 2026-09-16 para este paso puntual de solo lectura (`list_tables`, `execute_sql` con `SELECT` únicamente). No se ejecutó ningún DDL/DML. **Este acceso fue puntual y no se amplía**: cualquier consulta remota adicional (a Supabase o a cualquier otro servicio externo) requiere pedir permiso de nuevo antes de ejecutarla — no se asume autorización continuada.

Proyecto Supabase: `kakebo-ahorro` (`fajqfjouqauyfiajfonf`, eu-central-1).

### Esquema real de `public.profiles`

```sql
-- Reconstruido desde information_schema, no es una migración a aplicar
CREATE TABLE public.profiles (
    id                      uuid PRIMARY KEY REFERENCES auth.users(id),
    tier                    subscription_tier DEFAULT 'free',  -- ENUM: 'free' | 'pro'
    trial_ends_at           timestamptz,
    stripe_customer_id      text,
    stripe_subscription_id  text,
    manual_override         boolean DEFAULT false,
    created_at              timestamptz DEFAULT now(),
    updated_at              timestamptz DEFAULT now()
);
```

- **No existe `is_founder`, `is_admin`, `subscription_status` ni `expenses_reset_at`** — confirma el gap ya señalado en la auditoría estática.
- **RLS activo**, dos políticas:
  - `Users can view their own profile` — SELECT, `auth.uid() = id`.
  - `Users can update their own profile` — UPDATE, `auth.uid() = id`, **sin `WITH CHECK`**.
- **118 filas**: 109 `free`/sin override, 2 `free` con `manual_override=true` (VIP manual ya concedidos), 6 `pro` automáticos, 1 `pro` con override. Altas entre 2026-02-06 y 2026-09-15.

### ⚠️ Posible vector de escritura sin restringir en `profiles` (evidencia parcial, pendiente de cerrar — no declarado bloqueante)

Evidencia exacta obtenida (2026-09-16, lectura puntual autorizada):

- **Política RLS de UPDATE** (`pg_policies`, `schemaname='public', tablename='profiles'`):
  ```
  policyname: "Users can update their own profile"
  permissive: PERMISSIVE
  roles: {public}
  cmd: UPDATE
  qual: (auth.uid() = id)
  with_check: null
  ```
  En Postgres, cuando `WITH CHECK` es `null` en una política `UPDATE`, el motor reutiliza `USING` (`qual`) como comprobación post-actualización. Es decir, la ausencia de `with_check` explícito **no añade ni quita restricción por sí sola** — sigue exigiéndose `auth.uid() = id` tanto antes como después del cambio, pero esa condición no dice nada sobre *qué columnas o valores* se pueden cambiar dentro de la propia fila.
- **Privilegios por columna** (`information_schema.column_privileges`, `grantee='authenticated'`): el rol `authenticated` tiene `GRANT UPDATE` sobre **todas** las columnas de `profiles`, incluidas `tier` y `manual_override` (no hay `REVOKE` ni grant column-level restringido a un subconjunto "seguro").
- **Lo que NO se comprobó** (por no ampliar el alcance de la consulta remota sin pedir permiso): si existe algún **trigger `BEFORE UPDATE` sobre `public.profiles`** que valide o bloquee cambios a `tier`/`manual_override` fuera de un contexto admin, y si existen otras políticas RLS adicionales (p. ej. restrictivas, `RESTRICTIVE`) que no aparecieron en la única query lanzada sobre `pg_policies` filtrada a esa tabla. Solo se verificaron triggers sobre `auth.users` (`on_auth_user_created`, `trigger_create_alert_settings`), no sobre `public.profiles`.

**Conclusión honesta**: con la política RLS `UPDATE` limitada a `auth.uid() = id` y sin restricción de columnas a nivel de grant, **es plausible** que un usuario autenticado pueda modificar `tier`/`manual_override` de su propio perfil vía una llamada directa a la API REST de Supabase — pero no está confirmado al 100% porque no se ha descartado un trigger de validación en `profiles`. Este es exactamente el tipo de comprobación que corresponde hacer al implementar 3.A/3.B (con una prueba funcional real: un `UPDATE` de prueba con un usuario de test, o revisando `pg_trigger` sobre `public.profiles`), no algo que deba darse por cerrado en esta auditoría.

**Implicación para el plan**: independientemente del resultado de esa verificación, el diseño correcto en 3.A/3.B es que `tier`, `manual_override`, `stripe_customer_id`, `stripe_subscription_id` y el futuro `is_founder` **nunca dependan de la confianza en la política RLS actual** — deben quedar fuera del `GRANT UPDATE` de `authenticated` y ser editables solo por `service_role` (rutas servidor, ya hay precedente en `grant-vip/route.ts`) o funciones `SECURITY DEFINER` controladas (webhook, admin). Esto es una buena práctica de defensa en profundidad independientemente de si el vector actual es explotable o no.

### Trigger de alta (`handle_new_user`)

```sql
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, tier, trial_ends_at)
  VALUES (new.id, 'free', now() + interval '14 days');
  RETURN new;
END;
$$;
```

**Discrepancia con el nuevo spec de producto**: el trial actual es de **14 días**, no 30. Habrá que actualizar esta función en 3.B. También hay un segundo trigger `trigger_create_alert_settings` (crea `alert_settings` por defecto) sin relación con monetización.

### Otras tablas relevantes no mencionadas en la auditoría estática

- `public.payment_cycles` (0 filas) — soporta ciclos "calendar" o "payroll" (nómina a nómina). **Decidido por el propietario (2026-09-16): el límite gratuito de 30 gastos siempre usa mes natural (día 1 a fin de mes), independientemente de si el usuario tiene configurado un ciclo de nómina en `payment_cycles`.** El conteo del límite no debe leer ni depender de esta tabla.
- `public.alert_settings`, `kakebo_reflections`, `financial_scenarios`, `cycle_budgets`, `ai_pending_actions` — sin relación directa con monetización, no requieren cambios para Fase 3.
- No existe ninguna tabla `stripe_events` ni de idempotencia de webhooks — habrá que crearla en 3.B/3.C.

## 6. Confirmación

- No se ha escrito código de producto ni de test.
- No se ha creado ninguna migración SQL ni se ha modificado ninguna existente.
- No se ha hecho `git add`/`commit`/`push`.
- No se ha usado Vercel CLI/MCP ni Stripe CLI/API en ningún momento.
- Supabase remoto **sí se consultó**, pero únicamente en la tarea 3.0 (§5 bis), con autorización explícita del propietario, en modo estrictamente lectura (`list_tables`, `execute_sql` con `SELECT`). No se ejecutó ningún `INSERT`/`UPDATE`/`DELETE`/DDL contra Supabase. El resto de la auditoría (§1–§4) fue lectura estática de archivos locales.
- No se ha tocado ninguna página pública, ruta SEO, sitemap, robots, metadatos ni contenido.
- Este documento (`docs/planning/phase-3-monetizacion.md`) se ha creado localmente y **no ha sido publicado ni commiteado**.
