import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Footer } from "@/components/landing/Footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.metodokakebo.com"),
  title: {
    default: "Kakebo - Control de Gastos Inteligente",
    template: "%s | Kakebo",
  },
  description:
    "La App de Kakebo definitiva. Gestión financiera minimalista con Inteligencia Artificial. Registra gastos, controla presupuestos y ahorra mes a mes en euros.",
  keywords: ["kakebo", "ahorro", "finanzas personales", "control gastos", "app gastos", "método kakebo", "ahorrar dinero españa", "regla 50 30 20", "calculadora sueldo neto", "distribución salario", "kakebo excel", "calculadora inflación", "ipc españa", "actualizar renta ipc"],
  authors: [{ name: "Kakebo AI Team" }],
  creator: "Kakebo AI",
  publisher: "Kakebo AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
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
        url: "/og-image.jpg",
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    "geo.region": "ES",
    "geo.placename": "España",
    "geo.position": "40.4637; -3.7492", // Madrid coordinates approx
    "ICBM": "40.4637, -3.7492",
  },
  verification: {
    google: "Vd8Y8MWGuiMRtCf6QzbzPT83CGcBeLJ3ME3lxeqdN-g",
  },
};

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

import SoftwareAppJsonLd from "@/components/seo/SoftwareAppJsonLd";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="overflow-x-hidden" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden max-w-[100vw] bg-sakura text-stone-900 dark:bg-stone-950 dark:text-stone-100 transition-colors duration-300 antialiased`}>
        <SoftwareAppJsonLd />
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
