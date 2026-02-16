type EventName =
    | "tool_viewed"
    | "tool_interaction"
    | "signup_click";

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
        // 1. Log to Console in Development
        if (this.isDev) {
            console.log(`[Analytics] ${name}`, properties);
        }

        // 2. Future: Send to Supabase 'events' table
        // await supabase.from('events').insert({ name, properties, user_id: ... })

        // 3. Future: Send to Google Analytics / Plausible
        // if (window.gtag) window.gtag('event', name, properties);
    }
}

export const analytics = Analytics.getInstance();
