import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

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
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

        // 1. Create or Retrieve Customer
        let customerId = profile?.stripe_customer_id;

        if (!customerId) {
            const customerData: any = {
                email: user.email,
                metadata: {
                    supabaseUserId: user.id,
                },
            };

            const customer = await stripe.customers.create(customerData);
            customerId = customer.id;

            // UpdateSupabase (We assume webhook will do the heavy lifting, 
            // but syncing ID here is good for speed)
            await supabase
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', user.id);
        }

        // 2. Create Checkout Session
        const priceId = process.env.STRIPE_PRICE_ID_PRO;
        if (!priceId) {
            console.error('❌ Missing STRIPE_PRICE_ID_PRO');
            throw new Error('STRIPE_PRICE_ID_PRO definition is missing in .env');
        }

        console.log(`Creating Checkout Session for Customer: ${customerId} with Price: ${priceId}`);

        const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            billing_address_collection: 'auto',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${origin}/app?success=true`,
            cancel_url: `${origin}/pricing?canceled=true`,
            metadata: {
                supabaseUserId: user.id,
            },
            subscription_data: {
                metadata: {
                    supabaseUserId: user.id,
                },
                trial_period_days: 15,
            }
        });

        console.log('✅ Checkout Session Created:', checkoutSession.id);
        return NextResponse.json({ url: checkoutSession.url });
    } catch (err: any) {
        console.error('❌ Stripe Checkout Error:', err.message);
        console.error('Full Error Object:', JSON.stringify(err, null, 2));
        return new NextResponse(`Internal Error: ${err.message}`, { status: 500 });
    }
}
