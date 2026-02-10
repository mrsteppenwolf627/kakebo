"use client";

import { useState, useEffect } from "react";
import ReportDialog from "./ReportDialog";
import PremiumPrompt from "../saas/PremiumPrompt";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { canUsePremium, Profile } from "@/lib/auth/access-control";

export default function ReportButton() {
    const [open, setOpen] = useState(false);
    const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAccess() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setHasAccess(false);
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            setHasAccess(canUsePremium(data as Profile));
            setLoading(false);
        }
        checkAccess();
    }, []);

    function handleClick() {
        if (hasAccess) {
            setOpen(true);
        } else {
            setShowPremiumPrompt(true);
        }
    }

    if (loading) {
        return (
            <button
                disabled
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3 bg-stone-100 text-stone-900 dark:bg-stone-800/80 dark:text-stone-50 dark:border dark:border-stone-700 text-sm font-medium rounded-md shadow-sm opacity-50 cursor-not-allowed"
            >
                <FileText className="w-5 h-5 opacity-70" />
                <span>Informe</span>
            </button>
        );
    }

    return (
        <>
            <button
                onClick={handleClick}
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3 bg-stone-100 text-stone-900 dark:bg-stone-800/80 dark:text-stone-50 dark:border dark:border-stone-700 text-sm font-medium rounded-md shadow-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-all active:scale-95 border border-transparent dark:hover:border-stone-600"
                title="Generar Informe"
            >
                <FileText className="w-5 h-5 opacity-70" />
                <span>Informe</span>
                {!hasAccess && (
                    <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm font-semibold">
                        PRO
                    </span>
                )}
            </button>

            {open && hasAccess && <ReportDialog isOpen={open} onClose={() => setOpen(false)} />}

            {showPremiumPrompt && !hasAccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-xl shadow-lg max-w-2xl w-full">
                        <div className="flex justify-end p-2">
                            <button
                                onClick={() => setShowPremiumPrompt(false)}
                                className="text-muted-foreground hover:text-foreground text-2xl leading-none p-2"
                            >
                                ×
                            </button>
                        </div>
                        <PremiumPrompt feature="PDF Reports" />
                    </div>
                </div>
            )}
        </>
    );
}
