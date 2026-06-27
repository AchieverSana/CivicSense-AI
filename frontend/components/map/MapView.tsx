'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { issueApi } from '@/lib/api';

// Fix default Leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SEV_COLORS: Record<string, string> = {
  Critical: '#A32D2D', High: '#BA7517', Medium: '#185FA5', Low: '#3B6D11',
};

function makeIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function Legend() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-xs space-y-1.5">
      <div className="font-medium text-gray-700 mb-1">Severity</div>
      {Object.entries(SEV_COLORS).map(([s, c]) => (
        <div key={s} className="flex items-center gap-2 text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c }} />
          {s}
        </div>
      ))}
    </div>
  );
}

export default function MapView() {
  const [issues, setIssues] = useState<any[]>([]);

  useEffect(() => {
    issueApi.list({ city: 'Jaipur', limit: '200' })
      .then(({ data }) => setIssues(data.issues))
      .catch(() => {});
  }, []);

  // Jaipur center
  const center: [number, number] = [26.9124, 75.7873];

  return (
    <div className="relative rounded-xl overflow-hidden shadow-sm border border-gray-100" style={{ height: 520 }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {issues.map((issue) => {
          const [lng, lat] = issue.location?.coordinates || [75.7873, 26.9124];
          return (
            <Marker
              key={issue._id}
              position={[lat, lng]}
              icon={makeIcon(SEV_COLORS[issue.severity] || '#888')}
            >
              <Popup>
                <div className="text-xs max-w-48">
                  <div className="font-semibold mb-1">{issue.title}</div>
                  <div className="text-gray-500">{issue.category} · {issue.severity}</div>
                  <div className="text-gray-400 mt-1">{issue.location.address}</div>
                  <a href={`/issues/${issue._id}`} className="text-civic-teal mt-1 block hover:underline">View details →</a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <Legend />
    </div>
  );
}
