/**
 * Script para probar la API desde la consola del navegador
 *
 * Instrucciones:
 * 1. Inicia el servidor: npm run dev
 * 2. Abre http://localhost:3000 y haz login
 * 3. Abre la consola del navegador (F12 → Console)
 * 4. Copia y pega este script
 * 5. Ejecuta: await testAPI()
 */

async function testAPI() {
  const BASE = '/api';
  const results = [];

  async function test(name, method, path, body = null) {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(BASE + path, options);
      const data = await res.json();

      const result = {
        name,
        status: res.status,
        success: data.success,
        data: data.success ? data.data : data.error,
      };
      results.push(result);
      console.log(`${data.success ? '✅' : '❌'} ${name}:`, result);
      return data;
    } catch (err) {
      console.error(`💥 ${name}:`, err);
      results.push({ name, error: err.message });
      return null;
    }
  }

  console.log('🚀 Iniciando tests de API...\n');

  // Health
  await test('Health Check', 'GET', '/health');

  // Settings
  console.log('\n📋 SETTINGS');
  await test('GET Settings', 'GET', '/settings');
  await test('PATCH Settings (income)', 'PATCH', '/settings', { monthly_income: 2500 });

  // Months
  console.log('\n📅 MONTHS');
  await test('GET Months', 'GET', '/months');
  const monthRes = await test('POST Month (get-or-create)', 'POST', '/months', { ym: '2025-01' });
  const monthId = monthRes?.data?.id;

  // Expenses
  console.log('\n💰 EXPENSES');
  await test('GET Expenses', 'GET', '/expenses?ym=2025-01');

  // Test validación
  await test('POST Expense (invalid date)', 'POST', '/expenses', {
    date: 'invalid',
    amount: 100,
    category: 'survival'
  });

  await test('POST Expense (negative amount)', 'POST', '/expenses', {
    date: '2025-01-15',
    amount: -50,
    category: 'survival'
  });

  await test('POST Expense (invalid category)', 'POST', '/expenses', {
    date: '2025-01-15',
    amount: 50,
    category: 'invalid'
  });

  // Crear gasto válido
  const expenseRes = await test('POST Expense (válido)', 'POST', '/expenses', {
    date: '2025-01-15',
    amount: 25.50,
    category: 'culture',
    note: 'Test desde script'
  });
  const expenseId = expenseRes?.data?.id;

  if (expenseId) {
    await test('GET Expense by ID', 'GET', `/expenses/${expenseId}`);
    await test('PATCH Expense', 'PATCH', `/expenses/${expenseId}`, { amount: 30 });
    await test('DELETE Expense', 'DELETE', `/expenses/${expenseId}`);
  }

  // Fixed Expenses
  console.log('\n📌 FIXED EXPENSES');
  await test('GET Fixed Expenses', 'GET', '/fixed-expenses');

  const fixedRes = await test('POST Fixed Expense', 'POST', '/fixed-expenses', {
    name: 'Test Alquiler',
    amount: 800,
    category: 'survival',
    start_ym: '2025-01',
    due_day: 5
  });
  const fixedId = fixedRes?.data?.id;

  if (fixedId) {
    await test('GET Fixed Expense by ID', 'GET', `/fixed-expenses/${fixedId}`);
    await test('PATCH Fixed Expense', 'PATCH', `/fixed-expenses/${fixedId}`, { amount: 850 });
    await test('DELETE Fixed Expense', 'DELETE', `/fixed-expenses/${fixedId}`);
  }

  // Resumen
  console.log('\n📊 RESUMEN');
  const passed = results.filter(r => r.success === true || r.status === 204).length;
  const failed = results.filter(r => r.success === false && r.status !== 422 && r.status !== 409).length;
  const validationErrors = results.filter(r => r.status === 422).length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️ Validation errors (expected): ${validationErrors}`);

  return results;
}

// Exportar para uso
if (typeof window !== 'undefined') {
  window.testAPI = testAPI;
  console.log('💡 Script cargado. Ejecuta: await testAPI()');
}
