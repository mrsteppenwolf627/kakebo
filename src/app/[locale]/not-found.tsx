import { useTranslations } from "next-intl";
import { Link as I18nLink } from "@/i18n/routing";

export default function NotFound() {
    const t = useTranslations("NotFound");

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h1 className="text-4xl font-serif font-bold text-foreground mb-4">404</h1>
            <h2 className="text-xl font-medium text-foreground mb-2">{t("title")}</h2>
            <p className="text-muted-foreground mb-8 max-w-md">{t("desc")}</p>
            <I18nLink
                href="/"
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:opacity-90 transition-opacity"
            >
                {t("home")}
            </I18nLink>
        </div>
    );
}
