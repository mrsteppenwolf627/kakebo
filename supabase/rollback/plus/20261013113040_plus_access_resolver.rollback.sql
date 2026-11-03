-- ROLLBACK de la migración 4/5. Restaura fn_recompute_plus_access_until v1 y elimina el resolver v2.
DROP FUNCTION IF EXISTS public.fn_my_access();
DROP FUNCTION IF EXISTS public.fn_resolve_access_state(uuid, timestamptz);
DROP FUNCTION IF EXISTS public.fn_subscription_entitlement(uuid, timestamptz);
CREATE OR REPLACE FUNCTION public.fn_recompute_plus_access_until(p_user_id uuid)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_new_until timestamptz;
BEGIN
  SELECT max(current_period_end) INTO v_new_until
  FROM public.subscriptions WHERE user_id = p_user_id AND current_period_end > now();
  UPDATE public.profiles SET plus_access_until = v_new_until WHERE id = p_user_id;
  RETURN v_new_until;
END;
$$;
