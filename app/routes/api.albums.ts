import { json } from "@remix-run/node";
import { createHash } from "crypto";

import { Album, albumsSchema } from "~/types";
import { upsertPlexData } from "~/utils/drizzle.server";
import { fetcher } from "~/utils/fetcher";

export async function loader({ request }: { request: Request }) {
  const albumsUrl = `${
    import.meta.env.VITE_PLEX_SERVER_URL
  }/library/sections/3/search?type=9&X-Plex-Token=${
    import.meta.env.VITE_PLEX_TOKEN
  }&sort=viewCount%3Adesc&limit=10`

  try {
    const response = await fetcher(albumsUrl);
    // @ts-expect-error FIXME eventually
    const data = response.data?.MediaContainer.Metadata;

    const validAlbums = albumsSchema.parse(data)

    const albums = validAlbums.map((item: Album) => {
      const rewriteImageUrl = (url: string | undefined) => {
        if (!url) return undefined;
        const cleanPath = url.startsWith("/") ? url.slice(1) : url;
        return `/api/images/${cleanPath}`;
      };

      return {
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
        thumb: rewriteImageUrl(item.thumb) ?? null,
        art: rewriteImageUrl(item.art || undefined) ?? null,
        parentThumb: rewriteImageUrl(item.parentThumb) ?? null,
        addedAt: item.addedAt,
        updatedAt: item.updatedAt,
      };
    });

    // Deduplicate albums by ratingKey
    const seen = new Set();
    const uniqueAlbums = albums.filter(album => {
      const duplicate = seen.has(album.ratingKey);
      seen.add(album.ratingKey);
      return !duplicate;
    });


    const validatedAlbums = albumsSchema.parse(uniqueAlbums);

    await upsertPlexData("albums", validatedAlbums)

    const etag = createHash("md5")
      .update(JSON.stringify(validatedAlbums))
      .digest("hex");

    const clientEtag = request.headers.get("If-None-Match");

    if (clientEtag === etag) {
      return new Response(null, { status: 304 });
    }

    return json(validatedAlbums);
  } catch (error) {
    console.error('Error in albums API:', error);
    return json({ error: 'Failed to fetch albums', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
