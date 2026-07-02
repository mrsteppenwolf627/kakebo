declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

type EventName =
    | "tool_viewed"
    | "tool_interaction"
    | "signup_click"
    | "download_template"
    | "click_cta_login"
    | "click_tool_to_app"
    | "use_savings_calculator"
    | "use_inflation_calculator"
    | "use_503020_calculator";

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
        if (typeof window !== "undefined" && typeof window.gtag === "function") {
            window.gtag("event", name, properties);
        }
    }
}

export const analytics = Analytics.getInstance();
