import { json } from "@remix-run/node";
import { z } from "zod";

const currentMusicSchema = z.object({
  title: z.string(),
  artist: z.string(),
  album: z.string(),
  albumArt: z.string(),
  duration: z.number(),
  currentTime: z.number(),
  isPlaying: z.boolean(),
});

export type CurrentMusic = z.infer<typeof currentMusicSchema>;

export async function loader() {
  try {
    const response = await fetch(`${import.meta.env.VITE_PLEX_SERVER_URL}/status/sessions?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}`, {
      headers: {
        Accept: 'application/json',
      }
    });
    const data = await response.json();

    // Assuming the first active session is the current playback
    const session = data.MediaContainer.Metadata?.[0];

    if (!session) {
      return json({ isPlaying: false });
    }

    const currentMusic: CurrentMusic = {
      title: session.title,
      artist: session.grandparentTitle,
      album: session.parentTitle,
      albumArt: `${import.meta.env.VITE_PLEX_SERVER_URL}${session.thumb}?X-Plex-Token=${import.meta.env.VITE_PLEX_TOKEN}`,
      duration: session.duration,
      currentTime: session.viewOffset,
      isPlaying: true,
    };

    return json(currentMusicSchema.parse(currentMusic));
  } catch (error) {
    console.error("Error fetching now playing:", error);
    return json({ isPlaying: false });
  }
}
