import { createClient } from "@/lib/supabase/server";
import { ApiError } from "./errors";

/**
 * User object returned from authentication
 */
export type AuthUser = {
  id: string;
  email: string | undefined;
};

/**
 * Verifies the current user session and returns user info
 * Throws ApiError if not authenticated
 *
 * Usage in API routes:
 * ```ts
 * export async function GET() {
 *   try {
 *     const user = await requireAuth();
 *     // user.id is available here
 *   } catch (error) {
 *     return handleApiError(error);
 *   }
 * }
 * ```
 */
export async function requireAuth(): Promise<AuthUser> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiError("UNAUTHORIZED", "Sesión no válida o expirada", 401);
  }

  return {
    id: user.id,
    email: user.email,
  };
}

/**
 * Optional authentication - returns user if logged in, null otherwise
 * Does not throw errors
 */
export async function getOptionalAuth(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}
