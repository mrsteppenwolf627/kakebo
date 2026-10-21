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

    public track(name: EventName, properties: EventProperties = {}) {
        if (this.isDev) {
            console.log(`[Analytics] ${name}`, properties);
        }
        if (typeof window === "undefined" || !analyticsAllowed()) return;
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
    }
}

export const analytics = Analytics.getInstance();
