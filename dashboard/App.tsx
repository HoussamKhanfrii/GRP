import { useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import { Recommendations } from "./pages/Recommendations";
import { Experiments } from "./pages/Experiments";
import { GraphAnalysis } from "./pages/GraphAnalysis";
import { methodLabels } from "./utils/displayLabels";

const pages = [
  { key: "dashboard", label: "Dashboard" },
  { key: "recommendations", label: "Recommendations" },
  { key: "experiments", label: "Experiments" },
  { key: "analysis", label: "Graph Analysis" }
] as const;

type PageKey = (typeof pages)[number]["key"];

export default function App(): JSX.Element {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">GRAPH PROPAGATION LAB</div>
          <div className="brand-subtitle">Recommendation Engine</div>
        </div>
        <nav className="nav">
          {pages.map((page) => (
            <button
              key={page.key}
              className={`nav-button ${activePage === page.key ? "active" : ""}`}
              onClick={() => setActivePage(page.key)}
            >
              {page.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div>Propagation Methods</div>
          <div className="pill">{methodLabels.neighborhood}</div>
          <div className="pill">{methodLabels.randomWalkRestart}</div>
          <div className="pill">{methodLabels.spreadingActivation}</div>
          <div className="pill">{methodLabels.weightedInfluence}</div>
        </div>
      </aside>

      <main className="content">
        {activePage === "dashboard" && <Dashboard />}
        {activePage === "recommendations" && <Recommendations />}
        {activePage === "experiments" && <Experiments />}
        {activePage === "analysis" && <GraphAnalysis />}
      </main>
    </div>
  );
}
