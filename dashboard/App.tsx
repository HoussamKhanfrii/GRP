import { useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import { Recommendations } from "./pages/Recommendations";
import { Experiments } from "./pages/Experiments";
import { GraphAnalysis } from "./pages/GraphAnalysis";

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
          <div className="brand-title">Graph Propagation Lab</div>
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
          <div>Propagation methods</div>
          <div className="pill">Neighborhood</div>
          <div className="pill">Random Walk</div>
          <div className="pill">Spreading</div>
          <div className="pill">Weighted Diffusion</div>
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
