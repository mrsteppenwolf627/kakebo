import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Calculadora Ahorro 50/30/20 | App Kakebo España",
    description:
        "Calcula cómo distribuir tu sueldo con la regla 50/30/20 adaptada al método Kakebo. Descubre cuánto deberías ahorrar cada mes según tus ingresos en España.",
    keywords: ["calculadora ahorro", "regla 50 30 20 calculadora", "kakebo excel", "calcular ahorro mensual", "distribución sueldo españa"],
    openGraph: {
        title: "Calculadora Ahorro 50/30/20 | App Kakebo España",
        description: "Descubre cuánto deberías ahorrar cada mes con la regla 50/30/20 y el método Kakebo.",
        type: "website",
    },
};

export default function CalculatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
