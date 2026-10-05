// @vitest-environment node
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import * as downloadModule from "@/app/api/premium/download/route";

const { GET } = downloadModule;

beforeEach(() => {
  vi.mocked(fetch).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function assertNoFileDelivered(res: Response) {
  const type = res.headers.get("Content-Type") ?? "";
  expect(type).toContain("application/json");
  expect(res.headers.get("Content-Disposition")).toBeNull();
  expect(type).not.toMatch(/spreadsheet|excel|pdf|octet-stream/i);
}

describe("GET /api/premium/download — commerce disabled", () => {
  it.each([undefined, "false"])(
    "returns 503 premium_commerce_disabled (flag=%s)",
    async (flag) => {
      if (flag === undefined) delete process.env.PREMIUM_COMMERCE_ENABLED;
      else vi.stubEnv("PREMIUM_COMMERCE_ENABLED", flag);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.ok).toBe(false);
      expect(body.code).toBe("premium_commerce_disabled");
      expect(res.headers.get("Cache-Control")).toBe("no-store");
      assertNoFileDelivered(res);
    }
  );
});

describe("GET /api/premium/download — commerce enabled but no verified entitlement", () => {
  beforeEach(() => {
    vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "true");
  });

  it("returns 403 entitlement_not_verified", async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.ok).toBe(false);
    expect(body.code).toBe("entitlement_not_verified");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    assertNoFileDelivered(res);
  });

  it.each([
    "?token=x",
    "?purchase=true",
    "?entitlement=true",
    "?paid=true",
    "?token=x&purchase=true&entitlement=true&paid=true",
  ])("query params %s do not unlock anything", async (qs) => {
    // The handler takes no request on purpose: it cannot read forgeable params.
    // The handler may read the request URL (only the `file` selector), never a credential.
    const res = await (GET as unknown as (req: Request) => Promise<Response>)(
      new Request(`http://localhost:3000/api/premium/download${qs}`)
    );
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.code).toBe("entitlement_not_verified");
    assertNoFileDelivered(res);
  });

  it.each(["?file=excel", "?file=tutorial", "?file=ebook", "?file=../../.env.local", "?file=excel&paid=true"])(
    "file selector %s never delivers anything without an entitlement",
    async (qs) => {
      const res = await (GET as unknown as (req: Request) => Promise<Response>)(
        new Request(`http://localhost:3000/api/premium/download${qs}`)
      );
      expect(res.status).toBe(403);
      expect((await res.json()).code).toBe("entitlement_not_verified");
      assertNoFileDelivered(res);
    }
  );

  it("does not reach out to the network", async () => {
    await GET();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("/api/premium/download — methods and wiring", () => {
  it("only exports GET, so POST, PUT and DELETE get HTTP 405 from Next.js", () => {
    const exported = Object.keys(downloadModule);
    expect(exported).toEqual(["GET"]);
    for (const method of ["POST", "PUT", "DELETE", "PATCH"]) {
      expect(exported).not.toContain(method);
    }
  });

  it("route source never reads files from disk or imports Stripe", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/premium/download/route.ts"),
      "utf8"
    );
    const imports = src
      .split("\n")
      .filter((l) => /^\s*import\s/.test(l))
      .join("\n");
    expect(imports).not.toMatch(/node:fs|"fs"|stripe/i);
    expect(src).not.toMatch(/readFile|createReadStream/);
  });
});
