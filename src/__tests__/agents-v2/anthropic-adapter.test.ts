import { describe, expect, it, vi } from "vitest";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import {
  createAnthropicStream,
  toAnthropicRequest,
  toAnthropicTools,
} from "@/lib/agents-v2/anthropic-adapter";
import { anthropic } from "@/lib/ai/client";

describe("Anthropic provider adapter", () => {
  it("moves OpenAI system messages into Anthropic's system field", () => {
    const request = toAnthropicRequest([
      { role: "system", content: "Regla uno" },
      { role: "system", content: "Regla dos" },
      { role: "user", content: "Hola" },
      { role: "assistant", content: "Buenas" },
    ]);

    expect(request.system).toBe("Regla uno\n\nRegla dos");
    expect(request.messages).toEqual([
      { role: "user", content: "Hola" },
      { role: "assistant", content: "Buenas" },
    ]);
  });

  it("translates tool calls and results into Claude content blocks", () => {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "assistant",
        content: null,
        tool_calls: [{
          id: "call-1",
          type: "function",
          function: { name: "getCurrentCycle", arguments: "{}" },
        }],
      },
      { role: "tool", tool_call_id: "call-1", content: '{"year":2026}' },
    ];

    const request = toAnthropicRequest(messages);
    expect(request.messages).toEqual([
      {
        role: "assistant",
        content: [{
          type: "tool_use",
          id: "call-1",
          name: "getCurrentCycle",
          input: {},
        }],
      },
      {
        role: "user",
        content: [{
          type: "tool_result",
          tool_use_id: "call-1",
          content: '{"year":2026}',
        }],
      },
    ]);
  });

  it("translates OpenAI function schemas into Anthropic tools", () => {
    const parameters = {
      type: "object" as const,
      properties: {},
      required: [],
    };
    const tools: ChatCompletionTool[] = [{
      type: "function",
      function: {
        name: "getCurrentCycle",
        description: "Gets the current cycle",
        parameters,
      },
    }];

    expect(toAnthropicTools(tools)).toEqual([{
      name: "getCurrentCycle",
      description: "Gets the current cycle",
      input_schema: parameters,
    }]);
  });

  it("normalizes streamed text, tool input and token usage", async () => {
    const events = [
      { type: "message_start", message: { usage: { input_tokens: 12 } } },
      {
        type: "content_block_start",
        index: 0,
        content_block: { type: "tool_use", id: "tool-1", name: "getCurrentCycle", input: {} },
      },
      {
        type: "content_block_delta",
        index: 0,
        delta: { type: "input_json_delta", partial_json: '{"year":2026}' },
      },
      {
        type: "content_block_delta",
        index: 1,
        delta: { type: "text_delta", text: "Respuesta" },
      },
      { type: "message_delta", usage: { output_tokens: 7 } },
    ];
    const stream = {
      async *[Symbol.asyncIterator]() {
        yield* events;
      },
    };
    const spy = vi.spyOn(anthropic.messages, "stream").mockReturnValue(stream as never);

    const normalized = await createAnthropicStream({
      messages: [{ role: "user", content: "Hola" }],
    });
    const chunks = [];
    for await (const chunk of normalized) chunks.push(chunk);

    expect(spy).toHaveBeenCalledOnce();
    expect(chunks).toEqual([
      { choices: [], usage: { prompt_tokens: 12 } },
      { choices: [{ delta: { tool_calls: [{ index: 0, id: "tool-1", function: { name: "getCurrentCycle" } }] } }] },
      { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '{"year":2026}' } }] } }] },
      { choices: [{ delta: { content: "Respuesta" } }] },
      { choices: [], usage: { completion_tokens: 7 } },
    ]);
    spy.mockRestore();
  });
});
