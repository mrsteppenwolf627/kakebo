// Test YM validation with both regexes

// From FixedExpensesClient.tsx line 84
const clientRegex = /^\d{4}-\d{2}$/;

// From ymSchema in common.ts (via fixed-expense.ts)
const schemaRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

const testValue = "2026-10";

console.log("Test value:", testValue);
console.log("---");
console.log("FixedExpensesClient regex /^\\d{4}-\\d{2}$/:");
console.log("  Result:", clientRegex.test(testValue));
console.log("---");
console.log("ymSchema regex /^\\d{4}-(0[1-9]|1[0-2])$/:");
console.log("  Result:", schemaRegex.test(testValue));
console.log("---");

// Test with other values
const testCases = ["2026-10", "2026-1", "2026-01", "2026-13", "202-10", "2026-1"];
console.log("\nComprehensive test:");
testCases.forEach(val => {
  console.log(`"${val}":`);
  console.log(`  Client: ${clientRegex.test(val)}, Schema: ${schemaRegex.test(val)}`);
});
