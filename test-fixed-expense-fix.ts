/**
 * Test: Fixed Expense Validation Fix
 *
 * Issue: validateFixedPayload rejected "2026-10" with error "start_ym debe ser YYYY-MM"
 * Root Cause: The original regex was too strict. We now accept YYYY-M and YYYY-MM, normalizing to YYYY-MM
 *
 * Fix: Updated isYm() to accept both formats, added normalizeYm() to convert
 */

function isYm(s: string): boolean {
  const trimmed = s.trim();
  if (!trimmed) return false;

  const match = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return false;

  const month = parseInt(match[2], 10);
  return month >= 1 && month <= 12;
}

function normalizeYm(s: string): string {
  const trimmed = s.trim();
  const match = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return trimmed;

  const year = match[1];
  const month = match[2].padStart(2, "0");
  return `${year}-${month}`;
}

// Test cases
const testCases = [
  { input: "2026-10", expectedOk: true, expectedNorm: "2026-10", desc: "Original failing case" },
  { input: "2026-1", expectedOk: true, expectedNorm: "2026-01", desc: "Single-digit month should now work" },
  { input: " 2026-10 ", expectedOk: true, expectedNorm: "2026-10", desc: "With spaces should be trimmed" },
  { input: "2026-01", expectedOk: true, expectedNorm: "2026-01", desc: "Leading zero should work" },
  { input: "2026-0", expectedOk: false, expectedNorm: null, desc: "Month 0 is invalid" },
  { input: "2026-13", expectedOk: false, expectedNorm: null, desc: "Month 13 is invalid" },
  { input: "2026", expectedOk: false, expectedNorm: null, desc: "Missing month is invalid" },
  { input: "", expectedOk: false, expectedNorm: null, desc: "Empty string is invalid" },
];

console.log("Testing Fixed Expense YM Validation Fix\n");
console.log("========================================\n");

let passed = 0;
let failed = 0;

testCases.forEach(tc => {
  const okResult = isYm(tc.input);
  const normResult = tc.expectedOk ? normalizeYm(tc.input) : null;

  const okMatch = okResult === tc.expectedOk;
  const normMatch = tc.expectedOk ? normResult === tc.expectedNorm : true;

  const status = (okMatch && normMatch) ? "✅ PASS" : "❌ FAIL";

  console.log(`${status} - ${tc.desc}`);
  console.log(`  Input: "${tc.input}"`);
  console.log(`  isYm: ${okResult} (expected ${tc.expectedOk})`);
  if (tc.expectedOk) {
    console.log(`  normalize: "${normResult}" (expected "${tc.expectedNorm}")`);
  }
  console.log("");

  if (okMatch && normMatch) passed++;
  else failed++;
});

console.log("========================================");
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log("\n✅ All tests passed! The fix is working correctly.");
} else {
  console.log(`\n❌ ${failed} test(s) failed. Review the logic.`);
  process.exit(1);
}
