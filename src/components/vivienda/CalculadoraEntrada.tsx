"use client";

import { useId, useState } from "react";
import { PLAZOS_ANIOS, ahorroMensual, calcularEntrada } from "@/lib/vivienda";

interface Props {
    nombre: string;
    valorM2: number;
    superficieInicial: number;
    porcentajeInicial: number;
}

const numero = new Intl.NumberFormat("es-ES", { useGrouping: "always", maximumFractionDigits: 0 });
const eur = (value: number) => `${numero.format(value)} €`;

const MIN_M2 = 20;
const MAX_M2 = 400;
const MIN_PCT = 5;
const MAX_PCT = 50;

function parse(value: string, min: number, max: number): number | null {
    const n = Number(value.replace(",", "."));
    if (!Number.isFinite(n) || n < min || n > max) return null;
    return n;
}

/** Calculadora con los mismos cálculos deterministas que la tabla estática; el usuario ajusta superficie y porcentaje. */
export function CalculadoraEntrada({ nombre, valorM2, superficieInicial, porcentajeInicial }: Props) {
    const id = useId();
    const [m2, setM2] = useState(String(superficieInicial));
    const [pct, setPct] = useState(String(Math.round(porcentajeInicial * 100)));

    const superficie = parse(m2, MIN_M2, MAX_M2);
    const porcentaje = parse(pct, MIN_PCT, MAX_PCT);
    const valido = superficie !== null && porcentaje !== null;
    const resultado = valido ? calcularEntrada(valorM2, superficie, porcentaje / 100) : null;

    return (
        <div className="rounded-xl border border-border bg-muted/30 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor={`${id}-m2`} className="mb-1 block text-sm font-semibold">
                        Superficie de la vivienda (m²)
                    </label>
                    <input
                        id={`${id}-m2`}
                        type="number"
                        inputMode="decimal"
                        min={MIN_M2}
                        max={MAX_M2}
                        value={m2}
                        onChange={(e) => setM2(e.target.value)}
                        aria-invalid={superficie === null}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2"
                    />
                    <p className="mt-1 text-xs font-light text-muted-foreground">Entre {MIN_M2} y {MAX_M2} m².</p>
                </div>
                <div>
                    <label htmlFor={`${id}-pct`} className="mb-1 block text-sm font-semibold">
                        Entrada (% del valor)
                    </label>
                    <input
                        id={`${id}-pct`}
                        type="number"
                        inputMode="decimal"
                        min={MIN_PCT}
                        max={MAX_PCT}
                        value={pct}
                        onChange={(e) => setPct(e.target.value)}
                        aria-invalid={porcentaje === null}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2"
                    />
                    <p className="mt-1 text-xs font-light text-muted-foreground">Entre {MIN_PCT} % y {MAX_PCT} %.</p>
                </div>
            </div>

            <div className="mt-5" aria-live="polite">
                {resultado ? (
                    <>
                        <p className="font-light leading-relaxed">
                            Con el valor tasado medio de {nombre}, una vivienda de {numero.format(resultado.superficieM2)} m² se valoraría en{" "}
                            <strong className="font-semibold">{eur(resultado.valorEstimado)}</strong> y una entrada del {numero.format(porcentaje as number)} %
                            sería <strong className="font-semibold">{eur(resultado.entrada)}</strong>.
                        </p>
                        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                            {PLAZOS_ANIOS.map((anios) => (
                                <li key={anios} className="rounded-lg border border-border/60 bg-background px-3 py-2 font-light">
                                    {anios} años: <strong className="font-semibold">{eur(ahorroMensual(resultado.entrada, anios))}</strong> al mes
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <p className="text-sm font-light text-muted-foreground">
                        Introduce una superficie entre {MIN_M2} y {MAX_M2} m² y un porcentaje entre {MIN_PCT} % y {MAX_PCT} %.
                    </p>
                )}
            </div>
        </div>
    );
}
