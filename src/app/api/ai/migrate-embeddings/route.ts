import { responses, requireAuth, withLogging } from "@/lib/api";

/**
 * Embedding backfill is intentionally disabled. Semantic search now uses the
 * local, zero-cost search path and does not require external vectors.
 */
export const POST = withLogging(async () => {
  await requireAuth();
  return responses.ok({
    processed: 0,
    skipped: 0,
    remaining: 0,
    errors: [],
    disabled: true,
    message: "La búsqueda semántica externa está desactivada. La aplicación usa búsqueda local sin coste.",
  });
});
