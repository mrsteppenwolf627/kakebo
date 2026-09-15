import { describe, it, expect } from "vitest";
import es from "../../../messages/es.json";
import en from "../../../messages/en.json";

/**
 * Microcorrección final de 2.G: el copy de "aprendizaje colectivo" en
 * Settings debe ser veraz — hoy es una preferencia para una futura mejora,
 * no una función ya activa. La etiqueta principal NO debe afirmar que las
 * correcciones ayudan a otros usuarios ahora mismo.
 */
describe("Settings — copy de aprendizaje colectivo (microcorrección final 2.G)", () => {
  const esLabel = es.Settings.General.collectiveLearningLabel;
  const enLabel = en.Settings.General.collectiveLearningLabel;
  const esDesc = es.Settings.General.collectiveLearningDesc;
  const enDesc = en.Settings.General.collectiveLearningDesc;

  it("la etiqueta principal en español es la exacta aprobada, sin prometer ayudar a otros usuarios ya mismo", () => {
    expect(esLabel).toBe("Participar en futuras mejoras colectivas anónimas");
    expect(esLabel).not.toMatch(/ayuden a (mejorar las sugerencias para )?otros usuarios/i);
  });

  it("la etiqueta principal en inglés transmite el mismo significado (futuro, no activo ahora)", () => {
    expect(enLabel).toMatch(/future/i);
    expect(enLabel).not.toMatch(/help improve suggestions for other users/i);
  });

  it("la descripción sigue dejando claro que hoy no se comparte ningún dato ni se activa intercambio alguno", () => {
    expect(esDesc).toMatch(/no activa ningún intercambio de datos/i);
    expect(esDesc).toMatch(/siguen ayudándote solo a ti/i);
    expect(enDesc).toMatch(/doesn't activate any data sharing/i);
    expect(enDesc).toMatch(/helping only you/i);
  });
});
