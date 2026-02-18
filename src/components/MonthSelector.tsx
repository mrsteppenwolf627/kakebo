"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

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
  const t = useTranslations("Dashboard.MonthSelector");
  const locale = useLocale();

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
    // Locale-aware date formatting
    return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }, [year, month, locale]);

  return (
    <div className="border border-border rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card shadow-sm transition-colors">
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <div className="font-serif font-normal capitalize text-lg sm:text-xl text-foreground">
            {label}
          </div>
          <div className="text-xs text-muted-foreground font-mono">{currentYm}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goPrev}
          className="border border-border rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted hover:border-foreground/20 transition-all"
          title={t("prev")}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={goToday}
          className="border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 px-4 py-2 text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors rounded-md"
          title={t("today")}
        >
          {t("today")}
        </button>

        <button
          type="button"
          onClick={goNext}
          className="border border-border rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted hover:border-foreground/20 transition-all"
          title={t("next")}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}