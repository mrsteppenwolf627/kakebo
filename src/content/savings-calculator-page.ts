// Contenido editorial de la página /herramientas/calculadora-ahorro que solo renderiza el servidor
// (HowTo, FAQ, fórmula/supuestos/límites y datos del JSON-LD). Vive fuera de messages/*.json a propósito:
// el layout envía todos los mensajes i18n al navegador y este contenido no hace falta allí.
// Los textos en español de HowTo, FAQ y JSON-LD son los que ya existían en la página.

export type SavingsPageContent = {
    howTo: { title: string; schemaName: string; steps: { name: string; text: string }[] };
    faq: { title: string; items: { q: string; a: string }[] };
    schema: { name: string; description: string; featureList: string[] };
    formula: {
        title: string;
        notice: string;
        howTitle: string;
        how: { term: string; text: string }[];
        assumptionsTitle: string;
        assumptions: string[];
        limitsTitle: string;
        limits: string[];
        readingTitle: string;
        reading: string;
        aboutText: string;
        aboutLink: string;
    };
};

export const savingsPageContent: Record<"es" | "en", SavingsPageContent> = {
    "es": {
        "howTo": {
            "title": "¿Cómo usar la calculadora de ahorro mensual?",
            "schemaName": "Cómo calcular tu margen real de ahorro mensual",
            "steps": [
                {
                    "name": "Introduce tus ingresos netos",
                    "text": "Escribe la cantidad que recibes en tu cuenta bancaria cada mes, después de impuestos y retenciones."
                },
                {
                    "name": "Añade tus gastos fijos",
                    "text": "Introduce el total mensual de compromisos que se repiten siempre con el mismo importe: alquiler o hipoteca, seguros, suscripciones y préstamos."
                },
                {
                    "name": "Añade tus gastos variables",
                    "text": "Introduce el promedio mensual de gastos que cambian cada mes: alimentación, ocio, transporte, ropa y otros gastos discrecionales."
                },
                {
                    "name": "Lee tu margen real de ahorro",
                    "text": "La calculadora muestra tu margen real (ingresos menos todos tus gastos) y tu tasa de ahorro. El método Kakebo recomienda un mínimo del 20%. Si tienes un objetivo concreto, activa 'Añadir objetivo de ahorro' para ver cuántos meses necesitas."
                }
            ]
        },
        "faq": {
            "title": "Preguntas frecuentes sobre el ahorro mensual",
            "items": [
                {
                    "q": "¿Cómo saber cuánto puedo ahorrar cada mes?",
                    "a": "Resta tus gastos fijos y variables a tus ingresos netos. El resultado es tu margen real de ahorro. El método Kakebo recomienda que ese margen sea al menos el 20% de tus ingresos."
                },
                {
                    "q": "¿Cuál es la diferencia entre gastos fijos y variables?",
                    "a": "Los gastos fijos son compromisos que se repiten cada mes con el mismo importe: alquiler, hipoteca, seguros, suscripciones. Los variables cambian: alimentación, ocio, transporte, ropa. Controlar los variables es donde tienes más margen de acción a corto plazo."
                },
                {
                    "q": "¿Cuánto tiempo tardaré en alcanzar mi objetivo de ahorro?",
                    "a": "Depende de tu margen mensual real. Activa la sección 'Añadir objetivo' en la calculadora: introduce el importe objetivo y, opcionalmente, el plazo en meses. La herramienta mostrará el tiempo necesario a tu ritmo actual y cuánto deberías ahorrar al mes para alcanzarlo en un plazo concreto."
                },
                {
                    "q": "¿Qué porcentaje de ahorro mensual es suficiente?",
                    "a": "El método Kakebo recomienda el 20% como mínimo. Por debajo del 10%, el margen es tan ajustado que cualquier imprevisto lo elimina. Si no puedes llegar al 20%, empieza por un 5% constante: ahorrar poco de forma sostenida construye más patrimonio que intentar el 20% y abandonarlo a los tres meses."
                },
                {
                    "q": "¿Cómo calculo el dinero que necesito para un fondo de emergencia?",
                    "a": "Un fondo de emergencia estándar cubre entre 3 y 6 meses de tus gastos fijos mensuales. Si tus gastos fijos son 800 € al mes, tu objetivo debería ser entre 2.400 € y 4.800 €. Usa la sección 'Añadir objetivo' de la calculadora para saber cuántos meses necesitas a tu ritmo de ahorro actual."
                },
                {
                    "q": "¿En qué se diferencia esta calculadora de la regla 50/30/20?",
                    "a": "La regla 50/30/20 toma tus ingresos y los distribuye en porcentajes teóricos (50% necesidades, 30% deseos, 20% ahorro). Esta calculadora hace lo contrario: parte de tus gastos reales (fijos y variables) y calcula el margen que te queda de verdad. Con la misma nómina, el margen real puede ser muy diferente del 20% teórico según cuánto sumen tus compromisos fijos."
                }
            ]
        },
        "schema": {
            "name": "Calculadora de Ahorro Mensual",
            "description": "Herramienta gratuita de MetodoKakebo.com para calcular el margen real de ahorro mensual según ingresos, gastos fijos y gastos variables.",
            "featureList": [
                "Cálculo de margen real de ahorro mensual",
                "Separación de gastos fijos y variables",
                "Estimación de tiempo para objetivo de ahorro",
                "Visualización de distribución de ingresos",
                "Cálculo de ahorro mensual necesario por plazo"
            ]
        },
        "formula": {
            "title": "Fórmula, supuestos y límites de la estimación",
            "notice": "Aviso: es una estimación orientativa y no constituye asesoramiento financiero, fiscal ni de inversión.",
            "howTitle": "Cómo se calcula",
            "how": [
                {
                    "term": "Margen real",
                    "text": "= ingresos netos − gastos fijos − gastos variables."
                },
                {
                    "term": "Tasa de ahorro",
                    "text": "= margen real ÷ ingresos netos × 100. Se muestra redondeada al entero más cercano."
                },
                {
                    "term": "Referencia Kakebo",
                    "text": "= 20 % de tus ingresos netos, y la diferencia entre tu margen real y esa cifra."
                },
                {
                    "term": "Meses hasta tu objetivo",
                    "text": "= objetivo ÷ margen real, redondeado hacia arriba."
                },
                {
                    "term": "Ahorro mensual necesario",
                    "text": "= objetivo ÷ plazo en meses, redondeado hacia arriba."
                }
            ],
            "assumptionsTitle": "Supuestos",
            "assumptions": [
                "Los importes se tratan como mensuales y constantes: un mes típico, no un mes concreto.",
                "Los ingresos son netos, es decir, lo que recibes después de impuestos y retenciones.",
                "No se aplican intereses, rentabilidad ni inflación: el dinero ahorrado se suma sin crecer ni perder valor.",
                "Los gastos variables son un promedio que tú estimas; cuanto más real sea ese promedio, más útil será el resultado."
            ],
            "limitsTitle": "Límites",
            "limits": [
                "Es una estimación orientativa, no asesoramiento financiero, fiscal ni de inversión.",
                "Con ingresos irregulares, el resultado cambiará de un mes a otro; conviene repetir el cálculo con un promedio de varios meses.",
                "Si tus gastos igualan o superan tus ingresos, el margen es cero o negativo y la calculadora no puede estimar cuándo alcanzarás un objetivo.",
                "No tiene en cuenta imprevistos, pagos anuales (seguros, impuestos) ni cambios futuros de precios o salario.",
                "El cálculo se hace en tu navegador: los importes que escribes no se almacenan en la página ni se envían a herramientas de analítica."
            ],
            "readingTitle": "Cómo leer el porcentaje",
            "reading": "Menos del 10 %: margen ajustado. Entre el 10 % y el 19 %: por debajo del 20 % que recomienda el método Kakebo. Del 20 % en adelante: alcanzas o superas ese mínimo. En el apartado «¿Cómo interpretar el resultado?» de la calculadora tienes qué hacer en cada caso.",
            "aboutText": "¿Quién está detrás de esta herramienta? Lo explicamos en",
            "aboutLink": "Sobre nosotros"
        }
    },
    "en": {
        "howTo": {
            "title": "How to use the monthly savings calculator",
            "schemaName": "How to calculate your real monthly savings margin",
            "steps": [
                {
                    "name": "Enter your net income",
                    "text": "Type the amount you receive in your bank account each month, after taxes and withholdings."
                },
                {
                    "name": "Add your fixed expenses",
                    "text": "Enter the monthly total of commitments that repeat with the same amount: rent or mortgage, insurance, subscriptions and loans."
                },
                {
                    "name": "Add your variable expenses",
                    "text": "Enter the monthly average of expenses that change from month to month: food, leisure, transport, clothing and other discretionary spending."
                },
                {
                    "name": "Read your real savings margin",
                    "text": "The calculator shows your real margin (income minus all your expenses) and your savings rate. The Kakebo method recommends a minimum of 20%. If you have a specific goal, turn on 'Add savings goal' to see how many months you need."
                }
            ]
        },
        "faq": {
            "title": "Frequently asked questions about monthly savings",
            "items": [
                {
                    "q": "How do I know how much I can save each month?",
                    "a": "Subtract your fixed and variable expenses from your net income. The result is your real savings margin. The Kakebo method recommends that this margin be at least 20% of your income."
                },
                {
                    "q": "What is the difference between fixed and variable expenses?",
                    "a": "Fixed expenses are commitments that repeat every month with the same amount: rent, mortgage, insurance, subscriptions. Variable expenses change: food, leisure, transport, clothing. Controlling the variable ones is where you have the most room to act in the short term."
                },
                {
                    "q": "How long will it take me to reach my savings goal?",
                    "a": "It depends on your real monthly margin. Turn on the 'Add savings goal' section in the calculator: enter the target amount and, optionally, the timeline in months. The tool will show the time needed at your current pace and how much you would need to save per month to reach it within a specific timeline."
                },
                {
                    "q": "What monthly savings percentage is enough?",
                    "a": "The Kakebo method recommends 20% as a minimum. Below 10%, the margin is so tight that any unexpected expense wipes it out. If you cannot reach 20%, start with a steady 5%: saving a little consistently builds more wealth than aiming for 20% and giving up after three months."
                },
                {
                    "q": "How do I work out the money I need for an emergency fund?",
                    "a": "A standard emergency fund covers between 3 and 6 months of your monthly fixed expenses. If your fixed expenses are €800 a month, your target should be between €2,400 and €4,800. Use the 'Add savings goal' section of the calculator to see how many months you need at your current savings pace."
                },
                {
                    "q": "How is this calculator different from the 50/30/20 rule?",
                    "a": "The 50/30/20 rule takes your income and splits it into theoretical percentages (50% needs, 30% wants, 20% savings). This calculator does the opposite: it starts from your real expenses (fixed and variable) and works out the margin you actually have left. With the same salary, the real margin can be very different from the theoretical 20%, depending on how much your fixed commitments add up to."
                }
            ]
        },
        "schema": {
            "name": "Monthly Savings Calculator",
            "description": "Free MetodoKakebo.com tool to calculate your real monthly savings margin from income, fixed expenses and variable expenses.",
            "featureList": [
                "Real monthly savings margin calculation",
                "Separation of fixed and variable expenses",
                "Estimated time to reach a savings goal",
                "Income distribution chart",
                "Monthly savings needed for a given timeline"
            ]
        },
        "formula": {
            "title": "Formula, assumptions and limits of the estimate",
            "notice": "Notice: this is an approximate estimate and does not constitute financial, tax or investment advice.",
            "howTitle": "How it is calculated",
            "how": [
                {
                    "term": "Real margin",
                    "text": "= net income − fixed expenses − variable expenses."
                },
                {
                    "term": "Savings rate",
                    "text": "= real margin ÷ net income × 100. It is shown rounded to the nearest whole number."
                },
                {
                    "term": "Kakebo reference",
                    "text": "= 20% of your net income, and the difference between your real margin and that figure."
                },
                {
                    "term": "Months to reach your goal",
                    "text": "= goal ÷ real margin, rounded up."
                },
                {
                    "term": "Monthly savings needed",
                    "text": "= goal ÷ timeline in months, rounded up."
                }
            ],
            "assumptionsTitle": "Assumptions",
            "assumptions": [
                "Amounts are treated as monthly and constant: a typical month, not a specific one.",
                "Income is net, meaning what you receive after taxes and withholdings.",
                "No interest, returns or inflation are applied: saved money is added up without growing or losing value.",
                "Variable expenses are an average that you estimate; the more realistic that average, the more useful the result."
            ],
            "limitsTitle": "Limits",
            "limits": [
                "It is an approximate estimate, not financial, tax or investment advice.",
                "With irregular income the result will change from month to month; it is worth repeating the calculation with an average of several months.",
                "If your expenses equal or exceed your income, the margin is zero or negative and the calculator cannot estimate when you will reach a goal.",
                "It does not account for unexpected expenses, annual payments (insurance, taxes) or future changes in prices or salary.",
                "The calculation runs in your browser: the amounts you type are not stored on the page or sent to analytics tools."
            ],
            "readingTitle": "How to read the percentage",
            "reading": "Under 10%: tight margin. Between 10% and 19%: below the 20% recommended by the Kakebo method. From 20% upwards: you reach or exceed that minimum. In the “How to interpret the result” section of the calculator you can see what to do in each case.",
            "aboutText": "Who is behind this tool? We explain it on",
            "aboutLink": "About us"
        }
    }
};

export const getSavingsPageContent = (locale: string): SavingsPageContent =>
    locale === "en" ? savingsPageContent.en : savingsPageContent.es;
