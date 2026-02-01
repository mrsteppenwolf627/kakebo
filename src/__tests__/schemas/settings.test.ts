import { describe, it, expect } from "vitest";
import {
  updateSettingsSchema,
  settingsSchema,
  DEFAULT_SETTINGS,
} from "@/lib/schemas/settings";

describe("Settings Schemas", () => {
  describe("updateSettingsSchema", () => {
    it("should validate valid settings update", () => {
      const validSettings = {
        monthly_income: 2500,
        savings_goal: 500,
        budget_survival: 800,
        budget_optional: 300,
        budget_culture: 200,
        budget_extra: 200,
      };

      const result = updateSettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it("should allow partial update", () => {
      const partialSettings = {
        monthly_income: 3000,
      };

      const result = updateSettingsSchema.safeParse(partialSettings);
      expect(result.success).toBe(true);
    });

    it("should allow updating current_balance", () => {
      const settings = {
        current_balance: 1500.50,
      };

      const result = updateSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it("should allow negative current_balance", () => {
      const settings = {
        current_balance: -100,
      };

      const result = updateSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it("should reject negative income", () => {
      const invalidSettings = {
        monthly_income: -100,
      };

      const result = updateSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });

    it("should reject negative budget", () => {
      const invalidSettings = {
        budget_survival: -50,
      };

      const result = updateSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });

    it("should reject empty update", () => {
      const emptyUpdate = {};

      const result = updateSettingsSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("settingsSchema (full object)", () => {
    it("should validate a complete settings object", () => {
      const settings = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        monthly_income: 2500,
        savings_goal: 500,
        budget_survival: 800,
        budget_optional: 300,
        budget_culture: 200,
        budget_extra: 200,
        current_balance: 1200,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-15T10:30:00Z",
      };

      const result = settingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it("should validate settings without optional timestamps", () => {
      const settings = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        monthly_income: 0,
        savings_goal: 0,
        budget_survival: 0,
        budget_optional: 0,
        budget_culture: 0,
        budget_extra: 0,
        current_balance: 0,
      };

      const result = settingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });
  });

  describe("DEFAULT_SETTINGS", () => {
    it("should have all budget fields set to 0", () => {
      expect(DEFAULT_SETTINGS.monthly_income).toBe(0);
      expect(DEFAULT_SETTINGS.savings_goal).toBe(0);
      expect(DEFAULT_SETTINGS.budget_survival).toBe(0);
      expect(DEFAULT_SETTINGS.budget_optional).toBe(0);
      expect(DEFAULT_SETTINGS.budget_culture).toBe(0);
      expect(DEFAULT_SETTINGS.budget_extra).toBe(0);
      expect(DEFAULT_SETTINGS.current_balance).toBe(0);
    });
  });
});
