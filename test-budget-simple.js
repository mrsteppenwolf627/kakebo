// Simple test to check what getBudgetStatus returns
// Run with: node test-budget-simple.js

const fetch = require('node:fetch');

async function testBudget() {
    console.log('🔍 Testing budget endpoint...\n');

    try {
        // This will fail with 401 but we can see the structure
        const response = await fetch('http://localhost:3000/api/ai/agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: '¿Cómo voy de presupuesto?',
                history: []
            })
        });

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testBudget();
