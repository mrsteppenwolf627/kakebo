import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * Fase 2.G: consentimiento explícito, informado y revocable para
 * aprendizaje colectivo — tabla `user_settings`, columna
 * `allow_collective_learning` (ver
 * supabase/migrations/20260914_add_allow_collective_learning_setting.sql).
 *
 * Por defecto FALSE (sin participación) tanto para usuarios nuevos como
 * existentes: si no hay fila de settings todavía, si la columna es
 * NULL/undefined (entorno donde la migración aún no se ha aplicado), o si
 * la lectura falla por cualquier motivo, se asume "sin consentimiento" —
 * fallar cerrado, nunca al revés. Esto es justo lo opuesto al valor por
 * defecto seguro usado en `user-write-confirmation.ts` (Fase 2.E, donde el
 * valor seguro por defecto es "pedir confirmación" = true): aquí el valor
 * seguro por defecto es "no participar" = false.
 *
 * Corrección de privacidad posterior: `learn-from-correction.ts` YA NO
 * llama a esta función — la contribución al voto global de
 * `merchant_rules` está desactivada por completo, sin excepción, incluso
 * con este ajuste en `true` (ver el comentario de cabecera de
 * `learn-from-correction.ts`). Motivo: `merchant_rules` no guarda
 * procedencia ni consentimiento verificable por fila histórica, así que no
 * hay forma de demostrar que una regla global proceda solo de usuarios
 * consintientes, y `merchant` no es un dato suficientemente minimizado
 * (texto derivado de lo que escribió el usuario).
 *
 * Este helper se conserva, sin usarse todavía en ningún flujo activo,
 * como infraestructura lista para una futura vía de aprendizaje colectivo
 * que sí registre procedencia y consentimiento por contribución (fuera de
 * alcance de esta tarea — requiere rediseñar el esquema). El ajuste
 * `user_settings.allow_collective_learning` que lee sigue existiendo y es
 * visible en Settings como preferencia preparada para esa futura mejora,
 * pero hoy activarlo no comparte ningún dato.
 */
export async function getCollectiveLearningConsent(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_settings")
      .select("allow_collective_learning")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      // Sin fila de settings todavía (usuario nuevo) -> sin consentimiento.
      return false;
    }

    if (data.allow_collective_learning === null || data.allow_collective_learning === undefined) {
      // Migración no aplicada en este entorno / columna aún no poblada.
      return false;
    }

    return data.allow_collective_learning === true;
  } catch (err) {
    apiLogger.warn(
      { err, userId },
      "Failed to read allow_collective_learning consent — defaulting to no participation"
    );
    return false;
  }
}
