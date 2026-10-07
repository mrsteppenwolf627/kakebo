-- Premium pack tables: explicit privileges for the server-side service role.
-- Found in staging: service_role had no table privileges, so the webhook failed with 42501.
-- anon/authenticated stay without any privilege (see 20261007_premium_pack_purchases.sql).
grant select, insert, update, delete on public.premium_purchases to service_role;
grant select, insert, update, delete on public.premium_access_tokens to service_role;
grant select, insert, update, delete on public.premium_webhook_events to service_role;
grant select, insert, update, delete on public.premium_downloads to service_role;
