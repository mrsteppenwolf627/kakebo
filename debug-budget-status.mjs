/**
 * Debug script to test getBudgetStatus tool directly
 * Run with: node --loader tsx debug-budget-status.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { getBudgetStatus } from './src/lib/agents/tools/budget-status.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Replace with your actual user ID
const userId = 'YOUR_USER_ID_HERE';

async function testBudgetStatus() {
    console.log('🔍 Testing getBudgetStatus...\n');

    try {
        const result = await getBudgetStatus(supabase, userId, {
            month: '2026-02'
        });

        console.log('✅ Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testBudgetStatus();
