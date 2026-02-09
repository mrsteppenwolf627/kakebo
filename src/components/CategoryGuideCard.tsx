import { CATEGORY_GUIDE } from "@/lib/categoryGuide";

export default function CategoryGuideCard() {
  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm transition-colors">
      <div className="mb-4">
        <h2 className="text-lg font-serif font-medium text-foreground">Guía de categorías</h2>
        <p className="text-sm text-muted-foreground font-light">
          Para clasificar gastos rápido sin pensarlo demasiado.
        </p>
      </div>

      <div className="space-y-3">
        {CATEGORY_GUIDE.map((section) => (
          <details key={section.title} className="group rounded-md border border-border bg-muted/30 open:bg-muted/50 transition-colors">
            <summary className="cursor-pointer select-none font-medium p-3 flex items-center justify-between text-foreground hover:text-primary transition-colors">
              <div>
                {section.title}
                {section.subtitle ? (
                  <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                    {section.subtitle}
                  </span>
                ) : null}
              </div>
              <span className="text-muted-foreground group-open:rotate-180 transition-transform duration-200">
                ▼
              </span>
            </summary>

            <div className="px-3 pb-3 pt-0">
              <div className="h-px bg-border mb-3" />
              <ul className="space-y-2 text-sm">
                {section.items.map((item) => (
                  <li key={item.label} className="rounded bg-background/50 p-2 text-muted-foreground">
                    <span className="font-medium text-foreground">{item.label}:</span>{" "}
                    <span className="opacity-80 font-light">{item.examples}</span>
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
