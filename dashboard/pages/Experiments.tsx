import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";
import { ChartCard } from "../components/ChartCard";
import { useEngineData } from "../EngineContext";

export function Experiments(): JSX.Element {
  const { depthExperiment, graphSizeExperiment, sparsityExperiment } = useEngineData();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Experiments</h1>
          <p>Controlled experiments across graph size, sparsity, degree imbalance, and propagation depth.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <div className="page-badge" style={{ background: "#4caf50", color: "#fff" }}>Generated Benchmark Results</div>
        </div>
      </div>

      <p className="description-text">
        This page compares propagation strategies under controlled changes in graph size, sparsity, degree imbalance, and propagation depth.
      </p>

      <div className="grid-two">
        <ChartCard title="Propagation Depth vs Candidate Count">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={depthExperiment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9d1c3" />
              <XAxis dataKey="depth" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="candidateCount" stroke="#a36f2b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Graph Sparsity vs Recall@10">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sparsityExperiment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9d1c3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="recall" fill="#1f3b4d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Graph Scale vs Memory Usage">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={graphSizeExperiment}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d9d1c3" />
            <XAxis dataKey="users" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="memoryMB" stroke="#4a7c59" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
