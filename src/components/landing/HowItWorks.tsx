export function HowItWorks() {
  return (
    <section className="relative py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-50/30 via-white to-indigo-50/30" />

      <div className="relative z-10 mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            El método Kakebo
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Un sistema japonés simple pero efectivo para controlar tus finanzas
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting Line (hidden on mobile) */}
          <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-violet-300 via-indigo-300 to-purple-300 lg:block" />

          <div className="space-y-12">
            <Step
              number="01"
              title="Define tu objetivo"
              description="Establece una meta de ahorro mensual realista. No ciencia ficción, algo que puedas cumplir."
              icon={
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              }
              side="left"
            />

            <Step
              number="02"
              title="Anota tus gastos"
              description='Registra cada gasto cuando ocurre. No lo dejes para "mañana". La consistencia es la clave.'
              icon={
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              }
              side="right"
            />

            <Step
              number="03"
              title="Clasifica por categorías"
              description="Separa tus gastos: supervivencia, fijos, ocio, cultura. Detecta dónde se te va el dinero."
              icon={
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              }
              side="left"
            />

            <Step
              number="04"
              title="Revisa y ajusta"
              description="Al final del mes, revisa qué funcionó y qué no. Decide 1-2 cambios concretos para el próximo mes."
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
              side="right"
            />
          </div>
        </div>

        {/* Example Card */}
        <div className="mx-auto mt-16 max-w-3xl rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-50/80 to-indigo-50/80 backdrop-blur-sm p-8 shadow-xl">
          <h3 className="mb-4 text-xl font-bold text-gray-900">Ejemplo práctico</h3>
          <div className="space-y-3 text-gray-700">
            <div className="flex justify-between border-b border-violet-200 pb-2">
              <span className="font-medium">Ingresos del mes:</span>
              <span className="font-bold text-green-600">1.800€</span>
            </div>
            <div className="flex justify-between border-b border-violet-200 pb-2">
              <span className="font-medium">Gastos fijos activos:</span>
              <span className="font-bold text-red-600">-950€</span>
            </div>
            <div className="flex justify-between border-b border-violet-200 pb-2">
              <span className="font-medium">Gastos variables:</span>
              <span className="font-bold text-red-600">-620€</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-lg font-bold">Te quedan:</span>
              <span className="text-lg font-bold text-violet-600">230€</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Si tu objetivo era ahorrar 200€, vas bien. Si no, miras qué categoría se te fue de
            madre y ajustas el siguiente mes. Simple.
          </p>
        </div>
      </div>
    </section>
  );
}

interface StepProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  side: "left" | "right";
}

function Step({ number, title, description, icon, side }: StepProps) {
  return (
    <div
      className={`relative flex items-center gap-8 ${
        side === "left" ? "lg:flex-row" : "lg:flex-row-reverse"
      }`}
    >
      {/* Content */}
      <div className="flex-1 lg:w-1/2">
        <div
          className={`rounded-2xl border border-gray-200/50 bg-white/60 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:shadow-xl ${
            side === "left" ? "lg:text-right" : "lg:text-left"
          }`}
        >
          <div
            className={`mb-2 text-sm font-bold text-violet-600 ${
              side === "left" ? "lg:justify-end" : "lg:justify-start"
            } flex justify-start`}
          >
            PASO {number}
          </div>
          <h3 className="mb-2 text-2xl font-bold text-gray-900">{title}</h3>
          <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Center Icon (hidden on mobile) */}
      <div className="absolute left-1/2 hidden -translate-x-1/2 lg:flex">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-xl">
          {icon}
        </div>
      </div>

      {/* Spacer */}
      <div className="hidden flex-1 lg:block lg:w-1/2" />
    </div>
  );
}
