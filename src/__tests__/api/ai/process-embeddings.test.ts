import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Fase 2.A: /api/ai/process-embeddings debe exigir siempre
 * INTERNAL_API_SECRET. Si el secreto no está configurado, la ruta debe
 * fallar de forma segura (no crear el cliente service-role, no procesar
 * gastos). Si el secreto es incorrecto, debe rechazar. El flujo con el
 * secreto correcto debe seguir funcionando igual que antes.
 *
 * Cierre de Fase 2 (corrección de estabilidad de la suite, 2026-09-15):
 * estos 5 tests son deterministas y no dejan ningún trabajo asíncrono
 * pendiente — todas las dependencias externas están mockeadas
 * (`@/lib/ai/auto-embeddings`, `@supabase/supabase-js`, `@/lib/logger`) y
 * cada test resuelve en un solo tick. Ejecutados en aislamiento pasan
 * 5/5 de forma repetible en ~175ms. Sin embargo, al ejecutar la suite
 * COMPLETA (varios cientos de archivos en paralelo, cada uno con su
 * propio entorno jsdom) superaban de forma intermitente el timeout por
 * defecto de Vitest (5000ms) por contención de CPU/IO del runner — nunca
 * por una promesa sin resolver de este archivo ni por un bug de
 * producción. Se sube el timeout SOLO para estos 5 tests (nunca el
 * timeout global de Vitest, sin tocar `vitest.config.ts`) como margen de
 * seguridad frente a esa contención.
 */
const STABILITY_TIMEOUT_MS = 15000;

const generatePendingEmbeddingsMock = vi.fn();
vi.mock("@/lib/ai/auto-embeddings", () => ({
  generatePendingEmbeddings: (...args: unknown[]) =>
    generatePendingEmbeddingsMock(...args),
}));

const createServiceClientMock = vi.fn(() => ({ __serviceClient: true }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createServiceClientMock(...args),
}));

vi.mock("@/lib/logger", () => ({
  logApiRequest: vi.fn(),
  logApiResponse: vi.fn(),
  logApiError: vi.fn(),
  apiLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe("POST /api/ai/process-embeddings — secreto interno (Fase 2.A)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects the request and never creates the service-role client when INTERNAL_API_SECRET is not configured", async () => {
    vi.stubEnv("INTERNAL_API_SECRET", "");

    const { POST } = await import("@/app/api/ai/process-embeddings/route");
    const request = new NextRequest(
      "http://localhost/api/ai/process-embeddings?secret=anything"
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(createServiceClientMock).not.toHaveBeenCalled();
    expect(generatePendingEmbeddingsMock).not.toHaveBeenCalled();
  }, STABILITY_TIMEOUT_MS);

  it("rejects the request when the provided secret is incorrect", async () => {
    vi.stubEnv("INTERNAL_API_SECRET", "correct-secret");

    const { POST } = await import("@/app/api/ai/process-embeddings/route");
    const request = new NextRequest(
      "http://localhost/api/ai/process-embeddings?secret=wrong-secret"
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(createServiceClientMock).not.toHaveBeenCalled();
    expect(generatePendingEmbeddingsMock).not.toHaveBeenCalled();
  }, STABILITY_TIMEOUT_MS);

  it("preserves the existing flow when the correct secret is configured and provided", async () => {
    vi.stubEnv("INTERNAL_API_SECRET", "correct-secret");
    generatePendingEmbeddingsMock.mockResolvedValue({ processed: 3, remaining: 0 });

    const { POST } = await import("@/app/api/ai/process-embeddings/route");
    const request = new NextRequest(
      "http://localhost/api/ai/process-embeddings?secret=correct-secret"
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(createServiceClientMock).toHaveBeenCalledTimes(1);
    expect(generatePendingEmbeddingsMock).toHaveBeenCalledTimes(1);
  }, STABILITY_TIMEOUT_MS);
});

describe("GET /api/ai/process-embeddings — secreto interno (Fase 2.A)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects the status request and never creates the service-role client when INTERNAL_API_SECRET is not configured", async () => {
    vi.stubEnv("INTERNAL_API_SECRET", "");

    const { GET } = await import("@/app/api/ai/process-embeddings/route");
    const request = new NextRequest("http://localhost/api/ai/process-embeddings");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(createServiceClientMock).not.toHaveBeenCalled();
  }, STABILITY_TIMEOUT_MS);

  it("rejects the status request when the provided secret is incorrect", async () => {
    vi.stubEnv("INTERNAL_API_SECRET", "correct-secret");

    const { GET } = await import("@/app/api/ai/process-embeddings/route");
    const request = new NextRequest(
      "http://localhost/api/ai/process-embeddings?secret=wrong"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(createServiceClientMock).not.toHaveBeenCalled();
  }, STABILITY_TIMEOUT_MS);
});
