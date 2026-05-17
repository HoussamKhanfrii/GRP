import { useEffect, useMemo, useState } from "react";
import { RecommendationList } from "../components/RecommendationList";
import { methods, recommendationSets, users } from "../data/sampleData";

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

export function Recommendations(): JSX.Element {
  const [selectedUser, setSelectedUser] = useState(users[0]);
  const [selectedMethod, setSelectedMethod] = useState(methods[0]);
  const [topK, setTopK] = useState(3);
  const [engineData, setEngineData] = useState<EngineOutput | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [liveUsers, setLiveUsers] = useState<string[]>([]);
  const [liveMethods, setLiveMethods] = useState<string[]>([]);
  const [liveItems, setLiveItems] = useState<EngineRecommendationItem[]>([]);
  const [liveStatus, setLiveStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    let active = true;
    fetch("/engine-output.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: EngineOutput | null) => {
        if (active && data && Array.isArray(data.users)) {
          setEngineData(data);
        }
      })
      .catch(() => {
        if (active) {
          setEngineData(null);
        }
      });
    return () => {
      active = false;
    };
  }, []);

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
  const fallbackMethods = engineData?.methods?.length ? engineData.methods : methods;
  const activeUsers = liveMode && liveUsers.length ? liveUsers : fallbackUsers;
  const activeMethods = liveMode && liveMethods.length ? liveMethods : fallbackMethods;
  const activeRecommendations = engineData?.recommendations?.length
    ? engineData.recommendations
    : recommendationSets;

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

  const current = useMemo(() => {
    if (liveMode) {
      return liveItems;
    }
    const match = activeRecommendations.find(
      (set) => set.userId === selectedUser && set.method === selectedMethod
    );
    return match ? match.items.slice(0, topK) : [];
  }, [activeRecommendations, liveItems, liveMode, selectedUser, selectedMethod, topK]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Recommendations</h1>
          <p>Inspect propagation results and explanation paths.</p>
        </div>
      </div>

      <div className="filters">
        <label>
          User
          <select value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)}>
            {activeUsers.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </label>

        <label>
          Method
          <select value={selectedMethod} onChange={(event) => setSelectedMethod(event.target.value)}>
            {activeMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>

        <label>
          Top K
          <input
            type="range"
            min={1}
            max={10}
            value={topK}
            onChange={(event) => setTopK(Number(event.target.value))}
          />
          <span className="range-value">{topK}</span>
        </label>

        <label className="live-toggle">
          Live recompute
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
          : "Static recommendations"}
      </div>

      <RecommendationList items={current} />
    </div>
  );
}
