/**
 * Tests for transaction validation (P0-2)
 *
 * Validates that transactions are properly validated before write to prevent:
 * - Duplicates
 * - Suspicious amounts
 * - Invalid dates
 * - Ambiguous concepts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateTransactionBeforeWrite,
  formatValidationResult,
  type TransactionToValidate,
  type ValidationResult,
} from "@/lib/agents/tools/validators/transaction-validator";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock logger
vi.mock("@/lib/logger", () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Transaction Validator (P0-2)", () => {
  let mockSupabase: SupabaseClient;
  const userId = "test-user-123";

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          })),
        })),
      })),
    } as any;
  });

  describe("Amount validation", () => {
    it("should reject amount <= 0", async () => {
      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 0,
        concept: "Test expense",
        category: "survival",
        date: "2026-02-19",
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("debe ser mayor que 0");
    });

    it("should reject amount > €10000", async () => {
      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 15000,
        concept: "Test expense",
        category: "survival",
        date: "2026-02-19",
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("extremadamente alto");
    });

    it("should warn for amount > €1000", async () => {
      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 1500,
        concept: "Test expense",
        category: "survival",
        date: "2026-02-19",
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("Importe alto");
      expect(result.warnings[0]).toContain("1500€");
    });

    it("should warn for very precise amounts", async () => {
      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 45.678,
        concept: "Test expense",
        category: "survival",
        date: "2026-02-19",
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes("muy preciso"))).toBe(true);
    });

    it("should accept normal amounts", async () => {
      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 50,
        concept: "Test expense",
        category: "survival",
        date: "2026-02-19",
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("Date validation", () => {
    it("should reject invalid dates", async () => {
      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 50,
        concept: "Test expense",
        category: "survival",
        date: "invalid-date",
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Fecha inválida");
    });

    it("should reject dates > 7 days in future", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const dateStr = futureDate.toISOString().split("T")[0];

      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 50,
        concept: "Test expense",
        category: "survival",
        date: dateStr,
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("demasiado en el futuro");
    });

    it("should warn for future dates <= 7 days", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const dateStr = futureDate.toISOString().split("T")[0];

      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 50,
        concept: "Test expense",
        category: "survival",
        date: dateStr,
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes("Fecha futura"))).toBe(
        true
      );
    });

    it("should warn for very old dates (> 1 year)", async () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2);
      const dateStr = oldDate.toISOString().split("T")[0];

      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 50,
        concept: "Test expense",
        category: "survival",
        date: dateStr,
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes("muy antigua"))).toBe(true);
    });

    it("should accept today's date", async () => {
      const today = new Date().toISOString().split("T")[0];

      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 50,
        concept: "Test expense",
        category: "survival",
        date: today,
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Concept validation", () => {
    it("should reject empty concepts", async () => {
      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 50,
        concept: "",
        category: "survival",
        date: "2026-02-19",
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("no puede estar vacío"))).toBe(
        true
      );
    });

    it("should reject concepts < 3 characters", async () => {
      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 50,
        concept: "ab",
        category: "survival",
        date: "2026-02-19",
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("al menos 3 caracteres"))).toBe(
        true
      );
    });

    it("should warn for ambiguous concepts", async () => {
      const ambiguousConcepts = ["compra", "gasto", "pago", "cosa", "varios"];

      for (const concept of ambiguousConcepts) {
        const transaction: TransactionToValidate = {
          type: "expense",
          amount: 50,
          concept,
          category: "survival",
          date: "2026-02-19",
          userId,
        };

        const result = await validateTransactionBeforeWrite(
          mockSupabase,
          transaction
        );

        expect(result.valid).toBe(true);
        expect(result.warnings.some((w) => w.includes("muy genérico"))).toBe(
          true
        );
      }
    });

    it("should warn for numeric-only concepts", async () => {
      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 50,
        concept: "12345",
        category: "survival",
        date: "2026-02-19",
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes("solo un número"))).toBe(
        true
      );
    });

    it("should accept specific concepts", async () => {
      const specificConcepts = [
        "Mercadona compra semanal",
        "Vaper El Estanco",
        "Netflix suscripción",
        "Café con Ana",
      ];

      for (const concept of specificConcepts) {
        const transaction: TransactionToValidate = {
          type: "expense",
          amount: 50,
          concept,
          category: "survival",
          date: "2026-02-19",
          userId,
        };

        const result = await validateTransactionBeforeWrite(
          mockSupabase,
          transaction
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });
  });

  describe("Duplicate detection", () => {
    it("should warn for exact duplicates (same concept + amount + date)", async () => {
      // Mock Supabase to return a duplicate
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: [
                    {
                      id: "dup-123",
                      note: "Test expense",
                      amount: 50,
                      date: "2026-02-19",
                      created_at: new Date(Date.now() - 60000).toISOString(), // 1 min ago
                    },
                  ],
                  error: null,
                })),
              })),
            })),
          })),
        })),
      })) as any;

      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 50,
        concept: "Test expense",
        category: "survival",
        date: "2026-02-19",
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes("idéntico"))).toBe(true);
      expect(result.warnings.some((w) => w.includes("duplicado"))).toBe(true);
    });

    it("should warn for similar duplicates (within 10% amount)", async () => {
      // Mock Supabase to return a similar transaction
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: [
                    {
                      id: "sim-123",
                      note: "Different concept",
                      amount: 48, // Within 10% of 50
                      date: "2026-02-19",
                      created_at: new Date(Date.now() - 120000).toISOString(), // 2 min ago
                    },
                  ],
                  error: null,
                })),
              })),
            })),
          })),
        })),
      })) as any;

      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 50,
        concept: "Test expense",
        category: "survival",
        date: "2026-02-19",
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes("similar"))).toBe(true);
    });

    it("should not warn if no duplicates", async () => {
      // mockSupabase already returns empty array by default

      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 50,
        concept: "Test expense",
        category: "survival",
        date: "2026-02-19",
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it("should handle duplicate check errors gracefully", async () => {
      // Mock Supabase to return an error
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: null,
                  error: { message: "Database error" },
                })),
              })),
            })),
          })),
        })),
      })) as any;

      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 50,
        concept: "Test expense",
        category: "survival",
        date: "2026-02-19",
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      // Should still be valid (don't block on duplicate check error)
      expect(result.valid).toBe(true);
    });
  });

  describe("formatValidationResult", () => {
    it("should format errors and warnings correctly", () => {
      const result: ValidationResult = {
        valid: false,
        errors: ["Error 1", "Error 2"],
        warnings: ["Warning 1"],
      };

      const formatted = formatValidationResult(result);

      expect(formatted).toContain("❌ Errores:");
      expect(formatted).toContain("Error 1");
      expect(formatted).toContain("Error 2");
      expect(formatted).toContain("⚠️ Advertencias:");
      expect(formatted).toContain("Warning 1");
    });

    it("should handle only warnings", () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: ["Warning 1"],
      };

      const formatted = formatValidationResult(result);

      expect(formatted).not.toContain("❌ Errores:");
      expect(formatted).toContain("⚠️ Advertencias:");
      expect(formatted).toContain("Warning 1");
    });

    it("should handle only errors", () => {
      const result: ValidationResult = {
        valid: false,
        errors: ["Error 1"],
        warnings: [],
      };

      const formatted = formatValidationResult(result);

      expect(formatted).toContain("❌ Errores:");
      expect(formatted).toContain("Error 1");
      expect(formatted).not.toContain("⚠️ Advertencias:");
    });
  });

  describe("Combined validations", () => {
    it("should report multiple errors and warnings", async () => {
      const transaction: TransactionToValidate = {
        type: "expense",
        amount: -10, // Error: negative
        concept: "ab", // Error: too short
        category: "survival",
        date: "invalid-date", // Error: invalid date
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it("should pass validation for a perfect transaction", async () => {
      const transaction: TransactionToValidate = {
        type: "expense",
        amount: 45.5,
        concept: "Mercadona compra semanal",
        category: "survival",
        date: "2026-02-19",
        userId,
      };

      const result = await validateTransactionBeforeWrite(
        mockSupabase,
        transaction
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
