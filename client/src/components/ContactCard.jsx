export default function ContactCard({ label, name, email, phone }) {
  return (
    <div style={{ background: 'var(--pine-light)', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--pine-dark)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{name}</div>
      <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
        {email && <a href={`mailto:${email}`} style={{ fontSize: '0.85rem' }}>✉ {email}</a>}
        {phone && <a href={`tel:${phone}`} style={{ fontSize: '0.85rem' }}>☎ {phone}</a>}
        {!phone && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>No phone on file</span>}
      </div>
    </div>
  );
}
