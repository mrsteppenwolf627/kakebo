"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

type Income = {
    id: string;
    date: string;
    amount: number;
    category: string;
    description: string | null;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    ym: string;
    onUpdate: () => void;
};

export default function ManageIncomesModal({ isOpen, onClose, ym, onUpdate }: Props) {
    const supabase = useMemo(() => createClient(), []);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");

    useEffect(() => {
        if (isOpen) {
            loadIncomes();
            // Reset form on open
            setAmount("");
            setDescription("");
            setDate(`${ym}-01`); // Default to 1st of month
            setError(null);
        }
    }, [isOpen, ym]);

    const [baseIncome, setBaseIncome] = useState(0);

    async function loadIncomes() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch base income from settings
            const { data: settings } = await supabase
                .from("user_settings")
                .select("monthly_income")
                .eq("user_id", user.id)
                .single();

            if (settings) {
                setBaseIncome(Number(settings.monthly_income) || 0);
            }

            // Extract year and month from ym
            const [year, month] = ym.split("-").map(Number);

            // Calculate start and end date of the month
            const startDate = `${ym}-01`;
            // Handle December case for next month
            const nextYm = month === 12
                ? `${year + 1}-01`
                : `${year}-${String(month + 1).padStart(2, "0")}`;
            const endDate = `${nextYm}-01`;

            const { data, error } = await supabase
                .from("incomes")
                .select("*")
                .eq("user_id", user.id)
                .gte("date", startDate)
                .lt("date", endDate)
                .order("date", { ascending: false });

            if (error) throw error;
            setIncomes(data || []);
        } catch (err: any) {
            console.error(err);
            setError("Error cargando ingresos");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!amount || !date) return;

        setSubmitting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No usuario");

            const response = await fetch("/api/incomes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date,
                    amount: Number(amount),
                    category: "general", // Default for now
                    description: description || "Ingreso",
                }),
            });

            if (!response.ok) {
                const json = await response.json();
                throw new Error(json.error || "Error guardando ingreso");
            }

            // Reload list and notify parent
            await loadIncomes();
            onUpdate();
            window.dispatchEvent(new CustomEvent("kakebo:incomes-changed"));

            // Reset form
            setAmount("");
            setDescription("");
            // Keep date as is or reset? Keep for convenience
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("¿Eliminar este ingreso?")) return;

        try {
            const { error } = await supabase.from("incomes").delete().eq("id", id);
            if (error) throw error;
            await loadIncomes();
            onUpdate();
            window.dispatchEvent(new CustomEvent("kakebo:incomes-changed"));
        } catch (err: any) {
            setError("Error eliminando: " + err.message);
        }
    }

    if (!isOpen) return null;

    const total = incomes.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                    <h2 className="text-lg font-semibold text-foreground">Ingresos de {ym}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none">&times;</button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-6">
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
                        <h3 className="text-sm font-medium text-foreground mb-2">Añadir nuevo ingreso</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Fecha</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-background border border-border rounded p-2 text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Cantidad (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-background border border-border rounded p-2 text-sm"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Concepto (opcional)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-background border border-border rounded p-2 text-sm"
                                placeholder="Ej. Nómina, Venta Wallapop..."
                            />
                        </div>

                        {error && <p className="text-xs text-destructive">{error}</p>}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded shadow hover:opacity-90 disabled:opacity-50"
                            >
                                {submitting ? "Guardando..." : "Añadir Ingreso"}
                            </button>
                        </div>
                    </form>

                    {/* List */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-foreground flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <span>Listado de ingresos extra</span>
                            <div className="text-xs bg-primary/10 text-primary px-3 py-2 rounded flex flex-col items-end">
                                <span>Base (Config): {baseIncome.toFixed(2)} €</span>
                                <span>Extras: {total.toFixed(2)} €</span>
                                <span className="font-bold border-t border-primary/20 mt-1 pt-1">Total: {(baseIncome + total).toFixed(2)} €</span>
                            </div>
                        </h3>

                        {loading ? (
                            <p className="text-sm text-muted-foreground animate-pulse">Cargando...</p>
                        ) : incomes.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic text-center py-4 bg-muted/10 rounded">No hay ingresos extra registrados.</p>
                        ) : (
                            <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                                {incomes.map(inc => (
                                    <li key={inc.id} className="p-3 flex justify-between items-center bg-card hover:bg-muted/10 transition-colors text-sm">
                                        <div>
                                            <div className="font-medium text-foreground">{inc.description || "Ingreso"}</div>
                                            <div className="text-xs text-muted-foreground">{inc.date}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-medium text-green-600 dark:text-green-400">+{Number(inc.amount).toFixed(2)} €</span>
                                            <button
                                                onClick={() => handleDelete(inc.id)}
                                                className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-muted"
                                                title="Eliminar"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
