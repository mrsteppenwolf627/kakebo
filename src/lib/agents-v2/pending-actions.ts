import { apiLogger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OpenAIToolCall, PendingAction } from "./types";

/**
 * Fase 2.E (corrección de seguridad): confirmaciones de escritura de IA
 * persistidas en servidor, de un solo uso.
 *
 * El navegador nunca ve ni reenvía la acción ejecutable completa — solo un
 * `confirmationId` opaco (el `id` de la fila en `public.ai_pending_actions`,
 * ver supabase/migrations/20260914_add_ai_pending_actions.sql). Confirmar
 * consume la fila de forma ATÓMICA con una única UPDATE ... WHERE status =
 * 'pending' ... RETURNING: solo la petición que consigue esa transición
 * puede ejecutar la herramienta. Una repetición de red, un doble clic o un
 * reenvío manual del mismo id después de consumida/cancelada/caducada
 * siempre falla sin ejecutar nada.
 *
 * TABLA EXCLUSIVA DE SERVIDOR (corrección de seguridad posterior): esta
 * tabla tiene RLS activado sin ninguna política para `anon`/`authenticated`
 * (ver la migración), así que el cliente basado en cookies/sesión del
 * usuario (src/lib/supabase/server.ts) no podría leerla ni escribirla aunque
 * se usara por error — Postgres lo denegaría. Las tres funciones de este
 * módulo usan EXCLUSIVAMENTE `createAdminClient()` (service role, que
 * ignora RLS) para acceder a `ai_pending_actions`. Como el cliente admin no
 * aplica ningún filtro de propiedad por sí mismo, cada consulta añade
 * `user_id = userId` explícitamente — esa comprobación, no RLS, es lo único
 * que impide que un usuario alcance la fila de otro. Nunca se acepta ni se
 * necesita un `SupabaseClient` externo para estas operaciones: el resto de
 * herramientas de IA (search/create/update transaction, etc.) conservan su
 * cliente de sesión habitual para sus propias comprobaciones de propiedad
 * vía RLS — eso no cambia.
 */

const PENDING_ACTION_TTL_MS = 10 * 60 * 1000; // 10 minutos

export type ConsumeFailureReason = "not_found" | "used" | "cancelled" | "expired";

export type ConsumeResult =
  | { success: true; action: PendingAction }
  | { success: false; reason: ConsumeFailureReason };

export type CancelResult =
  | { success: true }
  | { success: false; reason: ConsumeFailureReason };

/**
 * Persiste una escritura propuesta por la IA como pendiente de confirmación
 * del usuario autenticado. Devuelve el `confirmationId` opaco a enviar al
 * cliente, o `null` si la escritura en base de datos falla (en ese caso el
 * llamante NO debe ejecutar la herramienta igualmente — fallar cerrado).
 */
export async function createPendingAction(
  userId: string,
  action: PendingAction
): Promise<string | null> {
  const now = Date.now();
  const expiresAt = new Date(now + PENDING_ACTION_TTL_MS).toISOString();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ai_pending_actions")
    .insert({
      user_id: userId,
      tool_call: action.toolCall,
      tool_name: action.toolName,
      arguments: action.arguments,
      description: action.description,
      status: "pending",
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !data) {
    apiLogger.error(
      { error, userId, toolName: action.toolName },
      "Failed to persist pending AI write confirmation"
    );
    return null;
  }

  return data.id as string;
}

/**
 * Recupera y CONSUME atómicamente una confirmación pendiente: solo si
 * pertenece al usuario autenticado, no ha sido usada, no ha sido cancelada
 * y no ha caducado. La UPDATE condicionada por `status = 'pending'` es lo
 * que hace esto seguro ante llamadas concurrentes o repetidas — la segunda
 * siempre encuentra 0 filas que coincidan y falla.
 */
export async function consumePendingAction(
  userId: string,
  confirmationId: string
): Promise<ConsumeResult> {
  const nowIso = new Date().toISOString();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ai_pending_actions")
    .update({ status: "confirmed", consumed_at: nowIso })
    .eq("id", confirmationId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .gt("expires_at", nowIso)
    .select("tool_call, tool_name, arguments, description")
    .maybeSingle();

  if (!error && data) {
    return {
      success: true,
      action: {
        toolCall: data.tool_call as OpenAIToolCall,
        toolName: data.tool_name as string,
        arguments: data.arguments as Record<string, unknown>,
        description: data.description as string,
      },
    };
  }

  if (error) {
    apiLogger.warn({ error, userId, confirmationId }, "Failed to consume pending AI write confirmation");
  }

  const reason = await diagnoseFailure(supabase, userId, confirmationId, nowIso);
  return { success: false, reason };
}

/**
 * Invalida una confirmación pendiente (el usuario pulsa "Cancelar").
 * Atómico igual que `consumePendingAction`: solo transiciona pending ->
 * cancelled si de verdad seguía pendiente y perteneciente a este usuario.
 * NUNCA ejecuta ninguna herramienta ni modifica ningún gasto.
 */
export async function cancelPendingAction(
  userId: string,
  confirmationId: string
): Promise<CancelResult> {
  const nowIso = new Date().toISOString();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ai_pending_actions")
    .update({ status: "cancelled", consumed_at: nowIso })
    .eq("id", confirmationId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (!error && data) {
    return { success: true };
  }

  if (error) {
    apiLogger.warn({ error, userId, confirmationId }, "Failed to cancel pending AI write confirmation");
  }

  const reason = await diagnoseFailure(supabase, userId, confirmationId, nowIso);
  return { success: false, reason };
}

/**
 * Determina, solo con fines de mensaje al usuario, por qué una UPDATE
 * atómica no consiguió transicionar la fila. Nunca se usa para decidir si
 * ejecutar la herramienta — eso ya lo decidió (o no) la UPDATE anterior.
 * Restringida a `user_id = userId`: un id que pertenece a otro usuario (o
 * que no existe) siempre se reporta como "not_found", sin distinguir entre
 * ambos casos, para no filtrar la existencia de confirmaciones ajenas.
 */
async function diagnoseFailure(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  confirmationId: string,
  nowIso: string
): Promise<ConsumeFailureReason> {
  try {
    const { data } = await supabase
      .from("ai_pending_actions")
      .select("status, expires_at")
      .eq("id", confirmationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) return "not_found";
    if (data.status === "cancelled") return "cancelled";
    if (data.status === "confirmed") return "used";
    if (new Date(data.expires_at as string) <= new Date(nowIso)) return "expired";
    // status still "pending" and not expired but the UPDATE still matched
    // 0 rows: a concurrent request won the race first. Report as "used".
    return "used";
  } catch {
    return "not_found";
  }
}

export function confirmFailureMessage(reason: ConsumeFailureReason): string {
  switch (reason) {
    case "expired":
      return "Esa confirmación ha caducado. Vuelve a pedírmelo y confírmalo de nuevo.";
    case "cancelled":
      return "Esa acción ya fue cancelada, así que no se ha ejecutado nada.";
    case "used":
      return "Esa acción ya se confirmó antes, así que no se ha vuelto a ejecutar.";
    case "not_found":
    default:
      return "No he podido encontrar esa confirmación. Vuelve a pedírmelo, por favor.";
  }
}
