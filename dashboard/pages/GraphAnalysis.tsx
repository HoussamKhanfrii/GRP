import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartCard } from "../components/ChartCard";
import { GraphStatsPanel } from "../components/GraphStatsPanel";
import { useEngineData } from "../EngineContext";

export function GraphAnalysis(): JSX.Element {
  const { degreeDistribution, graphStats, popularItems } = useEngineData();
  
  // Transform degreeDistribution Record<string, number> to array for Recharts if needed
  const distArray = Object.entries(degreeDistribution).map(([degree, count]) => ({
    degree: Number(degree),
    count
  })).sort((a, b) => a.degree - b.degree);

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
        <ChartCard title="Degree Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distArray}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9d1c3" />
              <XAxis dataKey="degree" />
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
