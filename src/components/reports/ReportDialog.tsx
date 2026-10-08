"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Loader2 } from "lucide-react";
import ReportPDF from "./ReportPDF";

type TimeRange = "cycle" | "day" | "week" | "month" | "year";

type ReportData = {
    dateRange: string;
    totalSpent: number;
    totalIncome: number;
    fixedTotal: number;
    savingGoal: number;
    budgetBeforeExpenses: number;
    availableReal: number;
    expenses: Array<{ id: string; date: string; category: string; note: string | null; amount: number }>;
    incomes: Array<{ id: string; date: string; description: string | null; amount: number }>;
    expensesByCategory: Record<string, number>;
};

const CATEGORY_LABELS: Record<string, string> = {
    survival: "Supervivencia",
    optional: "Ocio y vicio",
    culture: "Cultura",
    extra: "Extras",
};

export default function ReportDialog({
    isOpen,
    initialYm,
    onClose,
}: {
    isOpen: boolean;
    initialYm: string;
    onClose: () => void;
}) {
    const [range, setRange] = useState<TimeRange>("cycle");
    const [date, setDate] = useState(`${initialYm}-01`); // YYYY-MM-DD
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    async function generateData() {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ range, date, ym: range === "cycle" ? date.slice(0, 7) : undefined }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error?.message || "No se pudo preparar el informe.");
            setReportData(payload.data as ReportData);

        } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo preparar el informe.");
        } finally {
            setLoading(false);
        }
    }

    function handleDownloadCSV(isExcel: boolean) {
        if (!reportData || !reportData.expenses) return;

        const headers = ["Tipo", "Fecha", "Concepto", "Categoría", "Importe"];
        const escapeCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
        const rows = [
            ...reportData.expenses.map((e) => [
                "Gasto",
                e.date,
                e.note || "",
                CATEGORY_LABELS[e.category] || e.category,
                e.amount,
            ]),
            ...reportData.incomes.map((income) => [
                "Ingreso",
                income.date,
                income.description || "",
                "Ingreso",
                income.amount,
            ]),
        ].map((row) => row.map(escapeCell));

        const separator = isExcel ? ";" : ",";
        const csvContent = [
            headers.join(separator),
            ...rows.map((row) => row.join(separator))
        ].join("\n");

        const blobParts = isExcel ? [new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent] : [csvContent];
        const blob = new Blob(blobParts, { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const aTag = document.createElement("a");
        aTag.href = url;
        aTag.download = `kakebo-report-${range}-${date}.csv`;
        document.body.appendChild(aTag);
        aTag.click();
        document.body.removeChild(aTag);
        URL.revokeObjectURL(url);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" role="presentation" onClick={onClose}>
            <div className="bg-card border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-xl shadow-lg space-y-6" role="dialog" aria-modal="true" aria-labelledby="report-dialog-title" onClick={(e) => e.stopPropagation()}>
                <h2 id="report-dialog-title" className="text-xl font-serif font-medium">Informe premium</h2>
                <p className="text-sm text-muted-foreground">Descarga un resumen verificable de tus movimientos. El modo Ciclo sigue exactamente el reparto del dashboard.</p>

                <div className="space-y-4">
                    {/* Range Selector */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {(["cycle", "day", "week", "month", "year"] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => { setRange(r); setReportData(null); }}
                                className={`text-sm py-2 rounded-md capitalize transition-colors ${range === r ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                            >
                                {r === "cycle" ? "Ciclo" : r === "day" ? "Día" : r === "week" ? "Semana" : r === "month" ? "Mes" : "Año"}
                            </button>
                        ))}
                    </div>

                    {/* Date Input */}
                    <div className="space-y-1">
                        <label className="text-sm text-foreground font-medium">{range === "cycle" ? "Selecciona ciclo" : "Selecciona fecha"}</label>
                        <input
                            type={range === "cycle" || range === "month" ? "month" : range === "year" ? "number" : "date"}
                            value={range === "year" ? date.split("-")[0] : range === "cycle" || range === "month" ? date.slice(0, 7) : date}
                            onChange={(e) => {
                                let v = e.target.value;
                                if (range === "year") v = `${v}-01-01`; // dummy full date
                                if ((range === "cycle" || range === "month") && v.length === 7) v = `${v}-01`;
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
                        El informe incluye gastos, ingresos, disponible real y desglose por categorías. Los datos se preparan de forma segura en el servidor.
                    </div>
                    {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md">{error}</div>}

                    {reportData && (
                        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                            <div>
                                <div className="text-sm font-medium text-foreground">Vista previa del informe</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{reportData.dateRange}</div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="rounded-md bg-muted/50 p-3">
                                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Gasto</div>
                                    <div className="mt-1 text-sm font-semibold text-foreground">{reportData.totalSpent.toFixed(2)} €</div>
                                </div>
                                <div className="rounded-md bg-muted/50 p-3">
                                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Ingresos</div>
                                    <div className="mt-1 text-sm font-semibold text-foreground">{reportData.totalIncome.toFixed(2)} €</div>
                                </div>
                                <div className="rounded-md bg-muted/50 p-3">
                                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Disponible</div>
                                    <div className={`mt-1 text-sm font-semibold ${reportData.availableReal >= 0 ? "text-foreground" : "text-destructive"}`}>{reportData.availableReal.toFixed(2)} €</div>
                                </div>
                                <div className="rounded-md bg-muted/50 p-3">
                                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Movimientos</div>
                                    <div className="mt-1 text-sm font-semibold text-foreground">{reportData.expenses.length + reportData.incomes.length}</div>
                                </div>
                            </div>
                        </div>
                    )}
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
                        <div className="flex flex-col sm:flex-row gap-2 w-full justify-between items-center sm:items-start mt-4 border-t border-border pt-4">
                            <button
                                onClick={() => setReportData(null)}
                                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md w-full sm:w-auto text-center order-last sm:order-first mt-2 sm:mt-0"
                            >
                                Diferentes filtros
                            </button>
                            <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                                <button
                                    onClick={() => handleDownloadCSV(false)}
                                    className="px-3 py-2 bg-stone-100 text-stone-900 border border-stone-200 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-100 hover:opacity-80 rounded-md text-sm font-medium transition-opacity inline-flex items-center gap-2"
                                >
                                    <span>📊</span> CSV
                                </button>
                                <button
                                    onClick={() => handleDownloadCSV(true)}
                                    className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400 hover:opacity-80 rounded-md text-sm font-medium transition-opacity inline-flex items-center gap-2"
                                >
                                    <span>📉</span> CSV para Excel
                                </button>
                                <PDFDownloadLink
                                    document={<ReportPDF data={reportData} />}
                                    fileName={`kakebo-informe-${range}-${date.slice(0, 7)}.pdf`}
                                    className="px-4 py-2 bg-stone-900 text-stone-50 dark:bg-stone-50 dark:text-stone-900 rounded-md text-sm font-medium hover:opacity-90 inline-flex items-center gap-2"
                                >
                                    {({ loading: pdfLoading }) => (pdfLoading ? "Cargando..." : "📥 PDF")}
                                </PDFDownloadLink>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
