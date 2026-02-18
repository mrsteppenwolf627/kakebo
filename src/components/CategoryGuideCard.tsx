import { useTranslations } from "next-intl";

const SECTIONS = ["supervivencia", "opcional", "cultura", "extra"] as const;
const SECTION_ITEMS = {
  supervivencia: ["i1", "i2", "i3", "i4", "i5"],
  opcional: ["i1", "i2", "i3", "i4"],
  cultura: ["i1", "i2", "i3"],
  extra: ["i1", "i2", "i3"],
} as const;

export default function CategoryGuideCard() {
  const t = useTranslations("CategoryGuide");

  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm transition-colors">
      <div className="mb-4">
        <h2 className="text-lg font-serif font-medium text-foreground">{t("title")}</h2>
        <p className="text-sm text-muted-foreground font-light">
          {t("subtitle")}
        </p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((sectionKey) => (
          <details key={sectionKey} className="group rounded-md border border-border bg-muted/30 open:bg-muted/50 transition-colors">
            <summary className="cursor-pointer select-none font-medium p-3 flex items-center justify-between text-foreground hover:text-primary transition-colors">
              <div>
                {t(`sections.${sectionKey}.title`)}
                <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                  {t(`sections.${sectionKey}.subtitle`)}
                </span>
              </div>
              <span className="text-muted-foreground group-open:rotate-180 transition-transform duration-200">
                ▼
              </span>
            </summary>

            <div className="px-3 pb-3 pt-0">
              <div className="h-px bg-border mb-3" />
              <ul className="space-y-2 text-sm">
                {(SECTION_ITEMS as any)[sectionKey].map((itemKey: string) => (
                  <li key={itemKey} className="rounded bg-background/50 p-2 text-muted-foreground">
                    <span className="font-medium text-foreground">{t(`sections.${sectionKey}.items.${itemKey}.label`)}:</span>{" "}
                    <span className="opacity-80 font-light">{t(`sections.${sectionKey}.items.${itemKey}.examples`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
