import "./globals.css";
import type { Metadata } from "next";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "Kakebo",
  description: "Kakebo web app – Dinero bajo control",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-black">
        <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-black/10">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <span className="font-semibold tracking-tight">Kakebo</span>
              <span className="text-xs text-black/50">
                dinero bajo control
              </span>
            </div>

            <TopNav />
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
