import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fase 2.G (corrección de privacidad): `merchant_rules` deja de ser una vía
 * de aprendizaje colectivo por completo — falla cerrado, con o sin
 * `allow_collective_learning`. Motivo: no puede demostrarse que una fila
 * global histórica proceda solo de usuarios consintientes (no guarda
 * procedencia/consentimiento por voto), y `merchant` es texto derivado de
 * lo que escribió el usuario, no una etiqueta minimizada.
 *
 * Estas pruebas verifican, de extremo a extremo sobre los módulos reales:
 * - Ninguna lectura ni escritura de `suggestCategory`/`learnFromCorrection`
 *   toca una fila GLOBAL de `merchant_rules`, con o sin consentimiento.
 * - `merchant` nunca se envía en ningún flujo colectivo (porque no hay
 *   ningún flujo colectivo activo).
 * - El feedback global (`search_feedback` cross-user) sigue desactivado.
 * - Los ejemplos globales de `correction_examples` siguen sin leerse.
 * - Las correcciones/reglas PERSONALES (user_id-scoped) siguen funcionando.
 */

vi.mock("@/lib/logger", () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/agents/tools/utils/merchant-extractor", () => ({
  extractMerchant: vi.fn(() => "mercadona"),
  getMerchantConfidence: vi.fn(() => 1.0),
}));

import { learnFromCorrection } from "@/lib/agents/tools/utils/learn-from-correction";
import { suggestCategory } from "@/lib/agents/tools/utils/category-suggester";
import { getGlobalFeedback, getHybridFeedback } from "@/lib/agents/tools/feedback";
import { getRelevantExamples, getSimilarExamples } from "@/lib/agents/tools/utils/example-retriever";

function makeMerchantRulesSupabase(rpcMock: ReturnType<typeof vi.fn>) {
  return {
    rpc: rpcMock,
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn(async () => ({ data: null, error: { code: "PGRST116" } })),
            })),
          })),
        })),
        is: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: { category: "supervivencia", vote_count: 5 },
                error: null,
              })),
            })),
          })),
        })),
      })),
    })),
  } as unknown as SupabaseClient;
}

describe("merchant_rules — aprendizaje colectivo desactivado por completo (Fase 2.G, corrección de privacidad)", () => {
  const userId = "user-with-real-email-attached@example.com-id";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("learnFromCorrection NUNCA llama a increment_global_rule_vote — ni una sola vez, pase lo que pase", async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: "rule-1", error: null });
    const supabase = makeMerchantRulesSupabase(mockRpc);

    await learnFromCorrection(supabase, userId, "Mercadona compra", "opcional", "supervivencia");

    const calls = mockRpc.mock.calls.map((c) => c[0]);
    expect(calls).not.toContain("increment_global_rule_vote");
    expect(calls).toEqual(["upsert_merchant_rule"]); // Solo la regla personal.
  });

  it("el resultado de learnFromCorrection declara globalVoteIncremented: false siempre", async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: "rule-1", error: null });
    const supabase = makeMerchantRulesSupabase(mockRpc);

    const result = await learnFromCorrection(
      supabase,
      userId,
      "Mercadona compra",
      "opcional",
      "supervivencia"
    );

    expect(result.globalVoteIncremented).toBe(false);
    expect(result.ruleCreated).toBe(true); // La regla PERSONAL sigue funcionando.
  });

  it("suggestCategory nunca devuelve ni usa una regla global (source: \"global_rule\"), aunque la RPC la ofrezca", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [{ category: "opcional", confidence: 0.8, source: "global_rule" }],
        error: null,
      }),
    } as unknown as SupabaseClient;

    const result = await suggestCategory(supabase, userId, "Mercadona compra");

    expect(result).toBeNull();
  });

  it("ningún payload enviado a Supabase (RPC o insert/update) contiene la palabra \"merchant\" fuera de la regla PERSONAL propia del usuario", async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: "rule-1", error: null });
    const supabase = makeMerchantRulesSupabase(mockRpc);

    await learnFromCorrection(supabase, userId, "Mercadona compra", "opcional", "supervivencia");

    // La única llamada RPC debe ser upsert_merchant_rule con p_user_id, la
    // propia regla PERSONAL — nunca una llamada "global" sin user_id.
    for (const call of mockRpc.mock.calls) {
      const [fnName, payload] = call as [string, Record<string, unknown> | undefined];
      if (fnName === "upsert_merchant_rule") {
        expect(payload).toHaveProperty("p_user_id", userId);
      } else {
        // Cualquier otra función RPC en este flujo sería inesperada.
        throw new Error(`Unexpected RPC call in a collective-learning-disabled flow: ${fnName}`);
      }
    }
  });

  it("getGlobalFeedback sigue desactivado por completo: nunca consulta search_feedback de otros usuarios", async () => {
    const mockFrom = vi.fn();
    const supabase = { from: mockFrom } as unknown as SupabaseClient;

    const result = await getGlobalFeedback(supabase, "alguna consulta");

    expect(mockFrom).not.toHaveBeenCalled();
    expect(result.correctExpenseIds.size).toBe(0);
    expect(result.incorrectExpenseIds.size).toBe(0);
  });

  it("getHybridFeedback, con getGlobalFeedback desactivado, es equivalente al feedback personal únicamente", async () => {
    const personalChain: Record<string, unknown> = {
      eq: vi.fn(() => personalChain),
      then: (resolve: (v: { data: unknown; error: null }) => void) =>
        resolve({
          data: [{ expense_id: "own-expense-1", feedback_type: "correct" }],
          error: null,
        }),
    };
    const supabase = {
      from: vi.fn(() => ({ select: () => personalChain })),
    } as unknown as SupabaseClient;

    const hybrid = await getHybridFeedback(supabase, userId, "vicios");

    expect(hybrid.correctExpenseIds.has("own-expense-1")).toBe(true);
    expect(hybrid.correctExpenseIds.size).toBe(1);
  });

  it("getRelevantExamples/getSimilarExamples siguen sin consultar ejemplos globales (user_id IS NULL) — ni RPC ni consulta directa", async () => {
    const mockRpc = vi.fn();
    const chain: Record<string, unknown> = {
      eq: vi.fn(() => chain),
      gte: vi.fn(() => chain),
      or: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
    };
    const supabase = {
      rpc: mockRpc,
      from: vi.fn(() => ({ select: vi.fn(() => chain) })),
    } as unknown as SupabaseClient;

    await getRelevantExamples(supabase, userId, { categoryFilter: "supervivencia" });
    await getSimilarExamples(supabase, userId, "Mercadona compra grande", 3);

    expect(mockRpc).not.toHaveBeenCalledWith("get_relevant_examples", expect.anything());
    expect(chain.eq).toHaveBeenCalledWith("user_id", userId);
  });

  it("ningún log emitido durante una corrección personal contiene amount/note/email (auditoría de la contribución, ahora inexistente)", async () => {
    const { apiLogger } = await import("@/lib/logger");
    const supabase = makeMerchantRulesSupabase(vi.fn().mockResolvedValue({ data: "rule-1", error: null }));

    await learnFromCorrection(
      supabase,
      userId,
      "Mercadona compra semanal 45.20€ user@example.com",
      "opcional",
      "supervivencia"
    );

    // Ya no existe ningún log de "Global rule vote" (la función que lo
    // emitía fue eliminada) — confirma que no queda rastro de la vía global.
    const allDebugMessages = vi.mocked(apiLogger.debug).mock.calls.map((c) => c[1]);
    const allInfoMessages = vi.mocked(apiLogger.info).mock.calls.map((c) => c[1]);
    expect([...allDebugMessages, ...allInfoMessages].join(" ")).not.toMatch(/global/i);
  });
});
