import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-stone-50">
      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-20 text-center">
        {/* Badge */}
        <div className="mx-auto mb-8 inline-flex items-center gap-2 border border-stone-300 bg-white px-4 py-2 text-xs font-light text-stone-700 tracking-wide">
          Registra gastos con intención
        </div>

        {/* Main Heading - Serif elegante */}
        <h1 className="mb-8 text-5xl font-serif font-normal tracking-tight text-stone-900 sm:text-6xl md:text-7xl lg:text-8xl">
          Kakebo
          <br />
          <span className="text-stone-700">Ahorro</span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-12 max-w-3xl text-base text-stone-600 sm:text-lg md:text-xl font-light leading-relaxed">
          Control de gastos mensual con método japonés.
          <br className="hidden sm:block" />
          Minimalista, directo, sin trucos de "gurú financiero".
        </p>

        {/* CTA Buttons - Rectangulares, sobrios */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/login"
            className="inline-flex items-center justify-center border border-stone-900 bg-stone-900 px-8 py-4 text-base font-normal text-white transition-colors hover:bg-stone-800 hover:border-stone-800"
          >
            Empezar
          </Link>

          <Link
            href="#pricing"
            className="inline-flex items-center justify-center border border-stone-300 bg-white px-8 py-4 text-base font-normal text-stone-900 transition-colors hover:border-stone-900"
          >
            Ver planes
          </Link>
        </div>

        {/* Trust Signal */}
        <p className="text-xs text-stone-500 font-light tracking-wide">
          Registro instantáneo · Sin tarjeta · 100% privado
        </p>

        {/* Stats Card - Sobrio */}
        <div className="mx-auto mt-20 max-w-4xl border border-stone-200 bg-white p-8 sm:p-12">
          <div className="grid gap-8 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
            <div className="pt-4 sm:pt-0 text-center">
              <div className="mb-2 text-4xl font-serif text-stone-900">100%</div>
              <div className="text-sm text-stone-600 font-light">Gratis para empezar</div>
            </div>
            <div className="pt-4 sm:pt-0 text-center">
              <div className="mb-2 text-4xl font-serif text-stone-900">15 días</div>
              <div className="text-sm text-stone-600 font-light">Trial con IA gratis</div>
            </div>
            <div className="pt-4 sm:pt-0 text-center">
              <div className="mb-2 text-4xl font-serif text-stone-900">0€</div>
              <div className="text-sm text-stone-600 font-light">Hasta que decidas</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
