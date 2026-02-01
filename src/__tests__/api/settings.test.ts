import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "@/app/api/settings/route";

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

// Mock auth
const mockUser = { id: "user-123", email: "test@example.com" };
vi.mock("@/lib/api/auth", () => ({
  requireAuth: vi.fn(() => Promise.resolve(mockUser)),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logApiRequest: vi.fn(),
  logApiResponse: vi.fn(),
  logApiError: vi.fn(),
  apiLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe("Settings API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/settings", () => {
    it("should return existing settings", async () => {
      const mockSettings = {
        id: "settings-123",
        user_id: "user-123",
        monthly_income: 3000,
        savings_goal: 500,
        budget_survival: 1000,
        budget_optional: 500,
        budget_culture: 300,
        budget_extra: 200,
        current_balance: 5000,
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockSettings,
        error: null,
      });

      const request = new NextRequest("http://localhost/api/settings");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.monthly_income).toBe(3000);
    });

    it("should create default settings if not exists", async () => {
      const defaultSettings = {
        id: "new-settings",
        user_id: "user-123",
        monthly_income: 0,
        savings_goal: 0,
        budget_survival: 0,
        budget_optional: 0,
        budget_culture: 0,
        budget_extra: 0,
        current_balance: 0,
      };

      // Settings not found
      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" },
        })
        // Create default settings
        .mockResolvedValueOnce({
          data: defaultSettings,
          error: null,
        });

      const request = new NextRequest("http://localhost/api/settings");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe("PATCH /api/settings", () => {
    it("should update existing settings", async () => {
      const updatedSettings = {
        id: "settings-123",
        user_id: "user-123",
        monthly_income: 3500,
        savings_goal: 600,
      };

      // Settings exist
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: "settings-123" },
          error: null,
        })
        // Update
        .mockResolvedValueOnce({
          data: updatedSettings,
          error: null,
        });

      const request = new NextRequest("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ monthly_income: 3500, savings_goal: 600 }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("should create settings with defaults if not exists", async () => {
      // Settings don't exist
      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })
        // Create with defaults + input
        .mockResolvedValueOnce({
          data: { id: "new-settings", monthly_income: 2000 },
          error: null,
        });

      const request = new NextRequest("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ monthly_income: 2000 }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it("should return 422 for empty update", async () => {
      const request = new NextRequest("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 422 for negative values", async () => {
      const request = new NextRequest("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ monthly_income: -100 }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
    });
  });
});
