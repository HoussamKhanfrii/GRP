interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
}

export function MetricCard({ label, value, subtext }: MetricCardProps): JSX.Element {
  return (
    <div className="card metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {subtext ? <div className="metric-subtext">{subtext}</div> : null}
    </div>
  );
}
