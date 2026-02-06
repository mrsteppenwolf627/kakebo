import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error("Missing STRIPE_WEBHOOK_SECRET");
        }
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error: any) {
        console.error(`Webhook Error: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const supabase = await createClient();

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                // Retrieve the subscription details from Stripe.
                const subscription = await stripe.subscriptions.retrieve(
                    session.subscription as string
                );

                // We stored supabaseUserId in metadata during checkout creation
                // If not there, checking customer metadata is a fallback
                const userId = session.metadata?.supabaseUserId ||
                    subscription.metadata?.supabaseUserId;

                if (userId) {
                    await supabase
                        .from('profiles')
                        .update({
                            tier: 'pro',
                            stripe_customer_id: session.customer as string,
                            stripe_subscription_id: subscription.id,
                            // Clean up trial related info or update it appropriately if needed
                        })
                        .eq('id', userId);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                // Logic to reverse access
                // Ideally we find user by stripe_subscription_id or customer_id
                await supabase
                    .from('profiles')
                    .update({ tier: 'free', stripe_subscription_id: null })
                    .eq('stripe_subscription_id', subscription.id);
                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error: any) {
        console.error('Error processing webhook logic:', error);
        return new NextResponse('Webhook handler failed', { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
}
