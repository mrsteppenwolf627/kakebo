import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function SeoContent() {
    const t = useTranslations('Landing.Content');

    return (
        <section className="mx-auto max-w-5xl px-4 py-12 border-t border-border mt-12">
            <div className="prose prose-sm prose-stone dark:prose-invert max-w-none text-muted-foreground">
                <h3 className="text-lg font-serif font-medium text-foreground mb-4">
                    {t('title')}
                </h3>

                <div className="grid gap-8 md:grid-cols-2 mb-12">
                    <article>
                        <h4 className="text-sm font-semibold text-foreground mb-2">{t('article1.title')}</h4>
                        <p className="text-sm font-light leading-relaxed">
                            {t.rich('article1.p', {
                                bold: (chunks) => <strong>{chunks}</strong>
                            })}
                        </p>
                    </article>

                    <article>
                        <h4 className="text-sm font-semibold text-foreground mb-2">{t('article2.title')}</h4>
                        <p className="text-sm font-light leading-relaxed">
                            {t.rich('article2.p', {
                                bold: (chunks) => <strong>{chunks}</strong>
                            })}
                        </p>
                    </article>
                </div>

            </div>
        </section>
    );
}
