import Link from "next/link";

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-50 via-white to-indigo-50" />

      <div className="relative z-10 mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Planes transparentes
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 sm:text-xl">
            Empieza gratis. Prueba la IA sin riesgos. Cancela cuando quieras.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* FREE TIER */}
          <div className="group relative rounded-3xl border-2 border-gray-200 bg-white/70 backdrop-blur-sm p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Manual</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-gray-900">0€</span>
                <span className="text-gray-500">/siempre</span>
              </div>
              <p className="text-gray-600">Control manual de tus finanzas. Para siempre gratis.</p>
            </div>

            <div className="mb-8 space-y-3">
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
              className="block w-full rounded-xl border-2 border-gray-300 bg-white py-4 text-center text-lg font-semibold text-gray-700 transition-all hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700"
            >
              Empezar gratis
            </Link>

            <p className="mt-4 text-center text-xs text-gray-500">
              Sin tarjeta. Registro instantáneo.
            </p>
          </div>

          {/* PRO TIER - CARD UPFRONT */}
          <div className="group relative rounded-3xl border-2 border-violet-300 bg-gradient-to-br from-violet-50/80 to-indigo-50/80 backdrop-blur-sm p-8 shadow-2xl transition-all duration-300 hover:shadow-3xl hover:scale-105">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Más popular
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Pro con IA</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  9.99€
                </span>
                <span className="text-gray-600">/mes</span>
              </div>
              <p className="text-gray-700 font-medium">
                Todo lo del Plan Manual + Agente IA financiero
              </p>
            </div>

            <div className="mb-8 space-y-3">
              <Feature text="Todo del Plan Manual incluido" highlighted />
              <Feature text="Agente IA de finanzas personal" highlighted />
              <Feature text="Análisis automático de gastos" highlighted />
              <Feature text="Consejos personalizados" highlighted />
              <Feature text="Predicciones de ahorro" highlighted />
              <Feature text="Insights inteligentes" highlighted />
              <Feature text="Alertas proactivas" highlighted />
              <Feature text="Soporte prioritario" highlighted />
            </div>

            <Link
              href="/login"
              className="block w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-4 text-center text-lg font-semibold text-white shadow-lg transition-all hover:from-violet-700 hover:to-indigo-700 hover:shadow-xl"
            >
              Probar 15 días gratis
            </Link>

            {/* CARD UPFRONT WARNING - MUY CLARO */}
            <div className="mt-6 rounded-xl border-2 border-amber-300 bg-amber-50/80 backdrop-blur-sm p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 mb-1">
                    ⚠️ Importante sobre el Trial
                  </p>
                  <p className="text-amber-800">
                    <strong>Se requiere tarjeta para activar el trial</strong>, pero{" "}
                    <strong className="underline">no se te cobrará nada durante los primeros 15 días</strong>.
                  </p>
                  <p className="mt-2 text-amber-800">
                    Te avisaremos antes del día 15. Puedes cancelar cuando quieras sin cargos.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-gray-600">
              Cancela en cualquier momento desde tu perfil.
            </p>
          </div>
        </div>

        {/* Trust Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 max-w-3xl mx-auto">
            💳 Pagos procesados por Stripe · 🔒 Datos encriptados · ✓ Cancelación instantánea ·
            📧 Te avisamos antes de cobrar
          </p>
        </div>
      </div>
    </section>
  );
}

function Feature({ text, highlighted = false }: { text: string; highlighted?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <svg
        className={`h-6 w-6 flex-shrink-0 ${
          highlighted ? "text-violet-600" : "text-green-600"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span className={highlighted ? "text-gray-800 font-medium" : "text-gray-700"}>
        {text}
      </span>
    </div>
  );
}

function FeatureDisabled({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 opacity-50">
      <svg
        className="h-6 w-6 flex-shrink-0 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      <span className="text-gray-500">{text}</span>
    </div>
  );
}
