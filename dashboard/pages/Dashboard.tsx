import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { MetricCard } from "../components/MetricCard";
import { ChartCard } from "../components/ChartCard";
import { MethodComparisonTable } from "../components/MethodComparisonTable";
import { graphStats, benchmarkResults, graphSizeExperiment } from "../data/sampleData";

export function Dashboard(): JSX.Element {
  const latestBenchmark = benchmarkResults[0];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Propagation Engine Overview</h1>
          <p>High level health check across the recommendation stack.</p>
        </div>
        <div className="page-badge">Academic Grade</div>
      </div>

      <div className="metric-grid">
        <MetricCard label="Users" value={graphStats.users} />
        <MetricCard label="Items" value={graphStats.items} />
        <MetricCard label="Interactions" value={graphStats.interactions} />
        <MetricCard label="Density" value={graphStats.density.toFixed(3)} />
        <MetricCard label="Memory" value={`${graphStats.memoryMB.toFixed(1)} MB`} />
        <MetricCard
          label="Latest Precision"
          value={latestBenchmark.precision.toFixed(2)}
          subtext="Benchmark snapshot"
        />
      </div>

      <div className="grid-two">
        <ChartCard title="Runtime vs Users">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={graphSizeExperiment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9d1c3" />
              <XAxis dataKey="users" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="latencyMs" stroke="#1f3b4d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <MethodComparisonTable rows={benchmarkResults} />
      </div>
    </div>
  );
}
