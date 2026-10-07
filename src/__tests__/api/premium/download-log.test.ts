// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("@/lib/logger", () => ({ apiLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));

// In-memory model of public.premium_downloads with the unique index (purchase_id, file_id, request_bucket).
const store = vi.hoisted(() => ({
  rows: [] as { purchase_id: string; file_id: string; request_bucket: number }[],
  upsertCalls: [] as { row: Record<string, unknown>; opts: Record<string, unknown> }[],
  signed: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== "premium_downloads") throw new Error("unexpected table " + table);
      return {
        upsert: async (row: { purchase_id: string; file_id: string; request_bucket: number }, opts: Record<string, unknown>) => {
          store.upsertCalls.push({ row, opts });
          const dup = store.rows.some(
            (r) => r.purchase_id === row.purchase_id && r.file_id === row.file_id && r.request_bucket === row.request_bucket
          );
          if (!dup) store.rows.push(row);
          return { error: null };
        },
      };
    },
    storage: { from: () => ({ createSignedUrl: store.signed }) },
  }),
}));

const findPurchaseByToken = vi.hoisted(() => vi.fn());
vi.mock("@/lib/premium/purchases", async (orig) => {
  const actual = await orig<typeof import("@/lib/premium/purchases")>();
  return { ...actual, findPurchaseByToken };
});

import { GET } from "@/app/api/premium/download/route";
import { PREMIUM_ACCESS_COOKIE, DOWNLOAD_DEDUPE_WINDOW_MS, downloadBucket } from "@/lib/premium/purchases";
import { PREMIUM_PACK_FILES } from "@/lib/premium/manifest";

const SIGNED = "https://example.supabase.co/storage/v1/object/sign/kakebo-premium/x?token=SIGNED_SECRET_123";

const req = (file: string, opts: { cookie?: string | null; method?: string } = {}) =>
  new Request("http://localhost:3000/api/premium/download?file=" + file, {
    method: opts.method ?? "GET",
    headers: opts.cookie === null ? {} : { cookie: PREMIUM_ACCESS_COOKIE + "=" + (opts.cookie ?? "GOODTOKEN") },
  });

beforeEach(() => {
  vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "true");
  store.rows.length = 0;
  store.upsertCalls.length = 0;
  store.signed.mockReset().mockResolvedValue({ data: { signedUrl: SIGNED }, error: null });
  findPurchaseByToken.mockReset().mockImplementation(async (t: string) => (t === "GOODTOKEN" ? { purchaseId: "p1" } : null));
});
afterEach(() => vi.useRealTimers());

describe("premium_downloads — authorized deliveries are logged", () => {
  it.each(PREMIUM_PACK_FILES.map((f) => f.id))("file=%s: 302 + exactly one row", async (id) => {
    const res = await GET(req(id));
    expect(res.status).toBe(302);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]).toMatchObject({ purchase_id: "p1", file_id: id });
  });

  it("the three files of one purchase produce three rows", async () => {
    for (const f of PREMIUM_PACK_FILES) await GET(req(f.id));
    expect(store.rows.map((r) => r.file_id).sort()).toEqual(["ebook", "excel", "tutorial"]);
  });

  it("a technical retry of the same download (same bucket) adds no row", async () => {
    await GET(req("excel"));
    await GET(req("excel"));
    await Promise.all([GET(req("excel")), GET(req("excel"))]);
    expect(store.rows).toHaveLength(1);
  });

  it("a later, distinct download of the same file is logged again", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-07T12:00:00Z"));
    await GET(req("excel"));
    vi.setSystemTime(new Date(Date.now() + DOWNLOAD_DEDUPE_WINDOW_MS + 1000));
    await GET(req("excel"));
    expect(store.rows).toHaveLength(2);
    expect(new Set(store.rows.map((r) => r.request_bucket)).size).toBe(2);
  });

  it("calls the logger exactly once per request and relies on on-conflict-do-nothing", async () => {
    await GET(req("ebook"));
    expect(store.upsertCalls).toHaveLength(1);
    expect(store.upsertCalls[0].opts).toMatchObject({ onConflict: "purchase_id,file_id,request_bucket", ignoreDuplicates: true });
  });

  it("a HEAD probe is not a download: it is not logged", async () => {
    const res = await GET(req("excel", { method: "HEAD" }));
    expect(res.status).toBe(302);
    expect(store.rows).toHaveLength(0);
  });

  it("stores only purchase, file and bucket: no token, cookie or URL", async () => {
    await GET(req("excel"));
    const stored = JSON.stringify(store.upsertCalls);
    expect(Object.keys(store.upsertCalls[0].row).sort()).toEqual(["file_id", "purchase_id", "request_bucket"]);
    expect(stored).not.toContain("GOODTOKEN");
    expect(stored).not.toContain("SIGNED_SECRET");
    expect(stored).not.toMatch(/https?:/);
  });

  it("bucket math is stable inside a window and changes across windows", () => {
    expect(downloadBucket(0)).toBe(downloadBucket(DOWNLOAD_DEDUPE_WINDOW_MS - 1));
    expect(downloadBucket(DOWNLOAD_DEDUPE_WINDOW_MS)).toBe(downloadBucket(0) + 1);
  });
});

describe("premium_downloads — nothing is logged when access is denied", () => {
  it("no cookie: 403, no row, no signed URL", async () => {
    const res = await GET(req("excel", { cookie: null }));
    expect(res.status).toBe(403);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(store.rows).toHaveLength(0);
    expect(store.signed).not.toHaveBeenCalled();
  });

  it("revoked token after a refund (purchase no longer paid): 403, no row", async () => {
    findPurchaseByToken.mockResolvedValue(null);
    const res = await GET(req("excel", { cookie: "WAS_VALID_BEFORE_REFUND" }));
    expect(res.status).toBe(403);
    expect(store.rows).toHaveLength(0);
    expect(store.signed).not.toHaveBeenCalled();
  });

  it("file outside the manifest: 400, no row", async () => {
    const res = await GET(req("../../etc/passwd"));
    expect(res.status).toBe(400);
    expect(store.rows).toHaveLength(0);
  });

  it("signing failure: 503, no row (only successful deliveries are logged)", async () => {
    store.signed.mockResolvedValue({ data: null, error: { message: "boom" } });
    const res = await GET(req("excel"));
    expect(res.status).toBe(503);
    expect(store.rows).toHaveLength(0);
  });

  it("a failure of the log itself never blocks the paid download", async () => {
    store.upsertCalls.length = 0;
    vi.doMock("@/lib/premium/purchases", async (orig) => {
      const actual = await orig<typeof import("@/lib/premium/purchases")>();
      return { ...actual, findPurchaseByToken, insertDownload: async () => { throw new Error("db down"); } };
    });
    vi.resetModules();
    const { GET: guarded } = await import("@/app/api/premium/download/route");
    const res = await guarded(req("excel"));
    expect(res.status).toBe(302);
    vi.doUnmock("@/lib/premium/purchases");
  });
});
