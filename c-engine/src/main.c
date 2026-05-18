#include "csv_writer.h"
#include "experiments.h"
#include "json_exporter.h"
#include "utils.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static Graph* buildGraphFromDataset(Dataset* dataset) {
    Graph* graph = createGraph(dataset->userCount, dataset->itemCount);
    for (int i = 0; i < dataset->trainCount; i++) {
        addInteraction(graph, dataset->train[i].userId, dataset->train[i].itemId, dataset->train[i].weight);
    }
    return graph;
}

static void printSampleRecommendations(RecommendationSet* sets, int setCount) {
    printf("Sample dashboard recommendations:\n");
    for (int i = 0; i < setCount && i < METHOD_COUNT; i++) {
        printf("  U%d / %s:", sets[i].userId, methodKey(sets[i].method));
        for (int j = 0; j < sets[i].count && j < 3; j++) {
            printf(" I%d(%.4f)", sets[i].items[j].itemId, sets[i].items[j].score);
        }
        printf("\n");
    }
}

int main(void) {
    const int topK = 10;
    const int dashboardUserCount = 40;
    const int baseUsers = 1000;
    const int baseItems = 500;
    const int baseInteractions = 10000;
    const char* cResultsDir;
    const char* rootResultsDir;
    Dataset dataset;
    Graph* graph;
    PropagationConfig config;
    ExperimentResults experiments;
    PropagationMethod methods[METHOD_COUNT] = {
        METHOD_NEIGHBORHOOD,
        METHOD_RANDOM_WALK_RESTART,
        METHOD_SPREADING_ACTIVATION,
        METHOD_WEIGHTED_INFLUENCE
    };
    RecommendationSet* dashboardSets;
    int setIndex = 0;
    char* dashboardPath;
    double startMs = nowMs();

    if (directoryExists("include") && directoryExists("src")) {
        cResultsDir = "results";
        rootResultsDir = "../results";
    } else {
        cResultsDir = "c-engine/results";
        rootResultsDir = "results";
    }

    memset(&experiments, 0, sizeof(experiments));

    config.maxDepth = 3;
    config.decayFactor = 0.7;
    config.restartProbability = 0.15;
    config.maxIterations = 30;
    config.convergenceThreshold = 1e-6;
    config.minActivation = 1e-6;
    config.weightExponent = 1.5;

    printf("Graph-Based Recommendation Propagation Engine in C\n");
    printf("Generating synthetic data: users=%d items=%d interactions=%d distribution=power-law seed=42\n",
        baseUsers,
        baseItems,
        baseInteractions
    );

    dataset = generateSyntheticDataset(
        baseUsers,
        baseItems,
        baseInteractions,
        DISTRIBUTION_POWER_LAW,
        0.3,
        1.2,
        42,
        0.2
    );

    graph = buildGraphFromDataset(&dataset);
    printGraphSummary(graph);
    printf("Train interactions: %d, hidden test interactions: %d\n", dataset.trainCount, dataset.testCount);

    printf("Running method comparison, graph size, sparsity, depth, and degree imbalance experiments...\n");
    runAllExperiments(graph, &dataset, config, topK, &experiments);

    printf("Generating dashboard recommendation sets for first %d users and all methods...\n", dashboardUserCount);
    dashboardSets = (RecommendationSet*)malloc((size_t)dashboardUserCount * METHOD_COUNT * sizeof(RecommendationSet));
    if (!dashboardSets) {
        fprintf(stderr, "Failed to allocate dashboard recommendation sets.\n");
        freeGraph(graph);
        freeDataset(&dataset);
        return EXIT_FAILURE;
    }

    for (int userId = 1; userId <= dashboardUserCount; userId++) {
        for (int methodIndex = 0; methodIndex < METHOD_COUNT; methodIndex++) {
            dashboardSets[setIndex++] = generateRecommendations(graph, userId, methods[methodIndex], config, topK);
        }
    }

    printSampleRecommendations(dashboardSets, setIndex);

    writeAllCsvResults(cResultsDir, rootResultsDir, &experiments);
    printf("CSV results generated in %s\n", cResultsDir);
    printf("CSV results mirrored to %s\n", rootResultsDir);

    dashboardPath = detectDashboardOutputPath();
    if (!exportDashboardJson(
            dashboardPath,
            graph,
            &experiments,
            dashboardSets,
            setIndex,
            dashboardUserCount,
            methods,
            METHOD_COUNT
        )) {
        free(dashboardPath);
        for (int i = 0; i < setIndex; i++) {
            freeRecommendationSet(&dashboardSets[i]);
        }
        free(dashboardSets);
        freeGraph(graph);
        freeDataset(&dataset);
        return EXIT_FAILURE;
    }

    printf("Dashboard JSON generated at %s\n", dashboardPath);
    printf("Total C engine runtime: %.2f ms\n", nowMs() - startMs);

    free(dashboardPath);
    for (int i = 0; i < setIndex; i++) {
        freeRecommendationSet(&dashboardSets[i]);
    }
    free(dashboardSets);
    freeGraph(graph);
    freeDataset(&dataset);
    return EXIT_SUCCESS;
}
