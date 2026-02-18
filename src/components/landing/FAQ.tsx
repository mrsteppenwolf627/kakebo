"use client";

import { useState } from "react";

interface FaqItemProps {
  question: string;
  answer: string;
}

import { useTranslations } from 'next-intl';

export function FAQ() {
  const t = useTranslations('FAQ');
  const questions = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;

  return (
    <section id="faq" className="relative py-24 bg-background">
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        {/* Section Header */}
        <div className="mb-12 text-center border-b border-border pb-8">
          <h2 className="mb-4 text-4xl font-serif font-normal tracking-tight text-foreground sm:text-5xl">
            {t('title')}
          </h2>
          <p className="text-base text-muted-foreground font-light">
            {t('subtitle')}
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {questions.map((key) => (
            <FaqItem
              key={key}
              question={t(`questions.${key}.question`)}
              answer={t(`questions.${key}.answer`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border bg-card transition-colors hover:border-foreground/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 text-left transition-colors"
      >
        <span className="text-base font-serif text-foreground pr-4">{question}</span>
        <svg
          className={`h-5 w-5 flex-shrink-0 text-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="border-t border-border p-6 pt-4">
          <p className="text-muted-foreground font-light leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}
