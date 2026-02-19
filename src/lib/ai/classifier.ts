import { openai, DEFAULT_MODEL, calculateCost, ModelId } from "./client";
import {
  getCurrentPrompt,
  getPromptVersion,
  formatExamplesForPrompt,
  ExpenseCategory,
  CURRENT_PROMPT_VERSION,
} from "./prompts";
import { apiLogger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getRelevantExamples,
  formatExamplesForPrompt as formatCorrectionExamples,
  trackExampleUsage,
} from "@/lib/agents/tools/utils/example-retriever";

/**
 * Result of expense classification
 */
export interface ClassificationResult {
  /** Suggested category */
  category: ExpenseCategory;
  /** Suggested note/description */
  note: string;
  /** AI confidence (0-1) */
  confidence: number;
  /** Metrics for monitoring */
  metrics: {
    /** Model used */
    model: string;
    /** Prompt version used */
    promptVersion: string;
    /** Time taken in ms */
    latencyMs: number;
    /** Input tokens used */
    inputTokens: number;
    /** Output tokens used */
    outputTokens: number;
    /** Estimated cost in USD */
    costUsd: number;
  };
}

/**
 * Options for classification
 */
export interface ClassifyOptions {
  /** Model to use (default: gpt-4o-mini) */
  model?: ModelId;
  /** Prompt version to use (default: current) */
  promptVersion?: string;
  /** Temperature for randomness (default: 0.1 for consistency) */
  temperature?: number;
  /** Supabase client for retrieving correction examples (P1-2) */
  supabase?: SupabaseClient;
  /** User ID for retrieving user-specific correction examples (P1-2) */
  userId?: string;
  /** Whether to use correction examples for few-shot learning (default: true if supabase + userId provided) */
  useCorrectionExamples?: boolean;
}

/**
 * Classify an expense using AI
 *
 * @param input - The expense text to classify (e.g., "Mercadona 45€")
 * @param options - Optional configuration
 * @returns Classification result with category, note, and metrics
 *
 * @example
 * const result = await classifyExpense("Netflix mensual");
 * // { category: "culture", note: "Suscripción streaming", confidence: 0.95, metrics: {...} }
 */
export async function classifyExpense(
  input: string,
  options: ClassifyOptions = {}
): Promise<ClassificationResult> {
  const {
    model = DEFAULT_MODEL,
    promptVersion = CURRENT_PROMPT_VERSION,
    temperature = 0.1,
    supabase,
    userId,
    useCorrectionExamples = !!(supabase && userId),
  } = options;

  const startTime = Date.now();
  const prompt = getPromptVersion(promptVersion);

  // ========== RETRIEVE CORRECTION EXAMPLES (P1-2) ==========
  let correctionExamplesText = "";
  let exampleIds: string[] = [];

  if (useCorrectionExamples && supabase && userId) {
    try {
      const examples = await getRelevantExamples(supabase, userId, {
        limit: 3,
        minConfidence: 0.8,
      });

      if (examples.length > 0) {
        correctionExamplesText = formatCorrectionExamples(examples, "es");
        // Note: We'd need to modify getRelevantExamples to return IDs
        // For now, we'll track usage after classification
        apiLogger.info(
          { input, examplesCount: examples.length, userId },
          "Retrieved correction examples for classification"
        );
      } else {
        apiLogger.debug({ input, userId }, "No correction examples found");
      }
    } catch (err) {
      apiLogger.warn(
        { err, input, userId },
        "Failed to retrieve correction examples - continuing without them"
      );
    }
  }
  // =========================================================

  // Build messages for the API
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: prompt.system },
    // Add static few-shot examples
    {
      role: "user",
      content: `Aquí tienes ejemplos de clasificación:\n\n${formatExamplesForPrompt(prompt.examples)}`,
    },
    { role: "assistant", content: "Entendido. Clasificaré los gastos siguiendo estos ejemplos." },
  ];

  // Add user-specific correction examples if available (P1-2)
  if (correctionExamplesText) {
    messages.push({
      role: "user",
      content: correctionExamplesText,
    });
    messages.push({
      role: "assistant",
      content: "Perfecto. Tendré en cuenta tus correcciones anteriores para clasificar mejor.",
    });
  }

  // Add actual input
  messages.push({ role: "user", content: `Clasifica este gasto: "${input}"` });

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    const latencyMs = Date.now() - startTime;
    const usage = completion.usage;
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const costUsd = calculateCost(model, inputTokens, outputTokens);

    // Parse response
    const responseText = completion.choices[0]?.message?.content || "{}";
    let parsed: { category?: string; note?: string; confidence?: number };

    try {
      parsed = JSON.parse(responseText);
    } catch {
      apiLogger.warn({ responseText }, "Failed to parse AI response as JSON");
      parsed = {};
    }

    // Validate category
    const validCategories: ExpenseCategory[] = ["survival", "optional", "culture", "extra"];
    const category = validCategories.includes(parsed.category as ExpenseCategory)
      ? (parsed.category as ExpenseCategory)
      : "optional"; // Default fallback

    const note = typeof parsed.note === "string" ? parsed.note.slice(0, 100) : input;
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5;

    // Log for monitoring
    apiLogger.info(
      {
        input,
        category,
        note,
        confidence,
        model,
        promptVersion,
        latencyMs,
        inputTokens,
        outputTokens,
        costUsd,
      },
      `AI Classification: "${input}" -> ${category}`
    );

    return {
      category,
      note,
      confidence,
      metrics: {
        model,
        promptVersion,
        latencyMs,
        inputTokens,
        outputTokens,
        costUsd,
      },
    };
  } catch (error) {
    apiLogger.error({ error, input }, "AI Classification failed");

    // Return fallback on error
    return {
      category: "optional",
      note: input,
      confidence: 0,
      metrics: {
        model,
        promptVersion,
        latencyMs: Date.now() - startTime,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
      },
    };
  }
}

/**
 * Batch classify multiple expenses
 * More efficient than calling classifyExpense multiple times
 *
 * Note: Correction examples (P1-2) are retrieved for EACH expense independently.
 * This ensures each expense gets the most relevant examples.
 */
export async function classifyExpenses(
  inputs: string[],
  options: ClassifyOptions = {}
): Promise<ClassificationResult[]> {
  // Run classifications in parallel
  // Each classification retrieves its own correction examples
  return Promise.all(inputs.map((input) => classifyExpense(input, options)));
}
