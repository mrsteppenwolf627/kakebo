import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeSignature } from "@/lib/marketing-mail/provider";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("u") || "";
  const signature = request.nextUrl.searchParams.get("s") || "";
  if (!userId || !verifyUnsubscribeSignature(userId, signature)) {
    return NextResponse.json({ error: "Enlace de baja no válido" }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .from("communication_preferences")
    .update({ marketing_email_consent: false, unsubscribed_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) return NextResponse.json({ error: "No se pudo procesar la baja" }, { status: 500 });

  return new NextResponse("<h1>Preferencias actualizadas</h1><p>Ya no recibirás emails de marketing de Kakebo.</p>", {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
