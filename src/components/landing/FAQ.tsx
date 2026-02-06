"use client";

import { useState } from "react";

interface FaqItemProps {
  question: string;
  answer: string;
}

export function FAQ() {
  return (
    <section id="faq" className="relative py-24 bg-white">
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        {/* Section Header */}
        <div className="mb-12 text-center border-b border-stone-200 pb-8">
          <h2 className="mb-4 text-4xl font-serif font-normal tracking-tight text-stone-900 sm:text-5xl">
            Preguntas frecuentes
          </h2>
          <p className="text-base text-stone-600 font-light">
            Respuestas directas a las dudas más comunes
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          <FaqItem
            question="¿Realmente es gratis empezar?"
            answer="Sí, 100%. Puedes registrarte y usar el Plan Manual (control de gastos completo) sin pagar nada. El registro es instantáneo y no necesitas tarjeta de crédito."
          />

          <FaqItem
            question="¿Qué incluye el trial de 15 días del Plan Pro?"
            answer="El trial te da acceso completo al Agente IA de finanzas: análisis automático, consejos personalizados, predicciones de ahorro e insights inteligentes. Para activarlo necesitas agregar una tarjeta, pero NO se te cobrará hasta el día 16. Te avisaremos antes de cualquier cargo."
          />

          <FaqItem
            question="¿Puedo cancelar el Plan Pro durante el trial?"
            answer="Sí, puedes cancelar en cualquier momento desde tu perfil. Si cancelas durante los 15 días de trial, NO se te cobrará nada. Es así de simple."
          />

          <FaqItem
            question="¿Kakebo sirve aunque ya use una app bancaria?"
            answer="Sí. Tu banco te muestra movimientos; Kakebo te obliga a entender decisiones y patrones. La clave está en la revisión mensual consciente y la intención de mejorar."
          />

          <FaqItem
            question="¿Mis datos están seguros?"
            answer="Sí. Usamos Supabase para autenticación y Stripe para pagos. Tus datos financieros están encriptados y nunca compartimos información con terceros."
          />
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-stone-200 bg-white transition-colors hover:border-stone-900">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 text-left transition-colors"
      >
        <span className="text-base font-serif text-stone-900 pr-4">{question}</span>
        <svg
          className={`h-5 w-5 flex-shrink-0 text-stone-900 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-stone-200 p-6 pt-4">
          <p className="text-stone-700 font-light leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}
