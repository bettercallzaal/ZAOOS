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
    "plugins/**",
    "scripts/**",
    ".claude/**",
    ".superpowers/**",
  ]),
  {
    // Silence React 19 Compiler rules until migration is complete.
    // These flag patterns that worked fine in React 18 but need refactoring
    // for the React 19 compiler optimization pass (setState in effects,
    // refs during render, impure render functions like Date.now()).
    // Tracked: https://github.com/bettercallzaal/ZAOOS/issues/TBD
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/immutability": "off",
      // Next.js <Image> is preferred but many components use <img> for
      // external/dynamic sources where next/image adds complexity.
      // Re-enable once image optimization is prioritized.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
