"use client";

interface PremiumPromptProps {
    feature: "PDF Reports" | "AI Chat" | "AI Classification";
    onUpgrade?: () => void;
}

// Feature is now free. This component is a no-op kept for import compatibility.
export default function PremiumPrompt({ feature, onUpgrade }: PremiumPromptProps) {
    return null;
}
