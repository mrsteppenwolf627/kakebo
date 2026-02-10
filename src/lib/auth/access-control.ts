import { User } from '@supabase/supabase-js';

export type SubscriptionTier = 'free' | 'pro';

export interface Profile {
    id: string;
    email: string;
    tier: SubscriptionTier;
    trial_ends_at: string | null; // ISO string
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    is_admin?: boolean;
    manual_override?: boolean;
}

/**
 * Determina si un usuario tiene acceso a las funcionalidades Premium.
 * Orden de prioridad:
 * 1. Admin (siempre sí)
 * 2. Manual Override (siempre sí, regalo de owner)
 * 3. Tier 'pro' (pagado)
 * 4. Trial activo (si trial_ends_at > ahora)
 */
export function canUsePremium(profile: Profile | null): boolean {
    if (!profile) return false;

    // 1. Admin
    if (profile.is_admin) return true;

    // 2. Manual Override (Regalo)
    if (profile.manual_override) return true;

    // 3. Suscripción Pro activa
    if (profile.tier === 'pro') return true;

    // 4. Trial
    if (profile.trial_ends_at) {
        const trialEnd = new Date(profile.trial_ends_at);
        const now = new Date();
        // Si la fecha de fin es mayor que ahora, el trial sigue vivo.
        return trialEnd > now;
    }

    // Si no cumple nada, es Free user sin trial.
    return false;
}

/**
 * Alias legacy para compatibilidad con código existente.
 * @deprecated Use canUsePremium instead
 */
export const canUseAI = canUsePremium;

/**
 * Calcula cuántos días de prueba le quedan.
 * Devuelve 0 si ya expiró o no tiene trial.
 */
export function getTrialDaysLeft(profile: Profile | null): number {
    if (!profile || !profile.trial_ends_at) return 0;

    const trialEnd = new Date(profile.trial_ends_at);
    const now = new Date();

    if (trialEnd < now) return 0;

    const diffTime = Math.abs(trialEnd.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}
