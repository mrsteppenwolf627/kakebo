/**
 * Borrador de revisión, división por categorías y confirmación obligatoria.
 *
 * Módulo puro. NO crea gastos: devuelve un plan (`ExpensePlanGroup[]`) que una
 * futura función atómica de servidor convertirá en gastos. El esquema real de
 * `expenses` y el vínculo ticket↔gasto siguen sin demostrarse (bloqueo P1 nº 3).
 *
 * Reglas:
 *  - El OCR/clasificador solo PROPONE (`categoryProposal`); una línea cuenta
 *    como categorizada únicamente cuando la persona fija `category`.
 *  - Sin `userConfirmed === true` nunca se confirma ni se crea nada.
 *  - Categorías: las cuatro existentes de `src/lib/schemas/common.ts`.
 *  - Importes en céntimos enteros; moneda EUR.
 *  - Los avisos (`DraftIssue`) llevan código e id de línea, nunca valores.
 */
import type { CategoryKey } from "@/lib/schemas/common";
import { transitionTicket, type TicketState, type TransitionErrorCode } from "./ticket-state";
import type { NormalizedReceiptV1 } from "./ocr-contract";

export const SCANNER_CATEGORIES: readonly CategoryKey[] = ["survival", "optional", "culture", "extra"];

export interface DraftAllocation {
  category: CategoryKey;
  amountCents: number;
}

export interface DraftLine {
  id: string;
  kind: "item" | "adjustment";
  description: string | null;
  amountCents: number;
  /** Propuesta automática (reglas); no cuenta como decisión de la persona. */
  categoryProposal: CategoryKey | null;
  /** Decisión de la persona. */
  category: CategoryKey | null;
  /** ≥2 partes cuando la línea se divide; entonces `category` es null. */
  allocations: readonly DraftAllocation[];
}

export interface ReceiptDraft {
  version: number;
  merchant: string | null;
  /** ISO yyyy-mm-dd. */
  date: string | null;
  currency: string | null;
  totalCents: number | null;
  lines: readonly DraftLine[];
}

const isCategory = (value: unknown): value is CategoryKey =>
  typeof value === "string" && (SCANNER_CATEGORIES as readonly string[]).includes(value);

const isCents = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value !== 0;

/** Crea un borrador desde el resultado normalizado. Ninguna línea queda categorizada. */
export function draftFromReceipt(
  receipt: NormalizedReceiptV1,
  newLineId: () => string,
  classify?: (description: string | null) => CategoryKey | null
): ReceiptDraft {
  const lines: DraftLine[] = [];
  for (const line of receipt.lines) {
    const amount = line.amountCents.value;
    if (!isCents(amount)) continue;
    const description = line.description.value;
    const proposal = classify ? classify(description) : null;
    lines.push({
      id: newLineId(),
      kind: "item",
      description,
      amountCents: amount,
      categoryProposal: isCategory(proposal) ? proposal : null,
      category: null,
      allocations: [],
    });
  }
  return {
    version: 1,
    merchant: receipt.merchant.value,
    date: receipt.date.value,
    currency: receipt.currency.value,
    totalCents: receipt.totalCents.value,
    lines,
  };
}

export type LineEditErrorCode =
  | "INVALID_CATEGORY"
  | "SPLIT_TOO_FEW_PARTS"
  | "SPLIT_INVALID_AMOUNT"
  | "SPLIT_SUM_MISMATCH";

export type LineEditResult = { ok: true; line: DraftLine } | { ok: false; code: LineEditErrorCode };

/** La persona asigna una categoría a la línea completa (anula cualquier división). */
export function assignLineCategory(line: DraftLine, category: unknown): LineEditResult {
  if (!isCategory(category)) return { ok: false, code: "INVALID_CATEGORY" };
  return { ok: true, line: { ...line, category, allocations: [] } };
}

/** La persona acepta la propuesta automática tal cual. */
export function acceptProposal(line: DraftLine): LineEditResult {
  return assignLineCategory(line, line.categoryProposal);
}

/** Divide una línea entre ≥2 partes; la suma debe ser exactamente el importe de la línea. */
export function splitLine(line: DraftLine, parts: readonly DraftAllocation[]): LineEditResult {
  if (parts.length < 2) return { ok: false, code: "SPLIT_TOO_FEW_PARTS" };
  if (parts.some((p) => !isCategory(p.category))) return { ok: false, code: "INVALID_CATEGORY" };
  const sign = Math.sign(line.amountCents);
  if (parts.some((p) => !isCents(p.amountCents) || Math.sign(p.amountCents) !== sign)) {
    return { ok: false, code: "SPLIT_INVALID_AMOUNT" };
  }
  const sum = parts.reduce((acc, p) => acc + p.amountCents, 0);
  if (sum !== line.amountCents) return { ok: false, code: "SPLIT_SUM_MISMATCH" };
  return { ok: true, line: { ...line, category: null, allocations: parts.map((p) => ({ ...p })) } };
}

/** Reparto efectivo de una línea: sus partes, o su categoría única; vacío si no está decidida. */
export function effectiveAllocations(line: DraftLine): readonly DraftAllocation[] {
  if (line.allocations.length >= 2) return line.allocations;
  if (line.category) return [{ category: line.category, amountCents: line.amountCents }];
  return [];
}

/** Totales por las cuatro categorías (siempre las cuatro claves). */
export function categoryTotals(lines: readonly DraftLine[]): Record<CategoryKey, number> {
  const totals: Record<CategoryKey, number> = { survival: 0, optional: 0, culture: 0, extra: 0 };
  for (const line of lines) {
    for (const part of effectiveAllocations(line)) totals[part.category] += part.amountCents;
  }
  return totals;
}

export type DraftIssueCode =
  | "MISSING_MERCHANT"
  | "MISSING_DATE"
  | "INVALID_TOTAL"
  | "NOT_EUR"
  | "NO_LINES"
  | "LINE_UNCATEGORIZED"
  | "SPLIT_MISMATCH"
  | "SUM_MISMATCH"
  | "GROUP_NOT_POSITIVE";

export interface DraftIssue {
  code: DraftIssueCode;
  lineId?: string;
}

function isRealIsoDate(value: string | null): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function validateDraft(draft: ReceiptDraft): DraftIssue[] {
  const issues: DraftIssue[] = [];
  if (!draft.merchant || draft.merchant.trim() === "") issues.push({ code: "MISSING_MERCHANT" });
  if (!isRealIsoDate(draft.date)) issues.push({ code: "MISSING_DATE" });
  if (draft.currency !== "EUR") issues.push({ code: "NOT_EUR" });
  const totalOk = typeof draft.totalCents === "number" && Number.isSafeInteger(draft.totalCents) && draft.totalCents > 0;
  if (!totalOk) issues.push({ code: "INVALID_TOTAL" });
  if (draft.lines.length === 0) issues.push({ code: "NO_LINES" });

  for (const line of draft.lines) {
    const parts = effectiveAllocations(line);
    if (parts.length === 0) {
      issues.push({ code: "LINE_UNCATEGORIZED", lineId: line.id });
      continue;
    }
    const sum = parts.reduce((acc, p) => acc + p.amountCents, 0);
    const validParts = parts.every((p) => isCategory(p.category) && isCents(p.amountCents));
    if (!validParts || sum !== line.amountCents) issues.push({ code: "SPLIT_MISMATCH", lineId: line.id });
  }

  const linesSum = draft.lines.reduce((acc, l) => acc + l.amountCents, 0);
  if (totalOk && draft.lines.length > 0 && linesSum !== draft.totalCents) issues.push({ code: "SUM_MISMATCH" });

  const totals = categoryTotals(draft.lines);
  if (SCANNER_CATEGORIES.some((c) => totals[c] < 0)) issues.push({ code: "GROUP_NOT_POSITIVE" });
  return issues;
}

export interface ExpensePlanGroup {
  groupNo: number;
  category: CategoryKey;
  amountCents: number;
}

/** Un grupo (futuro gasto) por categoría con importe distinto de cero, en orden fijo. */
export function buildExpensePlan(draft: ReceiptDraft): ExpensePlanGroup[] {
  const totals = categoryTotals(draft.lines);
  return SCANNER_CATEGORIES.filter((c) => totals[c] !== 0).map((category, i) => ({
    groupNo: i + 1,
    category,
    amountCents: totals[category],
  }));
}

export interface ConfirmRequest {
  draftVersion: number;
  /** Debe ser exactamente `true`: acción explícita de la persona tras revisar. */
  userConfirmed: boolean;
  /** Clave de idempotencia de la confirmación. */
  confirmKey: string;
  /** Resuelto por el llamador desde el ciclo real (`src/lib/months.ts`). */
  cycleOpen: boolean;
}

export type ConfirmErrorCode =
  | TransitionErrorCode
  | "CONFIRMATION_REQUIRED"
  | "CYCLE_CLOSED"
  | "VERSION_CONFLICT"
  | "VALIDATION_ERROR"
  | "INVALID_CONFIRM_KEY";

export type ConfirmResult =
  | { ok: true; ticket: TicketState; plan: ExpensePlanGroup[]; idempotent: boolean }
  | { ok: false; code: ConfirmErrorCode; issues?: DraftIssue[] };

export function confirmDraft(ticket: TicketState, draft: ReceiptDraft, request: ConfirmRequest): ConfirmResult {
  if (request.userConfirmed !== true) return { ok: false, code: "CONFIRMATION_REQUIRED" };
  if (typeof request.confirmKey !== "string" || request.confirmKey.trim() === "") {
    return { ok: false, code: "INVALID_CONFIRM_KEY" };
  }
  // Repetición con la misma clave: mismo resultado, sin crear nada nuevo.
  if (ticket.status === "confirmed") {
    return ticket.confirmKey === request.confirmKey
      ? { ok: true, ticket, plan: buildExpensePlan(draft), idempotent: true }
      : { ok: false, code: "ILLEGAL_TRANSITION" };
  }
  if (ticket.status !== "needs_review") return { ok: false, code: "ILLEGAL_TRANSITION" };
  if (request.draftVersion !== draft.version) return { ok: false, code: "VERSION_CONFLICT" };
  if (!request.cycleOpen) return { ok: false, code: "CYCLE_CLOSED" };

  const issues = validateDraft(draft);
  if (issues.length > 0) return { ok: false, code: "VALIDATION_ERROR", issues };

  const moved = transitionTicket(ticket, "confirmed");
  if (!moved.ok) return moved;
  return {
    ok: true,
    ticket: { ...moved.ticket, confirmKey: request.confirmKey },
    plan: buildExpensePlan(draft),
    idempotent: false,
  };
}
