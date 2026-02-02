import { Suspense } from "react";
import AIMetricsClient from "./AIMetricsClient";

export const metadata = {
  title: "Métricas IA | Kakebo",
  description: "Panel de evaluación del modelo de IA",
};

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

export default function AIMetricsPage() {
  return (
    <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Métricas IA</h1>
          <p className="text-sm text-black/60 mt-1">
            Panel de evaluación y monitoreo del modelo de IA
          </p>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <AIMetricsClient />
        </Suspense>
      </div>
    </main>
  );
}
