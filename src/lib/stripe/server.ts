import Stripe from 'stripe';

// Evitamos romper el build si falta la variable (el usuario la pondrá luego)
const stripeKey = process.env.STRIPE_SECRET_KEY ?? 'sk_test_dummy_key_for_build';

export const stripe = new Stripe(stripeKey, {
    apiVersion: '2026-01-28.clover', // Usamos una versión estable conocida o removemos si da error
    appInfo: {
        name: 'Kakebo AI',
        version: '0.1.0',
    },
    typescript: true,
});
