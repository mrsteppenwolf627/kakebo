"use client";

import { useEffect, useState } from "react";
import { loadSettings, saveSettings } from "@/lib/storage";
import type { Settings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    monthlyIncome: 0,
    savingsGoal: 0,
  });

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function handleSave() {
    saveSettings(settings);
    alert("Ajustes guardados.");
  }

  return (
    <main className="min-h-screen p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>

      <div className="space-y-2">
        <label className="block text-sm">Ingresos mensuales (€)</label>
        <input
          type="number"
          className="w-full border rounded-lg p-2"
          value={settings.monthlyIncome}
          onChange={(e) =>
            setSettings({ ...settings, monthlyIncome: Number(e.target.value) })
          }
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm">Objetivo de ahorro (€)</label>
        <input
          type="number"
          className="w-full border rounded-lg p-2"
          value={settings.savingsGoal}
          onChange={(e) =>
            setSettings({ ...settings, savingsGoal: Number(e.target.value) })
          }
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-black text-white rounded-lg p-2 hover:opacity-90"
      >
        Guardar ajustes
      </button>
    </main>
  );
}
