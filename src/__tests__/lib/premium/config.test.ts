import { describe, it, expect, afterEach, vi } from "vitest";
import { isPremiumCommerceEnabled } from "@/lib/premium/config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isPremiumCommerceEnabled", () => {
  it("is false when PREMIUM_COMMERCE_ENABLED is absent", () => {
    delete process.env.PREMIUM_COMMERCE_ENABLED;
    expect(isPremiumCommerceEnabled()).toBe(false);
  });

  it('is false for "false"', () => {
    vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "false");
    expect(isPremiumCommerceEnabled()).toBe(false);
  });

  it('is true only for "true"', () => {
    vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "true");
    expect(isPremiumCommerceEnabled()).toBe(true);
  });

  it.each(["", "TRUE", "True", "1", "yes", "on", " true", "true ", "enabled"])(
    "is false for other value %j",
    (value) => {
      vi.stubEnv("PREMIUM_COMMERCE_ENABLED", value);
      expect(isPremiumCommerceEnabled()).toBe(false);
    }
  );

  it("returns a plain boolean and never echoes the raw env value", () => {
    vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "sk_live_SUPER_SECRET");
    const result = isPremiumCommerceEnabled();
    expect(result).toBe(false);
    expect(typeof result).toBe("boolean");
  });
});
