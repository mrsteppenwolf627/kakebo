import Link from "next/link";

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-24 bg-white">
      <div className="relative z-10 mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="mb-16 text-center border-b border-stone-200 pb-8">
          <h2 className="mb-4 text-4xl font-serif font-normal tracking-tight text-stone-900 sm:text-5xl md:text-6xl">
            Planes
          </h2>
          <p className="mx-auto max-w-2xl text-base text-stone-600 font-light">
            Empieza gratis. Prueba la IA sin riesgos. Cancela cuando quieras.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* FREE TIER */}
          <div className="border border-stone-200 bg-white p-8 sm:p-10">
            <div className="mb-8 border-b border-stone-200 pb-6">
              <h3 className="text-2xl font-serif text-stone-900 mb-3">Plan Manual</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-serif text-stone-900">0€</span>
                <span className="text-stone-500 font-light">/siempre</span>
              </div>
              <p className="text-stone-600 font-light leading-relaxed">
                Control manual de tus finanzas. Para siempre gratis.
              </p>
            </div>

            <div className="mb-10 space-y-3">
              <Feature text="Registro de gastos ilimitados" />
              <Feature text="Gestión de gastos fijos" />
              <Feature text="Presupuestos por categoría" />
              <Feature text="Historial completo mensual" />
              <Feature text="Exportación de datos" />
              <FeatureDisabled text="Agente IA de finanzas" />
              <FeatureDisabled text="Insights automáticos" />
              <FeatureDisabled text="Predicciones inteligentes" />
            </div>

            <Link
              href="/login"
              className="block w-full border border-stone-300 bg-white py-4 text-center text-base font-light text-stone-900 transition-colors hover:border-stone-900"
            >
              Empezar gratis
            </Link>

            <p className="mt-4 text-center text-xs text-stone-500 font-light">
              Sin tarjeta. Registro instantáneo.
            </p>
          </div>

          {/* PRO TIER - CARD UPFRONT */}
          <div className="border-2 border-stone-900 bg-stone-50 p-8 sm:p-10">
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 border border-stone-900 bg-white px-4 py-1 text-xs font-light text-stone-900 tracking-wide">
                Popular
              </span>
            </div>

            <div className="mb-8 border-b border-stone-300 pb-6">
              <h3 className="text-2xl font-serif text-stone-900 mb-3">Plan Pro con IA</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-serif text-stone-900">
                  9.99€
                </span>
                <span className="text-stone-600 font-light">/mes</span>
              </div>
              <p className="text-stone-700 font-light leading-relaxed">
                Todo lo del Plan Manual + Agente IA financiero
              </p>
            </div>

            <div className="mb-10 space-y-3">
              <Feature text="Todo del Plan Manual incluido" />
              <Feature text="Agente IA de finanzas personal" />
              <Feature text="Análisis automático de gastos" />
              <Feature text="Consejos personalizados" />
              <Feature text="Predicciones de ahorro" />
              <Feature text="Insights inteligentes" />
              <Feature text="Alertas proactivas" />
              <Feature text="Soporte prioritario" />
            </div>

            <Link
              href="/login"
              className="block w-full border border-stone-900 bg-stone-900 py-4 text-center text-base font-light text-white transition-colors hover:bg-stone-800"
            >
              Probar 15 días gratis
            </Link>

            {/* CARD UPFRONT WARNING - Estilo Zen pero CLARO */}
            <div className="mt-6 border border-red-700 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="text-xs font-light leading-relaxed">
                  <p className="font-normal text-red-900 mb-2">
                    Importante sobre el Trial
                  </p>
                  <p className="text-stone-700 mb-2">
                    <strong className="font-normal">Se requiere tarjeta para activar el trial</strong>, pero{" "}
                    <strong className="font-normal underline">no se te cobrará nada durante los primeros 15 días</strong>.
                  </p>
                  <p className="text-stone-700">
                    Te avisaremos antes del día 15. Puedes cancelar cuando quieras sin cargos.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-stone-500 font-light">
              Cancela en cualquier momento desde tu perfil.
            </p>
          </div>
        </div>

        {/* Trust Footer */}
        <div className="mt-16 text-center border-t border-stone-200 pt-8">
          <p className="text-xs text-stone-500 font-light max-w-3xl mx-auto leading-relaxed">
            💳 Pagos procesados por Stripe · 🔒 Datos encriptados · ✓ Cancelación instantánea ·
            📧 Te avisamos antes de cobrar
          </p>
        </div>
      </div>
    </section>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <svg
        className="h-5 w-5 flex-shrink-0 text-stone-900 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span className="text-stone-700 font-light text-sm leading-relaxed">
        {text}
      </span>
    </div>
  );
}

function FeatureDisabled({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 opacity-40">
      <svg
        className="h-5 w-5 flex-shrink-0 text-stone-400 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      <span className="text-stone-500 font-light text-sm leading-relaxed">{text}</span>
    </div>
  );
}
