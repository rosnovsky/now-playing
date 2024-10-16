import { useCallback, useEffect, useState } from 'react';
import { useStore } from '~/store';
import { fetcher } from '~/utils/fetcher';

type DataType = 'songs' | 'artists' | 'albums' | 'genres';

export const usePollData = (dataType: DataType, interval: number = 5000) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const setStoreData = useStore((state) => state.setData);

  const fetchData = useCallback(async () => {
    const etag = sessionStorage.getItem(`${dataType}Etag`) || '';
    try {
      const { status, data: newData, headers } = await fetcher(`/api/${dataType}`, {
        headers: {
          'If-None-Match': etag
        }
      });

      if (status !== 304 && newData) {
        setData(newData);
        setStoreData(dataType, newData);
        const newEtag = headers.get('ETag');
        if (newEtag) {
          sessionStorage.setItem(`${dataType}Etag`, newEtag);
        }
      }
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      setIsLoading(false);
    }
  }, [dataType, setStoreData]);

  useEffect(() => {
    fetchData();
    const pollInterval = setInterval(fetchData, interval);
    return () => clearInterval(pollInterval);
  }, [fetchData, interval]);

  return { data, isLoading, error };
};
