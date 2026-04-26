import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Vitest configuration for Multi-Model Agent Platform.
 *
 * - Uses @vitejs/plugin-react for JSX transform + Fast Refresh in dev
 * - Resolves Next.js path aliases (@/* → project root)
 * - Configures jsdom environment for React Testing Library
 * - Handles CSS / asset imports that Next.js normally resolves
 * - Runs unit + integration tests in tests/
 * - Keeps E2E tests in e2e/ separate (managed by Playwright)
 */
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // Mirror tsconfig paths: "@/*" : ["./*"]
      "@": path.resolve(__dirname, "."),
    },
  },

  test: {
    // React Testing Library requires a DOM environment
    environment: "jsdom",

    // Test file discovery
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],

    // Setup file: jest-dom matchers, global mocks, cleanup
    setupFiles: ["tests/setup.ts"],

    // Globals so describe/it/expect don't need imports (optional, project uses imports)
    globals: true,

    // Isolate each test file (fresh DOM + module state)
    isolate: true,

    // Default timeout per test (10s)
    testTimeout: 10_000,

    // Retry on failure in CI
    retry: process.env.CI ? 2 : 0,

    // Parallelism
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: process.env.CI ? true : false,
      },
    },

    // Coverage configuration (v8 provider — no native dependency)
    // Generates text (terminal), JSON, HTML, and lcov (SonarQube/CI) reports
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "coverage",

      // Include all source files under src/ (even untested ones) for accurate %
      include: ["src/**/*.{ts,tsx}"],

      // Report 0% coverage for files that have no tests at all
      all: true,

      // Clean the reports directory before each run to avoid stale data
      cleanOnRerun: true,

      // Show per-file breakdown in terminal output
      reportOnFailure: true,

      exclude: [
        "node_modules/",
        ".next/",
        "e2e/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "src/mock/**",
        "src/types/**",
        "src/data/**",
        "src/styles/**",
        "src/**/*.stories.{ts,tsx}",
        "prisma/**",
        "terraform/**",
        "k8s/**",
        "coverage/**",
        "public/**",
      ],

      // Minimum coverage thresholds — CI will fail if these are not met
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
        // autoUpdate: true, // uncomment to auto-update thresholds to current values
      },
    },

    // Reporter output
    reporter: process.env.CI
      ? ["default", "junit"]
      : ["default", "verbose"],

    outputFile: process.env.CI ? "test-results/junit.xml" : undefined,

    // Mock CSS / asset imports that Next.js handles natively
    css: {
      include: [/\.css$/, /\.scss$/, /\.sass$/],
    },

    // Environment variables available in tests
    env: {
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  },
});
