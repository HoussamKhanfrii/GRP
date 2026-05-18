import { methodLabels } from "../utils/displayLabels";

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
      <div className="card-title">Propagation Method Comparison</div>
      <table className="data-table method-comparison-table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Precision@10</th>
            <th>Recall@10</th>
            <th>NDCG@10</th>
            <th>Runtime (ms)</th>
            <th>Memory (MB)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.method}>
              <td>{methodLabels[row.method] || row.method}</td>
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
