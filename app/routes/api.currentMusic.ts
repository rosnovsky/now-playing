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

    const currentMusic: CurrentMusic = {
      ...session,
      albumArt: `${import.meta.env.VITE_PLEX_SERVER_URL}${session.thumb}?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}`,
      currentTime: session.viewOffset,
      isPlaying: true,
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
