import type { Metadata } from "next";
import {
  Navbar,
  Hero,
  Features,
  PricingSection,
  HowItWorks,
  FAQ,
  Footer,
} from "@/components/landing";

export const metadata: Metadata = {
  title: "Kakebo Ahorro | Control de gastos mensual simple",
  description:
    "Kakebo Ahorro te ayuda a registrar gastos por mes, separar gastos fijos y entender tu presupuesto con claridad. Minimalista, rápido y sin humo.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kakebo Ahorro | Control de gastos mensual simple",
    description:
      "Registra gastos por mes, separa gastos fijos y entiende tu presupuesto con claridad.",
    type: "website",
    url: "/",
  },
  robots: { index: true, follow: true },
};

export default function PublicHomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />

      {/* Add padding to account for fixed navbar */}
      <div className="pt-20">
        <Hero />

        <div id="features">
          <Features />
        </div>

        <div id="pricing">
          <PricingSection />
        </div>

        <div id="how-it-works">
          <HowItWorks />
        </div>

        {/* SEO Content - Kakebo Method Explanation */}
        <section className="relative py-16">
          <div className="absolute inset-0 bg-background" />
          <div className="relative z-10 mx-auto w-full max-w-5xl px-4">
            <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
              <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground mb-4">
                Qué es Kakebo y para qué sirve
              </h2>

              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <b className="text-foreground">Kakebo</b> es un método japonés de ahorro basado en registrar tus gastos y
                  revisar el mes con intención. No va de gráficos espectaculares, va de ver lo
                  obvio: en qué se te va el dinero y qué puedes ajustar sin vivir como un ermitaño.
                </p>
                <p>
                  En la práctica, funciona porque te obliga a hacer tres cosas que la mayoría
                  evita: <b className="text-foreground">anotar</b>, <b className="text-foreground">clasificar</b> y <b className="text-foreground">revisar</b>. Si eres constante,
                  mejoras tu control del gasto casi sin darte cuenta.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Content - Categories */}
        <section className="relative py-16 bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-4">
            <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-sm p-8 shadow-lg">
              <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground mb-6">
                Categorías típicas del Kakebo (y cómo usarlas)
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <CategoryCard
                  title="Supervivencia"
                  desc="Comida, transporte básico, farmacia, suministros esenciales."
                />
                <CategoryCard
                  title="Gastos fijos"
                  desc="Alquiler, luz, internet, suscripciones necesarias, seguros."
                />
                <CategoryCard
                  title="Ocio"
                  desc="Restaurantes, salidas, caprichos, compras impulsivas (sí, esas)."
                />
                <CategoryCard
                  title="Cultura y crecimiento"
                  desc="Libros, formación, hobbies, actividades que suman a largo plazo."
                />
              </div>
            </div>
          </div>
        </section>

        <div id="faq">
          <FAQ />
        </div>

        <Footer />
      </div>
    </main>
  );
}

function CategoryCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50">
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
