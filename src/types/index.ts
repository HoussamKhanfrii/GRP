export type UserId = string;
export type ItemId = string;
export type NodeId = string;
export type NodeType = "user" | "item";

export interface Interaction {
  userId: UserId;
  itemId: ItemId;
  weight: number;
  timestamp: number;
}

export interface Neighbor {
  nodeId: NodeId;
  weight: number;
}

export interface GraphSize {
  nodes: number;
  edges: number;
}

export interface GraphAnalysis {
  users: number;
  items: number;
  interactions: number;
  density: number;
  sparsity: number;
  averageDegree: number;
  maxDegree: number;
  minDegree: number;
  degreeDistribution: Record<string, number>;
  topItems: Array<{ itemId: ItemId; degree: number; weightSum: number }>;
  isolatedNodes: NodeId[];
  components: { count: number; largest: number };
}

export type DegreeDistribution = "uniform" | "power-law";

export interface DataGeneratorConfig {
  users: number;
  items: number;
  interactions?: number;
  density?: number;
  sparsity?: number;
  degreeDistribution: DegreeDistribution;
  weightRange: [number, number];
  seed: number;
  powerLawExponent?: number;
  timestampStart?: number;
  timestampEnd?: number;
}

export interface TrainTestSplit {
  train: Interaction[];
  test: Interaction[];
}

export type PropagationMethod =
  | "neighborhood"
  | "randomWalkRestart"
  | "spreadingActivation"
  | "weightedInfluence";

export interface PropagationConfig {
  depth: number;
  decay: number;
  restartProbability: number;
  maxIterations: number;
  convergenceThreshold: number;
  minActivation: number;
  weightExponent: number;
}

export interface PropagationResult {
  scores: Map<ItemId, number>;
  visitedNodes: number;
  propagatedEdges: number;
  candidateCount: number;
  paths: Map<ItemId, NodeId[]>;
}

export interface RecommendationCandidate {
  itemId: ItemId;
  score: number;
  path?: NodeId[];
}

export interface RankedRecommendation {
  itemId: ItemId;
  score: number;
  rank: number;
  method: PropagationMethod;
  path?: NodeId[];
}

export interface RecommendationStats {
  propagationMs: number;
  rankingMs: number;
  totalMs: number;
  visitedNodes: number;
  candidateCount: number;
  propagatedEdges: number;
}

export interface RecommendationOutput {
  userId: UserId;
  method: PropagationMethod;
  results: RankedRecommendation[];
  stats: RecommendationStats;
}

export interface BenchmarkResult {
  method: PropagationMethod;
  precisionAtK: number;
  recallAtK: number;
  f1AtK: number;
  ndcgAtK: number;
  hitRateAtK: number;
  coverage: number;
  avgRuntimeMs: number;
  avgMemoryMB: number;
  avgVisitedNodes: number;
  avgCandidateCount: number;
  avgPropagatedEdges: number;
}

export interface MemorySnapshot {
  label: string;
  heapUsedMB: number;
  rssMB: number;
  externalMB: number;
}
