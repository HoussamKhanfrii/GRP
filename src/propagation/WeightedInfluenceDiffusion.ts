import { ItemId, NodeId, PropagationConfig, PropagationResult, UserId } from "../types";
import { GraphStorage } from "../graph/GraphStorage";

export class WeightedInfluenceDiffusion {
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
        const weightedSum = neighbors.reduce(
          (sum, n) => sum + Math.pow(n.weight, config.weightExponent),
          0
        );

        for (const neighbor of neighbors) {
          propagatedEdges += 1;
          const weightInfluence = weightedSum > 0 ? Math.pow(neighbor.weight, config.weightExponent) / weightedSum : 0;
          const spread = activation * config.decay * weightInfluence;
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
