import { openai, DEFAULT_MODEL, calculateCost, ModelId } from "./client";
import {
  getCurrentPrompt,
  getPromptVersion,
  formatExamplesForPrompt,
  ExpenseCategory,
  CURRENT_PROMPT_VERSION,
} from "./prompts";
import { apiLogger } from "@/lib/logger";

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
  } = options;

  const startTime = Date.now();
  const prompt = getPromptVersion(promptVersion);

  // Build messages for the API
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: prompt.system },
    // Add few-shot examples
    {
      role: "user",
      content: `Aquí tienes ejemplos de clasificación:\n\n${formatExamplesForPrompt(prompt.examples)}`,
    },
    { role: "assistant", content: "Entendido. Clasificaré los gastos siguiendo estos ejemplos." },
    // Actual input
    { role: "user", content: `Clasifica este gasto: "${input}"` },
  ];

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
 */
export async function classifyExpenses(
  inputs: string[],
  options: ClassifyOptions = {}
): Promise<ClassificationResult[]> {
  // For now, just run them in parallel
  // Future optimization: batch API calls
  return Promise.all(inputs.map((input) => classifyExpense(input, options)));
}
