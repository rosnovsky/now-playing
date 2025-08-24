import { json } from "@remix-run/node";
import { createHash } from "crypto";
import { Artist, artistsSchema } from "~/types";
import { upsertPlexData } from "~/utils/drizzle.server";
import { fetcher } from "~/utils/fetcher";

export async function loader({ request }: { request: Request }) {
  try {
    const response = await fetcher(
      `${
        import.meta.env.VITE_PLEX_SERVER_URL
      }/library/sections/3/all?X-Plex-Token=${
        import.meta.env.VITE_PLEX_TOKEN
      }&sort=viewCount%3Adesc&limit=10`,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (!response.data) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = response.data as {
      MediaContainer: { Metadata: Artist[] };
    };

    const artists = data.MediaContainer.Metadata.map((item: Artist) => {
      const rewriteImageUrl = (url: string | null | undefined) => {
        if (!url) return undefined;
        const cleanPath = url.startsWith("/") ? url.slice(1) : url;
        return `/api/images/${cleanPath}`;
      };

      return {
        ratingKey: item.ratingKey,
        guid: item.guid,
        type: item.type,
        title: item.title,
        summary: item.summary,
        viewCount: item.viewCount || 0,
        thumb: rewriteImageUrl(item.thumb),
        art: rewriteImageUrl(item.art) ?? null,
        addedAt: item.addedAt,
        updatedAt: item.updatedAt,
      };
    });

    const validatedArtists = artistsSchema.parse(artists);

    await upsertPlexData("artists", validatedArtists);

    const etag = createHash("md5")
      .update(JSON.stringify(validatedArtists))
      .digest("hex");

    const clientEtag = request.headers.get("If-None-Match");

    if (clientEtag === etag) {
      return new Response(null, { status: 304 });
    }

    return json(validatedArtists, {
      headers: {
        ETag: etag,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error fetching artists:", error);
    return json({ error: "Failed to fetch artists" }, { status: 500 });
  }
}
