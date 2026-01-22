"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYm(year: number, month: number) {
  return `${year}-${pad2(month)}`;
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1, 1);
  d.setMonth(d.getMonth() + delta);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export default function MonthSelector({
  year,
  month,
}: {
  year: number;
  month: number;
}) {
  const router = useRouter();

  const currentYm = useMemo(() => toYm(year, month), [year, month]);

  function goTo(y: number, m: number) {
    const ym = toYm(y, m);
    console.log("[MonthSelector] goTo:", ym);
    router.push(`/?ym=${ym}`);
  }

  function goPrev(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const prev = shiftMonth(year, month, -1);
    goTo(prev.year, prev.month);
  }

  function goNext(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const next = shiftMonth(year, month, +1);
    goTo(next.year, next.month);
  }

  function goToday(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const now = new Date();
    goTo(now.getFullYear(), now.getMonth() + 1);
  }

  const label = useMemo(() => {
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  }, [year, month]);

  return (
    <div className="border border-black/10 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="text-sm text-black/60">Mes seleccionado</div>
        <div className="font-semibold capitalize">{label}</div>
        <div className="text-xs text-black/50">({currentYm})</div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goPrev}
          className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white"
          title="Mes anterior"
        >
          ← Anterior
        </button>

        <button
          type="button"
          onClick={goToday}
          className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white"
          title="Ir al mes actual"
        >
          Hoy
        </button>

        <button
          type="button"
          onClick={goNext}
          className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white"
          title="Mes siguiente"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
