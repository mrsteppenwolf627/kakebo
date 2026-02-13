"use client";

import { useState } from "react";
import { AIChat } from "./AIChat/AIChat";
import { AnimatePresence, motion } from "framer-motion";

export default function FloatingAgentChat() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-24 right-6 z-50 w-[90vw] sm:w-[400px] h-[500px] shadow-2xl rounded-xl overflow-hidden"
                    >
                        <AIChat mode="widget" onClose={() => setIsOpen(false)} />
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-24 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen
                        ? "bg-stone-100 text-stone-900 rotate-90"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                aria-label={isOpen ? "Cerrar chat" : "Abrir asistente"}
            >
                {isOpen ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                ) : (
                    <span className="text-2xl">🤖</span>
                )}
            </button>
        </>
    );
}
