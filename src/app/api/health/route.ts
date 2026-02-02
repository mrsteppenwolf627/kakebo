import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET() {
  const startTime = Date.now();

  // Check Supabase connection
  let dbStatus = "ok";
  try {
    const supabase = await createClient();
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
