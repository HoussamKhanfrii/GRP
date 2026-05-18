import { DataGenerator } from "../data/DataGenerator";
import { TrainTestSplitter } from "../data/TrainTestSplitter";
import { GraphBuilder } from "../graph/GraphBuilder";
import { GraphAnalyzer } from "../graph/GraphAnalyzer";
import { RecommendationEngine } from "../recommendation/RecommendationEngine";
import { PropagationConfig, PropagationMethod } from "../types";

export interface LiveRecommendationItem {
  itemId: string;
  score: number;
  path?: string[];
}

export interface LiveRecommendationResponse {
  userId: string;
  method: PropagationMethod;
  topK: number;
  items: LiveRecommendationItem[];
  generatedAt: string;
}

export interface LiveState {
  users: string[];
  methods: PropagationMethod[];
  graphStats: {
    users: number;
    items: number;
    interactions: number;
    density: number;
    sparsity: number;
    averageDegree: number;
  };
  generatedAt: string;
}

export class LiveEngine {
  private static instance: LiveEngine | null = null;

  static getInstance(): LiveEngine {
    if (!LiveEngine.instance) {
      LiveEngine.instance = new LiveEngine();
    }
    return LiveEngine.instance;
  }

  private engine: RecommendationEngine;
  private users: string[];
  private methods: PropagationMethod[];
  private config: PropagationConfig;
  private graphStats: LiveState["graphStats"];
  private createdAt: string;

  private constructor() {
    const generatorConfig = {
      users: 1000,
      items: 500,
      interactions: 10000,
      degreeDistribution: "power-law" as const,
      weightRange: [0.3, 1.2] as [number, number],
      seed: 42
    };

    const interactions = DataGenerator.generate(generatorConfig);
    const split = TrainTestSplitter.split(interactions, 0.2, 42);
    const graph = GraphBuilder.build(split.train);
    const analysis = GraphAnalyzer.analyze(graph);

    this.engine = new RecommendationEngine(graph);
    this.users = graph.getAllUsers();
    this.methods = [
      "neighborhood",
      "randomWalkRestart",
      "spreadingActivation",
      "weightedInfluence"
    ];
    this.config = {
      depth: 3,
      decay: 0.7,
      restartProbability: 0.15,
      maxIterations: 30,
      convergenceThreshold: 1e-6,
      minActivation: 1e-6,
      weightExponent: 1.5
    };
    this.graphStats = {
      users: analysis.users,
      items: analysis.items,
      interactions: analysis.interactions,
      density: analysis.density,
      sparsity: analysis.sparsity,
      averageDegree: analysis.averageDegree
    };
    this.createdAt = new Date().toISOString();
  }

  getState(): LiveState {
    return {
      users: this.users,
      methods: this.methods,
      graphStats: this.graphStats,
      generatedAt: this.createdAt
    };
  }

  recommend(userId: string, method: string, topK: number): LiveRecommendationResponse {
    const safeUser = this.users.includes(userId) ? userId : this.users[0];
    const safeMethod = this.methods.includes(method as PropagationMethod)
      ? (method as PropagationMethod)
      : this.methods[0];
    const safeTopK = Math.min(Math.max(topK, 1), 20);

    const output = this.engine.recommend(safeUser, safeMethod, this.config, {
      topK: safeTopK,
      includePaths: true
    });

    return {
      userId: safeUser,
      method: safeMethod,
      topK: safeTopK,
      items: output.results.map((result) => ({
        itemId: result.itemId,
        score: result.score,
        path: result.path
      })),
      generatedAt: new Date().toISOString()
    };
  }
}
