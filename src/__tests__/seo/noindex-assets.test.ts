import { describe, expect, it } from "vitest";
import config from "../../../next.config";

describe("next.config: archivos fuera del índice", () => {
  it("manifest y /docs/* llevan X-Robots-Tag noindex", async () => {
    const rules = await (config as unknown as { headers: () => Promise<{ source: string; headers: { key: string; value: string }[] }[]> }).headers();
    for (const source of ["/manifest.webmanifest", "/docs/:path*"]) {
      const rule = rules.find((r) => r.source === source);
      expect(rule, source).toBeTruthy();
      expect(rule?.headers).toContainEqual({ key: "X-Robots-Tag", value: "noindex" });
    }
  });
});
