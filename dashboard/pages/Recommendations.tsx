import { useEffect, useMemo, useState } from "react";
import { RecommendationList } from "../components/RecommendationList";
import { methodLabels } from "../utils/displayLabels";

interface EngineRecommendationItem {
  itemId: string;
  score: number;
  path?: string[];
}

interface EngineRecommendationSet {
  userId: string;
  method: string;
  items: EngineRecommendationItem[];
}

interface EngineOutput {
  users: string[];
  methods: string[];
  recommendations: EngineRecommendationSet[];
}

interface LiveState {
  users: string[];
  methods: string[];
}

interface LiveRecommendationResponse {
  userId: string;
  method: string;
  items: EngineRecommendationItem[];
}

import { useEngineData } from "../EngineContext";

export function Recommendations(): JSX.Element {
  const engineContextData = useEngineData();
  const users = engineContextData.users;
  const methods = engineContextData.methods;

  const [selectedUser, setSelectedUser] = useState(users[0] || "");
  const [selectedMethod, setSelectedMethod] = useState(methods[0] || "");
  const [topK, setTopK] = useState(3);
  const [engineData, setEngineData] = useState<EngineOutput | null>(engineContextData);
  const [liveMode, setLiveMode] = useState(false);
  const [liveUsers, setLiveUsers] = useState<string[]>([]);
  const [liveMethods, setLiveMethods] = useState<string[]>([]);
  const [liveItems, setLiveItems] = useState<EngineRecommendationItem[]>([]);
  const [liveStatus, setLiveStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    setEngineData(engineContextData as EngineOutput);
  }, [engineContextData]);

  useEffect(() => {
    if (!liveMode) {
      return;
    }
    const controller = new AbortController();
    setLiveStatus("loading");
    fetch("/api/live-state", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: LiveState | null) => {
        if (data && Array.isArray(data.users)) {
          setLiveUsers(data.users);
          setLiveMethods(data.methods ?? []);
          setLiveStatus("idle");
        } else {
          setLiveStatus("error");
        }
      })
      .catch((error) => {
        if (error?.name !== "AbortError") {
          setLiveStatus("error");
        }
      });
    return () => controller.abort();
  }, [liveMode]);

  useEffect(() => {
    if (!liveMode) {
      return;
    }
    if (!selectedUser || !selectedMethod) {
      return;
    }
    const controller = new AbortController();
    setLiveStatus("loading");
    const params = new URLSearchParams({
      userId: selectedUser,
      method: selectedMethod,
      topK: String(topK)
    });
    fetch(`/api/live-recommendations?${params.toString()}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: LiveRecommendationResponse | null) => {
        if (data && Array.isArray(data.items)) {
          setLiveItems(data.items);
          if (data.userId && data.userId !== selectedUser) {
            setSelectedUser(data.userId);
          }
          if (data.method && data.method !== selectedMethod) {
            setSelectedMethod(data.method);
          }
          setLiveStatus("idle");
        } else {
          setLiveItems([]);
          setLiveStatus("error");
        }
      })
      .catch((error) => {
        if (error?.name !== "AbortError") {
          setLiveStatus("error");
        }
      });
    return () => controller.abort();
  }, [liveMode, selectedUser, selectedMethod, topK]);

  const fallbackUsers = engineData?.users?.length ? engineData.users : users;
  const activeUsers = liveMode && liveUsers.length ? liveUsers : users;
  const activeMethods = liveMode && liveMethods.length ? liveMethods : methods;
  const activeRecommendations = engineData?.recommendations || [];

  useEffect(() => {
    if (activeUsers.length > 0 && !activeUsers.includes(selectedUser)) {
      setSelectedUser(activeUsers[0]);
    }
  }, [activeUsers, selectedUser]);

  useEffect(() => {
    if (activeMethods.length > 0 && !activeMethods.includes(selectedMethod)) {
      setSelectedMethod(activeMethods[0]);
    }
  }, [activeMethods, selectedMethod]);

  const useLiveData = liveMode && liveStatus === "idle";
  const current = useMemo(() => {
    if (useLiveData) {
      return liveItems.slice(0, topK);
    }
    const match = activeRecommendations.find(
      (set) => set.userId === selectedUser && set.method === selectedMethod
    );
    return match ? match.items.slice(0, topK) : [];
  }, [activeRecommendations, liveItems, selectedUser, selectedMethod, topK, useLiveData]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Recommendations</h1>
          <p>Generate Top-K recommendations and inspect graph-based explanation paths.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <div className="page-badge" style={{ background: "#4caf50", color: "#fff" }}>Generated Benchmark Results</div>
        </div>
      </div>

      <p className="description-text">
        This page generates Top-K recommendations for a selected user using the chosen graph propagation strategy. Each recommendation includes a relevance score and an explanation path showing how the item was inferred through the graph.
      </p>

      <div className="filters">
        <label>
          Target User
          <select value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)}>
            {activeUsers.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </label>

        <label>
          Propagation Method
          <select value={selectedMethod} onChange={(event) => setSelectedMethod(event.target.value)}>
            {activeMethods.map((method) => (
              <option key={method} value={method}>
                {methodLabels[method] || method}
              </option>
            ))}
          </select>
        </label>

        <label>
          Selected Top-K: {topK}
          <input
            type="range"
            min={1}
            max={10}
            value={topK}
            onChange={(event) => setTopK(Number(event.target.value))}
          />
        </label>

        <label className="live-toggle">
          Live Recommendation Update
          <input
            type="checkbox"
            checked={liveMode}
            onChange={(event) => setLiveMode(event.target.checked)}
          />
        </label>
      </div>

      <div className="live-status">
        {liveMode
          ? liveStatus === "loading"
            ? "Live engine loading"
            : liveStatus === "error"
              ? "Live engine unavailable - using cached selection"
              : "Live engine active"
          : "Generated Recommendations"}
      </div>

      <RecommendationList items={current} />
    </div>
  );
}
