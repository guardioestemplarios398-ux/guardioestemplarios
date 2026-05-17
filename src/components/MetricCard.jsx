export default function MetricCard({ title, value, hint, icon: Icon }) {
  return (
    <div className="metric-card">
      <div className="metric-card-top">
        <span>{title}</span>
        {Icon && <Icon size={20} />}
      </div>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}
