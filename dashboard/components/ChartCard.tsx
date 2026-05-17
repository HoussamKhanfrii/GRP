import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps): JSX.Element {
  return (
    <div className="card chart-card">
      <div className="card-title">{title}</div>
      <div className="chart-body">{children}</div>
    </div>
  );
}
