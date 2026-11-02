/**
 * Test: Browser Input Simulation
 *
 * Simulate what happens in React when user types into the input field
 */

// React state management simulation
class FormState {
  constructor() {
    this.name = "";
    this.amount = "";
    this.startYm = ""; // Starts empty or with currentYm()
    this.endYm = "";
  }

  // Simulate onChange events
  setName(value) {
    this.name = value;
  }

  setAmount(value) {
    this.amount = value;
  }

  setStartYm(value) {
    this.startYm = value; // This is what onChange captures
  }

  setEndYm(value) {
    this.endYm = value;
  }

  toString() {
    return JSON.stringify({
      name: this.name,
      amount: this.amount,
      start_ym: this.startYm,
      end_ym: this.endYm
    }, null, 2);
  }
}

// Original validator from c3a7300
function isYmOriginal(s) {
  return /^\d{4}-\d{2}$/.test(s);
}

function validateOriginal(form) {
  const sYm = form.startYm.trim();
  if (!isYmOriginal(sYm)) {
    return { ok: false, error: "start_ym debe ser YYYY-MM." };
  }
  return { ok: true };
}

console.log("BROWSER INPUT SIMULATION\n");
console.log("========================\n");

// Scenario 1: User types "2026-10"
console.log("SCENARIO 1: User types '2026-10'\n");

const form1 = new FormState();
form1.setName("PRUEBA FIJO 20261006");
form1.setAmount("30");

// Simulate typing: "2", "0", "2", "6", "-", "1", "0"
form1.setStartYm("2");        // After 1st char
form1.setStartYm("20");       // After 2nd char
form1.setStartYm("202");      // After 3rd char
form1.setStartYm("2026");     // After 4th char
form1.setStartYm("2026-");    // After hyphen
form1.setStartYm("2026-1");   // After "1"
console.log("After typing '2026-1':");
console.log("  form.startYm =", form1.startYm);
console.log("  Validation:", validateOriginal(form1));
console.log("");

form1.setStartYm("2026-10");  // After "0"
console.log("After typing '2026-10' (complete):");
console.log("  form.startYm =", form1.startYm);
console.log("  Validation:", validateOriginal(form1));
console.log("");

// Scenario 2: Simulate paste action
console.log("SCENARIO 2: User pastes '2026-10'\n");

const form2 = new FormState();
form2.setName("PRUEBA FIJO 20261006");
form2.setAmount("30");
form2.setStartYm("2026-10");

console.log("After paste:");
console.log("  form.startYm =", form2.startYm);
console.log("  Validation:", validateOriginal(form2));
console.log("");

// Scenario 3: Browser devtools inspection - what if React state is out of sync?
console.log("SCENARIO 3: What if React state didn't update correctly?\n");

const form3 = new FormState();
form3.setName("PRUEBA FIJO 20261006");
form3.setAmount("30");
// User clicked field and typed, but React state never got updated
form3.setStartYm(""); // State is still empty!

console.log("If React state didn't capture the input:");
console.log("  form.startYm =", `"${form3.startYm}"` || "(empty)");
console.log("  Validation:", validateOriginal(form3));
console.log("");

// Scenario 4: What does Supabase insert look like?
console.log("SCENARIO 4: What gets sent to Supabase?\n");

const payload = {
  user_id: "uuid-here",
  name: form1.name.trim(),
  amount: Number(form1.amount),
  active: true,
  start_ym: form1.startYm.trim(),
  end_ym: form1.endYm.trim() || null,
};

console.log("Supabase.insert() payload:");
console.log(JSON.stringify(payload, null, 2));
