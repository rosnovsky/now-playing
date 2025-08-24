import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";

// Global test setup for browser environment

// Mock environment variables for browser tests
beforeAll(() => {
  // Set up global variables that would normally be available in the browser
  Object.defineProperty(window, "ENV", {
    value: {
      VITE_PLEX_SERVER_URL: "http://localhost:32400",
      VITE_PLEX_TOKEN: "test-token-123",
      NODE_ENV: "test",
    },
    writable: true,
  });

  // Mock localStorage
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    },
    writable: true,
  });

  // Mock sessionStorage
  Object.defineProperty(window, "sessionStorage", {
    value: {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    },
    writable: true,
  });

  // Mock URL constructor for browser environment
  if (!window.URL) {
    window.URL = URL;
  }
});

// Clean up after all tests
afterAll(() => {
  // Clean up any global browser resources
});

// Reset before each test
beforeEach(() => {
  // Reset any global state
  vi.clearAllMocks();

  // Reset localStorage and sessionStorage mocks
  vi.mocked(window.localStorage.getItem).mockReturnValue(null);
  vi.mocked(window.localStorage.setItem).mockClear();
  vi.mocked(window.localStorage.removeItem).mockClear();
  vi.mocked(window.localStorage.clear).mockClear();

  vi.mocked(window.sessionStorage.getItem).mockReturnValue(null);
  vi.mocked(window.sessionStorage.setItem).mockClear();
  vi.mocked(window.sessionStorage.removeItem).mockClear();
  vi.mocked(window.sessionStorage.clear).mockClear();
});

// Clean up after each test
afterEach(() => {
  // Clean up any test-specific browser resources
  vi.restoreAllMocks();
});

// Global fetch mock for browser environment
if (!window.fetch) {
  window.fetch = vi.fn();
}

// Mock console methods to reduce noise in browser tests
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

// Browser-specific utilities and matchers
declare global {
  interface Window {
    ENV: {
      VITE_PLEX_SERVER_URL: string;
      VITE_PLEX_TOKEN: string;
      NODE_ENV: string;
    };
  }
}
