import { kv } from '@vercel/kv';
import { createHash } from 'crypto';

interface CacheEntry {
  mood: string;
  timestamp: number;
  songs: Array<{ title: string; grandparentTitle: string }>;
}

const CACHE_DURATION = 3 * 60 * 60 * 1000;
const CACHE_PREFIX = 'mood:';

// TODO: Turn into generic cache eventually
export class MoodCache {
  private static instance: MoodCache;

  private constructor() { }

  static getInstance(): MoodCache {
    if (!MoodCache.instance) {
      MoodCache.instance = new MoodCache();
    }
    return MoodCache.instance;
  }

  private generateHash(songs: Array<{ title: string; grandparentTitle: string }>): string {
    const sortedSongs = [...songs].sort((a, b) =>
      `${a.title}:${a.grandparentTitle}`.localeCompare(`${b.title}:${b.grandparentTitle}`)
    );

    const songsString = sortedSongs
      .map(song => `${song.title}:${song.grandparentTitle}`)
      .join('|');

    return createHash('md5').update(songsString).digest('hex');
  }

  private calculateSongListSimilarity(
    songs1: Array<{ title: string; grandparentTitle: string }>,
    songs2: Array<{ title: string; grandparentTitle: string }>
  ): number {
    const set1 = new Set(songs1.map(s => `${s.title}:${s.grandparentTitle}`));
    const set2 = new Set(songs2.map(s => `${s.title}:${s.grandparentTitle}`));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  private getCacheKey(hash: string): string {
    return `${CACHE_PREFIX}${hash}`;
  }

  async get(songs: Array<{ title: string; grandparentTitle: string }>): Promise<string | null> {
    const hash = this.generateHash(songs);
    const cacheKey = this.getCacheKey(hash);

    try {
      const cached = await kv.get<CacheEntry>(cacheKey);

      if (!cached) {
        return null;
      }

      const now = Date.now();
      const isExpired = (now - cached.timestamp) > CACHE_DURATION;

      if (isExpired) {
        await kv.del(cacheKey);
        return null;
      }

      return cached.mood;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(songs: Array<{ title: string; grandparentTitle: string }>, mood: string): Promise<void> {
    const hash = this.generateHash(songs);
    const cacheKey = this.getCacheKey(hash);

    try {
      const entry: CacheEntry = {
        mood,
        timestamp: Date.now(),
        songs
      };

      await kv.set(cacheKey, entry, { ex: Math.ceil(CACHE_DURATION / 1000) + 60 });

      void this.cleanup();
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async shouldRefresh(songs: Array<{ title: string; grandparentTitle: string }>): Promise<boolean> {
    const hash = this.generateHash(songs);
    const cacheKey = this.getCacheKey(hash);

    try {
      const cached = await kv.get<CacheEntry>(cacheKey);

      if (!cached) {
        return true;
      }

      const now = Date.now();
      const isExpired = (now - cached.timestamp) > CACHE_DURATION;

      if (isExpired) {
        return true;
      }

      const similarity = this.calculateSongListSimilarity(songs, cached.songs);
      return similarity < 0.5;
    } catch (error) {
      console.error('Cache check error:', error);
      return true;
    }
  }

  private async cleanup(): Promise<void> {
    try {
      const keys = await kv.keys(`${CACHE_PREFIX}*`);
      const now = Date.now();

      for (const key of keys) {
        const entry = await kv.get<CacheEntry>(key);
        if (entry && now - entry.timestamp > CACHE_DURATION) {
          await kv.del(key);
        }
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }
}
