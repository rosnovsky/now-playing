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

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  id: string;
  model: string;
  role: "assistant";
  stop_reason: string;
  stop_sequence: null;
  type: "message";
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
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
      const apiKey = process.env.VITE_ANTHROPIC_API_KEY;

      if (!apiKey) {
        console.error('ANTHROPIC_API_KEY environment variable is not set');
        return json(
          { error: "API configuration error" },
          { status: 500 }
        );
      }

      const messages: AnthropicMessage[] = [{
        role: 'user',
        content: `Based on the following list of songs:
          ${songs.map(item => `${item.title} by ${item.grandparentTitle}`).join(', ')}

          Generate a single sentence of up to 140 characters long that captures the overall mood and emotional state of someone who has been enjoying these songs. Form this sentence in the first person. Return the result in JSON format with a single key called 'feeling'.`
      }];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 150,
          temperature: 0.7,
          system: "You are a compassionate and empathetic music mood analyzer. Always respond in valid JSON format with a 'feeling' key.",
          messages
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Anthropic API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const responseJson: AnthropicResponse = await response.json();

      if (!responseJson.content?.[0]?.text) {
        console.error('Invalid response structure from Anthropic API:', responseJson);
        throw new Error('Invalid response structure from Anthropic API');
      }

      let moodResponse: MoodResponse;
      try {
        moodResponse = JSON.parse(responseJson.content[0].text);
      } catch (parseError) {
        console.error('Failed to parse mood response as JSON:', responseJson.content[0].text, parseError);
        throw new Error('Failed to parse mood response');
      }

      if (!moodResponse.feeling) {
        console.error('Missing feeling property in mood response:', moodResponse);
        throw new Error('Invalid mood response format');
      }

      await moodCache.set(songs, moodResponse.feeling);

      return json({ mood: moodResponse.feeling, cached: false });
    }

    // If we reach here, cache exists but shouldn't refresh
    const existingMood = await moodCache.get(songs);
    return json({ mood: existingMood, cached: true });

  } catch (error) {
    console.error('Mood generation error:', error);

    // Provide more specific error messages for debugging
    if (error instanceof Error) {
      if (error.message.includes('Anthropic API')) {
        return json(
          { error: "External API error - please try again later" },
          { status: 502 }
        );
      } else if (error.message.includes('parse')) {
        return json(
          { error: "Response parsing error" },
          { status: 500 }
        );
      }
    }

    return json(
      { error: "Failed to generate mood" },
      { status: 500 }
    );
  }
};
