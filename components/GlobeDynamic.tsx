import dynamic from 'next/dynamic';

const GlobeDynamic = dynamic(() => import('./WeatherGlobe'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] flex items-center justify-center">
      <div className="text-white/60 animate-pulse text-lg">
        Loading Globe...
      </div>
    </div>
  ),
});

export default GlobeDynamic;
