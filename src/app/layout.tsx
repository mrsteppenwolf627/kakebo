import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kakebo AI: Finanzas Zen",
    template: "%s | Kakebo AI",
  },
  description:
    "Gestión financiera minimalista con Inteligencia Artificial. Registra gastos, controla presupuestos y ahorra mes a mes.",
  manifest: "/manifest.webmanifest", // Next.js genera esto desde manifest.ts
  themeColor: "#fafaf9",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kakebo AI",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Kakebo AI",
    description: "Finanzas Zen con Inteligencia Artificial.",
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="overflow-x-hidden">
      <body className="overflow-x-hidden max-w-[100vw] bg-sakura text-stone-900">
        {children}
      </body>
    </html>
  );
}
