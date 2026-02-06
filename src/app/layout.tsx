import type { Metadata } from "next";
import "./globals.css";

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
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="overflow-x-hidden">
      <body className="overflow-x-hidden max-w-[100vw] bg-stone-50 text-stone-900">
        {children}
      </body>
    </html>
  );
}
