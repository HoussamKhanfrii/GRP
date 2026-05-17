import { PropagationConfig, PropagationMethod, PropagationResult, UserId } from "../types";
import { GraphStorage } from "../graph/GraphStorage";
import { NeighborhoodExpansion } from "./NeighborhoodExpansion";
import { RandomWalkRestart } from "./RandomWalkRestart";
import { SpreadingActivation } from "./SpreadingActivation";
import { WeightedInfluenceDiffusion } from "./WeightedInfluenceDiffusion";

export class PropagationEngine {
  run(method: PropagationMethod, graph: GraphStorage, userId: UserId, config: PropagationConfig): PropagationResult {
    switch (method) {
      case "neighborhood":
        return NeighborhoodExpansion.run(graph, userId, config);
      case "randomWalkRestart":
        return RandomWalkRestart.run(graph, userId, config);
      case "spreadingActivation":
        return SpreadingActivation.run(graph, userId, config);
      case "weightedInfluence":
        return WeightedInfluenceDiffusion.run(graph, userId, config);
      default:
        return NeighborhoodExpansion.run(graph, userId, config);
    }
  }
}
