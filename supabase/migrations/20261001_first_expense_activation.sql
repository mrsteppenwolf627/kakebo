-- MIGRATION: Primera activación del usuario (MÉTRICA — nunca concede ni retira acceso)
-- DATE: 2026-10-01 (revisada el 2026-10-06)
-- STATUS: PREPARADA, NO APLICADA. Requiere que `public.expenses` exista.
--
-- Registra, como máximo UNA vez por usuario, cuál fue su primer gasto persistido, para medir
-- la activación del embudo (el endpoint POST /api/expenses lee esta tabla para saber si el gasto
-- recién creado ganó la carrera). NO es una tabla de permisos: ningún código ni función de acceso
-- la consulta, y NO activa ningún plan premium.
--
-- Garantías:
--   * Duplicados / reintentos: PRIMARY KEY (user_id) + INSERT ... ON CONFLICT DO NOTHING.
--   * Concurrencia / carreras entre dos primeros gastos: la PK serializa; solo una fila gana
--     y la otra transacción no hace nada (sin error).
--   * Borrado de gastos: expense_id es ON DELETE SET NULL, NO CASCADE. Si el usuario borra su
--     primer gasto, la marca de activación se CONSERVA (con expense_id NULL) y un gasto posterior
--     no vuelve a registrarse como "primer gasto".
--   * Usuarios existentes: se marca un gasto histórico por usuario (baseline), de modo que un
--     gasto nuevo nunca se clasifique como activación de un usuario antiguo.
--   * Idempotente: se puede reaplicar sin duplicar filas.

CREATE TABLE IF NOT EXISTS public.first_expense_activations (
  user_id    uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_id uuid UNIQUE REFERENCES public.expenses(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Si la tabla ya existía con la versión anterior (NOT NULL + ON DELETE CASCADE), la corrige.
ALTER TABLE public.first_expense_activations ALTER COLUMN expense_id DROP NOT NULL;
ALTER TABLE public.first_expense_activations DROP CONSTRAINT IF EXISTS first_expense_activations_expense_id_fkey;
ALTER TABLE public.first_expense_activations
  ADD CONSTRAINT first_expense_activations_expense_id_fkey
  FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE SET NULL;

COMMENT ON TABLE public.first_expense_activations IS
  'Una única marca inmutable por usuario para su primer gasto persistido (métrica de activación). NO es un derecho de acceso ni una tabla de control de acceso: no concede ni retira nada.';

ALTER TABLE public.first_expense_activations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.first_expense_activations FROM anon, authenticated;
GRANT SELECT ON public.first_expense_activations TO authenticated;

DROP POLICY IF EXISTS "Users can view their own first expense activation" ON public.first_expense_activations;
CREATE POLICY "Users can view their own first expense activation"
  ON public.first_expense_activations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Baseline: los usuarios existentes ya estaban activados. Idempotente.
INSERT INTO public.first_expense_activations (user_id, expense_id)
SELECT DISTINCT ON (e.user_id) e.user_id, e.id
FROM public.expenses AS e
ORDER BY e.user_id, e.date ASC, e.id ASC
ON CONFLICT (user_id) DO NOTHING;

-- La marca se reclama en la misma transacción que cada INSERT correcto de gasto, incluidas
-- futuras rutas de creación que llamen a la RPC directamente.
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

-- Por nombre: anon/authenticated reciben EXECUTE por privilegios por defecto en Supabase.
REVOKE ALL ON FUNCTION public.claim_first_expense_activation() FROM PUBLIC, anon, authenticated;
