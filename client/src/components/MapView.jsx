import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MapView({ latitude, longitude, title, address, height = 320 }) {
  if (!latitude || !longitude) {
    return (
      <div style={{
        height, borderRadius: 'var(--radius)', border: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--muted)', background: 'var(--pine-light)', fontSize: '0.9rem',
      }}>
        Location not available for this property
      </div>
    );
  }

  return (
    <div style={{ height, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--line)' }}>
      <MapContainer center={[latitude, longitude]} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>
            <strong>{title}</strong><br />{address}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
