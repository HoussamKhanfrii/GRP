import { GraphAnalysis } from "../types";

export class GraphVisualizer {
  static buildDegreeSeries(analysis: GraphAnalysis): Array<{ degree: number; count: number }> {
    return Object.entries(analysis.degreeDistribution)
      .map(([degree, count]) => ({ degree: Number(degree), count }))
      .sort((a, b) => a.degree - b.degree);
  }

  static buildTopItems(analysis: GraphAnalysis): Array<{ itemId: string; degree: number; weightSum: number }> {
    return analysis.topItems.map((item) => ({
      itemId: item.itemId,
      degree: item.degree,
      weightSum: item.weightSum
    }));
  }
}
