// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Subscription } from "./Subscription";

describe("Subscription", () => {
  it("shows the current free plan from the profile", async () => {
    const client = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: { is_admin: false, is_founder: false, plus_access_until: null }, error: null })) })) })) })) } as never;
    render(<Subscription client={client} userId="u1" />);
    await waitFor(() => expect(screen.getByText(/Plan actual: gratuito/)).toBeTruthy());
  });
});
