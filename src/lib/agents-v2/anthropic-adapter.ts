import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import type { MessageParam, Tool } from "@anthropic-ai/sdk/resources/messages/messages";
import { anthropic, ANTHROPIC_MODEL } from "@/lib/ai/client";

export interface ProviderStreamChunk {
  choices: Array<{
    delta?: {
      content?: string | null;
      tool_calls?: Array<{
        index?: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

function appendMessage(messages: MessageParam[], message: MessageParam): void {
  const previous = messages[messages.length - 1];
  if (previous?.role === message.role) {
    const previousContent = Array.isArray(previous.content)
      ? previous.content
      : [{ type: "text" as const, text: previous.content }];
    const nextContent = Array.isArray(message.content)
      ? message.content
      : [{ type: "text" as const, text: message.content }];
    previous.content = [...previousContent, ...nextContent];
    return;
  }
  messages.push(message);
}

export function toAnthropicRequest(messages: ChatCompletionMessageParam[]): {
  system?: string;
  messages: MessageParam[];
} {
  const systemParts: string[] = [];
  const result: MessageParam[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      if (typeof message.content === "string") systemParts.push(message.content);
      continue;
    }

    if (message.role === "tool") {
      appendMessage(result, {
        role: "user",
        content: [{
          type: "tool_result",
          tool_use_id: message.tool_call_id,
          content: message.content,
        }],
      });
      continue;
    }

    if (message.role === "assistant" && message.tool_calls?.length) {
      appendMessage(result, {
        role: "assistant",
        content: message.tool_calls.flatMap((toolCall) => {
          if (!("function" in toolCall)) return [];
          return [{
            type: "tool_use" as const,
            id: toolCall.id,
            name: toolCall.function.name,
            input: JSON.parse(toolCall.function.arguments || "{}") as Record<string, unknown>,
          }];
        }),
      });
      continue;
    }

    if (message.role !== "user" && message.role !== "assistant") continue;
    const content = typeof message.content === "string" ? message.content : "";
    appendMessage(result, { role: message.role, content });
  }

  return {
    system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
    messages: result,
  };
}

export function toAnthropicTools(tools: ChatCompletionTool[] | undefined): Tool[] | undefined {
  if (!tools?.length) return undefined;
  return tools.map((tool) => {
    if (tool.type !== "function") throw new Error("Unsupported Anthropic tool type");
    return {
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters as Tool.InputSchema,
    };
  });
}

export async function createAnthropicStream(params: {
  messages: ChatCompletionMessageParam[];
  tools?: ChatCompletionTool[];
}): Promise<AsyncIterable<ProviderStreamChunk>> {
  const request = toAnthropicRequest(params.messages);
  const stream = anthropic.messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 4096),
    system: request.system,
    messages: request.messages,
    tools: toAnthropicTools(params.tools),
  });

  async function* normalized(): AsyncIterable<ProviderStreamChunk> {
    for await (const event of stream) {
      if (event.type === "message_start") {
        yield {
          choices: [],
          usage: { prompt_tokens: event.message.usage.input_tokens },
        };
      } else if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
        yield {
          choices: [{
            delta: {
              tool_calls: [{
                index: event.index,
                id: event.content_block.id,
                function: { name: event.content_block.name },
              }],
            },
          }],
        };
      } else if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          yield { choices: [{ delta: { content: event.delta.text } }] };
        } else if (event.delta.type === "input_json_delta") {
          yield {
            choices: [{
              delta: {
                tool_calls: [{
                  index: event.index,
                  function: { arguments: event.delta.partial_json },
                }],
              },
            }],
          };
        }
      } else if (event.type === "message_delta") {
        yield {
          choices: [],
          usage: { completion_tokens: event.usage.output_tokens },
        };
      }
    }
  }

  return normalized();
}
