'use client';

/**
 * Interactive map view using React Leaflet
 * Displays beach locations with water quality status markers
 * Features: Search & Fly To, Color-coded markers, Interactive popups
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NormalizedWaterQualityData, WaterQualityRating } from '@/lib/types';

import MapSearchBar from './MapSearchBar';
import EnhancedPopup from './EnhancedPopup';

const markerIconCache = new Map<string, L.DivIcon>();

interface MapViewProps {
  locations: NormalizedWaterQualityData[];
  selectedLocation?: string;
  onLocationSelect?: (locationId: string) => void;
  onViewDetails?: (locationId: string) => void;
  mode?: 'default' | 'fullscreen';
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
  const markerSize = 30;
  const innerDotSize = 12;
  const borderSize = 3;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${markerSize}px;
        height: ${markerSize}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: ${borderSize}px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          position: absolute;
          width: ${innerDotSize}px;
          height: ${innerDotSize}px;
          background: white;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        "></div>
      </div>
    `,
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize],
    popupAnchor: [0, -markerSize],
  });
};

const getCachedMarkerIcon = (quality?: WaterQualityRating) => {
  const key = `${quality || 'default'}-normal`;
  const existingIcon = markerIconCache.get(key);

  if (existingIcon) {
    return existingIcon;
  }

  const icon = createMarkerIcon(quality);
  markerIconCache.set(key, icon);
  return icon;
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

// Component to handle flying to a specific location with smooth animation
function FlyToLocation({ 
  location, 
  onComplete 
}: { 
  location: NormalizedWaterQualityData | null;
  onComplete?: () => void;
}) {
  const map = useMap();
  const previousLocationRef = useRef<string | null>(null);

  useEffect(() => {
    if (location && location.location.id !== previousLocationRef.current) {
      previousLocationRef.current = location.location.id;
      
      // Fly to location with smooth animation
      map.flyTo(
        [location.location.latitude, location.location.longitude],
        15, // Zoom level for close-up view
        {
          duration: 1.5, // Animation duration in seconds
          easeLinearity: 0.25,
        }
      );

      // Open popup after flying
      setTimeout(() => {
        onComplete?.();
      }, 1600);
    }
  }, [location, map, onComplete]);

  return null;
}

function ZoomControlRight() {
  const map = useMap();

  useEffect(() => {
    const zoomControl = L.control.zoom({ position: 'topright' });
    zoomControl.addTo(map);

    return () => {
      zoomControl.remove();
    };
  }, [map]);

  return null;
}

function FullscreenControl({
  isActive,
  onToggle,
}: {
  isActive: boolean;
  onToggle: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    const FullscreenLeafletControl = L.Control.extend({
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', '', container);

        button.href = '#';
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', isActive ? 'Exit fullscreen' : 'Enter fullscreen');
        button.title = isActive ? 'Exit fullscreen' : 'Enter fullscreen';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';

        button.innerHTML = isActive
          ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 9L4 4M15 9l5-5M9 15l-5 5M15 15l5 5" stroke-linecap="round" stroke-linejoin="round" /></svg>'
          : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" stroke-linecap="round" stroke-linejoin="round" /></svg>';

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(button, 'click', L.DomEvent.stop);
        L.DomEvent.on(button, 'click', onToggle);

        return container;
      },
    });

    const fullscreenControl = new FullscreenLeafletControl({ position: 'topright' });
    fullscreenControl.addTo(map);

    return () => {
      fullscreenControl.remove();
    };
  }, [isActive, map, onToggle]);

  return null;
}

function MapInstanceBridge({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  return null;
}

export default function MapView({ locations, onLocationSelect, onViewDetails, mode = 'default' }: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [flyToLocation, setFlyToLocation] = useState<NormalizedWaterQualityData | null>(null);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const fullscreenTargetRef = useRef<HTMLElement | null>(null);

  // Prevent SSR issues with Leaflet - mount detection for client-side only rendering
  useEffect(() => {
    if (!isMounted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMounted(true);
    }
  }, [isMounted]);

  // Handle search selection - fly to location
  const handleSearchSelect = (location: NormalizedWaterQualityData) => {
    setFlyToLocation(location);
  };

  const handleFullscreenToggle = useCallback(async () => {
    try {
      const fullscreenTarget =
        fullscreenTargetRef.current ||
        mapContainerRef.current?.closest('[data-monitoring-shell]') ||
        mapContainerRef.current;

      if (!document.fullscreenElement) {
        await fullscreenTarget?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  }, []);

  useEffect(() => {
    fullscreenTargetRef.current =
      (mapContainerRef.current?.closest('[data-monitoring-shell]') as HTMLElement | null) ||
      mapContainerRef.current;

    const shellFrame =
      fullscreenTargetRef.current?.querySelector('[data-monitoring-shell-frame]') as HTMLElement | null;
    const mapFrame =
      fullscreenTargetRef.current?.querySelector('[data-monitoring-map-frame]') as HTMLElement | null;

    const resetFullscreenStyles = () => {
      if (fullscreenTargetRef.current) {
        fullscreenTargetRef.current.style.height = '';
        fullscreenTargetRef.current.style.width = '';
        fullscreenTargetRef.current.style.maxWidth = '';
        fullscreenTargetRef.current.style.margin = '';
        fullscreenTargetRef.current.style.padding = '';
        fullscreenTargetRef.current.style.background = '';
        fullscreenTargetRef.current.style.overflow = '';
      }
      if (shellFrame) {
        shellFrame.style.height = '';
        shellFrame.style.width = '';
        shellFrame.style.padding = '';
        shellFrame.style.borderRadius = '';
        shellFrame.style.border = '';
        shellFrame.style.boxShadow = '';
      }
      if (mapFrame) {
        mapFrame.style.height = '';
        mapFrame.style.width = '';
        mapFrame.style.borderRadius = '';
        mapFrame.style.border = '';
      }
      if (mapContainerRef.current) {
        mapContainerRef.current.style.height = '';
        mapContainerRef.current.style.borderRadius = '';
        mapContainerRef.current.style.border = '';
      }
    };

    const handleFullscreenChange = () => {
      const isActive = document.fullscreenElement === fullscreenTargetRef.current;
      setIsBrowserFullscreen(isActive);

      if (isActive) {
        if (fullscreenTargetRef.current) {
          fullscreenTargetRef.current.style.height = '100vh';
          fullscreenTargetRef.current.style.width = '100vw';
          fullscreenTargetRef.current.style.maxWidth = '100vw';
          fullscreenTargetRef.current.style.margin = '0';
          fullscreenTargetRef.current.style.padding = '0';
          fullscreenTargetRef.current.style.background = '#ffffff';
          fullscreenTargetRef.current.style.overflow = 'hidden';
        }
        if (shellFrame) {
          shellFrame.style.height = '100%';
          shellFrame.style.width = '100%';
          shellFrame.style.padding = '0';
          shellFrame.style.borderRadius = '0';
          shellFrame.style.border = '0';
          shellFrame.style.boxShadow = 'none';
        }
        if (mapFrame) {
          mapFrame.style.height = '100%';
          mapFrame.style.width = '100%';
          mapFrame.style.borderRadius = '0';
          mapFrame.style.border = '0';
        }
        if (mapContainerRef.current) {
          mapContainerRef.current.style.height = '100%';
          mapContainerRef.current.style.borderRadius = '0';
          mapContainerRef.current.style.border = '0';
        }
      } else {
        resetFullscreenStyles();
      }

      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 120);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      resetFullscreenStyles();
    };
  }, []);

  // After fly animation completes, open the popup
  const handleFlyComplete = () => {
    if (flyToLocation) {
      const marker = markersRef.current.get(flyToLocation.location.id);
      if (marker) {
        marker.openPopup();

        setTimeout(() => {
          const map = mapRef.current;
          const popupElement = marker.getPopup()?.getElement();

          if (!map || !popupElement) {
            return;
          }

          const mapRect = map.getContainer().getBoundingClientRect();
          const popupRect = popupElement.getBoundingClientRect();

          const popupCenterX = popupRect.left + popupRect.width / 2;
          const popupCenterY = popupRect.top + popupRect.height / 2;

          const mapCenterX = mapRect.left + mapRect.width / 2;
          const mapCenterY = mapRect.top + mapRect.height / 2;

          const deltaX = popupCenterX - mapCenterX;
          const deltaY = popupCenterY - mapCenterY;

          if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
            map.panBy([deltaX, deltaY], {
              animate: true,
              duration: 0.45,
            });
          }
        }, 90);
      }
      onLocationSelect?.(flyToLocation.location.id);
    }
  };

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
  const isFullscreen = mode === 'fullscreen';

  return (
    <div className={isFullscreen ? 'relative h-full' : 'space-y-4'}>
      {isFullscreen ? (
        <div className="pointer-events-none absolute left-1/2 top-3 z-40 w-[min(720px,calc(100%-1.5rem))] -translate-x-1/2 lg:top-4">
          <div className="pointer-events-auto">
            <MapSearchBar
              locations={locations}
              onLocationSelect={handleSearchSelect}
              placeholder="Search for a specific location"
            />
          </div>
        </div>
      ) : (
        <div className="relative z-10">
          <MapSearchBar
            locations={locations}
            onLocationSelect={handleSearchSelect}
            placeholder="Search & fly to location..."
          />
        </div>
      )}

      <div
        ref={mapContainerRef}
        className={`relative overflow-hidden ${
          isFullscreen ? 'h-full' : 'rounded-lg border border-gray-200 shadow-sm'
        } ${isBrowserFullscreen ? 'bg-white' : ''}`}
        style={{ isolation: 'isolate' }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          minZoom={2}
          maxZoom={18}
          worldCopyJump={false}
          zoomControl={false}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          className={isFullscreen ? 'h-full min-h-150' : 'h-150'}
          scrollWheelZoom={true}
        >
          <MapInstanceBridge onMapReady={(map) => {
            mapRef.current = map;
          }} />

          <ZoomControlRight />
          <FullscreenControl isActive={isBrowserFullscreen} onToggle={handleFullscreenToggle} />

          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          
          <MapController locations={locations} />
          <FlyToLocation location={flyToLocation} onComplete={handleFlyComplete} />

          {locations.map((data) => (
            <Marker
              key={data.location.id}
              position={[data.location.latitude, data.location.longitude]}
              icon={getCachedMarkerIcon(data.latestReading.qualityRating)}
              ref={(ref) => {
                if (ref) {
                  markersRef.current.set(data.location.id, ref);
                }
              }}
              eventHandlers={{
                click: () => onLocationSelect?.(data.location.id),
              }}
            >
              <Popup maxWidth={280} minWidth={250}>
                <EnhancedPopup 
                  data={data} 
                  onViewDetails={onViewDetails}
                />
              </Popup>
            </Marker>
          ))}
        </MapContainer>

      {/* No locations overlay */}
      {locations.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/90">
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
    </div>
  );
}
