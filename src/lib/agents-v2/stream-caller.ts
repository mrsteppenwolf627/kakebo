/**
 * Streaming version of the OpenAI Function Calling orchestrator (v2)
 *
 * Emits SSE-style events via callback throughout the request lifecycle:
 *
 *   thinking    → First LLM call started (show "Pensando...")
 *   tools       → Tool names identified (show "Consultando: analyzeSpendingPattern")
 *   executing   → Tools running (show "Analizando datos...")
 *   chunk       → Token from LLM output (append to message bubble)
 *   done        → Complete response (toolsUsed + metrics)
 *   error       → Unrecoverable error
 *   confirmation → Write operation needs user approval. Carries ONLY a
 *                  human message + an opaque confirmationId (Fase 2.E,
 *                  corrección de seguridad) — never the executable action.
 *                  See src/lib/agents-v2/pending-actions.ts.
 *
 * Streaming strategy:
 *   - First LLM call: stream: true
 *     • Direct response (no tools) → text chunks emitted live
 *     • Tool response → tool_call deltas buffered, no text emitted
 *   - Second LLM call (synthesis): stream: true
 *     → text chunks emitted live
 *   - Confirmed-write path (confirmationId provided): the first LLM call is
 *     skipped entirely — the tool to execute comes ONLY from the server-side
 *     pending-action row consumed atomically by confirmationId, never from
 *     anything the client sends. Only the synthesis call still runs, so the
 *     user gets a natural-language confirmation message.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";
import { openai, DEFAULT_MODEL, calculateCost } from "@/lib/ai/client";
import type {
  ChatCompletionMessageParam,
  ChatCompletionAssistantMessageParam,
} from "openai/resources/chat/completions";

import { KAKEBO_SYSTEM_PROMPT } from "./prompts";
import { KAKEBO_TOOLS, TOOL_METADATA } from "./tools/definitions";
import { executeTools, getToolNames } from "./tools/executor";
import {
  getUserContextCached,
  generateContextDisclaimer,
} from "./context-analyzer";
import {
  getRelevantExamples,
  formatExamplesForPrompt,
} from "@/lib/agents/tools/utils/example-retriever";
import {
  evaluateSearchExpensesScope,
  type SearchExpensesScopeGateArgs,
} from "@/lib/agents/tools/utils/search-scope-gate";
import {
  evaluateAnalyzeHabitsScope,
  type AnalyzeHabitsScopeGateArgs,
} from "@/lib/agents/tools/utils/analyze-habits-scope-gate";
import { callMissesExplicitPreviousCycle } from "@/lib/agents/tools/utils/previous-cycle-guard";
import { getAiConfirmWritesPreference } from "./user-write-confirmation";
import {
  createPendingAction,
  consumePendingAction,
  confirmFailureMessage,
} from "./pending-actions";
import {
  analyzeSpendingHabits,
  type AnalyzeHabitsParams,
} from "@/lib/agents/tools/analyze-habits";
import {
  logAgentTurnMetrics,
  type AgentV2TurnType,
} from "@/lib/ai/metrics";
import type {
  ConversationMessage,
  ExecutionMetrics,
  OpenAIToolCall,
  OpenAIToolMessage,
  StreamConfirmationRequest,
} from "./types";

// ─── Event types ──────────────────────────────────────────────────────────────

export type StreamEvent =
  | { type: "thinking" }
  | { type: "tools"; names: string[] }
  | { type: "executing" }
  | { type: "chunk"; text: string }
  | { type: "done"; toolsUsed: string[]; metrics: ExecutionMetrics }
  | { type: "error"; message: string }
  | { type: "confirmation"; request: StreamConfirmationRequest };

export type StreamEventCallback = (event: StreamEvent) => void;

// ─── Tool call validation (mirrors function-caller.ts) ───────────────────────

const TOOL_CALLING_LIMITS = {
  maxToolsPerCall: 3,
  forbiddenCombinations: [["predictMonthlySpending", "getSpendingTrends"]] as const,
  requiredCompanions: {
    predictMonthlySpending: "getBudgetStatus",
  } as const,
};

function filterToolCalls(toolCalls: OpenAIToolCall[]): OpenAIToolCall[] {
  // 1. Limit count
  let filtered = toolCalls.slice(0, TOOL_CALLING_LIMITS.maxToolsPerCall);

  // 2. Remove forbidden combinations
  const names = filtered.map((tc) => tc.function.name);
  for (const [a, b] of TOOL_CALLING_LIMITS.forbiddenCombinations) {
    if (names.includes(a) && names.includes(b)) {
      filtered = filtered.filter((tc) => tc.function.name !== b);
    }
  }

  return filtered;
}

/**
 * Fase 2.F: ejecuta una llamada a `analyzeSpendingPattern` con la nueva
 * lógica de hábitos basada en ciclos reales (analyzeSpendingHabits,
 * src/lib/agents/tools/analyze-habits.ts), FUERA del executor compartido
 * con la arquitectura no conectada (function-caller.ts usa el
 * `analyzeSpendingPattern` legado a través de tools/executor.ts, que no se
 * toca en esta tarea). Mismo formato de mensaje de error que el executor
 * compartido, para que el modelo lo trate igual (nunca inventa datos).
 */
async function executeAnalyzeSpendingPatternCall(
  toolCall: OpenAIToolCall,
  supabase: SupabaseClient,
  userId: string
): Promise<OpenAIToolMessage> {
  try {
    const args = JSON.parse(toolCall.function.arguments) as AnalyzeHabitsParams;
    const result = await analyzeSpendingHabits(supabase, userId, args);
    return { role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) };
  } catch (error) {
    apiLogger.error(
      { error, userId, toolCallId: toolCall.id },
      "analyzeSpendingPattern (Fase 2.F, habit analysis) execution failed"
    );
    const message = error instanceof Error ? error.message : "Error desconocido";
    return {
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify({
        _error: true,
        _errorType: "validation",
        _userMessage: message,
        _instruction:
          "CRITICAL: You MUST inform the user about this error using the _userMessage. DO NOT make up data. DO NOT proceed as if the tool worked.",
      }),
    };
  }
}

// ─── Main streaming function ──────────────────────────────────────────────────

/**
 * Process a user message with streaming output via SSE-style callbacks.
 *
 * @param userMessage           Current user message
 * @param conversationHistory   Previous messages
 * @param supabase              Supabase client
 * @param userId                User ID
 * @param onEvent               Callback receiving stream events
 * @param confirmationId        Optional: opaque id of a server-persisted
 *                               pending action the user just confirmed
 *                               (Fase 2.E). The action to execute is
 *                               resolved server-side by consuming this id
 *                               atomically — never trusted from the client.
 */
export async function processFunctionCallingStream(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  supabase: SupabaseClient,
  userId: string,
  onEvent: StreamEventCallback,
  confirmationId?: string
): Promise<void> {
  const startTime = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  let toolCallsCount = 0;

  // Fase 2.I: registra exactamente UNA métrica mínima y privacy-safe por
  // petición al stream activo — nunca contenido de conversación, datos de
  // gasto ni argumentos de herramientas (ver AgentTurnMetricsEntry,
  // src/lib/ai/metrics.ts). Cierra sobre inputTokens/outputTokens, que se
  // leen en el momento de la llamada (no al definir esta función), así que
  // siempre reflejan lo acumulado hasta ese punto del turno. Nunca lanza
  // (logAgentTurnMetrics ya captura sus propios errores): un fallo al
  // guardar la métrica no debe romper el streaming ni una escritura ya
  // autorizada — se llama siempre DESPUÉS de emitir el evento SSE
  // correspondiente y después de que cualquier ejecución de herramienta ya
  // haya terminado.
  const recordTurn = async (
    turnType: AgentV2TurnType,
    opts: { toolsUsed?: string[]; success: boolean; errorMessage?: string }
  ): Promise<void> => {
    // Defensa adicional: logAgentTurnMetrics ya captura sus propios
    // errores y nunca debería rechazar, pero esta llamada se hace DESPUÉS
    // de emitir el evento "done"/"confirmation" y de ejecutar cualquier
    // escritura — un fallo aquí, sea cual sea su origen, jamás debe
    // propagarse al try/catch exterior (que emitiría un segundo evento
    // "error" tras el "done" ya enviado) ni afectar al resultado del turno.
    try {
      await logAgentTurnMetrics(supabase, {
        user_id: userId,
        model: DEFAULT_MODEL,
        turn_type: turnType,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd_estimated: calculateCost(DEFAULT_MODEL, inputTokens, outputTokens),
        latency_ms: Date.now() - startTime,
        tools_used: opts.toolsUsed ?? [],
        success: opts.success,
        error_message: opts.errorMessage,
      });
    } catch (metricsError) {
      apiLogger.warn(
        { metricsError, userId, turnType },
        "recordTurn: unexpected failure persisting agent-v2 turn metrics — ignored"
      );
    }
  };

  try {
    // ── User context (same as function-caller.ts) ─────────────────────────
    const userContext = await getUserContextCached(supabase, userId);
    const contextDisclaimer = generateContextDisclaimer(userContext);

    // ── P1-2: Few-shot correction examples ───────────────────────────────
    let correctionExamplesMessage = "";
    try {
      const examples = await getRelevantExamples(supabase, userId, {
        limit: 6,
        minConfidence: 0.8,
      });
      if (examples.length > 0) {
        correctionExamplesMessage = formatExamplesForPrompt(examples);
      }
    } catch {
      // Non-blocking
    }

    // ── Build messages ────────────────────────────────────────────────────
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: KAKEBO_SYSTEM_PROMPT },
      { role: "system", content: contextDisclaimer },
      ...(correctionExamplesMessage
        ? [
            {
              role: "system" as const,
              content: `CORRECCIONES PREVIAS DEL USUARIO (úsalas para categorizar con precisión):\n${correctionExamplesMessage}`,
            },
          ]
        : []),
      ...conversationHistory.map(
        (msg): ChatCompletionMessageParam => ({
          role: msg.role,
          content: msg.content,
        })
      ),
      { role: "user", content: userMessage },
    ];

    // ── Confirmed-write path (Fase 2.E, corrección de seguridad) ──────────
    // El cliente solo envía un confirmationId opaco. La acción a ejecutar
    // se resuelve EXCLUSIVAMENTE consumiendo esa fila en servidor de forma
    // atómica — nunca se acepta un tool_call/arguments enviado por el
    // cliente. No se llama al modelo para "decidir" qué ejecutar: ya se
    // decidió cuando se propuso la escritura, y quedó fijado en la fila
    // pendiente. Una repetición de red, doble clic o reenvío manual del
    // mismo confirmationId siempre falla aquí sin ejecutar nada, porque la
    // UPDATE atómica solo puede transicionar pending -> confirmed una vez.
    if (confirmationId) {
      // Fase 2.E (corrección de seguridad): consumePendingAction usa
      // internamente el cliente administrador (createAdminClient()) —
      // nunca `supabase` (sesión del usuario) — porque ai_pending_actions
      // es una tabla exclusiva de servidor sin políticas RLS para
      // authenticated/anon. El aislamiento por usuario lo aplica la propia
      // función mediante `user_id = userId` en la consulta.
      const consumed = await consumePendingAction(userId, confirmationId);

      if (!consumed.success) {
        onEvent({ type: "error", message: confirmFailureMessage(consumed.reason) });
        await recordTurn("error", {
          success: false,
          errorMessage: `confirmation_consume_failed:${consumed.reason}`,
        });
        return;
      }

      const toolCallsToExecute: OpenAIToolCall[] = [consumed.action.toolCall];
      toolCallsCount = 1;
      const toolNames = getToolNames(toolCallsToExecute);

      onEvent({ type: "tools", names: toolNames });
      onEvent({ type: "executing" });

      const { toolMessages } = await executeTools(toolCallsToExecute, supabase, userId);

      const messagesWithTools: ChatCompletionMessageParam[] = [
        ...messages,
        {
          role: "assistant",
          content: null,
          tool_calls: toolCallsToExecute,
        } as ChatCompletionAssistantMessageParam,
        ...toolMessages,
      ];

      const confirmedSynthesisStream = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: messagesWithTools,
        stream: true,
        stream_options: { include_usage: true },
      });

      for await (const chunk of confirmedSynthesisStream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          onEvent({ type: "chunk", text });
        }
        if (chunk.usage) {
          inputTokens += chunk.usage.prompt_tokens ?? 0;
          outputTokens += chunk.usage.completion_tokens ?? 0;
        }
      }

      const latencyMs = Date.now() - startTime;
      const costUsd = calculateCost(DEFAULT_MODEL, inputTokens, outputTokens);

      apiLogger.info(
        { userId, latencyMs, toolsUsed: toolNames, inputTokens, outputTokens, costUsd },
        "Streaming function calling completed (confirmed write)"
      );

      onEvent({
        type: "done",
        toolsUsed: toolNames,
        metrics: {
          model: DEFAULT_MODEL,
          latencyMs,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          costUsd,
          toolCalls: toolCallsCount,
        },
      });
      await recordTurn("confirmation_executed", { toolsUsed: toolNames, success: true });
      return;
    }
    // ───────────────────────────────────────────────────────────────────────

    // ── Emit: thinking ────────────────────────────────────────────────────
    onEvent({ type: "thinking" });

    // ── First LLM call — stream: true ─────────────────────────────────────
    // • Direct response: text chunks arrive → emit as "chunk" events
    // • Tool response: tool_call deltas buffered → no text emitted
    const firstStream = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      tools: KAKEBO_TOOLS,
      tool_choice: "auto",
      stream: true,
      stream_options: { include_usage: true },
    });

    // Buffer for assembling tool_call argument fragments
    const toolCallBuffers = new Map<
      number,
      { id: string; name: string; arguments: string }
    >();
    let hasToolCalls = false;

    for await (const chunk of firstStream) {
      const delta = chunk.choices[0]?.delta;

      // Text content → emit as chunk (direct response path)
      if (delta?.content) {
        onEvent({ type: "chunk", text: delta.content });
      }

      // Tool call deltas → buffer (tool response path)
      if (delta?.tool_calls) {
        hasToolCalls = true;
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!toolCallBuffers.has(idx)) {
            toolCallBuffers.set(idx, { id: "", name: "", arguments: "" });
          }
          const buf = toolCallBuffers.get(idx)!;
          if (tc.id) buf.id = tc.id;
          if (tc.function?.name) buf.name = tc.function.name;
          if (tc.function?.arguments) buf.arguments += tc.function.arguments;
        }
      }

      // Usage from last chunk (stream_options.include_usage)
      if (chunk.usage) {
        inputTokens += chunk.usage.prompt_tokens ?? 0;
        outputTokens += chunk.usage.completion_tokens ?? 0;
      }
    }

    // ── Direct response: done ─────────────────────────────────────────────
    if (!hasToolCalls) {
      const latencyMs = Date.now() - startTime;
      const costUsd = calculateCost(DEFAULT_MODEL, inputTokens, outputTokens);
      onEvent({
        type: "done",
        toolsUsed: [],
        metrics: {
          model: DEFAULT_MODEL,
          latencyMs,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          costUsd,
          toolCalls: 0,
        },
      });
      await recordTurn("direct_response", { toolsUsed: [], success: true });
      return;
    }

    // ── Tool response path ────────────────────────────────────────────────

    // Reconstruct OpenAIToolCall[] from buffered deltas
    const assembledToolCalls: OpenAIToolCall[] = Array.from(
      toolCallBuffers.values()
    ).map((buf) => ({
      id: buf.id,
      type: "function" as const,
      function: { name: buf.name, arguments: buf.arguments },
    }));

    // Validate & filter
    const toolCallsToExecute = filterToolCalls(assembledToolCalls);

    toolCallsCount = toolCallsToExecute.length;
    const toolNames = getToolNames(toolCallsToExecute);

    // ── Emit: tools identified ────────────────────────────────────────────
    onEvent({ type: "tools", names: toolNames });

    // ── Scope-before-analysis gate (Fase 2.D) ─────────────────────────────
    // Backstop determinista: si el modelo llama a searchExpenses con una
    // subcategoría ya resuelta (consulta agregada tipo "gastos de X") pero
    // sin cycle_scope, o con una consulta de alimentación ambigua sin
    // resolver, no se ejecuta la tool — se pide la aclaración al usuario en
    // vez de adivinar o analizar un ámbito implícito. La clasificación fina
    // de intención (análisis vs. búsqueda de un gasto individual concreto)
    // es responsabilidad del prompt (KAKEBO_SYSTEM_PROMPT); esto solo cubre
    // el subconjunto detectable de forma determinista en los argumentos ya
    // construidos por el modelo. No aplica a crear/editar/corregir gastos.
    for (const tc of toolCallsToExecute) {
      if (tc.function.name !== "searchExpenses") continue;

      let parsedArgs: SearchExpensesScopeGateArgs;
      try {
        parsedArgs = JSON.parse(tc.function.arguments);
      } catch {
        continue; // Argumentos inválidos: deja que el flujo normal falle y lo reporte.
      }

      const gate = evaluateSearchExpensesScope(parsedArgs);
      if (gate.action === "proceed") continue;

      const clarifyMessage =
        gate.action === "ask_food_type"
          ? "¿Te refieres a alimentación básica, a comer fuera o a ambas?"
          : "¿Quieres que analice el ciclo actual, un ciclo concreto o todo tu historial?";

      onEvent({ type: "chunk", text: clarifyMessage });

      const latencyMs = Date.now() - startTime;
      const costUsd = calculateCost(DEFAULT_MODEL, inputTokens, outputTokens);

      onEvent({
        type: "done",
        toolsUsed: [],
        metrics: {
          model: DEFAULT_MODEL,
          latencyMs,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          costUsd,
          toolCalls: 0,
        },
      });
      await recordTurn("scope_blocked", { toolsUsed: [tc.function.name], success: true });
      return;
    }
    // ───────────────────────────────────────────────────────────────────────

    // ── Scope-before-analysis gate for habit analysis (Fase 2.F) ──────────
    // analyzeSpendingPattern es, por definición, SIEMPRE una consulta
    // agregada (a diferencia de searchExpenses, no tiene un modo
    // "individual_lookup" exento) — así que cycle_scope es obligatorio en
    // TODA llamada, sin excepción. Si además el modelo pide una
    // comparación explícita (compare: true) sin indicar con qué ciclo
    // comparar, se pide esa aclaración antes de ejecutar nada — nunca se
    // añade un segundo ciclo "porque sí" ni se adivina cuál.
    for (const tc of toolCallsToExecute) {
      if (tc.function.name !== "analyzeSpendingPattern") continue;

      let parsedArgs: AnalyzeHabitsScopeGateArgs;
      try {
        parsedArgs = JSON.parse(tc.function.arguments);
      } catch {
        continue; // Argumentos inválidos: deja que el flujo normal falle y lo reporte.
      }

      const gate = evaluateAnalyzeHabitsScope(parsedArgs);
      if (gate.action === "proceed") continue;

      const clarifyMessage =
        gate.action === "ask_compare_scope"
          ? "¿Con qué quieres comparar? Puede ser el ciclo actual, un ciclo concreto (indícame cuál) o todo tu historial."
          : "¿Quieres que analice el ciclo actual, un ciclo concreto o todo tu historial?";

      onEvent({ type: "chunk", text: clarifyMessage });

      const latencyMs = Date.now() - startTime;
      const costUsd = calculateCost(DEFAULT_MODEL, inputTokens, outputTokens);

      onEvent({
        type: "done",
        toolsUsed: [],
        metrics: {
          model: DEFAULT_MODEL,
          latencyMs,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          costUsd,
          toolCalls: 0,
        },
      });
      await recordTurn("scope_blocked", { toolsUsed: [tc.function.name], success: true });
      return;
    }
    // ───────────────────────────────────────────────────────────────────────

    // ── Previous-cycle guess-protection gate (Hotfix 2.1) ──────────────────
    // Bug real: al pedir "ciclo anterior", el modelo podía traducirlo a un
    // cycle_scope/cycle_ym arbitrario (p. ej. enero, o el ciclo actual) en
    // vez de usar el ámbito determinista cycle_scope: "previous". Backstop
    // puro sobre el texto literal del turno actual (ver
    // previous-cycle-guard.ts): si el usuario pidió expresamente su "ciclo
    // anterior" y ni cycle_scope ni compare_cycle_scope usan "previous", se
    // bloquea la ejecución y se pide confirmación — nunca se analiza un
    // ciclo inventado.
    for (const tc of toolCallsToExecute) {
      if (tc.function.name !== "searchExpenses" && tc.function.name !== "analyzeSpendingPattern") {
        continue;
      }

      let parsedArgs: {
        cycle_scope?: string;
        compare?: boolean;
        compare_cycle_scope?: string;
      };
      try {
        parsedArgs = JSON.parse(tc.function.arguments);
      } catch {
        continue; // Argumentos inválidos: deja que el flujo normal falle y lo reporte.
      }

      if (!callMissesExplicitPreviousCycle(userMessage, parsedArgs)) continue;

      onEvent({
        type: "chunk",
        text: "Para tu ciclo anterior, uso el ciclo inmediatamente anterior al actual (nunca un mes adivinado) — ¿confirmas que quieres tu ciclo anterior, o te referías a otro ciclo concreto?",
      });

      const latencyMs = Date.now() - startTime;
      const costUsd = calculateCost(DEFAULT_MODEL, inputTokens, outputTokens);

      onEvent({
        type: "done",
        toolsUsed: [],
        metrics: {
          model: DEFAULT_MODEL,
          latencyMs,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          costUsd,
          toolCalls: 0,
        },
      });
      await recordTurn("scope_blocked", { toolsUsed: [tc.function.name], success: true });
      return;
    }
    // ───────────────────────────────────────────────────────────────────────

    // ── Write confirmation check ──────────────────────────────────────────
    // Fase 2.E: la confirmación de escrituras de IA es, por defecto, una
    // preferencia PERSISTENTE por usuario (user_settings.ai_confirm_writes,
    // activada por defecto para todos). ENABLE_WRITE_CONFIRMATION deja de
    // ser el mecanismo principal y pasa a ser solo un interruptor de
    // seguridad GLOBAL: si se fija explícitamente a "false", desactiva la
    // confirmación para TODOS los usuarios sin depender de la migración
    // (p. ej. si el flujo de confirmación falla en producción). Cualquier
    // otro valor (ausente, "true" o cualquier otra cosa) deja que decida el
    // ajuste individual del usuario.
    const toolsNeedingConfirmation = toolCallsToExecute.filter((tc) => {
      const meta = TOOL_METADATA[tc.function.name];
      return meta?.requiresConfirmation === true;
    });

    const globalConfirmationKillSwitch = process.env.ENABLE_WRITE_CONFIRMATION === "false";
    const confirmationEnabled =
      !globalConfirmationKillSwitch &&
      toolsNeedingConfirmation.length > 0 &&
      (await getAiConfirmWritesPreference(supabase, userId));

    if (confirmationEnabled && toolsNeedingConfirmation.length > 0) {
      const tc = toolsNeedingConfirmation[0];
      const toolName = tc.function.name;
      const args = JSON.parse(tc.function.arguments);
      const meta = TOOL_METADATA[toolName];
      const confirmMsg = meta.confirmationTemplate
        ? meta.confirmationTemplate(args)
        : "¿Confirmas que quieres ejecutar esta acción?";

      // Fase 2.E (corrección de seguridad): la acción exacta se persiste en
      // servidor (public.ai_pending_actions) ANTES de decir nada al
      // cliente, usando el cliente ADMINISTRADOR internamente (no
      // `supabase`/sesión — esta tabla no tiene políticas RLS para
      // usuarios). Solo se envía el id opaco resultante — nunca el
      // tool_call ejecutable. Si la escritura en base de datos falla, se
      // falla cerrado: se informa del error y NO se ejecuta la herramienta
      // (ni aquí ni de ninguna otra forma), en vez de arriesgarse a un
      // flujo de confirmación roto.
      const confirmationId = await createPendingAction(userId, {
        toolCall: tc,
        toolName,
        arguments: args,
        description: confirmMsg,
      });

      if (!confirmationId) {
        onEvent({
          type: "error",
          message:
            "No he podido preparar la confirmación de este cambio. Por favor, inténtalo de nuevo.",
        });
        await recordTurn("error", {
          toolsUsed: [toolName],
          success: false,
          errorMessage: "create_pending_action_failed",
        });
        return;
      }

      const latencyMs = Date.now() - startTime;
      const costUsd = calculateCost(DEFAULT_MODEL, inputTokens, outputTokens);

      onEvent({
        type: "confirmation",
        request: {
          message: confirmMsg,
          confirmationId,
          requiresConfirmation: true,
        },
      });

      onEvent({
        type: "done",
        toolsUsed: [],
        metrics: {
          model: DEFAULT_MODEL,
          latencyMs,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          costUsd,
          toolCalls: 0,
        },
      });
      await recordTurn("confirmation_proposed", { toolsUsed: [toolName], success: true });
      return;
    }

    // ── Emit: executing ───────────────────────────────────────────────────
    onEvent({ type: "executing" });

    // ── Execute tools in parallel ─────────────────────────────────────────
    // Fase 2.F: analyzeSpendingPattern se ejecuta aparte, con la nueva
    // lógica de hábitos — nunca a través del executor compartido con
    // function-caller.ts (arquitectura no conectada, fuera de alcance). El
    // resto de tools sigue exactamente el mismo camino de siempre.
    const analyzeHabitsCalls = toolCallsToExecute.filter(
      (tc) => tc.function.name === "analyzeSpendingPattern"
    );
    const otherToolCalls = toolCallsToExecute.filter(
      (tc) => tc.function.name !== "analyzeSpendingPattern"
    );

    const [analyzeHabitsMessages, otherExecution] = await Promise.all([
      Promise.all(
        analyzeHabitsCalls.map((tc) => executeAnalyzeSpendingPatternCall(tc, supabase, userId))
      ),
      executeTools(otherToolCalls, supabase, userId),
    ]);

    const toolMessageById = new Map<string, OpenAIToolMessage>();
    for (const msg of otherExecution.toolMessages) toolMessageById.set(msg.tool_call_id, msg);
    for (const msg of analyzeHabitsMessages) toolMessageById.set(msg.tool_call_id, msg);
    // Conserva el orden original de toolCallsToExecute (== assembledToolCalls
    // para las tools que se ejecutan), aunque se hayan resuelto en dos grupos.
    const toolMessages = toolCallsToExecute.map((tc) => toolMessageById.get(tc.id)!);

    // ── Build messages for synthesis call ────────────────────────────────
    const messagesWithTools: ChatCompletionMessageParam[] = [
      ...messages,
      {
        role: "assistant",
        content: null,
        tool_calls: assembledToolCalls,
      } as ChatCompletionAssistantMessageParam,
      ...toolMessages,
    ];

    // ── Second LLM call — stream synthesis ───────────────────────────────
    const secondStream = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: messagesWithTools,
      stream: true,
      stream_options: { include_usage: true },
    });

    for await (const chunk of secondStream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) {
        onEvent({ type: "chunk", text });
      }
      if (chunk.usage) {
        inputTokens += chunk.usage.prompt_tokens ?? 0;
        outputTokens += chunk.usage.completion_tokens ?? 0;
      }
    }

    // ── Done ──────────────────────────────────────────────────────────────
    const latencyMs = Date.now() - startTime;
    const costUsd = calculateCost(DEFAULT_MODEL, inputTokens, outputTokens);

    apiLogger.info(
      { userId, latencyMs, toolsUsed: toolNames, inputTokens, outputTokens, costUsd },
      "Streaming function calling completed"
    );

    onEvent({
      type: "done",
      toolsUsed: toolNames,
      metrics: {
        model: DEFAULT_MODEL,
        latencyMs,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        costUsd,
        toolCalls: toolCallsCount,
      },
    });
    await recordTurn("tool_query", { toolsUsed: toolNames, success: true });
  } catch (error) {
    apiLogger.error({ error, userId }, "Stream calling failed");
    onEvent({
      type: "error",
      message: "Lo siento, hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.",
    });
    // Aviso técnico seguro: solo el nombre/tipo de la excepción, nunca su
    // mensaje libre (podría interpolar datos de entrada de alguna capa
    // inferior) ni el mensaje del usuario.
    await recordTurn("error", {
      success: false,
      errorMessage: error instanceof Error ? error.name : "unknown_error",
    });
  }
}
