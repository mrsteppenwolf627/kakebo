import AgentPageClient from "./AgentPageClient";
import { getPlusAccessView, isAiBlocked } from "@/lib/plus/access-view";

export const dynamic = "force-dynamic";

export default async function AgentPage() {
    // Con PLUS_SUBSCRIPTIONS_ENABLED apagado devuelve { status: "disabled" } y no consulta nada.
    const view = await getPlusAccessView();
    return <AgentPageClient blocked={isAiBlocked(view)} />;
}
