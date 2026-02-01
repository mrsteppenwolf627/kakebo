import { SupabaseClient } from "@supabase/supabase-js";
import { openai, DEFAULT_MODEL, calculateCost, ModelId } from "./client";
import { ASSISTANT_TOOLS, ToolName } from "./tools";
import { executeTool, ToolResult } from "./tool-executor";
import { apiLogger } from "@/lib/logger";
import {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from "openai/resources/chat/completions";

/**
 * System prompt for the assistant
 */
const SYSTEM_PROMPT = `Eres Kakebo AI, un asistente de finanzas personales basado en el método japonés Kakebo.

TU PERSONALIDAD:
- Amable y cercano, pero profesional
- Respondes en español
- Eres conciso (respuestas cortas y útiles)
- Ayudas al usuario a gestionar sus finanzas

CATEGORÍAS DE GASTOS:
- survival: Gastos esenciales (comida, transporte, salud, servicios)
- optional: Gastos no esenciales (ropa, restaurantes, caprichos)
- culture: Ocio y desarrollo (libros, cursos, streaming, cine)
- extra: Imprevistos y emergencias

REGLAS:
1. Cuando el usuario menciona un gasto, usa create_expense para registrarlo
2. Si no está clara la categoría, usa classify_expense primero para sugerir
3. Cuando pidan resumen o cuánto llevan gastado, usa get_monthly_summary
4. Sé proactivo sugiriendo cuando se acercan al límite del presupuesto
5. Responde siempre en español

FORMATO DE RESPUESTAS:
- Confirma las acciones realizadas
- Incluye el monto y categoría cuando crees gastos
- Si hay error, explica qué pasó de forma amigable`;

/**
 * Message in the conversation
 */
export interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * Result of assistant processing
 */
export interface AssistantResponse {
  message: string;
  toolsUsed: {
    name: string;
    params: unknown;
    result: ToolResult;
  }[];
  metrics: {
    model: string;
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    toolCalls: number;
  };
}

/**
 * Process a user message through the assistant
 */
export async function processMessage(
  userMessage: string,
  conversationHistory: Message[],
  supabase: SupabaseClient,
  userId: string,
  options: { model?: ModelId } = {}
): Promise<AssistantResponse> {
  const model = options.model || DEFAULT_MODEL;
  const startTime = Date.now();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const toolsUsed: AssistantResponse["toolsUsed"] = [];

  // Build messages array
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    // Add conversation history
    ...conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    // Add current message
    { role: "user", content: userMessage },
  ];

  try {
    // First API call - may request tool calls
    let completion = await openai.chat.completions.create({
      model,
      messages,
      tools: ASSISTANT_TOOLS,
      tool_choice: "auto",
    });

    totalInputTokens += completion.usage?.prompt_tokens || 0;
    totalOutputTokens += completion.usage?.completion_tokens || 0;

    let responseMessage = completion.choices[0].message;

    // Process tool calls if any
    while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // Add assistant message with tool calls to conversation
      messages.push(responseMessage);

      // Execute each tool call
      const toolMessages: ChatCompletionToolMessageParam[] = [];

      for (const toolCall of responseMessage.tool_calls) {
        const toolName = toolCall.function.name as ToolName;
        let params: unknown;

        try {
          params = JSON.parse(toolCall.function.arguments);
        } catch {
          params = {};
        }

        apiLogger.info(
          { toolName, params, userId },
          `Assistant calling tool: ${toolName}`
        );

        const result = await executeTool(toolName, params as never, supabase, userId);

        toolsUsed.push({ name: toolName, params, result });

        toolMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      // Add tool results to conversation
      messages.push(...toolMessages);

      // Get next response from AI
      completion = await openai.chat.completions.create({
        model,
        messages,
        tools: ASSISTANT_TOOLS,
        tool_choice: "auto",
      });

      totalInputTokens += completion.usage?.prompt_tokens || 0;
      totalOutputTokens += completion.usage?.completion_tokens || 0;

      responseMessage = completion.choices[0].message;
    }

    const latencyMs = Date.now() - startTime;
    const costUsd = calculateCost(model, totalInputTokens, totalOutputTokens);

    apiLogger.info(
      {
        userId,
        userMessage,
        response: responseMessage.content,
        toolsUsed: toolsUsed.map((t) => t.name),
        latencyMs,
        costUsd,
      },
      "Assistant response generated"
    );

    return {
      message: responseMessage.content || "No tengo una respuesta para eso.",
      toolsUsed,
      metrics: {
        model,
        latencyMs,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        costUsd,
        toolCalls: toolsUsed.length,
      },
    };
  } catch (error) {
    apiLogger.error({ error, userMessage, userId }, "Assistant error");

    return {
      message:
        "Lo siento, ha ocurrido un error procesando tu mensaje. Por favor, inténtalo de nuevo.",
      toolsUsed: [],
      metrics: {
        model,
        latencyMs: Date.now() - startTime,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        costUsd: 0,
        toolCalls: 0,
      },
    };
  }
}
