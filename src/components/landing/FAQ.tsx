"use client";

import { useState } from "react";

interface FaqItemProps {
  question: string;
  answer: string;
}

export function FAQ() {
  return (
    <section className="relative py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/30 via-white to-purple-50/30" />

      <div className="relative z-10 mx-auto max-w-4xl px-4">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Preguntas frecuentes
          </h2>
          <p className="text-lg text-gray-600">
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
            question="¿Qué pasa si no cancelo antes del día 15?"
            answer="Te enviaremos un aviso antes del día 15. Si no cancelas, se te cobrará 9.99€/mes automáticamente. Puedes cancelar en cualquier momento después sin penalizaciones."
          />

          <FaqItem
            question="¿Kakebo sirve aunque ya use una app bancaria?"
            answer="Sí. Tu banco te muestra movimientos; Kakebo te obliga a entender decisiones y patrones. La clave está en la revisión mensual consciente y la intención de mejorar."
          />

          <FaqItem
            question="¿Qué diferencia hay entre gastos fijos y supervivencia?"
            answer="Gastos fijos son pagos recurrentes predecibles (alquiler, luz, internet, suscripciones). Supervivencia son gastos variables pero esenciales (comida, transporte diario, farmacia)."
          />

          <FaqItem
            question="¿Mis datos están seguros?"
            answer="Sí. Usamos Supabase para autenticación y Stripe para pagos. Tus datos financieros están encriptados y nunca compartimos información con terceros."
          />

          <FaqItem
            question="¿Puedo cambiar de Plan Pro a Plan Manual?"
            answer="Sí, puedes hacer downgrade en cualquier momento desde tu perfil. Perderás acceso al Agente IA pero mantendrás todos tus datos históricos intactos."
          />

          <FaqItem
            question="¿Necesito Google para registrarme?"
            answer="No. Puedes registrarte con tu email directamente. No dependemos de proveedores externos para el registro."
          />
        </div>

        {/* Still have questions CTA */}
        <div className="mt-12 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50/80 to-indigo-50/80 backdrop-blur-sm p-8 text-center shadow-lg">
          <h3 className="mb-2 text-xl font-bold text-gray-900">¿Tienes más preguntas?</h3>
          <p className="mb-4 text-gray-600">
            Estamos aquí para ayudarte. Regístrate y empieza gratis hoy.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-violet-700 hover:to-indigo-700 hover:shadow-xl"
          >
            Empezar ahora
          </a>
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200/50 bg-white/60 backdrop-blur-sm shadow-md transition-all duration-300 hover:shadow-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 text-left transition-colors"
      >
        <span className="text-lg font-semibold text-gray-900 pr-4">{question}</span>
        <svg
          className={`h-6 w-6 flex-shrink-0 text-violet-600 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-gray-200/50 p-6 pt-4">
          <p className="text-gray-700 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}
