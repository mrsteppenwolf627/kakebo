interface Props {
    nombre: string;
    valorM2: number;
    mediaNacionalM2: number;
    maxM2: number;
    periodo: string;
}

const decimal = new Intl.NumberFormat("es-ES", { useGrouping: "always", minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Barras horizontales: valor tasado de la provincia frente a la media nacional y la provincia más cara, a la misma escala. */
export function GraficoValorTasado({ nombre, valorM2, mediaNacionalM2, maxM2, periodo }: Props) {
    const filas = [
        { etiqueta: nombre, valor: valorM2, destacada: true },
        { etiqueta: "Media nacional", valor: mediaNacionalM2, destacada: false },
    ];
    const escala = Math.max(maxM2, valorM2, mediaNacionalM2);
    const resumen = `Valor tasado medio por m² en el ${periodo}: ${filas
        .map((f) => `${f.etiqueta} ${decimal.format(f.valor)} €/m²`)
        .join("; ")}.`;

    return (
        <figure className="mt-8">
            <div role="img" aria-label={resumen} className="space-y-3">
                {filas.map((f) => (
                    <div key={f.etiqueta}>
                        <div className="mb-1 flex justify-between text-sm font-light">
                            <span>{f.etiqueta}</span>
                            <span className="font-semibold">{decimal.format(f.valor)} €/m²</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-muted">
                            <div
                                className={`h-3 rounded-full ${f.destacada ? "bg-primary" : "bg-muted-foreground/50"}`}
                                style={{ width: `${Math.max(2, Math.round((f.valor / escala) * 100))}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <figcaption className="mt-2 text-xs font-light text-muted-foreground">
                Valor tasado medio de vivienda libre, {periodo}. Escala: hasta la provincia con el valor más alto ({decimal.format(maxM2)} €/m²).
            </figcaption>
        </figure>
    );
}
