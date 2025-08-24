import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Browser-specific configuration
    globals: true,
    environment: "happy-dom",

    // Browser mode enabled
    browser: {
      enabled: true,
      name: "chromium",
      provider: "playwright",
      headless: true,
      api: {
        port: 63316,
      },
      // Browser-specific options
      screenshotFailures: false,
      isolate: true,
    },

    // Coverage configuration for browser tests
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage/browser",
      exclude: [
        "node_modules/",
        "dist/",
        "build/",
        ".vercel/",
        "**/*.config.*",
        "**/*.d.ts",
        "coverage/",
        "public/",
        "**/*.test.*",
        "**/*.spec.*",
        "**/test/**",
      ],
      thresholds: {
        autoUpdate: true,
        lines: 75,
        functions: 75,
        branches: 70,
        statements: 75,
      },
    },

    // Test file patterns for browser tests
    include: [
      "**/*.browser.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "**/browser-tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: [
      "node_modules",
      "dist",
      "build",
      ".vercel",
      "public",
      "**/*.node.{test,spec}.*",
    ],

    // Setup files for browser environment
    setupFiles: ["./test/setup.browser.ts"],

    // Longer timeouts for browser tests
    testTimeout: 15000,
    hookTimeout: 15000,

    // Browser-specific pool configuration
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true, // Browser tests often need single thread
      },
    },

    // Reporter configuration
    reporters: ["verbose", "junit"],
    outputFile: {
      junit: "./coverage/browser/junit.xml",
    },

    // Environment variables for browser tests
    env: {
      NODE_ENV: "test",
      BROWSER_TEST: "true",
    },
  },

  // Resolve configuration
  resolve: {
    alias: {
      "~": new URL("./app", import.meta.url).pathname,
    },
  },

  // Browser-specific defines
  define: {
    __TEST__: true,
    __BROWSER_TEST__: true,
  },
});
