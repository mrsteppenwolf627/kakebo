import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function expireUser(email: string) {
    if (!email) {
        console.error('❌ Please provide an email: npx tsx scripts/expire-user.ts <email>');
        process.exit(1);
    }

    console.log(`Searching for user: ${email}...`);

    // 1. Get User ID from Auth
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error('❌ Auth Error:', userError.message);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('❌ User not found in Auth system.');
        return;
    }

    console.log(`Found User ID: ${user.id}`);

    // 2. Update Profile to expire trial
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            trial_ends_at: yesterday.toISOString(),
            tier: 'free' // Ensure they drop to free
        })
        .eq('id', user.id);

    if (updateError) {
        console.error('❌ Failed to update profile:', updateError.message);
    } else {
        console.log(`✅ User ${email} expired! Trial set to yesterday.`);
        console.log('👉 Refresh the app. You should now see the "Upgrade" banner or be locked out of premium features.');
    }
}

const emailArg = process.argv[2];
expireUser(emailArg);
