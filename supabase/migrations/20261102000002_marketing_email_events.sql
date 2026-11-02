-- marketingmail: server-side delivery/audit events. No client role can access this table.

CREATE TABLE IF NOT EXISTS public.marketing_email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  campaign_key text NOT NULL,
  event_type text NOT NULL,
  provider text,
  provider_message_id text,
  error_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_email_events_campaign_idx
  ON public.marketing_email_events (campaign_key, created_at DESC);
CREATE INDEX IF NOT EXISTS marketing_email_events_user_idx
  ON public.marketing_email_events (user_id, created_at DESC);

ALTER TABLE public.marketing_email_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.marketing_email_events FROM anon, authenticated;

COMMENT ON TABLE public.marketing_email_events IS
  'marketingmail: server-side audit and delivery events. Access only through service role.';
