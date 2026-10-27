// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  PrivateTicketBucket,
  SCANNER_MAX_UPLOAD_BYTES,
  SCANNER_TICKET_BUCKET,
  SIGNED_URL_MAX_TTL_SECONDS,
  buildObjectPath,
  type StorageBucketApi,
} from "@/lib/scanner/storage-adapter";
import { confirmScannerTicket, createScannerTicket, getScannerQuotaStatus, startScannerProcessing, type RpcClientLike } from "@/lib/scanner/persistence";
import { runScannerCleanup, toRetainedTicket, type CleanupCandidateRow } from "@/lib/scanner/cleanup";
import { planToExpenseInputs } from "@/lib/scanner/expense-contract";
import { SCANNER_CYCLE_TICKET_LIMIT } from "@/lib/scanner/quota";
import { azureReceiptDisabledAdapter } from "@/lib/scanner/azure-receipt-contract";

const U = "11111111-1111-4111-8111-111111111111";
const T = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";

/** Bucket en memoria con las mismas operaciones que usa el adaptador. */
function fakeStorage(opts: { failRemove?: boolean; keepAfterRemove?: boolean } = {}) {
  const objects = new Map<string, number>();
  const calls: string[] = [];
  const api: StorageBucketApi = {
    async upload(path, body, o) {
      calls.push(`upload:${o.upsert}:${o.contentType}`);
      if (objects.has(path) && !o.upsert) return { data: null, error: { message: "exists" } };
      objects.set(path, (body as Uint8Array).byteLength);
      return { data: {}, error: null };
    },
    async createSignedUrl(path, ttl) {
      calls.push(`sign:${ttl}`);
      return { data: { signedUrl: `https://signed.invalid/${path}?t=${ttl}` }, error: null };
    },
    async remove(paths) {
      calls.push("remove");
      if (opts.failRemove) return { data: null, error: { message: "boom" } };
      if (!opts.keepAfterRemove) paths.forEach((p) => objects.delete(p));
      return { data: [], error: null };
    },
    async list(folder, o) {
      calls.push("list");
      const names = [...objects.keys()].filter((k) => k.startsWith(`${folder}/`)).map((k) => ({ name: k.slice(folder.length + 1) }));
      return { data: names.filter((n) => !o?.search || n.name.includes(o.search)), error: null };
    },
  };
  const from = vi.fn((bucket: string) => {
    calls.push(`from:${bucket}`);
    return api;
  });
  // Cualquier intento de URL pública haría fallar el test: el adaptador no debe tocar `getPublicUrl`.
  const client = { storage: { from } } as unknown as ConstructorParameters<typeof PrivateTicketBucket>[0];
  return { client, objects, calls, from };
}

describe("PrivateTicketBucket", () => {
  it("usa exactamente el bucket kakebo-ticket-temp y es privado", () => {
    const s = fakeStorage();
    const b = new PrivateTicketBucket(s.client);
    expect(SCANNER_TICKET_BUCKET).toBe("kakebo-ticket-temp");
    expect(s.from).toHaveBeenCalledWith("kakebo-ticket-temp");
    expect(b.visibility).toBe("private");
    expect("getPublicUrl" in b).toBe(false);
  });

  it("sube con ruta opaca <user>/<ticket>/<uuid>, sin sobrescribir", async () => {
    const s = fakeStorage();
    const r = await new PrivateTicketBucket(s.client).upload({ userId: U, ticketId: T, bytes: new Uint8Array(10), contentType: "image/jpeg" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.objectPath).toMatch(new RegExp(`^${U}/${T}/[0-9a-f-]{36}$`));
    expect(s.calls).toContain("upload:false:image/jpeg");
  });

  it("rechaza tipo no permitido, vacío, >5 MB e ids no UUID antes de tocar la red", async () => {
    const s = fakeStorage();
    const b = new PrivateTicketBucket(s.client);
    const ok = { userId: U, ticketId: T, bytes: new Uint8Array(10), contentType: "image/png" };
    expect(await b.upload({ ...ok, contentType: "application/pdf" })).toEqual({ ok: false, code: "UNSUPPORTED_TYPE" });
    expect(await b.upload({ ...ok, bytes: new Uint8Array(0) })).toEqual({ ok: false, code: "INVALID_INPUT" });
    expect(await b.upload({ ...ok, bytes: new Uint8Array(SCANNER_MAX_UPLOAD_BYTES + 1) })).toEqual({ ok: false, code: "TOO_LARGE" });
    expect(await b.upload({ ...ok, userId: "../x" })).toEqual({ ok: false, code: "INVALID_INPUT" });
    expect(s.calls.filter((c) => c.startsWith("upload"))).toHaveLength(0);
    expect(buildObjectPath(U, "no-uuid")).toBeNull();
  });

  it("URL firmada de vida corta con tope de 120 s y solo para rutas válidas", async () => {
    const s = fakeStorage();
    const b = new PrivateTicketBucket(s.client);
    const path = `${U}/${T}/${crypto.randomUUID()}`;
    const r = await b.createReadUrl(path, 99999);
    expect(r).toMatchObject({ ok: true, expiresInSeconds: SIGNED_URL_MAX_TTL_SECONDS });
    expect(s.calls).toContain(`sign:${SIGNED_URL_MAX_TTL_SECONDS}`);
    expect(await b.createReadUrl("../../otro/usuario/x")).toEqual({ ok: false, code: "INVALID_INPUT" });
    expect(await b.createReadUrl(path, 0)).toMatchObject({ ok: true, expiresInSeconds: 60 });
  });

  it("remove/exists verifican de forma independiente", async () => {
    const s = fakeStorage();
    const b = new PrivateTicketBucket(s.client);
    const up = await b.upload({ userId: U, ticketId: T, bytes: new Uint8Array(3), contentType: "image/heic" });
    if (!up.ok) throw new Error("upload");
    expect(await b.exists(up.objectPath)).toEqual({ ok: true, exists: true });
    expect(await b.remove(up.objectPath)).toEqual({ ok: true });
    expect(await b.exists(up.objectPath)).toEqual({ ok: true, exists: false });
    expect(await b.remove("no/valida")).toEqual({ ok: false });
  });
});

describe("persistence (envoltorios RPC)", () => {
  const rpcOf = (data: unknown, error: { message: string } | null = null): RpcClientLike => ({ rpc: async () => ({ data, error }) });

  it("proyecta éxito y códigos conocidos; oculta mensajes de la base de datos", async () => {
    expect(await createScannerTicket(rpcOf({ ok: true, ticketId: T, cycleId: C, idempotent: false }), U)).toMatchObject({ ok: true, ticketId: T });
    expect(await startScannerProcessing(rpcOf({ ok: false, code: "QUOTA_EXCEEDED" }), T)).toEqual({ ok: false, code: "QUOTA_EXCEEDED" });
    expect(await startScannerProcessing(rpcOf({ ok: false, code: "algo raro con datos" }), T)).toEqual({ ok: false, code: "BACKEND_ERROR" });
    expect(await startScannerProcessing(rpcOf(null, { message: "relation scanner_tickets does not exist" }), T)).toEqual({ ok: false, code: "BACKEND_ERROR" });
    expect(await confirmScannerTicket(rpcOf({ ok: false, code: "VALIDATION_ERROR" }), T, C, 0)).toEqual({ ok: false, code: "VALIDATION_ERROR" });
  });

  it("pasa solo parámetros de ticket/clave; nunca un user_id", async () => {
    const rpc = vi.fn(async () => ({ data: { ok: true, idempotent: false }, error: null }));
    await startScannerProcessing({ rpc }, T);
    await createScannerTicket({ rpc }, U);
    await confirmScannerTicket({ rpc }, T, C, 0);
    for (const [, args] of rpc.mock.calls as unknown as [string, Record<string, unknown>][]) {
      expect(Object.keys(args).some((k) => k.includes("user"))).toBe(false);
    }
  });

  it("el límite de SQL y el de TypeScript deben coincidir", async () => {
    const good = rpcOf({ ok: true, cycleId: C, limit: 5, used: 2, remaining: 3 });
    expect(await getScannerQuotaStatus(good)).toMatchObject({ ok: true, remaining: 3 });
    expect(SCANNER_CYCLE_TICKET_LIMIT).toBe(5);
    expect(await getScannerQuotaStatus(rpcOf({ ok: true, cycleId: C, limit: 9, used: 0, remaining: 9 }))).toEqual({ ok: false, code: "BACKEND_ERROR" });
  });

  it("la migración usa el mismo límite 5 y no hay referencia a fecha en la cuota", async () => {
    const fs = await import("node:fs");
    const sql = fs.readFileSync("supabase/deferred/ticket-scanner/20261027120000_ticket_scanner_persistence.sql", "utf8");
    expect(sql.match(/c_limit constant integer := 5;/g)).toHaveLength(2);
    expect(sql).not.toMatch(/quota_day/);
  });
});

describe("limpieza", () => {
  const NOW = new Date("2026-10-27T12:00:00Z");
  const row = (over: Partial<CleanupCandidateRow> = {}): CleanupCandidateRow => ({
    ticket_id: T,
    user_id: U,
    cycle_id: C,
    status: "uploaded",
    status_reason: null,
    attempt_count: 0,
    original_storage: "present",
    has_draft: false,
    object_path: `${U}/${T}/${"4".repeat(8)}-4444-4444-8444-444444444444`,
    created_at: "2026-10-26T10:00:00Z",
    reason: "ttl_expired",
    ...over,
  });

  /** Admin RPC falso: candidatos fijos y registro de las llamadas de cierre. */
  function admin(rows: CleanupCandidateRow[]) {
    const calls: { fn: string; args: Record<string, unknown> }[] = [];
    const client: RpcClientLike = {
      async rpc(fn, args = {}) {
        calls.push({ fn, args });
        if (fn === "fn_scanner_cleanup_candidates") return { data: rows, error: null };
        return { data: { ok: true }, error: null };
      },
    };
    return { client, calls };
  }

  it("borra con verificación y finaliza; el borrado real ocurre en storage", async () => {
    const s = fakeStorage();
    const r = row();
    s.objects.set(r.object_path!, 5);
    const a = admin([r]);
    const out = await runScannerCleanup({ admin: a.client, storage: new PrivateTicketBucket(s.client), now: NOW });
    expect(out).toEqual({ candidates: 1, deleted: 1, retryLater: 0, skipped: 0 });
    expect(s.objects.size).toBe(0);
    expect(a.calls.map((c) => c.fn)).toEqual(["fn_scanner_cleanup_candidates", "fn_scanner_finalize_deletion"]);
    expect(a.calls[0].args).toEqual({ p_now: NOW.toISOString(), p_limit: 100 });
  });

  it("cierre de ciclo: cancela pendientes de cualquier estado con el motivo cycle_closed", async () => {
    const s = fakeStorage();
    const rows = (["initiated", "uploaded", "processing", "needs_review", "failed"] as const).map((status, i) => {
      const id = `55555555-5555-4555-8555-${String(i).padStart(12, "0")}`;
      const p = status === "initiated" ? null : `${U}/${id}/${"6".repeat(8)}-6666-4666-8666-666666666666`;
      if (p) s.objects.set(p, 1);
      return row({ ticket_id: id, status, reason: "cycle_closed", original_storage: p ? "present" : "none", object_path: p });
    });
    const a = admin(rows);
    const out = await runScannerCleanup({ admin: a.client, storage: new PrivateTicketBucket(s.client), now: NOW });
    expect(out).toEqual({ candidates: 5, deleted: 5, retryLater: 0, skipped: 0 });
    expect(s.objects.size).toBe(0);
    expect(a.calls.filter((c) => c.fn === "fn_scanner_finalize_deletion").every((c) => c.args.p_reason === "cycle_closed")).toBe(true);
  });

  it("si el borrado no se verifica NO finaliza: queda pendiente y se reintenta", async () => {
    const s = fakeStorage({ keepAfterRemove: true });
    const r = row();
    s.objects.set(r.object_path!, 5);
    const a = admin([r]);
    const out = await runScannerCleanup({ admin: a.client, storage: new PrivateTicketBucket(s.client), now: NOW });
    expect(out).toEqual({ candidates: 1, deleted: 0, retryLater: 1, skipped: 0 });
    expect(a.calls.map((c) => c.fn)).toEqual(["fn_scanner_cleanup_candidates", "fn_scanner_mark_deletion_pending"]);
    // siguiente ejecución, con el almacenamiento ya sano: converge
    const healthy = fakeStorage();
    const again = admin([row({ status: "expired", original_storage: "deletion_pending" })]);
    expect(await runScannerCleanup({ admin: again.client, storage: new PrivateTicketBucket(healthy.client), now: NOW })).toMatchObject({ deleted: 1 });
  });

  it("es idempotente: sin candidatos no hace nada y un objeto ya ausente se finaliza", async () => {
    const s = fakeStorage();
    const none = admin([]);
    expect(await runScannerCleanup({ admin: none.client, storage: new PrivateTicketBucket(s.client), now: NOW })).toEqual({ candidates: 0, deleted: 0, retryLater: 0, skipped: 0 });
    expect(none.calls).toHaveLength(1);
    const gone = admin([row()]); // el objeto ya no existe
    expect(await runScannerCleanup({ admin: gone.client, storage: new PrivateTicketBucket(s.client), now: NOW })).toMatchObject({ deleted: 1 });
  });

  it("borra el original después de confirmar sin convertir el ticket confirmado en deleted", async () => {
    const s = fakeStorage();
    const r = row({ status: "confirmed", original_storage: "deletion_pending", reason: "post_confirm" });
    s.objects.set(r.object_path!, 5);
    const a = admin([r]);
    const out = await runScannerCleanup({ admin: a.client, storage: new PrivateTicketBucket(s.client), now: NOW });
    expect(out).toEqual({ candidates: 1, deleted: 1, retryLater: 0, skipped: 0 });
    expect(s.objects.size).toBe(0);
    expect(a.calls.map((c) => c.fn)).toEqual(["fn_scanner_cleanup_candidates", "fn_scanner_finalize_confirmed_original"]);
    expect(a.calls[1].args).toEqual({ p_ticket_id: T });
  });

  it("descarta filas no válidas sin tocar storage; error del backend se reporta sin detalle", async () => {
    expect(toRetainedTicket(row({ reason: "otro" }))).toBeNull();
    expect(toRetainedTicket(row({ status: "raro" }))).toBeNull();
    expect(toRetainedTicket(row({ cycle_id: "../x" }))).toBeNull();
    const s = fakeStorage();
    const a = admin([row({ reason: "otro" })]);
    expect(await runScannerCleanup({ admin: a.client, storage: new PrivateTicketBucket(s.client), now: NOW })).toMatchObject({ skipped: 1, deleted: 0 });
    expect(s.calls.filter((c) => c === "remove")).toHaveLength(0);
    const broken: RpcClientLike = { rpc: async () => ({ data: null, error: { message: "secreto interno" } }) };
    expect(await runScannerCleanup({ admin: broken, storage: new PrivateTicketBucket(s.client) })).toEqual({ error: "BACKEND_ERROR" });
  });
});

describe("ruta /api/scanner/cleanup (autenticación de servicio)", () => {
  const SECRET = "s".repeat(32);
  const adminRpc = vi.fn();
  const adminFactory = vi.fn();
  const saved = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.resetModules();
    adminRpc.mockReset();
    adminFactory.mockReset();
    adminRpc.mockResolvedValue({ data: [], error: null });
    adminFactory.mockImplementation(() => ({ rpc: adminRpc, storage: { from: vi.fn() } }));
    vi.doMock("@/lib/supabase/admin", () => ({ createAdminClient: adminFactory }));
    vi.doMock("@/lib/logger", () => ({ apiLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = saved;
  });

  const call = async (method: "GET" | "POST", headers: Record<string, string> = {}, url = "http://x.test/api/scanner/cleanup") => {
    const mod = await import("@/app/api/scanner/cleanup/route");
    const { NextRequest } = await import("next/server");
    return mod[method](new NextRequest(url, { method, headers }));
  };

  it("sin CRON_SECRET configurado: 401 y no toca la base de datos", async () => {
    delete process.env.CRON_SECRET;
    expect((await call("GET", { authorization: "Bearer cualquiera" })).status).toBe(401);
    expect(adminFactory).not.toHaveBeenCalled();
  });

  it("secreto demasiado corto: 401", async () => {
    process.env.CRON_SECRET = "corto";
    expect((await call("POST", { authorization: "Bearer corto" })).status).toBe(401);
    expect(adminFactory).not.toHaveBeenCalled();
  });

  it("sin cabecera, con secreto erróneo, o por query string: 401", async () => {
    process.env.CRON_SECRET = SECRET;
    expect((await call("GET")).status).toBe(401);
    expect((await call("GET", { authorization: "Bearer " + "x".repeat(32) })).status).toBe(401);
    expect((await call("GET", {}, `http://x.test/api/scanner/cleanup?secret=${SECRET}`)).status).toBe(401);
    expect((await call("POST", { authorization: SECRET })).status).toBe(401);
    expect(adminFactory).not.toHaveBeenCalled();
  });

  it("con el secreto correcto ejecuta y devuelve solo recuentos (GET de cron y POST manual)", async () => {
    process.env.CRON_SECRET = SECRET;
    for (const method of ["GET", "POST"] as const) {
      const res = await call(method, { authorization: `Bearer ${SECRET}` });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true, data: { candidates: 0, deleted: 0, retryLater: 0, skipped: 0 } });
    }
  });

  it("un fallo interno responde 500 sin detalles", async () => {
    process.env.CRON_SECRET = SECRET;
    adminFactory.mockImplementation(() => {
      throw new Error("Missing Supabase credentials for Admin Client");
    });
    const res = await call("GET", { authorization: `Bearer ${SECRET}` });
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("credentials");
  });
});

describe("contrato de creación de gastos", () => {
  const plan = [
    { groupNo: 1, category: "survival" as const, amountCents: 1050 },
    { groupNo: 2, category: "extra" as const, amountCents: 99 },
  ];

  it("proyecta un gasto por categoría con el esquema real de gasto y el ciclo como month_id", () => {
    const r = planToExpenseInputs({ ticketId: T, cycleId: C, date: "2026-10-20", plan });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.expenses.map((e) => [e.category, e.expense.amount, e.expense.month_id, e.expense.note])).toEqual([
      ["survival", 10.5, C, ""],
      ["extra", 0.99, C, ""],
    ]);
    expect(r.expenses.map((e) => e.groupKey)).toEqual([`${T}:1`, `${T}:2`]);
  });

  it("rechaza plan vacío, grupos no positivos, categorías inventadas y fechas inválidas", () => {
    const base = { ticketId: T, cycleId: C, date: "2026-10-20" };
    expect(planToExpenseInputs({ ...base, plan: [] })).toEqual({ ok: false, code: "NO_GROUPS" });
    expect(planToExpenseInputs({ ...base, plan: [{ groupNo: 1, category: "survival", amountCents: -5 }] })).toEqual({ ok: false, code: "INVALID_GROUP" });
    expect(planToExpenseInputs({ ...base, plan: [{ groupNo: 1, category: "ocio" as never, amountCents: 5 }] })).toEqual({ ok: false, code: "INVALID_GROUP" });
    expect(planToExpenseInputs({ ...base, date: "ayer", plan })).toEqual({ ok: false, code: "INVALID_DATE" });
    const many = ["survival", "optional", "culture", "extra", "extra"].map((category, i) => ({ groupNo: i + 1, category: category as "extra", amountCents: 1 }));
    expect(planToExpenseInputs({ ...base, plan: many })).toEqual({ ok: false, code: "TOO_MANY_GROUPS" });
  });
});

describe("Azure Receipt sigue desactivado", () => {
  it("no hace I/O y devuelve PILOT_NOT_ENABLED", async () => {
    const out = await azureReceiptDisabledAdapter.analyze({ bytes: new Uint8Array([1]) } as never);
    expect(out).toEqual({ ok: false, kind: "config", code: "PILOT_NOT_ENABLED" });
  });

  it("ningún módulo nuevo menciona Azure ni credenciales ni URLs públicas", async () => {
    const fs = await import("node:fs");
    for (const f of ["storage-adapter", "persistence", "cleanup", "expense-contract"]) {
      const src = fs.readFileSync(`src/lib/scanner/${f}.ts`, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      expect(src).not.toMatch(/azure|getPublicUrl|SERVICE_ROLE|process\.env/i);
    }
  });
});
