"use client";

import { useEffect, useState } from "react";
import { loadSettings, saveSettings } from "@/lib/storage";
import type { Settings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    monthlyIncome: 0,
    savingsGoal: 0,
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function handleSave() {
    saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000); // Ocultar mensaje a los 2s
  }

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Ajustes</h1>
        <p className="text-muted-foreground mt-1">Configura tus objetivos financieros</p>
      </header>

      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        
        {/* Ingresos */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Ingresos mensuales fijos (€)
          </label>
          <div className="relative">
            <input
              type="number"
              className="w-full border-gray-200 rounded-xl p-4 text-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
              value={settings.monthlyIncome}
              onChange={(e) =>
                setSettings({ ...settings, monthlyIncome: Number(e.target.value) })
              }
            />
            <div className="absolute right-4 top-4 text-gray-400 font-medium">EUR</div>
          </div>
          <p className="text-xs text-gray-500">
            Tu base para calcular el ahorro. Puedes cambiarlo cada mes.
          </p>
        </div>

        <hr className="border-gray-100" />

        {/* Objetivo Ahorro */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Objetivo de ahorro mensual (€)
          </label>
          <div className="relative">
            <input
              type="number"
              className="w-full border-gray-200 rounded-xl p-4 text-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
              value={settings.savingsGoal}
              onChange={(e) =>
                setSettings({ ...settings, savingsGoal: Number(e.target.value) })
              }
            />
            <div className="absolute right-4 top-4 text-gray-400 font-medium">EUR</div>
          </div>
          <p className="text-xs text-gray-500">
            Kakebo te avisará visualmente según te acerques a este límite.
          </p>
        </div>

        {/* Botón Guardar */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 ${
              isSaved ? "bg-green-600 hover:bg-green-700" : "bg-black hover:bg-gray-800"
            }`}
          >
            {isSaved ? "¡Guardado con éxito!" : "Guardar Cambios"}
          </button>
        </div>
      </section>

      {/* Zona de Peligro (Futuro: Borrar datos) */}
      <section className="p-6 border border-red-100 bg-red-50/30 rounded-2xl">
        <h3 className="text-red-600 font-semibold mb-2">Zona de Datos</h3>
        <p className="text-sm text-gray-600 mb-4">
          Actualmente tus datos solo se guardan en este navegador.
        </p>
        <button 
          onClick={() => {
            if(confirm("¿Estás seguro? Esto borrará todos tus gastos.")) {
              localStorage.clear();
              window.location.href = "/";
            }
          }}
          className="text-xs text-red-500 underline hover:text-red-700"
        >
          Borrar todos mis datos y empezar de cero
        </button>
      </section>
    </main>
  );
}