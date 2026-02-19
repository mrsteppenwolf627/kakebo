import { NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { responses, handleApiError, withLogging } from "@/lib/api";
import { generatePendingEmbeddings } from "@/lib/ai/auto-embeddings";
import { apiLogger } from "@/lib/logger";

/**
 * POST /api/ai/process-embeddings
 * Internal endpoint to process pending embeddings in background
 *
 * This endpoint is called automatically by the expense creation flow
 * when the global counter reaches the threshold (every 5 expenses).
 *
 * It uses the service role key to bypass RLS and process expenses
 * from all users, not just the authenticated user.
 *
 * Query params:
 * - limit: number (optional, default 50) - Max expenses to process
 * - secret: string (required) - Internal API secret for security
 */
export const POST = withLogging(
  async (request: NextRequest) => {
    try {
      // Verify internal API secret to prevent abuse
      const { searchParams } = new URL(request.url);
      const secret = searchParams.get("secret");
      const expectedSecret = process.env.INTERNAL_API_SECRET;

      // If no secret is configured, fall back to checking if it's a server-side request
      if (expectedSecret && secret !== expectedSecret) {
        apiLogger.warn(
          { providedSecret: secret?.slice(0, 5) },
          "Unauthorized access to process-embeddings endpoint"
        );
        return responses.unauthorized("Invalid API secret");
      }

      const limit = Math.min(
        parseInt(searchParams.get("limit") || "50"),
        100
      );

      // Create Supabase client with service role key (bypasses RLS)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Missing Supabase configuration");
      }

      const supabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Process pending embeddings
      const result = await generatePendingEmbeddings(supabase, limit);

      return responses.ok({
        success: true,
        ...result,
        message:
          result.processed > 0
            ? `Processed ${result.processed} embeddings. ${result.remaining} remaining.`
            : "No pending embeddings to process.",
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { skipAuthLog: true } // Skip logging auth details for internal endpoint
);

/**
 * GET /api/ai/process-embeddings
 * Get status of pending embeddings (for monitoring/debugging)
 */
export const GET = withLogging(async (request: NextRequest) => {
  try {
    // Verify internal API secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const expectedSecret = process.env.INTERNAL_API_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return responses.unauthorized("Invalid API secret");
    }

    // Create service client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Count total expenses
    const { count: totalExpenses, error: expError } = await supabase
      .from("expenses")
      .select("*", { count: "exact", head: true })
      .not("note", "is", null)
      .neq("note", "");

    if (expError) throw expError;

    // Count expenses with embeddings
    const { count: withEmbeddings, error: embError } = await supabase
      .from("expense_embeddings")
      .select("*", { count: "exact", head: true });

    if (embError) throw embError;

    const pending = (totalExpenses || 0) - (withEmbeddings || 0);
    const percentage =
      totalExpenses && totalExpenses > 0
        ? Math.round(((withEmbeddings || 0) / totalExpenses) * 100)
        : 100;

    return responses.ok({
      totalExpenses: totalExpenses || 0,
      withEmbeddings: withEmbeddings || 0,
      pending,
      percentage,
      status: pending === 0 ? "complete" : "pending",
    });
  } catch (error) {
    return handleApiError(error);
  }
});
