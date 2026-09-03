import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

const trackMock = vi.fn();
vi.mock("@/lib/analytics", () => ({
  analytics: {
    track: (...args: unknown[]) => trackMock(...args),
  },
}));

const pushMock = vi.fn();
const refreshMock = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  useSearchParams: () => searchParams,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const AMOUNT_PLACEHOLDER = "0.00";
const NOTE_PLACEHOLDER = "placeholders.conceptExpense";

function makeSupabaseMock({
  user = { id: "user-1" },
  session = { user: { id: "user-1" } },
  profile = { id: "user-1", tier: "free" },
  monthStatus = "open",
}: {
  user?: unknown;
  session?: unknown;
  profile?: unknown;
  monthStatus?: "open" | "closed";
} = {}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
      getSession: vi.fn().mockResolvedValue({ data: { session } }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: profile }),
            }),
          }),
        };
      }
      if (table === "months") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  limit: () =>
                    Promise.resolve({
                      data: [{ id: "month-1", status: monthStatus }],
                    }),
                }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: "month-1", status: "open" } }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table in test: ${table}`);
    }),
  };
}

let supabaseMock = makeSupabaseMock();
vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => supabaseMock,
}));

import NewExpensePage from "@/app/[locale]/app/new/NewExpenseClient";

function fillForm({ amount = "42.5", note = "cafe" }: { amount?: string; note?: string } = {}) {
  fireEvent.change(screen.getByPlaceholderText(NOTE_PLACEHOLDER), { target: { value: note } });
  fireEvent.change(screen.getByPlaceholderText(AMOUNT_PLACEHOLDER), { target: { value: amount } });
}

async function submit() {
  fireEvent.click(screen.getByRole("button", { name: "submit" }));
}

describe("NewExpenseClient expense_created tracking", () => {
  beforeEach(() => {
    trackMock.mockClear();
    pushMock.mockClear();
    refreshMock.mockClear();
    searchParams = new URLSearchParams();
    supabaseMock = makeSupabaseMock();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it("fires expense_created exactly once, with exactly {entry_method: 'manual'}, when POST /api/expenses succeeds", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "expense-1" } }),
    });

    render(<NewExpensePage />);
    await waitFor(() => expect(screen.getByRole("button", { name: "submit" })).not.toBeDisabled());

    fillForm({ amount: "123.45", note: "cena con amigos" });
    await submit();

    await waitFor(() => expect(trackMock).toHaveBeenCalled());

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("expense_created", { entry_method: "manual" });

    const payload = trackMock.mock.calls[0][1];
    expect(Object.keys(payload)).toEqual(["entry_method"]);

    const payloadJson = JSON.stringify(payload);
    expect(payloadJson).not.toContain("123.45");
    expect(payloadJson).not.toContain("cena con amigos");
    expect(payloadJson).not.toContain("expense-1");
    expect(payloadJson).not.toContain("user-1");
    expect(payloadJson).not.toContain("month-1");
  });

  it("preserves navigation back to /app after a successful save", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "expense-1" } }),
    });

    render(<NewExpensePage />);
    await waitFor(() => expect(screen.getByRole("button", { name: "submit" })).not.toBeDisabled());

    fillForm();
    await submit();

    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    expect(pushMock.mock.calls[0][0]).toMatch(/^\/app\?ym=/);
  });

  it("never uses click_cta_login (or any other event) as a substitute", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "expense-1" } }),
    });

    render(<NewExpensePage />);
    await waitFor(() => expect(screen.getByRole("button", { name: "submit" })).not.toBeDisabled());

    fillForm();
    await submit();

    await waitFor(() => expect(trackMock).toHaveBeenCalled());

    const firedEvents = trackMock.mock.calls.map((call) => call[0]);
    expect(firedEvents).toEqual(["expense_created"]);
  });

  it("does not fire expense_created when POST /api/expenses returns an error status", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "Server error" } }),
    });

    render(<NewExpensePage />);
    await waitFor(() => expect(screen.getByRole("button", { name: "submit" })).not.toBeDisabled());

    fillForm();
    await submit();

    await screen.findByText("Server error");

    expect(trackMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("does not fire expense_created when the fetch request itself fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network down"));

    render(<NewExpensePage />);
    await waitFor(() => expect(screen.getByRole("button", { name: "submit" })).not.toBeDisabled());

    fillForm();
    await submit();

    await screen.findByText("Network down");

    expect(trackMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("does not fire expense_created when there is no active session", async () => {
    supabaseMock = makeSupabaseMock({ session: null });
    render(<NewExpensePage />);
    await waitFor(() => expect(screen.getByRole("button", { name: "submit" })).not.toBeDisabled());

    fillForm();
    await submit();

    await screen.findByText("Auth session missing");

    expect(global.fetch).not.toHaveBeenCalled();
    expect(trackMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("does not fire expense_created when the target month is closed", async () => {
    searchParams = new URLSearchParams("ym=2026-09");
    supabaseMock = makeSupabaseMock({ monthStatus: "closed" });

    render(<NewExpensePage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "submit" })).toBeDisabled();
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(trackMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
