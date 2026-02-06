export function Features() {
  return (
    <section id="features" className="relative py-24 bg-stone-50">
      <div className="relative z-10 mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-serif font-normal tracking-tight text-stone-900 sm:text-5xl">
            Características
          </h2>
          <p className="mx-auto max-w-2xl text-base text-stone-600 font-light">
            Control financiero minimalista. Sin complicaciones innecesarias.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Gastos por mes"
            description="Registra compras y movimientos organizados por mes. Cambia entre meses con un selector rápido y visual."
          />

          <FeatureCard
            title="Gastos fijos"
            description="Define tus gastos recurrentes con inicio y fin. Actívalos o desactívalos sin perder el histórico."
          />

          <FeatureCard
            title="Presupuestos"
            description="Compara presupuesto vs gasto real por categoría. Detecta fugas de dinero de un vistazo."
          />

          <FeatureCard
            title="Historial visual"
            description="Revisa tus meses anteriores y compara tendencias. Entiende tu evolución financiera real."
          />

          <FeatureCard
            title="Categorías"
            description="Organiza gastos en categorías que tienen sentido para ti. Personaliza tu método Kakebo."
          />

          <FeatureCard
            title="Agente IA"
            description="Asistente financiero inteligente que analiza tus gastos y te da consejos personalizados en tiempo real."
            isPro
          />
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  isPro?: boolean;
}

function FeatureCard({ title, description, isPro }: FeatureCardProps) {
  return (
    <div className="border border-stone-200 bg-white p-6 sm:p-8 transition-colors hover:border-stone-900">
      {/* Pro Badge */}
      {isPro && (
        <span className="inline-block mb-4 border border-stone-900 bg-stone-900 px-3 py-1 text-xs font-light text-white tracking-wide">
          PRO
        </span>
      )}

      {/* Title */}
      <h3 className="mb-3 text-lg font-serif text-stone-900">{title}</h3>

      {/* Description */}
      <p className="text-stone-600 font-light leading-relaxed text-sm">{description}</p>
    </div>
  );
}
