'use client';

/**
 * Interactive map view using React Leaflet
 * Displays beach locations with water quality status markers
 */

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NormalizedWaterQualityData, WaterQualityRating } from '@/lib/types';
import { getQualityColor, getQualityLabel, formatDate } from '@/lib/utils/dataHelpers';

interface MapViewProps {
  locations: NormalizedWaterQualityData[];
  selectedLocation?: string;
  onLocationSelect?: (locationId: string) => void;
}

// Custom marker icons based on water quality
const createMarkerIcon = (quality?: WaterQualityRating) => {
  const colors = {
    excellent: '#10b981', // green (legacy)
    good: '#3b82f6',      // blue
    fair: '#eab308',      // yellow
    poor: '#ef4444',      // red
    bad: '#991b1b',       // red-800
    very_poor: '#dc2626', // dark red (legacy)
    unknown: '#6b7280',   // gray
    default: '#6b7280'    // gray
  };

  const color = quality ? colors[quality] || colors.default : colors.default;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          position: absolute;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

// Component to handle map centering - only on initial load or when locations count changes significantly
function MapController({ locations }: { locations: NormalizedWaterQualityData[] }) {
  const map = useMap();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Only fit bounds on first load or when transitioning from no data to data
    if (locations.length > 0 && !hasInitializedRef.current) {
      const bounds = L.latLngBounds(
        locations.map(loc => [loc.location.latitude, loc.location.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
      hasInitializedRef.current = true;
    }
    
    // Reset if all locations are removed (filtered out)
    if (locations.length === 0) {
      hasInitializedRef.current = false;
    }
  }, [locations, map]);

  return null;
}

export default function MapView({ locations, onLocationSelect }: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Prevent SSR issues with Leaflet - mount detection for client-side only rendering
  useEffect(() => {
    if (!isMounted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMounted(true);
    }
  }, [isMounted]);

  if (!isMounted) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 h-150 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  // Default center (Australia)
  const defaultCenter: [number, number] = [-33.8688, 151.2093]; // Sydney
  const defaultZoom = 10;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm" style={{ isolation: 'isolate' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '600px', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController locations={locations} />

        {locations.map((data) => (
          <Marker
            key={data.location.id}
            position={[data.location.latitude, data.location.longitude]}
            icon={createMarkerIcon(data.latestReading.qualityRating)}
            eventHandlers={{
              click: () => onLocationSelect?.(data.location.id),
            }}
          >
            <Popup>
              <div className="p-3 min-w-55">
                <h3 className="font-semibold text-gray-900 mb-1 text-base">{data.location.name}</h3>
                <p className="text-xs text-gray-600 mb-3">
                  {data.location.region}, {data.location.state}
                </p>
                
                <div 
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white mb-3"
                  style={{ backgroundColor: getQualityColor(data.latestReading.qualityRating) }}
                >
                  {getQualityLabel(data.latestReading.qualityRating)}
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Latest Update</span>
                    <span className="text-xs font-medium text-gray-900">
                      {formatDate(data.latestReading.sampleDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Data Source</span>
                    <span className="text-xs font-medium text-gray-900">
                      {data.latestReading.source === 'nsw_beachwatch' ? 'NSW Beachwatch' : data.latestReading.source}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 pointer-events-none">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-gray-500 font-medium mb-1">No locations to display</p>
            <p className="text-sm text-gray-400">Try adjusting your filter selections</p>
          </div>
        </div>
      )}
    </div>
  );
}
