import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";

// Global test setup for Node.js environment

// Mock environment variables
beforeAll(() => {
  process.env.VITE_PLEX_SERVER_URL = "http://localhost:32400";
  process.env.VITE_PLEX_TOKEN = "test-token-123";
  process.env.NODE_ENV = "test";
});

// Clean up after all tests
afterAll(() => {
  // Clean up any global resources
});

// Reset before each test
beforeEach(() => {
  // Reset any global state
  vi.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  // Clean up any test-specific resources
  vi.restoreAllMocks();
});

// Global fetch mock setup
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Add custom matchers or utilities here if needed
