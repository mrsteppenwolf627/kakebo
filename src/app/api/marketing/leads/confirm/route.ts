import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyLeadAction } from "@/lib/marketing-mail/leads";

const LANDING_PATH = "/blog/plantilla-kakebo-excel";

function back(request: NextRequest, outcome: string) {
  const res = NextResponse.redirect(new URL(`${LANDING_PATH}?newsletter=${outcome}`, request.url), 303);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";
  const signature = request.nextUrl.searchParams.get("s") || "";
  if (!id || !verifyLeadAction(id, "confirm", signature)) return back(request, "invalid");

  const { error } = await createAdminClient()
    .from("marketing_leads")
    .update({ confirmed_at: new Date().toISOString(), unsubscribed_at: null })
    .eq("id", id)
    .is("confirmed_at", null);
  if (error) return back(request, "error");
  return back(request, "confirmed");
}
