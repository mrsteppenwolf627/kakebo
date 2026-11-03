// Mensajes que el layout raíz envía al navegador (NextIntlClientProvider). Todo lo que se envía viaja dos veces en el
// HTML (marcado + payload de Flight), así que solo se incluye lo que algún componente cliente lee con useTranslations.
// Los namespaces de esta lista los consumen únicamente componentes de servidor (getTranslations / useTranslations sin
// "use client"), que leen los mensajes del servidor. `Tools` lo entrega ToolMessages en cada página de herramienta.
// El test src/__tests__/i18n/client-messages.test.ts impide que un componente cliente use un namespace excluido.
export const SERVER_ONLY_NAMESPACES = [
    "Tools",
    "Landing",
    "Tutorial",
    "Terms",
    "Privacy",
    "Cookies",
    "Layout",
    "Features",
    "Hero",
    "Blog",
    "NotFound",
    "Common",
    "CategoryGuide",
] as const;

// De `About` solo se usa `About.contact` en cliente (StripeSuccessHandler).
const PARTIAL_NAMESPACES: Record<string, readonly string[]> = { About: ["contact"] };

export function pickClientMessages(all: Record<string, unknown>): Record<string, unknown> {
    const picked: Record<string, unknown> = {};
    for (const [namespace, value] of Object.entries(all)) {
        if ((SERVER_ONLY_NAMESPACES as readonly string[]).includes(namespace)) continue;
        const partial = PARTIAL_NAMESPACES[namespace];
        picked[namespace] = partial
            ? Object.fromEntries(partial.map((key) => [key, (value as Record<string, unknown>)[key]]))
            : value;
    }
    return picked;
}
