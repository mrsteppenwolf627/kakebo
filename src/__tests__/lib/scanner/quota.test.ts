import { describe, expect, it } from "vitest";
import {
  SCANNER_CYCLE_TICKET_LIMIT,
  consumeQuota,
  getQuotaStatus,
  refundQuota,
  type QuotaLedger,
} from "@/lib/scanner/quota";

function consumeN(n: number, cycleId: string, ledger: QuotaLedger = []): QuotaLedger {
  let l = ledger;
  for (let i = 0; i < n; i++) {
    const r = consumeQuota(l, `${cycleId}-t${i}`, cycleId);
    if (!r.ok) throw new Error(r.code);
    l = r.ledger;
  }
  return l;
}

describe("cuota por ciclo", () => {
  it("el límite es 5 por ciclo", () => {
    expect(SCANNER_CYCLE_TICKET_LIMIT).toBe(5);
  });

  it("permite 5 tickets y rechaza el sexto en el mismo ciclo", () => {
    const ledger = consumeN(5, "c1");
    expect(getQuotaStatus(ledger, "c1")).toEqual({ limit: 5, used: 5, remaining: 0 });
    expect(consumeQuota(ledger, "otro", "c1")).toEqual({ ok: false, code: "QUOTA_EXCEEDED" });
  });

  it("es idempotente por ticket: repetir no vuelve a consumir", () => {
    const first = consumeQuota([], "t1", "c1");
    if (!first.ok) throw new Error();
    const again = consumeQuota(first.ledger, "t1", "c1");
    expect(again).toMatchObject({ ok: true, idempotent: true });
    expect(getQuotaStatus(again.ok ? again.ledger : [], "c1").used).toBe(1);
  });

  it("repetir un ticket ya consumido funciona incluso con el cupo lleno", () => {
    const ledger = consumeN(5, "c1");
    expect(consumeQuota(ledger, "c1-t0", "c1")).toMatchObject({ ok: true, idempotent: true });
  });

  it("solo se reinicia al cambiar de ciclo (nuevo cycleId)", () => {
    const ledger = consumeN(5, "c1");
    expect(getQuotaStatus(ledger, "c2")).toEqual({ limit: 5, used: 0, remaining: 5 });
    expect(consumeQuota(ledger, "nuevo", "c2")).toMatchObject({ ok: true, idempotent: false });
  });

  it("no depende del tiempo: avanzar el reloj no reinicia el cupo", () => {
    const ledger = consumeN(5, "c1");
    const realNow = Date.now;
    Date.now = () => realNow() + 10 * 24 * 3600 * 1000;
    try {
      expect(consumeQuota(ledger, "x", "c1")).toEqual({ ok: false, code: "QUOTA_EXCEEDED" });
    } finally {
      Date.now = realNow;
    }
  });

  it("un ticket consumido en un ciclo no vuelve a contar en el siguiente", () => {
    const ledger = consumeN(1, "c1");
    const r = consumeQuota(ledger, "c1-t0", "c2");
    expect(r).toMatchObject({ ok: true, idempotent: true });
    expect(getQuotaStatus(r.ok ? r.ledger : [], "c2").used).toBe(0);
  });

  it("rechaza identificadores vacíos", () => {
    expect(consumeQuota([], "t", "  ")).toEqual({ ok: false, code: "INVALID_CYCLE" });
    expect(consumeQuota([], "", "c1")).toEqual({ ok: false, code: "INVALID_TICKET" });
  });

  it("reembolsa como máximo una vez y en el ciclo del consumo", () => {
    const ledger = consumeN(5, "c1");
    const refund = refundQuota(ledger, "c1-t0");
    if (!refund.ok) throw new Error();
    expect(getQuotaStatus(refund.ledger, "c1").used).toBe(4);
    const again = refundQuota(refund.ledger, "c1-t0");
    expect(again).toMatchObject({ ok: true, idempotent: true });
    expect(getQuotaStatus(again.ok ? again.ledger : [], "c1").used).toBe(4);
    expect(consumeQuota(refund.ledger, "nuevo", "c1")).toMatchObject({ ok: true });
  });

  it("no reembolsa un ticket sin consumo previo", () => {
    expect(refundQuota([], "t1")).toEqual({ ok: false, code: "NOTHING_TO_REFUND" });
  });

  it("no muta el libro de entrada", () => {
    const ledger: QuotaLedger = Object.freeze([]);
    expect(() => consumeQuota(ledger, "t1", "c1")).not.toThrow();
    expect(ledger).toHaveLength(0);
  });
});
