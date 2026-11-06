import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";
import { CalculadoraEntrada } from "@/components/vivienda/CalculadoraEntrada";
import { calcularEntrada, ahorroMensual } from "@/lib/vivienda";

afterEach(() => cleanup());

const nf = new Intl.NumberFormat("es-ES", { useGrouping: "always", maximumFractionDigits: 0 });

describe("CalculadoraEntrada", () => {
  it("muestra el cálculo por defecto idéntico al de la tabla estática", () => {
    const { entrada } = calcularEntrada(4089.6);
    const { container } = render(<CalculadoraEntrada nombre="Madrid" valorM2={4089.6} superficieInicial={80} porcentajeInicial={0.2} />);
    expect(container.textContent).toContain(`${nf.format(entrada)} €`);
    expect(container.textContent).toContain(`${nf.format(ahorroMensual(entrada, 10))} €`);
  });

  it("recalcula al cambiar superficie y porcentaje", () => {
    const { container } = render(<CalculadoraEntrada nombre="Madrid" valorM2={4089.6} superficieInicial={80} porcentajeInicial={0.2} />);
    fireEvent.change(screen.getByLabelText(/Superficie/), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText(/Entrada/), { target: { value: "30" } });
    const { entrada } = calcularEntrada(4089.6, 100, 0.3);
    expect(container.textContent).toContain(`${nf.format(entrada)} €`);
  });

  it("no calcula con valores fuera de rango", () => {
    const { container } = render(<CalculadoraEntrada nombre="Madrid" valorM2={4089.6} superficieInicial={80} porcentajeInicial={0.2} />);
    fireEvent.change(screen.getByLabelText(/Superficie/), { target: { value: "5" } });
    expect(container.textContent).toContain("Introduce una superficie entre");
    expect(container.textContent).not.toContain("al mes");
  });
});
