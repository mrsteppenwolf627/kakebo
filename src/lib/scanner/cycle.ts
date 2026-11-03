/**
 * Identificador de ciclo del escáner (Fase 6).
 *
 * Decisión del propietario: `cycleId` es el `months.id` del ciclo financiero
 * ACTUAL, es decir, la fila `months` con `status = "open"` que devuelve
 * `getOpenMonth` (src/lib/months.ts). Este módulo solo valida y proyecta; no
 * lee la base de datos ni cambia la lógica de ciclos. El tipo de columna de
 * `months.id` no está definido en ninguna migración del repositorio, por eso
 * solo se exige una cadena opaca, no vacía y sin caracteres inesperados.
 */
import type { MonthRow } from "@/lib/months";

/** `months.id`. Opaco: no se interpreta ni se deriva de año/mes. */
export type CycleId = string;

const MAX_CYCLE_ID_LENGTH = 64;
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

export function isCycleId(value: unknown): value is CycleId {
  return typeof value === "string" && value.length <= MAX_CYCLE_ID_LENGTH && SAFE_ID.test(value);
}

export type CycleIdResult =
  | { ok: true; cycleId: CycleId }
  | { ok: false; code: "NO_OPEN_CYCLE" | "CYCLE_CLOSED" | "INVALID_CYCLE" };

/** Resuelve el `cycleId` a partir del ciclo abierto del usuario; un ciclo cerrado o ausente no sirve. */
export function cycleIdFromMonth(month: Pick<MonthRow, "id" | "status"> | null | undefined): CycleIdResult {
  if (!month) return { ok: false, code: "NO_OPEN_CYCLE" };
  if (month.status !== "open") return { ok: false, code: "CYCLE_CLOSED" };
  return isCycleId(month.id) ? { ok: true, cycleId: month.id } : { ok: false, code: "INVALID_CYCLE" };
}
