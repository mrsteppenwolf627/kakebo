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
    router.push(`/app?ym=${ym}`);
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
    <div className="border border-stone-200 rounded-none p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white">
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <div className="text-xs sm:text-sm text-stone-500 font-light">月</div>
        <div className="font-serif font-normal capitalize text-base sm:text-lg text-stone-900">
          {label}
        </div>
        <div className="text-xs text-stone-400 font-mono">({currentYm})</div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goPrev}
          className="border border-stone-300 px-3 sm:px-4 py-2 text-xs sm:text-sm text-stone-700 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-colors"
          title="Mes anterior"
        >
          ←
        </button>

        <button
          type="button"
          onClick={goToday}
          className="border border-stone-300 px-3 sm:px-4 py-2 text-xs sm:text-sm text-stone-700 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-colors"
          title="Ir al mes actual"
        >
          今月
        </button>

        <button
          type="button"
          onClick={goNext}
          className="border border-stone-300 px-3 sm:px-4 py-2 text-xs sm:text-sm text-stone-700 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-colors"
          title="Mes siguiente"
        >
          →
        </button>
      </div>
    </div>
  );
}