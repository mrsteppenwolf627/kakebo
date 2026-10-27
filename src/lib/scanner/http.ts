import { z } from "zod";
import { apiErrors, type ApiError } from "@/lib/api/errors";
import type { PersistenceErrorCode, PersistenceFailure } from "./persistence";
import { SCANNER_ALLOWED_MIME, SCANNER_MAX_UPLOAD_BYTES } from "./storage-adapter";

export const scannerStartTicketSchema = z.strictObject({
  source: z.enum(["camera", "image", "pdf"]),
  locale: z.enum(["es", "en"]),
  declaredMime: z.enum(SCANNER_ALLOWED_MIME),
  declaredSizeBytes: z.number().int().nonnegative().max(SCANNER_MAX_UPLOAD_BYTES),
}).superRefine((value, ctx) => {
  if (value.source === "pdf") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["source"], message: "PDF no está habilitado para el bucket actual." });
  }
});

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireIdempotencyKey(value: string | null): string {
  if (!value || !UUID_V4.test(value)) throw apiErrors.validation("Idempotency-Key inválida.");
  return value;
}

export function scannerPersistenceError(code: PersistenceErrorCode): ApiError {
  switch (code) {
    case "NO_OPEN_CYCLE": return apiErrors.conflict("No hay un ciclo abierto disponible.");
    case "QUOTA_EXCEEDED": return apiErrors.conflict("Has alcanzado el límite de tickets del ciclo.");
    case "CYCLE_CLOSED": return apiErrors.conflict("El ciclo ya está cerrado.");
    case "TICKET_NOT_FOUND": return apiErrors.notFound("Ticket");
    case "TICKET_EXPIRED": return apiErrors.conflict("El ticket ha caducado.");
    case "ILLEGAL_TRANSITION": return apiErrors.conflict("El ticket no admite esta operación.");
    case "VERSION_CONFLICT": return apiErrors.conflict("El borrador ha cambiado.");
    case "IDEMPOTENCY_KEY_REUSED": return apiErrors.validation("La clave de idempotencia ya se usó con otra operación.");
    case "INVALID_KEY": return apiErrors.validation("Clave de idempotencia inválida.");
    case "UNAUTHENTICATED": return apiErrors.unauthorized();
    default: return apiErrors.accessUnavailable();
  }
}

export function throwOnPersistenceFailure(result: PersistenceFailure): never {
  throw scannerPersistenceError(result.code);
}

export function noStore<T extends Response>(response: T): T {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export function isAllowedScannerMime(value: string): boolean {
  return (SCANNER_ALLOWED_MIME as readonly string[]).includes(value);
}
