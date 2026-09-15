import { describe, it, expect } from "vitest";
import { evaluateAnalyzeHabitsScope } from "@/lib/agents/tools/utils/analyze-habits-scope-gate";

describe("evaluateAnalyzeHabitsScope (Fase 2.F)", () => {
  it("pide ámbito cuando cycle_scope está ausente", () => {
    expect(evaluateAnalyzeHabitsScope({})).toEqual({ action: "ask_scope" });
  });

  it("pide ámbito aunque el resto de campos estén presentes, si falta cycle_scope", () => {
    expect(evaluateAnalyzeHabitsScope({ compare: false })).toEqual({ action: "ask_scope" });
  });

  it("procede con cycle_scope: current y sin comparación", () => {
    expect(evaluateAnalyzeHabitsScope({ cycle_scope: "current" })).toEqual({ action: "proceed" });
  });

  it("procede con cycle_scope: specific y cycle_ym", () => {
    expect(
      evaluateAnalyzeHabitsScope({ cycle_scope: "specific", cycle_ym: "2026-08" })
    ).toEqual({ action: "proceed" });
  });

  it("procede con cycle_scope: all_history", () => {
    expect(evaluateAnalyzeHabitsScope({ cycle_scope: "all_history" })).toEqual({ action: "proceed" });
  });

  it("no permite: individual_lookup — esta tool no tiene esa excepción (siempre exige ámbito)", () => {
    // A diferencia de searchExpenses, no hay ningún campo que exima del
    // requisito de ámbito — se comprueba que ausencia de cycle_scope
    // siempre bloquea, sin importar qué otros campos lleguen.
    expect(evaluateAnalyzeHabitsScope({ compare: true, compare_cycle_scope: "current" })).toEqual({
      action: "ask_scope",
    });
  });

  it("con compare: true pero sin compare_cycle_scope, pide el ámbito de comparación (una vez cycle_scope ya está resuelto)", () => {
    expect(
      evaluateAnalyzeHabitsScope({ cycle_scope: "current", compare: true })
    ).toEqual({ action: "ask_compare_scope" });
  });

  it("procede con compare: true y compare_cycle_scope presente", () => {
    expect(
      evaluateAnalyzeHabitsScope({
        cycle_scope: "current",
        compare: true,
        compare_cycle_scope: "specific",
        compare_cycle_ym: "2026-08",
      })
    ).toEqual({ action: "proceed" });
  });

  it("prioriza ask_scope sobre ask_compare_scope cuando faltan ambos (nunca dos preguntas a la vez)", () => {
    expect(evaluateAnalyzeHabitsScope({ compare: true })).toEqual({ action: "ask_scope" });
  });

  it("compare: false (o ausente) nunca exige compare_cycle_scope", () => {
    expect(evaluateAnalyzeHabitsScope({ cycle_scope: "current", compare: false })).toEqual({
      action: "proceed",
    });
    expect(evaluateAnalyzeHabitsScope({ cycle_scope: "current" })).toEqual({ action: "proceed" });
  });
});
