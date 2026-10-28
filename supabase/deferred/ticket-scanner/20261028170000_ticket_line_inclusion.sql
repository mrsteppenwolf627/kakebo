-- SCANNER FOLLOW-UP — permitir excluir líneas compartidas antes de confirmar.
--
-- Aplicar después de 20261027120000_ticket_scanner_persistence.sql.
-- No borra datos existentes: las líneas actuales quedan incluidas por defecto.

ALTER TABLE public.scanner_ticket_lines
  ADD COLUMN IF NOT EXISTS include_in_expenses boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.scanner_ticket_lines.include_in_expenses IS
  'Si es false, la línea permanece en la revisión pero no se convierte en gasto al confirmar el ticket.';

CREATE OR REPLACE FUNCTION public.fn_scanner_replace_draft(
  p_ticket_id uuid,
  p_draft_version integer,
  p_merchant text,
  p_receipt_date date,
  p_total_cents bigint,
  p_lines jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_t public.scanner_tickets;
  v_line jsonb;
  v_part jsonb;
  v_position smallint := 0;
  v_alloc_sum bigint;
  v_amount bigint;
  v_allocations jsonb;
  v_include boolean;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED'); END IF;
  IF p_ticket_id IS NULL OR p_draft_version IS NULL OR p_draft_version < 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_KEY');
  END IF;
  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) > 100
     OR (p_merchant IS NOT NULL AND char_length(p_merchant) > 120)
     OR (p_total_cents IS NOT NULL AND p_total_cents <= 0) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_ERROR');
  END IF;

  SELECT * INTO v_t FROM public.scanner_tickets WHERE id = p_ticket_id AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'TICKET_NOT_FOUND'); END IF;
  IF v_t.status <> 'needs_review' THEN RETURN jsonb_build_object('ok', false, 'code', 'ILLEGAL_TRANSITION'); END IF;
  IF v_t.draft_version <> p_draft_version THEN RETURN jsonb_build_object('ok', false, 'code', 'VERSION_CONFLICT'); END IF;

  FOR v_line IN SELECT value FROM jsonb_array_elements(p_lines)
  LOOP
    IF jsonb_typeof(v_line) <> 'object'
       OR v_line->>'amountCents' IS NULL OR v_line->>'amountCents' !~ '^-?[0-9]+$'
       OR (v_line->>'amountCents')::bigint = 0
       OR v_line->>'kind' NOT IN ('item','adjustment')
       OR v_line->'allocations' IS NULL OR jsonb_typeof(v_line->'allocations') <> 'array'
       OR (v_line->>'description' IS NOT NULL AND char_length(v_line->>'description') > 200)
       OR (v_line->>'categoryProposal' IS NOT NULL AND v_line->>'categoryProposal' NOT IN ('survival','optional','culture','extra'))
       OR (v_line->>'category' IS NOT NULL AND v_line->>'category' NOT IN ('survival','optional','culture','extra'))
       OR (v_line->>'includeInExpenses' IS NOT NULL AND v_line->>'includeInExpenses' NOT IN ('true','false')) THEN
      RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_ERROR');
    END IF;

    v_include := COALESCE((v_line->>'includeInExpenses')::boolean, true);
    v_amount := (v_line->>'amountCents')::bigint;
    v_allocations := v_line->'allocations';
    IF v_include AND jsonb_array_length(v_allocations) = 0 THEN
      IF v_line->>'category' IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_ERROR'); END IF;
    ELSIF v_include THEN
      IF v_line->>'category' IS NOT NULL OR jsonb_array_length(v_allocations) < 2 THEN
        RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_ERROR');
      END IF;
      v_alloc_sum := 0;
      FOR v_part IN SELECT value FROM jsonb_array_elements(v_allocations)
      LOOP
        IF jsonb_typeof(v_part) <> 'object'
           OR v_part->>'category' NOT IN ('survival','optional','culture','extra')
           OR v_part->>'amountCents' IS NULL OR v_part->>'amountCents' !~ '^-?[0-9]+$'
           OR (v_part->>'amountCents')::bigint = 0 THEN
          RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_ERROR');
        END IF;
        v_alloc_sum := v_alloc_sum + (v_part->>'amountCents')::bigint;
      END LOOP;
      IF v_alloc_sum <> v_amount THEN RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_ERROR'); END IF;
    END IF;
    v_position := v_position + 1;
  END LOOP;

  DELETE FROM public.scanner_ticket_lines WHERE ticket_id = v_t.id;
  v_position := 0;
  FOR v_line IN SELECT value FROM jsonb_array_elements(p_lines)
  LOOP
    INSERT INTO public.scanner_ticket_lines (
      ticket_id, user_id, position, kind, description, amount_cents,
      category_proposal, category, allocations, include_in_expenses
    ) VALUES (
      v_t.id, v_uid, v_position, v_line->>'kind', NULLIF(v_line->>'description',''),
      (v_line->>'amountCents')::bigint, NULLIF(v_line->>'categoryProposal',''),
      NULLIF(v_line->>'category',''), COALESCE(v_line->'allocations','[]'::jsonb),
      COALESCE((v_line->>'includeInExpenses')::boolean, true)
    );
    v_position := v_position + 1;
  END LOOP;

  UPDATE public.scanner_tickets
  SET merchant = p_merchant, receipt_date = p_receipt_date, total_cents = p_total_cents,
      draft_version = draft_version + 1, has_draft = true, updated_at = now()
  WHERE id = v_t.id;
  RETURN jsonb_build_object('ok', true, 'draftVersion', v_t.draft_version + 1);
END
$$;

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
    WHERE l.ticket_id = v_t.id AND l.include_in_expenses
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

  IF EXISTS (
    SELECT 1 FROM public.scanner_ticket_lines l
    CROSS JOIN LATERAL jsonb_array_elements(l.allocations) part
    WHERE l.ticket_id = v_t.id AND l.include_in_expenses
    GROUP BY l.id, l.amount_cents
    HAVING COALESCE(SUM((part->>'amountCents')::bigint), 0) <> l.amount_cents
  ) THEN RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_ERROR'); END IF;

  SELECT COALESCE(SUM(amount_cents), 0) INTO v_sum
  FROM (
    SELECT l.amount_cents FROM public.scanner_ticket_lines l
    WHERE l.ticket_id = v_t.id AND l.include_in_expenses AND jsonb_array_length(l.allocations) = 0 AND l.category IS NOT NULL
    UNION ALL
    SELECT (part->>'amountCents')::bigint
    FROM public.scanner_ticket_lines l CROSS JOIN LATERAL jsonb_array_elements(l.allocations) part
    WHERE l.ticket_id = v_t.id AND l.include_in_expenses
  ) parts;
  IF v_sum > v_t.total_cents OR v_sum <= 0 THEN RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_ERROR'); END IF;

  FOR v_group IN
    SELECT category, SUM(amount_cents)::bigint AS amount_cents
    FROM (
      SELECT l.category, l.amount_cents FROM public.scanner_ticket_lines l
      WHERE l.ticket_id = v_t.id AND l.include_in_expenses AND jsonb_array_length(l.allocations) = 0
      UNION ALL
      SELECT part->>'category', (part->>'amountCents')::bigint
      FROM public.scanner_ticket_lines l CROSS JOIN LATERAL jsonb_array_elements(l.allocations) part
      WHERE l.ticket_id = v_t.id AND l.include_in_expenses
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
  SET status = 'confirmed', confirm_key = p_confirm_key, confirmed_at = now(), has_draft = false
  WHERE id = v_t.id;
  RETURN jsonb_build_object('ok', true, 'idempotent', false, 'status', 'confirmed', 'expenses', v_expenses);
END
$$;

REVOKE ALL ON FUNCTION public.fn_scanner_confirm_ticket(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_scanner_replace_draft(uuid, integer, text, date, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_scanner_confirm_ticket(uuid, uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_scanner_replace_draft(uuid, integer, text, date, bigint, jsonb) TO authenticated, service_role;
