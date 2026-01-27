import { CATEGORY_GUIDE } from "@/lib/categoryGuide";

export default function CategoryGuideCard() {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-base font-semibold">Guía de categorías</h2>
        <p className="text-sm text-black/60">
          Para meter gastos rápido sin pensarlo demasiado.
        </p>
      </div>

      <div className="space-y-2">
        {CATEGORY_GUIDE.map((section) => (
          <details key={section.title} className="rounded-xl border p-3">
            <summary className="cursor-pointer select-none font-medium">
              {section.title}
              {section.subtitle ? (
                <span className="block text-sm font-normal text-black/60">
                  {section.subtitle}
                </span>
              ) : null}
            </summary>

            <ul className="mt-3 space-y-2 text-sm">
              {section.items.map((item) => (
                <li key={item.label} className="rounded-lg bg-black/[0.03] p-2">
                  <span className="font-medium">{item.label}:</span>{" "}
                  <span className="text-black/60">{item.examples}</span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
