import { ItemId, NodeId, PropagationConfig, PropagationResult, UserId } from "../types";
import { GraphStorage } from "../graph/GraphStorage";

export class RandomWalkRestart {
  static run(graph: GraphStorage, userId: UserId, config: PropagationConfig): PropagationResult {
    const nodeIds = graph.getAllNodeIds();
    const indexMap = new Map<NodeId, number>();
    nodeIds.forEach((nodeId, index) => indexMap.set(nodeId, index));

    const size = nodeIds.length;
    const prob = new Float64Array(size);
    const startIndex = indexMap.get(userId) ?? 0;
    prob[startIndex] = 1;

    let propagatedEdges = 0;

    for (let iter = 0; iter < config.maxIterations; iter += 1) {
      const next = new Float64Array(size);
      for (let i = 0; i < size; i += 1) {
        const currentProb = prob[i];
        if (currentProb === 0) {
          continue;
        }
        const nodeId = nodeIds[i];
        const neighbors = graph.getNeighbors(nodeId);
        if (neighbors.length === 0) {
          continue;
        }
        const totalWeight = neighbors.reduce((sum, n) => sum + n.weight, 0);
        for (const neighbor of neighbors) {
          const neighborIndex = indexMap.get(neighbor.nodeId);
          if (neighborIndex === undefined) {
            continue;
          }
          const weightShare = totalWeight > 0 ? neighbor.weight / totalWeight : 0;
          next[neighborIndex] += currentProb * (1 - config.restartProbability) * weightShare;
          propagatedEdges += 1;
        }
      }
      next[startIndex] += config.restartProbability;

      let delta = 0;
      for (let i = 0; i < size; i += 1) {
        delta += Math.abs(next[i] - prob[i]);
        prob[i] = next[i];
      }
      if (delta < config.convergenceThreshold) {
        break;
      }
    }

    const scores = new Map<ItemId, number>();
    for (let i = 0; i < size; i += 1) {
      const nodeId = nodeIds[i];
      if (graph.getNodeType(nodeId) === "item") {
        scores.set(nodeId as ItemId, prob[i]);
      }
    }

    const visitedNodes = Array.from(prob).filter((value) => value > 0).length;

    return {
      scores,
      visitedNodes,
      propagatedEdges,
      candidateCount: scores.size,
      paths: new Map()
    };
  }
}
