'use client';

import React, { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import DashboardNav from '@/components/DashboardNav';
import { useBusinessSearch } from '@/hooks/useBusinessSearch';
import { mockBusinesses, mockStats } from '@/lib/mockData';

interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  rating?: number;
  reviews_count?: number;
  has_website: boolean;
  website_url?: string | null;
  presence_score?: {
    score: number;
    hasWebsite: boolean;
    confidence: number;
  };
  location?: {
    lat: number;
    lng: number;
  };
  last_updated: string;
}

interface DashboardStats {
  total_businesses: number;
  with_websites: number;
  without_websites: number;
  avg_presence_score: number;
  avg_rating: number;
  added_today: number;
  updated_today: number;
}

interface SearchFilters {
  location: string;
  categories: string[];
  minRating: number;
  city?: string;
  state?: string;
}

export default function DashboardPage() {
  const { searchBusinesses, businesses, statistics, loading, error } = useBusinessSearch();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(mockStats);
  const [useMockData, setUseMockData] = useState(false);

  // Convert API businesses to dashboard format
  const dashboardBusinesses: Business[] = useMockData ? mockBusinesses : businesses.map((business) => ({
    id: business.id,
    name: business.name,
    category: business.category,
    address: business.address,
    phone: business.phone || undefined,
    rating: business.rating || undefined,
    reviews_count: business.reviews_count,
    has_website: business.has_website,
    website_url: business.website_url || undefined,
    presence_score: {
      score: business.confidence_score,
      hasWebsite: business.has_website,
      confidence: business.confidence_score
    },
    location: business.location,
    last_updated: business.last_updated
  }));

  // Update dashboard stats when statistics change
  useEffect(() => {
    if (statistics && !useMockData) {
      setDashboardStats({
        total_businesses: statistics.total_searched || 0,
        with_websites: statistics.with_websites || 0,
        without_websites: statistics.without_websites || 0,
        avg_presence_score: parseFloat(statistics.average_presence_score || '0'),
        avg_rating: 4.2, // Mock average rating
        added_today: 0, // Would come from API
        updated_today: 0 // Would come from API
      });
    }
  }, [statistics, useMockData]);

  const handleSearch = async (filters: SearchFilters) => {
    try {
      if (useMockData) {
        // Simulate search with mock data
        console.log('Using mock data for search:', filters);
        return;
      }
      await searchBusinesses({
        location: filters.location,
        categories: filters.categories,
        minRating: filters.minRating
      });
    } catch (error) {
      console.error('Search failed:', error);
      // Fall back to mock data on error
      setUseMockData(true);
    }
  };

  const handleSave = async (businessIds: string[]) => {
    try {
      // Call the save API
      console.log('Saving businesses:', businessIds);

      const selectedBusinesses = dashboardBusinesses.filter(b => businessIds.includes(b.id));

      // Save each business
      for (const business of selectedBusinesses) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/saved-businesses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ business })
        });
      }

      alert(`Successfully saved ${selectedBusinesses.length} businesses!`);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save businesses');
    }
  };

  // Load initial data on component mount
  useEffect(() => {
    // Start with mock data for demo purposes
    setUseMockData(true);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardNav />
      <Dashboard
        businesses={dashboardBusinesses}
        stats={dashboardStats}
        onSearch={handleSearch}
        onSave={handleSave}
        loading={loading}
      />
    </>
  );
}