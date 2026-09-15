import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";
import { searchExpensesByText } from "@/lib/ai/embeddings";
import { rerankResults } from "./utils/result-reranker";
import { isValidSubcategory, getSubcategoryLabel, type SubcategoryId } from "@/lib/subcategories";
import { resolveCycleScope, type CycleScope } from "./utils/cycle-scope";

/**
 * Parameters for free-form expense search
 */
export interface SearchExpensesParams {
    query?: string; // Natural language query (e.g., "vicios", "restaurantes caros", "gimnasio"). Defaults to "último" if not provided.
    period?: "current_month" | "last_month" | "last_3_months" | "last_6_months" | "current_week" | "last_week" | "all";
    minAmount?: number; // Minimum amount filter
    maxAmount?: number; // Maximum amount filter
    limit?: number; // Max results (default 20, max 50)
    // Fase 2.B: filtro EXACTO (no semántico) por una o varias subcategorías
    // del catálogo (src/lib/subcategories.ts). Cuando se proporciona, tiene
    // prioridad sobre la búsqueda por texto/embeddings.
    subcategories?: string[];
    // Fase 2.C (+ Hotfix 2.1: añade "previous"): ámbito de ciclo real
    // (ciclos libres). Cuando se proporciona, prevalece sobre `period` — el
    // filtrado se hace por `month_id` real, nunca por rango de fechas de
    // calendario. Ver src/lib/agents/tools/utils/cycle-scope.ts para la
    // resolución.
    cycle_scope?: CycleScope;
    // Requerido cuando cycle_scope === "specific". Identificador inequívoco
    // del ciclo: etiqueta YYYY-MM tal como se guarda en `months` (year,
    // month). Compatible con el modelo actual de `months` sin necesidad de
    // exponer el UUID interno del ciclo al agente.
    cycle_ym?: string;
    // Fase 2.D: clasificación explícita, obligatoria por contrato, de la
    // intención de la búsqueda. "individual_lookup" (localizar un gasto
    // concreto) queda exento del requisito de cycle_scope; "analysis"
    // (totales, hábitos, comparativas, "cuánto he gastado"...) lo exige
    // siempre. Ver `src/lib/agents/tools/utils/search-scope-gate.ts` — el
    // orquestador (stream-caller.ts) evalúa este campo ANTES de invocar la
    // función; searchExpenses en sí no cambia de comportamiento según él.
    search_intent?: "individual_lookup" | "analysis";
}

/**
 * Result of expense search
 */
export interface SearchExpensesResult {
    query: string;
    period: string;
    totalAmount: number;
    count: number;
    expenses: Array<{
        id?: string; // Expense ID (for updateTransaction)
        concept: string;
        amount: number;
        date: string;
        category: string;
        subcategory?: string | null; // Fase 2.B (cuando esté disponible)
        similarity: number;  // Semantic similarity score (0-1)
        confidence?: number; // Multi-signal confidence score (0-1) — P2-2
    }>;
    insights: string[];
    /**
     * Fase 2.B: cobertura de subcategoría sobre el conjunto de gastos del
     * periodo/filtros consultados (no solo los que coinciden con el filtro).
     * Solo se calcula cuando se usa el filtro exacto por subcategoría —
     * su ausencia NO implica que todos los gastos estén clasificados; deja
     * explícito qué proporción de los datos tiene subcategoría asignada,
     * para que el agente no trate una búsqueda por subcategoría sobre
     * histórico sin clasificar como si fuera exhaustiva.
     */
    coverage?: {
        classified: number;
        unclassified: number;
    };
    /**
     * Fase 2.C: qué ámbito de ciclo se resolvió realmente (solo presente
     * cuando se usó `cycle_scope`), para que el agente pueda explicar con
     * precisión qué se consultó (p. ej. "ciclo abierto actual (2026-10)").
     */
    resolvedScope?: {
        scope: CycleScope;
        cycleYm?: string;
        status?: "open" | "closed";
        description: string;
    };
    /**
     * Fase 2.C: recuento/total ANTES de aplicar `limit`, para que los
     * agregados no dependan de cuántos elementos se devuelven en `expenses`.
     * `count` conserva su significado histórico (nº de elementos en
     * `expenses`, ya limitado) — no se reutiliza para el total real.
     */
    returnedCount?: number;
    totalCount?: number;
}

/**
 * Keyword mapping for common search categories
 * These keywords are matched case-insensitively in expense notes
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
    salud: [
        "medicamento", "medicina", "farmacia", "doctor", "médico", "medico",
        "psicólogo", "psicologo", "terapeuta", "terapia", "consulta", "clínica", "clinica",
        "hospital", "seguro", "mutua", "dentista", "análisis", "analisis",
        "insulina", "pastilla", "antibiótico", "antibiotico", "receta"
    ],
    restaurantes: [
        "restaurante", "cena", "comida", "almuerzo", "desayuno", "bar",
        "cafetería", "cafeteria", "café", "cafe", "pizzería", "pizzeria",
        "hamburguesería", "hamburgueseria", "tapas", "menú", "menu",
        "comida fuera", "comer fuera", "delivery", "domicilio"
    ],
    transporte: [
        "metro", "bus", "autobús", "autobus", "taxi", "uber", "cabify",
        "gasolina", "combustible", "parking", "aparcamiento", "peaje",
        "tren", "renfe", "ave", "cercanías", "cercanias", "bici", "patinete"
    ],
    ocio: [
        "cine", "teatro", "concierto", "museo", "parque", "entrada",
        "espectáculo", "espectaculo", "fiesta", "discoteca", "pub",
        "videojuego", "netflix", "spotify", "streaming", "suscripción", "suscripcion"
    ],
    vicios: [
        "tabaco", "cigarro", "cigarrillo", "vaper", "vape", "alcohol",
        "cerveza", "vino", "licor", "bebida", "apuesta", "lotería", "loteria"
    ],
    gimnasio: [
        "gimnasio", "gym", "fitness", "deporte", "entrenamiento", "piscina",
        "clase", "yoga", "pilates", "crossfit", "running", "natación", "natacion"
    ],
    supermercado: [
        "mercadona", "carrefour", "lidl", "aldi", "día", "dia", "alcampo",
        "eroski", "supermercado", "compra", "súper", "super"
    ],
};

/**
 * Detect if query matches a known category and return keywords
 */
function getCategoryKeywords(query: string): string[] | null {
    const queryLower = query.toLowerCase().trim();

    // Exact match
    if (CATEGORY_KEYWORDS[queryLower]) {
        return CATEGORY_KEYWORDS[queryLower];
    }

    // Partial match (e.g., "gasto en salud" → "salud")
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (queryLower.includes(category)) {
            return keywords;
        }
    }

    return null;
}

/**
 * Determine optimal similarity threshold based on query type
 */
/**
 * Expands query with semantic context to match human thinking.
 *
 * Examples:
 * - "comida" → "comida alimentación supermercado restaurante bocadillo compra alimentos groceries"
 * - "salud" → "salud medicina farmacia médico hospital dentista"
 *
 * This helps embeddings capture the FULL semantic spectrum of what a human means.
 */
function expandQueryWithContext(query: string): string {
    const queryLower = query.toLowerCase().trim();

    // FOOD: Broad concept including groceries, restaurants, snacks
    const foodKeywords = ["comida", "alimento", "alimentación", "comer"];
    if (foodKeywords.some(kw => queryLower.includes(kw))) {
        return `${query} alimentación supermercado mercado restaurante bocadillo comida compra alimentos groceries food meal`;
    }

    // HEALTH: Medical, pharmacy, doctor visits
    const healthKeywords = ["salud", "medicina", "medicamento"];
    if (healthKeywords.some(kw => queryLower.includes(kw))) {
        return `${query} medicina farmacia médico hospital dentista consulta tratamiento`;
    }

    // TRANSPORT: Gas, parking, public transit, rideshares
    const transportKeywords = ["transporte", "gasolina", "combustible"];
    if (transportKeywords.some(kw => queryLower.includes(kw))) {
        return `${query} gasolina uber taxi metro autobús parking aparcamiento combustible`;
    }

    // ENTERTAINMENT: Movies, games, subscriptions
    const entertainmentKeywords = ["ocio", "entretenimiento"];
    if (entertainmentKeywords.some(kw => queryLower.includes(kw))) {
        return `${query} cine netflix spotify juegos videojuegos suscripción streaming`;
    }

    // GYM/FITNESS: Gym memberships, classes, sports
    const fitnessKeywords = ["gimnasio", "deporte", "fitness"];
    if (fitnessKeywords.some(kw => queryLower.includes(kw))) {
        return `${query} gym entrenamiento clase deporte fitness ejercicio`;
    }

    // No expansion needed for specific brands or direct queries
    return query;
}

function getOptimalThreshold(query: string): number {
    const queryLower = query.toLowerCase().trim();

    // Specific brands/services (use strict threshold)
    const specificBrands = ["netflix", "spotify", "amazon", "youtube", "uber", "cabify"];
    if (specificBrands.some(brand => queryLower.includes(brand))) {
        return 0.6; // Strict
    }

    // EXPANDED FOOD QUERIES: Lower threshold since we're adding context
    const foodQueries = ["comida", "alimento", "supermercado", "mercado", "alimentación"];
    if (foodQueries.some(term => queryLower.includes(term))) {
        return 0.35; // Lower threshold because expanded query captures more semantic space
    }

    // Health queries can be stricter
    const healthQueries = ["medicamento", "medicina", "farmacia", "salud"];
    if (healthQueries.some(term => queryLower.includes(term))) {
        return 0.45; // Slightly lower with expanded query
    }

    // Category keywords (use permissive threshold)
    if (getCategoryKeywords(query)) {
        return 0.3; // Permissive for broad categories
    }

    // Default: balanced threshold
    return 0.4;
}

/**
 * Fase 2.C (corrección): consultas que, dentro de un ámbito de ciclo, deben
 * interpretarse como "todo el ciclo" en vez de como un filtro de texto real.
 * Incluye los mismos sinónimos de "último/reciente" ya usados en el fast
 * path (que es a lo que se normaliza `query` cuando el usuario no
 * proporciona ninguno) más frases que piden explícitamente el ciclo
 * completo.
 */
const GENERIC_CYCLE_QUERIES = new Set([
    "", "último", "ultimo", "last", "reciente", "recent",
    "más reciente", "mas reciente",
    "todos", "todo", "todos los gastos", "todo el ciclo",
    "gastos del ciclo", "gastos de este ciclo", "gastos de este mes",
    "ciclo completo", "todo el mes",
]);

function isGenericCycleQuery(query: string): boolean {
    return GENERIC_CYCLE_QUERIES.has((query || "").trim().toLowerCase());
}

/**
 * Resultado de `filterCycleExpensesByQuery`: los gastos del ámbito que
 * coinciden con la consulta, y si el paso semántico (si se usó) pudo haberse
 * quedado corto por una limitación técnica del backend de embeddings — en
 * ese caso `totalCount`/`totalAmount` calculados a partir de `expenses` NO
 * deben presentarse como exhaustivos.
 */
interface CycleQueryFilterResult<T> {
    expenses: T[];
    /** true si el paso semántico devolvió justo el tope enviado, señal de
     * que podría haber más coincidencias no evaluadas. */
    semanticCoverageMayBeIncomplete: boolean;
}

/**
 * Fase 2.C (corrección): `cycle_scope` es un ÁMBITO que se COMPONE con la
 * intención de búsqueda del usuario — nunca debe sustituir ni ignorar
 * `query`. Esta función aplica la misma estrategia (keywords deterministas
 * → coincidencia directa por texto → búsqueda semántica) que usa el resto
 * de la tool para consultas sin ámbito de ciclo, pero SIEMPRE restringida a
 * `cycleExpenses` (los gastos ya obtenidos del ciclo resuelto por
 * `month_id`). El resultado semántico se intersecta con esa lista — nunca
 * al revés — así que jamás puede devolver un gasto fuera del ciclo.
 *
 * Si la consulta es vacía o genérica (`isGenericCycleQuery`), se devuelve
 * el ciclo completo.
 *
 * Corrección de fiabilidad: el paso semántico ya NO usa un tope fijo de 200
 * (podía infracontar `totalCount`/`totalAmount` en ámbitos con más
 * coincidencias que ese tope). En su lugar, el límite enviado a la búsqueda
 * semántica es el tamaño real de `cycleExpenses` — nunca menor que el
 * número de gastos que hay que poder evaluar — sin leer nada adicional de
 * la base de datos (`cycleExpenses` ya estaba obtenido). Además, se acota
 * el rango de fechas del ámbito (`dateStart`/`dateEnd`, ya soportado por
 * `searchExpensesByText`/`embeddings.ts` sin modificarlo) para reducir el
 * riesgo de que gastos de otros ciclos desplacen a los del ámbito actual en
 * el ranking global de similitud.
 */
async function filterCycleExpensesByQuery<
    T extends { id: string; note: string | null; date: string }
>(
    supabase: SupabaseClient,
    userId: string,
    query: string,
    cycleExpenses: T[]
): Promise<CycleQueryFilterResult<T>> {
    if (isGenericCycleQuery(query)) {
        return { expenses: cycleExpenses, semanticCoverageMayBeIncomplete: false };
    }

    const trimmed = query.trim();
    const trimmedLower = trimmed.toLowerCase();

    // 1) Diccionario de keywords determinista (misma fuente que el resto de
    // la tool para consultas por concepto conocido, p. ej. "transporte").
    const categoryKeywords = getCategoryKeywords(trimmed);
    if (categoryKeywords && categoryKeywords.length > 0) {
        const expenses = cycleExpenses.filter((e) => {
            const noteLower = (e.note || "").toLowerCase();
            return categoryKeywords.some((kw) => noteLower.includes(kw.toLowerCase()));
        });
        return { expenses, semanticCoverageMayBeIncomplete: false };
    }

    // 2) Coincidencia directa por texto sobre el propio término de búsqueda
    // (marcas/conceptos concretos: "gasolina", "Netflix", "Mercadona"...).
    // Sobre un conjunto ya acotado al ciclo, es barata y de alta confianza.
    const directMatches = cycleExpenses.filter((e) =>
        (e.note || "").toLowerCase().includes(trimmedLower)
    );
    if (directMatches.length > 0) {
        return { expenses: directMatches, semanticCoverageMayBeIncomplete: false };
    }

    if (cycleExpenses.length === 0) {
        return { expenses: [], semanticCoverageMayBeIncomplete: false };
    }

    // 3) Búsqueda semántica (misma intención que el resto de la tool),
    // intersectada ESTRICTAMENTE con el ciclo: el resultado de embeddings
    // nunca se devuelve directamente, solo se usa para decidir qué
    // subconjunto de `cycleExpenses` coincide.
    const expandedQuery = expandQueryWithContext(trimmed);
    const threshold = getOptimalThreshold(trimmed);

    // El límite enviado cubre TODO el ámbito ya acotado (nunca un tope
    // técnico arbitrario) — no hace falta leer nada más, `cycleExpenses` ya
    // contiene el universo real de candidatos posibles.
    const semanticLimit = cycleExpenses.length;

    // Acota también por el rango de fechas reales del ámbito (filtro ya
    // soportado por `searchExpensesByText`), para reducir el riesgo de que
    // gastos de otros ciclos "desplacen" a los del ámbito actual en el
    // ranking global de similitud.
    const sortedDates = cycleExpenses.map((e) => e.date).sort();
    const dateStart = sortedDates[0];
    const dateEnd = sortedDates[sortedDates.length - 1];

    const semanticResults = await searchExpensesByText(supabase, userId, expandedQuery, {
        limit: semanticLimit,
        threshold,
        filters: { dateStart, dateEnd },
    });

    const semanticIds = new Set(semanticResults.results.map((r) => r.expense_id));
    const expenses = cycleExpenses.filter((e) => semanticIds.has(e.id));

    // Señal de cobertura incompleta: si el backend devolvió EXACTAMENTE el
    // tope solicitado, es posible que hubiera más candidatos por evaluar
    // (limitación técnica del backend de embeddings, no del ámbito en sí).
    const semanticCoverageMayBeIncomplete = semanticResults.results.length >= semanticLimit;

    return { expenses, semanticCoverageMayBeIncomplete };
}

/**
 * Get period dates for filtering
 */
function getPeriodDates(period: string): { start: string; end: string } | null {
    if (period === "all") return null;

    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
        case "current_month":
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = now;
            break;
        case "last_month":
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        case "last_3_months":
            start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            end = now;
            break;
        case "last_6_months":
            start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            end = now;
            break;
        case "current_week":
            const currentDay = now.getDay();
            const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
            start = new Date(now);
            start.setDate(now.getDate() - daysFromMonday);
            start.setHours(0, 0, 0, 0);
            end = now;
            break;
        case "last_week":
            const lastWeekEnd = new Date(now);
            const currentDayLW = now.getDay();
            const daysFromMondayLW = currentDayLW === 0 ? 6 : currentDayLW - 1;
            lastWeekEnd.setDate(now.getDate() - daysFromMondayLW - 1);
            lastWeekEnd.setHours(23, 59, 59, 999);

            start = new Date(lastWeekEnd);
            start.setDate(lastWeekEnd.getDate() - 6);
            start.setHours(0, 0, 0, 0);

            end = lastWeekEnd;
            break;
        default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = now;
    }

    // Format dates in local timezone (avoid UTC conversion issues)
    const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        start: formatLocalDate(start),
        end: formatLocalDate(end),
    };
}

/**
 * Search expenses using natural language
 * 
 * This tool uses semantic embeddings to understand ANY query:
 * - "vicios" → finds tobacco, alcohol, gambling
 * - "restaurantes caros" → finds restaurants >€30
 * - "gimnasio" → finds gym memberships, classes
 * 
 * It learns from ALL users' expense descriptions over time.
 */
export async function searchExpenses(
    supabase: SupabaseClient,
    userId: string,
    params: SearchExpensesParams
): Promise<SearchExpensesResult> {
    const period = params.period || "current_month";
    const limit = Math.min(params.limit || 20, 50);

    // ========== VALIDATION: query is required ==========
    if (!params.query || params.query.trim().length === 0) {
        // If no query provided, default to "last" (most recent expenses)
        params.query = "último";
        apiLogger.info(
            { userId, originalParams: params },
            "No query provided, defaulting to 'último' for last expenses"
        );
    }
    // ===================================================

    try {
        // ========== EXACT DETERMINISTIC PATH: cycle_scope and/or subcategories (Fase 2.B/2.C) ==========
        // Filtro determinista (no semántico): cuando se pide un ámbito de
        // ciclo real y/o subcategorías concretas, se consulta directamente
        // por esos campos exactos en la base de datos en vez de usar
        // keywords o embeddings. Tiene prioridad sobre el resto de la
        // búsqueda por texto y, si se usa `cycle_scope`, también sobre el
        // filtrado legado por `period` (fechas de calendario).
        const useCycleScope = params.cycle_scope !== undefined;
        const useSubcategoryFilter = !!(params.subcategories && params.subcategories.length > 0);

        if (useCycleScope || useSubcategoryFilter) {
            let validSubcategories: SubcategoryId[] = [];
            let invalidSubcategories: string[] = [];

            if (useSubcategoryFilter) {
                validSubcategories = params.subcategories!.filter(isValidSubcategory);
                invalidSubcategories = params.subcategories!.filter(
                    (s) => !isValidSubcategory(s)
                );

                if (validSubcategories.length === 0) {
                    throw new Error(
                        `Ninguna subcategoría válida en la petición: ${params.subcategories!.join(", ")}`
                    );
                }
            }

            // Ciclos libres (Fase 2.C): "current"/"specific"/"all_history"
            // se resuelven SIEMPRE vía el ciclo real (month_id), nunca por
            // fecha de calendario. Un ciclo inexistente o ajeno lanza un
            // error claro antes de tocar ningún dato.
            const resolvedScope = useCycleScope
                ? await resolveCycleScope(supabase, userId, params.cycle_scope!, params.cycle_ym)
                : undefined;

            let scopedQuery = supabase
                .from("expenses")
                .select("id,date,amount,note,category,subcategory")
                .eq("user_id", userId);

            if (resolvedScope) {
                // Nunca se aplican límites de fecha natural cuando hay un
                // ámbito de ciclo explícito. "all_history" (monthId null)
                // no filtra por ciclo ni por fecha.
                if (resolvedScope.monthId !== null) {
                    scopedQuery = scopedQuery.eq("month_id", resolvedScope.monthId);
                }
            } else {
                // Compatibilidad: sin cycle_scope, se mantiene el filtrado
                // legado por periodo de calendario (comportamiento de la
                // Fase 2.B sin cambios).
                const periodDates = getPeriodDates(period);
                if (periodDates) {
                    scopedQuery = scopedQuery.gte("date", periodDates.start).lte("date", periodDates.end);
                }
            }

            if (params.minAmount !== undefined) {
                scopedQuery = scopedQuery.gte("amount", params.minAmount);
            }
            if (params.maxAmount !== undefined) {
                scopedQuery = scopedQuery.lte("amount", params.maxAmount);
            }

            const { data: scopedExpenses, error: scopedError } = await scopedQuery;
            if (scopedError) throw scopedError;

            const allInScope = scopedExpenses || [];

            // Cobertura: sobre TODO el conjunto consultado (ciclo/periodo +
            // importe), no solo sobre los que coinciden con el filtro de
            // subcategoría — así se sabe cuántos gastos del ámbito son, en
            // principio, clasificables.
            const classified = allInScope.filter(
                (e) => e.subcategory !== null && e.subcategory !== undefined
            );
            const unclassifiedCount = allInScope.length - classified.length;

            // Fase 2.C (corrección): `cycle_scope` es un ÁMBITO que se
            // COMPONE con la intención de búsqueda — nunca debe borrar el
            // significado de `query`. Si hay subcategorías, se conserva el
            // comportamiento exacto de 2.B (la subcategoría manda). Si no,
            // y hay un ámbito de ciclo activo, se aplica la misma búsqueda
            // textual/semántica de siempre, pero restringida estrictamente
            // a los gastos ya obtenidos del ciclo — nunca se devuelve un
            // gasto ajeno a la consulta solo por pertenecer al ciclo.
            const cycleQueryIsGeneric = resolvedScope ? isGenericCycleQuery(params.query || "") : true;

            let semanticCoverageMayBeIncomplete = false;

            const matched = useSubcategoryFilter
                ? allInScope.filter(
                    (e) => e.subcategory && validSubcategories.includes(e.subcategory)
                )
                : resolvedScope
                    ? await (async () => {
                        const result = await filterCycleExpensesByQuery(
                            supabase,
                            userId,
                            params.query || "",
                            allInScope
                        );
                        semanticCoverageMayBeIncomplete = result.semanticCoverageMayBeIncomplete;
                        return result.expenses;
                    })()
                    : allInScope;

            // Fase 2.C: el recuento y el total SIEMPRE se calculan sobre
            // TODOS los coincidentes, antes de aplicar `limit` — nunca
            // dependen de cuántos elementos se devuelven en `expenses`.
            const totalCount = matched.length;
            const totalAmount = matched.reduce((sum, e) => sum + e.amount, 0);

            const categoryMap: Record<string, string> = {
                supervivencia: "Supervivencia",
                opcional: "Opcional",
                cultura: "Cultura",
                extra: "Extra",
            };

            const formattedExpenses = matched
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, limit)
                .map((e) => ({
                    id: e.id,
                    concept: e.note || "Sin concepto",
                    amount: e.amount,
                    date: e.date,
                    category: categoryMap[e.category] || e.category,
                    subcategory: e.subcategory,
                    similarity: 1.0, // Filtro exacto, no semántico
                }));

            const returnedCount = formattedExpenses.length;

            const insights: string[] = [];

            if (resolvedScope) {
                insights.push(`Ámbito consultado: ${resolvedScope.description}`);
            }
            if (useSubcategoryFilter) {
                insights.push(
                    `Filtro exacto por subcategoría: ${validSubcategories
                        .map((id) => getSubcategoryLabel(id))
                        .join(", ")}`
                );
            } else if (resolvedScope) {
                // Fase 2.C (corrección): deja explícito si se ha aplicado la
                // intención de búsqueda del usuario dentro del ciclo, o si
                // se ha devuelto el ciclo completo por ser una consulta
                // vacía/genérica — nunca debe leerse como "todo el ciclo"
                // cuando en realidad se filtró por texto.
                insights.push(
                    cycleQueryIsGeneric
                        ? `Consulta genérica: se muestran todos los gastos de ${resolvedScope.description}.`
                        : `Búsqueda "${params.query}" restringida a ${resolvedScope.description} (no se incluyen gastos del ciclo ajenos a esta búsqueda).`
                );

                if (semanticCoverageMayBeIncomplete) {
                    // Requisito de fiabilidad: si el backend de embeddings
                    // pudo haberse quedado corto, totalCount/totalAmount NO
                    // deben presentarse como exhaustivos sin avisar de ello.
                    insights.push(
                        "Aviso: la búsqueda semántica dentro del ciclo pudo no evaluar absolutamente todos los candidatos (límite técnico del backend de embeddings) — el total mostrado podría no ser exhaustivo."
                    );
                }
            }

            insights.push(`Encontrados: ${totalCount} gasto(s), total €${totalAmount.toFixed(2)}`);

            if (returnedCount < totalCount) {
                insights.push(
                    `Mostrando ${returnedCount} de ${totalCount} gasto(s) — el total y el recuento (totalCount/totalAmount) incluyen TODOS los coincidentes, no solo los mostrados en "expenses".`
                );
            }

            if (unclassifiedCount > 0) {
                // Transparencia obligatoria: esta búsqueda NUNCA debe
                // presentarse como exhaustiva cuando hay histórico sin
                // subcategoría — esos gastos no se incluyen ni se excluyen,
                // simplemente no se pueden evaluar por el filtro.
                insights.push(
                    `Aviso de cobertura: ${unclassifiedCount} de ${allInScope.length} gasto(s) del ámbito consultado no tienen subcategoría asignada${useSubcategoryFilter ? " y no se han podido evaluar con este filtro" : ""
                    } — esta búsqueda no es exhaustiva sobre datos históricos sin clasificar.`
                );
            }

            if (invalidSubcategories.length > 0) {
                insights.push(
                    `Ignoradas subcategorías no reconocidas: ${invalidSubcategories.join(", ")}`
                );
            }

            apiLogger.info(
                {
                    userId,
                    cycleScope: params.cycle_scope,
                    resolvedScope,
                    cycleQueryIsGeneric,
                    semanticCoverageMayBeIncomplete,
                    validSubcategories,
                    invalidSubcategories,
                    scopedCount: allInScope.length,
                    classifiedCount: classified.length,
                    unclassifiedCount,
                    totalCount,
                    returnedCount,
                },
                "searchExpenses: exact cycle/subcategory filter executed"
            );

            return {
                query: params.query || "",
                period,
                totalAmount: Math.round(totalAmount * 100) / 100,
                // `count` conserva su significado histórico: nº de elementos
                // en `expenses` (ya limitado), igual que en el resto de la
                // función. No se reutiliza para el total real.
                count: returnedCount,
                expenses: formattedExpenses,
                insights,
                coverage: {
                    classified: classified.length,
                    unclassified: unclassifiedCount,
                },
                resolvedScope: resolvedScope
                    ? {
                        scope: resolvedScope.scope,
                        cycleYm: resolvedScope.cycleYm,
                        status: resolvedScope.status,
                        description: resolvedScope.description,
                    }
                    : undefined,
                returnedCount,
                totalCount,
            };
        }
        // ====================================================================================

        // ========== FAST PATH: Simple queries without embeddings ==========
        // For queries like "último", "last", "recent", use direct SQL
        const queryLower = params.query.toLowerCase().trim();

        // Check for "last expense" type queries
        const isSimpleLastQuery =
            queryLower === "último" ||
            queryLower === "ultimo" ||
            queryLower === "last" ||
            queryLower === "reciente" ||
            queryLower === "recent" ||
            queryLower === "más reciente" ||
            queryLower === "mas reciente" ||
            // Include variations with "gasto", "expense", etc.
            queryLower.includes("último gasto") ||
            queryLower.includes("ultimo gasto") ||
            queryLower.includes("last expense") ||
            queryLower.includes("última compra") ||
            queryLower.includes("ultima compra") ||
            queryLower.includes("gasto reciente") ||
            queryLower.includes("compra reciente") ||
            queryLower.includes("recent expense");

        if (isSimpleLastQuery) {
            apiLogger.info({ query: params.query, period }, "Using fast path for 'last expense' query");

            // Get period dates
            const periodDates = getPeriodDates(period);

            // Build query
            let query = supabase
                .from("expenses")
                .select("id,date,amount,note,category")
                .eq("user_id", userId)
                .order("date", { ascending: false })
                .order("created_at", { ascending: false })
                .limit(limit);

            // Apply period filter if specified
            if (periodDates) {
                query = query
                    .gte("date", periodDates.start)
                    .lte("date", periodDates.end);
            }

            // Apply amount filters
            if (params.minAmount !== undefined) {
                query = query.gte("amount", params.minAmount);
            }
            if (params.maxAmount !== undefined) {
                query = query.lte("amount", params.maxAmount);
            }

            const { data: expenses, error } = await query;

            apiLogger.info(
                {
                    userId,
                    query: params.query,
                    period,
                    resultsCount: expenses?.length ?? 0,
                },
                "searchExpenses fast path executed"
            );

            if (error) {
                throw error;
            }

            if (!expenses || expenses.length === 0) {
                return {
                    query: params.query,
                    period,
                    totalAmount: 0,
                    count: 0,
                    expenses: [],
                    insights: [`No encontré gastos en el período "${period}"`],
                };
            }

            // Calculate total
            const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

            // Map category names
            const categoryMap: Record<string, string> = {
                supervivencia: "Supervivencia",
                opcional: "Opcional",
                cultura: "Cultura",
                extra: "Extra",
            };

            // Format results
            const formattedExpenses = expenses.map(exp => ({
                id: exp.id, // ← IMPORTANT: Include ID for updateTransaction
                concept: exp.note || "Sin concepto",
                amount: exp.amount,
                date: exp.date,
                category: categoryMap[exp.category] || exp.category,
                similarity: 1.0, // Perfect match for direct query
            }));

            // Generate insights with explicit ID mention for first expense
            const insights = [`Encontré ${formattedExpenses.length} gasto(s) reciente(s)`];

            if (formattedExpenses.length > 0 && formattedExpenses[0].id) {
                const first = formattedExpenses[0];
                insights.push(
                    `Más reciente: "${first.concept}" (${first.amount}€) el ${first.date}`,
                    `ID de este gasto: ${first.id}` // ← EXPLICIT ID for LLM
                );
            }

            insights.push(`Total: €${totalAmount.toFixed(2)}`);

            return {
                query: params.query,
                period,
                totalAmount: Math.round(totalAmount * 100) / 100,
                count: formattedExpenses.length,
                expenses: formattedExpenses,
                insights,
            };
        }
        // ================================================================

        apiLogger.info({ query: params.query, period }, "Searching expenses with embeddings");

        // ========== SEARCH IN FIXED EXPENSES (text matching) ==========
        // Fixed expenses don't have embeddings, so use simple text search
        const { data: fixedExpenses, error: fixedError } = await supabase
            .from("fixed_expenses")
            .select("id, name, amount, expense_date, is_active")
            .eq("user_id", userId)
            .eq("is_active", true)
            .ilike("name", `%${params.query}%`); // Case-insensitive pattern match

        if (fixedError) {
            apiLogger.warn({ error: fixedError }, "Error searching fixed expenses");
        }

        apiLogger.info({
            query: params.query,
            fixedExpensesFound: fixedExpenses?.length ?? 0,
        }, "Fixed expenses search completed");

        // ========== KEYWORD MATCHING FOR COMMON CATEGORIES ==========
        const categoryKeywords = getCategoryKeywords(params.query);
        let keywordResults: Array<{
            expense_id: string;
            note: string;
            amount: number;
            date: string;
            category: string;
            similarity: number;
        }> = [];

        if (categoryKeywords && categoryKeywords.length > 0) {
            apiLogger.info({
                query: params.query,
                keywordCount: categoryKeywords.length,
            }, "Using keyword matching for known category");

            // Build OR condition for keyword matching
            const keywordPattern = categoryKeywords.map(k => `%${k}%`).join("|");

            // Query expenses matching any keyword
            const { data: keywordExpenses } = await supabase
                .from("expenses")
                .select("id, note, amount, date, category")
                .eq("user_id", userId);

            // Filter by keyword matching (case-insensitive)
            if (keywordExpenses) {
                keywordResults = keywordExpenses
                    .filter(exp => {
                        const noteLower = (exp.note || "").toLowerCase();
                        return categoryKeywords.some(keyword =>
                            noteLower.includes(keyword.toLowerCase())
                        );
                    })
                    .map(exp => ({
                        expense_id: exp.id,
                        note: exp.note || "Sin concepto",
                        amount: exp.amount,
                        date: exp.date,
                        category: exp.category,
                        similarity: 0.95, // High similarity for keyword matches
                    }));

                apiLogger.info({
                    query: params.query,
                    keywordMatches: keywordResults.length,
                }, "Keyword matching completed");
            }
        }

        // ========== SEMANTIC SEARCH WITH DYNAMIC THRESHOLD + STRUCTURED FILTERS ==========
        // Skip semantic search if we're using keywords (to avoid false positives)
        let results: Awaited<ReturnType<typeof searchExpensesByText>>['results'] = [];

        if (!categoryKeywords || categoryKeywords.length === 0) {
            // Only use semantic search for non-category queries

            // 🎯 EXPAND QUERY WITH SEMANTIC CONTEXT (human-like thinking)
            const expandedQuery = expandQueryWithContext(params.query);
            const optimalThreshold = getOptimalThreshold(params.query);
            const periodDates = getPeriodDates(period);

            apiLogger.info({
                originalQuery: params.query,
                expandedQuery,
                threshold: optimalThreshold,
                periodDates,
                amountFilters: {
                    min: params.minAmount,
                    max: params.maxAmount,
                },
            }, "Using semantic search with structured filters + query expansion");

            const searchResults = await searchExpensesByText(
                supabase,
                userId,
                expandedQuery, // ← Use expanded query instead of original
                {
                    limit: 100, // Get more results for filtering
                    threshold: optimalThreshold, // Dynamic threshold based on query type
                    filters: {
                        dateStart: periodDates?.start,
                        dateEnd: periodDates?.end,
                        amountMin: params.minAmount,
                        amountMax: params.maxAmount,
                    },
                }
            );
            results = searchResults.results;
        } else {
            apiLogger.info({
                query: params.query,
                keywordCount: categoryKeywords.length,
            }, "Skipping semantic search (using keyword matching only for known category)");
        }

        // Check if we have any results at all (keywords + semantic + fixed)
        const hasResults =
            keywordResults.length > 0 ||
            results.length > 0 ||
            (fixedExpenses && fixedExpenses.length > 0);

        if (!hasResults) {
            return {
                query: params.query,
                period,
                totalAmount: 0,
                count: 0,
                expenses: [],
                insights: [`No encontré gastos relacionados con "${params.query}"`],
            };
        }

        // NOTE: Period and amount filters are now applied in the database (P2-1)
        // Results from searchExpensesByText already have filters applied
        // Keep filteredResults as-is (no post-filtering needed)
        let filteredResults = results;

        // Get period dates for filtering keyword results and fixed expenses
        // (semantic search results already filtered in DB)
        const periodDates = getPeriodDates(period);

        // ========== APPLY USER FEEDBACK LEARNING ==========
        // Get user's previous corrections for this query
        const { getHybridFeedback, applyFeedbackFilter } = await import("./feedback");
        const feedback = await getHybridFeedback(supabase, userId, params.query);

        // Filter results based on user feedback
        filteredResults = applyFeedbackFilter(filteredResults, feedback);

        apiLogger.info({
            query: params.query,
            originalCount: results.length,
            afterFeedback: filteredResults.length,
            excludedCount: feedback.incorrectExpenseIds.size,
        }, "Applied hybrid feedback (personal + global) to search results");

        // ========== MERGE ALL RESULTS (KEYWORDS + EMBEDDINGS + FIXED) ==========
        // Apply period filter to keyword results
        let filteredKeywordResults = keywordResults;
        if (periodDates) {
            filteredKeywordResults = keywordResults.filter(exp =>
                exp.date >= periodDates.start && exp.date <= periodDates.end
            );
        }

        // Convert fixed expenses to same format as manual expenses
        const fixedExpensesFormatted = (fixedExpenses || [])
            .filter(fe => {
                // Apply period filter
                if (!periodDates) return true;
                const expenseDate = fe.expense_date || new Date().toISOString().split("T")[0];
                return expenseDate >= periodDates.start && expenseDate <= periodDates.end;
            })
            .map(fe => ({
                expense_id: `fixed-${fe.id}`, // Prefix to distinguish from manual expenses
                note: `${fe.name} (Gasto fijo)`, // Mark as fixed expense
                amount: fe.amount,
                date: fe.expense_date || new Date().toISOString().split("T")[0],
                category: "extra", // Fixed expenses don't have category, default to "extra"
                similarity: 1.0, // Perfect match for text search
            }));

        // Merge all sources: keyword matches + semantic search + fixed expenses
        // Remove duplicates (prefer keyword matches over semantic)
        const seenIds = new Set<string>();
        const combinedResults: typeof filteredResults = [];

        // 1. Add keyword matches first (highest priority)
        for (const result of filteredKeywordResults) {
            if (!seenIds.has(result.expense_id)) {
                combinedResults.push(result);
                seenIds.add(result.expense_id);
            }
        }

        // 2. Add semantic search results (medium priority)
        for (const result of filteredResults) {
            if (!seenIds.has(result.expense_id)) {
                combinedResults.push(result);
                seenIds.add(result.expense_id);
            }
        }

        // 3. Add fixed expenses (low priority, but still included)
        for (const result of fixedExpensesFormatted) {
            if (!seenIds.has(result.expense_id)) {
                combinedResults.push(result);
                seenIds.add(result.expense_id);
            }
        }

        apiLogger.info({
            query: params.query,
            keywordMatches: filteredKeywordResults.length,
            semanticMatches: filteredResults.length,
            fixedMatches: fixedExpensesFormatted.length,
            totalCombined: combinedResults.length,
        }, "Merged all search results");

        // Re-rank with multi-signal confidence scoring (P2-2)
        // crossCategory: true → all categories rank equally (no penalty for non-primary categories)
        // This ensures concept searches ("comida", "vicios") return results from all categories
        const rerankedResults = rerankResults(combinedResults, params.query, { crossCategory: true });
        const topResults = rerankedResults.slice(0, limit);

        // Calculate metrics
        const totalAmount = topResults.reduce((sum, exp) => sum + exp.amount, 0);

        // Map category names to Spanish
        const categoryMap: Record<string, string> = {
            supervivencia: "Supervivencia",
            opcional: "Opcional",
            cultura: "Cultura",
            extra: "Extra",
        };

        // Format expenses
        const expenses = topResults.map(exp => ({
            id: exp.expense_id, // ← IMPORTANT: Include ID for updateTransaction
            concept: exp.note,
            amount: exp.amount,
            date: exp.date,
            category: categoryMap[exp.category] || exp.category,
            similarity: Math.round(exp.similarity * 100) / 100,
            confidence: Math.round(exp.confidence * 100) / 100, // P2-2 multi-signal score
        }));

        // Generate insights
        const insights: string[] = [];

        if (filteredResults.length > limit) {
            insights.push(`Mostrando los ${limit} resultados más relevantes de ${filteredResults.length} gastos encontrados`);
        }

        // Category breakdown
        const byCategory = topResults.reduce((acc, exp) => {
            const cat = categoryMap[exp.category] || exp.category;
            acc[cat] = (acc[cat] || 0) + exp.amount;
            return acc;
        }, {} as Record<string, number>);

        const categories = Object.entries(byCategory)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, amount]) => `${cat}: €${amount.toFixed(2)}`)
            .join(", ");

        if (Object.keys(byCategory).length > 1) {
            insights.push(`Distribuido en: ${categories}`);
        }

        // Average expense
        const avgAmount = totalAmount / topResults.length;
        insights.push(`Gasto promedio: €${avgAmount.toFixed(2)}`);

        // Highest expense
        const highest = topResults[0];
        if (highest && topResults.length > 1) {
            insights.push(`Gasto más alto: ${highest.note} (€${highest.amount})`);
        }

        return {
            query: params.query,
            period,
            totalAmount: Math.round(totalAmount * 100) / 100,
            count: topResults.length,
            expenses,
            insights,
        };
    } catch (error) {
        apiLogger.error({ error, params }, "Error searching expenses");
        throw error;
    }
}
