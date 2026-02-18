import AuthGate from "@/components/AuthGate";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import ExpenseCalendar from "@/components/ExpenseCalendar";
import MonthSelector from "@/components/MonthSelector";

import CategoryGuideCard from "@/components/CategoryGuideCard";
import FloatingAddButton from "@/components/FloatingAddButton";
import ReportButton from "@/components/reports/ReportButton";

import DashboardMoneyPanel from "@/components/DashboardMoneyPanel";
import FloatingAgentChat from "@/components/FloatingAgentChat";


function parseYm(ym?: string) {
  if (!ym) return null;
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);

  if (!year || month < 1 || month > 12) return null;

  return { year, month };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default async function HomePage(props: {
  searchParams?: Promise<{ ym?: string }> | { ym?: string };
}) {
  const sp =
    props.searchParams instanceof Promise
      ? await props.searchParams
      : props.searchParams;

  const now = new Date();
  const fallback = { year: now.getFullYear(), month: now.getMonth() + 1 };

  const parsed = parseYm(sp?.ym);
  const year = parsed?.year ?? fallback.year;
  const month = parsed?.month ?? fallback.month;

  const ym = `${year}-${pad2(month)}`;

  const t = await getTranslations("Dashboard");

  return (
    <AuthGate>
      <main className="min-h-screen px-4 sm:px-8 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl space-y-8 sm:space-y-12">
          {/* HEADER - Estilo Wabi-Sabi: Simple, espacio en blanco, serif para título */}
          {/* HEADER - Estilo Wabi-Sabi: Simple, espacio en blanco, serif para título */}
          <header className="border-b border-border pb-6">
            <h1 className="text-3xl sm:text-5xl font-serif font-normal text-foreground tracking-tight">
              {t("Header.title")}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-2 font-light">
              {t("Header.subtitle")}
            </p>
          </header>

          {/* Quick Actions - Mobile/Desktop Prominent Button */}
          <div className="flex flex-col sm:flex-row justify-center sm:justify-start gap-4">
            <Link
              href="/app/new"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium rounded-md shadow-sm hover:opacity-90 transition-all active:scale-95"
            >
              <span className="text-lg">💸</span>
              <span>{t("Actions.addExpense")}</span>
            </Link>

            <Link
              href="/app/new-income"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3 bg-emerald-600 text-white text-sm font-medium rounded-md shadow-sm hover:opacity-90 transition-all active:scale-95"
            >
              <span className="text-lg">💰</span>
              <span>{t("Actions.addIncome")}</span>
            </Link>

            <ReportButton />
          </div>

          <MonthSelector year={year} month={month} />

          {/* Panel de dinero */}
          <DashboardMoneyPanel year={year} month={month} ym={ym} />

          <ExpenseCalendar year={year} month={month} />

          <div className="mt-8">
            <CategoryGuideCard />
          </div>

          {/* SEO BLOCK - Estilo sobrio */}
          <section className="mt-16 space-y-6 border-t border-border pt-12 text-sm text-stone-600 dark:text-stone-400">
            <h2 className="text-xl font-serif font-normal text-foreground">
              {t("SEO.title")}
            </h2>

            <p className="leading-relaxed">
              {t.rich("SEO.p1", {
                bold: (chunks) => <strong className="text-stone-900">{chunks}</strong>,
              })}
            </p>

            <p className="leading-relaxed">
              {t.rich("SEO.p2", {
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>

            <p className="leading-relaxed">{t("SEO.p3")}</p>
          </section>
        </div>
        <FloatingAgentChat />
        <FloatingAddButton />
      </main>
    </AuthGate>
  );
}
