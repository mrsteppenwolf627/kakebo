import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';

// Manual .env.local parser
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('❌ .env.local file not found');
            return {};
        }
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const env: Record<string, string> = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (error) {
        console.error('❌ Error loading .env.local:', error);
        return {};
    }
}

const env = loadEnv();
const stripeKey = env.STRIPE_SECRET_KEY;
const priceId = env.STRIPE_PRICE_ID_PRO;

if (!stripeKey) {
    console.error('❌ STRIPE_SECRET_KEY is missing in .env.local');
    process.exit(1);
}

const stripe = new Stripe(stripeKey, {
    apiVersion: '2026-01-28.clover' as any, // Cast to any to avoid strict type checks on version
});

async function testConnection() {
    try {
        console.log('Testing Stripe connection...');
        const products = await stripe.products.list({ limit: 1 });
        console.log('✅ Connection successful!');
        console.log(`Found ${products.data.length} products (showing 1).`);

        if (priceId) {
            try {
                const price = await stripe.prices.retrieve(priceId);
                console.log(`✅ Price ID ${priceId} is valid (${price.unit_amount! / 100} ${price.currency.toUpperCase()})`);
            } catch (e: any) {
                console.error(`❌ Invalid STRIPE_PRICE_ID_PRO: ${e.message}`);
                console.log('Ensure you copied the Price ID (price_...) and not the Product ID (prod_...)');
            }
        } else {
            console.warn('⚠️ STRIPE_PRICE_ID_PRO is missing, checkout will fail.');
        }

    } catch (error: any) {
        console.error('❌ Stripe connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
