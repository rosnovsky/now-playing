import { json } from "@remix-run/node";
import { createHash } from "crypto";
import { Song, songsSchema } from "~/types";

export async function loader({ request }: { request: Request }) {
  const { searchParams } = new URL(request.url);

  const response = await fetch(`${import.meta.env.VITE_PLEX_SERVER_URL}/library/sections/2/all?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}&type=10&${searchParams.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });
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
    thumb: `${import.meta.env.VITE_PLEX_SERVER_URL}${item.thumb}?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}`,
    art: `${import.meta.env.VITE_PLEX_SERVER_URL}${item.art}?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}`,
    parentThumb: `${import.meta.env.VITE_PLEX_SERVER_URL}${item.parentThumb}?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}`,
    grandparentThumb: `${import.meta.env.VITE_PLEX_SERVER_URL}${item.grandparentThumb}?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}`,
    duration: item.duration,
    addedAt: item.addedAt,
    Media: item.Media,
    updatedAt: item.updatedAt,
    userRating: item.userRating,
  }));

  const validatedSongs = songsSchema.parse(songs);

  // TODO: Turn this into a helper function
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
}
