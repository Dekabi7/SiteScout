"use client";

import React, { useEffect, useState } from 'react';
import { Business } from '@/lib/api';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  businesses: Business[];
  center?: [number, number];
  zoom?: number;
}

// Separate component for the actual map to avoid SSR issues
function InteractiveMap({ businesses, center, zoom }: MapProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [MapContainer, setMapContainer] = useState<React.ComponentType<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [TileLayer, setTileLayer] = useState<React.ComponentType<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Marker, setMarker] = useState<React.ComponentType<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Popup, setPopup] = useState<React.ComponentType<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [useMap, setUseMap] = useState<(() => any) | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Only load on client side
    if (typeof window !== 'undefined') {
      const loadMap = async () => {
        try {
          // Import components
          const reactLeaflet = await import('react-leaflet');
          const leaflet = await import('leaflet');

          // Fix Leaflet icon issues
          delete (leaflet.default.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
          leaflet.default.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          });

          setMapContainer(() => reactLeaflet.MapContainer);
          setTileLayer(() => reactLeaflet.TileLayer);
          setMarker(() => reactLeaflet.Marker);
          setPopup(() => reactLeaflet.Popup);
          setUseMap(() => reactLeaflet.useMap);
          setIsLoaded(true);
        } catch (error) {
          console.error('Failed to load map:', error);
        }
      };

      loadMap();
    }
  }, []);

  // Component to handle map view changes
  const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
    if (!useMap) return null;
    const map = useMap();
    map.setView(center, zoom);
    return null;
  };

  if (!isLoaded || !MapContainer || !TileLayer || !Marker || !Popup || !useMap) {
    return (
      <div className="h-96 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin mx-auto h-8 w-8 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500 font-medium">Loading interactive map...</p>
        </div>
      </div>
    );
  }

  // Calculate center from business locations if available
  const businessesWithCoords = businesses.filter(b => b.latitude && b.longitude);
  let mapCenter = center || [39.7392, -104.9903]; // Default to Denver

  // If center is provided, use it; otherwise calculate from businesses
  if (center) {
    mapCenter = center;
  } else if (businessesWithCoords.length > 0) {
    const lats = businessesWithCoords.map(b => b.latitude!);
    const lngs = businessesWithCoords.map(b => b.longitude!);
    mapCenter = [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2
    ];
  }

  return (
    <MapContainer
      center={mapCenter as [number, number]}
      zoom={zoom || 10}
      style={{ height: '100%', width: '100%' }}
    >
      <ChangeView center={mapCenter as [number, number]} zoom={zoom || 10} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {businessesWithCoords.map((business) => (
        <Marker
          key={business.google_place_id}
          position={[business.latitude!, business.longitude!]}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-gray-900">{business.name}</h3>
              <p className="text-sm text-gray-600">{business.category}</p>
              <p className="text-sm text-gray-500">{business.address}</p>
              {business.phone && (
                <p className="text-sm text-gray-500">{business.phone}</p>
              )}
              <div className="mt-2">
                {business.has_website ? (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Has Website
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    No Website
                  </span>
                )}
              </div>
              {business.rating && (
                <div className="mt-1 flex items-center">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-3 h-3 ${star <= Math.round(business.rating!) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-gray-600 ml-1">({business.rating})</span>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default function Map({ businesses, center, zoom }: MapProps) {
  if (businesses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Map View</h3>
          <p className="text-sm text-gray-600">Business locations will appear here after search</p>
        </div>
        <div className="h-96 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-500 font-medium">No businesses to display</p>
            <p className="text-sm text-gray-400 mt-1">Search for businesses to see them on the map</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate center from business locations if available
  const businessesWithCoords = businesses.filter(b => b.latitude && b.longitude);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Map View</h3>
        <p className="text-sm text-gray-600">
          Showing {businessesWithCoords.length} business locations
          {businessesWithCoords.length < businesses.length && (
            <span className="text-gray-400"> ({businesses.length - businessesWithCoords.length} without coordinates)</span>
          )}
        </p>
      </div>
      <div className="h-96">
        <InteractiveMap businesses={businesses} center={center} zoom={zoom} />
      </div>
    </div>
  );
}
