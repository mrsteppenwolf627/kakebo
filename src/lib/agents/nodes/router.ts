import { openai, DEFAULT_MODEL } from "@/lib/ai/client";
import { apiLogger } from "@/lib/logger";
import { AgentState, IntentType } from "../state";
import { getIntentClassificationPrompt } from "../prompts";

/**
 * Classification result from LLM
 */
interface IntentClassification {
  intent: IntentType;
  confidence: number;
  reasoning: string;
}

/**
 * Classify user intent using structured output from OpenAI
 */
async function classifyIntent(
  userMessage: string,
  previousMessages: string = ""
): Promise<IntentClassification> {
  try {
    const systemPrompt = getIntentClassificationPrompt();
    const userPrompt = previousMessages
      ? `Previous context:\n${previousMessages}\n\nNew message: "${userMessage}"`
      : `"${userMessage}"`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent classification
      max_tokens: 200,
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error("Empty response from LLM");
    }

    const parsed = JSON.parse(content) as IntentClassification;
    apiLogger.debug(
      { intent: parsed.intent, confidence: parsed.confidence },
      "Intent classified"
    );

    return parsed;
  } catch (error) {
    apiLogger.error(
      { error, userMessage },
      "Error classifying intent, defaulting to unclear"
    );

    // Fallback: try to classify using keywords
    return fallbackClassifyIntent(userMessage);
  }
}

/**
 * Fallback classification using keyword matching
 * Used when LLM fails
 */
function fallbackClassifyIntent(userMessage: string): IntentClassification {
  const msg = userMessage.toLowerCase();

  // Check for spending analysis keywords
  if (
    /gast|cuanto|cuánto|total|categoría|comida|cultura|extra|supervivencia/i.test(
      msg
    )
  ) {
    return {
      intent: "analyze_spending",
      confidence: 0.6,
      reasoning: "Contains spending-related keywords",
    };
  }

  // Check for budget keywords
  if (
    /presupuesto|budget|cómo va|how.*budget|voy|avanzar|progreso/i.test(msg)
  ) {
    return {
      intent: "check_budget",
      confidence: 0.6,
      reasoning: "Contains budget-related keywords",
    };
  }

  // Check for anomaly keywords
  if (
    /anomalía|raro|extraño|anormal|unusual|detect|anómalo|anomaly/i.test(msg)
  ) {
    return {
      intent: "detect_anomalies",
      confidence: 0.6,
      reasoning: "Contains anomaly-related keywords",
    };
  }

  // Check for prediction keywords
  if (/predic|próximo|siguiente|futuro|mes|month|forecast/i.test(msg)) {
    return {
      intent: "predict_spending",
      confidence: 0.6,
      reasoning: "Contains prediction-related keywords",
    };
  }

  // Check for trend keywords
  if (/trend|tendencia|evolución|histór|cambio|cambio|evolucionar/i.test(msg)) {
    return {
      intent: "view_trends",
      confidence: 0.6,
      reasoning: "Contains trend-related keywords",
    };
  }

  // Check for general financial questions
  if (/cómo|como|cuál|cual|qué|que|ayuda|help|consejo/i.test(msg)) {
    return {
      intent: "general_question",
      confidence: 0.5,
      reasoning: "Generic question pattern",
    };
  }

  return {
    intent: "unclear",
    confidence: 0.3,
    reasoning: "Unable to match to any intent",
  };
}

/**
 * Map detected intent to specific tool names
 */
export function mapIntentToTools(intent: IntentType): string[] {
  const mapping: Record<IntentType, string[]> = {
    analyze_spending: ["analyzeSpendingPattern"],
    check_budget: ["getBudgetStatus"],
    detect_anomalies: ["detectAnomalies"],
    predict_spending: ["predictMonthlySpending"],
    view_trends: ["getSpendingTrends"],
    general_question: [],
    unclear: [],
  };

  return mapping[intent] || [];
}

/**
 * Router node: classify intent and select tools
 * Part of the LangGraph workflow
 *
 * @param state Current agent state
 * @returns Partial state with intent and tools set
 */
export async function routerNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  apiLogger.debug({ message: state.userMessage }, "Router node processing");

  try {
    // Classify intent
    const classification = await classifyIntent(
      state.userMessage,
      state.messages.slice(-4).map((m) => m.content).join("\n")
    );

    // Select tools based on intent
    const toolsToCall = mapIntentToTools(classification.intent);

    return {
      intent: classification.intent,
      toolsToCall,
    };
  } catch (error) {
    apiLogger.error({ error }, "Router node failed");

    return {
      intent: "unclear",
      toolsToCall: [],
    };
  }
}
