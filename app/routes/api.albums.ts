import { json } from "@remix-run/node";
import { createHash } from "crypto";
import { Album, albumsSchema } from "~/types";
import { fetcher } from "~/utils/fetcher";

export async function loader({ request }: { request: Request }) {
  const response = await fetcher(
    `${
      import.meta.env.VITE_PLEX_SERVER_URL
    }/library/sections/3/search?type=9&X-Plex-Token=${
      import.meta.env.VITE_PLEX_TOKEN
    }&sort=viewCount%3Adesc&limit=5`
  );
  const data = response.data;

  console.log({ metadataAtZero: data.MediaContainer.Metadata[0] });

  console.log(
    `${
      import.meta.env.VITE_PLEX_SERVER_URL
    }/library/sections/3/search?type=9&X-Plex-Token=${
      import.meta.env.VITE_PLEX_TOKEN
    }&sort=viewCount%3Adesc&limit=5`
  );

  const albums = data.MediaContainer.Metadata.map((item: Album) => {
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
      parentThumb: rewriteImageUrl(item.parentThumb) ?? null,
      addedAt: item.addedAt,
      updatedAt: item.updatedAt,
    };
  });

  const validatedAlbums = albumsSchema.safeParse(albums);

  const etag = createHash("md5")
    .update(JSON.stringify(validatedAlbums))
    .digest("hex");

  const clientEtag = request.headers.get("If-None-Match");

  if (clientEtag === etag) {
    return new Response(null, { status: 304 });
  }

  return json(validatedAlbums);
}
