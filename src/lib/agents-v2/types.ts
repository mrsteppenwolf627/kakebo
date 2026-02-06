/**
 * Types for OpenAI Function Calling agent (v2)
 */

/**
 * Message in a conversation
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Execution metrics for a function calling request
 */
export interface ExecutionMetrics {
  model: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  toolCalls: number;
}

/**
 * Response from the agent
 */
export interface AgentResponse {
  message: string;
  toolsUsed: string[];
  metrics: ExecutionMetrics;
}

/**
 * Log entry for a tool call (for debugging)
 */
export interface ToolCallLog {
  toolName: string;
  arguments: Record<string, unknown>;
  result: unknown;
  error?: string;
  executionTimeMs: number;
}

/**
 * OpenAI tool call structure
 */
export interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

/**
 * OpenAI message with tool calls
 */
export interface OpenAIAssistantMessage {
  role: 'assistant';
  content: string | null;
  tool_calls?: OpenAIToolCall[];
}

/**
 * OpenAI tool result message
 */
export interface OpenAIToolMessage {
  role: 'tool';
  tool_call_id: string;
  content: string;
}
