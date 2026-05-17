import { Interaction } from "../types";
import { GraphStorage } from "./GraphStorage";

export class GraphUpdater {
  static applyInteractions(graph: GraphStorage, interactions: Interaction[]): void {
    for (const interaction of interactions) {
      graph.addEdge(interaction.userId, interaction.itemId, interaction.weight);
    }
  }
}
