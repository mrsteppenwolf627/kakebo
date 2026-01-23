import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-5xl font-semibold tracking-tight">
          Kakebo Ahorro
        </h1>
        <p className="text-black/60 max-w-2xl">
          Controla tus gastos por mes, presupuestos por categorías y progreso de ahorro.
          Minimalista, claro y sin humo.
        </p>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="bg-black text-white px-5 py-3 text-sm hover:opacity-90"
          >
            Empezar
          </Link>
          <Link
            href="/app"
            className="border border-black px-5 py-3 text-sm hover:bg-black hover:text-white"
          >
            Ir al dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
