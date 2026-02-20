"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

type UserSettingsRow = {
    user_id: string;
    monthly_income: number | null;
    monthly_saving_goal: number | null;
    budget_supervivencia: number | null;
    budget_opcional: number | null;
    budget_cultura: number | null;
    budget_extra: number | null;
};

type FixedExpenseRow = {
    id: string;
    user_id: string;
    name: string;
    amount: number;
    active: boolean;
    start_ym: string;
    end_ym: string | null;
    created_at: string;
};

const DEFAULT: Omit<UserSettingsRow, "user_id"> = {
    monthly_income: 0,
    monthly_saving_goal: 0,
    budget_supervivencia: 0,
    budget_opcional: 0,
    budget_cultura: 0,
    budget_extra: 0,
};

function num(v: any) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function isYm(s: string) {
    return /^\d{4}-\d{2}$/.test(s);
}

function currentYm() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}

// Helpers para inputs numéricos controlados con null
function inputNumberValue(n: number | null | undefined) {
    return n ?? "";
}
function parseNumberOrNull(v: string) {
    return v === "" ? null : Number(v);
}

export default function SettingsClient() {
    const supabase = useMemo(() => createClient(), []);
    const t = useTranslations("Settings");
    const tGen = useTranslations("Settings.General");
    const tFixed = useTranslations("Settings.FixedExpenses");
    const tSeo = useTranslations("Settings.SEO");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);

    const [userId, setUserId] = useState<string | null>(null);
    const [tier, setTier] = useState<string>("free");
    const [form, setForm] = useState<Omit<UserSettingsRow, "user_id">>(DEFAULT);
    const [cancelLoading, setCancelLoading] = useState(false);

    // ✅ gastos fijos
    const [fixedLoading, setFixedLoading] = useState(true);
    const [fixedErr, setFixedErr] = useState<string | null>(null);
    const [fixedOk, setFixedOk] = useState<string | null>(null);
    const [fixedRows, setFixedRows] = useState<FixedExpenseRow[]>([]);
    const [fixedSaving, setFixedSaving] = useState(false);

    const [fixedForm, setFixedForm] = useState<{
        name: string;
        amount: number;
        start_ym: string;
        end_ym: string;
        active: boolean;
    }>({
        name: "",
        amount: 0,
        start_ym: currentYm(),
        end_ym: "",
        active: true,
    });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setErr(null);
            setOk(null);

            setFixedLoading(true);
            setFixedErr(null);
            setFixedOk(null);

            try {
                const { data: sessionRes, error: sessionErr } =
                    await supabase.auth.getSession();
                if (sessionErr) throw sessionErr;

                const uid = sessionRes.session?.user?.id;
                if (!uid) throw new Error("Auth session missing");
                if (cancelled) return;

                setUserId(uid);

                // 1) settings
                const { data, error } = await supabase
                    .from("user_settings")
                    .select(
                        "user_id,monthly_income,monthly_saving_goal,budget_supervivencia,budget_opcional,budget_cultura,budget_extra"
                    )
                    .eq("user_id", uid)
                    .limit(1);

                if (error) throw error;

                const row = (data?.[0] as UserSettingsRow | undefined) ?? null;

                setForm({
                    monthly_income: num(row?.monthly_income ?? 0),
                    monthly_saving_goal: num(row?.monthly_saving_goal ?? 0),
                    budget_supervivencia: num(row?.budget_supervivencia ?? 0),
                    budget_opcional: num(row?.budget_opcional ?? 0),
                    budget_cultura: num(row?.budget_cultura ?? 0),
                    budget_extra: num(row?.budget_extra ?? 0),
                });

                // 1.5) tier
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("tier")
                    .eq("id", uid)
                    .single();
                if (profile) setTier(profile.tier || "free");

                // 2) fixed expenses
                const { data: fx, error: fxErr } = await supabase
                    .from("fixed_expenses")
                    .select("id,user_id,name,amount,active,start_ym,end_ym,created_at")
                    .eq("user_id", uid)
                    .order("created_at", { ascending: false });

                if (fxErr) throw fxErr;

                setFixedRows((fx as FixedExpenseRow[]) ?? []);
            } catch (e: any) {
                setErr(e?.message ?? tGen("loadError"));
            } finally {
                setLoading(false);
                setFixedLoading(false);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [supabase, tGen]);

    async function handleSave() {
        setErr(null);
        setOk(null);

        if (!userId) {
            setErr(tGen("errorSession"));
            return;
        }

        setSaving(true);

        try {
            const payload: UserSettingsRow = {
                user_id: userId,
                monthly_income: num(form.monthly_income),
                monthly_saving_goal: num(form.monthly_saving_goal),
                budget_supervivencia: num(form.budget_supervivencia),
                budget_opcional: num(form.budget_opcional),
                budget_cultura: num(form.budget_cultura),
                budget_extra: num(form.budget_extra),
            };

            const { error } = await supabase
                .from("user_settings")
                .upsert(payload, { onConflict: "user_id" });
            if (error) throw error;

            setOk(tGen("success"));
        } catch (e: any) {
            setErr(e?.message ?? tGen("errorSave"));
        } finally {
            setSaving(false);
        }
    }

    async function handleCancel() {
        if (!window.confirm("¿estás seguro??")) {
            return;
        }

        setCancelLoading(true);
        try {
            const res = await fetch('/api/stripe/cancel', { method: 'POST' });
            if (res.ok) {
                alert("Suscripción cancelada correctamente.");
                window.location.reload();
            } else {
                alert("Error al cancelar la suscripción.");
                setCancelLoading(false);
            }
        } catch (error) {
            console.error(error);
            alert("Error al cancelar la suscripción.");
            setCancelLoading(false);
        }
    }

    async function reloadFixed() {
        if (!userId) return;

        setFixedLoading(true);
        setFixedErr(null);
        try {
            const { data: fx, error: fxErr } = await supabase
                .from("fixed_expenses")
                .select("id,user_id,name,amount,active,start_ym,end_ym,created_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            if (fxErr) throw fxErr;

            setFixedRows((fx as FixedExpenseRow[]) ?? []);
        } catch (e: any) {
            setFixedErr(e?.message ?? tFixed("errors.load"));
        } finally {
            setFixedLoading(false);
        }
    }

    async function addFixed() {
        setFixedErr(null);
        setFixedOk(null);

        if (!userId) {
            setFixedErr(tGen("errorSession"));
            return;
        }

        const name = (fixedForm.name ?? "").trim();
        const amount = num(fixedForm.amount);
        const start_ym = (fixedForm.start_ym ?? "").trim();
        const end_ym = (fixedForm.end_ym ?? "").trim();

        if (!name) {
            setFixedErr(tFixed("errors.nameReq"));
            return;
        }
        if (!(amount > 0)) {
            setFixedErr(tFixed("errors.amountPos"));
            return;
        }
        if (!isYm(start_ym)) {
            setFixedErr(tFixed("errors.startFmt"));
            return;
        }
        if (end_ym && !isYm(end_ym)) {
            setFixedErr(tFixed("errors.endFmt"));
            return;
        }
        if (end_ym && end_ym < start_ym) {
            setFixedErr(tFixed("errors.endAfterStart"));
            return;
        }

        setFixedSaving(true);

        try {
            const payload = {
                user_id: userId,
                name,
                amount,
                active: !!fixedForm.active,
                start_ym,
                end_ym: end_ym ? end_ym : null,
            };

            const { error } = await supabase.from("fixed_expenses").insert(payload);
            if (error) throw error;

            setFixedOk(tFixed("success.added"));
            setFixedForm((s) => ({
                ...s,
                name: "",
                amount: 0,
                // dejamos start_ym igual por comodidad
                end_ym: "",
                active: true,
            }));

            await reloadFixed();
        } catch (e: any) {
            setFixedErr(e?.message ?? tFixed("errors.save"));
        } finally {
            setFixedSaving(false);
        }
    }

    async function toggleFixed(id: string, nextActive: boolean) {
        setFixedErr(null);
        setFixedOk(null);

        if (!userId) {
            setFixedErr(tGen("errorSession"));
            return;
        }

        // optimista
        const prev = fixedRows;
        setFixedRows((r) =>
            r.map((x) => (x.id === id ? { ...x, active: nextActive } : x))
        );

        try {
            const { error } = await supabase
                .from("fixed_expenses")
                .update({ active: nextActive })
                .eq("id", id)
                .eq("user_id", userId);

            if (error) throw error;

            setFixedOk(nextActive ? tFixed("success.activated") : tFixed("success.deactivated"));
        } catch (e: any) {
            setFixedRows(prev);
            setFixedErr(e?.message ?? tFixed("errors.update"));
        }
    }

    const fixedActiveTotal = useMemo(() => {
        return fixedRows
            .filter((r) => r.active)
            .reduce((acc, r) => acc + (num(r.amount) || 0), 0);
    }, [fixedRows]);

    return (
        <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-10 max-w-xl mx-auto space-y-4 sm:space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-foreground">{t("title")}</h1>

            {err && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">{err}</div>}
            {ok && <div className="text-sm text-primary bg-primary/10 p-3 rounded-md border border-primary/20">{ok}</div>}
            {loading && <div className="text-sm text-muted-foreground">{tGen("loading")}</div>}

            {!loading && (
                <>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">{tGen("income")}</label>
                            <input
                                type="number"
                                className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                                value={inputNumberValue(form.monthly_income)}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        monthly_income: parseNumberOrNull(e.target.value),
                                    })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">{tGen("savingGoal")}</label>
                            <input
                                type="number"
                                className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                                value={inputNumberValue(form.monthly_saving_goal)}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        monthly_saving_goal: parseNumberOrNull(e.target.value),
                                    })
                                }
                            />
                        </div>

                        <div className="border border-border rounded-lg p-5 space-y-4 bg-card">
                            <div className="font-semibold text-foreground">{tGen("budgetsTitle")}</div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">{tGen("budgetSurvival")}</label>
                                <input
                                    type="number"
                                    className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                                    value={inputNumberValue(form.budget_supervivencia)}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            budget_supervivencia: parseNumberOrNull(e.target.value),
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">{tGen("budgetOptional")}</label>
                                <input
                                    type="number"
                                    className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                                    value={inputNumberValue(form.budget_opcional)}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            budget_opcional: parseNumberOrNull(e.target.value),
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">{tGen("budgetCulture")}</label>
                                <input
                                    type="number"
                                    className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                                    value={inputNumberValue(form.budget_cultura)}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            budget_cultura: parseNumberOrNull(e.target.value),
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">{tGen("budgetExtra")}</label>
                                <input
                                    type="number"
                                    className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                                    value={inputNumberValue(form.budget_extra)}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            budget_extra: parseNumberOrNull(e.target.value),
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 hover:opacity-90 disabled:opacity-50 font-medium transition-colors"
                        >
                            {saving ? tGen("saving") : tGen("saveButton")}
                        </button>

                        <div className="text-xs text-muted-foreground">
                            {tGen("disclaimer")}
                        </div>
                    </div>

                    {/* ✅ GASTOS FIJOS */}
                    <section className="mt-10 border-t border-border pt-8 space-y-4">
                        <div className="flex items-baseline justify-between gap-3">
                            <h2 className="text-lg font-semibold text-foreground">{tFixed("title")}</h2>
                            <div className="text-sm text-muted-foreground">
                                {tFixed("totalActive")}{" "}
                                <span className="font-semibold text-foreground">
                                    {fixedActiveTotal.toFixed(2)} €
                                </span>
                            </div>
                        </div>

                        {fixedErr && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">{fixedErr}</div>}
                        {fixedOk && (
                            <div className="text-sm text-primary bg-primary/10 p-3 rounded-md border border-primary/20">{fixedOk}</div>
                        )}
                        {fixedLoading && (
                            <div className="text-sm text-muted-foreground">
                                {tFixed("loading")}
                            </div>
                        )}

                        {!fixedLoading && (
                            <div className="border border-border rounded-lg p-5 space-y-4 bg-card">
                                {/* Form alta */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="sm:col-span-2 space-y-1">
                                        <label className="block text-sm font-medium text-foreground">{tFixed("fields.name")}</label>
                                        <input
                                            className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                                            placeholder={tFixed("fields.placeholderName")}
                                            value={fixedForm.name}
                                            onChange={(e) =>
                                                setFixedForm({ ...fixedForm, name: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-foreground">{tFixed("fields.amount")}</label>
                                        <input
                                            type="number"
                                            className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                                            value={fixedForm.amount}
                                            onChange={(e) =>
                                                setFixedForm({
                                                    ...fixedForm,
                                                    amount: Number(e.target.value),
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-foreground">{tFixed("fields.active")}</label>
                                        <select
                                            className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                                            value={fixedForm.active ? "true" : "false"}
                                            onChange={(e) =>
                                                setFixedForm({
                                                    ...fixedForm,
                                                    active: e.target.value === "true",
                                                })
                                            }
                                        >
                                            <option value="true">{tFixed("fields.yes")}</option>
                                            <option value="false">{tFixed("fields.no")}</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-foreground">{tFixed("fields.start")}</label>
                                        <input
                                            className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                                            placeholder={tFixed("fields.placeholderStart")}
                                            value={fixedForm.start_ym}
                                            onChange={(e) =>
                                                setFixedForm({
                                                    ...fixedForm,
                                                    start_ym: e.target.value,
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-foreground">{tFixed("fields.end")}</label>
                                        <input
                                            className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                                            placeholder={tFixed("fields.placeholderEnd")}
                                            value={fixedForm.end_ym}
                                            onChange={(e) =>
                                                setFixedForm({ ...fixedForm, end_ym: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={addFixed}
                                    disabled={fixedSaving}
                                    className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 hover:opacity-90 disabled:opacity-50 font-medium transition-colors"
                                >
                                    {fixedSaving ? tFixed("saving") : tFixed("addButton")}
                                </button>

                                <div className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: tFixed.raw("info") }} />

                                {/* Lista */}
                                <div className="border-t border-border pt-4 space-y-2">
                                    <div className="font-semibold text-sm text-foreground">{tFixed("yourFixed")}</div>

                                    {fixedRows.length === 0 && (
                                        <div className="text-sm text-muted-foreground">
                                            {tFixed("none")}
                                        </div>
                                    )}

                                    {fixedRows.length > 0 && (
                                        <ul className="space-y-2">
                                            {fixedRows.map((r) => (
                                                <li
                                                    key={r.id}
                                                    className="border border-border rounded-lg p-3 flex items-center justify-between gap-3 bg-card hover:border-primary/30 transition-colors"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium truncate text-foreground">
                                                            {r.name}{" "}
                                                            {!r.active && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {tFixed("inactive")}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {r.start_ym}
                                                            {r.end_ym ? ` → ${r.end_ym}` : ` → ${tFixed("noEnd")}`}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="text-sm font-semibold text-foreground">
                                                            {num(r.amount).toFixed(2)} €
                                                        </div>

                                                        <button
                                                            onClick={() => toggleFixed(r.id, !r.active)}
                                                            className={`border px-3 py-2 text-xs rounded-md font-medium transition-colors ${r.active
                                                                ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                                                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                                                                }`}
                                                            title={r.active ? tFixed("deactivate") : tFixed("activate")}
                                                        >
                                                            {r.active ? tFixed("deactivate") : tFixed("activate")}
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <div className="pt-2">
                                        <button
                                            onClick={reloadFixed}
                                            className="border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground rounded-md transition-colors"
                                        >
                                            {tFixed("reload")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* ✅ SUBSCRIPTION */}
                    <section className="mt-10 border-t border-border pt-8 space-y-4">
                        <div className="flex items-baseline justify-between gap-3">
                            <h2 className="text-lg font-semibold text-foreground">{tGen("subscriptionTitle")}</h2>
                        </div>
                        <div className="border border-border rounded-lg p-5 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between bg-card">
                            <div className="mr-4">
                                <div className="font-semibold text-foreground">{tGen("subscriptionDescTitle")}</div>
                                <div className="text-sm text-muted-foreground mt-1">{tGen("subscriptionDescText")}</div>
                            </div>
                            <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                                <Link href="/app/subscription" className="inline-flex w-full sm:w-auto bg-primary text-primary-foreground rounded-md px-4 py-2 hover:opacity-90 font-medium transition-colors whitespace-nowrap justify-center items-center shadow-sm">
                                    {tGen("subscriptionBtn")}
                                </Link>
                                {tier === 'pro' && (
                                    <button
                                        onClick={handleCancel}
                                        disabled={cancelLoading}
                                        className="text-xs text-muted-foreground hover:text-foreground underline decoration-muted-foreground/50 hover:decoration-foreground transition-all text-center sm:text-right"
                                    >
                                        {cancelLoading ? "Cancelando..." : "cancelar subscripción"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ✅ BLOQUE SEO */}
                    <section className="mt-12 border-t border-border pt-8 space-y-3 text-sm text-muted-foreground">
                        <h2 className="text-lg font-semibold text-foreground">
                            {tSeo("title")}
                        </h2>
                        <p>
                            {tSeo("desc")}
                        </p>
                        <div className="text-xs opacity-50">
                            {tSeo("keywords")}
                        </div>
                    </section>
                </>
            )}
        </main>
    );
}
