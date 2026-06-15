export type SubscriptionTier = 'free' | 'pro';

export interface Profile {
    id: string;
    email: string;
    tier: SubscriptionTier;
    trial_ends_at: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    is_admin?: boolean;
    manual_override?: boolean;
}

// La herramienta es gratuita. Todo usuario autenticado tiene acceso completo.
export function canUsePremium(profile: Profile | null): boolean {
    return profile !== null;
}

export const canUseAI = canUsePremium;

export function getTrialDaysLeft(_profile: Profile | null): number {
    return 0;
}
