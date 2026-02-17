
export const metadata = {
    title: "Política de Privacidad | Kakebo AI",
    description: "Cómo gestionamos tus datos en Kakebo AI.",
};

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl prose prose-stone dark:prose-invert">
                <h1>Política de Privacidad</h1>
                <p className="lead">Última actualización: {new Date().getFullYear()}</p>

                <h2>1. Información que Recopilamos</h2>
                <p>
                    Recopilamos información que nos proporcionas directamente, como tu
                    correo electrónico al registrarte, y datos de uso de la aplicación
                    (gastos registrados, categorías).
                </p>

                <h2>2. Uso de la Información</h2>
                <p>
                    Utilizamos tu información para:
                </p>
                <ul>
                    <li>Proporcionar, mantener y mejorar nuestros servicios.</li>
                    <li>Procesar transacciones (en caso de suscripciones).</li>
                    <li>Enviarte notificaciones técnicas o de soporte.</li>
                </ul>

                <h2>3. Datos de Pagos (Stripe)</h2>
                <p>
                    Si realizas pagos en Kakebo AI, utilizamos <strong>Stripe</strong>
                    como pasarela de pago segura.
                </p>
                <p>
                    <strong>Kakebo AI no tiene acceso ni almacena tus números completos de tarjeta de pago.</strong>
                    Esta información se transmite directamente a Stripe de forma encriptada.
                    Stripe procesa tus datos de pago de acuerdo con su
                    <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer"> Política de Privacidad</a>.
                </p>

                <h2>4. Compartir Información</h2>
                <p>
                    No vendemos tus datos personales. Solo compartimos información con proveedores
                    de servicios (como Stripe o proveedores de hosting) necesarios para operar
                    la aplicación, bajo estrictas cláusulas de confidencialidad.
                </p>

                <h2>5. Tus Derechos</h2>
                <p>
                    Tienes derecho a acceder, rectificar o eliminar tus datos personales.
                    Puedes hacerlo desde la configuración de tu cuenta o contactándonos.
                </p>
            </div>
        </main>
    );
}
