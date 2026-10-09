import AuthGate from "@/components/AuthGate";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import RecentMovements from "@/components/RecentMovements";
import MonthSelector from "@/components/MonthSelector";
import CategoryGuideCard from "@/components/CategoryGuideCard";
import ReportButton from "@/components/reports/ReportButton";
import DashboardMoneyPanel from "@/components/DashboardMoneyPanel";
import OnboardingTour from "@/components/dashboard/OnboardingTour";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

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
  const sp = props.searchParams instanceof Promise ? await props.searchParams : props.searchParams;
  const now = new Date();
  const fallback = { year: now.getFullYear(), month: now.getMonth() + 1 };
  const parsed = parseYm(sp?.ym);
  const year = parsed?.year ?? fallback.year;
  const month = parsed?.month ?? fallback.month;
  const ym = `${year}-${pad2(month)}`;
  const t = await getTranslations("Dashboard");

  return (
    <AuthGate>
      <main className="min-h-screen px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-6xl space-y-8 sm:space-y-12">
          <header className="border-b border-border pb-6">
            <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground sm:text-5xl">
              {t("Header.title")}
            </h1>
            <p className="mt-2 text-sm font-light text-muted-foreground sm:text-base">
              {t("Header.subtitle")}
            </p>
            <p className="mt-3 max-w-2xl text-xs text-muted-foreground/80 sm:text-sm">
              {t("Header.periodHint")}
            </p>
          </header>

          <div className="flex flex-col justify-center gap-4 sm:flex-row sm:justify-start">
            <Link
              href="/app/new"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-stone-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 active:scale-95 dark:bg-stone-100 dark:text-stone-900 sm:w-auto"
            >
              <ArrowDownLeft className="h-4 w-4" strokeWidth={1.9} />
              <span>{t("Actions.addExpense")}</span>
            </Link>
            <Link
              href="/app/new-income"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 active:scale-95 sm:w-auto"
            >
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.9} />
              <span>{t("Actions.addIncome")}</span>
            </Link>
            <ReportButton ym={ym} />
          </div>

          <MonthSelector year={year} month={month} />
          <DashboardMoneyPanel year={year} month={month} ym={ym} />
          <RecentMovements year={year} month={month} ym={ym} />

          <div className="mt-8">
            <CategoryGuideCard />
          </div>

          <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-serif text-lg font-normal text-foreground">{t("CycleGuide.title")}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">01</div>
                <p className="mt-1 text-foreground">{t("CycleGuide.step1")}</p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">02</div>
                <p className="mt-1 text-foreground">{t("CycleGuide.step2")}</p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">03</div>
                <p className="mt-1 text-foreground">{t("CycleGuide.step3")}</p>
              </div>
            </div>
          </section>
        </div>
        <OnboardingTour />
      </main>
    </AuthGate>
  );
}
