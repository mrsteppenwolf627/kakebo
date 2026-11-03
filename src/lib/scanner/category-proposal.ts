import type { ScannerOcrLineInput } from "./persistence";

type Category = ScannerOcrLineInput["categoryProposal"];

const RULES: readonly [Category, readonly string[]][] = [
  ["survival", ["pan", "leche", "huevo", "arroz", "supermercado", "farmacia", "alquiler"]],
  ["culture", ["libro", "cine", "museo", "curso", "teatro"]],
  ["extra", ["regalo", "juguete", "decoración", "decoracion"]],
  ["optional", ["restaurante", "bar", "café", "cafe", "delivery", "ropa"]],
];

/** Propuesta explicable y conservadora; nunca confirma ni sustituye la revisión humana. */
export function proposeScannerCategory(description: string | null): Category {
  const normalized = description?.trim().toLocaleLowerCase("es") ?? "";
  for (const [category, words] of RULES) {
    if (words.some((word) => normalized.includes(word))) return category;
  }
  return null;
}
