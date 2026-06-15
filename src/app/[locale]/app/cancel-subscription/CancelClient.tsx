"use client";

import { Link } from "@/i18n/routing";

export default function CancelClient() {
    return (
        <main className="min-h-screen px-4 sm:px-6 py-12 max-w-xl mx-auto flex flex-col items-center text-center space-y-8">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
                Kakebo es gratuito
            </h1>
            <p className="text-muted-foreground">
                No tienes ninguna suscripción activa. Kakebo es ahora completamente gratuito y puedes usar todas las funcionalidades sin límites.
            </p>

            <Link
                href="/app"
                className="flex w-full max-w-sm bg-primary text-primary-foreground font-medium rounded-md px-4 py-3 hover:opacity-90 transition-colors shadow-sm justify-center items-center"
            >
                Volver al Dashboard
            </Link>
        </main>
    );
}
