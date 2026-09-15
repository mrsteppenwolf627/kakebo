import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * Fase 2.E: preferencia persistente por usuario — "Pedir confirmación antes
 * de que la IA cambie mis datos" (tabla `user_settings`, columna
 * `ai_confirm_writes`, ver supabase/migrations/20260914_add_ai_confirm_writes_setting.sql).
 *
 * Por defecto TRUE (confirmación requerida) tanto para usuarios nuevos como
 * existentes: si no hay fila de settings todavía, si la columna es
 * NULL/undefined (entorno donde la migración aún no se ha aplicado), o si
 * la lectura falla por cualquier motivo, se asume "seguro por defecto" y se
 * exige confirmación en vez de arriesgarse a ejecutar una escritura sin
 * pedirla.
 */
export async function getAiConfirmWritesPreference(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_settings")
      .select("ai_confirm_writes")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      // Sin fila de settings todavía (usuario nuevo) -> por defecto activado.
      return true;
    }

    if (data.ai_confirm_writes === null || data.ai_confirm_writes === undefined) {
      // Migración no aplicada en este entorno / columna aún no poblada.
      return true;
    }

    return data.ai_confirm_writes !== false;
  } catch (err) {
    apiLogger.warn(
      { err, userId },
      "Failed to read ai_confirm_writes preference — defaulting to confirmation required"
    );
    return true;
  }
}
