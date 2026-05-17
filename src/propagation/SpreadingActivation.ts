import { ItemId, NodeId, PropagationConfig, PropagationResult, UserId } from "../types";
import { GraphStorage } from "../graph/GraphStorage";

export class SpreadingActivation {
  static run(graph: GraphStorage, userId: UserId, config: PropagationConfig): PropagationResult {
    const scores = new Map<ItemId, number>();
    const paths = new Map<ItemId, NodeId[]>();
    const visited = new Set<NodeId>([userId]);

    let activations = new Map<NodeId, number>([[userId, 1]]);
    let propagatedEdges = 0;

    for (let depth = 1; depth <= config.depth; depth += 1) {
      const nextActivations = new Map<NodeId, number>();
      for (const [nodeId, activation] of activations.entries()) {
        const neighbors = graph.getNeighbors(nodeId);
        if (neighbors.length === 0) {
          continue;
        }
        const totalWeight = neighbors.reduce((sum, n) => sum + n.weight, 0);
        for (const neighbor of neighbors) {
          propagatedEdges += 1;
          const weightShare = totalWeight > 0 ? neighbor.weight / totalWeight : 0;
          const spread = activation * config.decay * weightShare;
          if (spread < config.minActivation) {
            continue;
          }
          const current = nextActivations.get(neighbor.nodeId) ?? 0;
          nextActivations.set(neighbor.nodeId, current + spread);
          visited.add(neighbor.nodeId);

          if (graph.getNodeType(neighbor.nodeId) === "item") {
            const itemId = neighbor.nodeId as ItemId;
            const existing = scores.get(itemId) ?? 0;
            scores.set(itemId, existing + spread);
            if (!paths.has(itemId)) {
              paths.set(itemId, [userId, neighbor.nodeId]);
            }
          }
        }
      }
      activations = nextActivations;
      if (activations.size === 0) {
        break;
      }
    }

    return {
      scores,
      visitedNodes: visited.size,
      propagatedEdges,
      candidateCount: scores.size,
      paths
    };
  }
}
