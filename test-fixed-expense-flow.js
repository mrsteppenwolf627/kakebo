// Test del flujo completo de validación de gastos fijos

function isYm(s) {
  return /^\d{4}-\d{2}$/.test(s);
}

function validateFixedPayload(args) {
  const nm = args.name.trim();
  const amt = Number(args.amount);
  const sYm = args.start_ym.trim();
  const eYm = args.end_ym.trim();

  const errors = [];

  if (!nm) errors.push("Pon un nombre.");
  if (!Number.isFinite(amt) || amt <= 0) errors.push("Importe inválido.");
  if (!isYm(sYm)) errors.push("start_ym debe ser YYYY-MM.");
  if (eYm && !isYm(eYm)) errors.push("end_ym debe ser YYYY-MM o vacío.");
  if (eYm && eYm < sYm) errors.push("end_ym no puede ser anterior a start_ym.");

  return { ok: errors.length === 0, errors };
}

// Test cases: Simulando lo que el usuario escribió
const testCases = [
  {
    name: "Normal case: 2026-10",
    input: { name: "PRUEBA FIJO 20261006", amount: "30", start_ym: "2026-10", end_ym: "" }
  },
  {
    name: "With spaces",
    input: { name: "PRUEBA FIJO 20261006", amount: "30", start_ym: " 2026-10 ", end_ym: "" }
  },
  {
    name: "Empty start_ym",
    input: { name: "PRUEBA FIJO 20261006", amount: "30", start_ym: "", end_ym: "" }
  },
  {
    name: "Invalid format YYYY-M",
    input: { name: "PRUEBA FIJO 20261006", amount: "30", start_ym: "2026-1", end_ym: "" }
  },
  {
    name: "Invalid format MM-YYYY (swapped)",
    input: { name: "PRUEBA FIJO 20261006", amount: "30", start_ym: "10-2026", end_ym: "" }
  },
  {
    name: "Correct with leading zero",
    input: { name: "PRUEBA FIJO 20261006", amount: "30", start_ym: "2026-01", end_ym: "" }
  }
];

console.log("Testing Fixed Expense Validation Flow\n");
console.log("=====================================\n");

testCases.forEach(tc => {
  console.log(`TEST: ${tc.name}`);
  console.log(`Input: start_ym = "${tc.input.start_ym}"`);

  const result = validateFixedPayload(tc.input);

  console.log(`Validation result: ${result.ok ? "✅ PASS" : "❌ FAIL"}`);
  if (result.errors.length > 0) {
    console.log(`Errors: ${result.errors.join(", ")}`);
  }
  console.log("");
});
