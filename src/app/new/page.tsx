"use client";

import { useState } from "react";
import { loadTransactions, saveTransactions } from "@/lib/storage";
import { CATEGORY_LABEL, Category, Transaction } from "@/lib/types";

const categories: Category[] = ["general", "wants", "culture", "extras"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewExpensePage() {
  const [form, setForm] = useState({
    date: todayISO(),
    description: "",
    amount: "",
    category: "general" as Category,
  });

  function handleSave() {
    const txs = loadTransactions();

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      date: form.date,
      description: form.description.trim(),
      amount: Number(form.amount),
      category: form.category,
    };

    if (!newTx.description) {
      alert("Pon un concepto.");
      return;
    }
    if (!Number.isFinite(newTx.amount) || newTx.amount <= 0) {
      alert("El importe debe ser mayor que 0.");
      return;
    }

    saveTransactions([...txs, newTx]);
    alert("Gasto guardado.");

    setForm({
      date: todayISO(),
      description: "",
      amount: "",
      category: "general",
    });
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">Nuevo gasto</h1>

      <div className="space-y-2">
        <label className="block text-sm">Fecha</label>
        <input
          type="date"
          className="w-full border p-2"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm">Concepto</label>
        <input
          type="text"
          className="w-full border p-2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm">Importe (€)</label>
        <input
          type="number"
          className="w-full border p-2"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm">Categoría</label>
        <select
          className="w-full border p-2"
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value as Category })
          }
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-black text-white p-2 hover:opacity-90"
      >
        Guardar gasto
      </button>
    </main>
  );
}
