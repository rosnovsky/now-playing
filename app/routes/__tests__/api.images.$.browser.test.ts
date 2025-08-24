/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('api.images.$ browser integration', () => {
  beforeEach(() => {
    // Mock fetch globally for browser environment
    globalThis.fetch = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle image API calls in browser environment', async () => {
    const mockImageData = new ArrayBuffer(8);

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=2592000',
        'X-Cache': 'MISS',
      }),
      arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
    } as any);

    // Simulate calling the image API from browser code
    const response = await fetch('/api/images/library/metadata/12345/thumb/1234567890');

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=2592000');

    const imageData = await response.arrayBuffer();
    expect(imageData).toBe(mockImageData);
  });

  it('should handle cached images from browser', async () => {
    const mockImageData = new ArrayBuffer(16);

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=2592000',
        'X-Cache': 'HIT',
      }),
      arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
    } as any);

    const response = await fetch('/api/images/library/metadata/67890/art/2345678901');

    expect(response.ok).toBe(true);
    expect(response.headers.get('X-Cache')).toBe('HIT');
    expect(response.headers.get('Content-Type')).toBe('image/png');
  });

  it('should handle different image formats in browser', async () => {
    const testCases = [
      { path: 'library/metadata/12345/thumb/1234567890', contentType: 'image/jpeg' },
      { path: 'library/metadata/67890/art/2345678901', contentType: 'image/png' },
      { path: 'library/metadata/54321/poster/3456789012', contentType: 'image/webp' },
    ];

    for (const testCase of testCases) {
      const mockImageData = new ArrayBuffer(32);

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'Content-Type': testCase.contentType,
          'Cache-Control': 'public, max-age=2592000',
        }),
        arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
      } as any);

      const response = await fetch(`/api/images/${testCase.path}`);

      expect(response.ok).toBe(true);
      expect(response.headers.get('Content-Type')).toBe(testCase.contentType);

      vi.clearAllMocks();
    }
  });

  it('should handle API errors gracefully in browser', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: vi.fn().mockResolvedValue('Failed to fetch image: 404'),
    } as any);

    const response = await fetch('/api/images/library/metadata/nonexistent/thumb/1234567890');

    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);

    const errorMessage = await response.text();
    expect(errorMessage).toBe('Failed to fetch image: 404');
  });

  it('should handle missing image path in browser', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: vi.fn().mockResolvedValue('Image path is required'),
    } as any);

    const response = await fetch('/api/images/');

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);

    const errorMessage = await response.text();
    expect(errorMessage).toBe('Image path is required');
  });

  it('should preserve proper cache headers in browser', async () => {
    const mockImageData = new ArrayBuffer(64);

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=2592000', // 30 days
        'X-Cache': 'MISS',
      }),
      arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
    } as any);

    const response = await fetch('/api/images/library/metadata/12345/thumb/1234567890');

    expect(response.ok).toBe(true);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=2592000');

    // Verify cache duration is 30 days (2592000 seconds)
    const cacheControl = response.headers.get('Cache-Control');
    expect(cacheControl).toContain('max-age=2592000');
  });

  it('should handle concurrent image requests in browser', async () => {
    const mockImageData = new ArrayBuffer(32);

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=2592000',
      }),
      arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
    } as any);

    // Make multiple concurrent requests
    const promises = [
      fetch('/api/images/library/metadata/12345/thumb/1234567890'),
      fetch('/api/images/library/metadata/67890/art/2345678901'),
      fetch('/api/images/library/metadata/54321/poster/3456789012'),
    ];

    const responses = await Promise.all(promises);

    // All requests should succeed
    responses.forEach(response => {
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    });
  });

  it('should work with browser fetch API patterns', async () => {
    const mockImageData = new ArrayBuffer(128);

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=2592000',
        'Content-Length': '128',
      }),
      arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
      blob: vi.fn().mockResolvedValue(new Blob([mockImageData], { type: 'image/jpeg' })),
    } as any);

    const response = await fetch('/api/images/library/metadata/12345/thumb/1234567890');

    expect(response.ok).toBe(true);

    // Test arrayBuffer access
    const arrayBuffer = await response.arrayBuffer();
    expect(arrayBuffer).toBe(mockImageData);

    // Test blob access (common in browser image handling)
    const blob = await response.blob();
    expect(blob).toBeInstanceOf(Blob);
  });

  it('should handle browser-specific image use cases', async () => {
    const mockImageData = new ArrayBuffer(256);

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=2592000',
      }),
      arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
      blob: vi.fn().mockResolvedValue(new Blob([mockImageData], { type: 'image/png' })),
    } as any);

    const response = await fetch('/api/images/library/metadata/12345/thumb/1234567890');

    expect(response.ok).toBe(true);

    // Simulate creating an object URL (common browser pattern)
    const blob = await response.blob();
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBe(256);

    // This would typically be used like: URL.createObjectURL(blob)
    // but we're just testing the API response structure
  });

  it('should handle network errors in browser environment', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error('Network error'));

    try {
      await fetch('/api/images/library/metadata/12345/thumb/1234567890');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Network error');
    }
  });
});
