import type { CategoryKey } from "./schemas/common";

/**
 * Fase 2.B: subcategorías Kakebo — segunda capa de clasificación, opcional,
 * por encima de las 4 categorías Kakebo existentes (survival/optional/
 * culture/extra), que NO se modifican ni se sustituyen.
 *
 * Esta es la ÚNICA fuente de verdad para el catálogo de subcategorías:
 * identificadores técnicos, etiquetas y su relación sugerida con una
 * categoría Kakebo (cuando aplica). El schema zod (`subcategorySchema` en
 * `src/lib/schemas/common.ts`), la ruta de gastos, las tools de IA y la
 * migración SQL deben derivar de esta lista — no debe existir un segundo
 * diccionario independiente con los mismos identificadores.
 *
 * Distinción obligatoria (decisión de producto ya cerrada):
 * - food_basic: supermercado, mercado y comida para casa.
 * - dining_out: restaurantes, bares, chiringuitos y comida a domicilio.
 * food_basic NUNCA incluye dining_out, y viceversa.
 */
export const SUBCATEGORY_IDS = [
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
] as const;

export type SubcategoryId = (typeof SUBCATEGORY_IDS)[number];

export interface SubcategoryDefinition {
  id: SubcategoryId;
  /** Etiqueta traducible (clave i18n o texto por defecto) en español. */
  labelEs: string;
  /** Etiqueta traducible en inglés. */
  labelEn: string;
  /**
   * Categoría Kakebo sugerida cuando aplica (orientativa, no forzada: el
   * usuario o la IA pueden combinar la subcategoría con cualquier
   * categoría Kakebo válida — el campo `category` del gasto sigue siendo
   * independiente y obligatorio).
   */
  suggestedCategory?: CategoryKey;
  /** Aclaración corta de qué incluye/excluye, para evitar ambigüedad. */
  description: string;
}

/**
 * Catálogo inicial: pequeño, estable y extensible. Añadir una subcategoría
 * nueva requiere: (1) añadir su id a `SUBCATEGORY_IDS`, (2) añadir su
 * definición aquí, y (3) una migración SQL que amplíe el valor permitido en
 * `expenses.subcategory` (ver `supabase/migrations/`).
 */
export const SUBCATEGORIES: Record<SubcategoryId, SubcategoryDefinition> = {
  food_basic: {
    id: "food_basic",
    labelEs: "Alimentación básica",
    labelEn: "Groceries",
    suggestedCategory: "survival",
    description:
      "Supermercado, mercado y compra de comida para preparar en casa. No incluye restaurantes ni comida a domicilio (ver dining_out).",
  },
  dining_out: {
    id: "dining_out",
    labelEs: "Comer fuera",
    labelEn: "Dining out",
    suggestedCategory: "optional",
    description:
      "Restaurantes, bares, chiringuitos y comida a domicilio. No incluye la compra de alimentos para casa (ver food_basic).",
  },
  housing: {
    id: "housing",
    labelEs: "Vivienda",
    labelEn: "Housing",
    suggestedCategory: "survival",
    description: "Alquiler, hipoteca, comunidad y gastos asociados a la vivienda habitual.",
  },
  utilities: {
    id: "utilities",
    labelEs: "Suministros",
    labelEn: "Utilities",
    suggestedCategory: "survival",
    description: "Luz, agua, gas, internet y teléfono.",
  },
  transport: {
    id: "transport",
    labelEs: "Transporte",
    labelEn: "Transport",
    suggestedCategory: "survival",
    description: "Transporte público, gasolina, taxi/VTC y parking.",
  },
  health: {
    id: "health",
    labelEs: "Salud",
    labelEn: "Health",
    suggestedCategory: "survival",
    description: "Médico, farmacia, dentista y seguro médico.",
  },
  education: {
    id: "education",
    labelEs: "Educación",
    labelEn: "Education",
    suggestedCategory: "culture",
    description: "Cursos, formación y material educativo.",
  },
  subscriptions: {
    id: "subscriptions",
    labelEs: "Suscripciones",
    labelEn: "Subscriptions",
    suggestedCategory: "optional",
    description: "Streaming, software y membresías recurrentes.",
  },
  personal_shopping: {
    id: "personal_shopping",
    labelEs: "Compras personales",
    labelEn: "Personal shopping",
    suggestedCategory: "optional",
    description: "Ropa, electrónica y artículos de uso personal.",
  },
  leisure: {
    id: "leisure",
    labelEs: "Ocio",
    labelEn: "Leisure",
    suggestedCategory: "optional",
    description: "Cine, eventos, hobbies y deporte no cubierto por otra subcategoría.",
  },
  travel: {
    id: "travel",
    labelEs: "Viajes",
    labelEn: "Travel",
    suggestedCategory: "optional",
    description: "Vuelos, hoteles y vacaciones.",
  },
  gifts: {
    id: "gifts",
    labelEs: "Regalos",
    labelEn: "Gifts",
    suggestedCategory: "extra",
    description: "Regalos para otras personas.",
  },
  fees_taxes: {
    id: "fees_taxes",
    labelEs: "Comisiones e impuestos",
    labelEn: "Fees & taxes",
    suggestedCategory: "extra",
    description: "Comisiones bancarias, impuestos y multas.",
  },
  other: {
    id: "other",
    labelEs: "Otra / no clasificada",
    labelEn: "Other / unclassified",
    description: "Gasto personal habitual que no encaja en ninguna otra subcategoría.",
  },
};

/** Comprueba si un valor es un identificador de subcategoría válido del catálogo. */
export function isValidSubcategory(value: unknown): value is SubcategoryId {
  return (
    typeof value === "string" &&
    (SUBCATEGORY_IDS as readonly string[]).includes(value)
  );
}

/** Devuelve la definición completa de una subcategoría, o undefined si no existe. */
export function getSubcategoryDefinition(
  id: string
): SubcategoryDefinition | undefined {
  return isValidSubcategory(id) ? SUBCATEGORIES[id] : undefined;
}

/** Etiqueta traducible de una subcategoría en el idioma pedido (por defecto español). */
export function getSubcategoryLabel(
  id: SubcategoryId,
  locale: "es" | "en" = "es"
): string {
  const def = SUBCATEGORIES[id];
  return locale === "en" ? def.labelEn : def.labelEs;
}

/** Categoría Kakebo sugerida para una subcategoría, si la tiene definida. */
export function getSuggestedCategory(id: SubcategoryId): CategoryKey | undefined {
  return SUBCATEGORIES[id].suggestedCategory;
}
