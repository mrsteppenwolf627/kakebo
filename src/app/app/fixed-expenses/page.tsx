import { Suspense } from "react";
import FixedExpensesClient from "./FixedExpensesClient";

export default function FixedExpensesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-black/60">Cargando…</div>}>
      <FixedExpensesClient />
    </Suspense>
  );
}
