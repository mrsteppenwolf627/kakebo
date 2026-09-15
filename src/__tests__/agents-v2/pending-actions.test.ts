import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PendingAction } from "@/lib/agents-v2/types";

vi.mock("@/lib/logger", () => ({
  apiLogger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const ACTION: PendingAction = {
  toolCall: {
    id: "call_1",
    type: "function",
    function: { name: "createTransaction", arguments: JSON.stringify({ amount: 50 }) },
  },
  toolName: "createTransaction",
  arguments: { amount: 50 },
  description: "¿Confirmas que quieres registrar un gasto de 50€?",
};

/**
 * In-memory stand-in for the `ai_pending_actions` table that mimics the
 * real Postgres semantics this module relies on: an UPDATE conditioned on
 * `status = 'pending'` only ever matches the row ONCE, however many times
 * it's attempted (simulating the atomicity a real UPDATE ... WHERE ...
 * RETURNING gets for free from row-level locking). This lets the "two
 * concurrent confirmations" test assert the real guarantee instead of just
 * a mock returning canned values.
 */
function makeFakeTable() {
  const rows = new Map<string, Record<string, unknown>>();
  let nextId = 1;

  function supabaseStub(): SupabaseClient {
    return {
      from: vi.fn(() => {
        const state: { eqs: Array<[string, unknown]>; gt: [string, unknown] | null } = {
          eqs: [],
          gt: null,
        };

        const builder = {
          insert: (payload: Record<string, unknown>) => {
            const id = `pa-${nextId++}`;
            rows.set(id, { id, ...payload });
            return {
              select: () => ({
                single: async () => ({ data: { id }, error: null }),
              }),
            };
          },
          update: (patch: Record<string, unknown>) => {
            (builder as unknown as { _patch: Record<string, unknown> })._patch = patch;
            return builder;
          },
          eq: (col: string, val: unknown) => {
            state.eqs.push([col, val]);
            return builder;
          },
          gt: (col: string, val: unknown) => {
            state.gt = [col, val];
            return builder;
          },
          select: () => builder,
          maybeSingle: async () => {
            const patch = (builder as unknown as { _patch?: Record<string, unknown> })._patch;
            const idEq = state.eqs.find(([c]) => c === "id");
            if (!idEq) return { data: null, error: null };
            const row = rows.get(idEq[1] as string);
            if (!row) return { data: null, error: null };

            const matchesAll = state.eqs.every(([c, v]) => row[c] === v);
            const matchesExpiry = !state.gt || (row[state.gt[0]] as string) > (state.gt[1] as string);

            if (!patch) {
              // Plain SELECT (diagnoseFailure): return the row if id/user match.
              if (!matchesAll) return { data: null, error: null };
              return { data: row, error: null };
            }

            if (!matchesAll || !matchesExpiry) {
              return { data: null, error: null };
            }

            Object.assign(row, patch);
            return { data: row, error: null };
          },
        };

        return builder as unknown as ReturnType<SupabaseClient["from"]>;
      }),
    } as unknown as SupabaseClient;
  }

  return { supabaseStub, rows };
}

// Fase 2.E (corrección de seguridad): ai_pending_actions es una tabla
// exclusiva de servidor sin políticas RLS para authenticated/anon — solo
// el cliente ADMINISTRADOR puede acceder. pending-actions.ts debe usar
// createAdminClient() internamente y NUNCA aceptar/usar un cliente de
// sesión para esto. Se mockea createAdminClient para verificar ambas cosas:
// (a) es lo único que se llama para tocar la tabla, (b) el cliente de
// sesión que un llamante pudiera pasar nunca se usa (las funciones ni
// siquiera aceptan ese parámetro).
let table: ReturnType<typeof makeFakeTable>;
const mockCreateAdminClient = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockCreateAdminClient(),
}));

import {
  createPendingAction,
  consumePendingAction,
  cancelPendingAction,
  confirmFailureMessage,
} from "@/lib/agents-v2/pending-actions";

describe("pending-actions (Fase 2.E — corrección de seguridad: tabla exclusiva de servidor)", () => {
  beforeEach(() => {
    table = makeFakeTable();
    mockCreateAdminClient.mockReset();
    mockCreateAdminClient.mockImplementation(() => table.supabaseStub());
  });

  it("createPendingAction usa createAdminClient() (no un cliente de sesión) y persiste la acción", async () => {
    const id = await createPendingAction("user-1", ACTION);

    expect(mockCreateAdminClient).toHaveBeenCalledTimes(1);
    expect(id).toBeTruthy();
    expect(table.rows.get(id!)).toMatchObject({
      user_id: "user-1",
      tool_name: "createTransaction",
      status: "pending",
    });
  });

  it("consumePendingAction y cancelPendingAction también usan createAdminClient() exclusivamente", async () => {
    const id = await createPendingAction("user-1", ACTION);
    mockCreateAdminClient.mockClear();

    await consumePendingAction("user-1", id!);
    expect(mockCreateAdminClient).toHaveBeenCalledTimes(1);

    const id2 = await createPendingAction("user-1", ACTION);
    mockCreateAdminClient.mockClear();
    await cancelPendingAction("user-1", id2!);
    expect(mockCreateAdminClient).toHaveBeenCalledTimes(1);
  });

  it("ninguna de las tres funciones acepta un SupabaseClient como parámetro (firma de solo userId/confirmationId/action)", () => {
    expect(createPendingAction.length).toBe(2); // (userId, action)
    expect(consumePendingAction.length).toBe(2); // (userId, confirmationId)
    expect(cancelPendingAction.length).toBe(2); // (userId, confirmationId)
  });

  it("confirmación válida: consume la fila y devuelve la acción para ejecutar exactamente una vez", async () => {
    const id = await createPendingAction("user-1", ACTION);
    const result = await consumePendingAction("user-1", id!);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.action.toolName).toBe("createTransaction");
    }
    expect(table.rows.get(id!)?.status).toBe("confirmed");
  });

  it("dos confirmaciones concurrentes del mismo id: solo una consigue ejecutar", async () => {
    const id = await createPendingAction("user-1", ACTION);

    const [first, second] = await Promise.all([
      consumePendingAction("user-1", id!),
      consumePendingAction("user-1", id!),
    ]);

    const successes = [first, second].filter((r) => r.success);
    expect(successes).toHaveLength(1);
  });

  it("repetición posterior con el mismo id ya confirmado: falla sin ejecutar nada", async () => {
    const id = await createPendingAction("user-1", ACTION);
    await consumePendingAction("user-1", id!);

    const again = await consumePendingAction("user-1", id!);
    expect(again.success).toBe(false);
    if (!again.success) expect(again.reason).toBe("used");
  });

  it("cancelar invalida la fila sin ejecutar nada, y confirmar después falla", async () => {
    const id = await createPendingAction("user-1", ACTION);

    const cancelResult = await cancelPendingAction("user-1", id!);
    expect(cancelResult.success).toBe(true);
    expect(table.rows.get(id!)?.status).toBe("cancelled");

    const confirmAfterCancel = await consumePendingAction("user-1", id!);
    expect(confirmAfterCancel.success).toBe(false);
    if (!confirmAfterCancel.success) expect(confirmAfterCancel.reason).toBe("cancelled");
  });

  it("cancelar un id ya confirmado no lo revierte (falla sin modificar nada)", async () => {
    const id = await createPendingAction("user-1", ACTION);
    await consumePendingAction("user-1", id!);

    const cancelResult = await cancelPendingAction("user-1", id!);
    expect(cancelResult.success).toBe(false);
    expect(table.rows.get(id!)?.status).toBe("confirmed"); // unchanged
  });

  it("confirmación caducada: falla sin ejecutar nada", async () => {
    const id = await createPendingAction("user-1", ACTION);
    // Force expiry in the past.
    table.rows.get(id!)!.expires_at = new Date(Date.now() - 1000).toISOString();

    const result = await consumePendingAction("user-1", id!);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe("expired");
  });

  it("id perteneciente a otro usuario: falla sin ejecutar nada, sin distinguir de 'no existe'", async () => {
    const id = await createPendingAction("user-1", ACTION);

    const result = await consumePendingAction("attacker-user", id!);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe("not_found");
  });

  it("id inexistente: falla sin ejecutar nada", async () => {
    const result = await consumePendingAction("user-1", "does-not-exist");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe("not_found");
  });

  it("confirmFailureMessage produce un mensaje humano distinto por motivo, sin filtrar detalles internos", () => {
    expect(confirmFailureMessage("used")).toMatch(/ya se confirmó/i);
    expect(confirmFailureMessage("cancelled")).toMatch(/cancelad/i);
    expect(confirmFailureMessage("expired")).toMatch(/caducado/i);
    expect(confirmFailureMessage("not_found")).not.toMatch(/user_id|uuid|confirmation-id/i);
  });
});
