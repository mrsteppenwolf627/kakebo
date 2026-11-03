-- ROLLBACK de la migración 2/5. No depende de que subscriptions esté vacía: archiva antes de eliminar.
--   * _rollback_billing_customers: copia completa de billing_customers.
--   * _rollback_subscriptions_plus_cols: clave + columnas añadidas por la migración (las originales se conservan en subscriptions).
-- Las tablas _rollback_* quedan con RLS y sin acceso de clientes; se borran a mano cuando ya no hagan falta.
DO $$
BEGIN
  IF to_regclass('public.billing_customers') IS NOT NULL
     AND to_regclass('public._rollback_billing_customers') IS NULL
     AND EXISTS (SELECT 1 FROM public.billing_customers) THEN
    CREATE TABLE public._rollback_billing_customers AS SELECT * FROM public.billing_customers;
    ALTER TABLE public._rollback_billing_customers ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public._rollback_billing_customers FROM PUBLIC, anon, authenticated;
  END IF;

  IF to_regclass('public._rollback_subscriptions_plus_cols') IS NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'last_event_created')
     AND EXISTS (SELECT 1 FROM public.subscriptions) THEN
    CREATE TABLE public._rollback_subscriptions_plus_cols AS
      SELECT user_id, stripe_subscription_id, stripe_price_id, current_period_start, canceled_at, ended_at,
             latest_invoice_id, livemode, last_event_created
      FROM public.subscriptions;
    ALTER TABLE public._rollback_subscriptions_plus_cols ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public._rollback_subscriptions_plus_cols FROM PUBLIC, anon, authenticated;
  END IF;
END
$$;

DROP TABLE IF EXISTS public.billing_customers;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_interval_check;
ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS stripe_price_id, DROP COLUMN IF EXISTS current_period_start, DROP COLUMN IF EXISTS canceled_at,
  DROP COLUMN IF EXISTS ended_at, DROP COLUMN IF EXISTS latest_invoice_id, DROP COLUMN IF EXISTS livemode,
  DROP COLUMN IF EXISTS last_event_created;
-- Antes de la migración, service_role no tenía privilegios de tabla sobre subscriptions (verificado en staging).
REVOKE ALL ON public.subscriptions FROM service_role;
