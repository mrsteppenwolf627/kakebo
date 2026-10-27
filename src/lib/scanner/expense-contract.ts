/**
 * Contrato de creación de gastos tras la confirmación (Fase 7). SOLO contrato: no escribe en `expenses`.
 *
 * ESTADO: BLOQUEADO para implementación real (ver docs/ticket-scanner/phase-7-persistence.md §6).
 *  - El esquema OBSERVADO de `expenses` (id, user_id, date, amount, category, note, created_at, color) no
 *    muestra `month_id` ni `subcategory`, pero el código (POST /api/expenses → `fn_create_expense`) los usa.
 *    No se sabe si la base real tiene aplicada la fase 3B. Sin eso no hay vía segura ni atómica de crear gastos.
 *  - `expenses` no tiene columna de trazabilidad hacia el ticket y este repo no modifica `expenses`, así que una
 *    caída entre crear gastos y marcar el ticket `confirmed` podría duplicar gastos al reintentar.
 *
 * Lo que sí fija este módulo, con el esquema real de la aplicación (`createExpenseSchema`, categorías de
 * `common.ts`): cómo se proyecta el plan agrupado por las cuatro categorías a entradas de gasto.
 */
import { createExpenseSchema, type CreateExpenseInput } from "@/lib/schemas/expense";
import type { CategoryKey } from "@/lib/schemas/common";
import type { ExpensePlanGroup } from "./draft";

export interface ScannerExpenseInput {
  groupNo: number;
  category: CategoryKey;
  /** Entrada para el esquema existente de gasto (`amount` en euros, > 0). */
  expense: CreateExpenseInput;
  /** Clave determinista por (ticket, grupo): base de una futura idempotencia/trazabilidad. */
  groupKey: string;
}

export type ExpenseContractError = "NO_GROUPS" | "INVALID_DATE" | "INVALID_GROUP" | "TOO_MANY_GROUPS";

export type ExpenseContractResult =
  | { ok: true; ticketId: string; cycleId: string; expenses: ScannerExpenseInput[] }
  | { ok: false; code: ExpenseContractError };

/** Un gasto por categoría con importe > 0 (máximo 4: las cuatro categorías). */
export function planToExpenseInputs(args: {
  ticketId: string;
  cycleId: string;
  /** yyyy-mm-dd confirmado por la persona (no se infiere del OCR). */
  date: string;
  plan: readonly ExpensePlanGroup[];
  /** Nota opcional elegida por la persona; por defecto vacía (no se copia comercio ni texto OCR). */
  note?: string;
}): ExpenseContractResult {
  if (args.plan.length === 0) return { ok: false, code: "NO_GROUPS" };
  if (args.plan.length > 4) return { ok: false, code: "TOO_MANY_GROUPS" };
  const expenses: ScannerExpenseInput[] = [];
  for (const g of args.plan) {
    if (!Number.isSafeInteger(g.amountCents) || g.amountCents <= 0) return { ok: false, code: "INVALID_GROUP" };
    const parsed = createExpenseSchema.safeParse({
      date: args.date,
      amount: g.amountCents / 100,
      category: g.category,
      note: args.note ?? "",
      month_id: args.cycleId,
    });
    if (!parsed.success) {
      const dateIssue = parsed.error.issues.some((i) => i.path[0] === "date");
      return { ok: false, code: dateIssue ? "INVALID_DATE" : "INVALID_GROUP" };
    }
    expenses.push({
      groupNo: g.groupNo,
      category: g.category,
      expense: parsed.data,
      groupKey: `${args.ticketId}:${g.groupNo}`,
    });
  }
  return { ok: true, ticketId: args.ticketId, cycleId: args.cycleId, expenses };
}

/**
 * Escritor que implementará la función atómica de servidor cuando el esquema esté demostrado. Debe crear TODOS
 * los gastos del ticket y marcar `confirmed` en una única transacción, e ignorar `groupKey` ya procesadas.
 * Hoy NO existe implementación: no hay ruta que lo invoque.
 */
export interface ScannerExpenseWriter {
  createAll(input: Extract<ExpenseContractResult, { ok: true }>): Promise<{ ok: true; expenseIds: string[] } | { ok: false; code: string }>;
}
