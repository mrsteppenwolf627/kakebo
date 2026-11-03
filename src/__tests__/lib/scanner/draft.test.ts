import { describe, expect, it } from "vitest";
import { categorySchema, type CategoryKey } from "@/lib/schemas/common";
import {
  SCANNER_CATEGORIES,
  acceptProposal,
  assignLineCategory,
  buildExpensePlan,
  categoryTotals,
  confirmDraft,
  draftFromReceipt,
  splitLine,
  validateDraft,
  type ConfirmRequest,
} from "@/lib/scanner/draft";
import { createTicket, transitionTicket, type TicketState } from "@/lib/scanner/ticket-state";
import { line, readyDraft, syntheticReceipt } from "./helpers";

function reviewTicket(): TicketState {
  let t = createTicket("t1");
  for (const s of ["uploaded", "processing", "needs_review"] as const) {
    const r = transitionTicket(t, s);
    if (!r.ok) throw new Error();
    t = r.ticket;
  }
  return t;
}
const req = (over: Partial<ConfirmRequest> = {}): ConfirmRequest => ({
  draftVersion: 3,
  userConfirmed: true,
  confirmKey: "k1",
  cycleOpen: true,
  ...over,
});

describe("categorías", () => {
  it("son exactamente las cuatro existentes", () => {
    expect([...SCANNER_CATEGORIES]).toEqual([...categorySchema.options]);
  });
});

describe("borrador desde OCR: solo propone", () => {
  it("ninguna línea queda categorizada aunque haya propuesta; se omiten líneas sin importe", () => {
    let n = 0;
    const draft = draftFromReceipt(syntheticReceipt(), () => `l${++n}`, () => "survival");
    expect(draft.lines).toHaveLength(2);
    expect(draft.lines.every((l) => l.category === null && l.categoryProposal === "survival")).toBe(true);
    expect(validateDraft(draft).filter((i) => i.code === "LINE_UNCATEGORIZED")).toHaveLength(2);
  });

  it("ignora propuestas fuera de las cuatro categorías", () => {
    const draft = draftFromReceipt(syntheticReceipt(), () => "x", () => "invented" as unknown as CategoryKey);
    expect(draft.lines[0].categoryProposal).toBeNull();
  });

  it("aceptar la propuesta es una acción explícita; sin propuesta falla", () => {
    expect(acceptProposal(line("a", 100, { categoryProposal: "extra" }))).toMatchObject({ ok: true, line: { category: "extra" } });
    expect(acceptProposal(line("a", 100))).toEqual({ ok: false, code: "INVALID_CATEGORY" });
  });
});

describe("división por categorías", () => {
  const base = line("a", 1000);

  it("divide entre las cuatro categorías con suma exacta", () => {
    const parts = SCANNER_CATEGORIES.map((category) => ({ category, amountCents: 250 }));
    const r = splitLine(base, parts);
    expect(r.ok).toBe(true);
    const draft = { ...readyDraft(), lines: [r.ok ? r.line : base] };
    expect(categoryTotals(draft.lines)).toEqual({ survival: 250, optional: 250, culture: 250, extra: 250 });
    expect(validateDraft(draft)).toEqual([]);
    expect(buildExpensePlan(draft)).toHaveLength(4);
  });

  it("rechaza menos de 2 partes, categorías inválidas, importes inválidos y sumas distintas", () => {
    const bad = "x" as unknown as CategoryKey;
    expect(splitLine(base, [{ category: "extra", amountCents: 1000 }])).toEqual({ ok: false, code: "SPLIT_TOO_FEW_PARTS" });
    expect(splitLine(base, [{ category: bad, amountCents: 500 }, { category: "extra", amountCents: 500 }])).toEqual({ ok: false, code: "INVALID_CATEGORY" });
    expect(splitLine(base, [{ category: "extra", amountCents: 1500 }, { category: "culture", amountCents: -500 }])).toEqual({ ok: false, code: "SPLIT_INVALID_AMOUNT" });
    expect(splitLine(base, [{ category: "extra", amountCents: 10.5 }, { category: "culture", amountCents: 989.5 }])).toEqual({ ok: false, code: "SPLIT_INVALID_AMOUNT" });
    expect(splitLine(base, [{ category: "extra", amountCents: 500 }, { category: "culture", amountCents: 400 }])).toEqual({ ok: false, code: "SPLIT_SUM_MISMATCH" });
  });

  it("asignar categoría completa anula una división previa", () => {
    const split = splitLine(base, [{ category: "extra", amountCents: 500 }, { category: "culture", amountCents: 500 }]);
    if (!split.ok) throw new Error();
    expect(assignLineCategory(split.line, "optional")).toMatchObject({ ok: true, line: { category: "optional", allocations: [] } });
    expect(assignLineCategory(split.line, "general")).toEqual({ ok: false, code: "INVALID_CATEGORY" });
  });

  it("plan: un grupo por categoría usada, con suma igual al total", () => {
    expect(buildExpensePlan(readyDraft())).toEqual([
      { groupNo: 1, category: "survival", amountCents: 600 },
      { groupNo: 2, category: "culture", amountCents: 400 },
    ]);
  });

  it("descuentos: línea negativa dividida con signo coherente", () => {
    const r = splitLine(line("d", -300), [{ category: "extra", amountCents: -100 }, { category: "culture", amountCents: -200 }]);
    expect(r.ok).toBe(true);
  });
});

describe("validación del borrador", () => {
  it("borrador listo → sin avisos", () => {
    expect(validateDraft(readyDraft())).toEqual([]);
  });

  it("detecta cabecera incompleta, moneda, fecha imposible y suma distinta", () => {
    const d = { ...readyDraft(), merchant: " ", date: "2026-02-31", currency: "USD", totalCents: 999 };
    expect(validateDraft(d).map((i) => i.code)).toEqual(
      expect.arrayContaining(["MISSING_MERCHANT", "MISSING_DATE", "NOT_EUR", "SUM_MISMATCH"])
    );
  });

  it("total no válido y sin líneas", () => {
    const codes = validateDraft({ ...readyDraft(), totalCents: 0, lines: [] }).map((i) => i.code);
    expect(codes).toEqual(expect.arrayContaining(["INVALID_TOTAL", "NO_LINES"]));
  });

  it("los avisos no incluyen valores", () => {
    for (const i of validateDraft({ ...readyDraft(), merchant: null, totalCents: 1 })) {
      expect(Object.keys(i).every((k) => k === "code" || k === "lineId")).toBe(true);
    }
  });

  it("un grupo de categoría negativo bloquea", () => {
    const d = { ...readyDraft(), totalCents: 400, lines: [line("a", 700, { category: "survival" }), line("b", -300, { category: "culture" })] };
    expect(validateDraft(d).map((i) => i.code)).toContain("GROUP_NOT_POSITIVE");
  });
});

describe("confirmación obligatoria", () => {
  it("sin confirmación explícita no se confirma ni se genera plan", () => {
    for (const v of [false, undefined, "true", 1]) {
      const r = confirmDraft(reviewTicket(), readyDraft(), req({ userConfirmed: v as unknown as boolean }));
      expect(r).toEqual({ ok: false, code: "CONFIRMATION_REQUIRED" });
    }
  });

  it("confirma con revisión completa y fija la clave", () => {
    const r = confirmDraft(reviewTicket(), readyDraft(), req());
    expect(r).toMatchObject({ ok: true, idempotent: false, ticket: { status: "confirmed", confirmKey: "k1", originalStorage: "deletion_pending" } });
    expect(r.ok && r.plan.reduce((a, g) => a + g.amountCents, 0)).toBe(1000);
  });

  it("misma clave → mismo plan sin duplicar; otra clave → ILLEGAL_TRANSITION", () => {
    const first = confirmDraft(reviewTicket(), readyDraft(), req());
    if (!first.ok) throw new Error();
    const again = confirmDraft(first.ticket, readyDraft(), req());
    expect(again).toMatchObject({ ok: true, idempotent: true });
    expect(again.ok && again.plan).toEqual(first.plan);
    expect(confirmDraft(first.ticket, readyDraft(), req({ confirmKey: "k2" }))).toEqual({ ok: false, code: "ILLEGAL_TRANSITION" });
  });

  it("bloquea ciclo cerrado, versión distinta, estado incorrecto y clave vacía", () => {
    expect(confirmDraft(reviewTicket(), readyDraft(), req({ cycleOpen: false }))).toEqual({ ok: false, code: "CYCLE_CLOSED" });
    expect(confirmDraft(reviewTicket(), readyDraft(), req({ draftVersion: 2 }))).toEqual({ ok: false, code: "VERSION_CONFLICT" });
    expect(confirmDraft(createTicket("t"), readyDraft(), req())).toEqual({ ok: false, code: "ILLEGAL_TRANSITION" });
    expect(confirmDraft(reviewTicket(), readyDraft(), req({ confirmKey: " " }))).toEqual({ ok: false, code: "INVALID_CONFIRM_KEY" });
  });

  it("bloquea con líneas sin categorizar aunque haya propuesta", () => {
    const d = { ...readyDraft(), lines: [line("l1", 600, { categoryProposal: "survival" }), line("l2", 400, { category: "culture" })] };
    expect(confirmDraft(reviewTicket(), d, req())).toMatchObject({
      ok: false,
      code: "VALIDATION_ERROR",
      issues: [{ code: "LINE_UNCATEGORIZED", lineId: "l1" }],
    });
  });

  it("tras un rechazo el ticket sigue en revisión", () => {
    const t = reviewTicket();
    confirmDraft(t, readyDraft(), req({ userConfirmed: false }));
    expect(t.status).toBe("needs_review");
    expect(t.confirmKey).toBeNull();
  });
});
