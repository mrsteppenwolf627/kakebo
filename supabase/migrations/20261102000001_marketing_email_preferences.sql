-- marketingmail: explicit email preferences and privacy notice acknowledgement.
-- Marketing consent is intentionally opt-in and defaults to false.

CREATE TABLE IF NOT EXISTS public.communication_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  marketing_email_consent boolean NOT NULL DEFAULT false,
  marketing_email_consent_at timestamptz,
  marketing_email_consent_source text,
  marketing_email_policy_version text,
  privacy_policy_acknowledged_at timestamptz,
  privacy_policy_version text,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_preferences ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.communication_preferences TO authenticated;

DROP POLICY IF EXISTS "Users can view their own communication preferences" ON public.communication_preferences;
CREATE POLICY "Users can view their own communication preferences"
  ON public.communication_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own communication preferences" ON public.communication_preferences;
CREATE POLICY "Users can create their own communication preferences"
  ON public.communication_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own communication preferences" ON public.communication_preferences;
CREATE POLICY "Users can update their own communication preferences"
  ON public.communication_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_communication_preferences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_communication_preferences_updated_at ON public.communication_preferences;
CREATE TRIGGER trg_communication_preferences_updated_at
  BEFORE UPDATE ON public.communication_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_communication_preferences_updated_at();

COMMENT ON TABLE public.communication_preferences IS
  'marketingmail: explicit opt-in preferences and privacy notice versioning. Marketing consent defaults to false.';
