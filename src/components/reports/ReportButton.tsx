"use client";

import { useState } from "react";
import ReportDialog from "./ReportDialog";
import { FileText, LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ReportButton({ ym }: { ym: string }) {
    const t = useTranslations("Dashboard.Actions");
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3 bg-card text-foreground border border-border text-sm font-medium rounded-lg shadow-sm hover:border-primary/40 hover:bg-muted transition-all active:scale-95"
                title={t("generateReport")}
            >
                <FileText className="w-5 h-5 text-primary" strokeWidth={1.8} />
                <span>{t("report")}</span>
                <LockKeyhole className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
            </button>

            {open && <ReportDialog isOpen={open} initialYm={ym} onClose={() => setOpen(false)} />}
        </>
    );
}
