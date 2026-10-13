import { getLocale, getTranslations } from "next-intl/server";
import LegacyFreePlan from "./LegacyFreePlan";
import { PlanClient, PlanLoadError } from "@/components/plus/PlanClient";
import StripeSuccessHandler from "@/components/saas/StripeSuccessHandler";
import { getPlusAccessView } from "@/lib/plus/access-view";
import { isPlusSubscriptionsEnabled } from "@/lib/auth/require-access";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
    if (!isPlusSubscriptionsEnabled()) {
        return {
            title: "Acceso Gratuito | Kakebo",
            description: "Kakebo es una herramienta gratuita. Todos los usuarios registrados tienen acceso completo.",
        };
    }
    const t = await getTranslations("Plus");
    return { title: `${t("metaTitle")} | Kakebo`, description: t("metaDesc"), robots: { index: false, follow: false } };
}

type SearchParams = { plus?: string; session_id?: string };

export default async function SubscriptionPage(props: { searchParams?: Promise<SearchParams> | SearchParams }) {
    // Interruptor apagado: comportamiento actual (sin consultas, sin botones de pago, sin estados inventados).
    if (!isPlusSubscriptionsEnabled()) return <LegacyFreePlan />;

    const sp = props.searchParams instanceof Promise ? await props.searchParams : props.searchParams ?? {};
    const locale = ((await getLocale()) === "en" ? "en" : "es") as "es" | "en";
    const t = await getTranslations("Plus");
    const view = await getPlusAccessView();

    const plusParam = sp.plus === "success" || sp.plus === "cancelled" ? sp.plus : null;
    const sessionId = typeof sp.session_id === "string" && /^cs_(test|live)_[A-Za-z0-9]+$/.test(sp.session_id) ? sp.session_id : null;

    return (
        <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-10 max-w-xl mx-auto space-y-4 sm:space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-foreground">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>

            <StripeSuccessHandler status={plusParam} sessionId={sessionId} />

            {view.status === "ready" && <PlanClient view={view} locale={locale} />}
            {(view.status === "error" || view.status === "unauthenticated") && <PlanLoadError kind={view.status} locale={locale} />}

            <aside aria-labelledby="pack-note-title" className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <h2 id="pack-note-title" className="font-semibold text-foreground">{t("packNoteTitle")}</h2>
                <p className="mt-1 text-muted-foreground">{t("packNoteDesc")}</p>
            </aside>

            <Link
                href="/app"
                className="flex w-full items-center justify-center rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
            >
                {t("backToDashboard")}
            </Link>
        </main>
    );
}
