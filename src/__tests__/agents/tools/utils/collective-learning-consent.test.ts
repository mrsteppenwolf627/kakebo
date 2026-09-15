import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCollectiveLearningConsent } from "@/lib/agents/tools/utils/collective-learning-consent";

vi.mock("@/lib/logger", () => ({
  apiLogger: { warn: vi.fn(), info: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

function makeSupabase(result: { data: unknown; error: unknown } | (() => never)) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => {
            if (typeof result === "function") return result();
            return result;
          }),
        })),
      })),
    })),
  } as unknown as SupabaseClient;
}

describe("getCollectiveLearningConsent (Fase 2.G)", () => {
  it("devuelve true SOLO cuando allow_collective_learning es explícitamente true", async () => {
    const supabase = makeSupabase({ data: { allow_collective_learning: true }, error: null });
    await expect(getCollectiveLearningConsent(supabase, "u1")).resolves.toBe(true);
  });

  it("devuelve false cuando allow_collective_learning es false", async () => {
    const supabase = makeSupabase({ data: { allow_collective_learning: false }, error: null });
    await expect(getCollectiveLearningConsent(supabase, "u1")).resolves.toBe(false);
  });

  it("devuelve false (seguro por defecto) si no hay fila todavía — opuesto al valor seguro de ai_confirm_writes", async () => {
    const supabase = makeSupabase({ data: null, error: { message: "No rows found" } });
    await expect(getCollectiveLearningConsent(supabase, "u1")).resolves.toBe(false);
  });

  it("devuelve false (seguro por defecto) si la columna es null (migración no aplicada)", async () => {
    const supabase = makeSupabase({ data: { allow_collective_learning: null }, error: null });
    await expect(getCollectiveLearningConsent(supabase, "u1")).resolves.toBe(false);
  });

  it("devuelve false (seguro por defecto) si la consulta lanza una excepción", async () => {
    const supabase = makeSupabase(() => {
      throw new Error("network error");
    });
    await expect(getCollectiveLearningConsent(supabase, "u1")).resolves.toBe(false);
  });
});
