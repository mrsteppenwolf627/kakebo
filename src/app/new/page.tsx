"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadTransactions, saveTransactions } from "@/lib/storage";
import { CATEGORY_LABEL, type Category, type Transaction } from "@/lib/types";

export default function NewTransactionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "general" as Category,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // 1. Validar
    if (!formData.description || !formData.amount) return;

    // 2. Crear objeto transacción
    const newTx: Transaction = {
      // Usamos crypto.randomUUID() que es nativo del navegador (sin librerías extra)
      id: crypto.randomUUID(), 
      date: new Date().toISOString().split('T')[0], // Fecha de hoy YYYY-MM-DD
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
    };

    // 3. Guardar en localStorage
    const currentTxs = loadTransactions();
    saveTransactions([newTx, ...currentTxs]);

    // 4. Redirigir al dashboard
    router.push("/");
  }

  return (
    <main className="min-h-screen p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Añadir Gasto</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Descripción */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Descripción</label>
          <input
            type="text"
            required
            placeholder="Ej: Supermercado, Cine..."
            className="w-full border rounded-lg p-3 bg-white"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Cantidad */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Cantidad (€)</label>
          <input
            type="number"
            required
            step="0.01"
            placeholder="0.00"
            className="w-full border rounded-lg p-3 bg-white"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>

        {/* Categoría */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Categoría</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(CATEGORY_LABEL) as Category[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat })}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  formData.category === cat
                    ? "bg-black text-white border-black"
                    : "bg-white text-black hover:bg-gray-50"
                }`}
              >
                {CATEGORY_LABEL[cat]}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white font-medium rounded-lg p-4 mt-4 hover:opacity-90 transition-opacity"
        >
          Guardar Gasto
        </button>
      </form>
    </main>
  );
}