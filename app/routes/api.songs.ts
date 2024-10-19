import { json } from "@remix-run/node";
import { createHash } from "crypto";
import { Song, songsSchema } from "~/types";

export async function loader({ request }: { request: Request }) {
  try {
    const { searchParams } = new URL(request.url);

    const response = await fetch(`${process.env.VITE_PLEX_SERVER_URL}/library/sections/2/all?X-Plex-Token=${process.env.VITE_PLEX_TOKEN}&type=10&${searchParams.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const songs: Song[] = data.MediaContainer.Metadata.map((item: Song) => ({
      ratingKey: item.ratingKey,
      key: item.key,
      parentRatingKey: item.parentRatingKey,
      grandparentRatingKey: item.grandparentRatingKey,
      guid: item.guid,
      parentGuid: item.parentGuid,
      grandparentGuid: item.grandparentGuid,
      type: item.type,
      title: item.title,
      grandparentTitle: item.grandparentTitle,
      parentTitle: item.parentTitle,
      summary: item.summary,
      index: item.index,
      parentIndex: item.parentIndex,
      viewCount: item.viewCount,
      lastViewedAt: item.lastViewedAt,
      parentYear: item.parentYear,
      thumb: `${process.env.VITE_PLEX_SERVER_URL}${item.thumb}?X-Plex-Token=${process.env.VITE_PLEX_TOKEN}`,
      art: item.art ? `${process.env.VITE_PLEX_SERVER_URL}${item.art}?X-Plex-Token=${process.env.VITE_PLEX_TOKEN}` : undefined,
      parentThumb: `${process.env.VITE_PLEX_SERVER_URL}${item.parentThumb}?X-Plex-Token=${process.env.VITE_PLEX_TOKEN}`,
      grandparentThumb: item.grandparentThumb ? `${process.env.VITE_PLEX_SERVER_URL}${item.grandparentThumb}?X-Plex-Token=${process.env.VITE_PLEX_TOKEN}` : undefined,
      duration: item.duration,
      addedAt: item.addedAt,
      updatedAt: item.updatedAt,
      Media: item.Media,
      userRating: item.userRating,
    }));

    const parsedResult = songsSchema.safeParse(songs);

    if (!parsedResult.success) {
      console.error("Validation error:", parsedResult.error);
      return json({ error: "Invalid data structure" }, { status: 500 });
    }

    const validatedSongs = parsedResult.data;

    const etag = createHash('md5').update(JSON.stringify(validatedSongs)).digest('hex');

    const clientEtag = request.headers.get('If-None-Match');

    if (clientEtag === etag) {
      return new Response(null, { status: 304 });
    }

    return json(validatedSongs, {
      headers: {
        'ETag': etag,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error("Error fetching songs:", error);
    return json({ error: "Failed to fetch songs" }, { status: 500 });
  }
}
