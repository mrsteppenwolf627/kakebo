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
          Kakebo AI
        </h1>

        {/* Subtitle */}
        <h2 className="mx-auto mb-12 max-w-3xl text-base text-muted-foreground sm:text-lg md:text-xl font-light leading-relaxed">
          La <strong>App de Control de Gastos basada en el Método Japonés</strong>.
          <br className="hidden sm:block" />
          Sin bancos, 100% privado y con asistencia de IA.
        </h2>

        {/* CTA Buttons - Rectangulares, sobrios */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <HeroCTA />

          <Link
            href="#pricing"
            className="inline-flex items-center justify-center border border-border bg-card px-8 py-4 text-base font-normal text-foreground transition-colors hover:border-foreground"
          >
            Más información
          </Link>
        </div>

        {/* Trust Signal - Enhanced Visibility */}
        <p className="text-sm font-medium text-foreground tracking-wide bg-muted/50 py-2 px-4 rounded-full inline-block">
          🔒 Registro instantáneo · Sin tarjeta · <strong>Privacidad total sin bancos</strong>
        </p>

        {/* Stats Card - Sobrio */}
        <div className="mx-auto mt-20 max-w-4xl border border-border bg-card p-8 sm:p-12 shadow-sm">
          <div className="grid gap-8 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="pt-4 sm:pt-0 text-center">
              <div className="mb-2 text-4xl font-serif text-foreground">14 días</div>
              <div className="text-sm text-muted-foreground font-light">Prueba Premium Gratis</div>
            </div>
            <div className="pt-4 sm:pt-0 text-center">
              <div className="mb-2 text-4xl font-serif text-foreground">0€</div>
              <div className="text-sm text-muted-foreground font-light">Sin tarjeta requerida</div>
            </div>
            <div className="pt-4 sm:pt-0 text-center">
              <div className="mb-2 text-4xl font-serif text-foreground">100%</div>
              <div className="text-sm text-muted-foreground font-light">Privacidad Total</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
