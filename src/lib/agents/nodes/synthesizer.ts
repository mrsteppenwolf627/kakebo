import { openai, DEFAULT_MODEL } from "@/lib/ai/client";
import { apiLogger } from "@/lib/logger";
import { AgentState } from "../state";
import {
  getResponseSynthesisPrompt,
  getGeneralResponsePrompt,
  DEFAULT_ERROR_RESPONSE,
  DEFAULT_NO_TOOLS_RESPONSE,
  buildConversationContext,
} from "../prompts";

/**
 * Generate natural language response from tool results
 */
async function generateNaturalResponse(
  userMessage: string,
  toolResults: Record<string, unknown>,
  conversationHistory: string
): Promise<string> {
  try {
    // Check if we have successful tool results
    const hasSuccessfulResults = Object.values(toolResults).some(
      (result: any) => result.success === true
    );

    if (!hasSuccessfulResults && Object.keys(toolResults).length > 0) {
      // All tools failed
      return "Lo siento, no pude obtener los datos necesarios para responder tu pregunta. Por favor, intenta de nuevo más tarde.";
    }

    if (Object.keys(toolResults).length === 0) {
      // No tools were called - general question
      const prompt = getGeneralResponsePrompt(userMessage);

      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7, // Slightly higher for more natural conversation
        max_tokens: 500,
      });

      return (
        response.choices[0]?.message.content || DEFAULT_NO_TOOLS_RESPONSE
      );
    }

    // Synthesize from tool results
    const prompt = getResponseSynthesisPrompt(userMessage, toolResults);

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a helpful financial assistant speaking to a user about their expense tracking.
Provide clear, actionable insights. Always respond in Spanish. Be concise and friendly.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6, // Balanced for consistency + naturalness
      max_tokens: 500,
    });

    const content = response.choices[0]?.message.content;

    if (!content) {
      apiLogger.warn("Empty response from synthesis LLM");
      return DEFAULT_ERROR_RESPONSE;
    }

    return content;
  } catch (error) {
    apiLogger.error(
      { error, userMessage },
      "Error generating response, using default"
    );

    return DEFAULT_ERROR_RESPONSE;
  }
}

/**
 * Synthesizer node: generate final response
 * Final step of the LangGraph workflow
 *
 * @param state Current agent state
 * @returns Partial state with final response
 */
export async function synthesizerNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  apiLogger.debug("Synthesizer node processing");

  try {
    const conversationContext = buildConversationContext(state.messages);

    const finalResponse = await generateNaturalResponse(
      state.userMessage,
      state.toolResults,
      conversationContext
    );

    apiLogger.debug({ responseLength: finalResponse.length }, "Response generated");

    return {
      finalResponse,
    };
  } catch (error) {
    apiLogger.error({ error }, "Synthesizer node failed");

    return {
      finalResponse: DEFAULT_ERROR_RESPONSE,
    };
  }
}
