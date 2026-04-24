// API client for SiteScout backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number;
  google_place_id: string;
  latitude: number | null;
  longitude: number | null;
  location?: {
    lat: number;
    lng: number;
  };
  has_website: boolean;
  website_url: string | null;
  detection_method: string;
  confidence_score: number;
  website_age?: string | null;
  is_outdated?: boolean;
  last_updated: string;
}

export interface SearchParams {
  location: string;
  category?: string;
  categories?: string[];
  radius?: number;
  minRating?: number;
}

export interface SearchStatistics {
  total_searched: number;
  with_websites: number;
  without_websites: number;
  detection_accuracy: string;
  average_presence_score: string;
}

export interface SearchResponse {
  success: boolean;
  data: Business[];
  total: number;
  search_location?: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  search_params?: {
    location: string;
    category?: string;
    categories?: string[];
    radius?: number;
    minRating?: number;
  };
  statistics?: SearchStatistics;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  timestamp?: string;
}

export interface CitySuggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          success: false,
          error: errorData.error || `HTTP error! status: ${response.status}`,
          message: errorData.message || 'An unexpected error occurred',
          timestamp: errorData.timestamp
        };
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      if (error instanceof Error) {
        const apiError: ApiError = {
          success: false,
          error: 'Network Error',
          message: error.message,
          timestamp: new Date().toISOString()
        };
        throw apiError;
      }
      throw error;
    }
  }

  async searchBusinesses(params: SearchParams): Promise<SearchResponse> {
    return this.request<SearchResponse>('/api/businesses/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getCitySuggestions(query: string, country?: string): Promise<{
    success: boolean; suggestions: CitySuggestion[]
  }> {
    const params = new URLSearchParams({ query });
    if (country) params.append('country', country);

    return this.request<{ success: boolean; suggestions: CitySuggestion[] }>(`/api/businesses/autocomplete?${params}`);
  }

  async getHealth(): Promise<{ status: string; timestamp: string; service: string }> {
    return this.request('/health');
  }

  async exportBusinesses(businessIds: string[], format: 'csv' | 'json' = 'csv'): Promise<Blob | unknown> {
    const response = await fetch(`${this.baseUrl}/api/businesses/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ businessIds, format }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Export failed');
    }

    if (format === 'csv') {
      return await response.blob();
    } else {
      return await response.json();
    }
  }

  // New method to export by Google Place IDs
  async exportByPlaceIds(googlePlaceIds: string[], format: 'csv' | 'json' = 'csv'): Promise<Blob | unknown> {
    const response = await fetch(`${this.baseUrl}/api/businesses/export/byPlaceId`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ googlePlaceIds, format }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Export failed');
    }

    if (format === 'csv') {
      return await response.blob();
    } else {
      return await response.json();
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
