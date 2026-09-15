import { describe, it, expect } from "vitest";
import { evaluateSearchExpensesScope } from "@/lib/agents/tools/utils/search-scope-gate";

describe("evaluateSearchExpensesScope (Fase 2.D + corrección) — helper puro", () => {
  describe("search_intent ausente: se trata SIEMPRE como análisis (nunca como búsqueda individual)", () => {
    it("bloquea y pide ámbito cuando no hay search_intent ni cycle_scope", () => {
      expect(evaluateSearchExpensesScope({ query: "último" })).toEqual({
        action: "ask_scope",
      });
    });

    it("bloquea y pide ámbito sin query alguna (caso por defecto de la tool)", () => {
      expect(evaluateSearchExpensesScope({})).toEqual({ action: "ask_scope" });
    });
  });

  describe("search_intent: 'analysis' sin cycle_scope", () => {
    it("'¿Cuánto he gastado?' (sin ámbito) → pide ámbito", () => {
      expect(
        evaluateSearchExpensesScope({ query: "cuánto he gastado", search_intent: "analysis" })
      ).toEqual({ action: "ask_scope" });
    });

    it("'Analiza mis hábitos' (sin ámbito) → pide ámbito", () => {
      expect(
        evaluateSearchExpensesScope({ query: "analiza mis hábitos", search_intent: "analysis" })
      ).toEqual({ action: "ask_scope" });
    });

    it("con cycle_scope explícito, procede", () => {
      expect(
        evaluateSearchExpensesScope({
          query: "cuánto he gastado",
          search_intent: "analysis",
          cycle_scope: "current",
        })
      ).toEqual({ action: "proceed" });
    });
  });

  describe("search_intent: 'individual_lookup' — exento del requisito de ámbito", () => {
    it("procede sin cycle_scope para una búsqueda de un gasto concreto", () => {
      expect(
        evaluateSearchExpensesScope({ query: "Netflix", search_intent: "individual_lookup" })
      ).toEqual({ action: "proceed" });
      expect(
        evaluateSearchExpensesScope({ query: "último", search_intent: "individual_lookup" })
      ).toEqual({ action: "proceed" });
    });
  });

  describe("subcategories fuerza análisis aunque el modelo etiquete mal la intención", () => {
    it("con subcategories y search_intent: 'individual_lookup' (mal etiquetado) y sin cycle_scope → bloquea igualmente", () => {
      expect(
        evaluateSearchExpensesScope({
          query: "restaurantes",
          subcategories: ["dining_out"],
          search_intent: "individual_lookup",
        })
      ).toEqual({ action: "ask_scope" });
    });

    it("con subcategories, search_intent 'individual_lookup' (mal etiquetado) Y cycle_scope → procede", () => {
      expect(
        evaluateSearchExpensesScope({
          query: "restaurantes",
          subcategories: ["dining_out"],
          search_intent: "individual_lookup",
          cycle_scope: "current",
        })
      ).toEqual({ action: "proceed" });
    });

    it("con subcategories y sin search_intent alguno → bloquea (subcategories ya implica análisis)", () => {
      expect(
        evaluateSearchExpensesScope({ query: "restaurantes", subcategories: ["dining_out"] })
      ).toEqual({ action: "ask_scope" });
    });
  });

  describe("alimentación ambigua: el ámbito se pregunta SIEMPRE antes que el tipo de alimentación", () => {
    it("análisis + alimentación ambigua + SIN ámbito → pregunta ámbito primero (no alimentación)", () => {
      expect(
        evaluateSearchExpensesScope({ query: "gastos de alimentación", search_intent: "analysis" })
      ).toEqual({ action: "ask_scope" });
      expect(
        evaluateSearchExpensesScope({ query: "comida", search_intent: "analysis" })
      ).toEqual({ action: "ask_scope" });
    });

    it("análisis + alimentación ambigua + CON ámbito ya resuelto → ahora sí pregunta el tipo de alimentación", () => {
      expect(
        evaluateSearchExpensesScope({
          query: "gastos de alimentación",
          search_intent: "analysis",
          cycle_scope: "current",
        })
      ).toEqual({ action: "ask_food_type" });
    });

    it("con ámbito y subcategories ya resueltas, no vuelve a preguntar por alimentación", () => {
      expect(
        evaluateSearchExpensesScope({
          query: "alimentación",
          subcategories: ["food_basic"],
          search_intent: "analysis",
          cycle_scope: "current",
        })
      ).toEqual({ action: "proceed" });
    });

    it("con ámbito y una pista textual de food_basic (supermercado/Mercadona), no pregunta por alimentación", () => {
      expect(
        evaluateSearchExpensesScope({
          query: "alimentación en el supermercado",
          search_intent: "analysis",
          cycle_scope: "current",
        })
      ).toEqual({ action: "proceed" });
      expect(
        evaluateSearchExpensesScope({
          query: "comida en Mercadona",
          search_intent: "analysis",
          cycle_scope: "all_history",
        })
      ).toEqual({ action: "proceed" });
    });

    it("con ámbito y una pista textual de dining_out (restaurante/domicilio), no pregunta por alimentación", () => {
      expect(
        evaluateSearchExpensesScope({
          query: "alimentación en restaurantes",
          search_intent: "analysis",
          cycle_scope: "current",
        })
      ).toEqual({ action: "proceed" });
      expect(
        evaluateSearchExpensesScope({
          query: "comida a domicilio",
          search_intent: "analysis",
          cycle_scope: "specific",
          cycle_ym: "2026-08",
        })
      ).toEqual({ action: "proceed" });
    });
  });
});
