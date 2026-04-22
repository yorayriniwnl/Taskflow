export default function StatCard({ code, value, label, tone = 'accent', note }) {
  return (
    <div className="stat-card">
      <div className="stat-topline">
        <div className={`stat-icon stat-icon-${tone}`}>{code}</div>
        {note && <div className="stat-note">{note}</div>}
      </div>
      <div className="stat-value">{value ?? 0}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
