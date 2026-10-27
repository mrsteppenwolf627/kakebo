/**
 * Envoltorios de las funciones SQL del escáner (Fase 7). SOLO servidor.
 *
 * Reciben el cliente Supabase de la SESIÓN DEL USUARIO (RLS activa): la identidad la pone la base de datos con
 * `auth.uid()`, nunca un `user_id` pasado desde aquí. Las funciones existen solo tras aplicar la migración
 * `20261027120000_ticket_scanner_persistence.sql` (NO aplicada en ningún entorno remoto).
 */
import { isCycleId, type CycleId } from "./cycle";
import { SCANNER_CYCLE_TICKET_LIMIT } from "./quota";

export interface RpcClientLike {
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

export type PersistenceErrorCode =
  | "UNAUTHENTICATED" | "INVALID_KEY" | "NO_OPEN_CYCLE" | "TICKET_NOT_FOUND" | "ILLEGAL_TRANSITION"
  | "INVALID_PATH" | "INVALID_CYCLE" | "CYCLE_CLOSED" | "TICKET_EXPIRED" | "QUOTA_EXCEEDED"
  | "INVALID_REASON" | "VERSION_CONFLICT" | "VALIDATION_ERROR" | "IDEMPOTENCY_KEY_REUSED" | "BACKEND_ERROR";

const KNOWN: ReadonlySet<string> = new Set<PersistenceErrorCode>([
  "UNAUTHENTICATED", "INVALID_KEY", "NO_OPEN_CYCLE", "TICKET_NOT_FOUND", "ILLEGAL_TRANSITION", "INVALID_PATH",
  "INVALID_CYCLE", "CYCLE_CLOSED", "TICKET_EXPIRED", "QUOTA_EXCEEDED", "INVALID_REASON", "VERSION_CONFLICT",
  "VALIDATION_ERROR", "IDEMPOTENCY_KEY_REUSED",
]);

export type PersistenceFailure = { ok: false; code: PersistenceErrorCode };

/** Normaliza la respuesta `jsonb`. El texto de error de la base nunca se propaga (puede contener datos). */
async function call<T extends object>(
  client: RpcClientLike,
  fn: string,
  args: Record<string, unknown>
): Promise<(T & { ok: true }) | PersistenceFailure> {
  const { data, error } = await client.rpc(fn, args);
  if (error || typeof data !== "object" || data === null) return { ok: false, code: "BACKEND_ERROR" };
  const row = data as { ok?: unknown; code?: unknown };
  if (row.ok === true) return data as T & { ok: true };
  return { ok: false, code: typeof row.code === "string" && KNOWN.has(row.code) ? (row.code as PersistenceErrorCode) : "BACKEND_ERROR" };
}

export interface ScannerTicketInput {
  source: "camera" | "image" | "pdf";
  locale: "es" | "en";
  declaredMime: string;
  declaredSizeBytes: number;
}

export const createScannerTicket = (client: RpcClientLike, idempotencyKey: string, input?: ScannerTicketInput) =>
  call<{ ticketId: string; cycleId: CycleId; idempotent: boolean }>(
    client,
    input ? "fn_scanner_create_ticket_v2" : "fn_scanner_create_ticket",
    input
      ? {
          p_idempotency_key: idempotencyKey,
          p_source: input.source,
          p_locale: input.locale,
          p_declared_mime: input.declaredMime,
          p_declared_size_bytes: input.declaredSizeBytes,
        }
      : { p_idempotency_key: idempotencyKey },
  );

export const registerScannerUpload = (client: RpcClientLike, ticketId: string, objectPath: string) =>
  call<{ idempotent: boolean }>(client, "fn_scanner_register_upload", { p_ticket_id: ticketId, p_object_path: objectPath });

/** `uploaded → processing` y consumo de cuota (5 por `months.id`) en una sola transacción SQL. */
export const startScannerProcessing = (client: RpcClientLike, ticketId: string) =>
  call<{ idempotent: boolean; used?: number; remaining?: number }>(client, "fn_scanner_start_processing", {
    p_ticket_id: ticketId,
  });

export interface ScannerDraftLineInput {
  kind: "item" | "adjustment";
  description: string | null;
  amountCents: number;
  categoryProposal: "survival" | "optional" | "culture" | "extra" | null;
  category: "survival" | "optional" | "culture" | "extra" | null;
  allocations: readonly { category: "survival" | "optional" | "culture" | "extra"; amountCents: number }[];
}

export const replaceScannerDraft = (
  client: RpcClientLike,
  ticketId: string,
  draftVersion: number,
  draft: { merchant: string | null; date: string | null; totalCents: number | null; lines: readonly ScannerDraftLineInput[] },
) => call<{ draftVersion: number }>(client, "fn_scanner_replace_draft", {
  p_ticket_id: ticketId,
  p_draft_version: draftVersion,
  p_merchant: draft.merchant,
  p_receipt_date: draft.date,
  p_total_cents: draft.totalCents,
  p_lines: draft.lines,
});

export interface ScannerExpenseResult {
  expenseId: string;
  category: string;
  amountCents: number;
}

/** Confirma el borrador revisado y crea sus gastos dentro de una única transacción SQL. */
export const confirmScannerTicket = (
  client: RpcClientLike,
  ticketId: string,
  confirmKey: string,
  draftVersion: number,
) =>
  call<{ status: "confirmed"; idempotent: boolean; expenses: ScannerExpenseResult[] }>(
    client,
    "fn_scanner_confirm_ticket",
    { p_ticket_id: ticketId, p_confirm_key: confirmKey, p_draft_version: draftVersion },
  );

export interface ScannerQuotaStatus {
  cycleId: CycleId;
  limit: number;
  used: number;
  remaining: number;
}

export async function getScannerQuotaStatus(client: RpcClientLike): Promise<({ ok: true } & ScannerQuotaStatus) | PersistenceFailure> {
  const r = await call<ScannerQuotaStatus>(client, "fn_scanner_quota_status", {});
  if (!r.ok) return r;
  // Defensa en profundidad: el límite de SQL y el de TypeScript deben coincidir, y el ciclo ser un id válido.
  if (r.limit !== SCANNER_CYCLE_TICKET_LIMIT || !isCycleId(r.cycleId)) return { ok: false, code: "BACKEND_ERROR" };
  return r;
}
