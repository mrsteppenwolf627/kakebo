-- MIGRATION — Ticket scanner persistence (Fase 7): tickets, líneas editables, libro de cuota por ciclo,
-- funciones atómicas, RLS y políticas de storage.objects del bucket privado `kakebo-ticket-temp`.
-- DATE: 2026-10-27
-- ENVIRONMENT: SOLO LOCAL / REVISIÓN. NO ejecutada en ningún entorno remoto. NO aplicar en producción
--   (proyecto kakebo-ahorro, fajqfjouqauyfiajfonf) sin autorización explícita, backup verificado y revisión.
--   El proyecto remoto figura como "unhealthy" y sin backups visibles: aplicar solo tras resolverlo.
--
-- Qué hace:
--   * `scanner_tickets`       — un ticket por intento de escaneo, ligado a `months.id` (ciclo) y a `auth.users`.
--   * `scanner_ticket_lines`  — líneas editables del borrador (solo mientras el ticket está `needs_review`).
--   * `scanner_quota_ledger`  — libro de cuota (consume/refund) POR CICLO; nunca por fecha ni por reloj.
--   * Funciones SECURITY DEFINER: crear ticket, registrar subida, iniciar procesado (consume cuota de forma
--     atómica, límite 5 por ciclo), estado de cuota, y las de limpieza (solo service_role).
--   * Políticas de storage.objects acotadas a `<user_id>/<ticket_id>/<objeto>` y a tickets propios.
--
-- Qué NO hace:
--   * No toca `expenses`, `months`, `profiles`, Stripe, Premium ni analítica. No hay trigger sobre `months`.
--   * No crea el bucket (ya existe, creado a mano) ni lo hace público. Aborta si lo encuentra público.
--   * No crea la tabla de vínculo ticket↔gasto: el esquema observado de `expenses` no ofrece trazabilidad
--     segura (ver docs/ticket-scanner/phase-7-persistence.md §6).
--
-- Evidencia usada (verificada por el propietario en el dashboard, 2026-10-27):
--   months(id uuid, user_id uuid, year int4, month int4, status text, created_at, closed_at, income numeric)
--   Las FK a `months(id)` exigen que `months.id` sea único: el preflight aborta la migración si no lo es.
--
-- UBICACIÓN: supabase/deferred/ticket-scanner/ (NO supabase/migrations/): `supabase db push` no la aplicará por
--   accidente. Para aplicarla algún día, copiarla a supabase/migrations/ con una versión posterior a la última existente.
-- Rollback: supabase/rollback/scanner/20261027120000_ticket_scanner_persistence.rollback.sql

-- ---------------------------------------------------------------------------
-- 0. Preflight (aborta sin cambios si las suposiciones no se cumplen)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.months') IS NULL THEN
    RAISE EXCEPTION 'scanner preflight: public.months no existe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'months' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    RAISE EXCEPTION 'scanner preflight: months.id no es uuid';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
    WHERE i.indrelid = 'public.months'::regclass
      AND i.indisunique AND i.indnatts = 1 AND i.indpred IS NULL AND a.attname = 'id'
  ) THEN
    RAISE EXCEPTION 'scanner preflight: months.id no tiene restricción UNIQUE/PRIMARY KEY, no se puede crear FK';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'months' AND column_name IN ('user_id', 'status')
    GROUP BY table_name HAVING count(*) = 2
  ) THEN
    RAISE EXCEPTION 'scanner preflight: months necesita user_id y status';
  END IF;

  IF to_regclass('public.expenses') IS NULL
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'month_id')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'amount')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'category') THEN
    RAISE EXCEPTION 'scanner preflight: expenses necesita month_id, amount y category';
  END IF;

  IF to_regprocedure('public.fn_create_expense(uuid,date,numeric,text,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'scanner preflight: fn_create_expense no está disponible';
  END IF;

  IF to_regclass('storage.buckets') IS NOT NULL
     AND EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'kakebo-ticket-temp' AND public IS TRUE) THEN
    RAISE EXCEPTION 'scanner preflight: el bucket kakebo-ticket-temp es PÚBLICO; debe ser privado';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scanner_tickets (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Ciclo = months.id del ciclo abierto en el momento de crear el ticket. NO ACTION: no se puede borrar un
  -- ciclo con tickets vivos (evita huérfanos de storage); el borrado de usuario cascada por ambas vías.
  cycle_id              uuid        NOT NULL REFERENCES public.months(id),
  status                text        NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated','uploaded','processing','needs_review','confirmed','failed','expired','deleted')),
  status_reason         text
    CHECK (status_reason IS NULL OR status_reason IN
      ('user_discarded','ttl_expired','validation_rejected','provider_failed','cycle_closed')),
  attempt_count         smallint    NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  original_storage      text        NOT NULL DEFAULT 'none'
    CHECK (original_storage IN ('none','present','deletion_pending','deleted_verified')),
  -- Ruta opaca `<user_id>/<ticket_id>/<uuid>` en el bucket privado. Sin nombre de archivo original.
  object_path           text        CHECK (object_path IS NULL OR char_length(object_path) <= 200),
  has_draft             boolean     NOT NULL DEFAULT false,
  draft_version         integer     NOT NULL DEFAULT 0 CHECK (draft_version >= 0),
  merchant              text        CHECK (merchant IS NULL OR char_length(merchant) <= 120),
  receipt_date          date,
  total_cents           bigint      CHECK (total_cents IS NULL OR total_cents > 0),
  currency              text        NOT NULL DEFAULT 'EUR' CHECK (currency = 'EUR'),
  idempotency_key       uuid        NOT NULL,
  confirm_key           uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  -- Caducidad del original no confirmado: 24 h desde la creación (src/lib/scanner/retention.ts).
  expires_at            timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  confirmed_at          timestamptz,
  deleted_at            timestamptz,
  deletion_verified_at  timestamptz,
  CONSTRAINT scanner_tickets_expires_after_created CHECK (expires_at > created_at),
  -- I16: `deleted` solo con el original ausente y verificado (o que nunca existió).
  CONSTRAINT scanner_tickets_deleted_requires_verified
    CHECK (status <> 'deleted' OR (original_storage IN ('none','deleted_verified') AND object_path IS NULL AND has_draft = false)),
  CONSTRAINT scanner_tickets_verified_has_timestamp
    CHECK (original_storage <> 'deleted_verified' OR deletion_verified_at IS NOT NULL),
  CONSTRAINT scanner_tickets_path_prefix
    CHECK (object_path IS NULL OR object_path LIKE user_id::text || '/' || id::text || '/%')
);

CREATE UNIQUE INDEX IF NOT EXISTS scanner_tickets_idempotency_idx ON public.scanner_tickets (user_id, idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS scanner_tickets_confirm_key_idx ON public.scanner_tickets (user_id, confirm_key) WHERE confirm_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS scanner_tickets_user_status_idx ON public.scanner_tickets (user_id, status);
CREATE INDEX IF NOT EXISTS scanner_tickets_cycle_idx ON public.scanner_tickets (cycle_id) WHERE status <> 'deleted';
CREATE INDEX IF NOT EXISTS scanner_tickets_expiry_idx ON public.scanner_tickets (expires_at) WHERE status <> 'deleted';

COMMENT ON TABLE public.scanner_tickets IS
  'Escáner de tickets: un registro por ticket. Sin imagen ni texto OCR; solo estado y ruta opaca del original temporal. Lectura propia por RLS; escritura solo vía funciones.';

CREATE TABLE IF NOT EXISTS public.scanner_ticket_lines (
  id                 uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id          uuid     NOT NULL REFERENCES public.scanner_tickets(id) ON DELETE CASCADE,
  user_id            uuid     NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position           smallint NOT NULL CHECK (position >= 0),
  kind               text     NOT NULL CHECK (kind IN ('item','adjustment')),
  description        text     CHECK (description IS NULL OR char_length(description) <= 200),
  amount_cents       bigint   NOT NULL CHECK (amount_cents <> 0),
  category_proposal  text     CHECK (category_proposal IS NULL OR category_proposal IN ('survival','optional','culture','extra')),
  category           text     CHECK (category IS NULL OR category IN ('survival','optional','culture','extra')),
  -- [{ "category": "...", "amountCents": n }, ...]; ≥2 partes cuando se divide (entonces category es NULL).
  allocations        jsonb    NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(allocations) = 'array'),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scanner_ticket_lines_position_unique UNIQUE (ticket_id, position),
  CONSTRAINT scanner_ticket_lines_split_xor CHECK (jsonb_array_length(allocations) = 0 OR category IS NULL)
);

CREATE INDEX IF NOT EXISTS scanner_ticket_lines_user_idx ON public.scanner_ticket_lines (user_id);

COMMENT ON TABLE public.scanner_ticket_lines IS
  'Líneas editables del borrador (datos financieros S2). Se borran al borrar/caducar el ticket. Editables por el propietario solo con el ticket en needs_review.';

CREATE TABLE IF NOT EXISTS public.scanner_quota_ledger (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id    uuid        NOT NULL REFERENCES public.months(id),
  -- Sin FK al ticket a propósito: el libro sobrevive a la purga de filas de ticket (data-model.md §2.8).
  ticket_id   uuid        NOT NULL,
  kind        text        NOT NULL CHECK (kind IN ('consume','refund')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scanner_quota_ledger_ticket_kind_unique UNIQUE (ticket_id, kind)
);

CREATE INDEX IF NOT EXISTS scanner_quota_ledger_cycle_idx ON public.scanner_quota_ledger (cycle_id);

COMMENT ON TABLE public.scanner_quota_ledger IS
  'Libro de cuota del escáner por ciclo (months.id). Límite 5 por ciclo; se reinicia solo al cambiar de ciclo. Sin acceso directo desde clientes.';

CREATE TABLE IF NOT EXISTS public.scanner_expense_links (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid        NOT NULL REFERENCES public.scanner_tickets(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id    uuid        NOT NULL REFERENCES public.months(id),
  expense_id  uuid        NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  group_no    smallint    NOT NULL CHECK (group_no > 0 AND group_no <= 4),
  category    text        NOT NULL CHECK (category IN ('survival','optional','culture','extra')),
  amount_cents bigint     NOT NULL CHECK (amount_cents > 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scanner_expense_links_ticket_group_unique UNIQUE (ticket_id, group_no),
  CONSTRAINT scanner_expense_links_expense_unique UNIQUE (expense_id)
);

CREATE INDEX IF NOT EXISTS scanner_expense_links_user_created_idx
  ON public.scanner_expense_links (user_id, created_at);

COMMENT ON TABLE public.scanner_expense_links IS
  'Vínculo idempotente entre un ticket confirmado y los gastos creados. No contiene la imagen ni texto OCR.';

-- ---------------------------------------------------------------------------
-- 2. Privilegios y RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.scanner_tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_ticket_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_quota_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_expense_links ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.scanner_tickets, public.scanner_ticket_lines, public.scanner_quota_ledger, public.scanner_expense_links
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.scanner_tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scanner_ticket_lines TO authenticated;
GRANT ALL ON public.scanner_tickets, public.scanner_ticket_lines, public.scanner_quota_ledger, public.scanner_expense_links TO service_role;
-- scanner_quota_ledger: ni lectura ni escritura para clientes (el usuario consulta fn_scanner_quota_status()).

DROP POLICY IF EXISTS "scanner_tickets_select_own" ON public.scanner_tickets;
CREATE POLICY "scanner_tickets_select_own" ON public.scanner_tickets
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "scanner_lines_select_own" ON public.scanner_ticket_lines;
CREATE POLICY "scanner_lines_select_own" ON public.scanner_ticket_lines
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "scanner_lines_insert_own_in_review" ON public.scanner_ticket_lines;
CREATE POLICY "scanner_lines_insert_own_in_review" ON public.scanner_ticket_lines
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.scanner_tickets t
                WHERE t.id = ticket_id AND t.user_id = auth.uid() AND t.status = 'needs_review')
  );

DROP POLICY IF EXISTS "scanner_lines_update_own_in_review" ON public.scanner_ticket_lines;
CREATE POLICY "scanner_lines_update_own_in_review" ON public.scanner_ticket_lines
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.scanner_tickets t
                WHERE t.id = ticket_id AND t.user_id = auth.uid() AND t.status = 'needs_review')
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.scanner_tickets t
                WHERE t.id = ticket_id AND t.user_id = auth.uid() AND t.status = 'needs_review')
  );

DROP POLICY IF EXISTS "scanner_lines_delete_own_in_review" ON public.scanner_ticket_lines;
CREATE POLICY "scanner_lines_delete_own_in_review" ON public.scanner_ticket_lines
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.scanner_tickets t
                WHERE t.id = ticket_id AND t.user_id = auth.uid() AND t.status = 'needs_review')
  );

-- ---------------------------------------------------------------------------
-- 3. Funciones de usuario (identidad SOLO por auth.uid(); search_path fijo)
-- ---------------------------------------------------------------------------

-- Crea (idempotente por clave) un ticket en el ciclo ABIERTO del usuario.
CREATE OR REPLACE FUNCTION public.fn_scanner_create_ticket(p_idempotency_key uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_cycle  uuid;
  v_ticket public.scanner_tickets;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED'); END IF;
  IF p_idempotency_key IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'INVALID_KEY'); END IF;

  SELECT * INTO v_ticket FROM public.scanner_tickets WHERE user_id = v_uid AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'ticketId', v_ticket.id, 'cycleId', v_ticket.cycle_id);
  END IF;

  SELECT id INTO v_cycle FROM public.months
  WHERE user_id = v_uid AND status = 'open'
  ORDER BY year DESC, month DESC LIMIT 1;
  IF v_cycle IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'NO_OPEN_CYCLE'); END IF;

  INSERT INTO public.scanner_tickets (user_id, cycle_id, idempotency_key)
  VALUES (v_uid, v_cycle, p_idempotency_key)
  ON CONFLICT (user_id, idempotency_key) DO NOTHING
  RETURNING * INTO v_ticket;
  IF NOT FOUND THEN
    SELECT * INTO v_ticket FROM public.scanner_tickets WHERE user_id = v_uid AND idempotency_key = p_idempotency_key;
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'ticketId', v_ticket.id, 'cycleId', v_ticket.cycle_id);
  END IF;
  RETURN jsonb_build_object('ok', true, 'idempotent', false, 'ticketId', v_ticket.id, 'cycleId', v_ticket.cycle_id);
END
$$;

-- Registra que el original ya está en storage (initiated → uploaded). La ruta debe ser `<uid>/<ticket>/<objeto>`.
CREATE OR REPLACE FUNCTION public.fn_scanner_register_upload(p_ticket_id uuid, p_object_path text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_t   public.scanner_tickets;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED'); END IF;
  SELECT * INTO v_t FROM public.scanner_tickets WHERE id = p_ticket_id AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'TICKET_NOT_FOUND'); END IF;
  IF v_t.status = 'uploaded' AND v_t.object_path = p_object_path THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true);
  END IF;
  IF v_t.status <> 'initiated' THEN RETURN jsonb_build_object('ok', false, 'code', 'ILLEGAL_TRANSITION'); END IF;
  IF p_object_path IS NULL OR p_object_path NOT LIKE v_uid::text || '/' || v_t.id::text || '/%'
     OR char_length(p_object_path) > 200 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_PATH');
  END IF;

  UPDATE public.scanner_tickets
  SET status = 'uploaded', original_storage = 'present', object_path = p_object_path, updated_at = now()
  WHERE id = v_t.id;
  RETURN jsonb_build_object('ok', true, 'idempotent', false);
END
$$;

-- uploaded → processing y consumo de cuota en UNA transacción. Límite 5 por ciclo (months.id).
-- Serializa por ciclo bloqueando la fila de months; repetir con el mismo ticket no consume de nuevo.
CREATE OR REPLACE FUNCTION public.fn_scanner_start_processing(p_ticket_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  c_limit constant integer := 5;
  v_uid   uuid := auth.uid();
  v_t     public.scanner_tickets;
  v_cstat text;
  v_used  integer;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED'); END IF;

  SELECT * INTO v_t FROM public.scanner_tickets WHERE id = p_ticket_id AND user_id = v_uid;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'TICKET_NOT_FOUND'); END IF;

  -- Bloqueo del ciclo (orden fijo: months → ticket) y relectura del ticket ya bajo bloqueo.
  SELECT status INTO v_cstat FROM public.months WHERE id = v_t.cycle_id AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'INVALID_CYCLE'); END IF;
  SELECT * INTO v_t FROM public.scanner_tickets WHERE id = p_ticket_id AND user_id = v_uid FOR UPDATE;

  IF v_t.status = 'processing' AND EXISTS (
       SELECT 1 FROM public.scanner_quota_ledger WHERE ticket_id = v_t.id AND kind = 'consume') THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true);
  END IF;
  IF v_t.status <> 'uploaded' THEN RETURN jsonb_build_object('ok', false, 'code', 'ILLEGAL_TRANSITION'); END IF;
  IF v_cstat <> 'open' THEN RETURN jsonb_build_object('ok', false, 'code', 'CYCLE_CLOSED'); END IF;
  IF v_t.expires_at <= now() THEN RETURN jsonb_build_object('ok', false, 'code', 'TICKET_EXPIRED'); END IF;

  SELECT COALESCE(SUM(CASE kind WHEN 'consume' THEN 1 ELSE -1 END), 0) INTO v_used
  FROM public.scanner_quota_ledger WHERE cycle_id = v_t.cycle_id AND user_id = v_uid;
  IF v_used >= c_limit THEN RETURN jsonb_build_object('ok', false, 'code', 'QUOTA_EXCEEDED'); END IF;

  INSERT INTO public.scanner_quota_ledger (user_id, cycle_id, ticket_id, kind)
  VALUES (v_uid, v_t.cycle_id, v_t.id, 'consume');
  UPDATE public.scanner_tickets
  SET status = 'processing', attempt_count = attempt_count + 1, updated_at = now()
  WHERE id = v_t.id;

  RETURN jsonb_build_object('ok', true, 'idempotent', false, 'used', v_used + 1, 'remaining', c_limit - v_used - 1);
END
$$;

-- Cuota del ciclo ABIERTO actual del usuario.
CREATE OR REPLACE FUNCTION public.fn_scanner_quota_status()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  c_limit constant integer := 5;
  v_uid   uuid := auth.uid();
  v_cycle uuid;
  v_used  integer;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED'); END IF;
  SELECT id INTO v_cycle FROM public.months
  WHERE user_id = v_uid AND status = 'open' ORDER BY year DESC, month DESC LIMIT 1;
  IF v_cycle IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'NO_OPEN_CYCLE'); END IF;
  SELECT GREATEST(0, COALESCE(SUM(CASE kind WHEN 'consume' THEN 1 ELSE -1 END), 0)) INTO v_used
  FROM public.scanner_quota_ledger WHERE cycle_id = v_cycle AND user_id = v_uid;
  RETURN jsonb_build_object('ok', true, 'cycleId', v_cycle, 'limit', c_limit, 'used', v_used,
                            'remaining', GREATEST(0, c_limit - v_used));
END
$$;

-- ---------------------------------------------------------------------------
-- 4. Funciones de limpieza (SOLO service_role)
-- ---------------------------------------------------------------------------

-- Confirma un borrador revisado y crea todos los gastos de sus grupos en UNA transacción.
-- La llamada a fn_create_expense y el vínculo idempotente quedan dentro de esta función.
CREATE OR REPLACE FUNCTION public.fn_scanner_confirm_ticket(
  p_ticket_id uuid,
  p_confirm_key uuid,
  p_draft_version integer
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_t         public.scanner_tickets;
  v_cycle     text;
  v_group     record;
  v_expense   public.expenses;
  v_expenses  jsonb := '[]'::jsonb;
  v_sum       bigint := 0;
  v_group_no  smallint := 0;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED'); END IF;
  IF p_ticket_id IS NULL OR p_confirm_key IS NULL OR p_draft_version IS NULL OR p_draft_version < 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_KEY');
  END IF;

  SELECT * INTO v_t FROM public.scanner_tickets WHERE id = p_ticket_id AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'TICKET_NOT_FOUND'); END IF;

  IF v_t.status = 'confirmed' THEN
    IF v_t.confirm_key <> p_confirm_key THEN
      RETURN jsonb_build_object('ok', false, 'code', 'IDEMPOTENCY_KEY_REUSED');
    END IF;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('expenseId', expense_id, 'category', category,
                                                  'amountCents', amount_cents) ORDER BY group_no), '[]'::jsonb)
      INTO v_expenses FROM public.scanner_expense_links WHERE ticket_id = v_t.id;
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'status', 'confirmed', 'expenses', v_expenses);
  END IF;

  IF v_t.status <> 'needs_review' THEN RETURN jsonb_build_object('ok', false, 'code', 'ILLEGAL_TRANSITION'); END IF;
  IF v_t.draft_version <> p_draft_version THEN RETURN jsonb_build_object('ok', false, 'code', 'VERSION_CONFLICT'); END IF;
  IF v_t.merchant IS NULL OR char_length(btrim(v_t.merchant)) = 0 OR v_t.receipt_date IS NULL
     OR v_t.total_cents IS NULL OR v_t.currency <> 'EUR' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_ERROR');
  END IF;

  SELECT status INTO v_cycle FROM public.months WHERE id = v_t.cycle_id AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND OR v_cycle IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'INVALID_CYCLE'); END IF;
  IF v_cycle <> 'open' THEN RETURN jsonb_build_object('ok', false, 'code', 'CYCLE_CLOSED'); END IF;

  IF EXISTS (
    SELECT 1 FROM public.scanner_ticket_lines l
    WHERE l.ticket_id = v_t.id
      AND (jsonb_typeof(l.allocations) <> 'array'
        OR (jsonb_array_length(l.allocations) = 0 AND l.category IS NULL)
        OR (jsonb_array_length(l.allocations) > 0 AND l.category IS NOT NULL)
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(l.allocations) part
          WHERE jsonb_typeof(part) <> 'object'
             OR part->>'category' NOT IN ('survival','optional','culture','extra')
             OR part->>'amountCents' IS NULL
             OR part->>'amountCents' !~ '^-?[0-9]+$'
        )
      )
  ) THEN RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_ERROR'); END IF;

  SELECT COALESCE(SUM(amount_cents), 0) INTO v_sum
  FROM (
    SELECT l.amount_cents FROM public.scanner_ticket_lines l
    WHERE l.ticket_id = v_t.id AND jsonb_array_length(l.allocations) = 0 AND l.category IS NOT NULL
    UNION ALL
    SELECT (part->>'amountCents')::bigint
    FROM public.scanner_ticket_lines l CROSS JOIN LATERAL jsonb_array_elements(l.allocations) part
    WHERE l.ticket_id = v_t.id
  ) parts;
  IF v_sum <> v_t.total_cents OR v_sum <= 0 THEN RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_ERROR'); END IF;

  FOR v_group IN
    SELECT category, SUM(amount_cents)::bigint AS amount_cents
    FROM (
      SELECT l.category, l.amount_cents FROM public.scanner_ticket_lines l
      WHERE l.ticket_id = v_t.id AND jsonb_array_length(l.allocations) = 0
      UNION ALL
      SELECT part->>'category', (part->>'amountCents')::bigint
      FROM public.scanner_ticket_lines l CROSS JOIN LATERAL jsonb_array_elements(l.allocations) part
      WHERE l.ticket_id = v_t.id
    ) grouped_parts
    GROUP BY category ORDER BY category
  LOOP
    v_group_no := v_group_no + 1;
    IF v_group.amount_cents <= 0 OR v_group_no > 4 THEN
      RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_ERROR');
    END IF;
    SELECT * INTO v_expense FROM public.fn_create_expense(
      v_t.cycle_id, v_t.receipt_date, v_group.amount_cents / 100.0, v_group.category,
      btrim(v_t.merchant), NULL, NULL
    );
    INSERT INTO public.scanner_expense_links (ticket_id, user_id, cycle_id, expense_id, group_no, category, amount_cents)
    VALUES (v_t.id, v_uid, v_t.cycle_id, v_expense.id, v_group_no, v_group.category, v_group.amount_cents);
    v_expenses := v_expenses || jsonb_build_array(jsonb_build_object(
      'expenseId', v_expense.id, 'category', v_group.category, 'amountCents', v_group.amount_cents));
  END LOOP;

  IF v_group_no = 0 THEN RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_ERROR'); END IF;

  UPDATE public.scanner_tickets
  SET status = 'confirmed', confirm_key = p_confirm_key, confirmed_at = now(), has_draft = false,
      original_storage = CASE WHEN original_storage = 'present' THEN 'deletion_pending' ELSE original_storage END,
      updated_at = now()
  WHERE id = v_t.id;
  RETURN jsonb_build_object('ok', true, 'idempotent', false, 'status', 'confirmed', 'expenses', v_expenses);
END
$$;

-- Candidatos: caducados (24 h) o pendientes de un ciclo CERRADO. Derivado del estado real de months, no de un
-- hook en el cierre: da igual cómo se cerrara el ciclo. Incluye los que ya están `expired` por reintentar.
CREATE OR REPLACE FUNCTION public.fn_scanner_cleanup_candidates(p_now timestamptz DEFAULT now(), p_limit integer DEFAULT 100)
RETURNS TABLE (
  ticket_id uuid, user_id uuid, cycle_id uuid, status text, status_reason text, attempt_count smallint,
  original_storage text, has_draft boolean, object_path text, created_at timestamptz, reason text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT t.id, t.user_id, t.cycle_id, t.status, t.status_reason, t.attempt_count, t.original_storage,
         t.has_draft, t.object_path, t.created_at,
         CASE WHEN t.status = 'confirmed' THEN 'post_confirm'
              WHEN m.status = 'closed' THEN 'cycle_closed' ELSE 'ttl_expired' END
  FROM public.scanner_tickets t
  JOIN public.months m ON m.id = t.cycle_id
  WHERE (t.status IN ('initiated','uploaded','processing','needs_review','failed','expired')
         AND (m.status = 'closed' OR t.expires_at <= p_now))
     OR (t.status = 'confirmed' AND t.original_storage = 'deletion_pending')
  ORDER BY t.created_at
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500)
$$;

-- Marca el borrado como pendiente (el original aún no se ha comprobado ausente). Idempotente.
CREATE OR REPLACE FUNCTION public.fn_scanner_mark_deletion_pending(p_ticket_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_t public.scanner_tickets;
BEGIN
  IF p_reason NOT IN ('ttl_expired','cycle_closed','post_confirm') THEN RETURN jsonb_build_object('ok', false, 'code', 'INVALID_REASON'); END IF;
  SELECT * INTO v_t FROM public.scanner_tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'TICKET_NOT_FOUND'); END IF;
  IF v_t.status = 'deleted' THEN RETURN jsonb_build_object('ok', true, 'idempotent', true); END IF;
  IF v_t.status = 'confirmed' AND p_reason <> 'post_confirm' THEN RETURN jsonb_build_object('ok', true, 'idempotent', true); END IF;

  UPDATE public.scanner_tickets
  SET status = CASE WHEN p_reason = 'ttl_expired' AND status NOT IN ('processing','expired') THEN 'expired' ELSE status END,
      status_reason = CASE WHEN p_reason = 'post_confirm' THEN status_reason ELSE p_reason END,
      original_storage = CASE WHEN original_storage = 'present' THEN 'deletion_pending' ELSE original_storage END,
      updated_at = now()
  WHERE id = v_t.id;
  RETURN jsonb_build_object('ok', true, 'idempotent', false);
END
$$;

-- Cierra el borrado del original después de confirmar un gasto. Mantiene el ticket confirmado como tombstone
-- de trazabilidad; el llamador debe haber comprobado de forma independiente que el objeto ya no existe.
CREATE OR REPLACE FUNCTION public.fn_scanner_finalize_confirmed_original(p_ticket_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_t public.scanner_tickets;
BEGIN
  SELECT * INTO v_t FROM public.scanner_tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'TICKET_NOT_FOUND'); END IF;
  IF v_t.status <> 'confirmed' THEN RETURN jsonb_build_object('ok', false, 'code', 'ILLEGAL_TRANSITION'); END IF;
  IF v_t.original_storage = 'deleted_verified' THEN RETURN jsonb_build_object('ok', true, 'idempotent', true); END IF;
  IF v_t.original_storage <> 'deletion_pending' THEN RETURN jsonb_build_object('ok', false, 'code', 'ORIGINAL_NOT_PENDING'); END IF;

  DELETE FROM public.scanner_ticket_lines WHERE ticket_id = v_t.id;
  UPDATE public.scanner_tickets
  SET original_storage = 'deleted_verified', deletion_verified_at = now(), object_path = NULL,
      has_draft = false, updated_at = now()
  WHERE id = v_t.id;
  RETURN jsonb_build_object('ok', true, 'idempotent', false);
END
$$;

-- Cierra el borrado. El LLAMADOR debe haber comprobado de forma independiente que el objeto ya no existe.
-- Elimina las líneas (datos financieros) y deja el ticket como tombstone `deleted`. Idempotente.
CREATE OR REPLACE FUNCTION public.fn_scanner_finalize_deletion(p_ticket_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_t public.scanner_tickets;
BEGIN
  IF p_reason NOT IN ('ttl_expired','cycle_closed') THEN RETURN jsonb_build_object('ok', false, 'code', 'INVALID_REASON'); END IF;
  SELECT * INTO v_t FROM public.scanner_tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'TICKET_NOT_FOUND'); END IF;
  IF v_t.status = 'deleted' THEN RETURN jsonb_build_object('ok', true, 'idempotent', true); END IF;
  IF v_t.status = 'confirmed' THEN RETURN jsonb_build_object('ok', false, 'code', 'ILLEGAL_TRANSITION'); END IF;

  DELETE FROM public.scanner_ticket_lines WHERE ticket_id = v_t.id;
  UPDATE public.scanner_tickets
  SET status = 'deleted',
      status_reason = p_reason,
      original_storage = CASE WHEN original_storage = 'none' THEN 'none' ELSE 'deleted_verified' END,
      deletion_verified_at = CASE WHEN original_storage = 'none' THEN deletion_verified_at ELSE now() END,
      object_path = NULL,
      has_draft = false,
      deleted_at = now(),
      updated_at = now()
  WHERE id = v_t.id;
  RETURN jsonb_build_object('ok', true, 'idempotent', false);
END
$$;

-- ---------------------------------------------------------------------------
-- 5. ACL de funciones (en Supabase las funciones nuevas heredan EXECUTE para anon/authenticated)
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.fn_scanner_create_ticket(uuid)            FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_scanner_register_upload(uuid, text)    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_scanner_start_processing(uuid)         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_scanner_quota_status()                 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_scanner_confirm_ticket(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_scanner_cleanup_candidates(timestamptz, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_scanner_mark_deletion_pending(uuid, text)        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_scanner_finalize_deletion(uuid, text)            FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_scanner_finalize_confirmed_original(uuid)         FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.fn_scanner_create_ticket(uuid)         TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_scanner_register_upload(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_scanner_start_processing(uuid)      TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_scanner_quota_status()              TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_scanner_confirm_ticket(uuid, uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_scanner_cleanup_candidates(timestamptz, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_scanner_mark_deletion_pending(uuid, text)        TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_scanner_finalize_deletion(uuid, text)            TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_scanner_finalize_confirmed_original(uuid)         TO service_role;

-- ---------------------------------------------------------------------------
-- 6. storage.objects — SOLO el bucket `kakebo-ticket-temp` (privado, creado a mano)
-- ---------------------------------------------------------------------------
-- Ruta exigida: `<auth.uid()>/<ticket_id>/<objeto>` (exactamente 2 carpetas). Sin política UPDATE (no hay
-- sobrescritura/upsert) ni acceso `anon`. El borrado de caducados lo hace el servidor con service_role (BYPASSRLS).
DROP POLICY IF EXISTS "scanner_ticket_temp_insert_own" ON storage.objects;
CREATE POLICY "scanner_ticket_temp_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kakebo-ticket-temp'
    AND array_length(storage.foldername(name), 1) = 2
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.scanner_tickets t
      WHERE t.id::text = (storage.foldername(name))[2] AND t.user_id = auth.uid() AND t.status = 'initiated'
    )
  );

DROP POLICY IF EXISTS "scanner_ticket_temp_select_own" ON storage.objects;
CREATE POLICY "scanner_ticket_temp_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'kakebo-ticket-temp'
    AND array_length(storage.foldername(name), 1) = 2
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.scanner_tickets t
      WHERE t.id::text = (storage.foldername(name))[2] AND t.user_id = auth.uid() AND t.status <> 'deleted'
    )
  );

DROP POLICY IF EXISTS "scanner_ticket_temp_delete_own" ON storage.objects;
CREATE POLICY "scanner_ticket_temp_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'kakebo-ticket-temp'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
