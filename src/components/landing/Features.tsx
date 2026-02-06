export function Features() {
  return (
    <section className="relative py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-violet-50/30" />

      <div className="relative z-10 mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Todo lo que necesitas
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Control financiero minimalista. Sin complicaciones innecesarias.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
            title="Gastos por mes"
            description="Registra compras y movimientos organizados por mes. Cambia entre meses con un selector rápido y visual."
            gradient="from-violet-500 to-purple-500"
          />

          <FeatureCard
            icon={
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            }
            title="Gastos fijos"
            description="Define tus gastos recurrentes con inicio y fin. Actívalos o desactívalos sin perder el histórico."
            gradient="from-indigo-500 to-blue-500"
          />

          <FeatureCard
            icon={
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
            title="Presupuestos claros"
            description="Compara presupuesto vs gasto real por categoría. Detecta fugas de dinero de un vistazo."
            gradient="from-purple-500 to-pink-500"
          />

          <FeatureCard
            icon={
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
            }
            title="Historial visual"
            description="Revisa tus meses anteriores y compara tendencias. Entiende tu evolución financiera real."
            gradient="from-blue-500 to-cyan-500"
          />

          <FeatureCard
            icon={
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            }
            title="Categorías flexibles"
            description="Organiza gastos en categorías que tienen sentido para ti. Personaliza tu método Kakebo."
            gradient="from-emerald-500 to-teal-500"
          />

          <FeatureCard
            icon={
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            }
            title="Agente IA (Pro)"
            description="Asistente financiero inteligente que analiza tus gastos y te da consejos personalizados en tiempo real."
            gradient="from-violet-600 to-purple-600"
            isPro
          />
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  isPro?: boolean;
}

function FeatureCard({ icon, title, description, gradient, isPro }: FeatureCardProps) {
  return (
    <div className="group relative rounded-2xl border border-gray-200/50 bg-white/60 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
      {/* Icon */}
      <div
        className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${gradient} p-3 text-white shadow-lg`}
      >
        {icon}
      </div>

      {/* Pro Badge */}
      {isPro && (
        <span className="absolute top-4 right-4 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
          PRO
        </span>
      )}

      {/* Title */}
      <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>

      {/* Description */}
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
