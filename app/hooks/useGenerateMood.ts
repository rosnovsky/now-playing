import { useEffect, useState } from 'react';
import { Song } from '~/types';

const useMoodStatement = (songs: Song[]) => {
  const [moodStatement, setMoodStatement] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateMoodStatement = async () => {
      if (!songs?.length) return;

      setLoading(true);
      setError(null);

      try {
        const validSongs = songs
          .filter(song => song.title && song.grandparentTitle)
          .slice(0, 50)
          .map(song => ({
            title: song.title,
            grandparentTitle: song.grandparentTitle
          }));

        const response = await fetch('/api/mood', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validSongs)
        });

        if (!response.ok) {
          throw new Error('Failed to generate mood');
        }

        const data = await response.json();
        setMoodStatement(data.mood);
      } catch (err) {
        setError('Failed to generate mood statement. Please try again.');
        console.error('Error generating mood statement:', err);
      } finally {
        setLoading(false);
      }
    };

    generateMoodStatement();
  }, [songs]);

  return { moodStatement, loading, error };
};

export default useMoodStatement;
