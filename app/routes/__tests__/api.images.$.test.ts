import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loader } from '../api.images.$';

// Mock @vercel/kv
vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

import { kv } from '@vercel/kv';
const mockKvGet = kv.get as any;
const mockKvSet = kv.set as any;

describe('api.images.$ loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.VITE_PLEX_SERVER_URL = 'http://localhost:32400';
    process.env.VITE_PLEX_TOKEN = 'test-token';
    global.fetch = vi.fn();

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 400 when image path is missing', async () => {
    const request = new Request('http://localhost/api/images/');
    const params = { '*': undefined };

    const response = await loader({ params, request } as any);

    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe('Image path is required');
  });

  it('should return cached image when available', async () => {
    const mockImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const mockCachedData = {
      data: mockImageData,
      contentType: 'image/png',
    };

    mockKvGet.mockResolvedValue(mockCachedData);

    const request = new Request('http://localhost/api/images/library/metadata/12345/thumb/1234567890');
    const params = { '*': 'library/metadata/12345/thumb/1234567890' };

    const response = await loader({ params, request } as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=2592000');
    expect(response.headers.get('X-Cache')).toBe('HIT');

    // Verify we didn't make any fetch calls
    expect(fetch).not.toHaveBeenCalled();

    // Verify cache was checked
    expect(mockKvGet).toHaveBeenCalledWith('cover:library/metadata/12345/thumb/1234567890');
  });

  it('should fetch and cache image when not in cache', async () => {
    const mockImageBuffer = new ArrayBuffer(8);
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: vi.fn().mockResolvedValue(mockImageBuffer),
    };

    mockKvGet.mockResolvedValue(null); // No cache
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const request = new Request('http://localhost/api/images/library/metadata/12345/thumb/1234567890');
    const params = { '*': 'library/metadata/12345/thumb/1234567890' };

    const response = await loader({ params, request } as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=2592000');
    expect(response.headers.get('X-Cache')).toBe('MISS');

    // Verify fetch was called with correct URL and headers
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:32400/library/metadata/12345/thumb/1234567890?X-Plex-Token=test-token',
      {
        headers: {
          'Accept': 'image/jpeg, image/png, image/webp, image/*',
          'User-Agent': 'Now-Playing/1.0',
        },
      }
    );

    // Verify caching was attempted
    expect(mockKvSet).toHaveBeenCalledWith(
      'cover:library/metadata/12345/thumb/1234567890',
      {
        data: expect.any(String), // base64 encoded data
        contentType: 'image/jpeg',
      },
      { ex: 2592000 }
    );
  });

  it('should handle Plex server errors gracefully', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
    };

    mockKvGet.mockResolvedValue(null);
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const request = new Request('http://localhost/api/images/library/metadata/12345/thumb/1234567890');
    const params = { '*': 'library/metadata/12345/thumb/1234567890' };

    const response = await loader({ params, request } as any);

    expect(response.status).toBe(404);
    const text = await response.text();
    expect(text).toBe('Failed to fetch image: 404');
    expect(console.error).toHaveBeenCalledWith('Failed to fetch image from Plex: 404 Not Found');
  });

  it('should reject non-image content types', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      arrayBuffer: vi.fn(),
    };

    mockKvGet.mockResolvedValue(null);
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const request = new Request('http://localhost/api/images/library/metadata/12345/thumb/1234567890');
    const params = { '*': 'library/metadata/12345/thumb/1234567890' };

    const response = await loader({ params, request } as any);

    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe('Invalid image content type');
    expect(console.error).toHaveBeenCalledWith('Invalid content type received: text/html');
  });

  it('should use default content type when not provided', async () => {
    const mockImageBuffer = new ArrayBuffer(8);
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(), // No content-type header
      arrayBuffer: vi.fn().mockResolvedValue(mockImageBuffer),
    };

    mockKvGet.mockResolvedValue(null);
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const request = new Request('http://localhost/api/images/library/metadata/12345/thumb/1234567890');
    const params = { '*': 'library/metadata/12345/thumb/1234567890' };

    const response = await loader({ params, request } as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
  });

  it('should continue without caching when cache operation fails', async () => {
    const mockImageBuffer = new ArrayBuffer(8);
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: vi.fn().mockResolvedValue(mockImageBuffer),
    };

    mockKvGet.mockResolvedValue(null);
    mockKvSet.mockRejectedValue(new Error('Cache error'));
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const request = new Request('http://localhost/api/images/library/metadata/12345/thumb/1234567890');
    const params = { '*': 'library/metadata/12345/thumb/1234567890' };

    const response = await loader({ params, request } as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(console.warn).toHaveBeenCalledWith('Failed to cache image:', expect.any(Error));
  });

  it('should handle fetch network errors', async () => {
    mockKvGet.mockResolvedValue(null);
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const request = new Request('http://localhost/api/images/library/metadata/12345/thumb/1234567890');
    const params = { '*': 'library/metadata/12345/thumb/1234567890' };

    const response = await loader({ params, request } as any);

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toBe('Failed to fetch image');
    expect(console.error).toHaveBeenCalledWith('Error fetching image:', expect.any(Error));
  });

  it('should handle various image formats', async () => {
    const testCases = [
      { contentType: 'image/jpeg', expected: 'image/jpeg' },
      { contentType: 'image/png', expected: 'image/png' },
      { contentType: 'image/webp', expected: 'image/webp' },
      { contentType: 'image/gif', expected: 'image/gif' },
    ];

    for (const testCase of testCases) {
      const mockImageBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': testCase.contentType }),
        arrayBuffer: vi.fn().mockResolvedValue(mockImageBuffer),
      };

      mockKvGet.mockResolvedValue(null);
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const request = new Request('http://localhost/api/images/library/metadata/12345/thumb/1234567890');
      const params = { '*': 'library/metadata/12345/thumb/1234567890' };

      const response = await loader({ params, request } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(testCase.expected);

      vi.clearAllMocks();
    }
  });

  it('should properly encode and decode cached image data', async () => {
    // First request - cache miss, should fetch and cache
    const originalImageBuffer = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: vi.fn().mockResolvedValue(originalImageBuffer.buffer),
    };

    mockKvGet.mockResolvedValue(null);
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const request1 = new Request('http://localhost/api/images/library/metadata/12345/thumb/1234567890');
    const params1 = { '*': 'library/metadata/12345/thumb/1234567890' };

    const response1 = await loader({ params: params1, request: request1 } as any);

    expect(response1.status).toBe(200);
    expect(response1.headers.get('X-Cache')).toBe('MISS');

    // Verify the data was cached correctly
    expect(mockKvSet).toHaveBeenCalledWith(
      'cover:library/metadata/12345/thumb/1234567890',
      {
        data: expect.any(String), // base64 encoded PNG header
        contentType: 'image/png',
      },
      { ex: 2592000 }
    );

    // Second request - cache hit, should return cached data
    const cachedData = {
      data: Buffer.from(originalImageBuffer).toString('base64'),
      contentType: 'image/png',
    };

    mockKvGet.mockResolvedValue(cachedData);
    vi.clearAllMocks();

    const request2 = new Request('http://localhost/api/images/library/metadata/12345/thumb/1234567890');
    const params2 = { '*': 'library/metadata/12345/thumb/1234567890' };

    const response2 = await loader({ params: params2, request: request2 } as any);

    expect(response2.status).toBe(200);
    expect(response2.headers.get('X-Cache')).toBe('HIT');
    expect(response2.headers.get('Content-Type')).toBe('image/png');

    // Verify no fetch was made for cached request
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle malformed cache data gracefully', async () => {
    // Mock cache returning malformed data
    mockKvGet.mockResolvedValue('invalid-cache-data');

    const mockImageBuffer = new ArrayBuffer(8);
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: vi.fn().mockResolvedValue(mockImageBuffer),
    };

    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const request = new Request('http://localhost/api/images/library/metadata/12345/thumb/1234567890');
    const params = { '*': 'library/metadata/12345/thumb/1234567890' };

    const response = await loader({ params, request } as any);

    // Should fall back to fetching since cache data is invalid
    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalled();
  });

  it('should set correct cache duration (30 days)', async () => {
    const mockImageBuffer = new ArrayBuffer(8);
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: vi.fn().mockResolvedValue(mockImageBuffer),
    };

    mockKvGet.mockResolvedValue(null);
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const request = new Request('http://localhost/api/images/library/metadata/12345/thumb/1234567890');
    const params = { '*': 'library/metadata/12345/thumb/1234567890' };

    const response = await loader({ params, request } as any);

    expect(response.status).toBe(200);

    // Verify cache duration is 30 days (2592000 seconds)
    expect(mockKvSet).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      { ex: 2592000 }
    );

    // Verify HTTP cache header is also 30 days
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=2592000');
  });
});
