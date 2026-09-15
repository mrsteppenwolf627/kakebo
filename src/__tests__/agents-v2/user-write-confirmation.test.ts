import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAiConfirmWritesPreference } from "@/lib/agents-v2/user-write-confirmation";

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

describe("getAiConfirmWritesPreference (Fase 2.E)", () => {
  it("devuelve true cuando ai_confirm_writes es true en la fila", async () => {
    const supabase = makeSupabase({ data: { ai_confirm_writes: true }, error: null });
    await expect(getAiConfirmWritesPreference(supabase, "u1")).resolves.toBe(true);
  });

  it("devuelve false solo cuando ai_confirm_writes es explícitamente false", async () => {
    const supabase = makeSupabase({ data: { ai_confirm_writes: false }, error: null });
    await expect(getAiConfirmWritesPreference(supabase, "u1")).resolves.toBe(false);
  });

  it("devuelve true (seguro por defecto) si no hay fila todavía", async () => {
    const supabase = makeSupabase({ data: null, error: { message: "No rows found" } });
    await expect(getAiConfirmWritesPreference(supabase, "u1")).resolves.toBe(true);
  });

  it("devuelve true (seguro por defecto) si la columna es null (migración no aplicada)", async () => {
    const supabase = makeSupabase({ data: { ai_confirm_writes: null }, error: null });
    await expect(getAiConfirmWritesPreference(supabase, "u1")).resolves.toBe(true);
  });

  it("devuelve true (seguro por defecto) si la consulta lanza una excepción", async () => {
    const supabase = makeSupabase(() => {
      throw new Error("network error");
    });
    await expect(getAiConfirmWritesPreference(supabase, "u1")).resolves.toBe(true);
  });
});
