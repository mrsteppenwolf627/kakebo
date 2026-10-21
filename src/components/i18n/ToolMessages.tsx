import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

// El layout raíz no envía el namespace `Tools` al navegador (≈7 KB comprimidos en el HTML de cada página).
// Solo las calculadoras lo necesitan en cliente: cada página de herramienta lo entrega con este proveedor,
// limitado a `Tools.Common` (modal de embed) y a las claves que su componente cliente usa de verdad.
// `tools` asocia cada herramienta con `true` (todo su namespace) o con la lista de claves de primer nivel.
export async function ToolMessages({
    locale,
    tools,
    children,
}: {
    locale: string;
    tools: Record<string, readonly string[] | true>;
    children: ReactNode;
}) {
    const all = (await getMessages({ locale })) as { Tools: Record<string, Record<string, unknown>> };
    const picked: Record<string, unknown> = { Common: all.Tools.Common };
    for (const [tool, keys] of Object.entries(tools)) {
        const namespace = all.Tools[tool];
        picked[tool] = keys === true ? namespace : Object.fromEntries(keys.map((key) => [key, namespace[key]]));
    }
    return (
        <NextIntlClientProvider locale={locale} messages={{ Tools: picked }}>
            {children}
        </NextIntlClientProvider>
    );
}
