-- MIGRATION 2/5 — Plus subscriptions foundation: columnas de `subscriptions` + `billing_customers`
-- DATE: 2026-10-13
-- ENVIRONMENT: probada en STAGING (gqnsanzsdnbufwicjtiw). NO aplicar en producción sin autorización explícita.
--
-- ADITIVA E INERTE: no borra ni modifica filas de `subscriptions` (vacía hoy en producción y staging).
-- Insertar una fila en `subscriptions` NO concede acceso por sí sola: el resolver (migración 4) valida el estado de Stripe
-- y las fechas. El campo `status` sigue siendo el valor crudo de Stripe.
--
-- billing_customers: mapa user_id <-> stripe_customer_id (ambos únicos), escritura solo service_role.
-- Los IDs de Stripe NO deben vivir en `profiles` (un usuario puede actualizar su propio perfil): la migración 3 además
-- protege profiles.stripe_customer_id / stripe_subscription_id contra escritura de clientes.
--
-- Idempotente. Rollback: supabase/rollback/plus/20261013112938_plus_subscriptions_and_billing_customers.rollback.sql

-- ---------------------------------------------------------------------------
-- 1. `subscriptions`: columnas necesarias para evaluar el derecho de acceso
-- ---------------------------------------------------------------------------
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_price_id       text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_start  timestamptz;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS canceled_at           timestamptz;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS ended_at              timestamptz;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS latest_invoice_id     text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS livemode              boolean;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_event_created    timestamptz;

COMMENT ON COLUMN public.subscriptions.stripe_price_id IS 'Price de Stripe de la suscripción (mensual o anual).';
COMMENT ON COLUMN public.subscriptions.current_period_start IS
  'Inicio del periodo actual. Con status past_due la gracia de 3 días se cuenta desde aquí (Stripe adelanta el periodo al emitir la factura de renovación).';
COMMENT ON COLUMN public.subscriptions.last_event_created IS
  'Fecha de creación (event.created) del último evento aplicado. Evita que un evento antiguo pise un estado más reciente.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_plan_interval_check' AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_plan_interval_check CHECK (plan_interval IN ('monthly', 'annual'));
  END IF;
END
$$;

-- service_role necesita privilegios de tabla explícitos (RLS no los sustituye; en este proyecto no son por defecto).
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO service_role;

-- ---------------------------------------------------------------------------
-- 2. `billing_customers`
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_customers (
  user_id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text        NOT NULL,
  livemode           boolean     NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_customers_stripe_customer_id_key UNIQUE (stripe_customer_id),
  CONSTRAINT billing_customers_customer_format CHECK (stripe_customer_id ~ '^cus_[A-Za-z0-9_]+$')
);

COMMENT ON TABLE public.billing_customers IS
  'Plus foundation: relación 1:1 usuario <-> cliente de Stripe. Sin acceso de cliente; escritura solo service_role. Es la fuente de verdad de a quién pertenece un cliente de Stripe.';

ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_customers FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.billing_customers TO service_role;
-- Sin políticas para authenticated: deny-all para clientes.
