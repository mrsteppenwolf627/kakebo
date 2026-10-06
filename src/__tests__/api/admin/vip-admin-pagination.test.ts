// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ADMIN = "admin@example.com";

type U = { id: string; email: string };
const users: U[] = Array.from({ length: 430 }, (_, i) => ({ id: `id-${i}`, email: `user${i}@example.com` }));

const listUsers = vi.fn(async (params?: { page?: number; perPage?: number }) => {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 50;
  return { data: { users: users.slice((page - 1) * perPage, page * perPage) }, error: null as null | { message: string } };
});

const updateEq = vi.fn(async () => ({ error: null }));
const update = vi.fn(() => ({ eq: updateEq }));
let vipProfiles: Array<{ id: string; tier: string; manual_override: boolean; created_at: string }> = [];
const order = vi.fn(async () => ({ data: vipProfiles, error: null }));
const selectEq = vi.fn(() => ({ order }));
const select = vi.fn(() => ({ eq: selectEq }));
const from = vi.fn(() => ({ update, select }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ auth: { admin: { listUsers } }, from }),
}));

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

import { POST as grantVip } from "@/app/api/admin/grant-vip/route";
import { GET as listVipUsers } from "@/app/api/admin/list-vip-users/route";

const post = (body: unknown) =>
  new Request("http://localhost/api/admin/grant-vip", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_ADMIN_EMAILS", ADMIN);
  getUser.mockResolvedValue({ data: { user: { id: "admin", email: ADMIN } } });
  listUsers.mockClear();
  update.mockClear();
  updateEq.mockClear();
  from.mockClear();
  vipProfiles = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/admin/grant-vip — usuarios más allá de la primera página", () => {
  it("concede VIP a un usuario situado en la posición 431 (la primera página solo tiene 50)", async () => {
    const res = await grantVip(post({ email: "user429@example.com", grant: true }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);

    // Se actualizó exactamente el perfil de ESE usuario, con el cliente de servicio.
    expect(from).toHaveBeenCalledWith("profiles");
    expect(update).toHaveBeenCalledWith({ manual_override: true });
    expect(updateEq).toHaveBeenCalledWith("id", "id-429");
    // Y se paginó (más de una llamada a listUsers).
    expect(listUsers.mock.calls.length).toBeGreaterThan(1);
  });

  it("revoca VIP con grant=false", async () => {
    const res = await grantVip(post({ email: "user300@example.com", grant: false }));
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ manual_override: false });
    expect(updateEq).toHaveBeenCalledWith("id", "id-300");
  });

  it("usuario inexistente => 404 y no se actualiza ningún perfil", async () => {
    const res = await grantVip(post({ email: "nadie@example.com", grant: true }));
    expect(res.status).toBe(404);
    expect(update).not.toHaveBeenCalled();
  });

  it("error al listar usuarios => 500 genérico, sin actualizar", async () => {
    listUsers.mockResolvedValueOnce({ data: { users: [] }, error: { message: "db down" } });
    const res = await grantVip(post({ email: "user1@example.com", grant: true }));
    expect(res.status).toBe(500);
    expect(update).not.toHaveBeenCalled();
    expect(JSON.stringify(await res.json())).not.toContain("db down");
  });

  it("conserva los controles de acceso: sin sesión 401, no admin 403, sin email 400", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });
    expect((await grantVip(post({ email: "user1@example.com", grant: true }))).status).toBe(401);

    getUser.mockResolvedValueOnce({ data: { user: { id: "x", email: "intruso@example.com" } } });
    expect((await grantVip(post({ email: "user1@example.com", grant: true }))).status).toBe(403);

    expect((await grantVip(post({ grant: true }))).status).toBe(400);
    expect(update).not.toHaveBeenCalled();
    expect(listUsers).not.toHaveBeenCalled();
  });
});

describe("GET /api/admin/list-vip-users — emails de usuarios más allá de la primera página", () => {
  it("resuelve el email de un VIP situado después de los primeros 50 usuarios", async () => {
    vipProfiles = [
      { id: "id-10", tier: "free", manual_override: true, created_at: "2026-01-01" },
      { id: "id-420", tier: "free", manual_override: true, created_at: "2026-01-02" },
      { id: "id-ghost", tier: "free", manual_override: true, created_at: "2026-01-03" },
    ];
    const res = await listVipUsers();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.users.map((u: { email: string }) => u.email)).toEqual(["user10@example.com", "user420@example.com", "Unknown"]);
    expect(listUsers.mock.calls.length).toBeGreaterThan(1);
  });

  it("exige admin autenticado", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });
    expect((await listVipUsers()).status).toBe(401);
    getUser.mockResolvedValueOnce({ data: { user: { id: "x", email: "intruso@example.com" } } });
    expect((await listVipUsers()).status).toBe(403);
  });
});
