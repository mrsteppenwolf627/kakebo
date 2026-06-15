import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Inner duplicate project directory (tech debt — contains a full copy of the project)
    "kakebo/**",
  ]),
  // Test files: relax rules that are impractical in Vitest mock code
  {
    files: ["src/__tests__/**/*.ts", "src/__tests__/**/*.tsx"],
    rules: {
      // Using `any` for mockSupabase and similar mocks is standard practice in Vitest
      "@typescript-eslint/no-explicit-any": "off",
      // Unused vars in tests are common (imported helpers, mock vars)
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);

export default eslintConfig;
