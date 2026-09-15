import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ciclos libres (Fase 1): un "mes" en la tabla `months` representa un ciclo,
 * identificado por (user_id, year, month). El usuario puede cerrar su ciclo
 * cualquier día; el siguiente ciclo se abre de inmediato. La etiqueta
 * (year, month) de un ciclo es solo su nombre — no implica que todos los
 * gastos que contiene tengan fechas reales dentro de ese mes natural.
 */
export interface MonthRow {
  id: string;
  user_id: string;
  year: number;
  month: number;
  status: "open" | "closed";
  savings_done: boolean;
  created_at?: string;
  closed_at?: string | null;
}

/** Devuelve {year, month} inmediatamente posterior, con salto de año en diciembre. */
export function nextYm(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

/**
 * Obtiene o crea (idempotente) el ciclo (user_id, year, month).
 * Mismo comportamiento que POST /api/months.
 */
export async function getOrCreateMonth(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number
): Promise<{ row: MonthRow; created: boolean }> {
  const { data: existing, error: fetchError } = await supabase
    .from("months")
    .select("*")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("month", month)
    .single();

  if (existing) {
    return { row: existing as MonthRow, created: false };
  }

  if (fetchError && fetchError.code !== "PGRST116") {
    throw fetchError;
  }

  const { data: created, error: insertError } = await supabase
    .from("months")
    .insert({ user_id: userId, year, month, status: "open", savings_done: false })
    .select()
    .single();

  if (insertError) throw insertError;

  return { row: created as MonthRow, created: true };
}

/**
 * Devuelve el ciclo actualmente ABIERTO del usuario (el más reciente por
 * year/month), o null si no tiene ninguno todavía. Por invariante de
 * negocio, un usuario tiene como mucho un ciclo abierto a la vez.
 */
export async function getOpenMonth(
  supabase: SupabaseClient,
  userId: string
): Promise<MonthRow | null> {
  const { data, error } = await supabase
    .from("months")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "open")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(1);

  if (error) throw error;

  return (data?.[0] as MonthRow | undefined) ?? null;
}

/**
 * Busca un ciclo concreto del usuario por su etiqueta (year, month), sin
 * crearlo. A diferencia de `getOrCreateMonth`, esta lectura está pensada
 * para resolver un ciclo "specific" en herramientas de análisis/búsqueda
 * (Fase 2.C): la lectura de ciclos cerrados está permitida (solo la
 * escritura se bloquea en las rutas correspondientes). Devuelve null si no
 * existe ningún ciclo con esa etiqueta para ese usuario — el filtro por
 * `user_id` garantiza que nunca se resuelve (ni se filtra por) un ciclo de
 * otro usuario.
 */
export async function getMonthByYm(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number
): Promise<MonthRow | null> {
  const { data, error } = await supabase
    .from("months")
    .select("*")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("month", month)
    .limit(1);

  if (error) throw error;

  return (data?.[0] as MonthRow | undefined) ?? null;
}

/**
 * Hotfix 2.1: devuelve el ciclo INMEDIATAMENTE ANTERIOR a una etiqueta de
 * referencia (year, month), resuelto exclusivamente a partir de los ciclos
 * reales del usuario en `months` — nunca por fecha de calendario ni por la
 * fecha actual. "Anterior" se define como el ciclo con la mayor etiqueta
 * (year, month) que sea estrictamente menor que la referencia, comparando
 * ambos campos como un par ordenado (no por fecha real de los gastos que
 * contenga). Permite leer un ciclo cerrado. Devuelve null si el usuario no
 * tiene ningún ciclo anterior a esa referencia todavía.
 */
export async function getPreviousMonth(
  supabase: SupabaseClient,
  userId: string,
  referenceYear: number,
  referenceMonth: number
): Promise<MonthRow | null> {
  const { data, error } = await supabase
    .from("months")
    .select("*")
    .eq("user_id", userId)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(500);

  if (error) throw error;

  const rows = (data || []) as MonthRow[];
  const previous = rows.find(
    (row) =>
      row.year < referenceYear ||
      (row.year === referenceYear && row.month < referenceMonth)
  );

  return previous ?? null;
}

/**
 * Ciclos libres: al cerrar un ciclo, abre (o reutiliza) inmediatamente el
 * siguiente, para que el usuario pueda seguir registrando gastos con su
 * fecha real sin esperar al día 1 del mes natural siguiente.
 *
 * Idempotente y nunca reabre un ciclo ya cerrado: si el siguiente slot
 * natural ya existiera cerrado (caso excepcional), avanza hasta encontrar
 * uno abierto o inexistente.
 */
export async function ensureNextCycleOpen(
  supabase: SupabaseClient,
  userId: string,
  fromYear: number,
  fromMonth: number
): Promise<MonthRow> {
  let { year, month } = nextYm(fromYear, fromMonth);

  // Bucle acotado (5 años) como salvaguarda defensiva; en la práctica se
  // resuelve siempre en la primera iteración.
  for (let i = 0; i < 60; i++) {
    const { row } = await getOrCreateMonth(supabase, userId, year, month);
    if (row.status === "open") return row;
    ({ year, month } = nextYm(year, month));
  }

  const { row } = await getOrCreateMonth(supabase, userId, year, month);
  return row;
}
