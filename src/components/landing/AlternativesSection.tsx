"use client";

export function AlternativesSection() {
    return (
        <section id="alternatives" className="py-24 bg-background">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center mb-16">
                    <h2 className="text-3xl font-serif font-medium text-foreground sm:text-4xl">
                        ¿Por qué elegir Kakebo AI?
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        La única alternativa que combina la privacidad del Excel con la comodidad de las Apps.
                    </p>
                </div>

                <div className="overflow-hidden border border-border rounded-2xl shadow-sm">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th scope="col" className="py-4 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">
                                    Característica
                                </th>
                                <th scope="col" className="px-3 py-4 text-center text-sm font-semibold text-primary bg-primary/5">
                                    Kakebo AI
                                </th>
                                <th scope="col" className="px-3 py-4 text-center text-sm font-semibold text-muted-foreground">
                                    Excel / Hojas de Cálculo
                                </th>
                                <th scope="col" className="px-3 py-4 text-center text-sm font-semibold text-muted-foreground">
                                    Apps Bancarias (Fintonic, etc.)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            <tr>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                    🔒 Privacidad (Sin conexión bancaria)
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-foreground bg-primary/5 font-medium">
                                    ✅ Sí (Tus claves son tuyas)
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-muted-foreground">
                                    ✅ Sí
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-foreground">
                                    ❌ No (Acceden a tu banco)
                                </td>
                            </tr>
                            <tr>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                    🧠 Análisis con Inteligencia Artificial
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-foreground bg-primary/5 font-medium">
                                    ✅ Sí (Copiloto GPT-4)
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-muted-foreground">
                                    ❌ No (Manual)
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-muted-foreground">
                                    ⚠️ Básico (Algoritmos viejos)
                                </td>
                            </tr>
                            <tr>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                    🧘 Método Kakebo (Ahorro Consciente)
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-foreground bg-primary/5 font-medium">
                                    ✅ Nativo (4 Categorías)
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-muted-foreground">
                                    ❌ Tienes que configurarlo tú
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-muted-foreground">
                                    ❌ No (Categorías estándar)
                                </td>
                            </tr>
                            <tr>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                    📱 Facilidad de uso (Móvil)
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-foreground bg-primary/5 font-medium">
                                    ✅ Excelente (PWA)
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-muted-foreground">
                                    ❌ Terrible
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-foreground">
                                    ✅ Excelente
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
