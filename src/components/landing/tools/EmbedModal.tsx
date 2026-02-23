"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface EmbedModalProps {
    isOpen: boolean;
    onClose: () => void;
    toolPath: string;
}

export function EmbedModal({ isOpen, onClose, toolPath }: EmbedModalProps) {
    const tCommon = useTranslations("Tools.Common.embed");
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const embedCode = `<iframe src="https://kakebo.ai/es${toolPath}" width="100%" height="800" frameborder="0" style="border:1px solid #e7e5e4; border-radius:12px; max-width: 100%;"></iframe><p style="text-align:center;font-size:12px;color:#a8a29e;margin-top:8px;"><a href="https://kakebo.ai" target="_blank" style="color:#a8a29e;text-decoration:underline;">Powered by Kakebo</a></p>`;

    const handleCopy = () => {
        if (typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(embedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border p-6 overflow-hidden relative" onClick={e => e.stopPropagation()}>
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="mb-6">
                    <h3 className="text-xl font-serif font-bold text-foreground mb-2">
                        {tCommon('title')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {tCommon('desc')}
                    </p>
                </div>

                <div className="relative">
                    <pre className="p-4 bg-muted overflow-x-auto rounded-lg text-xs font-mono text-muted-foreground border border-border break-all whitespace-pre-wrap">
                        {embedCode}
                    </pre>

                    <button
                        onClick={handleCopy}
                        className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        {copied ? (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {tCommon('copied')}
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                {tCommon('copy')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
