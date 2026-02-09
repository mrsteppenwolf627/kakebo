import AuthGate from "@/components/AuthGate";
import ExpenseCalendar from "@/components/ExpenseCalendar";
import MonthSelector from "@/components/MonthSelector";

import CategoryGuideCard from "@/components/CategoryGuideCard";

import DashboardMoneyPanel from "@/components/DashboardMoneyPanel";


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

  return (
    <AuthGate>
      <main className="min-h-screen px-4 sm:px-8 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl space-y-8 sm:space-y-12">
          {/* HEADER - Estilo Wabi-Sabi: Simple, espacio en blanco, serif para título */}
          {/* HEADER - Estilo Wabi-Sabi: Simple, espacio en blanco, serif para título */}
          <header className="border-b border-border pb-6">
            <h1 className="text-3xl sm:text-5xl font-serif font-normal text-foreground tracking-tight">
              Mi Kakebo
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-2 font-light">
              Control de gastos mensual
            </p>
          </header>

          <MonthSelector year={year} month={month} />

          {/* Panel de dinero */}
          <DashboardMoneyPanel year={year} month={month} ym={ym} />

          <ExpenseCalendar year={year} month={month} />

          <div className="mt-8">
            <CategoryGuideCard />
          </div>

          {/* SEO BLOCK - Estilo sobrio */}
          <section className="mt-16 space-y-6 border-t border-stone-200 pt-12 text-sm text-stone-600">
            <h2 className="text-xl font-serif font-normal text-stone-900">
              Control de gastos mensual con método Kakebo
            </h2>

            <p className="leading-relaxed">
              <strong className="text-stone-900">Kakebo Ahorro</strong> es una herramienta para organizar tu
              economía personal con un enfoque mensual: registras gastos, los
              clasificas por categorías y revisas el progreso hacia tu objetivo de
              ahorro.
            </p>

            <p className="leading-relaxed">
              El método <em>Kakebo</em> se basa en la consciencia de gasto: saber en
              qué se va el dinero (Supervivencia, Opcional, Cultura y Extra) y
              ajustar hábitos con presupuestos realistas.
            </p>

            <p className="leading-relaxed">
              En el dashboard puedes ver el total gastado del mes, el desglose por
              categorías, un gráfico (barras o "queso") y el progreso hacia el
              objetivo de ahorro configurado en Ajustes.
            </p>
          </section>
        </div>
      </main>
    </AuthGate>
  );
}
