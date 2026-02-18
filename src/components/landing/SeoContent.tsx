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

                {/* Comparison Table for SEO */}
                <div className="mb-12 overflow-x-auto">
                    <h4 className="text-sm font-semibold text-foreground mb-4">{t('table.title')}</h4>
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="py-2 font-medium text-foreground">{t('table.headers.feature')}</th>
                                <th className="py-2 font-medium text-primary">{t('table.headers.kakebo')}</th>
                                <th className="py-2 font-medium text-muted-foreground">{t('table.headers.excel')}</th>
                                <th className="py-2 font-medium text-muted-foreground">{t('table.headers.apps')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-border/50">
                                <td className="py-2 text-foreground">{t('table.rows.auto.feature')}</td>
                                <td className="py-2">{t('table.rows.auto.kakebo')}</td>
                                <td className="py-2">{t('table.rows.auto.excel')}</td>
                                <td className="py-2">{t('table.rows.auto.apps')}</td>
                            </tr>
                            <tr className="border-b border-border/50">
                                <td className="py-2 text-foreground">{t('table.rows.method.feature')}</td>
                                <td className="py-2">{t('table.rows.method.kakebo')}</td>
                                <td className="py-2">{t('table.rows.method.excel')}</td>
                                <td className="py-2">{t('table.rows.method.apps')}</td>
                            </tr>
                            <tr className="border-b border-border/50">
                                <td className="py-2 text-foreground">{t('table.rows.privacy.feature')}</td>
                                <td className="py-2">{t('table.rows.privacy.kakebo')}</td>
                                <td className="py-2">{t('table.rows.privacy.excel')}</td>
                                <td className="py-2">{t('table.rows.privacy.apps')}</td>
                            </tr>
                            <tr>
                                <td className="py-2 text-foreground">{t('table.rows.mobile.feature')}</td>
                                <td className="py-2">{t('table.rows.mobile.kakebo')}</td>
                                <td className="py-2">{t('table.rows.mobile.excel')}</td>
                                <td className="py-2">{t('table.rows.mobile.apps')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex flex-wrap gap-4 text-xs opacity-60">
                    {t('tags')}
                </div>
            </div>
        </section>
    );
}
