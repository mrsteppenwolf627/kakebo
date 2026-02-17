"use client";

import { useTranslations } from "next-intl";

export function AlternativesSection() {
    const t = useTranslations("Alternatives");

    return (
        <section id="alternatives" className="py-24 bg-background">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center mb-16">
                    <h2 className="text-3xl font-serif font-medium text-foreground sm:text-4xl">
                        {t("title")}
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        {t("subtitle")}
                    </p>
                </div>

                <div className="overflow-hidden border border-border rounded-2xl shadow-sm">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th scope="col" className="py-4 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">
                                    {t("table.headers.feature")}
                                </th>
                                <th scope="col" className="px-3 py-4 text-center text-sm font-semibold text-primary bg-primary/5">
                                    {t("table.headers.kakebo")}
                                </th>
                                <th scope="col" className="px-3 py-4 text-center text-sm font-semibold text-muted-foreground">
                                    {t("table.headers.excel")}
                                </th>
                                <th scope="col" className="px-3 py-4 text-center text-sm font-semibold text-muted-foreground">
                                    {t("table.headers.apps")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            <tr>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                    {t("table.rows.privacy.feature")}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-foreground bg-primary/5 font-medium">
                                    {t("table.rows.privacy.kakebo")}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-muted-foreground">
                                    {t("table.rows.privacy.excel")}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-foreground">
                                    {t("table.rows.privacy.apps")}
                                </td>
                            </tr>
                            <tr>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                    {t("table.rows.ai.feature")}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-foreground bg-primary/5 font-medium">
                                    {t("table.rows.ai.kakebo")}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-muted-foreground">
                                    {t("table.rows.ai.excel")}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-muted-foreground">
                                    {t("table.rows.ai.apps")}
                                </td>
                            </tr>
                            <tr>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                    {t("table.rows.method.feature")}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-foreground bg-primary/5 font-medium">
                                    {t("table.rows.method.kakebo")}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-muted-foreground">
                                    {t("table.rows.method.excel")}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-muted-foreground">
                                    {t("table.rows.method.apps")}
                                </td>
                            </tr>
                            <tr>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                    {t("table.rows.ux.feature")}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-foreground bg-primary/5 font-medium">
                                    {t("table.rows.ux.kakebo")}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-muted-foreground">
                                    {t("table.rows.ux.excel")}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-foreground">
                                    {t("table.rows.ux.apps")}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
