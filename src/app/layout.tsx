import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Footer } from "@/components/landing/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kakebo AI: Finanzas Zen y Control de Gastos",
    template: "%s | Kakebo AI",
  },
  description:
    "La App de Kakebo definitiva. Gestión financiera minimalista con Inteligencia Artificial. Registra gastos, controla presupuestos y ahorra mes a mes en euros.",
  keywords: ["kakebo", "ahorro", "finanzas personales", "control gastos", "app gastos", "método kakebo", "ahorrar dinero españa"],
  authors: [{ name: "Kakebo AI Team" }],
  creator: "Kakebo AI",
  manifest: "/manifest.webmanifest",
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://kakebo.ai"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Kakebo AI: Finanzas Zen",
    description: "Domina tus finanzas con el método japonés Kakebo potenciado por IA.",
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: "Kakebo AI",
    images: [
      {
        url: "/og-image.jpg", // Ensure this exists or use a placeholder
        width: 1200,
        height: 630,
        alt: "Kakebo AI Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kakebo AI: Finanzas Zen",
    description: "Gestión financiera minimalista con Inteligencia Artificial.",
    creator: "@kakebo_ai",
    images: ["/og-image.jpg"],
  },
};

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="overflow-x-hidden" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden max-w-[100vw] bg-sakura text-stone-900 dark:bg-stone-950 dark:text-stone-100 transition-colors duration-300 antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
