'use client';
import { useMemo, useState } from 'react';
import { Card, Divider, Subtitle, Text, Button } from '@tremor/react';
import GlobeDynamic from '@/components/GlobeDynamic';
import Select from 'react-select';
import { Country, City, State } from 'country-state-city';
import { GlobeIcon } from '@heroicons/react/solid';
import { useRouter } from 'next/navigation';
import getBasePath from '@/lib/getBasePath';
import { CountryOption, CityOption, StateOption } from '@/types/city-picker';
import type { IState, ICity } from 'country-state-city';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(null);
  const [selectedState, setSelectedState] = useState<StateOption>(null);
  const [selectedCity, setSelectedCity] = useState<CityOption>(null);

  const router = useRouter();

  // Derived values
  const countryCode = selectedCountry?.value.isoCode || '';
  const stateCode = selectedState?.value.isoCode || '';

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

  // Globe → country-state-city bridge
  const handleGlobeCountrySelect = (payload: {
    name: string;
    alpha2Code: string;
    lat: number;
    lng: number;
  }) => {
    const allCountries = Country.getAllCountries();
    const match = allCountries.find(
      (c) => c.isoCode === payload.alpha2Code.toUpperCase()
    );

    if (match) {
      setSelectedCountry({
        value: {
          latitude: match.latitude,
          longitude: match.longitude,
          isoCode: match.isoCode,
        },
        label: match.name,
      });
    } else {
      // Fallback: use globe coordinates directly
      setSelectedCountry({
        value: {
          latitude: String(payload.lat),
          longitude: String(payload.lng),
          isoCode: payload.alpha2Code.toUpperCase(),
        },
        label: payload.name,
      });
    }

    setSelectedState(null);
    setSelectedCity(null);
  };

  const handleStateChange = (option: StateOption) => {
    setSelectedCity(null);
    setSelectedState(option);
  };

  const handleCityChange = (option: CityOption) => {
    setSelectedCity(option);
  };

  const goToWeatherPage = () => {
    if (!selectedCountry?.value) return;
    const option = selectedCity?.value || selectedState?.value;
    if (!option?.name) return;
    setIsLoading(true);
    router.push(
      `/location/${option.name}/${option.latitude}/${option.longitude}`
    );
  };

  const onMyLocationClick = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setIsLoading(true);
        const { city } = await fetch(
          `${getBasePath()}/api/reverseGeoCode?lat=${latitude}&long=${longitude}`
        ).then((r) => r.json());

        router.push(`/location/${city}/${latitude}/${longitude}`);
        setIsLoading(false);
      });
    } else {
      alert('Your browser does not support Geolocation!');
    }
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] p-10 flex flex-col justify-center items-center">
      <Card className="max-w-4xl mx-auto">
        <Text className="text-4xl md:text-6xl font-bold text-center mb-10 text-white">
          AtmosTrend
        </Text>
        <Subtitle className="text-xl text-center text-white">
          Powered by OpenAI, Next.js 13.4, Tailwind CSS, Tremor 2.0 & More!
        </Subtitle>

        <Divider className="my-10" />

        <Card className="bg-[#2a2a2a] p-6 md:p-10 animate-fadeIn">
          <div className="space-y-4">
            {/* Globe replaces country select */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-white/80">
                <GlobeIcon className="h-5 w-5 text-white" />
                <label>Country</label>
                {selectedCountry && (
                  <span className="ml-auto text-sm font-semibold text-white">
                    {selectedCountry.label}
                  </span>
                )}
              </div>

              <div className="animate-fadeIn rounded-xl overflow-hidden">
                <GlobeDynamic
                  onCountrySelect={handleGlobeCountrySelect}
                  selectedAlpha2={selectedCountry?.value.isoCode ?? null}
                />
              </div>
            </div>

            {/* State + City selects */}
            {selectedCountry?.value && (
              <>
                {stateOptions.length > 0 && (
                  <div className="space-y-2" id="state-select">
                    <div className="flex items-center space-x-2 text-white/80">
                      <GlobeIcon className="h-5 w-5 text-white" />
                      <label>State</label>
                    </div>
                    <Select
                      name="state"
                      value={selectedState}
                      onChange={handleStateChange}
                      options={stateOptions}
                      className="text-black"
                    />
                  </div>
                )}

                {cityOptions.length > 0 && (
                  <div className="space-y-2" id="city-select">
                    <div className="flex items-center space-x-2 text-white/80">
                      <GlobeIcon className="h-5 w-5 text-white" />
                      <label>City</label>
                    </div>
                    <Select
                      name="city"
                      value={selectedCity}
                      onChange={handleCityChange}
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
                (cityOptions.length > 0
                  ? !selectedCity?.value
                  : !selectedState?.value)
              }>
              {isLoading
                ? 'Loading... hold on!'
                : `Get Weather Report ${selectedCountry?.label ? 'for' : ''} ${
                    (
                      selectedCity?.label ||
                      selectedState?.label ||
                      selectedCountry?.label
                    ) ?? ''
                  }`}
            </Button>
          </div>
        </Card>

        <Text className="text-4xl font-bold text-center mb-4 mt-4 text-white">
          OR
        </Text>

        <Button
          className="w-full text-white bg-gradient-to-br from-[#f961e4] to-[#4063F2]"
          onClick={onMyLocationClick}
          disabled={isLoading}>
          {!isLoading
            ? `Get My Current Location's Weather`
            : `Loading... hold on!`}
        </Button>
      </Card>
    </div>
  );
}
