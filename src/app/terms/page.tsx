
export const metadata = {
    title: "Términos y Condiciones | Kakebo AI",
    description: "Términos de uso y condiciones de servicio de Kakebo AI.",
};

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl prose prose-stone dark:prose-invert">
                <h1>Términos y Condiciones</h1>
                <p className="lead">Última actualización: {new Date().getFullYear()}</p>

                <h2>1. Introducción</h2>
                <p>
                    Bienvenido a Kakebo AI. Al acceder o utilizar nuestra aplicación web,
                    aceptas estar legalmente vinculado por estos Términos de Servicio.
                </p>

                <h2>2. Descripción del Servicio</h2>
                <p>
                    Kakebo AI es una herramienta de gestión financiera personal basada en el
                    método japonés Kakebo, diseñada para ayudar a los usuarios a registrar
                    gastos y fomentar el ahorro.
                </p>

                <h2>3. Cuentas de Usuario</h2>
                <p>
                    Para usar ciertas funciones, debes registrarte. Eres responsable de
                    mantener la confidencialidad de tus credenciales. Nos reservamos el
                    derecho de suspender cuentas que violen estos términos.
                </p>

                <h2>4. Pagos y Suscripciones (Stripe)</h2>
                <p>
                    Algunas funciones avanzadas pueden requerir una suscripción de pago. Los
                    pagos son procesados de forma segura a través de <strong>Stripe</strong>.
                </p>
                <ul>
                    <li>
                        No almacenamos tus datos completos de tarjeta de crédito/débito en
                        nuestros servidores.
                    </li>
                    <li>
                        Las transacciones están sujetas a los términos y condiciones de
                        Stripe, además de los nuestros.
                    </li>
                    <li>
                        Puedes cancelar tu suscripción en cualquier momento desde tu panel de
                        control.
                    </li>
                </ul>

                <h2>5. Responsabilidad</h2>
                <p>
                    Kakebo AI se proporciona "tal cual". No garantizamos que el servicio
                    sea ininterrumpido o libre de errores. No somos asesores financieros;
                    la información proporcionada es solo para fines informativos y de
                    gestión personal.
                </p>

                <h2>6. Modificaciones</h2>
                <p>
                    Nos reservamos el derecho de modificar estos términos en cualquier
                    momento. Te notificaremos sobre cambios significativos.
                </p>
            </div>
        </main>
    );
}
