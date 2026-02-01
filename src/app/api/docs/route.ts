import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/api/openapi";

/**
 * GET /api/docs
 * Returns the OpenAPI specification as JSON
 *
 * Use this to:
 * - Import into Swagger UI / Postman / Insomnia
 * - Generate client SDKs
 * - Generate documentation sites
 */
export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      "Content-Type": "application/json",
      // Allow CORS for documentation tools
      "Access-Control-Allow-Origin": "*",
    },
  });
}
