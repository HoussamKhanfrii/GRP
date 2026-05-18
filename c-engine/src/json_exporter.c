#include "json_exporter.h"

#include "utils.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static char* duplicateString(const char* value) {
    size_t length = strlen(value);
    char* copy = (char*)malloc(length + 1);
    if (!copy) {
        fprintf(stderr, "Failed to allocate path string.\n");
        exit(EXIT_FAILURE);
    }
    strcpy(copy, value);
    return copy;
}

char* detectDashboardOutputPath(void) {
    if (directoryExists("../dashboard/public")) {
        printf("Detected Vite dashboard public folder: ../dashboard/public\n");
        printf("Writing dashboard JSON to ../dashboard/public/engine-output.json for served path /engine-output.json\n");
        return duplicateString("../dashboard/public/engine-output.json");
    }
    if (directoryExists("dashboard/public")) {
        printf("Detected Vite dashboard public folder: dashboard/public\n");
        printf("Writing dashboard JSON to dashboard/public/engine-output.json for served path /engine-output.json\n");
        return duplicateString("dashboard/public/engine-output.json");
    }
    if (directoryExists("../public")) {
        printf("Detected root public folder: ../public\n");
        printf("Writing dashboard JSON to ../public/engine-output.json for served path /engine-output.json\n");
        return duplicateString("../public/engine-output.json");
    }
    if (directoryExists("public")) {
        printf("Detected root public folder: public\n");
        printf("Writing dashboard JSON to public/engine-output.json for served path /engine-output.json\n");
        return duplicateString("public/engine-output.json");
    }
    if (directoryExists("../dashboard")) {
        printf("No public folder existed, but ../dashboard was found. Creating ../dashboard/public for Vite served path /engine-output.json\n");
        ensureDirectory("../dashboard/public");
        return duplicateString("../dashboard/public/engine-output.json");
    }
    printf("No dashboard public folder found. Creating public/engine-output.json for served path /engine-output.json\n");
    ensureDirectory("public");
    return duplicateString("public/engine-output.json");
}

static void writeIndent(FILE* file, int indent) {
    for (int i = 0; i < indent; i++) {
        fputc(' ', file);
    }
}

static void writePathArray(FILE* file, Graph* graph, RecommendationItem* item) {
    fprintf(file, "[");
    for (int i = 0; i < item->pathLength; i++) {
        char label[32];
        nodeLabel(graph, item->pathNodes[i], label, sizeof(label));
        fprintf(file, "\"%s\"%s", label, i + 1 < item->pathLength ? ", " : "");
    }
    fprintf(file, "]");
}

static void writeRecommendations(FILE* file, Graph* graph, RecommendationSet* sets, int setCount) {
    fprintf(file, "  \"recommendations\": [\n");
    for (int i = 0; i < setCount; i++) {
        fprintf(file, "    {\n");
        fprintf(file, "      \"userId\": \"U%d\",\n", sets[i].userId);
        fprintf(file, "      \"method\": \"%s\",\n", methodKey(sets[i].method));
        fprintf(file, "      \"items\": [\n");
        for (int j = 0; j < sets[i].count; j++) {
            fprintf(file, "        { \"itemId\": \"I%d\", \"score\": %.12f, \"rank\": %d, \"path\": ",
                sets[i].items[j].itemId,
                sets[i].items[j].score,
                sets[i].items[j].rank
            );
            writePathArray(file, graph, &sets[i].items[j]);
            fprintf(file, " }%s\n", j + 1 < sets[i].count ? "," : "");
        }
        fprintf(file, "      ]\n");
        fprintf(file, "    }%s\n", i + 1 < setCount ? "," : "");
    }
    fprintf(file, "  ],\n");
}

static void writeBenchmarkResults(FILE* file, ExperimentResults* experiments) {
    fprintf(file, "  \"benchmarkResults\": [\n");
    for (int i = 0; i < METHOD_COUNT; i++) {
        BenchmarkResult* row = &experiments->benchmark[i];
        fprintf(file, "    { \"method\": \"%s\", \"precision\": %.10f, \"recall\": %.10f, \"ndcg\": %.10f, \"runtimeMs\": %.6f, \"memoryMB\": %.6f, \"visitedNodes\": %.3f, \"candidateCount\": %.3f }%s\n",
            methodKey(row->method),
            row->precision,
            row->recall,
            row->ndcg,
            row->runtimeMs,
            row->memoryMB,
            row->visitedNodes,
            row->candidateCount,
            i + 1 < METHOD_COUNT ? "," : ""
        );
    }
    fprintf(file, "  ],\n");
}

static void writeGraphSizeExperiment(FILE* file, ExperimentResults* experiments) {
    fprintf(file, "  \"graphSizeExperiment\": [\n");
    for (int i = 0; i < GRAPH_SIZE_EXPERIMENT_COUNT; i++) {
        GraphSizeResult* row = &experiments->graphSize[i];
        fprintf(file, "    { \"users\": %d, \"items\": %d, \"interactions\": %d, \"latencyMs\": %.6f, \"memoryMB\": %.6f, \"rankingMs\": %.6f, \"candidateCount\": %d, \"visitedNodes\": %d }%s\n",
            row->users,
            row->items,
            row->interactions,
            row->latencyMs,
            row->runMemoryMB,
            row->rankingMs,
            row->candidateCount,
            row->visitedNodes,
            i + 1 < GRAPH_SIZE_EXPERIMENT_COUNT ? "," : ""
        );
    }
    fprintf(file, "  ],\n");
}

static void writeSparsityExperiment(FILE* file, ExperimentResults* experiments) {
    fprintf(file, "  \"sparsityExperiment\": [\n");
    for (int i = 0; i < SPARSITY_EXPERIMENT_COUNT; i++) {
        SparsityResult* row = &experiments->sparsity[i];
        fprintf(file, "    { \"label\": \"%s\", \"density\": %.6f, \"precision\": %.10f, \"recall\": %.10f, \"coverage\": %.10f, \"candidateCount\": %.3f }%s\n",
            row->label,
            row->density,
            row->precision,
            row->recall,
            row->coverage,
            row->candidateCount,
            i + 1 < SPARSITY_EXPERIMENT_COUNT ? "," : ""
        );
    }
    fprintf(file, "  ],\n");
}

static void writeDepthExperiment(FILE* file, ExperimentResults* experiments) {
    fprintf(file, "  \"depthExperiment\": [\n");
    for (int i = 0; i < DEPTH_EXPERIMENT_COUNT; i++) {
        DepthResult* row = &experiments->depth[i];
        fprintf(file, "    { \"depth\": %d, \"precision\": %.10f, \"recall\": %.10f, \"runtimeMs\": %.6f, \"visitedNodes\": %.3f, \"candidateCount\": %.3f }%s\n",
            row->depth,
            row->precision,
            row->recall,
            row->runtimeMs,
            row->visitedNodes,
            row->candidateCount,
            i + 1 < DEPTH_EXPERIMENT_COUNT ? "," : ""
        );
    }
    fprintf(file, "  ],\n");
}

static void writeDegreeImbalanceExperiment(FILE* file, ExperimentResults* experiments) {
    fprintf(file, "  \"degreeImbalanceExperiment\": [\n");
    for (int i = 0; i < DEGREE_IMBALANCE_EXPERIMENT_COUNT; i++) {
        DegreeImbalanceResult* row = &experiments->degreeImbalance[i];
        fprintf(file, "    { \"distribution\": \"%s\", \"precision\": %.10f, \"recall\": %.10f, \"popularItemRatio\": %.10f, \"diversity\": %.10f }%s\n",
            row->distribution,
            row->precision,
            row->recall,
            row->popularItemRatio,
            row->diversity,
            i + 1 < DEGREE_IMBALANCE_EXPERIMENT_COUNT ? "," : ""
        );
    }
    fprintf(file, "  ],\n");
}

static void writeDegreeDistribution(FILE* file, Graph* graph) {
    int maxDegree = 0;
    int* distribution = computeDegreeDistribution(graph, &maxDegree);
    fprintf(file, "  \"degreeDistribution\": {\n");
    for (int degree = 0; degree <= maxDegree; degree++) {
        writeIndent(file, 4);
        fprintf(file, "\"%d\": %d%s\n", degree, distribution[degree], degree < maxDegree ? "," : "");
    }
    fprintf(file, "  },\n");
    free(distribution);
}

static void writePopularItems(FILE* file, Graph* graph) {
    int topN = graph->itemCount < 10 ? graph->itemCount : 10;
    PopularItem* popularItems = (PopularItem*)calloc((size_t)topN, sizeof(PopularItem));
    computePopularItems(graph, popularItems, topN);

    fprintf(file, "  \"popularItems\": [\n");
    for (int i = 0; i < topN; i++) {
        fprintf(file, "    { \"itemId\": \"I%d\", \"degree\": %d, \"weightSum\": %.10f }%s\n",
            popularItems[i].itemId,
            popularItems[i].degree,
            popularItems[i].weightSum,
            i + 1 < topN ? "," : ""
        );
    }
    fprintf(file, "  ]\n");
    free(popularItems);
}

int exportDashboardJson(
    const char* outputPath,
    Graph* graph,
    ExperimentResults* experiments,
    RecommendationSet* recommendationSets,
    int recommendationSetCount,
    int dashboardUserCount,
    PropagationMethod* methods,
    int methodCount
) {
    FILE* file;
    char timestamp[64];
    char directory[512];
    char* slash;

    strncpy(directory, outputPath, sizeof(directory) - 1);
    directory[sizeof(directory) - 1] = '\0';
    slash = strrchr(directory, '/');
    if (!slash) {
        slash = strrchr(directory, '\\');
    }
    if (slash) {
        *slash = '\0';
        ensureDirectory(directory);
    }

    file = fopen(outputPath, "w");
    if (!file) {
        fprintf(stderr, "Could not write dashboard JSON: %s\n", outputPath);
        return 0;
    }

    if (dashboardUserCount > graph->userCount) {
        dashboardUserCount = graph->userCount;
    }

    formatIsoTimestamp(timestamp, sizeof(timestamp));

    fprintf(file, "{\n");
    fprintf(file, "  \"generatedAt\": \"%s\",\n", timestamp);
    fprintf(file, "  \"users\": [");
    for (int i = 1; i <= dashboardUserCount; i++) {
        fprintf(file, "\"U%d\"%s", i, i < dashboardUserCount ? ", " : "");
    }
    fprintf(file, "],\n");

    fprintf(file, "  \"methods\": [");
    for (int i = 0; i < methodCount; i++) {
        fprintf(file, "\"%s\"%s", methodKey(methods[i]), i + 1 < methodCount ? ", " : "");
    }
    fprintf(file, "],\n");

    fprintf(file, "  \"graphStats\": {\n");
    fprintf(file, "    \"users\": %d,\n", graph->userCount);
    fprintf(file, "    \"items\": %d,\n", graph->itemCount);
    fprintf(file, "    \"interactions\": %d,\n", graph->edgeCount);
    fprintf(file, "    \"density\": %.10f,\n", computeDensity(graph));
    fprintf(file, "    \"sparsity\": %.10f,\n", computeSparsity(graph));
    fprintf(file, "    \"averageDegree\": %.10f,\n", computeAverageDegree(graph));
    fprintf(file, "    \"memoryMB\": %.10f\n", estimateGraphMemoryMB(graph));
    fprintf(file, "  },\n");

    writeRecommendations(file, graph, recommendationSets, recommendationSetCount);
    writeBenchmarkResults(file, experiments);
    writeGraphSizeExperiment(file, experiments);
    writeSparsityExperiment(file, experiments);
    writeDepthExperiment(file, experiments);
    writeDegreeImbalanceExperiment(file, experiments);
    writeDegreeDistribution(file, graph);
    writePopularItems(file, graph);
    fprintf(file, "}\n");

    fclose(file);
    return 1;
}
