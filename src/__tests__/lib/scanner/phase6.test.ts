import { describe, expect, it } from "vitest";
import { cycleIdFromMonth, isCycleId } from "@/lib/scanner/cycle";
import { consumeQuota, getQuotaStatus, refundQuota, type QuotaLedger } from "@/lib/scanner/quota";
import { isTechnicalFailure, refundOnUploadFailure, startProcessing, failProcessing } from "@/lib/scanner/workflow";
import {
  TICKET_RETENTION_MS,
  cancelPendingOnCycleClose,
  deleteWithVerification,
  isExpired,
  purgeExpired,
  type PrivateTicketStorage,
  type RetainedTicket,
} from "@/lib/scanner/retention";
import { createTicket, transitionTicket, type TicketState } from "@/lib/scanner/ticket-state";
import { applyDraftEdit, confirmDraft, draftFromReceipt, validateDraft } from "@/lib/scanner/draft";
import { resolveScannerAccess } from "@/lib/scanner/access";
import { resolveAccessState } from "@/lib/auth/access-state";
import {
  azureReceiptDisabledAdapter,
  evaluatePilotReadiness,
  isPilotDataAllowed,
  PILOT_PREREQUISITES,
} from "@/lib/scanner/azure-receipt-contract";
import { syntheticReceipt } from "./helpers";

const must = <T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> => {
  expect(r.ok).toBe(true);
  return r as Extract<T, { ok: true }>;
};

function ticketAt(status: "initiated" | "uploaded" | "processing" | "needs_review" | "failed", id = "t1"): TicketState {
  let t = createTicket(id);
  const path: Record<string, string[]> = {
    initiated: [],
    uploaded: ["uploaded"],
    processing: ["uploaded", "processing"],
    needs_review: ["uploaded", "processing", "needs_review"],
    failed: ["uploaded", "processing", "failed"],
  };
  for (const step of path[status]) t = must(transitionTicket(t, step as never)).ticket;
  return t;
}

function fakeStorage(opts: { removeOk?: boolean; stillThere?: boolean } = {}) {
  const removed: string[] = [];
  const storage: PrivateTicketStorage = {
    visibility: "private",
    async remove(path) {
      removed.push(path);
      return { ok: opts.removeOk ?? true };
    },
    async exists() {
      return { ok: true, exists: opts.stillThere ?? false };
    },
  };
  return { storage, removed };
}

const retained = (ticket: TicketState, cycleId = "m-1", createdAtMs = 0): RetainedTicket => ({
  ticket,
  cycleId,
  createdAtMs,
  objectPath: ticket.originalStorage === "none" ? null : `u/${ticket.id}`,
});

describe("cycleId = months.id", () => {
  it("acepta el id de un ciclo abierto", () => {
    expect(cycleIdFromMonth({ id: "3f2a-uuid_1", status: "open" })).toEqual({ ok: true, cycleId: "3f2a-uuid_1" });
  });
  it("rechaza ciclo ausente, cerrado o con id no seguro", () => {
    expect(cycleIdFromMonth(null)).toEqual({ ok: false, code: "NO_OPEN_CYCLE" });
    expect(cycleIdFromMonth({ id: "m1", status: "closed" })).toEqual({ ok: false, code: "CYCLE_CLOSED" });
    expect(cycleIdFromMonth({ id: "a b", status: "open" })).toEqual({ ok: false, code: "INVALID_CYCLE" });
    expect(isCycleId("")).toBe(false);
  });
  it("el límite de 5 es por months.id y un ciclo nuevo parte de cero", () => {
    let ledger: QuotaLedger = [];
    for (let i = 0; i < 5; i++) ledger = must(consumeQuota(ledger, `t${i}`, "month-A")).ledger;
    expect(consumeQuota(ledger, "t9", "month-A")).toEqual({ ok: false, code: "QUOTA_EXCEEDED" });
    expect(getQuotaStatus(ledger, "month-B").remaining).toBe(5);
    expect(consumeQuota(ledger, "t9", "month-B").ok).toBe(true);
  });
});

describe("devolución por fallo técnico", () => {
  it("clasifica fallos técnicos y del archivo", () => {
    expect(["transient", "quota", "config"].every((k) => isTechnicalFailure(k as never))).toBe(true);
    expect(isTechnicalFailure("permanent")).toBe(false);
    expect(isTechnicalFailure("unsupported")).toBe(false);
  });
  it("fallo técnico de OCR devuelve el ticket; el del archivo no", () => {
    const start = must(startProcessing(ticketAt("uploaded"), [], "m-1"));
    const tech = must(failProcessing(start.ticket, start.ledger, { systemFault: true }));
    expect(getQuotaStatus(tech.ledger, "m-1").used).toBe(0);
    const file = must(failProcessing(start.ticket, start.ledger, { systemFault: false }));
    expect(getQuotaStatus(file.ledger, "m-1").used).toBe(1);
  });
  it("fallo de subida: devuelve si estaba consumido, no hace nada si no, e idempotente", () => {
    const ledger = must(consumeQuota([], "t1", "m-1")).ledger;
    const refunded = refundOnUploadFailure(ledger, "t1");
    expect(getQuotaStatus(refunded, "m-1").used).toBe(0);
    expect(refundOnUploadFailure(refunded, "t1")).toBe(refunded);
    expect(refundOnUploadFailure([], "nope")).toEqual([]);
    expect(refundQuota(refunded, "t1").ok).toBe(true);
  });
});

describe("expiración a 24 h", () => {
  it("caduca justo a las 24 h y no antes", () => {
    const r = retained(ticketAt("uploaded"), "m-1", 1000);
    expect(isExpired(r, 1000 + TICKET_RETENTION_MS - 1)).toBe(false);
    expect(isExpired(r, 1000 + TICKET_RETENTION_MS)).toBe(true);
  });
  it("purgeExpired borra con verificación y no toca confirmados ni recientes", async () => {
    const { storage, removed } = fakeStorage();
    const old = retained(ticketAt("needs_review", "old"), "m-1", 0);
    const processing = retained(ticketAt("processing", "proc"), "m-1", 0);
    const fresh = retained(ticketAt("uploaded", "new"), "m-1", TICKET_RETENTION_MS);
    const out = await purgeExpired(storage, [old, processing, fresh], TICKET_RETENTION_MS);
    expect(out).toHaveLength(2);
    for (const o of out) {
      const done = must(o);
      expect(done.item.ticket.status).toBe("deleted");
      expect(done.item.ticket.originalStorage).toBe("deleted_verified");
      expect(done.item.ticket.statusReason).toBe("ttl_expired");
    }
    expect(removed.sort()).toEqual(["u/old", "u/proc"]);
  });
  it("si el objeto sigue existiendo no se da por borrado", async () => {
    const { storage } = fakeStorage({ stillThere: true });
    const [o] = await purgeExpired(storage, [retained(ticketAt("uploaded"))], TICKET_RETENTION_MS);
    expect(o.ok).toBe(false);
    expect(o.item.ticket.originalStorage).toBe("deletion_pending");
    expect(o.item.ticket.status).toBe("expired");
  });
  it("si remove falla tampoco se verifica", async () => {
    const { storage } = fakeStorage({ removeOk: false });
    const o = await deleteWithVerification(storage, retained(ticketAt("uploaded")), "ttl_expired");
    expect(o).toMatchObject({ ok: false, code: "DELETION_NOT_VERIFIED" });
  });
});

describe("cancelación al cerrar el ciclo", () => {
  it("cancela y borra solo los pendientes de ese ciclo", async () => {
    const { storage, removed } = fakeStorage();
    const mine = retained(ticketAt("needs_review", "a"), "m-1");
    const failed = retained(ticketAt("failed", "b"), "m-1");
    const other = retained(ticketAt("uploaded", "c"), "m-2");
    const confirmed = retained(
      { ...ticketAt("needs_review", "d"), status: "confirmed", originalStorage: "none" },
      "m-1"
    );
    const out = await cancelPendingOnCycleClose(storage, [mine, failed, other, confirmed], "m-1");
    expect(out).toHaveLength(2);
    for (const o of out) {
      const done = must(o);
      expect(done.item.ticket.status).toBe("deleted");
      expect(done.item.ticket.statusReason).toBe("cycle_closed");
      expect(done.item.ticket.hasDraft).toBe(false);
    }
    expect(removed.sort()).toEqual(["u/a", "u/b"]);
  });
  it("un ticket sin original subido se cancela sin tocar el almacenamiento", async () => {
    const { storage, removed } = fakeStorage();
    const [o] = await cancelPendingOnCycleClose(storage, [retained(ticketAt("initiated"))], "m-1");
    expect(must(o).item.ticket.status).toBe("deleted");
    expect(removed).toEqual([]);
  });
  it("el almacenamiento es privado por tipo", () => {
    expect(fakeStorage().storage.visibility).toBe("private");
  });
});

describe("edición completa antes de confirmar", () => {
  let n = 0;
  const id = () => `n${++n}`;
  const review = ticketAt("needs_review");
  const base = draftFromReceipt(syntheticReceipt(), id);

  it("permite editar comercio, fecha, total, líneas e importes y categorías", () => {
    let d = base;
    const step = (edit: Parameters<typeof applyDraftEdit>[2]) => (d = must(applyDraftEdit(review, d, edit, id)).draft);
    step({ type: "setMerchant", merchant: "Tienda Ficticia" });
    step({ type: "setDate", date: "2026-03-15" });
    step({ type: "setTotal", totalCents: 1500 });
    step({ type: "setLineDescription", lineId: d.lines[0].id, description: "Editada" });
    step({ type: "setLineAmount", lineId: d.lines[0].id, amountCents: 1100 });
    step({ type: "setLineAmount", lineId: d.lines[1].id, amountCents: 400 });
    step({ type: "removeLine", lineId: d.lines[1].id });
    step({ type: "addLine", description: "Nueva", amountCents: 400 });
    step({ type: "setLineCategory", lineId: d.lines[0].id, category: "survival" });
    step({
      type: "splitLine",
      lineId: d.lines[1].id,
      parts: [
        { category: "culture", amountCents: 150 },
        { category: "extra", amountCents: 250 },
      ],
    });
    expect(d.version).toBe(base.version + 10);
    expect(d.merchant).toBe("Tienda Ficticia");
    expect(validateDraft(d)).toEqual([]);
  });

  it("editar el importe anula categoría y reparto de esa línea", () => {
    const cat = must(applyDraftEdit(review, base, { type: "setLineCategory", lineId: base.lines[0].id, category: "extra" }, id)).draft;
    const edited = must(applyDraftEdit(review, cat, { type: "setLineAmount", lineId: base.lines[0].id, amountCents: 700 }, id)).draft;
    expect(edited.lines[0]).toMatchObject({ category: null, allocations: [] });
  });

  it("rechaza categorías fuera de las cuatro y valores inválidos", () => {
    expect(applyDraftEdit(review, base, { type: "setLineCategory", lineId: base.lines[0].id, category: "general" }, id)).toEqual({
      ok: false,
      code: "INVALID_CATEGORY",
    });
    expect(applyDraftEdit(review, base, { type: "setLineAmount", lineId: base.lines[0].id, amountCents: 1.5 }, id)).toEqual({
      ok: false,
      code: "INVALID_VALUE",
    });
    expect(applyDraftEdit(review, base, { type: "removeLine", lineId: "zzz" }, id)).toEqual({ ok: false, code: "LINE_NOT_FOUND" });
  });

  it("solo se edita en needs_review", () => {
    expect(applyDraftEdit(ticketAt("uploaded"), base, { type: "setMerchant", merchant: "X" }, id)).toEqual({
      ok: false,
      code: "NOT_EDITABLE",
    });
  });

  it("la confirmación humana sigue siendo obligatoria y exige la versión editada", () => {
    let d = base;
    d = must(applyDraftEdit(review, d, { type: "setLineCategory", lineId: d.lines[0].id, category: "survival" }, id)).draft;
    d = must(applyDraftEdit(review, d, { type: "setLineCategory", lineId: d.lines[1].id, category: "optional" }, id)).draft;
    const req = { draftVersion: d.version, confirmKey: "k1", cycleOpen: true };
    expect(confirmDraft(review, d, { ...req, userConfirmed: false })).toMatchObject({ ok: false, code: "CONFIRMATION_REQUIRED" });
    expect(confirmDraft(review, d, { ...req, draftVersion: d.version - 1, userConfirmed: true })).toMatchObject({
      ok: false,
      code: "VERSION_CONFLICT",
    });
    expect(confirmDraft(review, d, { ...req, userConfirmed: true }).ok).toBe(true);
  });
});

describe("acceso hasta el fin del periodo pagado", () => {
  const profile = (over: object) => ({
    is_founder: false,
    plus_access_until: "2026-11-30T00:00:00Z",
    trial_ends_at: null,
    ...over,
  });
  it("plan cancelado conserva acceso antes de plus_access_until y lo pierde después", () => {
    const before = resolveAccessState(profile({ subscriptionCancelAtPeriodEnd: true }), {
      expensesThisMonth: 0,
      now: new Date("2026-11-29T23:59:59Z"),
    });
    expect(before).toBe("plus_canceled_pending");
    expect(resolveScannerAccess(before).allowed).toBe(true);
    const after = resolveAccessState(profile({ subscriptionCancelAtPeriodEnd: true }), {
      expensesThisMonth: 0,
      now: new Date("2026-11-30T00:00:00Z"),
    });
    expect(resolveScannerAccess(after)).toEqual({ allowed: false, reason: "plan_required" });
  });
});

describe("adaptador Azure Receipt (solo contrato)", () => {
  it("está desactivado y no hace nada con los bytes", async () => {
    const out = await azureReceiptDisabledAdapter.analyze({
      attemptId: "a",
      idempotencyKey: "k",
      bytes: new Uint8Array(0),
      mime: "image/png",
      pageCount: 1,
      locale: "es",
      hints: { country: "ES", currency: "EUR" },
      deadlineMs: 1000,
    });
    expect(out).toEqual({ ok: false, kind: "config", code: "PILOT_NOT_ENABLED" });
  });
  it("el piloto solo admite datos sintéticos o anonimizados", () => {
    expect(isPilotDataAllowed("synthetic")).toBe(true);
    expect(isPilotDataAllowed("anonymized")).toBe(true);
    expect(isPilotDataAllowed("real")).toBe(false);
  });
  it("no está listo mientras falte algún prerrequisito contractual", () => {
    expect(evaluatePilotReadiness()).toEqual({ ready: false, missing: [...PILOT_PREREQUISITES] });
    const all = Object.fromEntries(PILOT_PREREQUISITES.map((p) => [p, true]));
    expect(evaluatePilotReadiness(all)).toEqual({ ready: true });
    expect(evaluatePilotReadiness({ ...all, dpa_signed: false })).toEqual({ ready: false, missing: ["dpa_signed"] });
  });
});
