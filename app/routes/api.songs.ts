import { json } from "@remix-run/node";
import { createHash } from "crypto";
import { Song, songsSchema } from "~/types";
import { upsertPlexData } from "~/utils/drizzle.server";
import { fetcher } from "~/utils/fetcher";

export async function loader({ request }: { request: Request }) {
  try {
    const { searchParams } = new URL(request.url);
    const searchParamsString = searchParams.toString();

    const songsUrl = `${
      process.env.VITE_PLEX_SERVER_URL
    }/library/sections/3/search?X-Plex-Token=${
      process.env.VITE_PLEX_TOKEN
    }&type=10&sort=lastViewedAt:desc${searchParamsString ? '&' + searchParamsString : ''}&limit=50`

    const response = await fetcher(
      songsUrl,
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

    const data = response.data;

    // @ts-expect-error FIXME eventually
    const songs: Song[] = data.MediaContainer.Metadata.map((item: Song) => {
      const rewriteImageUrl = (url: string | null | undefined) => {
        if (!url) return undefined;
        const cleanPath = url.startsWith("/") ? url.slice(1) : url;
        return `/api/images/${cleanPath}`;
      };

      return {
        title: item.title,
        grandparentTitle: item.grandparentTitle,
        parentTitle: item.parentTitle,
        albumArt: rewriteImageUrl(item.albumArt),
        duration: item.duration,
        ratingKey: item.ratingKey,
        key: item.key,
        parentRatingKey: item.parentRatingKey,
        grandparentRatingKey: item.grandparentRatingKey,
        viewCount: item.viewCount || 0,
        lastViewedAt: item.lastViewedAt,
        thumb: rewriteImageUrl(item.thumb),
        art: rewriteImageUrl(item.art),
        parentThumb: rewriteImageUrl(item.parentThumb),
        grandparentThumb: rewriteImageUrl(item.grandparentThumb),
        addedAt: item.addedAt,
        updatedAt: item.updatedAt,
        userRating: item.userRating,
        Media: item.Media
          ? [
              {
                audioCodec: item.Media[0].audioCodec,
                bitrate: item.Media[0].bitrate,
              },
            ]
          : undefined,
      };
    });

    const parsedResult = songsSchema.safeParse(songs);

    if (!parsedResult.success) {
      console.error("Validation error:", parsedResult.error);
      return json({ error: "Invalid data structure" }, { status: 500 });
    }

    const validatedSongs = parsedResult.data;

    await upsertPlexData("songs", validatedSongs);

    const etag = createHash("md5")
      .update(JSON.stringify(validatedSongs))
      .digest("hex");

    const clientEtag = request.headers.get("If-None-Match");

    if (clientEtag === etag) {
      return new Response(null, { status: 304 });
    }

    return json(validatedSongs, {
      headers: {
        ETag: etag,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error fetching songs:", error);
    return json({ error: "Failed to fetch songs" }, { status: 500 });
  }
}
