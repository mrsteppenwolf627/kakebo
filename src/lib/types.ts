export type Category = "general" | "wants" | "culture" | "extras";

export type Transaction = {
  id: string;
  date: string; // ISO: "2026-01-16"
  description: string;
  amount: number; // positivo (gasto). Si algún día quieres ingresos, ya lo extendemos.
  category: Category;
};

export type Settings = {
  monthlyIncome: number;  // ingresos del mes
  savingsGoal: number;    // objetivo de ahorro
};

export const CATEGORY_LABEL: Record<Category, string> = {
  general: "General",
  wants: "Opcional",
  culture: "Cultura",
  extras: "Extra",
};
