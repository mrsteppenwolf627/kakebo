import AuthGate from "@/components/AuthGate";
import ExpenseCalendar from "@/components/ExpenseCalendar";
import MonthSelector from "@/components/MonthSelector";
import CategoryGuideCard from "@/components/CategoryGuideCard";

function parseYm(ym?: string) {
  if (!ym) return null;
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);

  if (!year || month < 1 || month > 12) return null;

  return { year, month };
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

  return (
    <AuthGate>
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <h1 className="text-4xl font-semibold">Kakebo Ahorro</h1>
          <p className="text-black/60">
            Registra tus gastos y visualízalos por mes con categorías Kakebo.
          </p>

          <MonthSelector year={year} month={month} />

          <ExpenseCalendar year={year} month={month} />

          <div className="mt-4">
            <CategoryGuideCard />
          </div>

          {/* ✅ BLOQUE SEO (texto real, indexable) */}
          <section className="mt-14 space-y-4 border-t border-black/10 pt-10 text-sm text-black/70">
            <h2 className="text-xl font-semibold text-black">
              Control de gastos mensual con método Kakebo
            </h2>

            <p>
              <strong>Kakebo Ahorro</strong> es una herramienta para organizar tu
              economía personal con un enfoque mensual: registras gastos, los
              clasificas por categorías y revisas el progreso hacia tu objetivo de
              ahorro.
            </p>

            <p>
              El método <em>Kakebo</em> se basa en la consciencia de gasto: saber en
              qué se va el dinero (Supervivencia, Opcional, Cultura y Extra) y
              ajustar hábitos con presupuestos realistas.
            </p>

            <p>
              En el dashboard puedes ver el total gastado del mes, el desglose por
              categorías, un gráfico (barras o “queso”) y el progreso hacia el
              objetivo de ahorro configurado en Ajustes.
            </p>

            <div className="text-xs text-black/50">
              (Aquí puedes ampliar con textos SEO específicos: “kakebo ahorro”, “app
              de presupuesto mensual”, “control de gastos por categorías”, etc.)
            </div>
          </section>
        </div>
      </main>
    </AuthGate>
  );
}
