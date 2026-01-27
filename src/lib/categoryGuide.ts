export type CategoryGuideSection = {
  title: string;
  subtitle?: string;
  items: { label: string; examples: string }[];
};

export const CATEGORY_GUIDE: CategoryGuideSection[] = [
  {
    title: "Supervivencia",
    subtitle: "Gastos fijos y esenciales (no negociables).",
    items: [
      { label: "Alimentación", examples: "Compra del supermercado." },
      { label: "Vivienda", examples: "Alquiler/hipoteca, comunidad, impuestos." },
      { label: "Suministros", examples: "Luz, agua, gas, internet." },
      { label: "Transporte", examples: "Abono, gasolina, mantenimiento del coche." },
      { label: "Salud", examples: "Farmacia, seguro médico o dentista." },
    ],
  },
  {
    title: "Ocio y Vicio",
    subtitle: "Gastos variables y deseos (recortables si toca apretar).",
    items: [
      { label: "Restauración", examples: "Comer fuera, cafés, delivery." },
      {
        label: "Cultura",
        examples: "Cine, conciertos, libros o suscripciones (Netflix, Spotify).",
      },
      { label: "Compras", examples: "Ropa, accesorios o gadgets no urgentes." },
      { label: "Tabaco/Alcohol", examples: "Para ver cuánto pesan de verdad." },
    ],
  },
  {
    title: "Cultura",
    subtitle: "Enriquecimiento personal (Kakebo lo separa).",
    items: [
      { label: "Formación", examples: "Cursos, talleres o idiomas." },
      { label: "Eventos", examples: "Museos, teatros o conferencias." },
      {
        label: "Herramientas",
        examples:
          "Material para hobby que te aporte una habilidad (pintura, instrumentos…).",
      },
    ],
  },
  {
    title: "Extras",
    subtitle: "Lo inesperado o puntual (lo que desestabiliza).",
    items: [
      { label: "Regalos", examples: "Cumpleaños, bodas o detalles." },
      { label: "Reparaciones", examples: "Averías del coche, móvil roto, fontanero." },
      { label: "Viajes", examples: "Escapadas o billetes de avión." },
    ],
  },
];
