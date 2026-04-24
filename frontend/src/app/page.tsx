"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useBusinessSearch } from "@/hooks/useBusinessSearch";
import { Business } from "@/lib/api";

import Map from "@/components/Map";
import CountryFilter from "@/components/CountryFilter";
import AutocompleteInput from "@/components/AutocompleteInput";
import BulkActions from "@/components/BulkActions";

// Business categories based on PRD requirements
const categories = [
  "Restaurants",
  "Salons",
  "Gyms",
  "Retail",
  "Medical",
  "Dentists",
  "Lawyers",
  "Plumbers",
  "Electricians",
  "Landscaping",
  "Auto Repair",
  "Real Estate",
  "Construction",
  "Cleaning Services",
  "Pet Services"
];

function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-gray-900">SiteScout</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">Dashboard</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">Login</Link>
            <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16">
      <div className="max-w-5xl mx-auto text-center px-6">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Find Businesses Without Websites
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          Automatically discover local businesses that need a website. Export leads in minutes, not hours.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center text-sm text-gray-600 bg-white/50 rounded-lg p-4">
            <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">95% accuracy rate</span>
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600 bg-white/50 rounded-lg p-4">
            <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Export in under 5 minutes</span>
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600 bg-white/50 rounded-lg p-4">
            <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">AI-generated outreach copy</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchSection({
  onSearch,
  selectedCountry,
  onCountryChange
}: {
  onSearch: (location: string, categories: string[]) => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
}) {
  const [location, setLocation] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Restaurants", "Salons", "Gyms"]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;

    setIsLoading(true);
    await onSearch(location, selectedCategories);
    setIsLoading(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 py-12">
      <div className="max-w-5xl mx-auto px-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Location Input with Country Filter */}
          <div className="max-w-2xl mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Location
            </label>
            <div className="flex gap-3">
              {/* Country Filter */}
              <div className="flex-shrink-0">
                <CountryFilter
                  selectedCountry={selectedCountry}
                  onCountryChange={onCountryChange}
                />
              </div>
              {/* Location Search */}
              <div className="flex-1">
                <AutocompleteInput
                  value={location}
                  onChange={setLocation}
                  placeholder="Enter city, state, or zip code (e.g., Denver, CO)"
                  country={selectedCountry}
                />
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              Business Categories
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`px-4 py-3 text-sm font-medium rounded-lg border transition-colors ${selectedCategories.includes(cat)
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm"
                    }`}
                  onClick={() => {
                    setSelectedCategories(prev =>
                      prev.includes(cat)
                        ? prev.filter(c => c !== cat)
                        : [...prev, cat]
                    );
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={isLoading || !location.trim()}
              className="bg-blue-600 text-white px-12 py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Find Businesses</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeadTable({
  leads,
  selected,
  onSelect,
  onSelectAll,
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
}: {
  leads: Business[];
  selected: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  sortDir: "asc" | "desc";
  setSortDir: (d: "asc" | "desc") => void;
}) {
  const headers = [
    { key: "name", label: "Business Name" },
    { key: "category", label: "Category" },
    { key: "address", label: "Address" },
    { key: "phone", label: "Phone" },
    { key: "website", label: "Website Status" },
    { key: "rating", label: "Rating" },
    { key: "reviews_count", label: "Reviews" },
    { key: "last_updated", label: "Last Updated" },
  ];

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selected.size === leads.length && leads.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              {headers.map(header => (
                <th
                  key={header.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort(header.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{header.label}</span>
                    {sortBy === header.key && (
                      <svg className={`w-4 h-4 ${sortDir === "asc" ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr key={lead.google_place_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selected.has(lead.google_place_id)}
                    onChange={() => onSelect(lead.google_place_id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {lead.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {lead.address}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {lead.phone || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {lead.has_website ? (
                    <div className="flex flex-col space-y-1">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Has Website
                      </span>
                      {lead.is_outdated && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Outdated
                        </span>
                      )}
                      {lead.website_age && (
                        <span className="text-xs text-gray-500">{lead.website_age}</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        No Website
                      </span>
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        title="Why flagged? This business has no website detected through our multi-layer verification process including DNS checks, HTTP requests, and SERP analysis."
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {lead.rating ? (
                    <div className="flex items-center space-x-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${star <= Math.round(lead.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-900">({lead.rating})</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {lead.reviews_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {lead.last_updated || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}





function sortLeads(leads: Business[], sortBy: string, sortDir: "asc" | "desc") {
  return [...leads].sort((a, b) => {
    if (sortBy === "rating" || sortBy === "reviews_count") {
      const aVal = Number(a[sortBy as keyof Business] || 0);
      const bVal = Number(b[sortBy as keyof Business] || 0);
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
    const stringFields = ["name", "category", "address", "phone", "website", "last_updated"] as const;
    if ((stringFields as readonly string[]).includes(sortBy)) {
      const aVal = String(a[sortBy as keyof Business] ?? "").toLowerCase();
      const bVal = String(b[sortBy as keyof Business] ?? "").toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    }
    return 0;
  });
}

export default function Home() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);

  const { businesses, loading, error, searchBusinesses, clearError } = useBusinessSearch();

  const handleSearch = async (location: string, categories: string[]) => {
    setSelected(new Set());
    setSearchLocation(location);

    const result = await searchBusinesses({
      location,
      categories: categories.length > 0 ? categories : undefined,
      radius: 10 * 1609.34, // 10 miles in meters
      minRating: 3.0
    });

    // Set map center based on search location coordinates
    if (result?.search_location?.coordinates) {
      setMapCenter([
        result.search_location.coordinates.lat,
        result.search_location.coordinates.lng
      ]);
    }
  };

  const handleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(businesses.map(b => b.google_place_id)));
    } else {
      setSelected(new Set());
    }
  };

  // Filter leads to only show businesses without websites and deduplicate by google_place_id
  const filteredLeads = businesses.filter(lead => !lead.has_website);
  const mapEntries: [string, Business][] = filteredLeads.map(item => [item.google_place_id, item]);
  const uniqueLeads = Array.from(new globalThis.Map(mapEntries).values());
  const sortedLeads = sortLeads(uniqueLeads, sortBy, sortDir);

  const handleSave = async (businessIds: string[]) => {
    if (businessIds.length === 0) return;

    try {
      // Find the full business objects for the selected IDs
      const selectedBusinesses = businesses.filter(b => businessIds.includes(b.google_place_id));

      let savedCount = 0;
      for (const business of selectedBusinesses) {
        const res = await fetch('http://localhost:3001/api/saved-businesses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business: {
              id: business.google_place_id,
              name: business.name,
              category: business.category,
              address: business.address,
              phone: business.phone,
              rating: business.rating,
              reviews_count: business.reviews_count,
              website_url: business.website_url
            }
          })
        });
        if (res.ok) savedCount++;
      }

      alert(`Successfully saved ${savedCount} businesses!`);
      setSelected(new Set()); // Clear selection
    } catch (e) {
      console.error(e);
      alert('Failed to save businesses');
    }
  };

  const handleGenerateCopy = () => {
    if (selected.size === 0) return;
    alert('AI Copy Generation feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <HeroSection />
      <SearchSection
        onSearch={handleSearch}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
      />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150 cursor-not-allowed">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching for businesses without websites...
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={clearError}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && businesses.length > 0 && (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Businesses Without Websites
              </h2>
              <p className="text-lg text-gray-600">
                Found {filteredLeads.length} businesses in {searchLocation} that need a website
              </p>
            </div>

            <Map businesses={businesses} center={mapCenter} zoom={12} />

            <BulkActions
              selectedCount={selected.size}
              totalCount={filteredLeads.length}
              onSave={() => handleSave(Array.from(selected))}
              onGenerateCopy={handleGenerateCopy}
            />

            <LeadTable
              leads={sortedLeads}
              selected={selected}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortDir={sortDir}
              setSortDir={setSortDir}
            />
          </>
        )}

        {!loading && !error && businesses.length === 0 && searchLocation && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No businesses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No businesses without websites found in {searchLocation}
            </p>
          </div>
        )}

        {!loading && !error && businesses.length === 0 && !searchLocation && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ready to search</h3>
            <p className="mt-1 text-sm text-gray-500">
              Enter a location above to find businesses without websites
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
