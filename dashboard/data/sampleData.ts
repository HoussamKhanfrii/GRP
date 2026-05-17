export const graphStats = {
  users: 1000,
  items: 500,
  interactions: 10000,
  density: 0.02,
  sparsity: 0.98,
  averageDegree: 12.4,
  memoryMB: 84.2
};

export const benchmarkResults = [
  {
    method: "neighborhood",
    precision: 0.18,
    recall: 0.12,
    ndcg: 0.21,
    runtimeMs: 24.3,
    memoryMB: 4.8,
    visitedNodes: 4200,
    candidateCount: 610
  },
  {
    method: "randomWalkRestart",
    precision: 0.2,
    recall: 0.15,
    ndcg: 0.25,
    runtimeMs: 36.8,
    memoryMB: 6.4,
    visitedNodes: 5100,
    candidateCount: 720
  },
  {
    method: "spreadingActivation",
    precision: 0.17,
    recall: 0.14,
    ndcg: 0.22,
    runtimeMs: 28.9,
    memoryMB: 5.1,
    visitedNodes: 4600,
    candidateCount: 680
  },
  {
    method: "weightedInfluence",
    precision: 0.19,
    recall: 0.16,
    ndcg: 0.24,
    runtimeMs: 31.4,
    memoryMB: 5.6,
    visitedNodes: 4900,
    candidateCount: 705
  }
];

export const graphSizeExperiment = [
  { users: 100, items: 50, interactions: 500, latencyMs: 6.2, memoryMB: 3.1, rankingMs: 1.1 },
  { users: 1000, items: 500, interactions: 10000, latencyMs: 24.3, memoryMB: 8.4, rankingMs: 4.2 },
  { users: 5000, items: 2000, interactions: 50000, latencyMs: 68.9, memoryMB: 24.6, rankingMs: 9.6 },
  { users: 10000, items: 5000, interactions: 100000, latencyMs: 122.1, memoryMB: 46.8, rankingMs: 18.5 }
];

export const sparsityExperiment = [
  { label: "very sparse", density: 0.001, precision: 0.08, recall: 0.05, coverage: 0.31, candidateCount: 120 },
  { label: "sparse", density: 0.005, precision: 0.12, recall: 0.08, coverage: 0.42, candidateCount: 240 },
  { label: "medium", density: 0.01, precision: 0.16, recall: 0.12, coverage: 0.55, candidateCount: 360 },
  { label: "dense", density: 0.05, precision: 0.22, recall: 0.18, coverage: 0.68, candidateCount: 620 }
];

export const depthExperiment = [
  { depth: 1, precision: 0.09, recall: 0.04, runtimeMs: 4.5, visitedNodes: 800, candidateCount: 220 },
  { depth: 2, precision: 0.13, recall: 0.08, runtimeMs: 7.8, visitedNodes: 1600, candidateCount: 360 },
  { depth: 3, precision: 0.17, recall: 0.12, runtimeMs: 12.3, visitedNodes: 2800, candidateCount: 520 },
  { depth: 4, precision: 0.18, recall: 0.14, runtimeMs: 18.6, visitedNodes: 3900, candidateCount: 690 },
  { depth: 5, precision: 0.17, recall: 0.13, runtimeMs: 26.1, visitedNodes: 5200, candidateCount: 860 }
];

export const degreeDistribution = [
  { degree: 1, count: 120 },
  { degree: 2, count: 180 },
  { degree: 3, count: 140 },
  { degree: 4, count: 90 },
  { degree: 5, count: 60 },
  { degree: 6, count: 40 },
  { degree: 7, count: 25 },
  { degree: 8, count: 15 },
  { degree: 9, count: 8 },
  { degree: 10, count: 4 }
];

export const popularItems = [
  { itemId: "I12", degree: 95, weightSum: 70.4 },
  { itemId: "I3", degree: 88, weightSum: 66.1 },
  { itemId: "I41", degree: 82, weightSum: 61.7 },
  { itemId: "I7", degree: 78, weightSum: 58.2 },
  { itemId: "I28", degree: 74, weightSum: 55.9 }
];

export const recommendationSets = [
  {
    userId: "U12",
    method: "neighborhood",
    items: [
      { itemId: "I45", score: 0.91, path: ["U12", "I7", "U33", "I45"] },
      { itemId: "I18", score: 0.83, path: ["U12", "I3", "U9", "I18"] },
      { itemId: "I64", score: 0.78, path: ["U12", "I41", "U6", "I64"] }
    ]
  },
  {
    userId: "U12",
    method: "randomWalkRestart",
    items: [
      { itemId: "I41", score: 0.88, path: ["U12", "I7", "U33", "I41"] },
      { itemId: "I72", score: 0.81, path: ["U12", "I3", "U21", "I72"] },
      { itemId: "I19", score: 0.74, path: ["U12", "I28", "U15", "I19"] }
    ]
  },
  {
    userId: "U12",
    method: "spreadingActivation",
    items: [
      { itemId: "I11", score: 0.86, path: ["U12", "I7", "U33", "I11"] },
      { itemId: "I53", score: 0.79, path: ["U12", "I3", "U21", "I53"] },
      { itemId: "I66", score: 0.73, path: ["U12", "I41", "U6", "I66"] }
    ]
  },
  {
    userId: "U12",
    method: "weightedInfluence",
    items: [
      { itemId: "I5", score: 0.89, path: ["U12", "I7", "U33", "I5"] },
      { itemId: "I27", score: 0.82, path: ["U12", "I28", "U15", "I27"] },
      { itemId: "I91", score: 0.75, path: ["U12", "I3", "U21", "I91"] }
    ]
  },
  {
    userId: "U41",
    method: "neighborhood",
    items: [
      { itemId: "I22", score: 0.88, path: ["U41", "I12", "U8", "I22"] },
      { itemId: "I57", score: 0.81, path: ["U41", "I3", "U19", "I57"] },
      { itemId: "I9", score: 0.76, path: ["U41", "I41", "U6", "I9"] }
    ]
  },
  {
    userId: "U41",
    method: "randomWalkRestart",
    items: [
      { itemId: "I7", score: 0.86, path: ["U41", "I12", "U8", "I7"] },
      { itemId: "I63", score: 0.8, path: ["U41", "I28", "U15", "I63"] },
      { itemId: "I34", score: 0.74, path: ["U41", "I3", "U21", "I34"] }
    ]
  },
  {
    userId: "U41",
    method: "spreadingActivation",
    items: [
      { itemId: "I48", score: 0.84, path: ["U41", "I7", "U33", "I48"] },
      { itemId: "I29", score: 0.79, path: ["U41", "I41", "U6", "I29"] },
      { itemId: "I73", score: 0.71, path: ["U41", "I3", "U21", "I73"] }
    ]
  },
  {
    userId: "U41",
    method: "weightedInfluence",
    items: [
      { itemId: "I16", score: 0.87, path: ["U41", "I28", "U15", "I16"] },
      { itemId: "I67", score: 0.82, path: ["U41", "I12", "U8", "I67"] },
      { itemId: "I90", score: 0.74, path: ["U41", "I3", "U21", "I90"] }
    ]
  },
  {
    userId: "U77",
    method: "neighborhood",
    items: [
      { itemId: "I14", score: 0.9, path: ["U77", "I7", "U33", "I14"] },
      { itemId: "I52", score: 0.82, path: ["U77", "I28", "U15", "I52"] },
      { itemId: "I61", score: 0.77, path: ["U77", "I41", "U6", "I61"] }
    ]
  },
  {
    userId: "U77",
    method: "randomWalkRestart",
    items: [
      { itemId: "I33", score: 0.85, path: ["U77", "I12", "U8", "I33"] },
      { itemId: "I70", score: 0.8, path: ["U77", "I3", "U21", "I70"] },
      { itemId: "I5", score: 0.73, path: ["U77", "I28", "U15", "I5"] }
    ]
  },
  {
    userId: "U77",
    method: "spreadingActivation",
    items: [
      { itemId: "I24", score: 0.83, path: ["U77", "I7", "U33", "I24"] },
      { itemId: "I58", score: 0.79, path: ["U77", "I41", "U6", "I58"] },
      { itemId: "I80", score: 0.72, path: ["U77", "I3", "U21", "I80"] }
    ]
  },
  {
    userId: "U77",
    method: "weightedInfluence",
    items: [
      { itemId: "I17", score: 0.88, path: ["U77", "I12", "U8", "I17"] },
      { itemId: "I68", score: 0.81, path: ["U77", "I28", "U15", "I68"] },
      { itemId: "I92", score: 0.74, path: ["U77", "I3", "U21", "I92"] }
    ]
  }
];

export const users = ["U12", "U41", "U77"];

export const methods = [
  "neighborhood",
  "randomWalkRestart",
  "spreadingActivation",
  "weightedInfluence"
];
