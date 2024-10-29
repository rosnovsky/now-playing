import { json } from "@remix-run/node";
import { CurrentMusic, currentMusicSchema } from "~/types";

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
      return json({ currentMusic: null, isPlaying: false });
    }

    const rewriteImageUrl = (url: string | undefined) => {
      if (!url) return undefined;
      const cleanPath = url.startsWith('/') ? url.slice(1) : url;
      return `/api/images/${cleanPath}`;
    };

    // Only extract the fields we actually need for display
    const currentMusic: CurrentMusic = {
      title: session.title,
      grandparentTitle: session.grandparentTitle, // Artist
      parentTitle: session.parentTitle, // Album
      albumArt: rewriteImageUrl(session.thumb),
      currentTime: session.viewOffset,
      duration: session.duration,
      isPlaying: true,
      Media: session.Media ? [{
        audioCodec: session.Media[0].audioCodec,
        bitrate: session.Media[0].bitrate
      }] : undefined
    };

    const parsedResult = currentMusicSchema.safeParse(currentMusic);
    if (parsedResult.success) {
      return json({ currentMusic: parsedResult.data, isPlaying: true });
    } else {
      console.error("Validation error:", parsedResult.error);
      return json({ currentMusic: null, isPlaying: false });
    }
  } catch (error) {
    console.error("Error fetching now playing:", error);
    return json({ currentMusic: null, isPlaying: false });
  }
}
