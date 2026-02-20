import type { Metadata } from "next";
import { Navbar, Footer } from "@/components/landing";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import ExpandableImage from "@/components/landing/ExpandableImage";
import { Link } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Tutorial" });

    return {
        title: t("metaTitle"),
        description: t("metaDescription"),
        alternates: { canonical: "/tutorial" },
        openGraph: {
            title: t("metaTitle"),
            description: t("metaDescription"),
            type: "article",
            url: "/tutorial",
        },
        robots: { index: true, follow: true },
    };
}

export default function TutorialPage() {
    const t = useTranslations("Tutorial");

    return (
        <main className="min-h-screen overflow-x-hidden bg-background selection:bg-primary/20">
            <Navbar />

            <article className="pt-24 pb-16">
                <header className="mx-auto w-full max-w-4xl px-4 text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground mb-4">
                        {t('title')}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </header>

                <div className="mx-auto w-full max-w-4xl px-4 grid grid-cols-1 md:grid-cols-[1fr_250px] gap-12 items-start">
                    <div className="prose prose-stone dark:prose-invert prose-lg max-w-none">
                        {/* Sec 1 */}
                        <h2 id="section1" className="scroll-m-24">{t('toc.section1')}</h2>
                        <p>{t('content.s1.p1')}</p>
                        <p>{t('content.s1.p2')}</p>

                        <figure className="my-8 aspect-[16/9] w-full">
                            <ExpandableImage
                                src="/images/tutorial/dashboard-home.png"
                                alt={t('images.img1.alt')}
                                title={t('images.img1.title')}
                            />
                        </figure>

                        {/* Sec 2 */}
                        <h2 id="section2" className="scroll-m-24">{t('toc.section2')}</h2>
                        <p>{t('content.s2.intro')}</p>
                        <ul>
                            <li dangerouslySetInnerHTML={{ __html: t.raw('content.s2.c1') }} />
                            <li dangerouslySetInnerHTML={{ __html: t.raw('content.s2.c2') }} />
                            <li dangerouslySetInnerHTML={{ __html: t.raw('content.s2.c3') }} />
                            <li dangerouslySetInnerHTML={{ __html: t.raw('content.s2.c4') }} />
                        </ul>

                        <figure className="my-8 aspect-[16/9] w-full">
                            <ExpandableImage
                                src="/images/tutorial/dashboard-expenses.png"
                                alt={t('images.img2.alt')}
                                title={t('images.img2.title')}
                            />
                        </figure>

                        {/* Sec 3 */}
                        <h2 id="section3" className="scroll-m-24">{t('toc.section3')}</h2>
                        <p>{t('content.s3.p1')}</p>
                        <ol>
                            <li>{t('content.s3.step1')}</li>
                            <li>{t('content.s3.step2')}</li>
                            <li>{t('content.s3.step3')}</li>
                        </ol>
                        <p>{t('content.s3.p2')}</p>

                        <figure className="my-8 aspect-[16/9] w-full">
                            <ExpandableImage
                                src="/images/tutorial/dashboard-distribution.png"
                                alt={t('images.img3.alt')}
                                title={t('images.img3.title')}
                            />
                        </figure>

                        {/* Sec 4 */}
                        <h2 id="section4" className="scroll-m-24">{t('toc.section4')}</h2>
                        <p>{t('content.s4.p1')}</p>
                        <p>{t('content.s4.p2')}</p>

                        <div className="mt-12 p-8 bg-card border border-border rounded-2xl text-center shadow-lg not-prose">
                            <h3 className="text-2xl font-serif font-bold text-foreground mb-3">¿Listo para empezar a ahorrar?</h3>
                            <p className="text-muted-foreground mb-6">Prueba gratis durante 14 días sin necesidad de tarjeta de crédito.</p>
                            <Link href="/login" className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 transition-opacity shadow-sm">
                                Crea tu cuenta ahora
                            </Link>
                        </div>

                    </div>

                    {/* Sticky TOCSidebar */}
                    <aside className="sticky top-24 hidden md:block">
                        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <h3 className="font-semibold text-foreground mb-4">{t('toc.title')}</h3>
                            <nav className="space-y-3 text-sm">
                                <a href="#section1" className="block text-muted-foreground hover:text-foreground transition-colors">
                                    {t('toc.section1')}
                                </a>
                                <a href="#section2" className="block text-muted-foreground hover:text-foreground transition-colors">
                                    {t('toc.section2')}
                                </a>
                                <a href="#section3" className="block text-muted-foreground hover:text-foreground transition-colors">
                                    {t('toc.section3')}
                                </a>
                                <a href="#section4" className="block text-muted-foreground hover:text-foreground transition-colors">
                                    {t('toc.section4')}
                                </a>
                            </nav>
                        </div>
                    </aside>
                </div>
            </article>

            <Footer />
        </main>
    );
}
