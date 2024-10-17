import { useEffect, useState } from 'react';

type MediaType = 'Song' | 'Album' | 'Artist';

interface MediaItem {
  type: MediaType;
  title: string;
  artist?: string;
}

interface MoodResponse {
  feeling: string;
}

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

const useMoodStatement = (mediaItems: MediaItem[]) => {
  const [moodStatement, setMoodStatement] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateMoodStatement = async () => {
      setLoading(true);
      setError(null);

      const prompt = `
        Based on the following list of ${mediaItems[0].type.toLowerCase()}s:
        ${mediaItems.map(item => `${item.title}${item.artist ? ` by ${item.artist}` : ''}`).join(', ')}

        Generate a single-sentence statement starting with 'This is how I feel:' that captures the overall mood and emotional state of someone who has been listening to or enjoying these ${mediaItems[0].type.toLowerCase()}s. Return the result in JSON format with a single key called 'feeling'.
      `;

      try {
        const response = await fetch(
          'https://api.anthropic.com/v1/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': apiKey,
            },
            body: JSON.stringify({
              prompt,
              model: 'claude-3.5',
              max_tokens_to_sample: 100,
              temperature: 0.7,
            })
          }
        );

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const responseJson = await response.json();

        const generatedMood: MoodResponse = JSON.parse(responseJson.data.completion);
        setMoodStatement(generatedMood.feeling);
      } catch (err) {
        setError('Failed to generate mood statement. Please try again.');
        console.error('Error generating mood statement:', err);
      } finally {
        setLoading(false);
      }
    };

    if (mediaItems.length > 0 && apiKey) {
      generateMoodStatement();
    }
  }, [mediaItems]);

  return { moodStatement, loading, error };
};

export default useMoodStatement;
