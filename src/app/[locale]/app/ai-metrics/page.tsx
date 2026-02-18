import { Suspense } from "react";
import AIMetricsClient from "./AIMetricsClient";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "AIMetrics" });
  return {
    title: `${t("title")} | Kakebo`,
    description: t("subtitle"),
  };
}

function LoadingFallback() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-black/10 rounded w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-black/10 rounded" />
        ))}
      </div>
      <div className="h-64 bg-black/10 rounded" />
    </div>
  );
}

export default async function AIMetricsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "AIMetrics" });

  return (
    <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <AIMetricsClient />
        </Suspense>
      </div>
    </main>
  );
}


