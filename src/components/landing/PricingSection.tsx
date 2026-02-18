import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function PricingSection() {
  const t = useTranslations('Landing.Pricing');

  return (
    <section id="pricing" className="relative py-24 bg-background">
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        {/* Section Header */}
        <div className="mb-16 text-center border-b border-border pb-8">
          <h2 className="mb-4 text-4xl font-serif font-normal tracking-tight text-foreground sm:text-5xl md:text-6xl">
            {t('title')}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground font-light">
            {t('subtitle')}
          </p>
        </div>

        {/* Pricing Card - Single Premium Plan */}
        <div className="border-2 border-stone-900 dark:border-stone-100 bg-card p-8 sm:p-12 shadow-lg transform hover:scale-[1.01] transition-transform duration-300">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-10 border-b border-border pb-8">
            <div>
              <h3 className="text-3xl font-serif text-foreground mb-2">{t('planName')}</h3>
              <p className="text-muted-foreground font-light">
                {t('planDesc')}
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-serif text-foreground">{t('price')}</span>
                <span className="text-muted-foreground font-light">{t('period')}</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                {t('trial')}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div className="space-y-4">
              <Feature text={t('features.f1')} />
              <Feature text={t('features.f2')} />
              <Feature text={t('features.f3')} />
              <Feature text={t('features.f4')} />
            </div>
            <div className="space-y-4">
              <Feature text={t('features.f5')} />
              <Feature text={t('features.f6')} />
              <Feature text={t('features.f7')} />
              <Feature text={t('features.f8')} />
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Link
              href="/login"
              className="w-full max-w-md border border-stone-900 bg-stone-900 dark:border-stone-100 dark:bg-stone-100 py-4 text-center text-lg font-light text-white dark:text-stone-900 transition-opacity hover:opacity-90 shadow-sm"
            >
              {t('cta')}
            </Link>
            <p className="text-xs text-muted-foreground font-light">
              {t('note')}
            </p>
          </div>
        </div>

        {/* Trust Footer */}
        <div className="mt-16 text-center border-t border-border pt-8">
          <p className="text-xs text-muted-foreground font-light max-w-3xl mx-auto leading-relaxed">
            {t('footer')}
          </p>
        </div>
      </div>
    </section>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <svg
        className="h-5 w-5 flex-shrink-0 text-foreground mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span className="text-muted-foreground font-light text-sm leading-relaxed">
        {text}
      </span>
    </div>
  );
}

function FeatureDisabled({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 opacity-40">
      <svg
        className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      <span className="text-muted-foreground font-light text-sm leading-relaxed">{text}</span>
    </div>
  );
}
