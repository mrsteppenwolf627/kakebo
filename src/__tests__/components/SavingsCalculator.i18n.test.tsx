import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider, createTranslator } from "next-intl";
import esMessages from "../../../messages/es.json";
import enMessages from "../../../messages/en.json";
import { savingsPageContent } from "@/content/savings-calculator-page";

vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, onClick, ...rest }: { href: string; children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/landing/Navbar", () => ({ Navbar: () => null }));
// ToolMessages es un Server Component asíncrono (se prueba aparte en tool-messages.test.tsx):
// aquí se sustituye por un paso directo y el proveedor del test ya lleva todos los mensajes.
vi.mock("@/components/i18n/ToolMessages", () => ({
  ToolMessages: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) =>
    createTranslator({
      locale,
      namespace: namespace as never,
      messages: (locale === "en" ? enMessages : esMessages) as never,
    }),
}));

import { SavingsCalculator } from "@/components/landing/tools/SavingsCalculator";
import SavingsCalculatorPage from "@/app/[locale]/(public)/herramientas/calculadora-ahorro/page";

afterEach(() => cleanup());

type Messages = typeof esMessages;

const flatten = (obj: unknown, prefix = ""): Record<string, number> => {
  const out: Record<string, number> = {};
  if (Array.isArray(obj)) {
    out[prefix] = obj.length;
    obj.forEach((v, i) => Object.assign(out, flatten(v, `${prefix}[${i}]`)));
  } else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) Object.assign(out, flatten(v, prefix ? `${prefix}.${k}` : k));
  } else {
    out[prefix] = 1;
  }
  return out;
};

const renderCalculator = (locale: "es" | "en") =>
  render(
    <NextIntlClientProvider locale={locale} messages={(locale === "en" ? enMessages : esMessages) as Messages}>
      <SavingsCalculator />
    </NextIntlClientProvider>
  );

const renderPage = async (locale: "es" | "en") => {
  const ui = await SavingsCalculatorPage({ params: Promise.resolve({ locale }) });
  return render(
    <NextIntlClientProvider locale={locale} messages={(locale === "en" ? enMessages : esMessages) as Messages}>
      {ui}
    </NextIntlClientProvider>
  );
};

// Texto visible + atributos accesibles (aria-label, placeholder, title) + JSON-LD
const collectText = (root: HTMLElement) => {
  const parts = [root.textContent ?? ""];
  root.querySelectorAll("[aria-label],[placeholder],[title]").forEach((el) => {
    parts.push(el.getAttribute("aria-label") ?? "", el.getAttribute("placeholder") ?? "", el.getAttribute("title") ?? "");
  });
  root.querySelectorAll('script[type="application/ld+json"]').forEach((el) => parts.push(el.textContent ?? ""));
  return parts.join("\n");
};

const SPANISH_CHARS = /[¿¡áéíóúñÁÉÍÓÚÑ]/;
const SPANISH_WORDS = [
  "Ingresos",
  "Gastos fijos",
  "Gastos variables",
  "Déficit",
  "Margen",
  "Fórmula",
  "Preguntas frecuentes",
  "objetivo de ahorro",
  "Calculadora",
  "meses",
];

describe("paridad de claves i18n", () => {
  it.each(["Tools.Savings", "Tools.Common", "CookieBanner"])("%s tiene las mismas claves en es y en", (path) => {
    const pick = (m: unknown) => path.split(".").reduce((acc: any, k) => acc[k], m as any);
    const es = flatten(pick(esMessages));
    const en = flatten(pick(enMessages));
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
    expect(en).toEqual(es);
  });

  it("el contenido editorial de la página (HowTo, FAQ, fórmula, schema) tiene la misma estructura en es y en", () => {
    expect(flatten(savingsPageContent.en)).toEqual(flatten(savingsPageContent.es));
  });

  it("incluye las claves que faltaban en inglés", () => {
    const content = enMessages.Tools.Savings.content as Record<string, string>;
    for (const key of ["link0", "link3", "link4", "link5", "link6"]) expect(content[key]).toBeTruthy();
    expect(enMessages.Tools.Common.embed.close).toBe("Close");
    expect(enMessages.CookieBanner.reject).toBeTruthy();
  });
});

describe("la experiencia inglesa no contiene texto fijo en español", () => {
  it("la calculadora en inglés no tiene caracteres ni palabras españolas", () => {
    const { container } = renderCalculator("en");
    const text = collectText(container);
    expect(text).not.toMatch(SPANISH_CHARS);
    for (const word of SPANISH_WORDS) expect(text).not.toContain(word);
  });

  it("la página completa en inglés (calculadora, fórmula, HowTo, FAQ y JSON-LD) está en inglés", async () => {
    const { container } = await renderPage("en");
    const text = collectText(container);
    expect(text).not.toMatch(SPANISH_CHARS);
    for (const word of SPANISH_WORDS) expect(text).not.toContain(word);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("ningún texto español de es.json aparece en la vista inglesa", async () => {
    const { container } = await renderPage("en");
    const text = collectText(container);

    const collect = (o: unknown, out: string[] = []) => {
      if (typeof o === "string") out.push(o);
      else if (Array.isArray(o)) o.forEach((v) => collect(v, out));
      else if (o && typeof o === "object") Object.values(o).forEach((v) => collect(v, out));
      return out;
    };
    const enStrings = new Set([...collect(enMessages.Tools.Savings), ...collect(savingsPageContent.en)]);
    for (const s of [...collect(esMessages.Tools.Savings), ...collect(savingsPageContent.es)]) {
      if (s.length < 14 || enStrings.has(s)) continue; // cadenas compartidas o numéricas
      expect(text).not.toContain(s);
    }
  });

  it("no ofrece el código de embed (su destino no es verificable) en ninguno de los dos idiomas", () => {
    for (const locale of ["es", "en"] as const) {
      renderCalculator(locale);
      const embedButton = (esMessages.Tools.Common.embed.button + "|" + enMessages.Tools.Common.embed.button).split("|");
      for (const label of embedButton) {
        expect(screen.queryByRole("button", { name: label })).toBeNull();
      }
      expect(screen.queryByRole("dialog")).toBeNull();
      cleanup();
    }
  });

  it("los importes se formatean según el idioma", () => {
    const en = renderCalculator("en");
    expect(en.container.textContent).toContain("€700");
    cleanup();
    const es = renderCalculator("es");
    expect(es.container.textContent).toMatch(/700\s€/);
  });
});

describe("enlace a cuentas remuneradas", () => {
  it("no se enlaza desde la versión inglesa (no hay artículo inglés)", () => {
    renderCalculator("en");
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs.some((h) => h?.includes("cuentas-remuneradas"))).toBe(false);
    expect(hrefs).toContain("/blog/como-hacer-un-presupuesto-personal");
  });

  it("sí se enlaza en español, sin prefijo de idioma", () => {
    renderCalculator("es");
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/blog/cuentas-remuneradas");
  });
});

describe("HTML visible y JSON-LD comparten FAQ y HowTo", () => {
  it.each(["es", "en"] as const)("coinciden en %s", async (locale) => {
    const { container } = await renderPage(locale);
    const blocks = Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map((s) =>
      JSON.parse(s.textContent ?? "null")
    );
    const flat = blocks.flat();
    const faq = flat.find((b) => b["@type"] === "FAQPage");
    const howTo = flat.find((b) => b["@type"] === "HowTo");
    const visible = container.textContent ?? "";
    expect(faq.mainEntity.length).toBe(6);
    for (const q of faq.mainEntity) {
      expect(visible).toContain(q.name);
      expect(visible).toContain(q.acceptedAnswer.text);
    }
    expect(howTo.step.length).toBe(4);
    for (const s of howTo.step) {
      expect(visible).toContain(s.name);
      expect(visible).toContain(s.text);
    }
  });

  it("el JSON-LD en español conserva el contenido existente (name, FAQ, HowTo)", async () => {
    const { container } = await renderPage("es");
    const flat = Array.from(container.querySelectorAll('script[type="application/ld+json"]'))
      .map((s) => JSON.parse(s.textContent ?? "null"))
      .flat();
    const app = flat.find((b) => b["@type"] === "SoftwareApplication");
    expect(app.name).toBe("Calculadora de Ahorro Mensual");
    expect(app.dateModified).toBe("2026-10-21");
    expect(app.featureList).toHaveLength(5);
    const faq = flat.find((b) => b["@type"] === "FAQPage");
    expect(faq.mainEntity[0].name).toBe("¿Cómo saber cuánto puedo ahorrar cada mes?");
    const howTo = flat.find((b) => b["@type"] === "HowTo");
    expect(howTo.name).toBe("Cómo calcular tu margen real de ahorro mensual");
  });
});

describe("sección de fórmula, supuestos y límites", () => {
  it.each(["es", "en"] as const)("incluye fórmula, supuestos, límites, aviso y enlace a Sobre nosotros (%s)", async (locale) => {
    await renderPage(locale);
    const msg = savingsPageContent[locale].formula;
    expect(screen.getByRole("heading", { level: 2, name: msg.title })).toBeTruthy();
    expect(screen.getByRole("note").textContent).toBe(msg.notice);
    for (const title of [msg.howTitle, msg.assumptionsTitle, msg.limitsTitle]) {
      expect(screen.getByRole("heading", { level: 3, name: title })).toBeTruthy();
    }
    const about = screen.getByRole("link", { name: msg.aboutLink });
    expect(about.getAttribute("href")).toBe("/sobre-nosotros");
  });

  it("el cálculo por defecto sigue dando 700 € / 35 % y objetivo en 5 meses", async () => {
    renderCalculator("es");
    expect(document.body.textContent).toMatch(/700\s€/);
    expect(document.body.textContent).toContain("35%");
    fireEvent.click(screen.getByRole("button", { name: esMessages.Tools.Savings.inputs.goalToggle }));
    fireEvent.change(document.getElementById("sc-goal") as HTMLInputElement, { target: { value: "3000" } });
    await waitFor(() => {
      const card = screen.getByText(esMessages.Tools.Savings.results.goalMonths).parentElement as HTMLElement;
      expect(card.textContent).toContain("5");
      const needed = screen.getByText(new RegExp(esMessages.Tools.Savings.results.goalNeeded)).parentElement as HTMLElement;
      expect(needed.textContent).toMatch(/250\s€/);
    });
  });
});
