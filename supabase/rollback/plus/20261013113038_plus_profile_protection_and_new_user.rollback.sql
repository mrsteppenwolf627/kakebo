-- ROLLBACK de la migración 3/5. Restaura protect_profile_access_columns v1 y handle_new_user v1.
CREATE OR REPLACE FUNCTION public.protect_profile_access_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.is_founder, false) <> false OR NEW.founder_captured_at IS NOT NULL
       OR NEW.plus_access_until IS NOT NULL OR COALESCE(NEW.manual_override, false) <> false THEN
      RAISE EXCEPTION 'No se permite establecer campos de acceso protegidos' USING ERRCODE = '42501';
    END IF;
  ELSE
    IF NEW.is_founder IS DISTINCT FROM OLD.is_founder
       OR NEW.founder_captured_at IS DISTINCT FROM OLD.founder_captured_at
       OR NEW.plus_access_until IS DISTINCT FROM OLD.plus_access_until
       OR NEW.manual_override IS DISTINCT FROM OLD.manual_override
       OR NEW.tier IS DISTINCT FROM OLD.tier
       OR NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at
       OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at THEN
      RAISE EXCEPTION 'No se permite modificar campos de acceso protegidos' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, tier, trial_ends_at) VALUES (new.id, 'free', now() + interval '14 days') ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
