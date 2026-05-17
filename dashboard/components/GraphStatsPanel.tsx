interface GraphStats {
  users: number;
  items: number;
  interactions: number;
  density: number;
  sparsity: number;
  averageDegree: number;
  memoryMB: number;
}

interface TopItem {
  itemId: string;
  degree: number;
  weightSum: number;
}

interface GraphStatsPanelProps {
  stats: GraphStats;
  topItems: TopItem[];
}

export function GraphStatsPanel({ stats, topItems }: GraphStatsPanelProps): JSX.Element {
  return (
    <div className="card graph-stats-card">
      <div className="card-title">Graph Summary</div>
      <div className="stats-grid">
        <div>
          <div className="stat-label">Users</div>
          <div className="stat-value">{stats.users}</div>
        </div>
        <div>
          <div className="stat-label">Items</div>
          <div className="stat-value">{stats.items}</div>
        </div>
        <div>
          <div className="stat-label">Interactions</div>
          <div className="stat-value">{stats.interactions}</div>
        </div>
        <div>
          <div className="stat-label">Density</div>
          <div className="stat-value">{stats.density.toFixed(3)}</div>
        </div>
        <div>
          <div className="stat-label">Sparsity</div>
          <div className="stat-value">{stats.sparsity.toFixed(3)}</div>
        </div>
        <div>
          <div className="stat-label">Avg Degree</div>
          <div className="stat-value">{stats.averageDegree.toFixed(2)}</div>
        </div>
        <div>
          <div className="stat-label">Memory</div>
          <div className="stat-value">{stats.memoryMB.toFixed(1)} MB</div>
        </div>
      </div>
      <div className="subsection-title">Top Items</div>
      <ul className="top-item-list">
        {topItems.map((item) => (
          <li key={item.itemId}>
            <span>{item.itemId}</span>
            <span>Degree {item.degree}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
