import { getTranslations } from "next-intl/server";
import SettingsClient from "./SettingsClient";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "Settings.SEO" });
  return {
    title: `${t("title")} | Kakebo`,
    description: t("desc"),
  };
}

export default function Page() {
  return <SettingsClient />;
}
