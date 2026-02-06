import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50" />

      {/* Animated Gradient Orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-violet-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-indigo-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-20 text-center">
        {/* Badge */}
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200/50 bg-white/40 backdrop-blur-md px-4 py-2 text-sm font-medium text-violet-900 shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500"></span>
          </span>
          Registra gastos con intención
        </div>

        {/* Main Heading */}
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl md:text-7xl lg:text-8xl">
          Controla tu dinero
          <br />
          <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            sin perder la calma
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-10 max-w-3xl text-lg text-gray-600 sm:text-xl md:text-2xl font-light leading-relaxed">
          Kakebo Ahorro te ayuda a entender tus gastos mensuales con claridad.
          <br className="hidden sm:block" />
          Minimalista, directo y sin trucos de "gurú financiero".
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            href="/login"
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-200 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl hover:scale-105"
          >
            <span className="relative z-10">Empezar Gratis</span>
            <svg
              className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>

          <Link
            href="#pricing"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 transition-all duration-200 rounded-2xl border-2 border-gray-300 bg-white/60 backdrop-blur-sm hover:bg-white/80 hover:border-violet-300 hover:text-violet-700 shadow-lg hover:shadow-xl"
          >
            Ver planes
          </Link>
        </div>

        {/* Trust Signal */}
        <p className="text-sm text-gray-500 font-medium">
          ✓ Registro instantáneo · ✓ Sin tarjeta requerida · ✓ 100% privado
        </p>

        {/* Glass Card - Quick Info */}
        <div className="mx-auto mt-16 max-w-4xl rounded-3xl border border-white/30 bg-white/40 backdrop-blur-xl p-8 shadow-2xl">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-violet-600">100%</div>
              <div className="text-sm text-gray-600 font-medium">Gratis para empezar</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-indigo-600">15 días</div>
              <div className="text-sm text-gray-600 font-medium">Trial con IA gratis</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-purple-600">0€</div>
              <div className="text-sm text-gray-600 font-medium">Hasta que decidas</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
