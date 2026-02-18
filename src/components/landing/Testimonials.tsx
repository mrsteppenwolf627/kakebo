"use client";

import { useTranslations } from 'next-intl';

export function Testimonials() {
    const t = useTranslations('Testimonials');

    const testimonials = [
        { id: 't1', emoji: "👩‍🎨" },
        { id: 't2', emoji: "👨‍💻" },
        { id: 't3', emoji: "🎓" },
        { id: 't4', emoji: "💼" },
        { id: 't5', emoji: "📱" },
        { id: 't6', emoji: "👨‍🏫" },
    ];

    return (
        <section className="py-24 bg-stone-50 dark:bg-stone-900/50">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-xl text-center">
                    <h2 className="text-lg font-semibold leading-8 tracking-tight text-primary">
                        {t('title')}
                    </h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        {t('subtitle')}
                    </p>
                </div>
                <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
                    <div className="-mt-8 sm:-mx-4 sm:columns-2 sm:text-[0] lg:columns-3">
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="pt-8 sm:inline-block sm:w-full sm:px-4"
                            >
                                <figure className="rounded-2xl bg-background p-8 text-sm leading-6 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10">
                                    <blockquote className="text-foreground">
                                        <p>“{t(`items.${testimonial.id}.body`)}”</p>
                                    </blockquote>
                                    <figcaption className="mt-6 flex items-center gap-x-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-lg">
                                            {testimonial.emoji}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground">
                                                {t(`items.${testimonial.id}.author`)}
                                            </div>
                                            <div className="text-muted-foreground">{t(`items.${testimonial.id}.role`)}</div>
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
