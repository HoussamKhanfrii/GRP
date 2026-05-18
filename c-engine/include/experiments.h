#ifndef EXPERIMENTS_H
#define EXPERIMENTS_H

#include "graph.h"
#include "metrics.h"
#include "recommendation.h"
#include "utils.h"

#define METHOD_COUNT 4
#define GRAPH_SIZE_EXPERIMENT_COUNT 4
#define SPARSITY_EXPERIMENT_COUNT 4
#define DEPTH_EXPERIMENT_COUNT 5
#define DEGREE_IMBALANCE_EXPERIMENT_COUNT 2

typedef struct BenchmarkResult {
    PropagationMethod method;
    double precision;
    double recall;
    double f1;
    double ndcg;
    double hitRate;
    double coverage;
    double runtimeMs;
    double memoryMB;
    double visitedNodes;
    double candidateCount;
    double propagatedEdges;
} BenchmarkResult;

typedef struct GraphSizeResult {
    int users;
    int items;
    int interactions;
    double graphMemoryMB;
    double runMemoryMB;
    double latencyMs;
    double rankingMs;
    int candidateCount;
    int visitedNodes;
} GraphSizeResult;

typedef struct SparsityResult {
    const char* label;
    double density;
    double precision;
    double recall;
    double coverage;
    double candidateCount;
} SparsityResult;

typedef struct DepthResult {
    int depth;
    double precision;
    double recall;
    double runtimeMs;
    double visitedNodes;
    double candidateCount;
} DepthResult;

typedef struct DegreeImbalanceResult {
    const char* distribution;
    double precision;
    double recall;
    double popularItemRatio;
    double diversity;
} DegreeImbalanceResult;

typedef struct ExperimentResults {
    BenchmarkResult benchmark[METHOD_COUNT];
    GraphSizeResult graphSize[GRAPH_SIZE_EXPERIMENT_COUNT];
    SparsityResult sparsity[SPARSITY_EXPERIMENT_COUNT];
    DepthResult depth[DEPTH_EXPERIMENT_COUNT];
    DegreeImbalanceResult degreeImbalance[DEGREE_IMBALANCE_EXPERIMENT_COUNT];
} ExperimentResults;

void runAllExperiments(Graph* baseGraph, Dataset* baseDataset, PropagationConfig config, int topK, ExperimentResults* output);

#endif
