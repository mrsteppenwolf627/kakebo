import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/landing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Cookies.meta" });

    return {
        title: t("title"),
        description: t("description"),
    };
}

export default function CookiesPage() {
    const t = useTranslations("Cookies");

    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl prose prose-stone dark:prose-invert">
                    <h1>{t("title")}</h1>
                    <p className="lead">{t("lastUpdate", { year: new Date().getFullYear() })}</p>

                    <h2>{t("sections.whatIs.title")}</h2>
                    <p>{t("sections.whatIs.content")}</p>

                    <h2>{t("sections.usage.title")}</h2>
                    <p>{t("sections.usage.content")}</p>
                    <ul>
                        <li><span dangerouslySetInnerHTML={{ __html: t.raw("sections.usage.list.i1") }} /></li>
                        <li><span dangerouslySetInnerHTML={{ __html: t.raw("sections.usage.list.i2") }} /></li>
                        <li><span dangerouslySetInnerHTML={{ __html: t.raw("sections.usage.list.i3") }} /></li>
                    </ul>

                    <h2>{t("sections.management.title")}</h2>
                    <p>{t("sections.management.content")}</p>
                </div>
            </div>
        </main>
    );
}
