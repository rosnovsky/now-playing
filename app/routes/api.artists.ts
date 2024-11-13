import { json } from "@remix-run/node";
import { createHash } from "crypto";
import { Artist, artistsSchema } from "~/types";

const getTimeRangeFilter = (timeRange: string) => {
  const now = new Date();
  switch (timeRange) {
    case 'week':
      return Math.floor(now.setDate(now.getDate() - 7) / 1000);
    case 'month':
      return Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
    case 'year':
      return Math.floor(new Date(now.getFullYear(), 0, 1).getTime() / 1000);
    default:
      return 0;
  }
};

export async function loader({ request }: { request: Request }) {
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('timeRange') || 'all-time';
  const startTime = getTimeRangeFilter(timeRange);

  const response = await fetch(`${import.meta.env.VITE_PLEX_SERVER_URL}/library/sections/2/all` +
    `?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}` +
    `&type=8` +
    `&sort=viewCount%3Adesc` +
    `&limit=10` +
    `&lastViewedAt>=${startTime}&viewCount>=1`, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });
  const data = await response.json() as { MediaContainer: { Metadata: Artist[] } };



  const artists = data.MediaContainer.Metadata.map((item: Artist) => {
    const rewriteImageUrl = (url: string | undefined) => {
      if (!url) return null;
      const cleanPath = url.startsWith('/') ? url.slice(1) : url;
      return `/api/images/${cleanPath}`;
    };

    return {
      ratingKey: item.ratingKey,
      guid: item.guid,
      type: item.type,
      title: item.title,
      summary: item.summary,
      viewCount: item.viewCount || 0,
      thumb: rewriteImageUrl(item.thumb) ?? null,
      addedAt: item.addedAt,
      updatedAt: item.updatedAt,
    }
  });

  const validatedArtists = artistsSchema.parse(artists);

  const etag = createHash('md5').update(JSON.stringify(validatedArtists)).digest('hex');

  const clientEtag = request.headers.get('If-None-Match');

  if (clientEtag === etag) {
    return new Response(null, { status: 304 });
  }

  return json(validatedArtists, {
    headers: {
      'ETag': etag,
      'Cache-Control': 'no-cache'
    }
  });
}
