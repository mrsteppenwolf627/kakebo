/**
 * Test: Reproduce Original Bug
 *
 * Simulates EXACTLY what happened in staging:
 * - User clicked field "Inicio (YYYY-MM)"
 * - User typed: "2026-10"
 * - Form validated
 * - Got error: "start_ym debe ser YYYY-MM"
 *
 * This test uses the ORIGINAL isYm() from commit c3a7300
 */

// ORIGINAL isYm from c3a7300 (what was deployed in Preview)
function isYmOriginal(s) {
  return /^\d{4}-\d{2}$/.test(s);
}

// Simulate validateFixedPayload from c3a7300
function validateFixedPayloadOriginal(args) {
  const nm = args.name.trim();
  const amt = Number(args.amount);
  const sYm = args.start_ym.trim(); // <-- KEY LINE: trim() is called
  const eYm = args.end_ym.trim();

  if (!nm) return { ok: false, message: "Pon un nombre." };
  if (!Number.isFinite(amt) || amt <= 0) return { ok: false, message: "Importe inválido." };
  if (!isYmOriginal(sYm)) return { ok: false, message: "start_ym debe ser YYYY-MM." };
  if (eYm && !isYmOriginal(eYm)) return { ok: false, message: "end_ym debe ser YYYY-MM o vacío." };

  return {
    ok: true,
    data: {
      name: nm,
      amount: amt,
      start_ym: sYm,
      end_ym: eYm ? eYm : null,
    },
  };
}

console.log("ORIGINAL BUG REPRODUCTION TEST\n");
console.log("==============================\n");
console.log("Deployed commit: c3a7300\n");

// Test case: User writes "2026-10" in the form
const testPayload = {
  name: "PRUEBA FIJO 20261006",
  amount: "30",
  start_ym: "2026-10",  // <-- EXACT VALUE USER ENTERED
  end_ym: ""
};

console.log("Test Payload (simulating form submission):");
console.log(JSON.stringify(testPayload, null, 2));
console.log("");

const result = validateFixedPayloadOriginal(testPayload);

console.log("Validation Result:");
console.log(`  ok: ${result.ok}`);
console.log(`  message: "${result.message || 'N/A'}"`);
console.log("");

if (result.ok) {
  console.log("✅ VALIDATION PASSED");
  console.log(`   Stored in DB: start_ym = "${result.data.start_ym}"`);
} else {
  console.log("❌ VALIDATION FAILED");
  console.log(`   Error: ${result.message}`);
}

console.log("\n==============================\n");

// Additional test: What if there were hidden spaces or encoding issues?
console.log("Testing potential edge cases:\n");

const edgeCases = [
  { name: "Normal", value: "2026-10" },
  { name: "With leading space", value: " 2026-10" },
  { name: "With trailing space", value: "2026-10 " },
  { name: "With both spaces", value: " 2026-10 " },
  { name: "Tab character", value: "\t2026-10" },
  { name: "Newline", value: "2026-10\n" },
  { name: "Single digit month", value: "2026-1" },
];

edgeCases.forEach(tc => {
  const payload = {
    name: "TEST",
    amount: "30",
    start_ym: tc.value,
    end_ym: ""
  };
  const res = validateFixedPayloadOriginal(payload);
  console.log(`"${tc.name}": "${tc.value}"`);
  console.log(`  Raw regex test: ${isYmOriginal(tc.value)}`);
  console.log(`  After trim: "${tc.value.trim()}"`);
  console.log(`  After trim regex: ${isYmOriginal(tc.value.trim())}`);
  console.log(`  Validation result: ${res.ok ? "✅ PASS" : "❌ FAIL"}`);
  console.log("");
});
