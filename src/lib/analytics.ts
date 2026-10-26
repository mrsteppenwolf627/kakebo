import { analyticsAllowed } from "@/lib/consent";

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
        dataLayer?: unknown[];
    }
}

type EventName =
    | "tool_viewed"
    | "tool_interaction"
    | "signup_click"
    | "login_view"
    | "sign_up"
    | "sign_up_confirmed"
    | "download_template"
    | "click_cta_login"
    | "click_tool_to_app"
    | "click_excel_to_app"
    | "expense_created"
    | "first_expense_created"
    | "use_savings_calculator"
    | "use_inflation_calculator"
    | "use_503020_calculator"
    | "savings_calculator_calculate"
    | "savings_calculator_goal_result"
    | "inflation_calculator_mode_change"
    | "historical_inflation_calculation"
    | "historical_inflation_error"
    | "premium_product_viewed"
    | "premium_product_cta_clicked";

type EventProperties = Record<string, string | number | boolean>;

// Contrato de privacidad de la calculadora de ahorro: sus eventos solo pueden llevar estos parámetros
// (y `source` únicamente en el CTA). Cualquier otro se descarta aquí, aunque un cambio futuro lo añada.
const SAVINGS_EVENTS = new Set<string>([
    "use_savings_calculator",
    "savings_calculator_calculate",
    "savings_calculator_goal_result",
]);
const SAVINGS_TOOL_NAME = "calculadora_ahorro";

export function sanitizeSavingsCalculatorProperties(name: string, properties: EventProperties): EventProperties {
    if (!SAVINGS_EVENTS.has(name) && properties.tool_name !== SAVINGS_TOOL_NAME) return properties;
    const allowed = new Set(["tool_name", "page_path", "page_title"]);
    if (name === "click_tool_to_app") allowed.add("source");
    return Object.fromEntries(Object.entries(properties).filter(([key]) => allowed.has(key)));
}

class Analytics {
    private static instance: Analytics;
    private isDev: boolean;

    private constructor() {
        this.isDev = process.env.NODE_ENV === "development";
    }

    public static getInstance(): Analytics {
        if (!Analytics.instance) {
            Analytics.instance = new Analytics();
        }
        return Analytics.instance;
    }

    // Devuelve true solo si el evento se ha entregado a gtag (hay consentimiento). Así quien lo llama puede
    // marcar un evento "una vez" únicamente cuando realmente se envió.
    public track(name: EventName, properties: EventProperties = {}): boolean {
        properties = sanitizeSavingsCalculatorProperties(name, properties);
        if (this.isDev) {
            console.log(`[Analytics] ${name}`, properties);
        }
        if (typeof window === "undefined" || !analyticsAllowed()) return false;
        // Con consentimiento, gtag.js puede no haberse cargado todavía (p. ej. tool_viewed al hidratar).
        // Se crea el mismo stub que el script de inicialización: encola en dataLayer y gtag.js lo procesa al cargar.
        if (typeof window.gtag !== "function") {
            window.dataLayer = window.dataLayer || [];
            window.gtag = function () {
                // gtag.js solo procesa objetos `arguments`, no arrays.
                // eslint-disable-next-line prefer-rest-params
                window.dataLayer!.push(arguments);
            };
        }
        window.gtag("event", name, properties);
        return true;
    }
}

export const analytics = Analytics.getInstance();
