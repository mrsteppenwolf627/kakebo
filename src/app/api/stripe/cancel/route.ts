import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_subscription_id, tier')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return new NextResponse('Profile not found', { status: 404 });
        }

        // Cancel Stripe subscription if it exists
        if (profile.stripe_subscription_id) {
            await stripe.subscriptions.cancel(profile.stripe_subscription_id);
        }

        // Always downgrade locally to ensure consistency
        const adminSupabase = createAdminClient();
        await adminSupabase
            .from('profiles')
            .update({ tier: 'free', stripe_subscription_id: null })
            .eq('id', user.id);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Stripe Cancel Error:', err);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
