import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetcher } from '../fetcher';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Fetcher with Retry and Fallback', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Successful requests', () => {
    it('should return data on first successful attempt', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: new Headers()
      });

      const result = await fetcher('/api/test');

      expect(result).toEqual({
        status: 200,
        data: mockData,
        headers: expect.any(Headers)
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle 304 Not Modified responses', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 304,
        headers: new Headers()
      });

      const result = await fetcher('/api/test');

      expect(result).toEqual({
        status: 304,
        data: null,
        headers: expect.any(Headers)
      });
    });
  });

  describe('Retry mechanism', () => {
    it('should retry on network failures', async () => {
      vi.useRealTimers(); // Use real timers for retry tests

      const mockData = { success: true };

      // First two attempts fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          status: 200,
          json: () => Promise.resolve(mockData),
          headers: new Headers()
        });

      const result = await fetcher('/api/test', { maxRetries: 3, retryDelay: 10 });

      expect(result.data).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on invalid JSON responses', async () => {
      vi.useRealTimers(); // Use real timers for retry tests

      const mockData = { valid: 'json' };

      // First attempt returns invalid JSON, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          status: 200,
          json: () => Promise.reject(new Error('Invalid JSON')),
          headers: new Headers()
        })
        .mockResolvedValueOnce({
          status: 200,
          json: () => Promise.resolve(mockData),
          headers: new Headers()
        });

      const result = await fetcher('/api/test', { maxRetries: 2, retryDelay: 10 });

      expect(result.data).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff for retries', async () => {
      vi.useRealTimers(); // Use real timers for retry tests

      mockFetch.mockRejectedValue(new Error('Always fails'));

      const fallbackFn = vi.fn().mockResolvedValue({ fallback: true });

      await fetcher('/api/test', {
        maxRetries: 2,
        retryDelay: 10,
        retryBackoff: 2
      }, fallbackFn);

      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Fallback functionality', () => {
    it('should call fallback function when all retries fail', async () => {
      vi.useRealTimers(); // Use real timers for retry tests

      const fallbackData = { fallback: true, source: 'cache' };
      const fallbackFn = vi.fn().mockResolvedValue(fallbackData);

      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await fetcher('/api/test', { maxRetries: 1, retryDelay: 10 }, fallbackFn);

      expect(result).toEqual({
        status: 200,
        data: fallbackData,
        headers: expect.any(Headers),
        isStale: true
      });
      expect(fallbackFn).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    it('should handle async fallback functions', async () => {
      vi.useRealTimers(); // Use real timers for this test

      const fallbackData = { async: 'fallback' };
      const fallbackFn = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return fallbackData;
      });

      mockFetch.mockRejectedValue(new Error('Always fails'));

      const result = await fetcher('/api/test', { maxRetries: 0 }, fallbackFn);

      expect(result.data).toEqual(fallbackData);
      expect(result.isStale).toBe(true);
    });

    it('should throw error if both fetch and fallback fail', async () => {
      const fallbackFn = vi.fn().mockRejectedValue(new Error('Fallback failed'));

      mockFetch.mockRejectedValue(new Error('Fetch failed'));

      await expect(
        fetcher('/api/test', { maxRetries: 0 }, fallbackFn)
      ).rejects.toThrow('Fetch failed after 1 attempts: Fetch failed. Fallback also failed: Fallback failed');
    });

    it('should throw error if no fallback is provided and all retries fail', async () => {
      vi.useRealTimers(); // Use real timers for retry tests

      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        fetcher('/api/test', { maxRetries: 1, retryDelay: 10 })
      ).rejects.toThrow('Fetch failed after 2 attempts: Network error');
    });
  });

  describe('Configuration options', () => {
    it('should use default retry configuration', async () => {
      vi.useRealTimers(); // Use real timers for retry tests

      mockFetch.mockRejectedValue(new Error('Always fails'));

      const fallbackFn = vi.fn().mockResolvedValue({});

      await fetcher('/api/test', {}, fallbackFn);

      expect(mockFetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should merge headers correctly', async () => {
      const mockData = { test: true };
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: new Headers()
      });

      await fetcher('/api/test', {
        headers: {
          'Authorization': 'Bearer token',
          'X-Custom': 'value'
        }
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer token',
          'X-Custom': 'value'
        }
      });
    });

    it('should handle null header values', async () => {
      const mockData = { test: true };
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: new Headers()
      });

      await fetcher('/api/test', {
        headers: {
          'Authorization': 'Bearer token',
          'X-Optional': ''
        }
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer token',
          'X-Optional': ''
        }
      });
    });
  });

  describe('TypeScript generics', () => {
    interface User {
      id: number;
      name: string;
      email: string;
    }

    it('should maintain type safety with generics', async () => {
      const userData: User = { id: 1, name: 'John', email: 'john@example.com' };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(userData),
        headers: new Headers()
      });

      const result = await fetcher<User>('/api/user/1');

      // TypeScript should infer the correct type
      expect(result.data?.id).toBe(1);
      expect(result.data?.name).toBe('John');
      expect(result.data?.email).toBe('john@example.com');
    });

    it('should work with typed fallback functions', async () => {
      const fallbackUser: User = { id: 999, name: 'Fallback', email: 'fallback@example.com' };
      const fallbackFn = (): User => fallbackUser;

      mockFetch.mockRejectedValue(new Error('API down'));

      const result = await fetcher<User>('/api/user/1', { maxRetries: 0 }, fallbackFn);

      expect(result.data).toEqual(fallbackUser);
      expect(result.isStale).toBe(true);
    });
  });
});
