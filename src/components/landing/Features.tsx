import { useTranslations } from "next-intl";

export function Features() {
  const t = useTranslations("Features");

  return (
    <section id="features" className="relative py-24 bg-muted/30">
      <div className="relative z-10 mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-serif font-normal tracking-tight text-foreground sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground font-light">
            {t("subtitle")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title={t("cards.manual.title")}
            description={t("cards.manual.desc")}
          />

          <FeatureCard
            title={t("cards.fixed.title")}
            description={t("cards.fixed.desc")}
          />

          <FeatureCard
            title={t("cards.privacy.title")}
            description={t("cards.privacy.desc")}
          />

          <FeatureCard
            title={t("cards.ai.title")}
            description={t("cards.ai.desc")}
            isPro
          />
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  isPro?: boolean;
}

function FeatureCard({ title, description, isPro }: FeatureCardProps) {
  return (
    <div className="border border-border bg-card p-6 sm:p-8 transition-colors hover:border-primary/50">
      {/* Pro Badge */}
      {isPro && (
        <span className="inline-block mb-4 border border-primary bg-primary px-3 py-1 text-xs font-light text-primary-foreground tracking-wide">
          PRO
        </span>
      )}

      {/* Title */}
      <h3 className="mb-3 text-lg font-serif text-foreground">{title}</h3>

      {/* Description */}
      <p className="text-muted-foreground font-light leading-relaxed text-sm">{description}</p>
    </div>
  );
}
