-- ROLLBACK de la migración 5/5. Archiva el ledger antes de quitar columnas (conserva estado, intentos y errores).
DROP FUNCTION IF EXISTS public.fn_apply_subscription_event(text, text, boolean, timestamptz, uuid, jsonb);
DROP FUNCTION IF EXISTS public.fn_record_webhook_failure(text, text, boolean, text);

DO $$
BEGIN
  IF to_regclass('public._rollback_stripe_webhook_events') IS NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'stripe_webhook_events' AND column_name = 'status')
     AND EXISTS (SELECT 1 FROM public.stripe_webhook_events) THEN
    CREATE TABLE public._rollback_stripe_webhook_events AS SELECT * FROM public.stripe_webhook_events;
    ALTER TABLE public._rollback_stripe_webhook_events ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public._rollback_stripe_webhook_events FROM PUBLIC, anon, authenticated;
  END IF;
END
$$;

ALTER TABLE public.stripe_webhook_events DROP CONSTRAINT IF EXISTS stripe_webhook_events_status_check;
UPDATE public.stripe_webhook_events SET processed_at = COALESCE(processed_at, now());
ALTER TABLE public.stripe_webhook_events ALTER COLUMN processed_at SET DEFAULT now();
ALTER TABLE public.stripe_webhook_events ALTER COLUMN processed_at SET NOT NULL;
ALTER TABLE public.stripe_webhook_events
  DROP COLUMN IF EXISTS livemode, DROP COLUMN IF EXISTS status, DROP COLUMN IF EXISTS attempts,
  DROP COLUMN IF EXISTS last_error, DROP COLUMN IF EXISTS received_at, DROP COLUMN IF EXISTS updated_at;
