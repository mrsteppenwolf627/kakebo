-- ⚠️⚠️⚠️  NO EJECUTAR AUTOMÁTICAMENTE. NO FORMA PARTE DE supabase/migrations/.  ⚠️⚠️⚠️
--
-- Este script se ejecuta MANUALMENTE, UNA SOLA VEZ, el día real de activación de
-- la monetización -- cuando la Fase 3.C (Stripe Checkout + webhooks) esté
-- terminada y verificada, y el propietario del proyecto decida el instante exacto
-- de lanzamiento. No lo ejecuta ningún pipeline, ninguna migración automática,
-- ningún `supabase db push`.
--
-- PRECONDICIÓN: la migración supabase/migrations/20260916_phase3b_monetization_foundation.sql
-- (o su equivalente ya aplicado) debe estar vigente en la base de datos de destino,
-- incluyendo el `handle_new_user` con el advisory lock `kakebo:founder_capture` --
-- ver la nota de diseño más abajo sobre por qué esto importa poco para ESTE script
-- en particular (el LOCK TABLE cubre también el caso de que no estuviera).
--
-- DISEÑO: docs/planning/fase-3-monetizacion.md §3.B.3. Resumen:
--   - Un LOCK TABLE ... SHARE ROW EXCLUSIVE sobre profiles bloquea brevemente
--     cualquier INSERT/UPDATE concurrente (incluida una transacción "heredada"
--     que estuviera usando una versión antigua de handle_new_user sin el lock
--     advisory) y ESPERA a que termine antes de continuar -- sin necesitar
--     mantenimiento manual ni parar la app.
--   - founder_cutoff es una tabla singleton (id boolean + CHECK) -- este script
--     es seguro de re-ejecutar: si ya existe un corte de una activación anterior
--     que hizo COMMIT, lo reutiliza tal cual y no captura a nadie nuevo (ver
--     "Comportamiento ante reejecución" más abajo). Si la ejecución anterior
--     hizo ROLLBACK completo, no queda ningún residuo y esta ejecución parte de
--     cero de forma segura.
--
-- COMPORTAMIENTO ANTE REEJECUCIÓN (verificado por diseño, no solo documentado):
--   - Tras un COMMIT previo: el INSERT en founder_cutoff no hace nada (ON CONFLICT
--     DO NOTHING), se lee el mismo cutoff_at de siempre, y el UPDATE de captura
--     afecta CERO filas porque todo lo elegible ya estaba marcado. Repetir esta
--     operación NUNCA puede ampliar el grupo de fundadores.
--   - Tras un ROLLBACK (p.ej. la verificación final lanzó la excepción): todo --
--     el lock, el INSERT del corte, el UPDATE de captura -- se deshace junto con
--     la transacción. No queda corte fijado a medias ni fundadores parciales.
--
-- Antes de ejecutar en producción: rellena manualmente el texto de `set_by` más
-- abajo con quién ejecuta la activación y la fecha real.

BEGIN;

-- 1-2. Bloqueo breve de escritura sobre profiles. Esta misma sentencia ES la
--      espera a cualquier escritura previa en curso (vieja o nueva) -- Postgres
--      no concede el lock hasta que esas transacciones hagan COMMIT/ROLLBACK.
--      No bloquea SELECT (ACCESS SHARE), así que las lecturas de profiles
--      siguen funcionando con normalidad durante este bloqueo breve.
LOCK TABLE public.profiles IN SHARE ROW EXCLUSIVE MODE;

-- 3. Fijar el corte -- solo si no existe ya (tabla singleton, ON CONFLICT DO
--    NOTHING). Nunca se sustituye un corte ya existente.
INSERT INTO public.founder_cutoff (id, cutoff_at, set_at, set_by)
VALUES (
  true,
  now(),
  now(),
  'RELLENAR ANTES DE EJECUTAR: nombre/usuario de quien activa + fecha real'
)
ON CONFLICT (id) DO NOTHING;

-- 4-5. Captura + verificación, en un bloque PL/pgSQL para poder usar variables
--      y abortar la transacción completa si algo queda pendiente.
DO $$
DECLARE
  v_cutoff  timestamptz;
  v_pending integer;
BEGIN
  -- Se lee siempre la única fila posible -- no hay ORDER BY porque no puede
  -- existir más de una (constraint founder_cutoff_singleton).
  SELECT cutoff_at INTO v_cutoff FROM public.founder_cutoff WHERE id = true;

  IF v_cutoff IS NULL THEN
    RAISE EXCEPTION 'No se pudo leer founder_cutoff.cutoff_at -- abortando activación';
  END IF;

  UPDATE public.profiles
  SET is_founder = true, founder_captured_at = now()
  WHERE created_at < v_cutoff
    AND founder_captured_at IS NULL;

  SELECT count(*) INTO v_pending
  FROM public.profiles
  WHERE created_at < v_cutoff
    AND founder_captured_at IS NULL;

  IF v_pending > 0 THEN
    RAISE EXCEPTION 'Captura de fundadores incompleta: % perfiles pendientes -- abortando (ROLLBACK) en vez de confirmar un estado a medias', v_pending;
  END IF;

  RAISE NOTICE 'Captura de fundadores completada correctamente. Corte aplicado: %', v_cutoff;
END $$;

-- 6. Confirmar. Libera el LOCK TABLE; cualquier INSERT/UPDATE en cola desde el
--    paso 1 prosigue con normalidad a partir de aquí.
COMMIT;

-- Verificación posterior recomendada (fuera de la transacción, de solo lectura):
--   SELECT count(*) FROM public.profiles WHERE is_founder = true;
--   SELECT cutoff_at, set_at, set_by FROM public.founder_cutoff;
