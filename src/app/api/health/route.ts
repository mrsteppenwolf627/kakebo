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
    // admin client so RLS for user-owned settings does not report a healthy
    // production database as unavailable to anonymous monitoring checks.
    const supabase = createAdminClient();
    const { error } = await supabase.from("user_settings").select("id").limit(1);
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
