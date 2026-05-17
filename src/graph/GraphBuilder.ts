import { Interaction } from "../types";
import { GraphStorage } from "./GraphStorage";

export class GraphBuilder {
  static build(interactions: Interaction[]): GraphStorage {
    const graph = new GraphStorage();
    for (const interaction of interactions) {
      graph.addEdge(interaction.userId, interaction.itemId, interaction.weight);
    }
    return graph;
  }
}
