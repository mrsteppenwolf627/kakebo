import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Shield, Target, Lightbulb, Users } from "lucide-react";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'About.meta' });

    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
        },
        alternates: {
            canonical: `https://www.metodokakebo.com/${locale === 'es' ? 'es' : 'en'}/sobre-nosotros`,
        },
    };
}

export default async function AboutPage({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'About' });

    return (
        <main className="min-h-screen bg-background pt-24 pb-16">
            <article className="mx-auto max-w-4xl px-4 md:px-6">
                {/* Header section */}
                <header className="mb-16 text-center">
                    <h1 className="text-4xl font-serif md:text-5xl lg:text-6xl text-foreground mb-6">
                        {t('title')} <br />
                        <span className="text-primary">{t('subtitle')}</span>
                    </h1>
                </header>

                {/* Story Section */}
                <section className="mb-20 prose prose-lg prose-stone dark:prose-invert max-w-none">
                    <div className="flex items-center gap-3 mb-6">
                        <Target className="w-8 h-8 text-primary" />
                        <h2 className="text-3xl font-serif m-0">{t('story.title')}</h2>
                    </div>
                    <p dangerouslySetInnerHTML={{ __html: t.raw('story.p1') }} />
                    <p dangerouslySetInnerHTML={{ __html: t.raw('story.p2') }} />
                </section>

                {/* Values Section */}
                <section className="mb-20">
                    <h2 className="text-3xl font-serif text-foreground mb-10 text-center">{t('values.title')}</h2>
                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                            <Shield className="w-10 h-10 text-primary mb-4" />
                            <h3 className="text-xl font-medium text-foreground mb-3">{t('values.v1.title')}</h3>
                            <p className="text-muted-foreground font-light leading-relaxed">{t('values.v1.desc')}</p>
                        </div>

                        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                            <Lightbulb className="w-10 h-10 text-primary mb-4" />
                            <h3 className="text-xl font-medium text-foreground mb-3">{t('values.v2.title')}</h3>
                            <p className="text-muted-foreground font-light leading-relaxed">{t('values.v2.desc')}</p>
                        </div>

                        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                            <Users className="w-10 h-10 text-primary mb-4" />
                            <h3 className="text-xl font-medium text-foreground mb-3">{t('values.v3.title')}</h3>
                            <p className="text-muted-foreground font-light leading-relaxed">{t('values.v3.desc')}</p>
                        </div>
                    </div>
                </section>

                {/* Team & Contact Section */}
                <section className="grid gap-12 md:grid-cols-2 bg-muted/30 p-8 md:p-12 rounded-3xl border border-border">
                    <div>
                        <h2 className="text-2xl font-serif text-foreground mb-4">{t('team.title')}</h2>
                        <p className="text-muted-foreground font-light leading-relaxed mb-6">
                            {t('team.desc')}
                        </p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif text-foreground mb-4">{t('contact.title')}</h2>
                        <p className="text-muted-foreground font-light leading-relaxed mb-4">
                            {t('contact.text')}
                        </p>
                        <a
                            href={`mailto:${t('contact.email')}`}
                            className="inline-flex items-center text-primary font-medium hover:underline underline-offset-4"
                        >
                            {t('contact.email')}
                        </a>
                    </div>
                </section>
            </article>
        </main>
    );
}
