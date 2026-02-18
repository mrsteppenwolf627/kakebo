import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/landing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Terms.meta" });

    return {
        title: t("title"),
        description: t("description"),
    };
}

export default function TermsPage() {
    const t = useTranslations("Terms");

    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl prose prose-stone dark:prose-invert">
                    <h1>{t("title")}</h1>
                    <p className="lead">{t("lastUpdate", { year: new Date().getFullYear() })}</p>

                    <h2>{t("sections.intro.title")}</h2>
                    <p>{t("sections.intro.content")}</p>

                    <h2>{t("sections.desc.title")}</h2>
                    <p>{t("sections.desc.content")}</p>

                    <h2>{t("sections.account.title")}</h2>
                    <p>{t("sections.account.content")}</p>

                    <h2>{t("sections.payments.title")}</h2>
                    <p dangerouslySetInnerHTML={{ __html: t.raw("sections.payments.content") }} />
                    <ul>
                        <li>{t("sections.payments.list.i1")}</li>
                        <li>{t("sections.payments.list.i2")}</li>
                        <li>{t("sections.payments.list.i3")}</li>
                    </ul>

                    <h2>{t("sections.liability.title")}</h2>
                    <p>{t("sections.liability.content")}</p>

                    <h2>{t("sections.modifications.title")}</h2>
                    <p>{t("sections.modifications.content")}</p>
                </div>
            </div>
        </main>
    );
}
