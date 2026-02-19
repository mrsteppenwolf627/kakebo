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
 * Pending action awaiting user confirmation
 */
export interface PendingAction {
  toolCall: OpenAIToolCall;
  toolName: string;
  arguments: Record<string, unknown>;
  description: string; // Human-readable description for user
}

/**
 * Confirmation request for write operations
 */
export interface ConfirmationRequest {
  message: string; // Confirmation question for user
  pendingAction: PendingAction;
  requiresConfirmation: true;
}

/**
 * Response from the agent
 */
export interface AgentResponse {
  message: string;
  toolsUsed: string[];
  metrics: ExecutionMetrics;
  confirmationRequest?: ConfirmationRequest; // Present when confirmation needed
}

/**
 * Log entry for a tool call (for debugging)
 */
export interface ToolCallLog {
  toolName: string;
  arguments: Record<string, unknown>;
  result: unknown;
  error?: string;
  errorType?: string; // Added in v2: classifies error for better handling
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
