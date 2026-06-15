"use client";

import { useState } from "react";
import ReportDialog from "./ReportDialog";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ReportButton() {
    const t = useTranslations("Dashboard.Actions");
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3 bg-stone-100 text-stone-900 dark:bg-stone-800/80 dark:text-stone-50 dark:border dark:border-stone-700 text-sm font-medium rounded-md shadow-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-all active:scale-95 border border-transparent dark:hover:border-stone-600"
                title={t("generateReport")}
            >
                <FileText className="w-5 h-5 opacity-70" />
                <span>{t("report")}</span>
            </button>

            {open && <ReportDialog isOpen={open} onClose={() => setOpen(false)} />}
        </>
    );
}
