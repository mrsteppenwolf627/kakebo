/**
 * Búsqueda y listado PAGINADO de usuarios de Supabase Auth (solo servidor, con el cliente
 * `service_role` de `createAdminClient`).
 *
 * `auth.admin.listUsers()` sin parámetros devuelve solo la PRIMERA página (50 usuarios por defecto).
 * Con más de 50 usuarios, buscar por email o resolver emails con una sola llamada deja fuera a
 * todos los que quedan después. Estas funciones recorren todas las páginas.
 *
 * - Sin duplicados: se indexa por `id` (una página puede solaparse si se crean usuarios mientras
 *   se recorre).
 * - Con tope de páginas para no entrar en un bucle infinito ante una respuesta anómala.
 */

export interface AuthUserLike {
  id: string;
  email?: string | null;
}

export interface AdminUsersClient<U extends AuthUserLike = AuthUserLike> {
  auth: {
    admin: {
      listUsers(params?: { page?: number; perPage?: number }): Promise<{
        data: { users: U[] } | { users: [] };
        error: { message: string } | null;
      }>;
    };
  };
}

export const AUTH_USERS_PER_PAGE = 200;
export const AUTH_USERS_MAX_PAGES = 500; // 100.000 usuarios con perPage=200

export class AuthUsersListError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthUsersListError";
  }
}

async function* pages<U extends AuthUserLike>(client: AdminUsersClient<U>): AsyncGenerator<U[]> {
  for (let page = 1; page <= AUTH_USERS_MAX_PAGES; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: AUTH_USERS_PER_PAGE });
    if (error) throw new AuthUsersListError(error.message);

    const users = (data?.users ?? []) as U[];
    if (users.length === 0) return;
    yield users;

    // Última página: llegó incompleta.
    if (users.length < AUTH_USERS_PER_PAGE) return;
  }
}

/** Devuelve TODOS los usuarios de Auth, paginando, sin duplicados. */
export async function listAllAuthUsers<U extends AuthUserLike>(client: AdminUsersClient<U>): Promise<U[]> {
  const byId = new Map<string, U>();
  for await (const users of pages(client)) {
    for (const user of users) byId.set(user.id, user);
  }
  return [...byId.values()];
}

/** Busca un usuario por email (sin distinguir mayúsculas), parando en cuanto lo encuentra. */
export async function findAuthUserByEmail<U extends AuthUserLike>(
  client: AdminUsersClient<U>,
  email: string
): Promise<U | null> {
  const wanted = email.trim().toLowerCase();
  if (!wanted) return null;

  for await (const users of pages(client)) {
    const match = users.find((u) => u.email?.toLowerCase() === wanted);
    if (match) return match;
  }
  return null;
}
