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

// Reference-stable translator: a fresh closure on every call would make the
// component's `checkMonth` effect (which depends on `tExpense`) re-run on
// every render, looping `checking` state forever when `?ym=` is present.
const translate = (key: string) => key;
vi.mock("next-intl", () => ({
  useTranslations: () => translate,
}));

const AMOUNT_PLACEHOLDER = "0.00";
const NOTE_PLACEHOLDER = "placeholders.conceptExpense";

function makeSupabaseMock({
  user = { id: "user-1" },
  session = { user: { id: "user-1" } },
  profile = { id: "user-1", tier: "free" },
  monthStatus = "open",
  monthId = "month-1",
  monthYear = 2026,
  monthMonth = 9,
}: {
  user?: unknown;
  session?: unknown;
  profile?: unknown;
  monthStatus?: "open" | "closed";
  monthId?: string;
  monthYear?: number;
  monthMonth?: number;
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
        // Chainable mock: supports both the exact (?ym=) lookup
        // (.eq().eq().eq().limit()) and the open-cycle lookup used when no
        // ?ym= is present (.eq().eq().order().order().limit()).
        const chain: Record<string, unknown> = {
          eq: () => chain,
          order: () => chain,
          limit: () =>
            Promise.resolve({
              data: [
                { id: monthId, status: monthStatus, year: monthYear, month: monthMonth },
              ],
            }),
        };
        return {
          select: () => chain,
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: monthId, status: "open" } }),
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

  it("ciclos libres: imputes a generic new expense to the currently OPEN cycle (not today's calendar month) and preserves the entered real date unchanged", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "expense-1" } }),
    });

    // Simulates: the September cycle was closed early (day 28) and the next
    // cycle is already open, labelled October, even though the expense being
    // entered still has a real date within September.
    supabaseMock = makeSupabaseMock({
      monthStatus: "open",
      monthId: "open-cycle-october",
      monthYear: 2026,
      monthMonth: 10,
    });

    const { container } = render(<NewExpensePage />);
    await waitFor(() => expect(screen.getByRole("button", { name: "submit" })).not.toBeDisabled());

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-09-29" } });

    fillForm({ amount: "10", note: "gasto tras cierre anticipado" });
    await submit();

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);

    // La fecha real se conserva tal cual, no se fuerza al mes natural del ciclo.
    expect(body.date).toBe("2026-09-29");
    // El gasto se imputa al ciclo abierto actual, no al mes natural de la fecha.
    expect(body.month_id).toBe("open-cycle-october");
  });

  it("Fase 1.1: navigating explicitly to /app/new?ym=2026-10 after closing September early no longer clamps a 2026-09-29 real date to 2026-10-01", async () => {
    // Reproduce el flujo real reportado:
    // 1) el usuario cierra septiembre el 28 de septiembre,
    // 2) la app abre/navega al ciclo octubre (?ym=2026-10),
    // 3) desde el panel de octubre pulsa "Añadir gasto" -> /app/new?ym=2026-10,
    // 4) introduce la fecha real 2026-09-29,
    // 5) la petición debe llevar date: "2026-09-29" (NO "2026-10-01") y el
    //    month_id del ciclo octubre ya abierto.
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "expense-1" } }),
    });

    searchParams = new URLSearchParams("ym=2026-10");
    supabaseMock = makeSupabaseMock({
      monthStatus: "open",
      monthId: "october-cycle-explicit",
      monthYear: 2026,
      monthMonth: 10,
    });

    const { container } = render(<NewExpensePage />);
    await waitFor(() => expect(screen.getByRole("button", { name: "submit" })).not.toBeDisabled());

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-09-29" } });
    // El input refleja la fecha tal cual la escribió el usuario, sin recorte.
    expect(dateInput.value).toBe("2026-09-29");

    // Re-espera a que el re-chequeo del estado del ciclo (disparado por el
    // cambio de fecha) termine antes de enviar, igual que haría un usuario real.
    await waitFor(() => expect(screen.getByRole("button", { name: "submit" })).not.toBeDisabled());

    fillForm({ amount: "8.5", note: "helado tras cerrar septiembre" });
    await submit();

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);

    expect(body.date).toBe("2026-09-29");
    expect(body.date).not.toBe("2026-10-01");
    expect(body.month_id).toBe("october-cycle-explicit");
  });

  it("Fase 1.1: an explicitly selected closed cycle (?ym=) still blocks expense creation", async () => {
    // Regresión: el bloqueo por cierre de un ciclo navegado explícitamente
    // debe seguir funcionando tras quitar el recorte de fecha.
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
