import Link from "next/link";
import { HeroCTA } from "./HeroCTA";

export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-20 text-center">
        {/* Badge */}
        <div className="mx-auto mb-8 inline-flex items-center gap-2 border border-border bg-card px-4 py-2 text-xs font-light text-muted-foreground tracking-wide rounded-full">
          Registra gastos con intención
        </div>

        {/* Main Heading - Serif elegante */}
        <h1 className="mb-8 text-5xl font-serif font-normal tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
          Kakebo
          <br />
          <span className="text-muted-foreground">Ahorro</span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-12 max-w-3xl text-base text-muted-foreground sm:text-lg md:text-xl font-light leading-relaxed">
          Control de gastos mensual con método japonés.
          <br className="hidden sm:block" />
          Minimalista, directo, sin trucos de "gurú financiero".
        </p>

        {/* CTA Buttons - Rectangulares, sobrios */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <HeroCTA />

          <Link
            href="#pricing"
            className="inline-flex items-center justify-center border border-border bg-card px-8 py-4 text-base font-normal text-foreground transition-colors hover:border-foreground"
          >
            Ver planes
          </Link>
        </div>

        {/* Trust Signal */}
        <p className="text-xs text-muted-foreground font-light tracking-wide">
          Registro instantáneo · Sin tarjeta · 100% privado
        </p>

        {/* Stats Card - Sobrio */}
        <div className="mx-auto mt-20 max-w-4xl border border-border bg-card p-8 sm:p-12 shadow-sm">
          <div className="grid gap-8 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="pt-4 sm:pt-0 text-center">
              <div className="mb-2 text-4xl font-serif text-foreground">100%</div>
              <div className="text-sm text-muted-foreground font-light">Gratis para empezar</div>
            </div>
            <div className="pt-4 sm:pt-0 text-center">
              <div className="mb-2 text-4xl font-serif text-foreground">15 días</div>
              <div className="text-sm text-muted-foreground font-light">Trial con IA gratis</div>
            </div>
            <div className="pt-4 sm:pt-0 text-center">
              <div className="mb-2 text-4xl font-serif text-foreground">0€</div>
              <div className="text-sm text-muted-foreground font-light">Hasta que decidas</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
