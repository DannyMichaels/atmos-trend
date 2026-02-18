// lib
import fetchWeather from '@/lib/fetchWeather';
import { Root } from '@/types/weather';

// components
import InformationPanel from '@/components/InformationPanel';
import TemperatureChart from '@/components/TemperatureChart';
import RainChart from '@/components/RainChart';
import HumidityChart from '@/components/HumidityChart';
import WeatherSummary from '@/components/WeatherSummary';
import WeatherStats from '@/components/WeatherStats';

export const revalidate = 1440; // comes with next.js, every day seconds it will retrigger a rebuild of the cache (provided that the page is visited)

type Props = {
  params: {
    city: string;
    lat: string;
    long: string;
  };
};

// can do async in server component
async function WeatherPage({ params: { city, lat, long } }: Props) {
  const results: Root = await fetchWeather(
    lat,
    long,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  return (
    <div className="flex flex-col min-h-screen lg:flex-row">
      <InformationPanel city={city} long={long} lat={lat} results={results} />

      <div className="flex-1 p-5 lg:p-10">
        <div className="p-5">
          <div className="pb-5">
            <h2 className="text-xl font-bold text-white">Todays Overview</h2>
            <p className="text-sm text-white-400 text-white">
              Last Updated at:{' '}
              {new Date(results.current_weather.time).toLocaleString()} (
              {results.timezone})
            </p>
          </div>

          <div className="m-2 mb-10">
            <WeatherSummary city={city} results={results} />
          </div>

          <WeatherStats results={results} />
        </div>

        <hr className="mb-5" />

        <div className="space-y-3">
          <TemperatureChart results={results} />
          <RainChart results={results} />
          <HumidityChart results={results} />
        </div>
      </div>
    </div>
  );
}

export default WeatherPage;
