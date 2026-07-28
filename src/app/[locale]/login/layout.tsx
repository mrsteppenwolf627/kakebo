import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Auth.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}/login`,
            languages: {
                "es": "https://www.metodokakebo.com/login",
                "en": "https://www.metodokakebo.com/en/login",
                "x-default": "https://www.metodokakebo.com/login"
            }
        },
    };
}

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
