import { describe, it, expect } from "vitest";
import {
  containsSynthesisPlaceholder,
  SYNTHESIS_SAFETY_FALLBACK_MESSAGE,
} from "@/lib/agents-v2/synthesis-guard";

/**
 * Hotfix 2.2: detector puro de placeholders/capacidades inexistentes en la
 * síntesis final del chat activo. Bug real: tras un resultado de herramienta
 * con datos reales, la síntesis emitió una plantilla sin sustituir ("Basado
 * en N gastos", "€X,XX", "[Concepto] - €importe", IDs de ejemplo) y ofreció
 * "reasignar automáticamente" gastos — una capacidad que no existe.
 */
describe("containsSynthesisPlaceholder (Hotfix 2.2)", () => {
  it("detecta los patrones de placeholder exactos observados en el bug real", () => {
    expect(containsSynthesisPlaceholder("Basado en 3 gastos, gastaste €X,XX en total")).toBe(true);
    expect(containsSynthesisPlaceholder("Gastaste €X en supervivencia")).toBe(true);
    expect(containsSynthesisPlaceholder("Tengo N gastos en este ámbito")).toBe(true);
    expect(containsSynthesisPlaceholder("1. [Concepto] - €45.20")).toBe(true);
    expect(containsSynthesisPlaceholder("El total es €importe")).toBe(true);
    expect(containsSynthesisPlaceholder("Este gasto tiene ID: xxx-xxx-xxx")).toBe(true);
    expect(containsSynthesisPlaceholder("Referencia xxx-xxx en el sistema")).toBe(true);
  });

  it("detecta ofertas de reasignación/reclasificación automática en bloque", () => {
    expect(
      containsSynthesisPlaceholder("¿Quieres que reasigne automáticamente los gastos sin clasificar?")
    ).toBe(true);
    expect(
      containsSynthesisPlaceholder("Puedo hacer una reclasificación automática de tu histórico")
    ).toBe(true);
    expect(
      containsSynthesisPlaceholder("Puedo corregirlos automáticamente en bloque por palabra clave")
    ).toBe(true);
  });

  it("NO marca una respuesta real y legítima con cifras concretas", () => {
    const realResponse =
      "En tu ciclo anterior (2026-08): alimentación básica 62.30€ (5 gastos), comer fuera 41.00€ (3 gastos) — total clasificado 103.30€. Aviso: 4 gastos de ese ciclo no tienen subcategoría asignada, así que esta cifra no incluye absolutamente todo el gasto en comida de ese ciclo, solo lo ya clasificado.";
    expect(containsSynthesisPlaceholder(realResponse)).toBe(false);
  });

  it("NO marca un listado real de gastos con conceptos, importes e IDs reales", () => {
    const realResponse =
      "1. **Mercadona** - €45.20 [Supervivencia] (15/02/2026) (ID: 740e0ff2-0c56-4576-ad7f-807304f4e2cd)\n2. **Cena restaurante** - €32.00 [Opcional] (12/02/2026) (ID: 1c4e5d4b-6c3e-4b1c-8b9f-3c1e5e5c6a1a)";
    expect(containsSynthesisPlaceholder(realResponse)).toBe(false);
  });

  it("NO marca una oferta legítima de revisar gastos uno a uno (no automática/en bloque)", () => {
    expect(
      containsSynthesisPlaceholder("Si quieres, podemos revisar esos 4 gastos uno a uno para asignarles subcategoría.")
    ).toBe(false);
  });

  it("NO marca texto normal sin ninguna cifra ni ID", () => {
    expect(
      containsSynthesisPlaceholder("No puedo darte asesoramiento financiero personalizado, pero puedo ayudarte a analizar tus gastos.")
    ).toBe(false);
  });

  it("es insensible a mayúsculas/minúsculas en los patrones que lo requieren", () => {
    expect(containsSynthesisPlaceholder("tengo n gastos en este ámbito")).toBe(true);
    expect(containsSynthesisPlaceholder("REASIGNAR AUTOMÁTICAMENTE los gastos")).toBe(true);
  });
});

describe("SYNTHESIS_SAFETY_FALLBACK_MESSAGE (Hotfix 2.2)", () => {
  it("es un mensaje honesto que no repite ningún patrón de placeholder", () => {
    expect(containsSynthesisPlaceholder(SYNTHESIS_SAFETY_FALLBACK_MESSAGE)).toBe(false);
  });

  it("no inventa ninguna cifra ni capacidad, y es no vacío", () => {
    expect(SYNTHESIS_SAFETY_FALLBACK_MESSAGE.length).toBeGreaterThan(0);
    expect(SYNTHESIS_SAFETY_FALLBACK_MESSAGE).not.toMatch(/€\s*\d/);
  });
});
