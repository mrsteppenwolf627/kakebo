import SubscriptionClient from "./SubscriptionClient";

export async function generateMetadata() {
    return {
        title: "Tu plan | Kakebo",
        description: "Consulta el nivel de acceso y las funciones disponibles en tu cuenta de Kakebo.",
    };
}

export default function SubscriptionPage() {
    return <SubscriptionClient />;
}
