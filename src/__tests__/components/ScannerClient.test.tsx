import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/es.json";
import ScannerClient from "@/components/scanner/ScannerClient";

const TICKET_ID = "11111111-1111-4111-8111-111111111111";
const PATH = "user/ticket/object";

function json(data: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => ({ success: true, data }) };
}

function renderScanner() {
  return render(<NextIntlClientProvider locale="es" messages={messages}><ScannerClient /></NextIntlClientProvider>);
}

describe("ScannerClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("crypto", { randomUUID: () => "22222222-2222-4222-8222-222222222222" });
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("sube, procesa, permite repartir un artículo y confirma solo cuando las sumas cuadran", async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock
      .mockResolvedValueOnce(json({ ticketId: TICKET_ID }) as Response)
      .mockResolvedValueOnce(json({ upload: { url: "https://storage.test/upload", path: PATH } }) as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response)
      .mockResolvedValueOnce(json({ ticketId: TICKET_ID, status: "uploaded" }) as Response)
      .mockResolvedValueOnce(json({ ticketId: TICKET_ID, status: "needs_review", draftVersion: 1 }) as Response)
      .mockResolvedValueOnce(json({ ticket: { id: TICKET_ID, status: "needs_review", draftVersion: 1, merchant: "Comercio", date: "2026-10-27", totalCents: 1000, currency: "EUR", lines: [{ id: "line-1", kind: "item", description: "Compra", amountCents: 1000, categoryProposal: null, category: null, allocations: [] }] } }) as Response)
      .mockResolvedValueOnce(json({ draftVersion: 2 }) as Response)
      .mockResolvedValueOnce(json({ expenses: [{ expenseId: "expense-1" }] }) as Response);

    renderScanner();
    const file = new File([new Uint8Array([1, 2, 3])], "ticket-private.jpg", { type: "image/jpeg" });
    const imageInput = document.querySelectorAll<HTMLInputElement>('input[type="file"]')[1];
    fireEvent.change(imageInput, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByRole("heading", { name: messages.Scanner.flow.reviewTitle })).toBeTruthy());
    expect(screen.getByRole("button", { name: messages.Scanner.flow.confirm })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: messages.Scanner.flow.split }));

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "survival" } });
    fireEvent.change(selects[1], { target: { value: "culture" } });
    fireEvent.change(document.getElementById("line-1-part-amount-0") as HTMLInputElement, { target: { value: "4" } });
    fireEvent.change(document.getElementById("line-1-part-amount-1") as HTMLInputElement, { target: { value: "6" } });

    await waitFor(() => expect(screen.getByRole("button", { name: messages.Scanner.flow.confirm })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: messages.Scanner.flow.confirm }));
    await waitFor(() => expect(screen.getByRole("heading", { name: messages.Scanner.flow.doneTitle })).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(8);
    expect(fetchMock.mock.calls[7][1]).toMatchObject({ method: "POST" });
    expect(JSON.parse(String(fetchMock.mock.calls[7][1]?.body))).toMatchObject({ userConfirmed: true, draftVersion: 2 });
  });
});
