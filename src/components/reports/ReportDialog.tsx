"use client";

import { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/browser";
import { Loader2 } from "lucide-react";
import ReportPDF from "./ReportPDF";

type TimeRange = "day" | "week" | "month" | "year";

export default function ReportDialog({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [range, setRange] = useState<TimeRange>("month");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    if (!isOpen) return null;

    async function generateData() {
        setLoading(true);
        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            // Calculate start/end dates
            const selected = new Date(date);
            let start = "";
            let end = "";
            let label = "";

            if (range === "day") {
                start = date;
                end = date;
                label = `Reporte Diario: ${date}`;
            } else if (range === "week") {
                // Simple interaction: week of the selected date
                const d = new Date(selected);
                const day = d.getDay();
                const diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
                const monday = new Date(d.setDate(diff));
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);

                start = monday.toISOString().slice(0, 10);
                end = sunday.toISOString().slice(0, 10);
                label = `Semana: ${start} - ${end}`;
            } else if (range === "month") {
                // YYYY-MM
                const [y, m] = date.split("-");
                start = `${y}-${m}-01`;
                // end of month
                const lastDay = new Date(Number(y), Number(m), 0).getDate();
                end = `${y}-${m}-${lastDay}`;
                label = `Mensual: ${y}-${m}`;
            } else if (range === "year") {
                const y = date.split("-")[0];
                start = `${y}-01-01`;
                end = `${y}-12-31`;
                label = `Anual: ${y}`;
            }

            // Fetch Expenses
            const { data: expenses, error } = await supabase
                .from("expenses")
                .select("*")
                .eq("user_id", user.id)
                .gte("date", start)
                .lte("date", end)
                .order("date", { ascending: false });

            if (error) throw error;

            // Process Data
            const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
            const expensesByCategory: Record<string, number> = {};
            expenses.forEach((e) => {
                expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + Number(e.amount);
            });

            setReportData({
                dateRange: label,
                totalSpent,
                expenses: expenses.map(e => ({ ...e, amount: Number(e.amount) })),
                expensesByCategory
            });

        } catch (e) {
            console.error(e);
            alert("Error generando los datos del reporte.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card border border-border w-full max-w-md p-6 rounded-xl shadow-lg space-y-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-serif font-medium">Generar Informe PDF</h2>

                <div className="space-y-4">
                    {/* Range Selector */}
                    <div className="grid grid-cols-4 gap-2">
                        {(["day", "week", "month", "year"] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => { setRange(r); setReportData(null); }}
                                className={`text-sm py-2 rounded-md capitalize transition-colors ${range === r ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                            >
                                {r === "day" ? "Día" : r === "week" ? "Semana" : r === "month" ? "Mes" : "Año"}
                            </button>
                        ))}
                    </div>

                    {/* Date Input */}
                    <div className="space-y-1">
                        <label className="text-sm text-foreground font-medium">Selecciona Fecha</label>
                        <input
                            type={range === "month" ? "month" : range === "year" ? "number" : "date"}
                            value={range === "year" ? date.split("-")[0] : range === "month" ? date.slice(0, 7) : date}
                            onChange={(e) => {
                                let v = e.target.value;
                                if (range === "year") v = `${v}-01-01`; // dummy full date
                                if (range === "month" && v.length === 7) v = `${v}-01`;
                                setDate(v);
                                setReportData(null);
                            }}
                            min={range === "year" ? "2020" : undefined}
                            max={range === "year" ? "2030" : undefined}
                            className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    {/* Info */}
                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                        Se generará un PDF con el historial de gastos, gráficos básicos y un resumen financiero del periodo seleccionado.
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                        Cancelar
                    </button>

                    {!reportData ? (
                        <button
                            onClick={generateData}
                            disabled={loading}
                            className="px-4 py-2 bg-stone-900 text-stone-50 dark:bg-stone-50 dark:text-stone-900 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? "Preparando..." : "Preparar Informe"}
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setReportData(null)}
                                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md"
                            >
                                Cambiar filtros
                            </button>
                            <PDFDownloadLink
                                document={<ReportPDF data={reportData} />}
                                fileName={`kakebo-report-${range}-${date}.pdf`}
                                className="px-4 py-2 bg-stone-900 text-stone-50 dark:bg-stone-50 dark:text-stone-900 rounded-md text-sm font-medium hover:opacity-90 inline-flex items-center gap-2"
                            >
                                {({ loading: pdfLoading }) => (pdfLoading ? "Generando PDF..." : "📥 Descargar PDF")}
                            </PDFDownloadLink>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
