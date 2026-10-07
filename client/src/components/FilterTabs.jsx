export default function FilterTabs({ tabs, active, onChange, counts }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '18px 0' }}>
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        const count = counts ? counts[tab.value] : undefined;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={isActive ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
            style={{ borderRadius: 999 }}
          >
            {tab.label}{count !== undefined ? ` (${count})` : ''}
          </button>
        );
      })}
    </div>
  );
}
