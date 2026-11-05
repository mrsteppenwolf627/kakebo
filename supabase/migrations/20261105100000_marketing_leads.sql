-- marketing_leads: suscriptores captados fuera de la app (p. ej. al descargar la plantilla) con doble confirmación.
-- Solo accesible con service role: ningún rol de cliente puede leer ni escribir.

CREATE TABLE IF NOT EXISTS public.marketing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL,
  consent_at timestamptz NOT NULL,
  consent_text_version text NOT NULL,
  privacy_policy_version text NOT NULL,
  confirmation_sent_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketing_leads_email_lower CHECK (email = lower(email)),
  CONSTRAINT marketing_leads_email_len CHECK (char_length(email) BETWEEN 5 AND 254)
);

CREATE UNIQUE INDEX IF NOT EXISTS marketing_leads_email_key ON public.marketing_leads (email);
CREATE INDEX IF NOT EXISTS marketing_leads_confirmed_idx ON public.marketing_leads (confirmed_at) WHERE confirmed_at IS NOT NULL;

ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.marketing_leads FROM anon, authenticated;

COMMENT ON TABLE public.marketing_leads IS
  'marketingmail: leads con consentimiento explícito y doble confirmación. Access only through service role.';
