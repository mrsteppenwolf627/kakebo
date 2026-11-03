import { NextRequest } from "next/server";
import { apiErrors } from "@/lib/api";

/**
 * Mutaciones del escáner usan cookies de sesión. Rechaza peticiones cross-origin
 * antes de ejecutar una escritura; los GET no pasan por esta comprobación.
 * En previews se acepta el origen real de la petición y, si existe, el dominio
 * configurado de la aplicación también puede firmar la petición.
 */
export function assertScannerSameOrigin(request: NextRequest): void {
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
    : null;

  if (origin) {
    if (origin !== requestOrigin && origin !== configuredOrigin) throw apiErrors.forbidden();
    return;
  }

  if (request.headers.get("sec-fetch-site") !== "same-origin") throw apiErrors.forbidden();
}
