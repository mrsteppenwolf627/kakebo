import { NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { responses } from "@/lib/api";
import { apiLogger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { PrivateTicketBucket } from "@/lib/scanner/storage-adapter";
import { runScannerCleanup } from "@/lib/scanner/cleanup";

export const dynamic = "force-dynamic";

const MIN_SECRET_LENGTH = 16;

/** Comparación en tiempo constante (se comparan digests de longitud fija). */
function secretMatches(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Limpieza de tickets del escáner (caducados a 24 h y pendientes de ciclo cerrado).
 *
 * NO es pública: exige `Authorization: Bearer <CRON_SECRET>` (es exactamente lo que envía Vercel Cron). Falla
 * cerrado: sin `CRON_SECRET` configurado (o demasiado corto) responde 401 sin tocar la base de datos ni Storage.
 * El secreto solo se acepta por cabecera, nunca por query string (acabaría en logs). La respuesta contiene
 * únicamente recuentos. Idempotente: ejecutarla varias veces es inocuo.
 *
 * NO hay cron configurado en el repo (no existe vercel.json): ver docs/ticket-scanner/phase-7-persistence.md §5.
 */
async function handle(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected || expected.length < MIN_SECRET_LENGTH) {
    apiLogger.error("scanner cleanup refused: CRON_SECRET missing or too short");
    return responses.unauthorized();
  }
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!provided || !secretMatches(provided, expected)) {
    apiLogger.warn("scanner cleanup refused: invalid credentials");
    return responses.unauthorized();
  }

  try {
    const admin = createAdminClient();
    const result = await runScannerCleanup({ admin, storage: new PrivateTicketBucket(admin) });
    if ("error" in result) return responses.internalError();
    return responses.ok(result);
  } catch {
    // Sin detalles del error: puede incluir rutas o mensajes de la base de datos.
    apiLogger.error("scanner cleanup failed");
    return responses.internalError();
  }
}

// Vercel Cron invoca con GET; POST permite disparo manual con el mismo secreto.
export const GET = handle;
export const POST = handle;
