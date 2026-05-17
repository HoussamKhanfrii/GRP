import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface EngineData {
  graphStats: any;
  benchmarkResults: any[];
  graphSizeExperiment: any[];
  sparsityExperiment: any[];
  depthExperiment: any[];
  degreeDistribution: Record<string, number>;
  popularItems: { itemId: string; degree: number; weightSum: number }[];
  recommendations: any[];
  users: string[];
  methods: string[];
}

export const EngineContext = createContext<{ data: EngineData | null } | null>(null);

export function useEngineData() {
  const context = useContext(EngineContext);
  if (!context || !context.data) {
    throw new Error("useEngineData must be used within an EngineProvider");
  }
  return context.data;
}

export function EngineProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<EngineData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/engine-output.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load engine data");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div style={{ padding: "2rem", color: "red" }}>Error loading data: {error}</div>;
  }

  if (!data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ fontSize: "1.5rem" }}>Loading Generated Engine Results...</div>
      </div>
    );
  }

  return <EngineContext.Provider value={{ data }}>{children}</EngineContext.Provider>;
}
