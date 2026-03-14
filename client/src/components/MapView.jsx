import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default marker icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const icons = {
  visit: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41] }),
  eat: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41] }),
  stay: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41] }),
};

export default function MapView({ places = [], restaurants = [], accommodations = [] }) {
  const allPoints = [
    ...places.filter(p => p.lat && p.lng).map(p => ({ ...p, _type: 'visit' })),
    ...restaurants.filter(r => r.lat && r.lng).map(r => ({ ...r, _type: 'eat' })),
    ...accommodations.filter(a => a.lat && a.lng).map(a => ({ ...a, _type: 'stay' })),
  ];

  if (allPoints.length === 0) {
    return (
      <div className="map-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', color: '#6b7a8d' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem' }}>🗺️</div>
          <p style={{ marginTop: 8 }}>No locations with coordinates yet.<br />Add addresses to places and they'll appear here.</p>
        </div>
      </div>
    );
  }

  const center = [
    allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length,
    allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length,
  ];

  return (
    <div className="map-container">
      <MapContainer center={center} zoom={12} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {allPoints.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]} icon={icons[p._type] || icons.visit}>
            <Popup>
              <strong>{p.name}</strong><br />
              {p._type === 'visit' && <span>🏛️ Place to Visit</span>}
              {p._type === 'eat' && <span>🍽️ Restaurant</span>}
              {p._type === 'stay' && <span>🏨 Accommodation</span>}
              {p.address && <><br /><small>{p.address}</small></>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
