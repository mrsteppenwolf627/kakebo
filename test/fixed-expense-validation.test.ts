/**
 * TEST: Fixed Expense Validation — USING REAL SHARED MODULE
 *
 * Imports validation logic directly from src/lib/fixed-expenses/validation.ts
 * This is the SAME code used by the React component in page.tsx
 * No copies, no duplicates — testing the actual implementation.
 */

import { isYm, normalizeYm, parseDueDay } from "../src/lib/fixed-expenses/validation";

// Test cases covering the required scenarios
const testCases = [
  // ✅ Two-digit month (original case)
  { input: "2026-10", expectedOk: true, expectedNorm: "2026-10", desc: "2026-10 (two-digit month)" },

  // ✅ Single-digit month normalization (NEW - was failing before fix)
  { input: "2026-1", expectedOk: true, expectedNorm: "2026-01", desc: "2026-1 → 2026-01 (single-digit normalization)" },

  // ✅ With spaces (should trim)
  { input: " 2026-10 ", expectedOk: true, expectedNorm: "2026-10", desc: "' 2026-10 ' (with spaces)" },
  { input: " 2026-1 ", expectedOk: true, expectedNorm: "2026-01", desc: "' 2026-1 ' (single-digit with spaces)" },

  // ✅ Valid months
  { input: "2026-01", expectedOk: true, expectedNorm: "2026-01", desc: "2026-01 (leading zero)" },
  { input: "2026-12", expectedOk: true, expectedNorm: "2026-12", desc: "2026-12 (December)" },

  // ❌ Invalid months (out of range)
  { input: "2026-0", expectedOk: false, expectedNorm: null, desc: "2026-0 ❌ (month 0, invalid)" },
  { input: "2026-13", expectedOk: false, expectedNorm: null, desc: "2026-13 ❌ (month 13, invalid)" },

  // ❌ Empty input
  { input: "", expectedOk: false, expectedNorm: null, desc: "'' ❌ (empty string)" },

  // ❌ Malformed
  { input: "26-10", expectedOk: false, expectedNorm: null, desc: "'26-10' ❌ (two-digit year)" },
  { input: "2026/10", expectedOk: false, expectedNorm: null, desc: "'2026/10' ❌ (slash separator)" },
];

console.log("🧪 Fixed Expense Validation Tests");
console.log("==================================\n");
console.log("Testing REAL implementation from src/lib/fixed-expenses/validation.ts\n");

let passed = 0;
let failed = 0;

testCases.forEach((tc, idx) => {
  const okResult = isYm(tc.input);
  const normResult = tc.expectedOk ? normalizeYm(tc.input) : null;

  const okMatch = okResult === tc.expectedOk;
  const normMatch = tc.expectedOk ? normResult === tc.expectedNorm : true;
  const testPassed = okMatch && normMatch;

  const status = testPassed ? "✅ PASS" : "❌ FAIL";

  console.log(`${status} #${idx + 1}: ${tc.desc}`);
  console.log(`     Input: "${tc.input}"`);
  console.log(`     isYm: ${okResult} (expected: ${tc.expectedOk})`);
  if (tc.expectedOk) {
    console.log(`     normalize: "${normResult}" (expected: "${tc.expectedNorm}")`);
  }
  console.log("");

  if (testPassed) passed++;
  else failed++;
});

console.log("==================================");
console.log(`Results: ${passed}/${testCases.length} passed`);

if (failed === 0) {
  console.log("\n✅ All tests passed!");
  console.log("\nThe validation logic:");
  console.log("  • Accepts both YYYY-M and YYYY-MM formats");
  console.log("  • Normalizes to YYYY-MM before Supabase insert");
  console.log("  • Validates month range (1-12)");
  console.log("  • Trims whitespace automatically");
  console.log("\nData flow: User Input → isYm() ✅ → normalizeYm() → Supabase");
  process.exit(0);
} else {
  console.log(`\n❌ ${failed} test(s) failed!`);
  process.exit(1);
}
