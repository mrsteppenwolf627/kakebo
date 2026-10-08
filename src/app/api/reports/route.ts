import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api";
import { usesCycleLedger } from "@/lib/cycles/ledger-scope";

type ReportRange = "cycle" | "day" | "week" | "month" | "year";

function isDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isYm(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateRange(range: Exclude<ReportRange, "cycle">, selected: string) {
  const base = new Date(`${selected}T12:00:00`);
  if (Number.isNaN(base.getTime())) throw new Error("Fecha no válida");

  if (range === "day") return { start: selected, end: selected, label: `Día ${selected}` };

  if (range === "week") {
    const monday = new Date(base);
    const day = monday.getDay();
    monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const start = isoDate(monday);
    const end = isoDate(sunday);
    return { start, end, label: `Semana: ${start} - ${end}` };
  }

  if (range === "month") {
    const start = `${selected.slice(0, 7)}-01`;
    const endDate = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    const end = isoDate(endDate);
    return { start, end, label: `Mes: ${selected.slice(0, 7)}` };
  }

  const year = selected.slice(0, 4);
  return { start: `${year}-01-01`, end: `${year}-12-31`, label: `Año: ${year}` };
}

function sum(rows: Array<{ amount: number | string | null }>) {
  return rows.reduce((total, row) => total + (Number(row.amount) || 0), 0);
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = (await request.json()) as {
      range?: ReportRange;
      date?: string;
      ym?: string;
    };
    const range = body.range;

    if (!range || !["cycle", "day", "week", "month", "year"].includes(range)) {
      return NextResponse.json({ error: { code: "invalid_range", message: "Periodo no válido." } }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plus_access_until")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;
    const plusUntil = profile?.plus_access_until ? new Date(profile.plus_access_until) : null;
    if (!plusUntil || Number.isNaN(plusUntil.getTime()) || plusUntil <= new Date()) {
      return NextResponse.json(
        { error: { code: "premium_required", message: "Los informes son una función Plus. Activa una suscripción para utilizarlos." } },
        { status: 403 }
      );
    }

    let start: string;
    let end: string;
    let label: string;
    let monthId: string | null = null;
    let reportYm: string | null = null;

    if (range === "cycle") {
      if (!isYm(body.ym)) {
        return NextResponse.json({ error: { code: "invalid_cycle", message: "Selecciona un ciclo válido." } }, { status: 400 });
      }
      reportYm = body.ym;
      const [year, month] = body.ym.split("-").map(Number);
      const { data: cycle, error: cycleError } = await supabase
        .from("months")
        .select("id,year,month")
        .eq("user_id", user.id)
        .eq("year", year)
        .eq("month", month)
        .maybeSingle();

      if (cycleError) throw cycleError;
      if (!cycle) {
        return NextResponse.json({ error: { code: "cycle_not_found", message: "Ese ciclo todavía no existe." } }, { status: 404 });
      }

      monthId = cycle.id;
      start = `${body.ym}-01`;
      end = isoDate(new Date(year, month, 0));
      label = `Ciclo: ${body.ym}`;
    } else {
      if (!isDate(body.date)) {
        return NextResponse.json({ error: { code: "invalid_date", message: "Selecciona una fecha válida." } }, { status: 400 });
      }
      ({ start, end, label } = dateRange(range, body.date));
    }

    const expenseBase = supabase
      .from("expenses")
      .select("id,date,amount,category,note")
      .eq("user_id", user.id)
      .order("date", { ascending: false });
    const incomeBase = supabase
      .from("incomes")
      .select("id,date,amount,description")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    const expenseResult = range === "cycle" && monthId && usesCycleLedger(reportYm!)
      ? await expenseBase.eq("month_id", monthId)
      : await expenseBase.gte("date", start).lte("date", end);
    const incomeResult = range === "cycle" && monthId
      ? await incomeBase.eq("month_id", monthId)
      : await incomeBase.gte("date", start).lte("date", end);

    if (expenseResult.error) throw expenseResult.error;
    if (incomeResult.error) throw incomeResult.error;

    const expenses = expenseResult.data ?? [];
    const incomes = incomeResult.data ?? [];
    const expensesByCategory: Record<string, number> = {};
    for (const expense of expenses) {
      expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + (Number(expense.amount) || 0);
    }

    let fixedTotal = 0;
    let savingGoal = 0;
    if (reportYm) {
      const [{ data: settings, error: settingsError }, { data: fixed, error: fixedError }] = await Promise.all([
        supabase.from("user_settings").select("monthly_income,monthly_saving_goal").eq("user_id", user.id).maybeSingle(),
        supabase.from("fixed_expenses").select("amount,active,start_ym,end_ym").eq("user_id", user.id),
      ]);
      if (settingsError) throw settingsError;
      if (fixedError) throw fixedError;
      savingGoal = Number(settings?.monthly_saving_goal) || 0;
      fixedTotal = (fixed ?? [])
        .filter((row) => row.active && row.start_ym <= reportYm! && (!row.end_ym || row.end_ym >= reportYm!))
        .reduce((total, row) => total + (Number(row.amount) || 0), 0);
    }

    const totalSpent = sum(expenses);
    const totalIncome = sum(incomes);
    const baseIncome = reportYm ? Number((await supabase.from("user_settings").select("monthly_income").eq("user_id", user.id).maybeSingle()).data?.monthly_income) || 0 : 0;
    const incomeForSummary = reportYm ? baseIncome + totalIncome : totalIncome;
    const budgetBeforeExpenses = reportYm ? incomeForSummary - fixedTotal - savingGoal : incomeForSummary;

    return NextResponse.json({
      data: {
        dateRange: label,
        totalSpent,
        totalIncome: incomeForSummary,
        fixedTotal,
        savingGoal,
        budgetBeforeExpenses,
        availableReal: budgetBeforeExpenses - totalSpent,
        expenses: expenses.map((expense) => ({ ...expense, amount: Number(expense.amount) || 0 })),
        incomes: incomes.map((income) => ({ ...income, amount: Number(income.amount) || 0 })),
        expensesByCategory,
      },
    });
  } catch (error) {
    console.error("Report generation failed", error);
    return NextResponse.json({ error: { code: "report_failed", message: "No se pudo preparar el informe." } }, { status: 500 });
  }
}
