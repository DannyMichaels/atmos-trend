'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Globe from 'react-globe.gl';
import countriesJson from '@/data/globe-countries.json';
import polygonsJson from '@/data/globe-polygons.json';

const ATMOSPHERE_COLOR = '#f961e4';
const EARTH_TEXTURE =
  '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const BUMP_TEXTURE = '//unpkg.com/three-globe/example/img/earth-topology.png';

export const filteredCountries = countriesJson.filter((item) =>
  (polygonsJson as any).features.some(
    (f: any) => f.properties['ADM0_A3'] === item['Alpha-3 code']
  )
);

export type CountrySelectPayload = {
  name: string;
  alpha2Code: string;
  lat: number;
  lng: number;
};

type WeatherGlobeProps = {
  onCountrySelect?: (country: CountrySelectPayload) => void;
  selectedAlpha2?: string | null;
  showSearch?: boolean;
  showBadge?: boolean;
  initialLat?: number;
  initialLng?: number;
  initialAltitude?: number;
  maxSize?: number;
};

function WeatherGlobe({
  onCountrySelect,
  selectedAlpha2,
  showSearch = true,
  showBadge = true,
  initialLat,
  initialLng,
  initialAltitude = 1.8,
  maxSize = 600,
}: WeatherGlobeProps) {
  const globeRef = useRef<any>(null);
  const [focusedCountry, setFocusedCountry] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [dimensions, setDimensions] = useState({
    width: maxSize,
    height: maxSize,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive sizing
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const size = Math.min(w, maxSize);
        setDimensions({ width: size, height: size });
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [maxSize]);

  // Initial setup
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    if (initialLat != null && initialLng != null) {
      globeRef.current.pointOfView(
        { lat: initialLat, lng: initialLng, altitude: initialAltitude },
        0
      );
    }
  }, [initialLat, initialLng, initialAltitude]);

  // Zoom to country when selectedAlpha2 changes externally
  useEffect(() => {
    if (!selectedAlpha2 || !globeRef.current) return;
    const match = countriesJson.find(
      (c) => c['Alpha-2 code'].toUpperCase() === selectedAlpha2.toUpperCase()
    );
    if (!match) return;

    globeRef.current.controls().autoRotate = false;
    globeRef.current.pointOfView(
      {
        lat: match['Latitude (average)'],
        lng: match['Longitude (average)'],
        altitude: 0.9,
      },
      600
    );
  }, [selectedAlpha2]);

  // Build polygon data
  const polygonsData = useMemo(() => {
    return (polygonsJson as any).features.map((feature: any) => {
      const match = countriesJson.find(
        (c) => c['Alpha-3 code'] === feature.properties['ADM0_A3']
      );
      return {
        ...feature,
        country: match?.Country ?? feature.properties.ADMIN,
        alpha2Code: match?.['Alpha-2 code'] ?? '',
        lat: match?.['Latitude (average)'] ?? 0,
        lng: match?.['Longitude (average)'] ?? 0,
      };
    });
  }, []);

  // Search results (only when search is shown)
  const searchResults = useMemo(() => {
    if (!showSearch || !searchValue.trim()) return [];
    return filteredCountries
      .filter((c) => c.Country.toLowerCase().includes(searchValue.toLowerCase()))
      .slice(0, 8);
  }, [searchValue, showSearch]);

  // Find closest country from initial coords
  const initialCountry = useMemo(() => {
    if (initialLat == null || initialLng == null) return null;
    let closest: (typeof filteredCountries)[number] | null = null;
    let minDist = Infinity;
    for (const c of filteredCountries) {
      const dLat = c['Latitude (average)'] - initialLat;
      const dLng = c['Longitude (average)'] - initialLng;
      const dist = dLat * dLat + dLng * dLng;
      if (dist < minDist) {
        minDist = dist;
        closest = c;
      }
    }
    return closest?.Country ?? null;
  }, [initialLat, initialLng]);

  const selectAndZoom = useCallback(
    (name: string, alpha2Code: string, lat: number, lng: number) => {
      setFocusedCountry(name);
      if (globeRef.current) {
        globeRef.current.controls().autoRotate = false;
        globeRef.current.pointOfView({ lat, lng, altitude: 0.9 }, 600);
      }
      onCountrySelect?.({ name, alpha2Code, lat, lng });
    },
    [onCountrySelect]
  );

  const handlePolygonClick = useCallback(
    (d: any) => {
      const name = d.country || d.properties?.ADMIN;
      if (!name) return;
      selectAndZoom(name, d.alpha2Code, d.lat, d.lng);
    },
    [selectAndZoom]
  );

  const handleSearchSelect = useCallback(
    (country: (typeof filteredCountries)[number]) => {
      setSearchValue('');
      selectAndZoom(
        country.Country,
        country['Alpha-2 code'],
        country['Latitude (average)'],
        country['Longitude (average)']
      );
    },
    [selectAndZoom]
  );

  // Active country: explicit prop > user click > initial coords
  const activeCountry = selectedAlpha2
    ? polygonsData.find(
        (p: any) =>
          p.alpha2Code?.toUpperCase() === selectedAlpha2.toUpperCase()
      )?.country ?? focusedCountry
    : focusedCountry ?? initialCountry;

  // Memoized globe callbacks
  const polygonAltitude = useCallback(
    (d: any) =>
      activeCountry && d.country?.toLowerCase() === activeCountry.toLowerCase()
        ? 0.04
        : 0.005,
    [activeCountry]
  );

  const polygonCapColor = useCallback(
    (d: any) =>
      activeCountry && d.country?.toLowerCase() === activeCountry.toLowerCase()
        ? 'rgba(249, 97, 228, 0.35)'
        : 'rgba(0,0,0,0)',
    [activeCountry]
  );

  const polygonSideColor = useCallback(
    () => 'rgba(255, 255, 255, 0.08)',
    []
  );

  const polygonStrokeColor = useCallback(
    (d: any) => {
      if (!activeCountry) return 'rgba(255, 255, 255, 0.35)';
      return d.country?.toLowerCase() === activeCountry.toLowerCase()
        ? 'rgba(249, 97, 228, 0.9)'
        : 'rgba(255, 255, 255, 0.15)';
    },
    [activeCountry]
  );

  const polygonLabel = useCallback(
    (d: any) => `
      <div style="text-align:center;color:#fff;background:rgba(0,0,0,0.4);padding:8px 12px;backdrop-filter:blur(8px);border-radius:12px;">
        <b>${d.country}</b>
      </div>`,
    []
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full flex justify-center items-center"
    >
      {showSearch && (
        <div className="absolute top-3 right-3 z-10 w-52">
          <input
            type="text"
            placeholder="Search country..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/30 backdrop-blur-md
                       border border-white/20 text-white text-sm
                       placeholder-white/50 outline-none focus:border-[#f961e4]
                       transition-colors"
          />
          {searchResults.length > 0 && (
            <ul className="mt-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 overflow-hidden max-h-60 overflow-y-auto">
              {searchResults.map((c, i) => (
                <li
                  key={`${c['Alpha-2 code']}-${i}`}
                  onClick={() => handleSearchSelect(c)}
                  className="px-3 py-2 text-sm text-white cursor-pointer
                             hover:bg-white/10 transition-colors"
                >
                  {c.Country}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showBadge && activeCountry && (
        <div className="absolute top-3 left-3 z-10 animate-fadeIn">
          <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 text-white">
            <span className="text-sm font-semibold">{activeCountry}</span>
          </div>
        </div>
      )}

      <Globe
        ref={globeRef}
        height={dimensions.height}
        width={dimensions.width}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={EARTH_TEXTURE}
        bumpImageUrl={BUMP_TEXTURE}
        atmosphereColor={ATMOSPHERE_COLOR}
        polygonsData={polygonsData}
        polygonAltitude={polygonAltitude}
        polygonCapColor={polygonCapColor}
        polygonSideColor={polygonSideColor}
        polygonStrokeColor={polygonStrokeColor}
        polygonLabel={polygonLabel}
        onPolygonClick={handlePolygonClick}
      />
    </div>
  );
}

export default React.memo(WeatherGlobe);
