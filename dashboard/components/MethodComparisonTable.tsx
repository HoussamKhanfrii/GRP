interface MethodRow {
  method: string;
  precision: number;
  recall: number;
  ndcg: number;
  runtimeMs: number;
  memoryMB: number;
}

interface MethodComparisonTableProps {
  rows: MethodRow[];
}

export function MethodComparisonTable({ rows }: MethodComparisonTableProps): JSX.Element {
  return (
    <div className="card table-card">
      <div className="card-title">Method Comparison</div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Precision</th>
            <th>Recall</th>
            <th>NDCG</th>
            <th>Runtime (ms)</th>
            <th>Memory (MB)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.method}>
              <td>{row.method}</td>
              <td>{row.precision.toFixed(2)}</td>
              <td>{row.recall.toFixed(2)}</td>
              <td>{row.ndcg.toFixed(2)}</td>
              <td>{row.runtimeMs.toFixed(1)}</td>
              <td>{row.memoryMB.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
