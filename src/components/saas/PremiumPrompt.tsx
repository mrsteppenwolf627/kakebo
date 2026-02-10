"use client";

import { useRouter } from "next/navigation";

interface PremiumPromptProps {
    feature: "PDF Reports" | "AI Chat" | "AI Classification";
    onUpgrade?: () => void;
}

export default function PremiumPrompt({ feature, onUpgrade }: PremiumPromptProps) {
    const router = useRouter();

    async function handleUpgrade() {
        if (onUpgrade) {
            onUpgrade();
            return;
        }

        try {
            const res = await fetch('/api/stripe/checkout', { method: 'POST' });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (e) {
            console.error(e);
            alert("Error al iniciar pago");
        }
    }

    const featureDetails: Record<string, { icon: string; description: string }> = {
        "PDF Reports": {
            icon: "📄",
            description: "Genera informes personalizados en PDF con gráficos y análisis detallados de tus gastos."
        },
        "AI Chat": {
            icon: "🤖",
            description: "Chatea con tu asistente financiero personal impulsado por IA para obtener insights y recomendaciones."
        },
        "AI Classification": {
            icon: "✨",
            description: "Clasifica automáticamente tus gastos con inteligencia artificial para ahorrar tiempo."
        }
    };

    const details = featureDetails[feature];

    return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-6 text-center space-y-6">
            <div className="max-w-md space-y-4">
                <div className="text-5xl mb-4">{details.icon}</div>
                <h2 className="text-2xl font-serif font-medium text-foreground">
                    {feature}
                </h2>
                <p className="text-muted-foreground text-sm">
                    {details.description}
                </p>

                <div className="bg-muted/50 p-4 rounded-xl text-left text-sm space-y-2 border border-border">
                    <div className="font-medium text-foreground mb-2">✨ Kakebo Premium incluye:</div>
                    <div>✅ Informes PDF ilimitados</div>
                    <div>✅ Chat con IA financiera</div>
                    <div>✅ Clasificación automática de gastos</div>
                    <div>✅ Análisis de tendencias</div>
                </div>

                <button
                    onClick={handleUpgrade}
                    className="w-full bg-stone-900 text-stone-50 dark:bg-stone-50 dark:text-stone-900 py-3 rounded-md font-medium hover:opacity-90 transition-opacity shadow-sm"
                >
                    Desbloquear Premium por {process.env.NEXT_PUBLIC_PRICE_DISPLAY || "3.99€"}/mes
                </button>

                <p className="text-xs text-muted-foreground">
                    Cancela cuando quieras. Gestionado de forma segura por Stripe.
                </p>
            </div>
        </div>
    );
}
