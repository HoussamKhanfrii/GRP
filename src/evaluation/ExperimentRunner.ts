import path from "path";
import { GraphSizeExperiment } from "../experiments/GraphSizeExperiment";
import { SparsityExperiment } from "../experiments/SparsityExperiment";
import { DegreeImbalanceExperiment } from "../experiments/DegreeImbalanceExperiment";
import { DepthExperiment } from "../experiments/DepthExperiment";

export class ExperimentRunner {
  constructor(private outputDir: string) {}

  runAll(): void {
    new GraphSizeExperiment().run(path.join(this.outputDir, "experiment_graph_size.csv"));
    new SparsityExperiment().run(path.join(this.outputDir, "experiment_sparsity.csv"));
    new DegreeImbalanceExperiment().run(path.join(this.outputDir, "experiment_degree_imbalance.csv"));
    new DepthExperiment().run(path.join(this.outputDir, "experiment_depth.csv"));
  }
}
