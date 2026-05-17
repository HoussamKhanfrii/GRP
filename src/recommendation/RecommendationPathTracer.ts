import { ItemId, NodeId, UserId } from "../types";
import { GraphStorage } from "../graph/GraphStorage";

export class RecommendationPathTracer {
  static trace(graph: GraphStorage, userId: UserId, itemId: ItemId, maxDepth = 6): NodeId[] {
    const queue: Array<{ nodeId: NodeId; depth: number }> = [{ nodeId: userId, depth: 0 }];
    const parent = new Map<NodeId, NodeId | null>();
    parent.set(userId, null);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        break;
      }
      if (current.depth >= maxDepth) {
        continue;
      }
      for (const neighbor of graph.getNeighbors(current.nodeId)) {
        if (parent.has(neighbor.nodeId)) {
          continue;
        }
        parent.set(neighbor.nodeId, current.nodeId);
        if (neighbor.nodeId === itemId) {
          return RecommendationPathTracer.buildPath(parent, itemId);
        }
        queue.push({ nodeId: neighbor.nodeId, depth: current.depth + 1 });
      }
    }

    return [userId, itemId];
  }

  private static buildPath(parent: Map<NodeId, NodeId | null>, endNode: NodeId): NodeId[] {
    const path: NodeId[] = [];
    let current: NodeId | null = endNode;
    while (current) {
      path.unshift(current);
      current = parent.get(current) ?? null;
    }
    return path;
  }
}
