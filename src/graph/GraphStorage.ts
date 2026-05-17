import { ItemId, Neighbor, NodeId, NodeType, UserId, GraphSize } from "../types";

export class GraphStorage {
  private adjacency = new Map<NodeId, Map<NodeId, number>>();
  private nodeTypes = new Map<NodeId, NodeType>();
  private userIds = new Set<UserId>();
  private itemIds = new Set<ItemId>();
  private edgeCount = 0;

  addNode(nodeId: NodeId, type: NodeType): void {
    if (!this.nodeTypes.has(nodeId)) {
      this.nodeTypes.set(nodeId, type);
      if (type === "user") {
        this.userIds.add(nodeId);
      } else {
        this.itemIds.add(nodeId);
      }
    }

    if (!this.adjacency.has(nodeId)) {
      this.adjacency.set(nodeId, new Map());
    }
  }

  addEdge(userId: UserId, itemId: ItemId, weight: number): void {
    this.addNode(userId, "user");
    this.addNode(itemId, "item");

    const userNeighbors = this.adjacency.get(userId) as Map<NodeId, number>;
    const itemNeighbors = this.adjacency.get(itemId) as Map<NodeId, number>;

    const existing = userNeighbors.get(itemId);
    if (existing === undefined) {
      this.edgeCount += 1;
      userNeighbors.set(itemId, weight);
      itemNeighbors.set(userId, weight);
    } else {
      const updated = existing + weight;
      userNeighbors.set(itemId, updated);
      itemNeighbors.set(userId, updated);
    }
  }

  getNeighbors(nodeId: NodeId): Neighbor[] {
    const neighbors = this.adjacency.get(nodeId);
    if (!neighbors) {
      return [];
    }
    return Array.from(neighbors.entries()).map(([neighborId, weight]) => ({
      nodeId: neighborId,
      weight
    }));
  }

  getEdgeWeight(nodeA: NodeId, nodeB: NodeId): number {
    return this.adjacency.get(nodeA)?.get(nodeB) ?? 0;
  }

  getUserInteractions(userId: UserId): Array<{ itemId: ItemId; weight: number }> {
    return this.getNeighbors(userId).map((neighbor) => ({
      itemId: neighbor.nodeId as ItemId,
      weight: neighbor.weight
    }));
  }

  getItemInteractions(itemId: ItemId): Array<{ userId: UserId; weight: number }> {
    return this.getNeighbors(itemId).map((neighbor) => ({
      userId: neighbor.nodeId as UserId,
      weight: neighbor.weight
    }));
  }

  getAllUsers(): UserId[] {
    return Array.from(this.userIds.values());
  }

  getAllItems(): ItemId[] {
    return Array.from(this.itemIds.values());
  }

  getAllNodeIds(): NodeId[] {
    return Array.from(this.nodeTypes.keys());
  }

  getGraphSize(): GraphSize {
    return { nodes: this.nodeTypes.size, edges: this.edgeCount };
  }

  getNumberOfNodes(): number {
    return this.nodeTypes.size;
  }

  getNumberOfEdges(): number {
    return this.edgeCount;
  }

  getNodeType(nodeId: NodeId): NodeType | undefined {
    return this.nodeTypes.get(nodeId);
  }
}
