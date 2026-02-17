import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { HeroCTA } from "./HeroCTA";

export function Hero() {
  const t = useTranslations("Hero");

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-20 text-center">
        {/* Badge */}
        <div className="mx-auto mb-8 inline-flex items-center gap-2 border border-border bg-card px-4 py-2 text-xs font-light text-muted-foreground tracking-wide rounded-full">
          {t("badge")}
        </div>

        {/* Main Heading - Serif elegante */}
        <h1 className="mb-8 text-5xl font-serif font-normal tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
          {t("title")}
        </h1>

        {/* Subtitle */}
        <h2 className="mx-auto mb-12 max-w-3xl text-base text-muted-foreground sm:text-lg md:text-xl font-light leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: t.raw("subtitle") }} />
        </h2>

        {/* CTA Buttons - Rectangulares, sobrios */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <HeroCTA label={t("ctaPrimary")} />

          <Link
            href="#pricing"
            className="inline-flex items-center justify-center border border-border bg-card px-8 py-4 text-base font-normal text-foreground transition-colors hover:border-foreground"
          >
            {t("ctaSecondary")}
          </Link>
        </div>

        {/* Trust Signal - Enhanced Visibility */}
        <p className="text-sm font-medium text-foreground tracking-wide bg-muted/50 py-2 px-4 rounded-full inline-block">
          <span dangerouslySetInnerHTML={{ __html: t.raw("trustSignal") }} />
        </p>

        {/* Product Hunt Badge */}
        <div className="mt-8 flex justify-center">
          <a href="https://www.producthunt.com/products/kakebo-ai?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-kakebo-ai" target="_blank" rel="noopener noreferrer">
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1080945&theme=light&t=1771340432212"
              alt="Kakebo AI - Minimalist Japanese Kakebo method, now powered by AI | Product Hunt"
              style={{ width: '250px', height: '54px' }}
              width="250"
              height="54"
            />
          </a>
        </div>

        {/* Stats Card - Sobrio */}
        <div className="mx-auto mt-20 max-w-4xl border border-border bg-card p-8 sm:p-12 shadow-sm">
          <div className="grid gap-8 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="pt-4 sm:pt-0 text-center">
              <div className="mb-2 text-4xl font-serif text-foreground">{t("stats.trial")}</div>
              <div className="text-sm text-muted-foreground font-light">{t("stats.trialLabel")}</div>
            </div>
            <div className="pt-4 sm:pt-0 text-center">
              <div className="mb-2 text-4xl font-serif text-foreground">{t("stats.price")}</div>
              <div className="text-sm text-muted-foreground font-light">{t("stats.priceLabel")}</div>
            </div>
            <div className="pt-4 sm:pt-0 text-center">
              <div className="mb-2 text-4xl font-serif text-foreground">{t("stats.privacy")}</div>
              <div className="text-sm text-muted-foreground font-light">{t("stats.privacyLabel")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
