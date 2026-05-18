#include "experiments.h"

#include <stdio.h>
#include <stdlib.h>

static PropagationMethod METHODS[METHOD_COUNT] = {
    METHOD_NEIGHBORHOOD,
    METHOD_RANDOM_WALK_RESTART,
    METHOD_SPREADING_ACTIVATION,
    METHOD_WEIGHTED_INFLUENCE
};

static Graph* buildGraphFromDataset(Dataset* dataset) {
    Graph* graph = createGraph(dataset->userCount, dataset->itemCount);
    for (int i = 0; i < dataset->trainCount; i++) {
        addInteraction(graph, dataset->train[i].userId, dataset->train[i].itemId, dataset->train[i].weight);
    }
    return graph;
}

static int recommendationHits(RecommendationSet* set, Dataset* dataset, int topK) {
    int hits = 0;
    int limit = set->count < topK ? set->count : topK;
    for (int i = 0; i < limit; i++) {
        if (datasetUserHasTestItem(dataset, set->userId, set->items[i].itemId)) {
            hits++;
        }
    }
    return hits;
}

static int collectEvaluationUsers(Graph* graph, Dataset* dataset, int* users, int maxUsers) {
    int count = 0;
    for (int userId = 1; userId <= dataset->userCount && count < maxUsers; userId++) {
        if (getDegree(graph, userNodeId(userId)) > 0 && datasetUserTestCount(dataset, userId) > 0) {
            users[count++] = userId;
        }
    }
    if (count == 0) {
        for (int userId = 1; userId <= dataset->userCount && count < maxUsers; userId++) {
            if (getDegree(graph, userNodeId(userId)) > 0) {
                users[count++] = userId;
            }
        }
    }
    return count;
}

static BenchmarkResult evaluateMethod(
    Graph* graph,
    Dataset* dataset,
    PropagationMethod method,
    PropagationConfig config,
    int topK,
    int maxUsers
) {
    BenchmarkResult result;
    int* users = (int*)malloc((size_t)maxUsers * sizeof(int));
    RecommendationSet* sets = (RecommendationSet*)malloc((size_t)maxUsers * sizeof(RecommendationSet));
    int userCount;
    int hitUsers = 0;
    MetricsResult metrics;

    result.method = method;
    result.precision = 0.0;
    result.recall = 0.0;
    result.f1 = 0.0;
    result.ndcg = 0.0;
    result.hitRate = 0.0;
    result.coverage = 0.0;
    result.runtimeMs = 0.0;
    result.memoryMB = estimateGraphMemoryMB(graph);
    result.visitedNodes = 0.0;
    result.candidateCount = 0.0;
    result.propagatedEdges = 0.0;

    if (!users || !sets) {
        fprintf(stderr, "Failed to allocate evaluation arrays.\n");
        free(users);
        free(sets);
        exit(EXIT_FAILURE);
    }

    userCount = collectEvaluationUsers(graph, dataset, users, maxUsers);
    for (int i = 0; i < userCount; i++) {
        sets[i] = generateRecommendations(graph, users[i], method, config, topK);
        result.runtimeMs += sets[i].runtimeMs;
        result.visitedNodes += (double)sets[i].visitedNodes;
        result.candidateCount += (double)sets[i].candidateCount;
        result.propagatedEdges += (double)sets[i].propagatedEdges;
        if (recommendationHits(&sets[i], dataset, topK) > 0) {
            hitUsers++;
        }
    }

    metrics = evaluateRecommendationSets(sets, userCount, dataset, dataset->itemCount, topK);
    if (userCount > 0) {
        result.runtimeMs /= (double)userCount;
        result.visitedNodes /= (double)userCount;
        result.candidateCount /= (double)userCount;
        result.propagatedEdges /= (double)userCount;
        result.hitRate = (double)hitUsers / (double)userCount;
    }

    result.precision = metrics.precision;
    result.recall = metrics.recall;
    result.f1 = metrics.f1;
    result.ndcg = metrics.ndcg;
    result.coverage = metrics.coverage;

    for (int i = 0; i < userCount; i++) {
        freeRecommendationSet(&sets[i]);
    }
    free(users);
    free(sets);
    return result;
}

static void runMethodComparison(Graph* baseGraph, Dataset* baseDataset, PropagationConfig config, int topK, ExperimentResults* output) {
    for (int i = 0; i < METHOD_COUNT; i++) {
        output->benchmark[i] = evaluateMethod(baseGraph, baseDataset, METHODS[i], config, topK, 40);
    }
}

static int firstActiveUser(Graph* graph) {
    for (int userId = 1; userId <= graph->userCount; userId++) {
        if (getDegree(graph, userNodeId(userId)) > 0) {
            return userId;
        }
    }
    return 1;
}

static void runGraphSizeExperiment(PropagationConfig config, int topK, ExperimentResults* output) {
    int users[GRAPH_SIZE_EXPERIMENT_COUNT] = {100, 1000, 5000, 10000};
    int items[GRAPH_SIZE_EXPERIMENT_COUNT] = {50, 500, 2000, 5000};
    int interactions[GRAPH_SIZE_EXPERIMENT_COUNT] = {500, 10000, 50000, 100000};

    for (int i = 0; i < GRAPH_SIZE_EXPERIMENT_COUNT; i++) {
        Dataset dataset = generateSyntheticDataset(
            users[i],
            items[i],
            interactions[i],
            DISTRIBUTION_POWER_LAW,
            0.3,
            1.2,
            (unsigned int)(100 + i),
            0.2
        );
        Graph* graph = buildGraphFromDataset(&dataset);
        int targetUser = firstActiveUser(graph);
        RecommendationSet set = generateRecommendations(graph, targetUser, METHOD_WEIGHTED_INFLUENCE, config, topK);

        output->graphSize[i].users = users[i];
        output->graphSize[i].items = items[i];
        output->graphSize[i].interactions = interactions[i];
        output->graphSize[i].graphMemoryMB = estimateGraphMemoryMB(graph);
        output->graphSize[i].runMemoryMB = estimateGraphMemoryMB(graph) + ((double)graph->totalNodes * 4.0 * sizeof(double)) / (1024.0 * 1024.0);
        output->graphSize[i].latencyMs = set.runtimeMs;
        output->graphSize[i].rankingMs = set.rankingMs;
        output->graphSize[i].candidateCount = set.candidateCount;
        output->graphSize[i].visitedNodes = set.visitedNodes;

        freeRecommendationSet(&set);
        freeGraph(graph);
        freeDataset(&dataset);
    }
}

static void runSparsityExperiment(PropagationConfig config, int topK, ExperimentResults* output) {
    double densities[SPARSITY_EXPERIMENT_COUNT] = {0.001, 0.005, 0.010, 0.050};
    const char* labels[SPARSITY_EXPERIMENT_COUNT] = {"very sparse", "sparse", "medium", "dense"};

    for (int i = 0; i < SPARSITY_EXPERIMENT_COUNT; i++) {
        Dataset dataset = generateSyntheticDatasetByDensity(
            1000,
            500,
            densities[i],
            DISTRIBUTION_POWER_LAW,
            0.3,
            1.2,
            (unsigned int)(210 + i),
            0.2
        );
        Graph* graph = buildGraphFromDataset(&dataset);
        BenchmarkResult benchmark = evaluateMethod(graph, &dataset, METHOD_WEIGHTED_INFLUENCE, config, topK, 35);

        output->sparsity[i].label = labels[i];
        output->sparsity[i].density = densities[i];
        output->sparsity[i].precision = benchmark.precision;
        output->sparsity[i].recall = benchmark.recall;
        output->sparsity[i].coverage = benchmark.coverage;
        output->sparsity[i].candidateCount = benchmark.candidateCount;

        freeGraph(graph);
        freeDataset(&dataset);
    }
}

static void runDepthExperiment(Graph* baseGraph, Dataset* baseDataset, PropagationConfig config, int topK, ExperimentResults* output) {
    for (int depth = 1; depth <= DEPTH_EXPERIMENT_COUNT; depth++) {
        PropagationConfig depthConfig = config;
        BenchmarkResult benchmark;
        depthConfig.maxDepth = depth;
        benchmark = evaluateMethod(baseGraph, baseDataset, METHOD_NEIGHBORHOOD, depthConfig, topK, 35);

        output->depth[depth - 1].depth = depth;
        output->depth[depth - 1].precision = benchmark.precision;
        output->depth[depth - 1].recall = benchmark.recall;
        output->depth[depth - 1].runtimeMs = benchmark.runtimeMs;
        output->depth[depth - 1].visitedNodes = benchmark.visitedNodes;
        output->depth[depth - 1].candidateCount = benchmark.candidateCount;
    }
}

static void runDegreeImbalanceExperiment(PropagationConfig config, int topK, ExperimentResults* output) {
    DistributionType distributions[DEGREE_IMBALANCE_EXPERIMENT_COUNT] = {
        DISTRIBUTION_UNIFORM,
        DISTRIBUTION_POWER_LAW
    };
    const char* labels[DEGREE_IMBALANCE_EXPERIMENT_COUNT] = {"uniform", "power-law"};

    for (int i = 0; i < DEGREE_IMBALANCE_EXPERIMENT_COUNT; i++) {
        Dataset dataset = generateSyntheticDataset(
            1000,
            500,
            10000,
            distributions[i],
            0.3,
            1.2,
            (unsigned int)(310 + i),
            0.2
        );
        Graph* graph = buildGraphFromDataset(&dataset);
        int maxUsers = 40;
        int* users = (int*)malloc((size_t)maxUsers * sizeof(int));
        RecommendationSet* sets = (RecommendationSet*)malloc((size_t)maxUsers * sizeof(RecommendationSet));
        int userCount;
        MetricsResult metrics;

        if (!users || !sets) {
            fprintf(stderr, "Failed to allocate degree imbalance arrays.\n");
            free(users);
            free(sets);
            freeGraph(graph);
            freeDataset(&dataset);
            exit(EXIT_FAILURE);
        }

        userCount = collectEvaluationUsers(graph, &dataset, users, maxUsers);
        for (int userIndex = 0; userIndex < userCount; userIndex++) {
            sets[userIndex] = generateRecommendations(graph, users[userIndex], METHOD_WEIGHTED_INFLUENCE, config, topK);
        }
        metrics = evaluateRecommendationSets(sets, userCount, &dataset, dataset.itemCount, topK);

        output->degreeImbalance[i].distribution = labels[i];
        output->degreeImbalance[i].precision = metrics.precision;
        output->degreeImbalance[i].recall = metrics.recall;
        output->degreeImbalance[i].popularItemRatio = computePopularItemRatio(graph, sets, userCount);
        output->degreeImbalance[i].diversity = computeRecommendationDiversity(sets, userCount, dataset.itemCount);

        for (int userIndex = 0; userIndex < userCount; userIndex++) {
            freeRecommendationSet(&sets[userIndex]);
        }
        free(users);
        free(sets);
        freeGraph(graph);
        freeDataset(&dataset);
    }
}

void runAllExperiments(Graph* baseGraph, Dataset* baseDataset, PropagationConfig config, int topK, ExperimentResults* output) {
    runMethodComparison(baseGraph, baseDataset, config, topK, output);
    runGraphSizeExperiment(config, topK, output);
    runSparsityExperiment(config, topK, output);
    runDepthExperiment(baseGraph, baseDataset, config, topK, output);
    runDegreeImbalanceExperiment(config, topK, output);
}
