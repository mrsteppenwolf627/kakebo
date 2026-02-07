import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-200">
            <header className="sticky top-0 z-30 bg-stone-50/80 backdrop-blur-sm border-b border-stone-200">
                <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="font-serif text-xl font-medium tracking-tight">
                        Kakebo AI
                    </Link>
                    <Link href="/" className="text-sm text-stone-500 hover:text-stone-900">
                        &larr; Volver
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
                <h1 className="font-serif text-4xl md:text-5xl mb-8">Política de Privacidad</h1>

                <div className="prose prose-stone prose-lg max-w-none">
                    <p className="lead">
                        Última actualización: 7 de Febrero de 2026.
                    </p>

                    <p>
                        En Kakebo AI, nos tomamos la privacidad "Zen" muy en serio. Solo recolectamos los datos estrictamente necesarios para que la aplicación funcione.
                    </p>

                    <h3>1. Qué datos recolectamos</h3>
                    <ul>
                        <li>**Identidad:** Tu email y nombre (vía Google Auth).</li>
                        <li>**Finanzas:** Los gastos e ingresos que introduces manualmente o importas.</li>
                        <li>**Técnicos:** Cookies de sesión para mantenerte logueado.</li>
                    </ul>

                    <h3>2. Uso de Inteligencia Artificial</h3>
                    <p>
                        Al usar las funciones de IA (Agente Financiero), tus consultas y datos anonimizados pueden ser procesados por proveedores como OpenAI para generar respuestas. No usamos tus datos para reentrenar sus modelos públicos.
                    </p>

                    <h3>3. Pagos y Stripe</h3>
                    <p>
                        Los pagos son procesados íntegramente por Stripe. Kakebo AI **nunca** almacena tu tarjeta de crédito completa. Solo guardamos el estado de tu suscripción (Free/Pro) y el ID de cliente.
                    </p>

                    <h3>4. Tus derechos</h3>
                    <p>
                        Puedes solicitar la exportación o eliminación total de tus datos en cualquier momento escribiendo a soporte@kakebo.ai o desde la sección de Ajustes &gt; Borrar Cuenta.
                    </p>
                </div>
            </main>

            <footer className="border-t border-stone-200 py-12 text-center text-sm text-stone-500">
                &copy; {new Date().getFullYear()} Kakebo AI. Hecho con ❤️ y Wabi-Sabi.
            </footer>
        </div>
    );
}
