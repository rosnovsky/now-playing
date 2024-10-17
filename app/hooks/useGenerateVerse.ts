import { useEffect, useState } from 'react';

type MediaType = 'Song' | 'Album' | 'Artist';

interface MediaItem {
  type: MediaType;
  title: string;
  artist?: string;
}

interface VerseResponse {
  verse: string;
  inspirations: string[];
}

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

export const useGenerateVerse = (mediaItems: MediaItem[]) => {
  const [verse, setVerse] = useState<VerseResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateVerse = async () => {
      setLoading(true);
      setError(null);

      const prompt = `
        Based on the following list of ${mediaItems[0].type.toLowerCase()}s:
        ${mediaItems.map(item => `${item.title}${item.artist ? ` by ${item.artist}` : ''}`).join(', ')}

        Using themes and moods from these ${mediaItems[0].type.toLowerCase()}s, create an original four line verse that captures their emotional essence. Include phrases or lines inspired by multiple ${mediaItems[0].type.toLowerCase()}s. Return the result in JSON format with keys for 'verse' and 'inspirations').
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
              model: 'claude-3.5', // or whichever model is appropriate
              max_tokens_to_sample: 300,
              temperature: 0.7,
            })
          },
        );

        if (!response.ok) {
          throw new Error(response.statusText);
        }
        const responseJson = await response.json();


        const generatedVerse: VerseResponse = JSON.parse(responseJson.data.completion);
        setVerse(generatedVerse);
      } catch (err) {
        setError('Failed to generate verse. Please try again.');
        console.error('Error generating verse:', err);
      } finally {
        setLoading(false);
      }
    };

    if (mediaItems.length > 0 && apiKey) {
      generateVerse();
    }
  }, [mediaItems]);

  return { verse, loading, error };
};
