import { Root } from '@/types/weather';

const HOURLY_PARAMS = [
  'temperature_2m',
  'relativehumidity_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'rain',
  'showers',
  'snowfall',
  'snow_depth',
  'windgusts_10m',
  'uv_index',
  'uv_index_clear_sky',
].join(',');

const DAILY_PARAMS = [
  'weathercode',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'sunrise',
  'sunset',
  'uv_index_max',
  'uv_index_clear_sky_max',
].join(',');

export default async function fetchWeather(
  lat: string,
  long: string,
  timezone: string
): Promise<Root> {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: long,
    timezone,
    current_weather: 'true',
    hourly: HOURLY_PARAMS,
    daily: DAILY_PARAMS,
  });

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { next: { revalidate: 1440 } }
  );

  if (!res.ok) {
    throw new Error(`Open-Meteo API error: ${res.status}`);
  }

  return res.json();
}
