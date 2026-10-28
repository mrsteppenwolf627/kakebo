import AuthGate from "@/components/AuthGate";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getScannerAccess } from "@/lib/auth/require-access";
import ScannerClient from "@/components/scanner/ScannerClient";

export const dynamic = "force-dynamic";

export default async function ScannerPage() {
  const t = await getTranslations("Scanner");
  const supabase = await createClient();

  let state: "allowed" | "plan_required" | "unavailable" = "unavailable";
  try {
    const access = await getScannerAccess(supabase);
    state = access.decision.allowed ? "allowed" : access.decision.reason === "plan_required" ? "plan_required" : "unavailable";
  } catch {
    state = "unavailable";
  }

  return (
    <AuthGate>
      <main className="min-h-screen px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <header className="border-b border-border pb-6">
            <p className="text-sm font-medium text-muted-foreground">{t("eyebrow")}</p>
            <h1 className="mt-2 text-3xl font-serif font-normal tracking-tight text-foreground">{t("title")}</h1>
            <p className="mt-3 text-muted-foreground">{t("intro")}</p>
          </header>

          <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6" aria-live="polite">
            {state === "plan_required" ? (
              <>
                <h2 className="text-xl font-serif font-normal text-foreground">{t("plusTitle")}</h2>
                <p className="mt-2 text-muted-foreground">{t("plusDescription")}</p>
                <Link
                  href="/app/subscription"
                  className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
                >
                  {t("seePlans")}
                </Link>
              </>
            ) : state === "allowed" ? (
              <ScannerClient />
            ) : (
              <>
                <h2 className="text-xl font-serif font-normal text-foreground">{t("unavailableTitle")}</h2>
                <p className="mt-2 text-muted-foreground">{t("unavailableDescription")}</p>
              </>
            )}
          </section>
        </div>
      </main>
    </AuthGate>
  );
}
