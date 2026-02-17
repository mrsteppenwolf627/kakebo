
export const metadata = {
    title: "Política de Cookies | Kakebo AI",
    description: "Uso de cookies en Kakebo AI.",
};

export default function CookiesPage() {
    return (
        <main className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl prose prose-stone dark:prose-invert">
                <h1>Política de Cookies</h1>
                <p className="lead">Última actualización: {new Date().getFullYear()}</p>

                <h2>1. ¿Qué son las cookies?</h2>
                <p>
                    Las cookies son pequeños archivos de texto que se almacenan en tu
                    dispositivo cuando visitas una página web.
                </p>

                <h2>2. Cookies que utilizamos</h2>
                <p>
                    Utilizamos cookies esenciales para el funcionamiento de la aplicación:
                </p>
                <ul>
                    <li>
                        <strong>Cookies de Sesión:</strong> Para mantener tu sesión iniciada
                        de forma segura (Supabase Auth).
                    </li>
                    <li>
                        <strong>Cookies de Preferencias:</strong> Para recordar si prefieres
                        el modo claro u oscuro.
                    </li>
                    <li>
                        <strong>Cookies de Pago (Stripe):</strong> Stripe puede establecer
                        cookies necesarias para la prevención de fraude y el procesamiento
                        seguro de pagos.
                    </li>
                </ul>

                <h2>3. Gestión de cookies</h2>
                <p>
                    Puedes configurar tu navegador para rechazar todas las cookies o para
                    que te avise cuando se envía una cookie. Sin embargo, algunas partes
                    del servicio (como el inicio de sesión o los pagos) no funcionarán
                    correctamente sin ellas.
                </p>
            </div>
        </main>
    );
}
