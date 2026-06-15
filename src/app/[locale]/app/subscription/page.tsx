import SubscriptionClient from "./SubscriptionClient";

export async function generateMetadata() {
    return {
        title: "Acceso Gratuito | Kakebo",
        description: "Kakebo es una herramienta gratuita. Todos los usuarios registrados tienen acceso completo.",
    };
}

export default function SubscriptionPage() {
    return <SubscriptionClient />;
}
