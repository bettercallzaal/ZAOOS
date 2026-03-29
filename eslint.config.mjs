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
  ]),
  {
    // Downgrade React 19 Compiler rules to warnings.
    // These flag patterns that worked fine in React 18 but need refactoring
    // for the React 19 compiler optimization pass (setState in effects,
    // refs during render, impure render functions like Date.now()).
    // Tracked: https://github.com/bettercallzaal/ZAOOS/issues/TBD
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/ref-access-during-render": "warn",
    },
  },
]);

export default eslintConfig;
