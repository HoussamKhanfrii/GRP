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
import { depthExperiment, graphSizeExperiment, sparsityExperiment } from "../data/sampleData";

export function Experiments(): JSX.Element {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Experiments</h1>
          <p>Controlled runs across graph size, sparsity, and depth.</p>
        </div>
      </div>

      <div className="grid-two">
        <ChartCard title="Depth vs Candidate Count">
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

        <ChartCard title="Sparsity vs Recall">
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

      <ChartCard title="Scale vs Memory">
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
