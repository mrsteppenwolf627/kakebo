import { BaseMessage } from "@langchain/core/messages";

/**
 * System prompt for intent classification
 * Used by Router node to determine what the user is asking
 */
export function getIntentClassificationPrompt(): string {
  return `You are a financial query classifier. Analyze the user's message and classify it into one of these intents:

- analyze_spending: User wants to analyze spending patterns (e.g., "How much have I spent on food?", "Show me my spending by category")
- check_budget: User wants to check budget status (e.g., "How's my budget?", "Am I on track with my spending?")
- detect_anomalies: User wants to find unusual spending (e.g., "Find unusual expenses", "Detect anomalies")
- predict_spending: User wants predictions (e.g., "How much will I spend next month?", "Predict my spending")
- view_trends: User wants to see trends (e.g., "Show me trends", "What's the spending trend?")
- general_question: User asks a general financial question that doesn't fit above
- unclear: Unable to classify the query

Respond with ONLY a JSON object like this:
{
  "intent": "analyze_spending",
  "confidence": 0.95,
  "reasoning": "User is asking about spending patterns in a category"
}`;
}

/**
 * Extract tool parameters from user message
 * Used by Tool Executor to get function arguments
 */
export function getParameterExtractionPrompt(
  toolName: string,
  userMessage: string
): string {
  const toolParamSchemas: Record<string, string> = {
    analyzeSpendingPattern: `{
  "category": "survival" | "optional" | "culture" | "extra" | "all",
  "period": "current_month" | "last_month" | "last_3_months" | "last_6_months" | "current_week",
  "groupBy": "day" | "week" | "month"
}`,
    getBudgetStatus: `{
  "category": "survival" | "optional" | "culture" | "extra" | "all"
}`,
    detectAnomalies: `{
  "days": number,
  "sensitivity": "low" | "medium" | "high"
}`,
    predictMonthlySpending: `{
  "category": "survival" | "optional" | "culture" | "extra" | "all",
  "months": number
}`,
    getSpendingTrends: `{
  "category": "survival" | "optional" | "culture" | "extra" | "all",
  "months": number
}`,
  };

  const schema = toolParamSchemas[toolName] || "{}";

  return `Eres un asistente inteligente que extrae parámetros de mensajes en español para una app de finanzas (método Kakebo).

MENSAJE: "${userMessage}"

CATEGORÍAS (usa inteligencia semántica para mapear):
- "survival": comida, alimentación, supermercado, alimentos, necesidades básicas, vivienda, transporte esencial
- "optional": ocio, entretenimiento, diversión, salidas, restaurantes, caprichos, compras no esenciales, cine
- "culture": educación, libros, cursos, museos, teatro, actividades culturales
- "extra": gastos extraordinarios, imprevistos, regalos, otros
- "all": cuando NO especifica categoría o pide resumen general/total

PERÍODOS:
- "current_month": este mes, mes actual, febrero
- "last_month": mes pasado, enero
- "last_3_months": últimos 3 meses, trimestre
- "last_6_months": últimos 6 meses, semestre
- "current_week": esta semana, semana actual

USA INTELIGENCIA SEMÁNTICA. Ejemplos:
- "comida" → "survival"
- "cine" → "optional"
- "libros" → "culture"
- "presupuesto" (sin categoría) → "all"

Schema: ${schema}

Devuelve SOLO JSON válido.`;
}

/**
 * System prompt for response synthesis
 * Used by Synthesizer node to generate natural language responses
 */
export function getResponseSynthesisPrompt(
  userMessage: string,
  toolResults: Record<string, unknown>
): string {
  const toolsUsed = Object.keys(toolResults);
  const resultsJson = JSON.stringify(toolResults, null, 2);

  return `You are a helpful financial assistant. Based on the user's question and the analysis results below, provide a conversational response in Spanish.

User's question: "${userMessage}"

Tools used: ${toolsUsed.join(", ")}

Analysis results:
${resultsJson}

Guidelines:
1. Be conversational and friendly
2. Highlight key insights from the data
3. Use specific numbers and percentages
4. Provide actionable recommendations when relevant
5. Keep response concise (2-3 sentences for simple queries)
6. Always respond in Spanish

Generate a helpful response:`;
}

/**
 * Prompt for general questions (no tools needed)
 */
export function getGeneralResponsePrompt(userMessage: string): string {
  return `You are a helpful financial assistant. The user asked:
"${userMessage}"

This is a general question that doesn't require analysis tools. Provide a brief, helpful response in Spanish.
Keep it conversational and under 100 words.

Response:`;
}

/**
 * Build conversation context for the LLM
 * Converts message history to a format for better context
 */
export function buildConversationContext(messages: BaseMessage[]): string {
  return messages
    .slice(-6) // Last 6 messages for context
    .map((msg) => {
      const role = msg._getType() === "human" ? "Usuario" : "Asistente";
      return `${role}: ${msg.content}`;
    })
    .join("\n");
}

/**
 * Default response when unable to process
 */
export const DEFAULT_ERROR_RESPONSE = `Lo siento, no pude procesar tu pregunta correctamente. ¿Podrías intentar reformularla?`;

/**
 * Response when no tools are available
 */
export const DEFAULT_NO_TOOLS_RESPONSE = `Entiendo tu pregunta, pero no tengo información disponible para responderla en este momento. ¿Hay algo más en lo que pueda ayudarte?`;
