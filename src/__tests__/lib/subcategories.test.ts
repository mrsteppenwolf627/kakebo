import { describe, it, expect } from "vitest";
import {
  SUBCATEGORY_IDS,
  SUBCATEGORIES,
  isValidSubcategory,
  getSubcategoryDefinition,
  getSubcategoryLabel,
  getSuggestedCategory,
} from "@/lib/subcategories";
import { subcategorySchema } from "@/lib/schemas/common";

describe("Fase 2.B: catálogo de subcategorías", () => {
  it("accepts every id in the catalog as valid", () => {
    for (const id of SUBCATEGORY_IDS) {
      expect(isValidSubcategory(id)).toBe(true);
      expect(getSubcategoryDefinition(id)).toBeDefined();
    }
  });

  it("rejects values outside the approved catalog", () => {
    expect(isValidSubcategory("comida")).toBe(false);
    expect(isValidSubcategory("FOOD_BASIC")).toBe(false); // case-sensitive
    expect(isValidSubcategory("")).toBe(false);
    expect(isValidSubcategory(null)).toBe(false);
    expect(isValidSubcategory(undefined)).toBe(false);
    expect(isValidSubcategory(123)).toBe(false);
    expect(getSubcategoryDefinition("not-a-real-subcategory")).toBeUndefined();
  });

  it("food_basic and dining_out are distinct entries with mutually exclusive scope", () => {
    // Distinción obligatoria de producto: food_basic (supermercado/mercado/
    // comida para casa) nunca debe solaparse con dining_out (restaurantes/
    // bares/chiringuitos/comida a domicilio).
    expect(SUBCATEGORY_IDS).toContain("food_basic");
    expect(SUBCATEGORY_IDS).toContain("dining_out");
    expect("food_basic").not.toBe("dining_out");

    const foodBasic = SUBCATEGORIES.food_basic;
    const diningOut = SUBCATEGORIES.dining_out;

    // No es la misma definición ni el mismo texto descriptivo.
    expect(foodBasic).not.toBe(diningOut);
    expect(foodBasic.description).not.toBe(diningOut.description);

    // food_basic cubre supermercado/mercado y declara explícitamente que
    // NO incluye restaurantes ni comida a domicilio (eso es dining_out).
    expect(foodBasic.description.toLowerCase()).toContain("supermercado");
    expect(foodBasic.description.toLowerCase()).toMatch(/no incluye.*restaurante/);

    // dining_out cubre restaurantes/bares/domicilio y declara explícitamente
    // que NO incluye la compra de alimentos para casa (eso es food_basic).
    expect(diningOut.description.toLowerCase()).toContain("restaurante");
    expect(diningOut.description.toLowerCase()).toMatch(/no incluye.*alimentos/);
  });

  it("has no duplicate ids in the catalog", () => {
    const unique = new Set(SUBCATEGORY_IDS);
    expect(unique.size).toBe(SUBCATEGORY_IDS.length);
  });

  it("covers the personal-expense subcategories required by the closed product decision", () => {
    const expected = [
      "food_basic",
      "dining_out",
      "housing",
      "utilities",
      "transport",
      "health",
      "education",
      "subscriptions",
      "personal_shopping",
      "leisure",
      "travel",
      "gifts",
      "fees_taxes",
      "other",
    ];
    for (const id of expected) {
      expect(SUBCATEGORY_IDS).toContain(id);
    }
  });

  it("returns labels in the requested locale", () => {
    expect(getSubcategoryLabel("food_basic", "es")).toBe("Alimentación básica");
    expect(getSubcategoryLabel("food_basic", "en")).toBe("Groceries");
    expect(getSubcategoryLabel("dining_out", "es")).toBe("Comer fuera");
    expect(getSubcategoryLabel("dining_out", "en")).toBe("Dining out");
  });

  it("exposes a suggested Kakebo category without forcing it", () => {
    expect(getSuggestedCategory("food_basic")).toBe("survival");
    expect(getSuggestedCategory("dining_out")).toBe("optional");
    // "other" deliberately has no suggested category.
    expect(getSuggestedCategory("other")).toBeUndefined();
  });

  it("subcategorySchema (zod) is derived from the same SUBCATEGORY_IDS list — no second dictionary", () => {
    for (const id of SUBCATEGORY_IDS) {
      expect(subcategorySchema.safeParse(id).success).toBe(true);
    }
    expect(subcategorySchema.safeParse("comida").success).toBe(false);
  });
});
