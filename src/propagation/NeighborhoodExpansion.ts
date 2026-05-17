import { ItemId, NodeId, PropagationConfig, PropagationResult, UserId } from "../types";
import { GraphStorage } from "../graph/GraphStorage";

export class NeighborhoodExpansion {
  static run(graph: GraphStorage, userId: UserId, config: PropagationConfig): PropagationResult {
    const scores = new Map<ItemId, number>();
    const paths = new Map<ItemId, NodeId[]>();
    const visitedDepth = new Map<NodeId, number>();
    const queue: Array<{ nodeId: NodeId; depth: number; path: NodeId[]; score: number }> = [
      { nodeId: userId, depth: 0, path: [userId], score: 1 }
    ];

    visitedDepth.set(userId, 0);
    let propagatedEdges = 0;

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        break;
      }
      if (current.depth >= config.depth) {
        continue;
      }

      const neighbors = graph.getNeighbors(current.nodeId);
      for (const neighbor of neighbors) {
        propagatedEdges += 1;
        const nextDepth = current.depth + 1;
        const nextScore = current.score * neighbor.weight * config.decay;
        const nextPath = [...current.path, neighbor.nodeId];
        const prevDepth = visitedDepth.get(neighbor.nodeId);
        if (prevDepth !== undefined && prevDepth <= nextDepth) {
          continue;
        }
        visitedDepth.set(neighbor.nodeId, nextDepth);

        if (graph.getNodeType(neighbor.nodeId) === "item") {
          const itemId = neighbor.nodeId as ItemId;
          const existing = scores.get(itemId) ?? 0;
          scores.set(itemId, existing + nextScore);
          if (!paths.has(itemId)) {
            paths.set(itemId, nextPath);
          }
        }

        queue.push({ nodeId: neighbor.nodeId, depth: nextDepth, path: nextPath, score: nextScore });
      }
    }

    return {
      scores,
      visitedNodes: visitedDepth.size,
      propagatedEdges,
      candidateCount: scores.size,
      paths
    };
  }
}
