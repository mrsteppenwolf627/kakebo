import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMarketingEmail = vi.fn();
vi.mock("@/lib/marketing-mail/provider", () => ({ sendMarketingEmail: (...a: unknown[]) => sendMarketingEmail(...a) }));
vi.mock("@/lib/logger", () => ({ apiLogger: { error: vi.fn(), info: vi.fn() } }));

type Row = Record<string, unknown>;
let rows: Row[] = [];
let failInsert = false;

function builder() {
  const state: { filters: Array<[string, unknown]>; op: string; payload?: Row } = { filters: [], op: "select" };
  const api: Record<string, unknown> = {
    select: () => api,
    eq: (k: string, v: unknown) => (state.filters.push([k, v]), api),
    is: (k: string, v: unknown) => (state.filters.push([k, v]), api),
    insert: (payload: Row) => ((state.op = "insert"), (state.payload = payload), api),
    update: (payload: Row) => ((state.op = "update"), (state.payload = payload), api),
    maybeSingle: async () => ({ data: rows.find((r) => state.filters.every(([k, v]) => r[k] === v)) ?? null, error: null }),
    single: async () => {
      if (failInsert) return { data: null, error: new Error("boom") };
      const row = { id: `lead-${rows.length + 1}`, confirmed_at: null, unsubscribed_at: null, confirmation_sent_at: null, ...state.payload };
      rows.push(row);
      return { data: row, error: null };
    },
    then: (resolve: (v: unknown) => void) => {
      if (state.op === "update") {
        rows.filter((r) => state.filters.every(([k, v]) => (v === null ? r[k] == null : r[k] === v))).forEach((r) => Object.assign(r, state.payload));
      }
      resolve({ error: null });
    },
  };
  return api;
}
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: () => builder() }) }));

import { POST } from "@/app/api/marketing/leads/route";
import { GET as confirm } from "@/app/api/marketing/leads/confirm/route";
import { GET as unsubscribe } from "@/app/api/marketing/leads/unsubscribe/route";
import { normalizeLeadEmail, normalizeLeadSource, signLeadAction, verifyLeadAction } from "@/lib/marketing-mail/leads";
import { NextRequest } from "next/server";

const post = (body: unknown) =>
  POST(new NextRequest("http://localhost/api/marketing/leads", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } }));

beforeEach(() => {
  rows = [];
  failInsert = false;
  sendMarketingEmail.mockReset().mockResolvedValue({ provider: "resend" });
  process.env.MARKETING_UNSUBSCRIBE_SECRET = "test-secret";
});

describe("helpers", () => {
  it("normaliza y valida el correo", () => {
    expect(normalizeLeadEmail("  Ana@Correo.COM ")).toBe("ana@correo.com");
    expect(normalizeLeadEmail("sin-arroba")).toBeNull();
    expect(normalizeLeadEmail(42)).toBeNull();
  });
  it("solo acepta claves de fuente cortas", () => {
    expect(normalizeLeadSource("plantilla_excel")).toBe("plantilla_excel");
    expect(normalizeLeadSource("<script>")).toBe("unknown");
  });
  it("las firmas son por acción y por id", () => {
    const s = signLeadAction("abc", "confirm");
    expect(verifyLeadAction("abc", "confirm", s)).toBe(true);
    expect(verifyLeadAction("abc", "unsubscribe", s)).toBe(false);
    expect(verifyLeadAction("abd", "confirm", s)).toBe(false);
    expect(verifyLeadAction("abc", "confirm", "")).toBe(false);
  });
});

describe("POST /api/marketing/leads", () => {
  it("exige consentimiento explícito", async () => {
    expect((await post({ email: "a@b.es", consent: false })).status).toBe(400);
    expect((await post({ email: "a@b.es" })).status).toBe(400);
    expect(rows).toHaveLength(0);
  });
  it("rechaza correos inválidos", async () => {
    expect((await post({ email: "nope", consent: true })).status).toBe(400);
  });
  it("guarda el lead pendiente con la prueba del consentimiento y envía confirmación", async () => {
    const res = await post({ email: "Ana@Correo.es", consent: true, source: "plantilla_excel" });
    expect(res.status).toBe(202);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: "ana@correo.es", source: "plantilla_excel", consent_text_version: "2026-11-05" });
    expect(rows[0].consent_at).toBeTruthy();
    expect(rows[0].confirmed_at).toBeNull();
    expect(sendMarketingEmail).toHaveBeenCalledTimes(1);
    const mail = sendMarketingEmail.mock.calls[0][0] as { html: string; to: string };
    expect(mail.to).toBe("ana@correo.es");
    expect(mail.html).toContain("/api/marketing/leads/confirm?id=");
    expect(mail.html).toContain("/api/marketing/leads/unsubscribe?id=");
  });
  it("ignora los envíos con el campo trampa relleno", async () => {
    const res = await post({ email: "bot@x.es", consent: true, website: "http://spam" });
    expect(res.status).toBe(202);
    expect(rows).toHaveLength(0);
    expect(sendMarketingEmail).not.toHaveBeenCalled();
  });
  it("no reenvía la confirmación dentro de la ventana de espera", async () => {
    await post({ email: "ana@correo.es", consent: true });
    await post({ email: "ana@correo.es", consent: true });
    expect(sendMarketingEmail).toHaveBeenCalledTimes(1);
  });
  it("devuelve 503 si falla el envío, pero el lead queda guardado como pendiente", async () => {
    sendMarketingEmail.mockRejectedValue(new Error("provider down"));
    expect((await post({ email: "ana@correo.es", consent: true })).status).toBe(503);
    expect(rows).toHaveLength(1);
  });
  it("devuelve 503 si la base de datos falla", async () => {
    failInsert = true;
    expect((await post({ email: "ana@correo.es", consent: true })).status).toBe(503);
  });
});

describe("confirmación y baja", () => {
  const req = (path: string, id: string, s: string) => new NextRequest(`http://localhost${path}?id=${id}&s=${s}`);

  it("confirma con firma válida y rechaza una inválida", async () => {
    await post({ email: "ana@correo.es", consent: true });
    const id = rows[0].id as string;
    const bad = await confirm(req("/api/marketing/leads/confirm", id, "x"));
    expect(bad.headers.get("location")).toContain("newsletter=invalid");
    expect(rows[0].confirmed_at).toBeNull();
    const ok = await confirm(req("/api/marketing/leads/confirm", id, signLeadAction(id, "confirm")));
    expect(ok.headers.get("location")).toContain("newsletter=confirmed");
    expect(rows[0].confirmed_at).toBeTruthy();
  });
  it("da de baja con firma válida y no con la de confirmar", async () => {
    await post({ email: "ana@correo.es", consent: true });
    const id = rows[0].id as string;
    expect((await unsubscribe(req("/api/marketing/leads/unsubscribe", id, signLeadAction(id, "confirm")))).status).toBe(400);
    expect(rows[0].unsubscribed_at).toBeNull();
    expect((await unsubscribe(req("/api/marketing/leads/unsubscribe", id, signLeadAction(id, "unsubscribe")))).status).toBe(200);
    expect(rows[0].unsubscribed_at).toBeTruthy();
  });
});
