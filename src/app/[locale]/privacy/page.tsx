import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/landing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Privacy.meta" });

    return {
        title: t("title"),
        description: t("description"),
    };
}

export default function PrivacyPage() {
    const t = useTranslations("Privacy");

    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl prose prose-stone dark:prose-invert">
                    <h1>{t("title")}</h1>
                    <p className="lead">{t("lastUpdate", { year: new Date().getFullYear() })}</p>

                    <h2>{t("sections.info.title")}</h2>
                    <p>{t("sections.info.content")}</p>

                    <h2>{t("sections.usage.title")}</h2>
                    <p>{t("sections.usage.content")}</p>
                    <ul>
                        <li>{t("sections.usage.list.i1")}</li>
                        <li>{t("sections.usage.list.i2")}</li>
                        <li>{t("sections.usage.list.i3")}</li>
                    </ul>

                    <h2>{t("sections.payments.title")}</h2>
                    <p dangerouslySetInnerHTML={{ __html: t.raw("sections.payments.p1") }} />
                    <p dangerouslySetInnerHTML={{ __html: t.raw("sections.payments.p2") }} />

                    <h2>{t("sections.sharing.title")}</h2>
                    <p>{t("sections.sharing.content")}</p>

                    <h2>{t("sections.rights.title")}</h2>
                    <p>{t("sections.rights.content")}</p>
                </div>
            </div>
        </main>
    );
}
