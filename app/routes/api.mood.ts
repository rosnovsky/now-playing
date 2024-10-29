import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { MoodCache } from "~/utils/moodCache";

interface Song {
  title: string;
  grandparentTitle: string;
}

interface MoodResponse {
  feeling: string;
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const songs = await request.json() as Song[];

    if (!songs?.length) {
      return json({ error: "No songs provided" }, { status: 400 });
    }

    const moodCache = MoodCache.getInstance();

    const cachedMood = await moodCache.get(songs);
    if (cachedMood) {
      return json({ mood: cachedMood, cached: true });
    }

    if (await moodCache.shouldRefresh(songs)) {
      const messages = [{
        role: 'user',
        content: `Based on the following list of songs:
          ${songs.map(item => `${item.title} by ${item.grandparentTitle}`).join(', ')}

          Generate a single sentence of up to 140 characters long that captures the overall mood and emotional state of someone who has been enjoying these songs. Form this sentence in the first person. Return the result in JSON format with a single key called 'feeling'.`
      }];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          messages,
          model: 'claude-3-sonnet-20240229',
          max_tokens: 100,
          temperature: 0.7,
          system: "You are a compassionate and empathetic music mood analyzer. Always respond in valid JSON format with a 'feeling' key."
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const responseJson = await response.json();
      const moodResponse: MoodResponse = JSON.parse(responseJson.content[0].text);

      await moodCache.set(songs, moodResponse.feeling);

      return json({ mood: moodResponse.feeling, cached: false });
    }

  } catch (error) {
    console.error('Mood generation error:', error);
    return json(
      { error: "Failed to generate mood" },
      { status: 500 }
    );
  }
};
