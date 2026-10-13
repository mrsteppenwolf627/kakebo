-- ROLLBACK de la migración 1/5. No destructivo: si hay concesiones, se archivan antes de eliminar la tabla.
DO $$
BEGIN
  IF to_regclass('public.access_grants') IS NOT NULL
     AND to_regclass('public._rollback_access_grants') IS NULL
     AND EXISTS (SELECT 1 FROM public.access_grants) THEN
    CREATE TABLE public._rollback_access_grants AS SELECT * FROM public.access_grants;
    ALTER TABLE public._rollback_access_grants ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public._rollback_access_grants FROM PUBLIC, anon, authenticated;
  END IF;
END
$$;
DROP TABLE IF EXISTS public.access_grants;
