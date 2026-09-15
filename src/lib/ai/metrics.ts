import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * AI Log entry for tracking and evaluation
 */
export interface AILogEntry {
  id?: string;
  user_id: string;
  // Fase 2.I: 'agent_v2' identifica las filas del chat activo en streaming
  // (logAgentTurnMetrics, más abajo) — nunca escriben `input`/`output`.
  type: "classification" | "assistant" | "agent_v2";
  input: string;
  output: unknown;
  model: string;
  prompt_version?: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  latency_ms: number;
  tools_used?: string[];
  success: boolean;
  error_message?: string;
  // For classification: was it corrected by user?
  was_corrected?: boolean;
  corrected_category?: string;
  created_at?: string;
}

/**
 * Aggregated metrics for dashboard
 */
export interface AIMetrics {
  period: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  totalCostUsd: number;
  avgCostPerRequest: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgLatencyMs: number;
  byType: {
    classification: number;
    assistant: number;
    // Fase 2.I: turnos del chat activo en streaming (agent-v2).
    agent_v2: number;
  };
  byModel: Record<string, number>;
  // Classification accuracy (if corrections available)
  classificationsTotal: number;
  classificationsCorrected: number;
  classificationAccuracy: number;
}

/**
 * Log an AI interaction to the database
 */
export async function logAIInteraction(
  supabase: SupabaseClient,
  entry: Omit<AILogEntry, "id" | "created_at">
): Promise<void> {
  try {
    const { error } = await supabase.from("ai_logs").insert({
      user_id: entry.user_id,
      type: entry.type,
      input: entry.input,
      output: entry.output,
      model: entry.model,
      prompt_version: entry.prompt_version,
      input_tokens: entry.input_tokens,
      output_tokens: entry.output_tokens,
      cost_usd: entry.cost_usd,
      latency_ms: entry.latency_ms,
      tools_used: entry.tools_used,
      success: entry.success,
      error_message: entry.error_message,
    });

    if (error) {
      // Don't throw - logging shouldn't break the main flow
      apiLogger.warn({ error }, "Failed to log AI interaction");
    }
  } catch (err) {
    apiLogger.warn({ err }, "Failed to log AI interaction");
  }
}

/**
 * Fase 2.I: tipo técnico de turno del chat activo (agent-v2 streaming,
 * src/lib/agents-v2/stream-caller.ts). Sirve para poder decidir más
 * adelante un enrutamiento de modelos por tipo de tarea (ver la auditoría
 * de la Fase 2.H) — nunca contiene ni implica contenido de conversación.
 */
export type AgentV2TurnType =
  | "direct_response" // Respuesta directa del modelo, sin ninguna herramienta.
  | "tool_query" // Herramienta(s) de solo lectura ejecutada(s) y síntesis final.
  | "confirmation_proposed" // Escritura propuesta, pendiente de confirmación del usuario.
  | "confirmation_executed" // Escritura ya confirmada y ejecutada en este turno.
  | "scope_blocked" // Bloqueado por la puerta de ámbito de ciclo (Fase 2.D/2.F).
  | "error"; // Error gestionado (confirmación inválida, excepción, etc.).

/**
 * Fase 2.I: entrada de métricas MÍNIMA y privacy-safe para un turno del
 * chat activo. Deliberadamente más estrecha que `AILogEntry`: no admite
 * `input`/`output`/`prompt_version`/`was_corrected` — ningún campo por el
 * que pudiera colarse contenido de conversación, datos de un gasto o
 * argumentos de herramientas. `error_message`, si se usa, debe ser un
 * aviso técnico seguro (p. ej. el nombre de una excepción o un motivo de
 * fallo ya catalogado), nunca el mensaje libre de un error que pudiera
 * incluir datos de entrada.
 */
export interface AgentTurnMetricsEntry {
  user_id: string;
  model: string;
  turn_type: AgentV2TurnType;
  input_tokens: number;
  output_tokens: number;
  /**
   * Estimación calculada localmente por el código actual
   * (calculateCost, src/lib/ai/client.ts) a partir de los precios por
   * modelo configurados ahí — NUNCA una factura real ni verificada de
   * OpenAI. El nombre del campo lo deja explícito a propósito.
   */
  cost_usd_estimated: number;
  latency_ms: number;
  /** Solo NOMBRES de herramientas (p. ej. "searchExpenses") — nunca argumentos. */
  tools_used: string[];
  success: boolean;
  /** Aviso técnico seguro (nunca contenido de usuario/gasto). Opcional. */
  error_message?: string;
}

/**
 * Fase 2.I: registra una métrica MÍNIMA de un turno del chat activo
 * (agent-v2) en la tabla `ai_logs` ya existente, reutilizándola con
 * `type: "agent_v2"` — nunca escribe `input`/`output` (quedan NULL; ver
 * migración 20260914_add_ai_logs_agent_v2_turn_metrics.sql, que hace
 * `input` nullable y añade `turn_type`). No lanza excepciones: un fallo al
 * guardar la métrica se registra como aviso técnico y no debe romper el
 * streaming del chat ni impedir una escritura ya autorizada — por eso el
 * llamante siempre puede hacer `await` sin necesitar su propio try/catch.
 */
export async function logAgentTurnMetrics(
  supabase: SupabaseClient,
  entry: AgentTurnMetricsEntry
): Promise<void> {
  try {
    const { error } = await supabase.from("ai_logs").insert({
      user_id: entry.user_id,
      type: "agent_v2",
      turn_type: entry.turn_type,
      model: entry.model,
      input_tokens: entry.input_tokens,
      output_tokens: entry.output_tokens,
      cost_usd: entry.cost_usd_estimated,
      latency_ms: entry.latency_ms,
      tools_used: entry.tools_used,
      success: entry.success,
      error_message: entry.error_message,
      // input/output deliberadamente omitidos (quedan NULL) — nunca se
      // rellenan con contenido de conversación, notas de gasto ni
      // argumentos de herramientas.
    });

    if (error) {
      apiLogger.warn({ error }, "Failed to log agent-v2 turn metrics");
    }
  } catch (err) {
    apiLogger.warn({ err }, "Failed to log agent-v2 turn metrics");
  }
}

/**
 * Get aggregated AI metrics for a period
 */
export async function getAIMetrics(
  supabase: SupabaseClient,
  userId: string,
  options: {
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<AIMetrics> {
  const startDate =
    options.startDate ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = options.endDate || new Date().toISOString();

  const query = supabase
    .from("ai_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  const { data: logs, error } = await query;

  if (error) {
    apiLogger.error({ error }, "Failed to fetch AI metrics");
    return createEmptyMetrics(startDate, endDate);
  }

  if (!logs || logs.length === 0) {
    return createEmptyMetrics(startDate, endDate);
  }

  // Calculate aggregated metrics
  const totalRequests = logs.length;
  const successfulRequests = logs.filter((l) => l.success).length;
  const failedRequests = totalRequests - successfulRequests;

  const totalCostUsd = logs.reduce((sum, l) => sum + (l.cost_usd || 0), 0);
  const totalInputTokens = logs.reduce((sum, l) => sum + (l.input_tokens || 0), 0);
  const totalOutputTokens = logs.reduce((sum, l) => sum + (l.output_tokens || 0), 0);
  const avgLatencyMs =
    logs.reduce((sum, l) => sum + (l.latency_ms || 0), 0) / totalRequests;

  // By type
  const classifications = logs.filter((l) => l.type === "classification");
  const assistantCalls = logs.filter((l) => l.type === "assistant");
  // Fase 2.I: turnos del chat activo en streaming (agent-v2).
  const agentV2Calls = logs.filter((l) => l.type === "agent_v2");

  // By model
  const byModel: Record<string, number> = {};
  for (const log of logs) {
    byModel[log.model] = (byModel[log.model] || 0) + 1;
  }

  // Classification accuracy
  const classificationsCorrected = classifications.filter(
    (l) => l.was_corrected
  ).length;

  return {
    period: `${startDate.split("T")[0]} to ${endDate.split("T")[0]}`,
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    totalCostUsd: Math.round(totalCostUsd * 10000) / 10000,
    avgCostPerRequest:
      totalRequests > 0
        ? Math.round((totalCostUsd / totalRequests) * 10000) / 10000
        : 0,
    totalInputTokens,
    totalOutputTokens,
    avgLatencyMs: Math.round(avgLatencyMs),
    byType: {
      classification: classifications.length,
      assistant: assistantCalls.length,
      agent_v2: agentV2Calls.length,
    },
    byModel,
    classificationsTotal: classifications.length,
    classificationsCorrected,
    classificationAccuracy:
      classifications.length > 0
        ? Math.round(
            ((classifications.length - classificationsCorrected) /
              classifications.length) *
              100
          )
        : 100,
  };
}

/**
 * Record a classification correction (for accuracy tracking)
 */
export async function recordCorrection(
  supabase: SupabaseClient,
  logId: string,
  correctedCategory: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("ai_logs")
      .update({
        was_corrected: true,
        corrected_category: correctedCategory,
      })
      .eq("id", logId);

    if (error) {
      apiLogger.warn({ error }, "Failed to record correction");
    }
  } catch (err) {
    apiLogger.warn({ err }, "Failed to record correction");
  }
}

/**
 * Get recent AI logs for debugging/review
 */
export async function getRecentLogs(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 20
): Promise<AILogEntry[]> {
  const { data, error } = await supabase
    .from("ai_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    apiLogger.error({ error }, "Failed to fetch recent logs");
    return [];
  }

  return data || [];
}

function createEmptyMetrics(startDate: string, endDate: string): AIMetrics {
  return {
    period: `${startDate.split("T")[0]} to ${endDate.split("T")[0]}`,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    successRate: 0,
    totalCostUsd: 0,
    avgCostPerRequest: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    avgLatencyMs: 0,
    byType: { classification: 0, assistant: 0, agent_v2: 0 },
    byModel: {},
    classificationsTotal: 0,
    classificationsCorrected: 0,
    classificationAccuracy: 100,
  };
}

/**
 * SQL to create the ai_logs table in Supabase
 *
 * Run this in Supabase SQL Editor.
 *
 * Fase 2.I: esta es la ÚNICA definición de referencia de `ai_logs` para un
 * entorno NUEVO (sin la tabla todavía) — ya incluye `type = 'agent_v2'`,
 * `turn_type` (con su propio CHECK) e `input` nullable, para que un
 * entorno creado desde cero quede coherente con lo que
 * `logAgentTurnMetrics` (más arriba) necesita escribir, sin pasos
 * adicionales.
 *
 * IMPORTANTE — entorno YA EXISTENTE (tabla creada antes de la Fase 2.I):
 * `CREATE TABLE IF NOT EXISTS` de más abajo es un no-op si `ai_logs` ya
 * existe — NO amplía retroactivamente su CHECK de `type`, ni añade
 * `turn_type`, ni relaja `input` a nullable. Para ese caso, ejecuta en su
 * lugar (o además) la migración dedicada:
 *   supabase/migrations/20260914_add_ai_logs_agent_v2_turn_metrics.sql
 * (idempotente, no aplicada — el equipo decide cuándo ejecutarla). No hay
 * dos definiciones de esquema contradictorias: esta es el estado final
 * deseado para una tabla nueva; esa migración es el mismo estado final
 * expresado como upgrade seguro para una tabla ya desplegada.
 */
export const AI_LOGS_TABLE_SQL = `
-- Create ai_logs table for tracking AI interactions
CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('classification', 'assistant', 'agent_v2')),
  -- Nullable: las filas type = 'agent_v2' (chat activo, Fase 2.I) nunca lo
  -- rellenan — nunca se guarda el mensaje del usuario, el historial de
  -- conversación ni la respuesta de la IA para esas filas.
  input TEXT,
  output JSONB,
  model TEXT NOT NULL,
  prompt_version TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  -- Coste ESTIMADO por el código local (calculateCost, src/lib/ai/client.ts)
  -- a partir de los precios por modelo configurados ahí — nunca una
  -- factura real ni verificada de OpenAI.
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  tools_used TEXT[],
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  was_corrected BOOLEAN DEFAULT false,
  corrected_category TEXT,
  -- Fase 2.I: clasificación técnica del turno de agent-v2 (uno de
  -- direct_response, tool_query, confirmation_proposed,
  -- confirmation_executed, scope_blocked, error). NULL para filas que no
  -- son type = 'agent_v2'.
  turn_type TEXT CHECK (
    turn_type IS NULL OR turn_type IN (
      'direct_response',
      'tool_query',
      'confirmation_proposed',
      'confirmation_executed',
      'scope_blocked',
      'error'
    )
  ),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_logs_type ON ai_logs(type);

-- Enable RLS
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own logs
CREATE POLICY "Users can view own ai_logs"
  ON ai_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: users can insert their own logs
CREATE POLICY "Users can insert own ai_logs"
  ON ai_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: users can update their own logs (for corrections)
CREATE POLICY "Users can update own ai_logs"
  ON ai_logs FOR UPDATE
  USING (auth.uid() = user_id);
`;
