import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { useStore } from '~/store';
import { fetcher } from '~/utils/fetcher';

type DataType = 'songs' | 'artists' | 'albums' | 'genres';

interface UsePollDataOptions<T> {
  schema?: z.ZodType<T | undefined>;
  headers?: Record<string, string>;
  interval?: number;
  initialData?: T;
}

export const usePollData = <T>(dataType: DataType | string, options: UsePollDataOptions<T> = {}) => {
  const { schema, headers: initialHeaders = {}, interval = 120000, initialData } = options;
  const [data, setData] = useState<T | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(initialData ? false : true);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  const setStoreData = useStore((state) => state.setData);

  const fetchData = useCallback(async (forceLoad: boolean = false) => {
    const etag = forceLoad ? '' : sessionStorage.getItem(`${dataType}Etag`) || '';
    try {
      const { status, data: newData, headers } = await fetcher(`${import.meta.env.VITE_API_URL}/api/${dataType}`, {
        headers: {
          'If-None-Match': etag,
          ...initialHeaders
        }
      });

      if (forceLoad || (status !== 304 && newData)) {
        let validatedData: T;
        if (schema) {
          validatedData = schema.parse(newData);
        } else {
          validatedData = newData as T;
        }
        setData(validatedData);
        setStoreData(dataType, validatedData);
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
  }, [dataType, setStoreData, schema, initialHeaders]);

  useEffect(() => {
    if (!isInitialDataLoaded) {
      fetchData(true);  // Force load initial data
      setIsInitialDataLoaded(true);
    } else {
      const pollInterval = setInterval(() => fetchData(), interval);
      return () => clearInterval(pollInterval);
    }
  }, [fetchData, interval, isInitialDataLoaded]);

  return { data, isLoading, error };
};
