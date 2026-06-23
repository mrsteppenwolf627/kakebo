"use client";

import { useTranslations } from 'next-intl';

export function Testimonials() {
    const t = useTranslations('Testimonials');

    const testimonials = [
        { id: 't1', initials: 'E' },
        { id: 't2', initials: 'C' },
        { id: 't3', initials: 'S' },
        { id: 't4', initials: 'M' },
        { id: 't5', initials: 'L' },
        { id: 't6', initials: 'D' },
    ];

    return (
        <section className="py-16 sm:py-24 bg-muted/30">
            <div className="mx-auto max-w-6xl px-6 lg:px-8">
                <div className="mx-auto max-w-xl text-center">
                    <p className="text-lg font-semibold leading-8 tracking-tight text-primary">
                        {t('title')}
                    </p>
                    <h2 className="mt-2 text-3xl font-serif font-normal tracking-tight text-foreground sm:text-4xl">
                        {t('subtitle')}
                    </h2>
                </div>
                <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
                    <div className="-mt-8 sm:-mx-4 sm:columns-2 sm:text-[0] lg:columns-3">
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="pt-8 sm:inline-block sm:w-full sm:px-4"
                            >
                                <figure className="rounded-2xl bg-background p-8 text-sm leading-6 shadow-sm ring-1 ring-border/50">
                                    <blockquote className="text-foreground">
                                        <p>{`"${t(`items.${testimonial.id}.body`)}"`}</p>
                                    </blockquote>
                                    <figcaption className="mt-6 flex items-center gap-x-4">
                                        <div
                                            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-serif font-medium text-muted-foreground select-none"
                                            aria-hidden="true"
                                        >
                                            {testimonial.initials}
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
