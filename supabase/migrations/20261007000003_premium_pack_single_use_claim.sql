-- Premium pack: single-use claim of a purchase.
-- A Stripe Checkout session id may be exchanged for an access token exactly once. The check and the
-- token creation happen in one transaction; `for update` serializes concurrent claims, so two
-- simultaneous requests can never both succeed. Refunded/disputed purchases cannot be claimed.

alter table public.premium_purchases
  add column if not exists claimed_at timestamptz;

create or replace function public.claim_premium_purchase(p_session_id text, p_token_hash text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_status text;
  v_claimed timestamptz;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return 'invalid';
  end if;

  select id, status, claimed_at
    into v_id, v_status, v_claimed
    from public.premium_purchases
   where stripe_session_id = p_session_id
   for update;

  if not found then return 'not_found'; end if;
  if v_status <> 'paid' then return 'not_paid'; end if;
  if v_claimed is not null then return 'already_claimed'; end if;

  insert into public.premium_access_tokens (purchase_id, token_hash) values (v_id, p_token_hash);
  update public.premium_purchases set claimed_at = now(), updated_at = now() where id = v_id;
  return 'claimed';
end;
$$;

revoke all on function public.claim_premium_purchase(text, text) from public, anon, authenticated;
grant execute on function public.claim_premium_purchase(text, text) to service_role;
