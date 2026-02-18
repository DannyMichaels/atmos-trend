'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Country, City, State } from 'country-state-city';
import Select from 'react-select';
import { Button } from '@tremor/react';
import { GlobeIcon } from '@heroicons/react/solid';
import GlobeDynamic from './GlobeDynamic';
import { filteredCountries } from './WeatherGlobe';
import type { IState, ICity } from 'country-state-city';
import type { CountryOption, CityOption, StateOption } from '@/types/city-picker';

type Props = {
  lat: string;
  long: string;
};

export default function DashboardPicker({ lat, long }: Props) {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(null);
  const [selectedState, setSelectedState] = useState<StateOption>(null);
  const [selectedCity, setSelectedCity] = useState<CityOption>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const countryCode = selectedCountry?.value.isoCode || '';
  const stateCode = selectedState?.value.isoCode || '';

  const searchResults = useMemo(() => {
    if (selectedCountry || !searchValue.trim()) return [];
    return filteredCountries
      .filter((c) => c.Country.toLowerCase().includes(searchValue.toLowerCase()))
      .slice(0, 8);
  }, [searchValue, selectedCountry]);

  const stateOptions = useMemo(
    () =>
      State.getStatesOfCountry(countryCode).map((state: IState) => ({
        value: {
          latitude: state.latitude!,
          longitude: state.longitude!,
          countryCode: state.countryCode,
          name: state.name,
          isoCode: state.isoCode,
        },
        label: state.name,
      })),
    [countryCode]
  );

  const cityOptions = useMemo(
    () =>
      City.getCitiesOfState(countryCode, stateCode).map((city: ICity) => ({
        value: {
          latitude: city.latitude!,
          longitude: city.longitude!,
          countryCode: city.countryCode,
          name: city.name,
          stateCode: city.stateCode,
        },
        label: city.name,
      })),
    [countryCode, stateCode]
  );

  const selectCountryByIso = (isoCode: string) => {
    const match = Country.getAllCountries().find(
      (c) => c.isoCode === isoCode.toUpperCase()
    );
    if (!match) return;

    setSelectedCountry({
      value: {
        latitude: match.latitude,
        longitude: match.longitude,
        isoCode: match.isoCode,
      },
      label: match.name,
    });
    setSelectedState(null);
    setSelectedCity(null);
  };

  const handleSearchSelect = (country: (typeof filteredCountries)[number]) => {
    selectCountryByIso(country['Alpha-2 code']);
  };

  const handleGlobeCountrySelect = (payload: {
    name: string;
    alpha2Code: string;
  }) => {
    selectCountryByIso(payload.alpha2Code);
  };

  // Keep input in sync with selected country
  const displayValue = selectedCountry ? selectedCountry.label : searchValue;

  const goToWeatherPage = () => {
    if (!selectedCountry?.value) return;
    const option = selectedCity?.value || selectedState?.value;
    if (!option?.name) return;
    setIsLoading(true);
    router.push(
      `/location/${option.name}/${option.latitude}/${option.longitude}`
    );
  };

  return (
    <div className="space-y-4">
      {/* Globe — no overlays, zoomed out 40% more */}
      <div className="rounded-xl overflow-hidden mx-auto" style={{ maxHeight: 220 }}>
        <GlobeDynamic
          showSearch={false}
          showBadge={false}
          initialLat={Number(lat)}
          initialLng={Number(long)}
          initialAltitude={2.5}
          maxSize={260}
          selectedAlpha2={selectedCountry?.value.isoCode ?? null}
          onCountrySelect={handleGlobeCountrySelect}
        />
      </div>

      {/* Country search input */}
      <div className="space-y-2 relative">
        <div className="flex items-center space-x-2 text-white/80">
          <GlobeIcon className="h-5 w-5 text-white" />
          <label>Country</label>
        </div>
        <input
          type="text"
          placeholder="Search country..."
          value={displayValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            if (selectedCountry) {
              setSelectedCountry(null);
              setSelectedState(null);
              setSelectedCity(null);
            }
          }}
          className="w-full px-3 py-2 rounded bg-white text-black text-sm
                     placeholder-gray-400 outline-none"
        />
        {searchResults.length > 0 && (
          <ul className="absolute z-20 left-0 right-0 mt-1 rounded bg-white border border-gray-200 overflow-hidden max-h-48 overflow-y-auto shadow-lg">
            {searchResults.map((c, i) => (
              <li
                key={`${c['Alpha-2 code']}-${i}`}
                onClick={() => handleSearchSelect(c)}
                className="px-3 py-2 text-sm text-black cursor-pointer hover:bg-gray-100"
              >
                {c.Country}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* State + City selects */}
      {selectedCountry?.value && (
        <>
          {stateOptions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-white/80">
                <GlobeIcon className="h-5 w-5 text-white" />
                <label>State</label>
              </div>
              <Select
                name="state"
                value={selectedState}
                onChange={(option) => {
                  setSelectedCity(null);
                  setSelectedState(option);
                }}
                options={stateOptions}
                className="text-black"
              />
            </div>
          )}

          {cityOptions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-white/80">
                <GlobeIcon className="h-5 w-5 text-white" />
                <label>City</label>
              </div>
              <Select
                name="city"
                value={selectedCity}
                onChange={(option) => setSelectedCity(option)}
                options={cityOptions}
                className="text-black"
              />
            </div>
          )}
        </>
      )}

      <Button
        className="w-full text-white bg-gradient-to-br from-[#f961e4] to-[#4063F2]"
        onClick={goToWeatherPage}
        disabled={
          isLoading ||
          (cityOptions.length > 0 ? !selectedCity?.value : !selectedState?.value)
        }>
        {isLoading
          ? 'Loading... hold on!'
          : `Get Weather Report ${selectedCountry?.label ? 'for' : ''} ${
              (selectedCity?.label || selectedState?.label || selectedCountry?.label) ?? ''
            }`}
      </Button>
    </div>
  );
}
