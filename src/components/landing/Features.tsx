export function Features() {
  return (
    <section id="features" className="relative py-24 bg-muted/30">
      <div className="relative z-10 mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-serif font-normal tracking-tight text-foreground sm:text-5xl">
            Características
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground font-light">
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
            description="Organiza gastos en categorías que tienen sentido. Detecta tus gastos hormiga y personaliza tu método Kakebo."
          />

          <FeatureCard
            title="Agente IA"
            description="Nuestro Copiloto analiza tus patrones de gasto para detectar anomalías y sugerir ahorros. Tu asistente financiero personal 24/7."
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
    <div className="border border-border bg-card p-6 sm:p-8 transition-colors hover:border-primary/50">
      {/* Pro Badge */}
      {isPro && (
        <span className="inline-block mb-4 border border-primary bg-primary px-3 py-1 text-xs font-light text-primary-foreground tracking-wide">
          PRO
        </span>
      )}

      {/* Title */}
      <h3 className="mb-3 text-lg font-serif text-foreground">{title}</h3>

      {/* Description */}
      <p className="text-muted-foreground font-light leading-relaxed text-sm">{description}</p>
    </div>
  );
}
