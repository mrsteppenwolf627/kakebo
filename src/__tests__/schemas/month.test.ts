import { describe, it, expect } from "vitest";
import {
  createMonthSchema,
  updateMonthSchema,
  monthSchema,
  parseYm,
  formatYm,
} from "@/lib/schemas/month";

describe("Month Schemas", () => {
  describe("createMonthSchema", () => {
    it("should validate a valid ym", () => {
      const validMonth = {
        ym: "2025-01",
      };

      const result = createMonthSchema.safeParse(validMonth);
      expect(result.success).toBe(true);
    });

    it("should reject invalid ym format", () => {
      const invalidMonth = {
        ym: "2025/01",
      };

      const result = createMonthSchema.safeParse(invalidMonth);
      expect(result.success).toBe(false);
    });

    it("should reject ym with invalid month (00)", () => {
      const invalidMonth = {
        ym: "2025-00",
      };

      const result = createMonthSchema.safeParse(invalidMonth);
      expect(result.success).toBe(false);
    });

    it("should reject ym with invalid month (13)", () => {
      const invalidMonth = {
        ym: "2025-13",
      };

      const result = createMonthSchema.safeParse(invalidMonth);
      expect(result.success).toBe(false);
    });

    it("should accept all valid months (01-12)", () => {
      for (let m = 1; m <= 12; m++) {
        const month = {
          ym: `2025-${m.toString().padStart(2, "0")}`,
        };
        const result = createMonthSchema.safeParse(month);
        expect(result.success).toBe(true);
      }
    });
  });

  describe("updateMonthSchema", () => {
    it("should allow updating status to closed", () => {
      const update = {
        status: "closed",
      };

      const result = updateMonthSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should allow updating status to open", () => {
      const update = {
        status: "open",
      };

      const result = updateMonthSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should allow updating savings_done", () => {
      const update = {
        savings_done: true,
      };

      const result = updateMonthSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should allow updating both fields", () => {
      const update = {
        status: "closed",
        savings_done: true,
      };

      const result = updateMonthSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should reject empty update", () => {
      const emptyUpdate = {};

      const result = updateMonthSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const invalidUpdate = {
        status: "invalid",
      };

      const result = updateMonthSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("monthSchema (full object)", () => {
    it("should validate a complete month", () => {
      const month = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        year: 2025,
        month: 1,
        status: "open",
        savings_done: false,
        created_at: "2025-01-01T00:00:00Z",
      };

      const result = monthSchema.safeParse(month);
      expect(result.success).toBe(true);
    });

    it("should validate closed month", () => {
      const month = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        year: 2025,
        month: 6,
        status: "closed",
        savings_done: true,
        created_at: "2025-06-01T00:00:00Z",
      };

      const result = monthSchema.safeParse(month);
      expect(result.success).toBe(true);
    });

    it("should reject invalid month number", () => {
      const month = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        year: 2025,
        month: 13,
        status: "open",
        savings_done: false,
        created_at: "2025-01-01T00:00:00Z",
      };

      const result = monthSchema.safeParse(month);
      expect(result.success).toBe(false);
    });
  });

  describe("helper functions", () => {
    describe("parseYm", () => {
      it("should parse valid ym string", () => {
        const result = parseYm("2025-06");
        expect(result).toEqual({ year: 2025, month: 6 });
      });

      it("should parse January correctly", () => {
        const result = parseYm("2025-01");
        expect(result).toEqual({ year: 2025, month: 1 });
      });

      it("should parse December correctly", () => {
        const result = parseYm("2025-12");
        expect(result).toEqual({ year: 2025, month: 12 });
      });
    });

    describe("formatYm", () => {
      it("should format year and month to ym string", () => {
        const result = formatYm(2025, 6);
        expect(result).toBe("2025-06");
      });

      it("should pad single digit month", () => {
        const result = formatYm(2025, 1);
        expect(result).toBe("2025-01");
      });

      it("should not pad double digit month", () => {
        const result = formatYm(2025, 12);
        expect(result).toBe("2025-12");
      });
    });
  });
});
