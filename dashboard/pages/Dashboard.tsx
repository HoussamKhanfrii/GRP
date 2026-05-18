import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { MetricCard } from "../components/MetricCard";
import { ChartCard } from "../components/ChartCard";
import { MethodComparisonTable } from "../components/MethodComparisonTable";
import { useEngineData } from "../EngineContext";

export function Dashboard(): JSX.Element {
  const { graphStats, benchmarkResults, graphSizeExperiment } = useEngineData();
  const latestBenchmark = benchmarkResults[0];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Propagation Engine Overview</h1>
          <p>High-level health check across the recommendation stack.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <div className="page-badge">Academic Grade</div>
          <div className="page-badge" style={{ background: "#4caf50", color: "#fff" }}>Generated Benchmark Results</div>
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard label="USERS" value={graphStats.users} />
        <MetricCard label="ITEMS" value={graphStats.items} />
        <MetricCard label="INTERACTIONS" value={graphStats.interactions} />
        <MetricCard label="DENSITY" value={graphStats.density.toFixed(3)} />
        <MetricCard label="MEMORY USAGE" value={`${graphStats.memoryMB.toFixed(1)} MB`} />
        <MetricCard
          label="LATEST PRECISION@10"
          value={latestBenchmark.precision.toFixed(2)}
          subtext="Generated benchmark snapshot."
        />
      </div>

      <p className="description-text" style={{ marginBottom: "16px" }}>
        Displayed values are generated from the C engine benchmark run.
      </p>

      <div className="grid-two">
        <ChartCard title="Runtime vs Number of Users">
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
