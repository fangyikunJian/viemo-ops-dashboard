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
    // Generated output, not source: the Prisma client and the coverage report
    // are both written by tooling and both carry their own lint directives.
    "generated/**",
    "coverage/**",
    // A standalone CommonJS script run by hand with `node` to rebuild the team
    // deck. It is not part of the application and does not share its module
    // system, so the app's rules do not apply to it.
    "docs/*.build.js",
  ]),
]);

export default eslintConfig;
