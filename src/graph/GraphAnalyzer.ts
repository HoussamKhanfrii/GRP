import { GraphAnalysis, NodeId } from "../types";
import { GraphStorage } from "./GraphStorage";

export class GraphAnalyzer {
  static analyze(graph: GraphStorage): GraphAnalysis {
    const users = graph.getAllUsers();
    const items = graph.getAllItems();
    const nodes = graph.getNumberOfNodes();
    const edges = graph.getNumberOfEdges();

    const density = users.length > 0 && items.length > 0 ? edges / (users.length * items.length) : 0;
    const sparsity = 1 - density;

    const degrees = new Map<NodeId, number>();
    const degreeDistribution: Record<string, number> = {};
    let maxDegree = 0;
    let minDegree = Number.POSITIVE_INFINITY;

    for (const nodeId of graph.getAllNodeIds()) {
      const degree = graph.getNeighbors(nodeId).length;
      degrees.set(nodeId, degree);
      maxDegree = Math.max(maxDegree, degree);
      minDegree = Math.min(minDegree, degree);
      const key = String(degree);
      degreeDistribution[key] = (degreeDistribution[key] ?? 0) + 1;
    }

    if (minDegree === Number.POSITIVE_INFINITY) {
      minDegree = 0;
    }

    const averageDegree = nodes > 0 ? (2 * edges) / nodes : 0;

    const topItems = items
      .map((itemId) => {
        const neighbors = graph.getNeighbors(itemId);
        const weightSum = neighbors.reduce((sum, neighbor) => sum + neighbor.weight, 0);
        return { itemId, degree: neighbors.length, weightSum };
      })
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 10);

    const isolatedNodes = Array.from(degrees.entries())
      .filter(([, degree]) => degree === 0)
      .map(([nodeId]) => nodeId);

    const components = GraphAnalyzer.computeComponents(graph);

    return {
      users: users.length,
      items: items.length,
      interactions: edges,
      density,
      sparsity,
      averageDegree,
      maxDegree,
      minDegree,
      degreeDistribution,
      topItems,
      isolatedNodes,
      components
    };
  }

  private static computeComponents(graph: GraphStorage): { count: number; largest: number } {
    const visited = new Set<NodeId>();
    let count = 0;
    let largest = 0;

    for (const nodeId of graph.getAllNodeIds()) {
      if (visited.has(nodeId)) {
        continue;
      }
      count += 1;
      let size = 0;
      const queue: NodeId[] = [nodeId];
      visited.add(nodeId);

      while (queue.length > 0) {
        const current = queue.shift() as NodeId;
        size += 1;
        for (const neighbor of graph.getNeighbors(current)) {
          if (!visited.has(neighbor.nodeId)) {
            visited.add(neighbor.nodeId);
            queue.push(neighbor.nodeId);
          }
        }
      }

      largest = Math.max(largest, size);
    }

    return { count, largest };
  }
}
