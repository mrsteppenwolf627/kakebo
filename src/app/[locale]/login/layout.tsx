import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Iniciar Sesión | Kakebo",
    description: "Accede a tu cuenta de Kakebo para gestionar tus gastos y presupuestos mensuales. Método japonés de ahorro digitalizado.",
    alternates: { canonical: "/login" },
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
