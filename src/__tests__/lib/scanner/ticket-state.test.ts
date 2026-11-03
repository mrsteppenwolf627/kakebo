import { describe, expect, it } from "vitest";
import {
  ALLOWED_TRANSITIONS,
  TICKET_STATUSES,
  canTransition,
  createTicket,
  recordOriginalDeletionVerified,
  requestOriginalDeletion,
  transitionTicket,
  type TicketState,
  type TicketStatus,
} from "@/lib/scanner/ticket-state";
import { failProcessing, startProcessing } from "@/lib/scanner/workflow";
import { consumeQuota, getQuotaStatus, type QuotaLedger } from "@/lib/scanner/quota";

function to(t: TicketState, status: TicketStatus, opts = {}): TicketState {
  const r = transitionTicket(t, status, opts);
  if (!r.ok) throw new Error(`${t.status}->${status}: ${r.code}`);
  return r.ticket;
}
const uploaded = () => to(createTicket("t1"), "uploaded");
const reviewing = () => to(to(uploaded(), "processing"), "needs_review");

describe("máquina de estados", () => {
  it("cubre exactamente las transiciones documentadas", () => {
    for (const from of TICKET_STATUSES) {
      for (const target of TICKET_STATUSES) {
        expect(canTransition(from, target)).toBe(ALLOWED_TRANSITIONS[from].includes(target));
      }
    }
    expect(ALLOWED_TRANSITIONS.deleted).toEqual([]);
  });

  it("no existe estado de retención online del original", () => {
    expect(TICKET_STATUSES).not.toContain("kept");
    expect(TICKET_STATUSES).not.toContain("stored");
    expect(createTicket("t1").originalStorage).toBe("none");
  });

  it("flujo feliz upload → processing → review → confirmed → deleted con borrado verificado", () => {
    let t = uploaded();
    expect(t.originalStorage).toBe("present");
    t = to(t, "processing");
    t = to(t, "needs_review");
    expect(t.hasDraft).toBe(true);
    t = to(t, "confirmed");
    expect(t.originalStorage).toBe("deletion_pending");
    expect(transitionTicket(t, "deleted")).toEqual({ ok: false, code: "ORIGINAL_NOT_DELETED" });
    t = recordOriginalDeletionVerified(t);
    t = to(t, "deleted");
    expect(t).toMatchObject({ status: "deleted", hasDraft: false, originalStorage: "deleted_verified" });
  });

  it("no se puede llegar a deleted con la imagen presente o pendiente", () => {
    expect(transitionTicket(uploaded(), "deleted")).toEqual({ ok: false, code: "ORIGINAL_NOT_DELETED" });
    const pending = requestOriginalDeletion(uploaded());
    expect(transitionTicket(pending, "deleted")).toEqual({ ok: false, code: "ORIGINAL_NOT_DELETED" });
  });

  it("descarte explícito: pedir borrado, verificar y pasar a deleted", () => {
    let t = requestOriginalDeletion(reviewing());
    t = recordOriginalDeletionVerified(t);
    t = to(t, "deleted", { reason: "user_discarded" });
    expect(t).toMatchObject({ status: "deleted", statusReason: "user_discarded", hasDraft: false });
  });

  it("verificar sin haber pedido borrado no marca nada como borrado", () => {
    expect(recordOriginalDeletionVerified(uploaded()).originalStorage).toBe("present");
  });

  it("initiated sin archivo puede borrarse directamente", () => {
    expect(to(createTicket("t"), "deleted").status).toBe("deleted");
  });

  it("caducar pide el borrado del original", () => {
    expect(to(reviewing(), "expired").originalStorage).toBe("deletion_pending");
  });

  it("rechaza transiciones ilegales y desde terminales", () => {
    expect(transitionTicket(createTicket("t"), "processing")).toEqual({ ok: false, code: "ILLEGAL_TRANSITION" });
    expect(transitionTicket(uploaded(), "confirmed")).toEqual({ ok: false, code: "ILLEGAL_TRANSITION" });
    const deleted = to(createTicket("t"), "deleted");
    for (const s of TICKET_STATUSES) expect(transitionTicket(deleted, s).ok).toBe(false);
  });

  it("no confirma sin borrador", () => {
    const t: TicketState = { ...reviewing(), hasDraft: false };
    expect(transitionTicket(t, "confirmed")).toEqual({ ok: false, code: "NO_DRAFT" });
  });

  it("no muta el ticket de entrada", () => {
    const t = Object.freeze(uploaded());
    expect(() => transitionTicket(t, "processing")).not.toThrow();
    expect(t.status).toBe("uploaded");
  });

  it("reintentos: deniega sin límite configurado y respeta maxRetries", () => {
    const failed = () => to(to(uploaded(), "processing"), "failed");
    expect(transitionTicket(failed(), "processing")).toEqual({ ok: false, code: "RETRY_LIMIT" });
    expect(transitionTicket(failed(), "processing", { maxRetries: 1 })).toEqual({ ok: false, code: "RETRY_LIMIT" });
    expect(to(failed(), "processing", { maxRetries: 2 }).attemptCount).toBe(2);
  });
});

describe("cuota + estados", () => {
  it("consume al aceptar el ticket y reintentar no consume de nuevo", () => {
    const start = startProcessing(uploaded(), [], "c1");
    if (!start.ok) throw new Error(start.code);
    expect(getQuotaStatus(start.ledger, "c1").used).toBe(1);
    const failed = failProcessing(start.ticket, start.ledger, { systemFault: false });
    if (!failed.ok) throw new Error();
    expect(getQuotaStatus(failed.ledger, "c1").used).toBe(1);
    const retry = startProcessing(failed.ticket, failed.ledger, "c1", { maxRetries: 2 });
    if (!retry.ok) throw new Error(retry.code);
    expect(getQuotaStatus(retry.ledger, "c1").used).toBe(1);
  });

  it("un fallo del sistema reembolsa la cuota", () => {
    const start = startProcessing(uploaded(), [], "c1");
    if (!start.ok) throw new Error();
    const failed = failProcessing(start.ticket, start.ledger, { systemFault: true });
    if (!failed.ok) throw new Error();
    expect(getQuotaStatus(failed.ledger, "c1").used).toBe(0);
  });

  it("sin cupo no cambia el estado; con estado ilegal no consume", () => {
    let ledger: QuotaLedger = [];
    for (let i = 0; i < 5; i++) {
      const r = consumeQuota(ledger, `x${i}`, "c1");
      if (r.ok) ledger = r.ledger;
    }
    expect(startProcessing(uploaded(), ledger, "c1")).toEqual({ ok: false, code: "QUOTA_EXCEEDED" });
    expect(startProcessing(createTicket("t9"), [], "c1")).toEqual({ ok: false, code: "ILLEGAL_TRANSITION" });
  });
});
