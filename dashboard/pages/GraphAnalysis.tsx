import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartCard } from "../components/ChartCard";
import { GraphStatsPanel } from "../components/GraphStatsPanel";
import { useEngineData } from "../EngineContext";

interface DegreeBin {
  label: string;
  count: number;
}

function buildDegreeBins(degreeDistribution: Record<string, number>): DegreeBin[] {
  const bins = [
    { label: "0", min: 0, max: 0 },
    { label: "1", min: 1, max: 1 },
    { label: "2", min: 2, max: 2 },
    { label: "3-4", min: 3, max: 4 },
    { label: "5-8", min: 5, max: 8 },
    { label: "9-16", min: 9, max: 16 },
    { label: "17-32", min: 17, max: 32 },
    { label: "33-64", min: 33, max: 64 },
    { label: "65+", min: 65, max: Number.POSITIVE_INFINITY }
  ];

  return bins.map((bin) => {
    const count = Object.entries(degreeDistribution).reduce((sum, [degree, value]) => {
      const numericDegree = Number(degree);
      return numericDegree >= bin.min && numericDegree <= bin.max ? sum + value : sum;
    }, 0);
    return { label: bin.label, count };
  });
}

export function GraphAnalysis(): JSX.Element {
  const { degreeDistribution, graphStats, popularItems } = useEngineData();
  const distArray = buildDegreeBins(degreeDistribution);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Graph Analysis</h1>
          <p>Structural summary of the current user-item interaction graph.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <div className="page-badge" style={{ background: "#4caf50", color: "#fff" }}>Generated Benchmark Results</div>
        </div>
      </div>

      <p className="description-text">
        This page summarizes the structural properties of the bipartite user-item graph, including density, sparsity, degree distribution, and popular items.
      </p>

      <div className="grid-two">
        <GraphStatsPanel stats={graphStats} topItems={popularItems} />
        <ChartCard title="Degree Distribution (Binned)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distArray}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9d1c3" />
              <XAxis dataKey="label" interval={0} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b6b4f" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
