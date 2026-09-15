"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface ConfirmationModalProps {
    /**
     * Mensaje explicativo ya generado por el servidor (concepto, importe,
     * fecha y categoría cuando existan). Nunca se muestran IDs internos ni
     * datos de otro usuario — el popup solo pinta este texto, tal cual.
     */
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    /** Deshabilita ambos botones mientras se envía la confirmación (evita doble clic). */
    isSubmitting: boolean;
    /**
     * Fase 2.E: mensaje de error de la última cancelación fallida (p. ej.
     * por red). Si está presente, el popup sigue mostrándose (la acción NO
     * se ha dado por cancelada) y se informa del problema para reintentar.
     */
    errorMessage?: string | null;
}

/**
 * Fase 2.E: popup/modal de confirmación para escrituras de IA (crear,
 * editar o corregir un gasto). Accesible: role="dialog", aria-modal,
 * etiquetado por el propio mensaje. "Cancelar" nunca llama al servidor.
 */
export function ConfirmationModal({
    message,
    onConfirm,
    onCancel,
    isSubmitting,
    errorMessage,
}: ConfirmationModalProps) {
    const t = useTranslations("Agent.confirmation");

    return (
        <div
            className="absolute inset-0 z-20 flex items-end sm:items-center justify-center bg-black/40 p-4"
            role="presentation"
            onClick={(e) => {
                // Clic fuera del cuadro = cancelar (mismo efecto que el botón Cancelar).
                if (e.target === e.currentTarget && !isSubmitting) onCancel();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="ai-confirmation-title"
                aria-describedby="ai-confirmation-message"
                className="w-full max-w-sm bg-card border border-border rounded-xl shadow-lg p-5 space-y-4"
            >
                <h3
                    id="ai-confirmation-title"
                    className="font-serif text-base font-medium text-foreground"
                >
                    {t("title")}
                </h3>

                <p id="ai-confirmation-message" className="text-sm text-foreground whitespace-pre-wrap">
                    {message}
                </p>

                {errorMessage && (
                    <p role="alert" className="text-xs text-destructive">
                        {errorMessage}
                    </p>
                )}

                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 border border-border text-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        {t("cancel")}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="flex-1 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? t("confirming") : t("confirm")}
                    </button>
                </div>
            </div>
        </div>
    );
}
