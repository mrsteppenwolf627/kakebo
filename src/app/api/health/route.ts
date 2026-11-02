import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET() {
  const startTime = Date.now();

  // Check Supabase connection
  let dbStatus = "ok";
  try {
    // This endpoint is intentionally unauthenticated. Use the server-only
    // admin client and a table present in the production schema so RLS and
    // user-owned tables do not produce a false negative.
    const supabase = createAdminClient();
    const { error } = await supabase.from("expenses").select("id").limit(1);
    if (error) {
      dbStatus = "error";
    }
  } catch {
    dbStatus = "error";
  }

  const responseTime = Date.now() - startTime;

  return NextResponse.json({
    status: dbStatus === "ok" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    checks: {
      database: dbStatus,
    },
    responseTime: `${responseTime}ms`,
  });
}
