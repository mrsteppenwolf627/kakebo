import { Suspense } from "react";
import NewExpenseClient from "./NewExpenseClient";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "Transaction.NewExpense" });
  return {
    title: `${t("title")} | Kakebo`,
    description: t("subtitle"),
  };
}

function NewExpenseSkeleton() {
  return (
    <div className="max-w-xl mx-auto mt-10 space-y-4 animate-pulse">
      <div className="h-8 bg-black/10 rounded w-1/2" />
      <div className="h-10 bg-black/10 rounded" />
      <div className="h-10 bg-black/10 rounded" />
      <div className="h-10 bg-black/10 rounded" />
      <div className="h-10 bg-black/10 rounded" />
      <div className="h-10 bg-black/20 rounded w-32" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<NewExpenseSkeleton />}>
      <NewExpenseClient />
    </Suspense>
  );
}
