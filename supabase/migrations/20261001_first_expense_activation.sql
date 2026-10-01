-- First activation measurement for the Kakebo funnel.
-- The table is a server-side idempotency claim: at most one first expense per user.

CREATE TABLE IF NOT EXISTS public.first_expense_activations (
  user_id    uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_id uuid NOT NULL UNIQUE REFERENCES public.expenses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.first_expense_activations IS
  'One immutable measurement claim per user for the first persisted expense. It is not an entitlement or an access-control table.';

ALTER TABLE public.first_expense_activations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.first_expense_activations FROM anon, authenticated;
GRANT SELECT ON public.first_expense_activations TO authenticated;

DROP POLICY IF EXISTS "Users can view their own first expense activation" ON public.first_expense_activations;
CREATE POLICY "Users can view their own first expense activation"
  ON public.first_expense_activations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Existing users are baseline users, not newly activated users. Mark one
-- historical expense for each user so a later expense cannot be misclassified.
INSERT INTO public.first_expense_activations (user_id, expense_id)
SELECT DISTINCT ON (e.user_id) e.user_id, e.id
FROM public.expenses AS e
ORDER BY e.user_id, e.date ASC, e.id ASC
ON CONFLICT (user_id) DO NOTHING;

-- Keep the claim in the same transaction as every successful expense insert,
-- including future creation paths that may call the RPC directly.
CREATE OR REPLACE FUNCTION public.claim_first_expense_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.first_expense_activations (user_id, expense_id)
  VALUES (NEW.user_id, NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_claim_first_expense_activation ON public.expenses;
CREATE TRIGGER trigger_claim_first_expense_activation
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.claim_first_expense_activation();

REVOKE ALL ON FUNCTION public.claim_first_expense_activation() FROM PUBLIC;
