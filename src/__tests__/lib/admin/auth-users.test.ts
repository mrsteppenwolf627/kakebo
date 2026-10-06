// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import {
  AUTH_USERS_PER_PAGE,
  AUTH_USERS_MAX_PAGES,
  AuthUsersListError,
  findAuthUserByEmail,
  listAllAuthUsers,
  type AdminUsersClient,
} from "@/lib/admin/auth-users";

type U = { id: string; email: string | null };

/**
 * Simula auth.admin.listUsers() respetando page/perPage. Sin parámetros devuelve solo la PRIMERA
 * página de 50, como hace Supabase (el bug original de grant-vip).
 */
function fakeClient(users: U[]) {
  const listUsers = vi.fn(async (params?: { page?: number; perPage?: number }) => {
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 50;
    const slice = users.slice((page - 1) * perPage, page * perPage);
    return { data: { users: slice }, error: null };
  });
  return { client: { auth: { admin: { listUsers } } } as AdminUsersClient<U>, listUsers };
}

const makeUsers = (n: number): U[] => Array.from({ length: n }, (_, i) => ({ id: `id-${i}`, email: `user${i}@example.com` }));

describe("listAllAuthUsers", () => {
  it("devuelve más de una página (el bug original solo devolvía los primeros 50)", async () => {
    const { client } = fakeClient(makeUsers(530));
    const all = await listAllAuthUsers(client);
    expect(all).toHaveLength(530);
    expect(all.at(-1)?.email).toBe("user529@example.com");
  });

  it("pide páginas sucesivas con perPage fijo y se detiene en la primera incompleta", async () => {
    const { client, listUsers } = fakeClient(makeUsers(AUTH_USERS_PER_PAGE * 2 + 5));
    await listAllAuthUsers(client);
    expect(listUsers.mock.calls.map((c) => c[0])).toEqual([
      { page: 1, perPage: AUTH_USERS_PER_PAGE },
      { page: 2, perPage: AUTH_USERS_PER_PAGE },
      { page: 3, perPage: AUTH_USERS_PER_PAGE },
    ]);
  });

  it("con exactamente una página completa pide una segunda (vacía) para confirmar el final", async () => {
    const { client, listUsers } = fakeClient(makeUsers(AUTH_USERS_PER_PAGE));
    const all = await listAllAuthUsers(client);
    expect(all).toHaveLength(AUTH_USERS_PER_PAGE);
    expect(listUsers).toHaveBeenCalledTimes(2);
  });

  it("no duplica usuarios cuando las páginas se solapan", async () => {
    const base = makeUsers(AUTH_USERS_PER_PAGE + 10);
    const pages = [base.slice(0, AUTH_USERS_PER_PAGE), [...base.slice(AUTH_USERS_PER_PAGE - 5, AUTH_USERS_PER_PAGE), ...base.slice(AUTH_USERS_PER_PAGE)]];
    let call = 0;
    const client = {
      auth: { admin: { listUsers: vi.fn(async () => ({ data: { users: pages[call++] ?? [] }, error: null })) } },
    } as AdminUsersClient<U>;
    const all = await listAllAuthUsers(client);
    expect(all).toHaveLength(base.length);
    expect(new Set(all.map((u) => u.id)).size).toBe(all.length);
  });

  it("sin usuarios devuelve una lista vacía", async () => {
    const { client } = fakeClient([]);
    expect(await listAllAuthUsers(client)).toEqual([]);
  });

  it("propaga el error de Supabase como AuthUsersListError", async () => {
    const client = {
      auth: { admin: { listUsers: vi.fn(async () => ({ data: { users: [] }, error: { message: "boom" } })) } },
    } as unknown as AdminUsersClient<U>;
    await expect(listAllAuthUsers(client)).rejects.toBeInstanceOf(AuthUsersListError);
  });

  it("tiene un tope de páginas ante una respuesta anómala que nunca termina", async () => {
    const full = makeUsers(AUTH_USERS_PER_PAGE);
    const listUsers = vi.fn(async (params?: { page?: number }) => ({
      // Cada página devuelve usuarios nuevos y completos: nunca llega la última página.
      data: { users: full.map((u) => ({ ...u, id: `${u.id}-p${params?.page}` })) },
      error: null,
    }));
    const client = { auth: { admin: { listUsers } } } as unknown as AdminUsersClient<U>;
    await listAllAuthUsers(client);
    expect(listUsers).toHaveBeenCalledTimes(AUTH_USERS_MAX_PAGES);
  });
});

describe("findAuthUserByEmail", () => {
  it("encuentra un usuario situado DESPUÉS de la primera página (y de las primeras 50 posiciones)", async () => {
    const { client } = fakeClient(makeUsers(450));
    const user = await findAuthUserByEmail(client, "user430@example.com");
    expect(user?.id).toBe("id-430");
  });

  it("ignora mayúsculas y espacios", async () => {
    const { client } = fakeClient(makeUsers(10));
    expect((await findAuthUserByEmail(client, "  USER3@Example.COM "))?.id).toBe("id-3");
  });

  it("devuelve null si no existe y no inventa coincidencias parciales", async () => {
    const { client } = fakeClient(makeUsers(300));
    expect(await findAuthUserByEmail(client, "user3@example")).toBeNull();
    expect(await findAuthUserByEmail(client, "nadie@example.com")).toBeNull();
    expect(await findAuthUserByEmail(client, "   ")).toBeNull();
  });

  it("se detiene en cuanto lo encuentra (no recorre páginas innecesarias)", async () => {
    const { client, listUsers } = fakeClient(makeUsers(AUTH_USERS_PER_PAGE * 5));
    await findAuthUserByEmail(client, "user3@example.com");
    expect(listUsers).toHaveBeenCalledTimes(1);
  });

  it("propaga errores de listado", async () => {
    const client = {
      auth: { admin: { listUsers: vi.fn(async () => ({ data: { users: [] }, error: { message: "x" } })) } },
    } as unknown as AdminUsersClient<U>;
    await expect(findAuthUserByEmail(client, "a@b.c")).rejects.toBeInstanceOf(AuthUsersListError);
  });
});
