import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ latitude, longitude, onChange }) {
  const center = [latitude || 17.4401, longitude || 78.3489];

  return (
    <div>
      <div style={{ height: 260, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--line)', marginBottom: 8 }}>
        <MapContainer center={center} zoom={latitude ? 13 : 5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {latitude && longitude && <Marker position={[latitude, longitude]} />}
          <ClickHandler onPick={onChange} />
        </MapContainer>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
        Click the map to set the property's location{latitude ? ` — ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : ''}.
      </p>
    </div>
  );
}
