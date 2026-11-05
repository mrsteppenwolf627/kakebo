import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyLeadAction } from "@/lib/marketing-mail/leads";

const HTML_HEADERS = { "content-type": "text/html; charset=utf-8", "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";
  const signature = request.nextUrl.searchParams.get("s") || "";
  if (!id || !verifyLeadAction(id, "unsubscribe", signature)) {
    return new NextResponse("<h1>Enlace de baja no válido</h1>", { status: 400, headers: HTML_HEADERS });
  }

  const { error } = await createAdminClient()
    .from("marketing_leads")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return new NextResponse("<h1>No se pudo procesar la baja</h1>", { status: 500, headers: HTML_HEADERS });

  return new NextResponse(
    "<h1>Preferencias actualizadas</h1><p>Ya no recibirás emails de Kakebo en esta dirección.</p>",
    { headers: HTML_HEADERS },
  );
}
