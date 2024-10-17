import { json } from "@remix-run/node";
import { createHash } from "crypto";
import { Artist, artistsSchema } from "~/types";

export async function loader({ request }: { request: Request }) {
  const response = await fetch(`${import.meta.env.VITE_PLEX_SERVER_URL}/library/sections/2/all?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}&type=8&sort=viewCount%3Adesc&limit=10`, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });
  const data = await response.json() as { MediaContainer: { Metadata: Artist[] } };

  const artists = data.MediaContainer.Metadata.map((item: Artist) => ({
    ratingKey: item.ratingKey,
    guid: item.guid,
    type: item.type,
    title: item.title,
    summary: item.summary,
    viewCount: item.viewCount || 0,
    thumb: item.thumb ? `${import.meta.env.VITE_PLEX_SERVER_URL}${item.thumb}?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}` : null,
    art: item.art ? `${import.meta.env.VITE_PLEX_SERVER_URL}${item.art}?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}` : null,
    addedAt: item.addedAt,
    updatedAt: item.updatedAt,
  }));

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
