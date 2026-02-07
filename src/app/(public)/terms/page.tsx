import Link from "next/link";

export default function TermsPage() {
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
                <h1 className="font-serif text-4xl md:text-5xl mb-8">Términos de Servicio</h1>

                <div className="prose prose-stone prose-lg max-w-none">
                    <p>
                        Al usar Kakebo AI, aceptas estas condiciones. Si no estás de acuerdo, por favor no uses el servicio.
                    </p>

                    <h3>1. El Servicio</h3>
                    <p>
                        Kakebo AI es una herramienta de gestión financiera personal. No somos asesores financieros certificados. La información proporcionada por la IA es con fines educativos y de orientación, no constituye consejo financiero profesional.
                    </p>

                    <h3>2. Suscripciones y Pagos</h3>
                    <ul>
                        <li>**Plan Gratuito:** Acceso manual ilimitado.</li>
                        <li>**Plan Pro (IA):** 9.99€/mes tras 15 días de prueba.</li>
                        <li>**Prueba Gratuita:** Requiere tarjeta. No se cobra hasta el día 16. Puedes cancelar antes sin coste.</li>
                        <li>**Cancelación:** Puedes cancelar tu suscripción en cualquier momento desde el Portal de Facturación. El acceso Pro continuará hasta el final del ciclo pagado.</li>
                    </ul>

                    <h3>3. Responsabilidad</h3>
                    <p>
                        No nos hacemos responsables de pérdidas financieras derivadas de decisiones tomadas basadas en la app. Tú eres el único responsable de tu dinero.
                    </p>

                    <h3>4. Cambios</h3>
                    <p>
                        Nos reservamos el derecho de modificar precios o funciones con previo aviso razonable por email.
                    </p>
                </div>
            </main>

            <footer className="border-t border-stone-200 py-12 text-center text-sm text-stone-500">
                &copy; {new Date().getFullYear()} Kakebo AI. Hecho con ❤️ y Wabi-Sabi.
            </footer>
        </div>
    );
}
