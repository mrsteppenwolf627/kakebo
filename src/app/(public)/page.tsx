import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kakebo Ahorro | Control de gastos mensual simple",
  description:
    "Kakebo Ahorro te ayuda a registrar gastos por mes, separar gastos fijos y entender tu presupuesto con claridad. Minimalista, rápido y sin humo.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kakebo Ahorro | Control de gastos mensual simple",
    description:
      "Registra gastos por mes, separa gastos fijos y entiende tu presupuesto con claridad.",
    type: "website",
    url: "/",
  },
  robots: { index: true, follow: true },
};

export default function PublicHomePage() {
  return (
    <main className="min-h-screen bg-white text-black overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-black/10 bg-white/90 backdrop-blur overflow-x-hidden">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-full border border-black/20 shrink-0" />
            <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
              Kakebo Ahorro
            </span>
          </div>

          <nav className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="hidden sm:inline-block rounded border border-black/20 px-3 py-1.5 text-sm hover:border-black whitespace-nowrap"
            >
              Entrar
            </Link>
            <Link
              href="/login"
              className="rounded border border-black bg-black px-3 py-1.5 text-sm text-white hover:opacity-90 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Crear cuenta</span>
              <span className="sm:hidden">Entrar</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight md:text-5xl">
            Controla tus gastos por mes, con claridad y sin humo.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-black/70">
            Kakebo Ahorro es una app minimalista para registrar tus gastos,
            separar <b>gastos fijos</b> y revisar el mes con un historial claro.
            Sin menús infinitos, sin ruido, sin “gamificación” absurda.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="rounded border border-black bg-black px-5 py-2.5 text-sm text-white hover:opacity-90"
            >
              Empezar
            </Link>
            <Link
              href="/app"
              className="rounded border border-black/20 px-5 py-2.5 text-sm hover:border-black"
            >
              Ir al dashboard
            </Link>
          </div>

          <div className="mt-5 text-xs text-black/60">
            Registro rápido. Tus datos van a tu cuenta. Punto.
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-14">
        <h2 className="text-xl font-semibold tracking-tight">
          Qué puedes hacer en Kakebo Ahorro
        </h2>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Card
            title="Gastos por mes"
            desc="Registra compras y movimientos por mes. Cambia de mes con un selector rápido."
          />
          <Card
            title="Gastos fijos"
            desc="Define fijos con inicio y fin (YYYY-MM), actívalos o desactívalos sin borrarlos."
          />
          <Card
            title="Presupuestos por categoría"
            desc="Comparas presupuesto vs gastado por categorías para saber dónde se va el dinero."
          />
        </div>

        <div className="mt-10 rounded-xl border border-black/10 p-5">
          <h3 className="text-sm font-semibold">Para quién es</h3>
          <p className="mt-2 text-sm text-black/70">
            Para gente normal que solo quiere entender su mes: cuánto entra,
            cuánto se va en fijos, cuánto se gasta, y qué queda. No es una app
            de contabilidad, es un tablero claro para vivir mejor.
          </p>
        </div>
      </section>

      {/* SEO visible (contenido REAL en la web) */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-10">
        <div className="rounded-xl border border-black/10 p-5">
          <h2 className="text-lg font-semibold tracking-tight">
            Qué es Kakebo y para qué sirve
          </h2>

          <div className="mt-3 space-y-3 text-sm text-black/70">
            <p>
              <b>Kakebo</b> es un método japonés de ahorro basado en registrar tus
              gastos y revisar el mes con intención. No va de gráficos
              espectaculares, va de ver lo obvio: en qué se te va el dinero y
              qué puedes ajustar sin vivir como un ermitaño.
            </p>
            <p>
              En la práctica, funciona porque te obliga a hacer tres cosas que
              la mayoría evita: <b>anotar</b>, <b>clasificar</b> y <b>revisar</b>.
              Si eres constante, mejoras tu control del gasto casi sin darte
              cuenta.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-10">
        <div className="rounded-xl border border-black/10 p-5">
          <h2 className="text-lg font-semibold tracking-tight">
            Cómo funciona el método Kakebo
          </h2>

          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-black/70">
            <li>
              Define un <b>objetivo de ahorro mensual</b> realista (no ciencia
              ficción).
            </li>
            <li>
              Anota tus gastos <b>cuando ocurren</b> (no “mañana lo apunto”).
            </li>
            <li>
              Clasifica por categorías para detectar fugas: gastos hormiga,
              caprichos, suscripciones, etc.
            </li>
            <li>
              Revisa el mes y decide 1–2 cambios concretos para el siguiente.
            </li>
          </ul>

          <div className="mt-5 rounded-xl border border-black/10 p-4">
            <div className="text-sm font-semibold">Ejemplo rápido</div>
            <p className="mt-2 text-sm text-black/70">
              Ingresos: 1.800€. Fijos activos: 950€. Variables del mes: 620€.
              Te quedan 230€. Si el objetivo era ahorrar 200€, vas bien. Si no,
              miras qué categoría se te fue de madre y ajustas el siguiente mes.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-10">
        <div className="rounded-xl border border-black/10 p-5">
          <h2 className="text-lg font-semibold tracking-tight">
            Categorías típicas del Kakebo (y cómo usarlas)
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniCard
              title="Supervivencia"
              desc="Comida, transporte básico, farmacia, suministros esenciales."
            />
            <MiniCard
              title="Gastos fijos"
              desc="Alquiler, luz, internet, suscripciones necesarias, seguros."
            />
            <MiniCard
              title="Ocio"
              desc="Restaurantes, salidas, caprichos, compras impulsivas (sí, esas)."
            />
            <MiniCard
              title="Cultura y crecimiento"
              desc="Libros, formación, hobbies, actividades que suman a largo plazo."
            />
          </div>
        </div>
      </section>

      {/* FAQ (una sola vez, bien) */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-14">
        <h2 className="text-xl font-semibold tracking-tight">Preguntas frecuentes</h2>

        <div className="mt-6 space-y-3">
          <Faq
            q="¿Kakebo sirve aunque ya use una app bancaria?"
            a="Sí. El banco te enseña movimientos; Kakebo te obliga a entender decisiones. La clave es la revisión mensual y la intención."
          />
          <Faq
            q="¿Qué diferencia hay entre gastos fijos y supervivencia?"
            a="Fijos son pagos recurrentes (alquiler, luz). Supervivencia son gastos variables pero esenciales (comida, transporte diario)."
          />
          <Faq
            q="¿Cada mes se “reinicia” el Kakebo?"
            a="Se reinicia el presupuesto, pero queda historial para comparar meses y ver tu evolución."
          />
          <Faq
            q="¿Necesito Google para registrarme?"
            a="No. Puedes registrarte con email. Y si activas confirmación de email en Supabase, mejor."
          />
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16">
        <div className="rounded-xl border border-black/10 p-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Empieza hoy con tu Kakebo
          </h2>
          <p className="mt-2 text-sm text-black/70">
            Registra gastos, separa fijos y revisa el mes con claridad. Sin
            humo, sin “gurús”.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded border border-black bg-black px-4 py-2 text-sm text-white hover:opacity-90"
            >
              Crear cuenta / Entrar
            </Link>
            <Link
              href="/app"
              className="rounded border border-black/20 px-4 py-2 text-sm hover:border-black"
            >
              Ir al dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-8 text-xs text-black/60 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} Kakebo Ahorro</div>
          <div className="flex gap-4">
            <Link className="hover:text-black" href="/login">
              Entrar
            </Link>
            <Link className="hover:text-black" href="/app">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-black/10 p-5">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 text-sm text-black/70">{desc}</div>
    </div>
  );
}

function MiniCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-black/10 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-black/70">{desc}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="rounded-xl border border-black/10 p-5">
      <summary className="cursor-pointer text-sm font-semibold">{q}</summary>
      <p className="mt-3 text-sm text-black/70">{a}</p>
    </details>
  );
}
