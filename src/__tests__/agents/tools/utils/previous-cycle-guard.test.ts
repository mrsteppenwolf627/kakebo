import { describe, it, expect } from "vitest";
import {
  messageRequestsPreviousCycle,
  callMissesExplicitPreviousCycle,
} from "@/lib/agents/tools/utils/previous-cycle-guard";

describe("messageRequestsPreviousCycle (Hotfix 2.1)", () => {
  it("detects 'ciclo anterior' and common equivalents, case-insensitively", () => {
    expect(messageRequestsPreviousCycle("analiza mi ciclo anterior")).toBe(true);
    expect(messageRequestsPreviousCycle("¿Cómo va mi CICLO ANTERIOR?")).toBe(true);
    expect(messageRequestsPreviousCycle("¿he gastado más que el ciclo pasado?")).toBe(true);
    expect(messageRequestsPreviousCycle("Previous cycle spending?")).toBe(true);
  });

  it("does not trigger on unrelated messages", () => {
    expect(messageRequestsPreviousCycle("analiza mi ciclo actual")).toBe(false);
    expect(messageRequestsPreviousCycle("gastos de agosto")).toBe(false);
    expect(messageRequestsPreviousCycle("")).toBe(false);
  });
});

describe("callMissesExplicitPreviousCycle (Hotfix 2.1) — protección contra adivinanzas", () => {
  it("flags a call that resolves 'ciclo anterior' to cycle_scope: 'specific' with an arbitrary cycle_ym", () => {
    const result = callMissesExplicitPreviousCycle("¿cuánto gasté en mi ciclo anterior?", {
      cycle_scope: "specific",
    });
    expect(result).toBe(true);
  });

  it("flags a call that resolves 'ciclo anterior' to cycle_scope: 'current'", () => {
    const result = callMissesExplicitPreviousCycle("analiza mi ciclo anterior", {
      cycle_scope: "current",
    });
    expect(result).toBe(true);
  });

  it("does NOT flag a call that correctly uses cycle_scope: 'previous'", () => {
    const result = callMissesExplicitPreviousCycle("analiza mi ciclo anterior", {
      cycle_scope: "previous",
    });
    expect(result).toBe(false);
  });

  it("does NOT flag a legitimate comparison where compare_cycle_scope is 'previous' even if the primary scope is 'current'", () => {
    // "compara este ciclo con el anterior" → cycle_scope: current (el ciclo
    // principal SÍ es el actual), compare_cycle_scope: previous.
    const result = callMissesExplicitPreviousCycle(
      "compara este ciclo con el ciclo anterior",
      { cycle_scope: "current", compare: true, compare_cycle_scope: "previous" }
    );
    expect(result).toBe(false);
  });

  it("flags a comparison that mentions 'ciclo anterior' but neither scope field uses 'previous'", () => {
    const result = callMissesExplicitPreviousCycle(
      "compara mi ciclo anterior con el actual",
      { cycle_scope: "current", compare: true, compare_cycle_scope: "specific" }
    );
    expect(result).toBe(true);
  });

  it("does not flag when cycle_scope is absent (the mandatory-scope gate already blocks that case)", () => {
    const result = callMissesExplicitPreviousCycle("analiza mi ciclo anterior", {});
    expect(result).toBe(false);
  });

  it("does not flag when the message never mentions 'ciclo anterior'", () => {
    const result = callMissesExplicitPreviousCycle("analiza mi ciclo actual", {
      cycle_scope: "current",
    });
    expect(result).toBe(false);
  });
});
