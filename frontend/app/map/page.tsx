'use client';
import dynamic from 'next/dynamic';

// Leaflet must be loaded client-side only (no SSR)
const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false, loading: () => (
  <div className="h-[500px] rounded-xl bg-gray-100 flex items-center justify-center">
    <p className="text-gray-400 text-sm">Loading map…</p>
  </div>
)});

export default function MapPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Issue Map — Jaipur</h1>
      <MapView />
    </div>
  );
}
