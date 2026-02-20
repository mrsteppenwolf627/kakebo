import { SimilarExpense } from "@/lib/ai/embeddings";
import { apiLogger } from "@/lib/logger";

/**
 * Weights for each scoring signal.
 * All weights are normalized to sum to 1.0 before use.
 */
export interface RerankWeights {
  semantic: number;      // Cosine similarity from vector search (default: 0.6)
  recency: number;       // Recency decay — newer transactions score higher (default: 0.2)
  categoryMatch: number; // Category match — expense in expected category (default: 0.2)
}

export interface RerankOptions {
  /**
   * Override default weights (will be normalized to sum to 1.0).
   */
  weights?: Partial<RerankWeights>;

  /**
   * Half-life for recency decay in days.
   * An expense dated this many days ago gets recency = 0.5.
   * Default: 30 days.
   */
  recencyHalfLifeDays?: number;

  /**
   * ISO date string used as reference for recency ("today").
   * Defaults to actual current date.
   */
  queryDate?: string;
}

/**
 * Signal breakdown for a single ranked result (for transparency/debugging).
 */
export interface RankSignals {
  semantic: number;      // 0-1, original cosine similarity
  recency: number;       // 0-1, exponential decay from date
  categoryMatch: number; // 0-1, category intent match
}

/**
 * A SimilarExpense enriched with confidence score and signal breakdown.
 */
export type RerankedExpense<T extends SimilarExpense = SimilarExpense> = T & {
  confidence: number;    // Multi-signal confidence score (0-1)
  signals: RankSignals;
};

// ─── Default configuration ───────────────────────────────────────────────────

const DEFAULT_WEIGHTS: RerankWeights = {
  semantic: 0.6,
  recency: 0.2,
  categoryMatch: 0.2,
};

const DEFAULT_RECENCY_HALF_LIFE_DAYS = 30;

// ─── Category intent mapping ──────────────────────────────────────────────────

/**
 * Maps query terms to expected Kakebo categories (both Spanish and English forms).
 * Used to infer "what category should match this query".
 */
const QUERY_TO_CATEGORIES: Record<string, string[]> = {
  // Survival / Supervivencia
  salud: ["survival", "supervivencia"],
  medicina: ["survival", "supervivencia"],
  medicamento: ["survival", "supervivencia"],
  farmacia: ["survival", "supervivencia"],
  supermercado: ["survival", "supervivencia"],
  mercadona: ["survival", "supervivencia"],
  comida: ["survival", "supervivencia"],
  alimentacion: ["survival", "supervivencia"],
  alimentación: ["survival", "supervivencia"],
  transporte: ["survival", "supervivencia"],
  gasolina: ["survival", "supervivencia"],
  combustible: ["survival", "supervivencia"],
  alquiler: ["survival", "supervivencia"],
  hipoteca: ["survival", "supervivencia"],

  // Optional / Opcional
  restaurante: ["optional", "opcional"],
  restaurantes: ["optional", "opcional"],
  ocio: ["optional", "opcional"],
  entretenimiento: ["optional", "opcional"],
  vicios: ["optional", "opcional"],
  tabaco: ["optional", "opcional"],
  alcohol: ["optional", "opcional"],
  gimnasio: ["optional", "opcional"],
  gym: ["optional", "opcional"],
  deporte: ["optional", "opcional"],
  suscripcion: ["optional", "opcional"],
  suscripción: ["optional", "opcional"],
  netflix: ["optional", "opcional"],
  spotify: ["optional", "opcional"],

  // Culture / Cultura
  cultura: ["culture", "cultura"],
  libros: ["culture", "cultura"],
  libro: ["culture", "cultura"],
  museo: ["culture", "cultura"],
  museos: ["culture", "cultura"],
  cine: ["culture", "cultura"],
  teatro: ["culture", "cultura"],
  concierto: ["culture", "cultura"],
  curso: ["culture", "cultura"],
  cursos: ["culture", "cultura"],

  // Extra
  extra: ["extra"],
};

// ─── Core scoring functions ───────────────────────────────────────────────────

/**
 * Calculates a recency score using exponential decay.
 *
 * score(t) = e^(-λ·t)  where λ = ln(2) / halfLifeDays
 *
 * Results:
 *   - today      → 1.0
 *   - halfLife   → 0.5
 *   - 3×halfLife → 0.125
 *   - very old   → ≈ 0.0
 */
export function calculateRecencyScore(
  expenseDate: string,
  options: { halfLifeDays?: number; referenceDate?: string } = {}
): number {
  const { halfLifeDays = DEFAULT_RECENCY_HALF_LIFE_DAYS, referenceDate } = options;

  const reference = referenceDate ? new Date(referenceDate) : new Date();
  const expense = new Date(expenseDate);

  if (isNaN(expense.getTime())) return 0.5; // Unknown date → neutral

  const diffMs = reference.getTime() - expense.getTime();
  const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));

  const lambda = Math.LN2 / halfLifeDays;
  return Math.exp(-lambda * diffDays);
}

/**
 * Infers the Kakebo categories expected for a given query.
 * Returns the list of matching category strings or null if no match found.
 */
export function inferQueryCategories(query: string): string[] | null {
  const queryLower = query.toLowerCase();

  for (const [term, categories] of Object.entries(QUERY_TO_CATEGORIES)) {
    if (queryLower.includes(term)) {
      return categories;
    }
  }

  return null; // No category intent detected
}

/**
 * Returns a category match score:
 *   - 1.0 if expense category matches the query's implied category
 *   - 0.5 if there's a mismatch
 *   - 1.0 (neutral) if no category was inferred from query
 */
export function calculateCategoryMatchScore(
  expenseCategory: string,
  queryCategories: string[] | null
): number {
  if (!queryCategories || queryCategories.length === 0) {
    return 1.0; // No category context → no penalty
  }

  const categoryLower = expenseCategory.toLowerCase();
  const matches = queryCategories.some((cat) => cat.toLowerCase() === categoryLower);
  return matches ? 1.0 : 0.5;
}

/**
 * Computes the multi-signal confidence score for a single expense.
 */
export function computeConfidence(
  expense: SimilarExpense,
  query: string,
  options: RerankOptions = {}
): { confidence: number; signals: RankSignals } {
  const rawWeights: RerankWeights = {
    ...DEFAULT_WEIGHTS,
    ...options.weights,
  };

  // Normalize weights so they always sum to 1.0
  const weightSum = rawWeights.semantic + rawWeights.recency + rawWeights.categoryMatch;
  const w = {
    semantic: rawWeights.semantic / weightSum,
    recency: rawWeights.recency / weightSum,
    categoryMatch: rawWeights.categoryMatch / weightSum,
  };

  const signals: RankSignals = {
    semantic: Math.max(0, Math.min(1, expense.similarity)),
    recency: calculateRecencyScore(expense.date, {
      halfLifeDays: options.recencyHalfLifeDays ?? DEFAULT_RECENCY_HALF_LIFE_DAYS,
      referenceDate: options.queryDate,
    }),
    categoryMatch: calculateCategoryMatchScore(
      expense.category,
      inferQueryCategories(query)
    ),
  };

  const confidence =
    w.semantic * signals.semantic +
    w.recency * signals.recency +
    w.categoryMatch * signals.categoryMatch;

  return {
    confidence: Math.round(confidence * 1000) / 1000,
    signals,
  };
}

// ─── Main re-ranking function ─────────────────────────────────────────────────

/**
 * Re-ranks search results using multi-signal confidence scoring.
 *
 * Combines three signals:
 *   1. Semantic similarity (vector cosine distance, weight 0.6)
 *   2. Recency (exponential decay from today, weight 0.2)
 *   3. Category match (inferred from query, weight 0.2)
 *
 * @param results  Expenses with similarity scores (any superset of SimilarExpense)
 * @param query    Original search query (used for category inference)
 * @param options  Optional configuration overrides
 * @returns        Same results sorted by confidence (descending), enriched with
 *                 `confidence` and `signals` fields.
 */
export function rerankResults<T extends SimilarExpense>(
  results: T[],
  query: string,
  options: RerankOptions = {}
): RerankedExpense<T>[] {
  if (results.length === 0) return [];

  const ranked: RerankedExpense<T>[] = results.map((expense) => {
    const { confidence, signals } = computeConfidence(expense, query, options);
    return { ...expense, confidence, signals };
  });

  ranked.sort((a, b) => b.confidence - a.confidence);

  apiLogger.debug(
    {
      query,
      resultsCount: results.length,
      topConfidence: ranked[0]?.confidence,
      bottomConfidence: ranked[ranked.length - 1]?.confidence,
      topItem: ranked[0]?.note,
    },
    "Re-ranked results with multi-signal scoring (P2-2)"
  );

  return ranked;
}
