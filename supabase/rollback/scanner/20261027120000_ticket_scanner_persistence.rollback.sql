-- ROLLBACK de 20261027120000_ticket_scanner_persistence.sql. NO ejecutado en ningún entorno remoto.
--
-- Seguro por diseño: ABORTA si algún ticket aún referencia un original en el bucket privado (object_path no nulo),
-- para no dejar archivos huérfanos. Purga antes con el endpoint de limpieza o borra los objetos del bucket.
-- NO archiva líneas ni tickets (son datos financieros del usuario que la política de privacidad manda eliminar).
-- No borra el bucket `kakebo-ticket-temp` (creado a mano) ni toca months/expenses.
DO $$
BEGIN
  IF to_regclass('public.scanner_tickets') IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.scanner_tickets WHERE object_path IS NOT NULL) THEN
    RAISE EXCEPTION 'scanner rollback: existen tickets con original en storage; purga el bucket primero';
  END IF;
END
$$;

DROP POLICY IF EXISTS "scanner_ticket_temp_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "scanner_ticket_temp_select_own" ON storage.objects;
DROP POLICY IF EXISTS "scanner_ticket_temp_delete_own" ON storage.objects;

DROP FUNCTION IF EXISTS public.fn_scanner_finalize_deletion(uuid, text);
DROP FUNCTION IF EXISTS public.fn_scanner_mark_deletion_pending(uuid, text);
DROP FUNCTION IF EXISTS public.fn_scanner_cleanup_candidates(timestamptz, integer);
DROP FUNCTION IF EXISTS public.fn_scanner_confirm_ticket(uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.fn_scanner_finalize_confirmed_original(uuid);
DROP FUNCTION IF EXISTS public.fn_scanner_quota_status();
DROP FUNCTION IF EXISTS public.fn_scanner_start_processing(uuid);
DROP FUNCTION IF EXISTS public.fn_scanner_register_upload(uuid, text);
DROP FUNCTION IF EXISTS public.fn_scanner_create_ticket(uuid);

DROP TABLE IF EXISTS public.scanner_quota_ledger;
DROP TABLE IF EXISTS public.scanner_expense_links;
DROP TABLE IF EXISTS public.scanner_ticket_lines;
DROP TABLE IF EXISTS public.scanner_tickets;
