import { vi } from 'vitest'
import type { Song } from '~/types'

// Mock data creators
export const createMockSong = (overrides: Partial<Song> = {}): Song => ({
  title: 'Mock Song',
  grandparentTitle: 'Mock Artist',
  parentTitle: 'Mock Album',
  albumArt: '/api/images/library/metadata/12345/thumb/1234567890',
  duration: 240000,
  ratingKey: '12345',
  key: '/library/metadata/12345',
  parentRatingKey: '67890',
  grandparentRatingKey: '54321',
  viewCount: 0,
  lastViewedAt: undefined,
  thumb: '/api/images/library/metadata/12345/thumb/1234567890',
  art: undefined,
  parentThumb: '/api/images/library/metadata/67890/thumb/1234567890',
  grandparentThumb: undefined,
  addedAt: 1640908800,
  updatedAt: undefined,
  userRating: undefined,
  Media: [{
    audioCodec: 'flac',
    bitrate: 1411
  }],
  ...overrides
})

export const createMockPlexResponse = (songs: Partial<Song>[] = []) => ({
  MediaContainer: {
    Metadata: songs.map(song => ({
      title: song.title || 'Mock Song',
      grandparentTitle: song.grandparentTitle || 'Mock Artist',
      parentTitle: song.parentTitle || 'Mock Album',
      thumb: song.thumb?.replace('/api/images/', '') || '/library/metadata/12345/thumb/1234567890',
      duration: song.duration || 240000,
      ratingKey: song.ratingKey || '12345',
      key: song.key || '/library/metadata/12345',
      parentRatingKey: song.parentRatingKey || '67890',
      grandparentRatingKey: song.grandparentRatingKey || '54321',
      viewCount: song.viewCount ?? 0,
      lastViewedAt: song.lastViewedAt,
      parentThumb: song.parentThumb?.replace('/api/images/', '') || '/library/metadata/67890/thumb/1234567890',
      addedAt: song.addedAt || 1640908800,
      updatedAt: song.updatedAt,
      userRating: song.userRating,
      albumArt: song.art?.replace('/api/images/', ''),
      Media: song.Media || [{
        audioCodec: 'flac',
        bitrate: 1411
      }]
    }))
  }
})

// Request helpers
export const createMockRequest = (
  url: string = 'http://localhost:3000/api/songs',
  options: RequestInit = {}
): Request => {
  return new Request(url, {
    method: 'GET',
    ...options
  })
}

export const createMockRequestWithETag = (
  etag: string,
  url: string = 'http://localhost:3000/api/songs'
): Request => {
  return createMockRequest(url, {
    headers: {
      'If-None-Match': etag
    }
  })
}

// Fetch mocks
export const mockSuccessfulFetch = (data: any) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(data)
  })
  return global.fetch
}

export const mockFailedFetch = (status: number = 500, statusText: string = 'Internal Server Error') => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText
  })
  return global.fetch
}

export const mockNetworkError = (errorMessage: string = 'Network error') => {
  global.fetch = vi.fn().mockRejectedValue(new Error(errorMessage))
  return global.fetch
}

export const mockFetchWithETag = (data: any, etag: string = 'mock-etag') => {
  global.fetch = vi.fn().mockImplementation((url, options) => {
    const ifNoneMatch = options?.headers?.['If-None-Match']

    if (ifNoneMatch === etag) {
      return Promise.resolve({
        ok: true,
        status: 304,
        headers: {
          get: (name: string) => name === 'ETag' ? etag : null
        }
      })
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
      headers: {
        get: (name: string) => {
          if (name === 'ETag') return etag
          if (name === 'Cache-Control') return 'no-cache'
          return null
        }
      }
    })
  })
  return global.fetch
}

// Response helpers
export const expectJsonResponse = async (response: Response, expectedData: any) => {
  expect(response.status).toBe(200)
  const data = await response.json()
  expect(data).toEqual(expectedData)
  return data
}

export const expectErrorResponse = async (response: Response, expectedStatus: number, expectedError?: string) => {
  expect(response.status).toBe(expectedStatus)
  if (expectedError) {
    const data = await response.json()
    expect(data.error).toBe(expectedError)
  }
}

export const expectNotModifiedResponse = (response: Response) => {
  expect(response.status).toBe(304)
}

// Environment helpers
export const withMockEnv = (envVars: Record<string, string>, callback: () => void | Promise<void>) => {
  const originalEnv = { ...process.env }

  // Set mock environment variables
  Object.assign(process.env, envVars)

  try {
    return callback()
  } finally {
    // Restore original environment
    process.env = originalEnv
  }
}

export const mockPlexEnv = () => ({
  VITE_PLEX_SERVER_URL: 'http://localhost:32400',
  VITE_PLEX_TOKEN: 'test-token-123'
})

// Validation helpers
export const validateSongStructure = (song: any) => {
  expect(song).toHaveProperty('title')
  expect(song).toHaveProperty('grandparentTitle')
  expect(song).toHaveProperty('parentTitle')
  expect(song).toHaveProperty('duration')
  expect(song).toHaveProperty('ratingKey')
  expect(song).toHaveProperty('key')
  expect(song).toHaveProperty('parentRatingKey')
  expect(song).toHaveProperty('grandparentRatingKey')
  expect(song).toHaveProperty('viewCount')
  expect(song).toHaveProperty('addedAt')

  expect(typeof song.title).toBe('string')
  expect(typeof song.grandparentTitle).toBe('string')
  expect(typeof song.parentTitle).toBe('string')
  expect(typeof song.duration).toBe('number')
  expect(typeof song.ratingKey).toBe('string')
  expect(typeof song.viewCount).toBe('number')
  expect(typeof song.addedAt).toBe('number')
}

export const validateImageUrlRewrite = (originalUrl: string | undefined, rewrittenUrl: string | undefined) => {
  if (!originalUrl) {
    expect(rewrittenUrl).toBeUndefined()
    return
  }

  const cleanPath = originalUrl.startsWith('/') ? originalUrl.slice(1) : originalUrl
  expect(rewrittenUrl).toBe(`/api/images/${cleanPath}`)
}

// Async helpers
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise])
}

// Crypto mock helpers
export const mockCrypto = (hash: string = 'mock-hash') => {
  vi.mock('crypto', () => ({
    createHash: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => hash)
    }))
  }))
}

// Console mock helpers
export const mockConsole = () => {
  const originalError = console.error
  const originalWarn = console.warn
  const originalLog = console.log

  console.error = vi.fn()
  console.warn = vi.fn()
  console.log = vi.fn()

  return {
    error: console.error,
    warn: console.warn,
    log: console.log,
    restore: () => {
      console.error = originalError
      console.warn = originalWarn
      console.log = originalLog
    }
  }
}

// URL helpers
export const buildPlexUrl = (searchParams: string = '') => {
  const baseUrl = `${process.env.VITE_PLEX_SERVER_URL}/library/sections/2/all`
  const token = `X-Plex-Token=${process.env.VITE_PLEX_TOKEN}`
  const type = 'type=10'

  const params = [token, type, searchParams].filter(Boolean).join('&')
  return `${baseUrl}?${params}`
}

export const parseRequestUrl = (call: any[]) => {
  const [url] = call
  return new URL(url)
}

// Test data sets
export const testSongs = {
  minimal: createMockSong({
    title: 'Minimal Song',
    Media: undefined
  }),

  complete: createMockSong({
    title: 'Complete Song',
    lastViewedAt: 1640995200,
    updatedAt: 1640995200,
    userRating: 8,
    art: '/api/images/library/metadata/12345/art/1234567890',
    grandparentThumb: '/api/images/library/metadata/54321/thumb/1234567890'
  }),

  withoutViewCount: createMockSong({
    title: 'No View Count',
    viewCount: undefined as any
  })
}
