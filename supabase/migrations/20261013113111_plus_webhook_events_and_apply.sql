-- MIGRATION 5/5 — Plus subscriptions foundation: `stripe_webhook_events` extendida + fn_apply_subscription_event
-- DATE: 2026-10-13
-- ENVIRONMENT: probada en STAGING (gqnsanzsdnbufwicjtiw). NO aplicar en producción sin autorización explícita.
--
-- NO afecta al pack Excel/PDF: el webhook del pack usa `premium_webhook_events` (tabla distinta) y no se toca.
-- `stripe_webhook_events` está vacía hoy (modo compatible); la migración conserva cualquier fila existente y la marca como procesada.
--
-- fn_apply_subscription_event: único punto de escritura de suscripciones. Solo service_role. Contrato de entrada:
--   * p_user_id y p_subscription los construye el SERVIDOR a partir de stripe.subscriptions.retrieve() (nunca del navegador).
--   * p_subscription (jsonb normalizado): subscription_id, customer_id, status, current_period_start, current_period_end,
--     cancel_at_period_end, canceled_at, ended_at, price_id, interval ('monthly'|'annual'), latest_invoice_id.
-- Garantías:
--   * Idempotente: el event_id se registra en el mismo bloque transaccional; un evento ya procesado no vuelve a aplicarse.
--   * Transaccional: si algo falla (excepción) se revierte TODO (también el registro del evento) y Stripe reintenta;
--     un fallo nunca modifica ni revoca acceso. Los fallos se anotan con fn_record_webhook_failure.
--   * Serializado por usuario y por suscripción (pg_advisory_xact_lock, siempre en el mismo orden: usuario y luego suscripción).
--   * Aislamiento entre usuarios: un customer, un usuario o una suscripción que ya pertenezcan a otro usuario/cliente se ignoran
--     (estado 'ignored', sin tocar suscripciones ni accesos).
--   * Orden: un evento más antiguo que el último aplicado a esa suscripción no pisa el estado (resultado 'stale').
--   * Usuario inexistente: se ignora sin error (no concede nada).
--   * Conceder acceso depende del estado validado de la suscripción (fn_subscription_entitlement), no de insertar una fila.
--
-- Rollback: supabase/rollback/plus/20261013113111_plus_webhook_events_and_apply.rollback.sql

-- ---------------------------------------------------------------------------
-- 1. stripe_webhook_events: estado, intentos, error y marcas de tiempo
-- ---------------------------------------------------------------------------
ALTER TABLE public.stripe_webhook_events ADD COLUMN IF NOT EXISTS livemode    boolean;
ALTER TABLE public.stripe_webhook_events ADD COLUMN IF NOT EXISTS status      text        NOT NULL DEFAULT 'processing';
ALTER TABLE public.stripe_webhook_events ADD COLUMN IF NOT EXISTS attempts    integer     NOT NULL DEFAULT 0;
ALTER TABLE public.stripe_webhook_events ADD COLUMN IF NOT EXISTS last_error  text;
ALTER TABLE public.stripe_webhook_events ADD COLUMN IF NOT EXISTS received_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.stripe_webhook_events ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();

-- processed_at pasa a significar "cuándo se procesó" (NULL mientras no se haya procesado).
ALTER TABLE public.stripe_webhook_events ALTER COLUMN processed_at DROP NOT NULL;
ALTER TABLE public.stripe_webhook_events ALTER COLUMN processed_at DROP DEFAULT;

-- Filas anteriores a esta migración (si las hubiera): ya estaban procesadas.
UPDATE public.stripe_webhook_events
SET status = 'processed', attempts = GREATEST(attempts, 1)
WHERE status = 'processing' AND processed_at IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stripe_webhook_events_status_check' AND conrelid = 'public.stripe_webhook_events'::regclass
  ) THEN
    ALTER TABLE public.stripe_webhook_events
      ADD CONSTRAINT stripe_webhook_events_status_check CHECK (status IN ('processing', 'processed', 'failed', 'ignored'));
  END IF;
END
$$;

COMMENT ON TABLE public.stripe_webhook_events IS
  'Plus foundation: ledger de eventos de Stripe de SUSCRIPCIONES (event_id único, estado, intentos, error). No se usa para el pack Excel/PDF (premium_webhook_events). Sin acceso de cliente.';
COMMENT ON COLUMN public.stripe_webhook_events.last_error IS 'Mensaje técnico truncado. Nunca datos personales ni payloads.';

REVOKE ALL ON public.stripe_webhook_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.stripe_webhook_events TO service_role;

-- ---------------------------------------------------------------------------
-- 2. fn_record_webhook_failure: anota un fallo sin tocar nada más (y sin degradar un evento ya procesado)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_record_webhook_failure(
  p_event_id text, p_event_type text, p_livemode boolean, p_error text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_event_id IS NULL OR p_event_id !~ '^evt_' THEN
    RAISE EXCEPTION 'Evento inválido' USING ERRCODE = 'KB002';
  END IF;

  INSERT INTO public.stripe_webhook_events (stripe_event_id, event_type, livemode, status, attempts, last_error, received_at, updated_at)
  VALUES (p_event_id, COALESCE(p_event_type, 'unknown'), p_livemode, 'failed', 1, left(COALESCE(p_error, ''), 500), now(), now())
  ON CONFLICT (stripe_event_id) DO UPDATE
    SET status     = CASE WHEN public.stripe_webhook_events.status IN ('processed', 'ignored')
                          THEN public.stripe_webhook_events.status ELSE 'failed' END,
        attempts   = public.stripe_webhook_events.attempts + 1,
        last_error = CASE WHEN public.stripe_webhook_events.status IN ('processed', 'ignored')
                          THEN public.stripe_webhook_events.last_error ELSE left(COALESCE(p_error, ''), 500) END,
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.fn_record_webhook_failure(text, text, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_record_webhook_failure(text, text, boolean, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 3. fn_apply_subscription_event
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_apply_subscription_event(
  p_event_id      text,
  p_event_type    text,
  p_livemode      boolean,
  p_event_created timestamptz,
  p_user_id       uuid,
  p_subscription  jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub_id     text;
  v_customer   text;
  v_status     text;
  v_interval   text;
  v_period_end timestamptz;
  v_inserted   integer;
  v_ledger     public.stripe_webhook_events;
  v_cust_owner uuid;
  v_user_cust  text;
  v_existing   public.subscriptions;
  v_has_exist  boolean;
BEGIN
  -- Validación estructural (errores del llamador: se revierten y no tocan nada).
  IF p_event_id IS NULL OR p_event_id !~ '^evt_[A-Za-z0-9_]+$' OR p_event_type IS NULL OR p_event_created IS NULL THEN
    RAISE EXCEPTION 'Evento inválido' USING ERRCODE = 'KB002';
  END IF;
  IF p_subscription IS NULL OR jsonb_typeof(p_subscription) <> 'object' THEN
    RAISE EXCEPTION 'Suscripción inválida' USING ERRCODE = 'KB002';
  END IF;

  v_sub_id     := p_subscription ->> 'subscription_id';
  v_customer   := p_subscription ->> 'customer_id';
  v_status     := p_subscription ->> 'status';
  v_interval   := p_subscription ->> 'interval';
  v_period_end := (p_subscription ->> 'current_period_end')::timestamptz;

  IF v_sub_id IS NULL OR v_sub_id !~ '^sub_[A-Za-z0-9_]+$'
     OR v_customer IS NULL OR v_customer !~ '^cus_[A-Za-z0-9_]+$'
     OR v_status IS NULL OR length(v_status) = 0 OR length(v_status) > 40
     OR v_interval IS NULL OR v_interval NOT IN ('monthly', 'annual')
     OR v_period_end IS NULL THEN
    RAISE EXCEPTION 'Datos de suscripción inválidos' USING ERRCODE = 'KB002';
  END IF;

  -- Serialización: siempre usuario y luego suscripción (orden fijo, sin interbloqueos).
  IF p_user_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('kakebo:plus:user:' || p_user_id::text));
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('kakebo:plus:sub:' || v_sub_id));

  -- Idempotencia: registro del evento dentro de la misma transacción.
  INSERT INTO public.stripe_webhook_events (stripe_event_id, event_type, livemode, status, attempts, received_at, updated_at)
  VALUES (p_event_id, p_event_type, p_livemode, 'processing', 1, now(), now())
  ON CONFLICT (stripe_event_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    SELECT * INTO v_ledger FROM public.stripe_webhook_events WHERE stripe_event_id = p_event_id FOR UPDATE;
    IF v_ledger.status IN ('processed', 'ignored') THEN
      RETURN jsonb_build_object('applied', false, 'result', 'duplicate');
    END IF;
    UPDATE public.stripe_webhook_events
    SET status = 'processing', attempts = attempts + 1, livemode = COALESCE(p_livemode, livemode), updated_at = now()
    WHERE stripe_event_id = p_event_id;
  END IF;

  -- Usuario inexistente: se ignora, no concede nada.
  IF p_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    UPDATE public.stripe_webhook_events
    SET status = 'ignored', processed_at = now(), last_error = 'user_not_found', updated_at = now()
    WHERE stripe_event_id = p_event_id;
    RETURN jsonb_build_object('applied', false, 'result', 'ignored', 'reason', 'user_not_found');
  END IF;

  -- Aislamiento: el cliente de Stripe pertenece a otro usuario, o este usuario ya tiene otro cliente.
  SELECT bc.user_id INTO v_cust_owner FROM public.billing_customers bc WHERE bc.stripe_customer_id = v_customer;
  IF v_cust_owner IS NOT NULL AND v_cust_owner <> p_user_id THEN
    UPDATE public.stripe_webhook_events
    SET status = 'ignored', processed_at = now(), last_error = 'customer_belongs_to_other_user', updated_at = now()
    WHERE stripe_event_id = p_event_id;
    RETURN jsonb_build_object('applied', false, 'result', 'ignored', 'reason', 'customer_belongs_to_other_user');
  END IF;

  SELECT bc.stripe_customer_id INTO v_user_cust FROM public.billing_customers bc WHERE bc.user_id = p_user_id;
  IF v_user_cust IS NOT NULL AND v_user_cust <> v_customer THEN
    UPDATE public.stripe_webhook_events
    SET status = 'ignored', processed_at = now(), last_error = 'user_has_other_customer', updated_at = now()
    WHERE stripe_event_id = p_event_id;
    RETURN jsonb_build_object('applied', false, 'result', 'ignored', 'reason', 'user_has_other_customer');
  END IF;

  -- Aislamiento: la suscripción ya pertenece a otro usuario.
  SELECT * INTO v_existing FROM public.subscriptions WHERE stripe_subscription_id = v_sub_id;
  v_has_exist := FOUND;
  IF v_has_exist AND v_existing.user_id <> p_user_id THEN
    UPDATE public.stripe_webhook_events
    SET status = 'ignored', processed_at = now(), last_error = 'subscription_belongs_to_other_user', updated_at = now()
    WHERE stripe_event_id = p_event_id;
    RETURN jsonb_build_object('applied', false, 'result', 'ignored', 'reason', 'subscription_belongs_to_other_user');
  END IF;

  -- Orden: un evento anterior al último aplicado no pisa el estado.
  IF v_has_exist AND v_existing.last_event_created IS NOT NULL AND p_event_created < v_existing.last_event_created THEN
    UPDATE public.stripe_webhook_events
    SET status = 'processed', processed_at = now(), last_error = NULL, updated_at = now()
    WHERE stripe_event_id = p_event_id;
    RETURN jsonb_build_object('applied', false, 'result', 'stale');
  END IF;

  -- Relación usuario <-> cliente (solo si todavía no existe).
  INSERT INTO public.billing_customers (user_id, stripe_customer_id, livemode)
  VALUES (p_user_id, v_customer, COALESCE(p_livemode, false))
  ON CONFLICT DO NOTHING;

  -- Estado de la suscripción (el acceso lo decide fn_subscription_entitlement, no esta inserción).
  INSERT INTO public.subscriptions AS s (
    user_id, stripe_customer_id, stripe_subscription_id, status, plan_interval,
    current_period_start, current_period_end, cancel_at_period_end, canceled_at, ended_at,
    stripe_price_id, latest_invoice_id, livemode, last_event_id, last_event_created, updated_at
  ) VALUES (
    p_user_id, v_customer, v_sub_id, v_status, v_interval,
    (p_subscription ->> 'current_period_start')::timestamptz, v_period_end,
    COALESCE((p_subscription ->> 'cancel_at_period_end')::boolean, false),
    (p_subscription ->> 'canceled_at')::timestamptz, (p_subscription ->> 'ended_at')::timestamptz,
    p_subscription ->> 'price_id', p_subscription ->> 'latest_invoice_id', p_livemode, p_event_id, p_event_created, now()
  )
  ON CONFLICT ON CONSTRAINT subscriptions_stripe_subscription_id_key DO UPDATE SET
    status               = EXCLUDED.status,
    plan_interval        = EXCLUDED.plan_interval,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end   = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    canceled_at          = EXCLUDED.canceled_at,
    ended_at             = EXCLUDED.ended_at,
    stripe_price_id      = EXCLUDED.stripe_price_id,
    latest_invoice_id    = EXCLUDED.latest_invoice_id,
    livemode             = EXCLUDED.livemode,
    last_event_id        = EXCLUDED.last_event_id,
    last_event_created   = EXCLUDED.last_event_created,
    updated_at           = now()
  WHERE s.user_id = EXCLUDED.user_id;

  PERFORM public.fn_recompute_plus_access_until(p_user_id);

  UPDATE public.stripe_webhook_events
  SET status = 'processed', processed_at = now(), last_error = NULL, updated_at = now()
  WHERE stripe_event_id = p_event_id;

  RETURN jsonb_build_object(
    'applied', true,
    'result', 'applied',
    'state', public.fn_resolve_access_state(p_user_id, now())
  );
END;
$$;

COMMENT ON FUNCTION public.fn_apply_subscription_event(text, text, boolean, timestamptz, uuid, jsonb) IS
  'Plus foundation: aplica de forma idempotente y transaccional el estado de una suscripción de Stripe. Solo service_role. El llamador construye el payload desde stripe.subscriptions.retrieve(); nunca desde el navegador.';

REVOKE ALL ON FUNCTION public.fn_apply_subscription_event(text, text, boolean, timestamptz, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_apply_subscription_event(text, text, boolean, timestamptz, uuid, jsonb) TO service_role;
