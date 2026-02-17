"use client";

export function Testimonials() {
    return (
        <section className="py-24 bg-stone-50 dark:bg-stone-900/50">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-xl text-center">
                    <h2 className="text-lg font-semibold leading-8 tracking-tight text-primary">
                        Comunidad Kakebo
                    </h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Gente real que ahorra dinero real
                    </p>
                </div>
                <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
                    <div className="-mt-8 sm:-mx-4 sm:columns-2 sm:text-[0] lg:columns-3">
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.author}
                                className="pt-8 sm:inline-block sm:w-full sm:px-4"
                            >
                                <figure className="rounded-2xl bg-background p-8 text-sm leading-6 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10">
                                    <blockquote className="text-foreground">
                                        <p>“{testimonial.body}”</p>
                                    </blockquote>
                                    <figcaption className="mt-6 flex items-center gap-x-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-lg">
                                            {testimonial.emoji}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground">
                                                {testimonial.author}
                                            </div>
                                            <div className="text-muted-foreground">{testimonial.role}</div>
                                        </div>
                                    </figcaption>
                                </figure>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

const testimonials = [
    {
        body: "Llevaba años intentando usar Excel para mis gastos, pero siempre lo dejaba a la semana. Kakebo es la única app que me ha hecho constante.",
        author: "Elena M.",
        role: "Diseñadora Gráfica",
        emoji: "👩‍🎨",
    },
    {
        body: "Me encanta que no tenga conexión con bancos. Me da mucha paz mental saber que mis datos no están viajando por ahí.",
        author: "Carlos Rodriguez",
        role: "Ingeniero de Software",
        emoji: "👨‍💻",
    },
    {
        body: "La filosofía de categorizar en 'Vicio' vs 'Cultura' me cambió la mentalidad. He ahorrado 300€ el primer mes casi sin darme cuenta.",
        author: "Sarah J.",
        role: "Estudiante",
        emoji: "🎓",
    },
    {
        body: "Simple, bonita y directa. Justo lo que buscaba para aplicar el método Kakebo sin complicarme con libretas físicas.",
        author: "Miguel Ángel",
        role: "Freelance",
        emoji: "💼",
    },
    {
        body: "El chatbot de IA es una locura. Le pregunto '¿cuánto gasté en cafés?' y me lo dice al momento. Brutal.",
        author: "Laura P.",
        role: "Marketing Manager",
        emoji: "📱",
    },
    {
        body: "Por fin una app que entiende que 'ahorrar' no es 'sufrir'. Kakebo me ha enseñado a gastar mejor, no a dejar de vivir.",
        author: "David G.",
        role: "Profesor",
        emoji: "👨‍🏫",
    },
];
