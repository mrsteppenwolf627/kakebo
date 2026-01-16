import type { Settings, Transaction } from "./types";

const SETTINGS_KEY = "kakebo:settings";
const TX_KEY = "kakebo:transactions";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") {
    return { monthlyIncome: 0, savingsGoal: 0 };
  }
  return safeParse<Settings>(localStorage.getItem(SETTINGS_KEY), {
    monthlyIncome: 0,
    savingsGoal: 0,
  });
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  return safeParse<Transaction[]>(localStorage.getItem(TX_KEY), []);
}

export function saveTransactions(txs: Transaction[]) {
  localStorage.setItem(TX_KEY, JSON.stringify(txs));
}
