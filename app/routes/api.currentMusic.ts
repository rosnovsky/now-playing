import { json } from "@remix-run/node";
import { recordPlay } from "~/db/queries";
import { CurrentMusic, currentMusicSchema } from "~/types";

// We'll use this to store the last recorded play
let lastRecordedPlay: { ratingKey: string; timestamp: number } | null = null;

export async function loader() {
  try {
    const response = await fetch(`${import.meta.env.VITE_PLEX_SERVER_URL}/status/sessions?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}`, {
      headers: {
        Accept: 'application/json',
      }
    });
    const data = await response.json();

    const session = data.MediaContainer.Metadata?.[0];

    if (!session) {
      lastRecordedPlay = null; // Reset when nothing is playing
      return json({ currentMusic: null, isPlaying: false });
    }

    const rewriteImageUrl = (url: string | undefined) => {
      if (!url) return undefined;
      const cleanPath = url.startsWith('/') ? url.slice(1) : url;
      return `/api/images/${cleanPath}`;
    };

    const currentMusic: CurrentMusic = {
      ...session,
      albumArt: rewriteImageUrl(session.thumb),
      currentTime: session.viewOffset,
      isPlaying: true,
    };

    const parsedResult = currentMusicSchema.safeParse(currentMusic);
    if (parsedResult.success) {
      const now = Date.now();
      const songData = parsedResult.data;

      // Only record the play if it's a new song or if it's been more than 5 minutes since the last recording
      if (!lastRecordedPlay ||
        lastRecordedPlay.ratingKey !== songData.ratingKey ||
        now - lastRecordedPlay.timestamp > 5 * 60 * 1000) {
        await recordPlay(songData);
        lastRecordedPlay = { ratingKey: songData.ratingKey, timestamp: now };
      }

      return json({ currentMusic: songData, isPlaying: true });
    } else {
      console.error("Validation error:", parsedResult.error);
      return json({ currentMusic: null, isPlaying: false });
    }
  } catch (error) {
    console.error("Error fetching now playing:", error);
    return json({ currentMusic: null, isPlaying: false });
  }
}
