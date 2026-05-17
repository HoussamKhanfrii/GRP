import { NodeId } from "../types";

export interface PathNode {
  id: NodeId;
  label: string;
}

export interface PathEdge {
  source: NodeId;
  target: NodeId;
}

export class RecommendationPathVisualizer {
  static buildGraph(path: NodeId[]): { nodes: PathNode[]; edges: PathEdge[] } {
    const nodes = path.map((nodeId) => ({ id: nodeId, label: nodeId }));
    const edges: PathEdge[] = [];
    for (let i = 0; i < path.length - 1; i += 1) {
      edges.push({ source: path[i], target: path[i + 1] });
    }
    return { nodes, edges };
  }
}
