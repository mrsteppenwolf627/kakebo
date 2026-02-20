import SubscriptionClient from "./SubscriptionClient";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: "Navigation" });
    return {
        title: `${t("subscription")} | Kakebo`,
        description: "Gestiona tu suscripción premium",
    };
}

export default function SubscriptionPage() {
    return <SubscriptionClient />;
}
