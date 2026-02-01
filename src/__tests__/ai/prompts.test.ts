import { describe, it, expect } from "vitest";
import {
  PROMPT_VERSIONS,
  CURRENT_PROMPT_VERSION,
  getPromptVersion,
  getCurrentPrompt,
  formatExamplesForPrompt,
} from "@/lib/ai/prompts";

describe("AI Prompts", () => {
  describe("PROMPT_VERSIONS", () => {
    it("should have v1 version", () => {
      expect(PROMPT_VERSIONS.v1).toBeDefined();
      expect(PROMPT_VERSIONS.v1.version).toBe("v1");
    });

    it("should have v2 version", () => {
      expect(PROMPT_VERSIONS.v2).toBeDefined();
      expect(PROMPT_VERSIONS.v2.version).toBe("v2");
    });

    it("each version should have required fields", () => {
      Object.values(PROMPT_VERSIONS).forEach((prompt) => {
        expect(prompt.version).toBeDefined();
        expect(prompt.description).toBeDefined();
        expect(prompt.system).toBeDefined();
        expect(prompt.examples).toBeDefined();
        expect(prompt.examples.length).toBeGreaterThan(0);
      });
    });

    it("each example should have valid category", () => {
      const validCategories = ["survival", "optional", "culture", "extra"];

      Object.values(PROMPT_VERSIONS).forEach((prompt) => {
        prompt.examples.forEach((example) => {
          expect(validCategories).toContain(example.category);
          expect(example.input).toBeDefined();
          expect(example.note).toBeDefined();
        });
      });
    });
  });

  describe("CURRENT_PROMPT_VERSION", () => {
    it("should be a valid version", () => {
      expect(PROMPT_VERSIONS[CURRENT_PROMPT_VERSION]).toBeDefined();
    });
  });

  describe("getPromptVersion", () => {
    it("should return v1 prompt", () => {
      const prompt = getPromptVersion("v1");
      expect(prompt.version).toBe("v1");
    });

    it("should return v2 prompt", () => {
      const prompt = getPromptVersion("v2");
      expect(prompt.version).toBe("v2");
    });

    it("should throw for invalid version", () => {
      expect(() => getPromptVersion("invalid")).toThrow(
        'Prompt version "invalid" not found'
      );
    });
  });

  describe("getCurrentPrompt", () => {
    it("should return the current active prompt", () => {
      const prompt = getCurrentPrompt();
      expect(prompt.version).toBe(CURRENT_PROMPT_VERSION);
    });
  });

  describe("formatExamplesForPrompt", () => {
    it("should format examples correctly", () => {
      const examples = [
        { input: "Test 1", category: "survival" as const, note: "Note 1" },
        { input: "Test 2", category: "culture" as const, note: "Note 2" },
      ];

      const formatted = formatExamplesForPrompt(examples);

      expect(formatted).toContain('Input: "Test 1"');
      expect(formatted).toContain('"category": "survival"');
      expect(formatted).toContain('"note": "Note 1"');
      expect(formatted).toContain('Input: "Test 2"');
      expect(formatted).toContain('"category": "culture"');
    });

    it("should include confidence in examples", () => {
      const examples = [
        { input: "Test", category: "optional" as const, note: "Test note" },
      ];

      const formatted = formatExamplesForPrompt(examples);

      expect(formatted).toContain('"confidence": 0.95');
    });
  });

  describe("v2 has more examples than v1", () => {
    it("v2 should have more examples for better few-shot learning", () => {
      expect(PROMPT_VERSIONS.v2.examples.length).toBeGreaterThan(
        PROMPT_VERSIONS.v1.examples.length
      );
    });
  });
});
