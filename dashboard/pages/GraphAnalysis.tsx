import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartCard } from "../components/ChartCard";
import { GraphStatsPanel } from "../components/GraphStatsPanel";
import { degreeDistribution, graphStats, popularItems } from "../data/sampleData";

export function GraphAnalysis(): JSX.Element {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Graph Analysis</h1>
          <p>Structural summary of the current interaction graph.</p>
        </div>
      </div>

      <div className="grid-two">
        <GraphStatsPanel stats={graphStats} topItems={popularItems} />
        <ChartCard title="Degree Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={degreeDistribution}>
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
