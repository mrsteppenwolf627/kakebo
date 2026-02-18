import { getTranslations } from "next-intl/server";
import AdminClient from "./AdminClient";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: "Admin" });
    return {
        title: `${t("title")} | Kakebo`,
        description: t("subtitle"),
    };
}

export default function Page() {
    return <AdminClient />;
}
