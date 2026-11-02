import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMarketingCampaignKey, previewMarketingCampaign, sendMarketingCampaign } from "@/lib/marketing-mail/campaigns";

function isAdmin(email: string | null | undefined): boolean {
  const admins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((item) => item.trim().toLowerCase());
  return Boolean(email && admins.includes(email.toLowerCase()));
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!isAdmin(user.email)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const campaignKey = typeof body.campaignKey === "string" ? body.campaignKey : "";
  const mode = body.mode === "send" ? "send" : "preview";
  if (!isMarketingCampaignKey(campaignKey)) return NextResponse.json({ error: "Campaña no válida" }, { status: 400 });

  if (mode === "send") {
    if (process.env.MARKETING_MANUAL_SEND_ENABLED !== "true" || body.confirm !== "SEND") {
      return NextResponse.json({ error: "Envío protegido: activa MARKETING_MANUAL_SEND_ENABLED y confirma SEND" }, { status: 403 });
    }
    return NextResponse.json(await sendMarketingCampaign(campaignKey, Number(body.limit) || 100));
  }

  return NextResponse.json(await previewMarketingCampaign(campaignKey, Number(body.limit) || 100));
}
