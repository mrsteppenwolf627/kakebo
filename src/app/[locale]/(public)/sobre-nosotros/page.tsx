import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Shield, Target, Lightbulb, Users, Mail, Phone, MessageCircle } from "lucide-react";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'About.meta' });

    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
        },
        alternates: {
            canonical: `https://www.metodokakebo.com/${locale === 'es' ? '' : 'en'}/sobre-nosotros`,
            languages: {
                "es": "https://www.metodokakebo.com/sobre-nosotros",
                "en": "https://www.metodokakebo.com/en/sobre-nosotros",
                "x-default": "https://www.metodokakebo.com/sobre-nosotros"
            }
        },
    };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'About' });

    const SCHEMA = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": "https://www.metodokakebo.com/#organization",
                "name": "Kakebo AI",
                "url": "https://www.metodokakebo.com",
                "logo": "https://www.metodokakebo.com/icon.png",
                "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": "+34-662-24-93-27",
                    "contactType": "customer service",
                    "email": "aitor@aitoralmu.xyz",
                    "availableLanguage": ["Spanish", "English"]
                }
            },
            {
                "@type": "Person",
                "@id": "https://www.metodokakebo.com/#person",
                "name": "Aitor Almu",
                "jobTitle": "Fundador y Desarrollador",
                "url": "https://www.metodokakebo.com/sobre-nosotros",
                "sameAs": [
                    "https://x.com/aitoralmu",
                    "https://github.com/mrsteppenwolf627"
                ],
                "worksFor": { "@id": "https://www.metodokakebo.com/#organization" }
            }
        ]
    };

    return (
        <main className="min-h-screen bg-sakura pt-32 pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
            />
            
            <article className="mx-auto max-w-4xl px-6">
                {/* Header section */}
                <header className="mb-20 text-center space-y-6">
                    <h1 className="text-5xl font-serif md:text-7xl text-foreground leading-tight">
                        {t('title')} <br />
                        <span className="italic text-primary">{t('subtitle')}</span>
                    </h1>
                </header>

                {/* Story Section */}
                <section className="mb-24 prose prose-stone dark:prose-invert max-w-none prose-headings:font-serif prose-p:text-xl prose-p:font-light prose-p:leading-relaxed text-muted-foreground">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-primary/10 p-3 rounded-xl text-primary">
                            <Target className="w-8 h-8" />
                        </div>
                        <h2 className="text-4xl m-0">{t('story.title')}</h2>
                    </div>
                    <p dangerouslySetInnerHTML={{ __html: t.raw('story.p1') }} />
                    <p dangerouslySetInnerHTML={{ __html: t.raw('story.p2') }} />
                </section>

                {/* Values Section */}
                <section className="mb-24">
                    <h2 className="text-4xl font-serif text-foreground mb-12 text-center">{t('values.title')}</h2>
                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="bg-card border border-border p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                            <Shield className="w-12 h-12 text-primary mb-6" />
                            <h3 className="text-2xl font-serif text-foreground mb-4">{t('values.v1.title')}</h3>
                            <p className="text-lg text-muted-foreground font-light leading-relaxed">{t('values.v1.desc')}</p>
                        </div>

                        <div className="bg-card border border-border p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                            <Lightbulb className="w-12 h-12 text-primary mb-6" />
                            <h3 className="text-2xl font-serif text-foreground mb-4">{t('values.v2.title')}</h3>
                            <p className="text-lg text-muted-foreground font-light leading-relaxed">{t('values.v2.desc')}</p>
                        </div>

                        <div className="bg-card border border-border p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                            <Users className="w-12 h-12 text-primary mb-6" />
                            <h3 className="text-2xl font-serif text-foreground mb-4">{t('values.v3.title')}</h3>
                            <p className="text-lg text-muted-foreground font-light leading-relaxed">{t('values.v3.desc')}</p>
                        </div>
                    </div>
                </section>

                {/* Team & Contact Section - EEAT Focus */}
                <section className="bg-stone-900 dark:bg-stone-800 text-white p-10 md:p-16 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10 grid gap-16 md:grid-cols-2">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-serif border-b border-stone-700 pb-4 inline-block">{t('team.title')}</h2>
                            <p className="text-stone-300 font-light text-xl leading-relaxed">
                                {t('team.desc')}
                            </p>
                        </div>
                        <div className="space-y-8">
                            <h2 className="text-3xl font-serif border-b border-stone-700 pb-4 inline-block">{t('contact.title')}</h2>
                            <p className="text-stone-300 font-light text-lg">
                                {t('contact.text')}
                            </p>
                            
                            <div className="space-y-6">
                                <a href={`mailto:${t('contact.email')}`} className="flex items-center gap-4 group">
                                    <div className="bg-stone-800 p-3 rounded-lg group-hover:bg-primary transition-colors">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-stone-500 font-bold">Email</p>
                                        <p className="text-lg group-hover:text-primary transition-colors">{t('contact.email')}</p>
                                    </div>
                                </a>

                                <a href="tel:+34662249327" className="flex items-center gap-4 group">
                                    <div className="bg-stone-800 p-3 rounded-lg group-hover:bg-primary transition-colors">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-stone-500 font-bold">{t('contact.phoneLabel')}</p>
                                        <p className="text-lg group-hover:text-primary transition-colors">{t('contact.phone')}</p>
                                    </div>
                                </a>

                                <div className="flex items-center gap-4">
                                    <div className="bg-stone-800 p-3 rounded-lg text-primary">
                                        <MessageCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-stone-500 font-bold">Respuesta media</p>
                                        <p className="text-lg text-stone-300">Menos de 24 horas</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </article>
        </main>
    );
}
