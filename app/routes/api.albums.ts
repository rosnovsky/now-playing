import { json } from "@remix-run/node";
import { createHash } from "crypto";
import { Album, albumsSchema } from "~/types";

export async function loader({ request }: { request: Request }) {
  const response = await fetch(`${import.meta.env.VITE_PLEX_SERVER_URL}/library/sections/2/all?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}&type=9&sort=viewCount%3Adesc&limit=10`, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });
  const data = await response.json() as { MediaContainer: { Metadata: Album[] } };

  const albums = data.MediaContainer.Metadata.map((item: Album) => ({
    ratingKey: item.ratingKey,
    key: item.key,
    parentRatingKey: item.parentRatingKey,
    guid: item.guid,
    parentGuid: item.parentGuid,
    type: item.type,
    title: item.title,
    parentTitle: item.parentTitle,
    summary: item.summary || "",
    index: item.index,
    viewCount: item.viewCount || 0,
    year: item.year,
    thumb: item.thumb ? `${import.meta.env.VITE_PLEX_SERVER_URL}${item.thumb}?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}` : null,
    art: item.art ? `${import.meta.env.VITE_PLEX_SERVER_URL}${item.art}?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}` : null,
    parentThumb: item.parentThumb ? `${import.meta.env.VITE_PLEX_SERVER_URL}${item.parentThumb}?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}` : null,
    addedAt: item.addedAt,
    updatedAt: item.updatedAt,
  }));

  const validatedAlbums = albumsSchema.parse(albums);

  const etag = createHash('md5').update(JSON.stringify(validatedAlbums)).digest('hex');

  const clientEtag = request.headers.get('If-None-Match');

  if (clientEtag === etag) {
    return new Response(null, { status: 304 });
  }

  return json(validatedAlbums, {
    headers: {
      'ETag': etag,
      'Cache-Control': 'no-cache'
    }
  });
}
