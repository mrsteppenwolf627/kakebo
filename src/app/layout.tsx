import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: {
    default: "Kakebo Ahorro | Control de gastos por mes y categorías",
    template: "%s | Kakebo Ahorro",
  },
  description:
    "Kakebo Ahorro es una app para registrar gastos por mes, controlar presupuestos por categorías Kakebo y seguir tu objetivo de ahorro con gráficos y progreso.",
  applicationName: "Kakebo Ahorro",
  metadataBase: new URL("https://example.com"), // cámbialo cuando despliegues
  openGraph: {
    title: "Kakebo Ahorro",
    description:
      "Registra gastos, controla presupuestos por categorías Kakebo y sigue tu objetivo de ahorro mes a mes.",
    type: "website",
    locale: "es_ES",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <header className="border-b border-black/10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="font-semibold">Kakebo Ahorro</div>
            <TopNav />
          </div>
        </header>

        {children}

        {/* Footer SEO + confianza */}
        <footer className="border-t border-black/10 mt-16">
          <div className="max-w-5xl mx-auto px-6 py-10 text-sm text-black/60 space-y-3">
            <p>
              <strong>Kakebo Ahorro</strong> te ayuda a controlar tus gastos mensuales,
              definir presupuestos por categoría y seguir tu objetivo de ahorro.
            </p>
            <p>
              Esta web está diseñada como un sistema práctico tipo <em>Kakebo</em>:
              registro diario, revisión mensual y mejora progresiva de hábitos financieros.
            </p>
            <p className="text-xs">
              Nota: la información mostrada es orientativa y no constituye asesoramiento financiero.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
