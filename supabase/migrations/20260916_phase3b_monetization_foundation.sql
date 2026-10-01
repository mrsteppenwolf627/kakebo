-- MIGRATION: Fase 3.B — Infraestructura de acceso, fundadores, prueba y límite gratuito
-- DATE: 2026-09-16
-- STATUS: PREPARADA, NO APLICADA. No ejecutar contra Supabase remoto sin autorización
--         explícita del propietario del proyecto.
--
-- Esta migración es idempotente (usa IF NOT EXISTS / CREATE OR REPLACE / ADD COLUMN
-- IF NOT EXISTS en todo lo posible) y, a diferencia de una revisión anterior, NO
-- contiene ningún `REVOKE` ni `DROP POLICY` sobre `profiles`/`expenses` -- solo
-- prepara esquema y funciones RPC, sin cambiar el comportamiento de acceso
-- existente. El endurecimiento de permisos (que sí cambia comportamiento en
-- producción y requiere preflight remoto) vive en un script manual aparte:
-- ver supabase/manual-ops/phase3b_permission_hardening.sql y la sección 9 más
-- abajo.
--
-- Referencia de diseño completa: docs/planning/fase-3-monetizacion.md §3.A, §3.B.
-- La activación real de fundadores (captura) NO está en esta migración — ver
-- supabase/manual-ops/founder_capture_activation.sql, que se ejecuta aparte, una
-- sola vez, el día real de activación de monetización.
--
-- Compatibilidad con "ciclos libres" (Fase 1, ver docs/planning/fase-1-ciclos-libres.md
-- y src/lib/months.ts): `expenses.month_id` referencia un CICLO (user_id, year, month)
-- que puede no coincidir con el mes natural de `expenses.date` — su etiqueta es solo
-- un nombre. fn_create_expense no reimplementa la resolución de ciclo (que ya hacen
-- POST /api/expenses, el asistente legado y create-transaction.ts antes de llamarla);
-- solo revalida, como defensa en profundidad, que el month_id recibido pertenece al
-- usuario y no está cerrado — igual que ya hace la capa de TypeScript.

-- =============================================================================
-- 1. `profiles` — columnas nuevas
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_founder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS founder_captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS plus_access_until timestamptz;

COMMENT ON COLUMN public.profiles.is_founder IS
  'Fase 3.B: acceso completo y permanente. Escrito EXCLUSIVAMENTE por el procedimiento de captura en supabase/manual-ops/founder_capture_activation.sql. Ningún otro código (app, webhook, admin) debe escribir esta columna.';
COMMENT ON COLUMN public.profiles.founder_captured_at IS
  'Fase 3.B: marca temporal de cuándo el corte automático capturó esta fila. NUNCA lo rellena una concesión manual — ver docs/planning §3.B.3 bis.';
COMMENT ON COLUMN public.profiles.trial_started_at IS
  'Fase 3.B: escrito una única vez por handle_new_user en el INSERT inicial. Inmutable después — ningún flujo de checkout/cancelación/reintento de pago puede reescribirlo.';
COMMENT ON COLUMN public.profiles.plus_access_until IS
  'Fase 3.B: derecho de acceso Plus normalizado. Copia derivada de subscriptions.current_period_end, escrita EXCLUSIVAMENTE por el handler de webhook de Stripe (Fase 3.C, no implementado todavía).';
COMMENT ON COLUMN public.profiles.tier IS
  'LEGADO (pre-Fase 3). Se conserva solo como dato histórico. Tras esta migración, no concede ni condiciona ningún permiso — ver fn_resolve_access_state.';
COMMENT ON COLUMN public.profiles.manual_override IS
  'LEGADO (pre-Fase 3). Se conserva solo como dato histórico. Tras esta migración, no concede ni condiciona ningún permiso — ver fn_resolve_access_state.';

-- =============================================================================
-- 2. `founder_cutoff` — tabla singleton inmutable
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.founder_cutoff (
  id        boolean PRIMARY KEY DEFAULT true,
  cutoff_at timestamptz NOT NULL,
  set_at    timestamptz NOT NULL DEFAULT now(),
  set_by    text,
  CONSTRAINT founder_cutoff_singleton CHECK (id)
);

COMMENT ON TABLE public.founder_cutoff IS
  'Fase 3.B: corte inmutable de activación de fundadores. Como máximo una fila (id boolean PRIMARY KEY + CHECK(id) fuerza el singleton). Server-only: sin ningún grant para anon/authenticated. Ver supabase/manual-ops/founder_capture_activation.sql.';
COMMENT ON COLUMN public.founder_cutoff.set_by IS
  'Anotación manual de contexto (quién/qué ejecutó la activación). No es una referencia verificada a auth.users -- no existe sistema de administración con identidad verificable todavía. Puramente informativo, puede quedar NULL.';

ALTER TABLE public.founder_cutoff ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.founder_cutoff FROM anon, authenticated;

-- Inmutabilidad reforzada a nivel de esquema: ni siquiera service_role puede
-- actualizar o borrar la fila una vez creada.
CREATE OR REPLACE FUNCTION public.reject_founder_cutoff_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'founder_cutoff es inmutable: no se permite UPDATE ni DELETE';
END;
$$;

DROP TRIGGER IF EXISTS founder_cutoff_immutable ON public.founder_cutoff;
CREATE TRIGGER founder_cutoff_immutable
  BEFORE UPDATE OR DELETE ON public.founder_cutoff
  FOR EACH ROW EXECUTE FUNCTION public.reject_founder_cutoff_mutation();

-- =============================================================================
-- 3. `subscriptions` — modelo privado de suscripción (fuente de verdad de Stripe)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id                 uuid NOT NULL REFERENCES auth.users(id),
  stripe_customer_id      text NOT NULL,
  stripe_subscription_id  text NOT NULL,
  status                  text NOT NULL,        -- valor crudo de Stripe, sin interpretar
  plan_interval           text NOT NULL,        -- 'monthly' | 'annual'
  current_period_end      timestamptz NOT NULL,
  cancel_at_period_end    boolean NOT NULL DEFAULT false,
  last_event_id           text,                 -- último Event.id de Stripe aplicado (auditoría)
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, stripe_subscription_id),
  -- Un stripe_subscription_id es único en todo Stripe -- nunca puede
  -- pertenecer a dos usuarios distintos. La PK compuesta (user_id, ...) no
  -- garantiza eso por sí sola; este UNIQUE sí lo hace.
  CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id)
);

-- Un usuario puede tener varias suscripciones a lo largo del tiempo (o, en
-- teoría, más de una vigente a la vez) -- este índice es el que usa
-- fn_recompute_plus_access_until() para recalcular el acceso agregando por
-- user_id sin escanear toda la tabla.
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);

COMMENT ON TABLE public.subscriptions IS
  'Fase 3.B (esquema preparado, sin uso hasta Fase 3.C): fuente de verdad de las suscripciones de Stripe de cada usuario (puede haber más de una fila por user_id a lo largo del tiempo). profiles.plus_access_until NUNCA se copia directamente de la fila que acaba de actualizar un webhook -- ver fn_recompute_plus_access_until() más abajo y docs/planning/fase-3-monetizacion.md. Sin acceso directo de cliente -- ver docs/planning §3.B.8 para el futuro endpoint de resumen de solo lectura.';
COMMENT ON COLUMN public.subscriptions.status IS
  'Valor crudo devuelto por Stripe (subscriptions.retrieve), sin interpretar. Nunca se usa para gatear acceso -- eso lo decide únicamente plus_access_until. Qué valores de status cuentan como "con derecho de acceso" queda como decisión explícita de la Fase 3.C -- fn_recompute_plus_access_until() usa hoy únicamente current_period_end > now() como criterio mínimo seguro (ver su definición).';
COMMENT ON COLUMN public.subscriptions.last_event_id IS
  'Referencia de auditoría: qué evento de webhook disparó la última comprobación de estado canónico. No se usa como criterio de orden -- ver docs/planning §3.B.1.B.';

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscriptions FROM anon, authenticated;

-- =============================================================================
-- 3 bis. `fn_recompute_plus_access_until` — recalcula el acceso agregando TODAS
--        las suscripciones locales del usuario, nunca copiando una sola fila
-- =============================================================================
--
-- Corrección obligatoria (2026-09-16): el diseño anterior de 3.C proponía que
-- el handler de webhook escribiera `profiles.plus_access_until` directamente
-- desde el `current_period_end` de la suscripción que acababa de procesar.
-- Eso es incorrecto si un usuario llega a tener más de una fila en
-- `subscriptions` (una suscripción antigua cancelada/expirada y otra nueva
-- vigente, por ejemplo) -- un webhook tardío de la suscripción antigua podría
-- sobrescribir un `plus_access_until` más alto ya concedido por la vigente.
--
-- Esta función es la única vía por la que 3.C debe actualizar el resumen de
-- acceso del perfil: siempre recalcula a partir de TODAS las filas de
-- `subscriptions` de ese usuario, tomando el `current_period_end` máximo
-- entre las que todavía otorgan acceso -- nunca copia ciegamente la fila que
-- acaba de tocar un evento concreto.
--
-- El flujo completo que deberá implementar 3.C (sin Stripe SDK ni llamadas
-- reales todavía -- esto es solo el diseño, no la implementación):
--   1. Validar la firma del webhook y registrar el event_id en
--      stripe_webhook_events para idempotencia (evento duplicado -> no-op).
--   2. Serializar por AMBAS claves antes de tocar nada: adquirir un advisory
--      lock determinista por stripe_subscription_id (para no procesar dos
--      veces la misma suscripción en paralelo) Y otro por user_id (para que
--      dos webhooks de DOS suscripciones distintas del MISMO usuario no
--      recalculen plus_access_until en paralelo y uno pise el resultado del
--      otro) -- p. ej. pg_advisory_xact_lock(hashtext('kakebo:sub:'||id)) y
--      pg_advisory_xact_lock(hashtext('kakebo:user_plus:'||user_id)), ambos
--      adquiridos antes de llamar a Stripe.
--   3. Recuperar el estado canónico de esa suscripción con
--      stripe.subscriptions.retrieve() (nunca fiarse del payload del evento).
--   4. UPSERT de esa fila en subscriptions con el estado canónico.
--   5. Llamar a fn_recompute_plus_access_until(user_id) -- NUNCA escribir
--      profiles.plus_access_until a mano en el handler.
--   6. COMMIT -- libera ambos locks.
--
-- Qué estados de Stripe cuentan exactamente como "con derecho de acceso"
-- (más allá del criterio mínimo current_period_end > now() que ya usa esta
-- función) queda como decisión explícita de la Fase 3.C, deliberadamente no
-- fijada aquí.

CREATE OR REPLACE FUNCTION public.fn_recompute_plus_access_until(p_user_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_until timestamptz;
BEGIN
  -- Máximo current_period_end entre TODAS las suscripciones del usuario que
  -- todavía no han terminado su periodo -- una suscripción cancelada
  -- (cancel_at_period_end=true) sigue contando mientras su periodo no haya
  -- terminado de verdad (ver docs/planning §3.B.1.B, "Plus hasta fin de
  -- periodo"). Una suscripción antigua ya expirada (current_period_end en
  -- el pasado) nunca puede reducir este máximo, porque queda excluida del
  -- WHERE -- así se cumple que un webhook tardío de una suscripción vieja
  -- jamás puede pisar el acceso concedido por otra vigente.
  SELECT max(current_period_end) INTO v_new_until
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND current_period_end > now();

  UPDATE public.profiles
  SET plus_access_until = v_new_until
  WHERE id = p_user_id;

  RETURN v_new_until;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_recompute_plus_access_until(uuid) FROM PUBLIC;
-- Sin GRANT a authenticated: solo se invoca internamente desde el futuro
-- handler de webhook de Fase 3.C (service_role), nunca desde el cliente.

-- =============================================================================
-- 4. `expense_monthly_usage` — contador atómico del límite gratuito
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.expense_monthly_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id),
  period  text NOT NULL,  -- 'YYYY-MM' en Europe/Madrid, calculado siempre en servidor
  count   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, period)
);

COMMENT ON TABLE public.expense_monthly_usage IS
  'Fase 3.B: contador de creaciones exitosas de gasto por mes natural (Europe/Madrid) para el plan gratuito. No depende de los ciclos libres de Fase 1 (payment_cycles/months) -- el límite gratuito siempre usa mes natural. Solo lo escribe fn_create_expense. Borrar un gasto no decrementa este contador.';

ALTER TABLE public.expense_monthly_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.expense_monthly_usage FROM anon, authenticated;
GRANT SELECT ON public.expense_monthly_usage TO authenticated;

DROP POLICY IF EXISTS "Users can view their own monthly usage" ON public.expense_monthly_usage;
CREATE POLICY "Users can view their own monthly usage"
  ON public.expense_monthly_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- 5. `stripe_webhook_events` — idempotencia de webhooks (preparado para Fase 3.C)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  stripe_event_id text PRIMARY KEY,
  event_type      text NOT NULL,
  processed_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stripe_webhook_events IS
  'Fase 3.B (esquema preparado, sin uso hasta Fase 3.C): registro de eventos de Stripe ya procesados, para idempotencia por event_id. Sin acceso de cliente.';

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_webhook_events FROM anon, authenticated;

-- =============================================================================
-- 6. `handle_new_user` — trial de 30 días, is_founder=false explícito, lock advisory
-- =============================================================================
--
-- El pg_advisory_xact_lock aquí protege el RÉGIMEN POSTERIOR a la activación
-- (coordinación entre altas nuevas y una futura reconciliación que también lo
-- pida). NO es lo que garantiza la corrección de la activación en sí -- eso lo
-- hace el LOCK TABLE del procedimiento manual de activación (ver
-- supabase/manual-ops/founder_capture_activation.sql), que cubre además
-- cualquier transacción heredada que no conozca este lock advisory.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('kakebo:founder_capture'));

  INSERT INTO public.profiles (id, tier, trial_started_at, trial_ends_at, is_founder)
  VALUES (
    new.id,
    'free',
    now(),
    now() + interval '30 days',
    false
  );

  RETURN new;
END;
$$;

-- No hace falta recrear el trigger on_auth_user_created: sigue apuntando a esta
-- función por nombre, CREATE OR REPLACE FUNCTION ya actualiza su comportamiento.

-- =============================================================================
-- 7. `fn_resolve_access_state` — réplica SQL del resolvedor de src/lib/auth/access-state.ts
-- =============================================================================
--
-- ADVERTENCIA DE DISEÑO: esta función debe mantenerse en sincronía manual con
-- resolveAccessState() en src/lib/auth/access-state.ts. Son dos implementaciones
-- independientes (Postgres no puede ejecutar TypeScript) del mismo contrato
-- aprobado en docs/planning/fase-3-monetizacion.md §3.A. Cualquier cambio de
-- reglas debe aplicarse en ambos sitios.
--
-- A diferencia de la versión TypeScript, esta función colapsa plus_active y
-- plus_canceled_pending en un único resultado 'plus_active' (la matriz de
-- permisos es idéntica para ambos; la distinción es solo informativa para UI
-- y se resuelve en la capa de aplicación leyendo subscriptions.cancel_at_period_end).

CREATE OR REPLACE FUNCTION public.fn_resolve_access_state(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile public.profiles;
  v_period  text;
  v_count   integer;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil no encontrado' USING ERRCODE = 'KB002';
  END IF;

  IF v_profile.is_founder THEN
    RETURN 'founder';
  END IF;

  IF v_profile.plus_access_until IS NOT NULL AND now() < v_profile.plus_access_until THEN
    RETURN 'plus_active';
  END IF;

  IF v_profile.trial_ends_at IS NOT NULL AND now() < v_profile.trial_ends_at THEN
    RETURN 'trialing';
  END IF;

  v_period := to_char(now() AT TIME ZONE 'Europe/Madrid', 'YYYY-MM');

  SELECT count INTO v_count
  FROM public.expense_monthly_usage
  WHERE user_id = p_user_id AND period = v_period;

  IF v_count IS NULL OR v_count < 30 THEN
    RETURN 'free_under_limit';
  ELSE
    RETURN 'free_readonly';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_resolve_access_state(uuid) FROM PUBLIC;
-- Sin GRANT a authenticated: solo se invoca internamente desde fn_create_expense
-- (SECURITY DEFINER, se ejecuta con los privilegios del propietario de la función,
-- no con los del rol que la llama -- ver docs/planning §3.B.2).

-- =============================================================================
-- 8. `fn_create_expense` — única vía de creación de gastos
-- =============================================================================
--
-- p_month_id: el ciclo (Fase 1, ver src/lib/months.ts) ya resuelto por la
-- capa de TypeScript (ciclo abierto del usuario, o el ciclo del mes natural
-- en bootstrap) -- esta función NO decide a qué ciclo pertenece el gasto,
-- solo revalida que el ciclo recibido es del usuario que llama y no está
-- cerrado, como defensa en profundidad ante una llamada directa a la RPC
-- que se salte esa resolución.
-- p_subcategory: catálogo de src/lib/subcategories.ts -- ya restringido por
-- el CHECK expenses_subcategory_check existente (migración
-- 20260914_add_expense_subcategory.sql), no se revalida aquí por duplicado.

CREATE OR REPLACE FUNCTION public.fn_create_expense(
  p_month_id    uuid,
  p_date        date,
  p_amount      numeric,
  p_category    text,
  p_note        text DEFAULT NULL,
  p_color       text DEFAULT NULL,
  p_subcategory text DEFAULT NULL
)
RETURNS public.expenses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id      uuid;
  v_month_status text;
  v_month_owner  uuid;
  v_access_state text;
  v_period       text;
  v_new_count    integer;
  v_row          public.expenses;
BEGIN
  -- Identidad: SIEMPRE de la sesión autenticada, nunca de un parámetro de cliente.
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = 'KB002';
  END IF;

  -- Validación mínima de integridad (equivalente a createExpenseSchema en Zod).
  IF p_amount IS NULL OR p_amount < 0 THEN
    RAISE EXCEPTION 'Importe inválido' USING ERRCODE = 'KB002';
  END IF;
  IF p_category IS NULL OR length(trim(p_category)) = 0 THEN
    RAISE EXCEPTION 'Categoría inválida' USING ERRCODE = 'KB002';
  END IF;
  IF p_date IS NULL THEN
    RAISE EXCEPTION 'Fecha inválida' USING ERRCODE = 'KB002';
  END IF;

  -- Validación de propiedad y estado del ciclo (defensa en profundidad -- ya
  -- se comprueba también en TypeScript antes de llamar a esta función; esto
  -- cubre cualquier llamada directa a la RPC que se salte esa capa).
  IF p_month_id IS NOT NULL THEN
    SELECT status, user_id INTO v_month_status, v_month_owner
    FROM public.months
    WHERE id = p_month_id
    FOR UPDATE;

    -- Mensaje neutro: no distingue "no existe" de "es de otro usuario", para no
    -- permitir enumerar IDs ajenos observando diferencias en la respuesta.
    IF NOT FOUND OR v_month_owner <> v_user_id THEN
      RAISE EXCEPTION 'Ciclo no válido' USING ERRCODE = 'KB002';
    END IF;

    IF v_month_status = 'closed' THEN
      RAISE EXCEPTION 'El ciclo está cerrado' USING ERRCODE = 'KB002';
    END IF;
  END IF;

  -- Contador: solo aplica a free_under_limit. founder/plus/trial ni lo leen.
  v_access_state := public.fn_resolve_access_state(v_user_id);

  IF v_access_state = 'free_readonly' THEN
    RAISE EXCEPTION 'Límite mensual de gastos alcanzado' USING ERRCODE = 'KB001';
  END IF;

  IF v_access_state = 'free_under_limit' THEN
    v_period := to_char(now() AT TIME ZONE 'Europe/Madrid', 'YYYY-MM');

    INSERT INTO public.expense_monthly_usage (user_id, period, count)
    VALUES (v_user_id, v_period, 1)
    ON CONFLICT (user_id, period) DO UPDATE
      SET count = public.expense_monthly_usage.count + 1
      WHERE public.expense_monthly_usage.count < 30
    RETURNING count INTO v_new_count;

    -- ON CONFLICT DO UPDATE ... WHERE que no cumple la condición no actualiza
    -- la fila ni dispara el RETURNING -- v_new_count queda NULL, lo detectamos:
    IF v_new_count IS NULL THEN
      RAISE EXCEPTION 'Límite mensual de gastos alcanzado' USING ERRCODE = 'KB001';
    END IF;
  END IF;

  -- Inserción del gasto, en la misma transacción que el incremento del contador
  -- (si esta inserción falla, la excepción deshace también el incremento).
  INSERT INTO public.expenses (user_id, month_id, date, amount, category, note, color, subcategory)
  VALUES (v_user_id, p_month_id, p_date, p_amount, p_category, p_note, p_color, p_subcategory)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Cierre del permiso de ejecución: anon nunca debe poder ni intentar invocarla,
-- aunque la comprobación interna de auth.uid() fallara alguna vez.
REVOKE EXECUTE ON FUNCTION public.fn_create_expense(uuid, date, numeric, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_create_expense(uuid, date, numeric, text, text, text, text) TO authenticated;

-- =============================================================================
-- 9. Endurecimiento de permisos de `expenses`/`profiles` — NO EN ESTA MIGRACIÓN
-- =============================================================================
--
-- Corrección obligatoria (2026-09-16): un comentario "pendiente de preflight"
-- no impide que un `REVOKE`/`DROP POLICY` se ejecute al aplicar esta migración
-- -- el texto es documentación, no una barrera real. El cierre del INSERT
-- directo en `expenses` (`authenticated`/`anon`) y del UPDATE directo en
-- `profiles` (incluida la política "Users can update their own profile") se ha
-- movido por completo a un script manual separado, que NO forma parte de esta
-- migración base y no se ejecuta al aplicarla:
--
--   supabase/manual-ops/phase3b_permission_hardening.sql
--
-- Esta migración base únicamente prepara esquema (columnas, tablas nuevas) y
-- las funciones RPC (`fn_create_expense`, `fn_resolve_access_state`,
-- `handle_new_user`) -- es segura de aplicar sola, sin cambiar ningún
-- comportamiento existente de creación/edición de gastos ni de perfiles,
-- porque el `INSERT` directo en `expenses` y el `UPDATE` directo en `profiles`
-- SIGUEN PERMITIDOS hasta que se ejecute el script de endurecimiento aparte,
-- de forma manual, el día de lanzamiento, después del preflight remoto y
-- cuando las tres rutas que llaman a `fn_create_expense` ya estén desplegadas
-- y verificadas en producción.
--
-- Ver docs/planning/fase-3-monetizacion.md §3.B.4 y el propio script manual
-- para el detalle del preflight y el procedimiento de aplicación.
