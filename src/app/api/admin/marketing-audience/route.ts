import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAllAuthUsers } from "@/lib/admin/auth-users";

function isAdmin(email: string | null | undefined): boolean {
  const admins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((item) => item.trim().toLowerCase());
  return Boolean(email && admins.includes(email.toLowerCase()));
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!isAdmin(user.email)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const admin = createAdminClient();
  const [{ data: preferences, error: preferencesError }, { data: events, error: eventsError }] = await Promise.all([
    admin.from("communication_preferences").select("user_id, marketing_email_consent, marketing_email_consent_at, unsubscribed_at, updated_at"),
    admin.from("marketing_email_events").select("event_type, created_at").order("created_at", { ascending: false }).limit(5000),
  ]);
  if (preferencesError) throw preferencesError;
  if (eventsError && !eventsError.message.includes("does not exist")) throw eventsError;

  const authUsers = await listAllAuthUsers(admin);
  const emailById = new Map(authUsers.map((authUser) => [authUser.id, authUser.email || ""]));
  const optedIn = (preferences || []).filter((item) => item.marketing_email_consent);
  const optedOut = (preferences || []).filter((item) => !item.marketing_email_consent && item.unsubscribed_at);
  const eventCounts = (events || []).reduce<Record<string, number>>((counts, event) => {
    counts[event.event_type] = (counts[event.event_type] || 0) + 1;
    return counts;
  }, {});

  return NextResponse.json({
    summary: { preferences: preferences?.length || 0, optedIn: optedIn.length, optedOut: optedOut.length, events: events?.length || 0 },
    eventCounts,
    recipients: optedIn.map((item) => ({ userId: item.user_id, email: emailById.get(item.user_id) || "", consentedAt: item.marketing_email_consent_at })),
  });
}
