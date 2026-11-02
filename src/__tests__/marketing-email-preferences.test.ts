import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("marketingmail foundation", () => {
  const migration = fs.readFileSync(
    path.join(process.cwd(), "supabase/migrations/20261102000001_marketing_email_preferences.sql"),
    "utf8"
  );

  it("uses explicit opt-in and enables RLS", () => {
    expect(migration).toMatch(/marketing_email_consent boolean NOT NULL DEFAULT false/i);
    expect(migration).toMatch(/ENABLE ROW LEVEL SECURITY/i);
    expect(migration).toMatch(/WITH CHECK \(auth\.uid\(\) = user_id\)/i);
  });

  it("does not create a default marketing subscription", () => {
    expect(migration).not.toMatch(/DEFAULT true/i);
  });
});
