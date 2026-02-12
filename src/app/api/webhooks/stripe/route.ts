import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    // 1. Validate signature
    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error("Missing STRIPE_WEBHOOK_SECRET");
        }
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
        console.log(`✅ Webhook verified: ${event.type}`);
    } catch (error: any) {
        console.error(`❌ Webhook Signature Error: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    // Use Admin Client to bypass RLS
    const supabase = createAdminClient();

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                console.log(`Processing checkout.session.completed for session: ${session.id}`);

                // Try to get userId from session metadata first (most reliable)
                let userId = session.metadata?.supabaseUserId;

                // Fallback: Check subscription metadata if not in session
                if (!userId && session.subscription) {
                    console.log('Fetching subscription for metadata fallback...');
                    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                    userId = subscription.metadata?.supabaseUserId;
                }

                console.log(`Found User ID: ${userId}`);

                if (userId) {
                    const { error } = await supabase
                        .from('profiles')
                        .update({
                            tier: 'pro',
                            stripe_customer_id: session.customer as string,
                            stripe_subscription_id: session.subscription as string,
                        })
                        .eq('id', userId);

                    if (error) {
                        console.error('❌ Failed to update profile in Supabase:', error);
                    } else {
                        console.log('✅ User profile updated to PRO');
                    }
                } else {
                    console.error('❌ No supabaseUserId found in session or subscription metadata');
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                console.log(`Processing invoice.payment_succeeded for invoice: ${invoice.id}`);

                // Usually for recurring payments, but also fires on first payment (if immediately paid)
                // For trials, the first invoice might be $0 but still 'paid'

                // Handle subscription ID - invoice may have subscription as string or object
                // TypeScript types may be incomplete, so we use type assertion
                const invoiceWithSub = invoice as any;
                const subscriptionId = typeof invoiceWithSub.subscription === 'string'
                    ? invoiceWithSub.subscription
                    : invoiceWithSub.subscription?.id || null;

                if (!subscriptionId) break;

                // We need to find the user by subscription ID or customer ID
                // Since we don't know the user ID here easily unless we query stripe or DB

                // Option 1: Trust that checkout.session.completed handled the initial setup
                // Option 2: If we have the subscription, we can check metadata

                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const userId = subscription.metadata?.supabaseUserId;

                if (userId) {
                    await supabase.from('profiles').update({ tier: 'pro', stripe_subscription_id: subscriptionId }).eq('id', userId);
                    console.log(`✅ Refreshed PRO status for user ${userId} via invoice`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                console.log(`Processing subscription deleted: ${subscription.id}`);

                const { error } = await supabase
                    .from('profiles')
                    .update({ tier: 'free', stripe_subscription_id: null })
                    .eq('stripe_subscription_id', subscription.id);

                if (error) {
                    console.error('❌ Failed to revert user to FREE:', error);
                } else {
                    console.log('✅ User reverted to FREE');
                }
                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error: any) {
        console.error('❌ Error processing webhook logic:', error);
        return new NextResponse('Webhook handler failed', { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
}
