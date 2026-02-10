import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";

// Register a font (optional, using default Helvetica for now to ensure it works)
// Font.register({ family: 'Roboto', src: '...' });

const styles = StyleSheet.create({
    page: {
        fontFamily: "Helvetica",
        paddingTop: 30,
        paddingBottom: 60,
        paddingHorizontal: 40,
        position: "relative",
    },
    background: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.3, // Subtle sakura background
        zIndex: -1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#cf5c5c",
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        color: "#1c1917",
        fontFamily: "Helvetica-Bold",
    },
    subtitle: {
        fontSize: 10,
        color: "#57534e",
        marginTop: 4,
    },
    brand: {
        fontSize: 14,
        color: "#cf5c5c",
        fontFamily: "Helvetica-Bold",
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        color: "#1c1917",
        marginBottom: 10,
        fontFamily: "Helvetica-Bold",
    },
    summaryGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    summaryCard: {
        width: "30%",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        padding: 10,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#e7e5e4",
    },
    cardLabel: {
        fontSize: 8,
        color: "#57534e",
        marginBottom: 4,
        textTransform: "uppercase",
    },
    cardValue: {
        fontSize: 16,
        fontFamily: "Helvetica-Bold",
        color: "#1c1917",
    },
    // Table
    table: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#e7e5e4",
        borderRadius: 4,
        overflow: "hidden",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f5f5f4",
        borderBottomWidth: 1,
        borderBottomColor: "#e7e5e4",
        padding: 8,
    },
    tableRow: {
        flexDirection: "row",
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f5f5f4",
    },
    colDate: { width: "15%", fontSize: 9, color: "#57534e" },
    colCategory: { width: "20%", fontSize: 9, color: "#57534e" },
    colNote: { width: "45%", fontSize: 9, color: "#1c1917" },
    colAmount: { width: "20%", fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1c1917", textAlign: "right" },

    // Footer
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: "center",
        fontSize: 8,
        color: "#a8a29e",
        borderTopWidth: 1,
        borderTopColor: "#e7e5e4",
        paddingTop: 10,
    },
});

const KAKEBO_META: Record<string, { label: string; color: string }> = {
    supervivencia: { label: "Supervivencia", color: "#dc2626" },
    opcional: { label: "Opcional", color: "#2563eb" },
    cultura: { label: "Cultura", color: "#16a34a" },
    extra: { label: "Extra", color: "#9333ea" },
};

type Expense = {
    id: string;
    date: string;
    category: string;
    note: string | null;
    amount: number;
};

type ReportData = {
    dateRange: string;
    totalSpent: number;
    expenses: Expense[];
    expensesByCategory: Record<string, number>;
};

export default function ReportPDF({ data }: { data: ReportData }) {
    const { dateRange, totalSpent, expenses, expensesByCategory } = data;

    // Background Image Path - ReactPDF needs absolute URL or base64 or relative to public
    // Assuming the component is run in browser, window.location.origin might be needed if using http url
    // But for simple "public" assets, often just the string works if hosted. 
    // IMPORTANT: react-pdf can behave weirdly with images in dev. 
    // We will try using the public URL.

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Background Image /bg-sakura.png */}
                {/* Note: In some setups, you might need the full URL */}
                <Image
                    src="/bg-sakura.png"
                    style={styles.background}
                    fixed
                />

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Informe de Gastos</Text>
                        <Text style={styles.subtitle}>{dateRange}</Text>
                    </View>
                    <View>
                        <Text style={styles.brand}>Kakebo AI</Text>
                    </View>
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.cardLabel}>Gasto Total</Text>
                        <Text style={styles.cardValue}>{totalSpent.toFixed(2)} €</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.cardLabel}>Movimientos</Text>
                        <Text style={styles.cardValue}>{expenses.length}</Text>
                    </View>
                    {/* Placeholder for income/savings if we had them passed down */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.cardLabel}>Categorías</Text>
                        <Text style={styles.cardValue}>{Object.keys(expensesByCategory).length}</Text>
                    </View>
                </View>

                {/* Breakdown by Category */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Desglose por Categoría</Text>
                    {/* Simple Bar Chart simulation using Views */}
                    <View style={{ gap: 8 }}>
                        {Object.entries(expensesByCategory).map(([cat, amount]) => {
                            const meta = KAKEBO_META[cat] || { label: cat, color: "#57534e" };
                            // Calculate width percentage relative to total spent (max 100%)
                            const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;

                            return (
                                <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                    <View style={{ width: 80 }}>
                                        <Text style={{ fontSize: 9 }}>{meta.label}</Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: '#f5f5f4', height: 10, borderRadius: 2, marginHorizontal: 8 }}>
                                        <View style={{ width: `${pct}%`, backgroundColor: meta.color, height: '100%', borderRadius: 2 }} />
                                    </View>
                                    <View style={{ width: 60 }}>
                                        <Text style={{ fontSize: 9, textAlign: 'right' }}>{amount.toFixed(2)} €</Text>
                                    </View>
                                </View>
                            )
                        })}
                    </View>
                </View>

                {/* Expense History Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Historial Detallado</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.colDate}>FECHA</Text>
                            <Text style={styles.colCategory}>CATEGORÍA</Text>
                            <Text style={styles.colNote}>CONCEPTO</Text>
                            <Text style={styles.colAmount}>IMPORTE</Text>
                        </View>
                        {expenses.map((expense) => (
                            <View key={expense.id} style={styles.tableRow}>
                                <Text style={styles.colDate}>{expense.date}</Text>
                                <Text style={styles.colCategory}>
                                    {KAKEBO_META[expense.category]?.label || expense.category}
                                </Text>
                                <Text style={styles.colNote}>{expense.note || "-"}</Text>
                                <Text style={styles.colAmount}>{expense.amount.toFixed(2)} €</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer} fixed>
                    Generado automáticamente por Kakebo AI el {new Date().toLocaleDateString()}
                </Text>
            </Page>
        </Document>
    );
}
