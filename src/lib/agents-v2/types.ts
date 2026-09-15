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
 * Confirmation request for write operations (legacy, non-streaming v1
 * architecture — src/lib/agents-v2/function-caller.ts + src/app/api/ai/
 * agent-v2/route.ts). NOT used by the active chat, which streams via
 * src/lib/agents-v2/stream-caller.ts and uses `StreamConfirmationRequest`
 * below instead. Left unchanged: v1 is out of scope for Fase 2.E.
 */
export interface ConfirmationRequest {
  message: string; // Confirmation question for user
  pendingAction: PendingAction;
  requiresConfirmation: true;
}

/**
 * Confirmation request for write operations, ACTIVE streaming flow (Fase
 * 2.E — corrección de seguridad). Sent to the client over SSE. Carries
 * ONLY the human-readable message and an opaque `confirmationId` — never
 * the executable action (`PendingAction`) itself. The real action stays
 * server-side, in `public.ai_pending_actions` (see
 * src/lib/agents-v2/pending-actions.ts), and is only resolved when the
 * client sends this exact `confirmationId` back, consumed atomically so it
 * can execute at most once.
 */
export interface StreamConfirmationRequest {
  message: string; // Confirmation question for user
  confirmationId: string; // Opaque id — resolves to the real action server-side, once
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
