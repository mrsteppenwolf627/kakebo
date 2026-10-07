-- premium_downloads: one row per authorized download, never one per technical retry.
-- `request_bucket` is a 10-second time bucket (floor(epoch_ms / 10000)) computed by the server.
-- The unique index makes (purchase, file, bucket) idempotent: the same download retried within the
-- same bucket (browser/network retry, redirect replay) collapses into one row via
-- `insert ... on conflict do nothing`. Distinct downloads, even of the same file, fall in other
-- buckets and are all recorded. Pre-existing rows keep request_bucket NULL (NULLs never collide).

alter table public.premium_downloads
  add column if not exists request_bucket bigint;

create unique index if not exists premium_downloads_dedupe_idx
  on public.premium_downloads (purchase_id, file_id, request_bucket);
