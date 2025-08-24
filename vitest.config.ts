import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Global test configuration
    globals: true,
    environment: "jsdom",

    // Coverage configuration with v8
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
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
      ],
      // Auto-thresholds - Vitest will automatically determine thresholds
      // based on your current coverage and gradually increase them
      thresholds: {
        autoUpdate: true,
        lines: 7.58,
        functions: 13.15,
        branches: 40,
        statements: 7.58,
      },
    },

    // Browser mode configuration
    browser: {
      enabled: false, // Enable when running browser tests
      name: "chromium",
      provider: "playwright",
      headless: true,
      api: {
        port: 63315,
      },
    },

    // Test file patterns
    include: [
      "**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "**/tests/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: [
      "node_modules",
      "dist",
      "build",
      ".vercel",
      "public",
      "**/*.browser.{test,spec}.*",
    ],

    // Setup files
    setupFiles: ["./test/setup.ts"],

    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Watch mode
    watch: false,

    // Pool options for better performance
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },

    // Reporter configuration
    reporters: ["verbose", "junit"],
    outputFile: {
      junit: "./coverage/junit.xml",
    },

    // Environment variables for tests
    env: {
      NODE_ENV: "test",
    },
  },

  // Resolve configuration for tests
  resolve: {
    alias: {
      "~": new URL("./app", import.meta.url).pathname,
    },
  },

  // Define separate configs for different test environments
  // You can use these with: vitest --config vitest.config.ts --mode browser
  define: {
    __TEST__: true,
  },
});
