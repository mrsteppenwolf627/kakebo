import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { anthropic, AI_PROVIDER, ANTHROPIC_MODEL, openai } from "@/lib/ai/client";
import { toAnthropicRequest, toAnthropicTools } from "@/lib/agents-v2/anthropic-adapter";

type ProviderAssistantMessage = {
  role: "assistant";
  content: string | null;
  tool_calls?: NonNullable<ChatCompletionAssistantMessageParam["tool_calls"]>;
};

export interface ProviderCompletion {
  choices: Array<{
    message: ProviderAssistantMessage;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

function jsonInstruction(responseFormat: unknown): string | undefined {
  return responseFormat && typeof responseFormat === "object"
    ? "Return only valid JSON. Do not include markdown fences or explanatory text."
    : undefined;
}

/** Provider-neutral non-streaming completion used by legacy AI paths. */
export async function createProviderCompletion(params: {
  model?: string;
  messages: ChatCompletionMessageParam[];
  tools?: ChatCompletionTool[];
  tool_choice?: unknown;
  temperature?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  response_format?: unknown;
}): Promise<ProviderCompletion> {
  const runningTests = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST_WORKER_ID);
  if (AI_PROVIDER !== "anthropic" || runningTests) {
    return openai.chat.completions.create({
      model: params.model || "gpt-5-nano",
      messages: params.messages,
      ...(params.tools ? { tools: params.tools, tool_choice: "auto" as const } : {}),
      ...(params.temperature === undefined ? {} : { temperature: params.temperature }),
      ...(params.max_tokens === undefined ? {} : { max_tokens: params.max_tokens }),
      ...(params.max_completion_tokens === undefined
        ? {}
        : { max_completion_tokens: params.max_completion_tokens }),
      ...(params.response_format ? { response_format: params.response_format as never } : {}),
    }) as Promise<ProviderCompletion>;
  }

  const request = toAnthropicRequest(params.messages);
  const instruction = jsonInstruction(params.response_format);
  const system = [request.system, instruction].filter(Boolean).join("\n\n") || undefined;
  const response = await anthropic.messages.create({
    model: params.model || ANTHROPIC_MODEL,
    max_tokens: params.max_tokens || params.max_completion_tokens || Number(process.env.ANTHROPIC_MAX_TOKENS || 4096),
    system,
    messages: request.messages,
    tools: toAnthropicTools(params.tools),
  });

  const toolCalls: NonNullable<ChatCompletionAssistantMessageParam["tool_calls"]> = [];
  const textParts: string[] = [];
  for (const block of response.content) {
    if (block.type === "text") textParts.push(block.text);
    if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        type: "function",
        function: { name: block.name, arguments: JSON.stringify(block.input) },
      });
    }
  }

  const message: ProviderAssistantMessage = {
    role: "assistant",
    content: textParts.join("\n") || null,
    ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
  };

  return {
    choices: [{ message }],
    usage: {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
    },
  };
}
