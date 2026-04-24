import { useState, useCallback } from 'react';
import { apiClient, Business, SearchParams, SearchResponse, SearchStatistics } from '@/lib/api';

interface UseBusinessSearchReturn {
  businesses: Business[];
  loading: boolean;
  error: string | null;
  total: number;
  statistics: SearchStatistics | null;
  searchLocation: { address: string; coordinates: { lat: number; lng: number } } | null;
  searchBusinesses: (params: SearchParams) => Promise<SearchResponse | null>;
  clearError: () => void;
  clearResults: () => void;
}

export function useBusinessSearch(): UseBusinessSearchReturn {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [statistics, setStatistics] = useState<SearchStatistics | null>(null);
  const [searchLocation, setSearchLocation] = useState<{ address: string; coordinates: { lat: number; lng: number } } | null>(null);

  const searchBusinesses = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.searchBusinesses(params);
      
      if (response.success) {
        setBusinesses(response.data);
        setTotal(response.total);
        setStatistics(response.statistics || null);
        setSearchLocation(response.search_location || null);
        return response;
      } else {
        setError(response.message || 'Search failed');
        setBusinesses([]);
        setTotal(0);
        setStatistics(null);
        setSearchLocation(null);
        return null;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setBusinesses([]);
      setTotal(0);
      setStatistics(null);
      setSearchLocation(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResults = useCallback(() => {
    setBusinesses([]);
    setTotal(0);
    setStatistics(null);
    setSearchLocation(null);
    setError(null);
  }, []);

  return {
    businesses,
    loading,
    error,
    total,
    statistics,
    searchLocation,
    searchBusinesses,
    clearError,
    clearResults,
  };
}
