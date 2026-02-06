-- UPDATE: Change default signup behavior to FREE (No automatic trial)
-- This enforces the "Card Upfront" requirement for the trial.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, tier, trial_ends_at)
  VALUES (
    new.id, 
    'free', -- Default to Free tier
    null    -- No trial start until they add a card in Stripe
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

