#ifndef PROPAGATION_H
#define PROPAGATION_H

#include "graph.h"

typedef struct PropagationConfig {
    int maxDepth;
    double decayFactor;
    double restartProbability;
    int maxIterations;
    double convergenceThreshold;
    double minActivation;
    double weightExponent;
} PropagationConfig;

typedef struct PropagationResult {
    double* itemScores;
    int* predecessor;
    int* visited;
    int visitedNodes;
    int candidateCount;
    int propagatedEdges;
    double runtimeMs;
} PropagationResult;

PropagationResult* createPropagationResult(Graph* graph);
void freePropagationResult(PropagationResult* result);
PropagationResult* runNeighborhoodExpansion(Graph* graph, int targetUserId, int maxDepth, double decayFactor);
PropagationResult* runRandomWalkWithRestart(
    Graph* graph,
    int targetUserId,
    double restartProbability,
    int maxIterations,
    double convergenceThreshold
);
PropagationResult* runSpreadingActivation(
    Graph* graph,
    int targetUserId,
    int maxDepth,
    double decayFactor,
    double minActivation
);
PropagationResult* runWeightedInfluenceDiffusion(
    Graph* graph,
    int targetUserId,
    int maxDepth,
    double decayFactor,
    double weightExponent,
    double minActivation
);

#endif
