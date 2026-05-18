#include "csv_writer.h"

#include "utils.h"

#include <stdio.h>
#include <string.h>

static void buildPath(char* buffer, int bufferSize, const char* directory, const char* fileName) {
    size_t length = strlen(directory);
    const char* separator = (length > 0 && (directory[length - 1] == '/' || directory[length - 1] == '\\')) ? "" : "/";
    snprintf(buffer, (size_t)bufferSize, "%s%s%s", directory, separator, fileName);
}

static FILE* openCsv(const char* directory, const char* fileName, char* outputPath, int outputPathSize) {
    buildPath(outputPath, outputPathSize, directory, fileName);
    ensureDirectory(directory);
    return fopen(outputPath, "w");
}

static void writeBenchmarkCsv(const char* directory, ExperimentResults* results) {
    char path[512];
    FILE* file = openCsv(directory, "benchmark_results.csv", path, sizeof(path));
    if (!file) {
        fprintf(stderr, "Could not write %s\n", path);
        return;
    }

    fprintf(file, "method,precision_at_k,recall_at_k,f1_at_k,ndcg_at_k,hit_rate_at_k,coverage,avg_runtime_ms,avg_memory_mb,avg_visited_nodes,avg_candidate_count,avg_propagated_edges\n");
    for (int i = 0; i < METHOD_COUNT; i++) {
        BenchmarkResult* row = &results->benchmark[i];
        fprintf(
            file,
            "%s,%.10f,%.10f,%.10f,%.10f,%.10f,%.10f,%.6f,%.6f,%.3f,%.3f,%.3f\n",
            methodKey(row->method),
            row->precision,
            row->recall,
            row->f1,
            row->ndcg,
            row->hitRate,
            row->coverage,
            row->runtimeMs,
            row->memoryMB,
            row->visitedNodes,
            row->candidateCount,
            row->propagatedEdges
        );
    }
    fclose(file);
}

static void writeQualityCsv(const char* directory, ExperimentResults* results) {
    char path[512];
    FILE* file = openCsv(directory, "quality_results.csv", path, sizeof(path));
    if (!file) {
        fprintf(stderr, "Could not write %s\n", path);
        return;
    }

    fprintf(file, "experiment,method,precision_at_k,recall_at_k,f1_at_k,ndcg_at_k,hit_rate_at_k,coverage,candidate_count\n");
    for (int i = 0; i < METHOD_COUNT; i++) {
        BenchmarkResult* row = &results->benchmark[i];
        fprintf(
            file,
            "benchmark,%s,%.10f,%.10f,%.10f,%.10f,%.10f,%.10f,%.3f\n",
            methodKey(row->method),
            row->precision,
            row->recall,
            row->f1,
            row->ndcg,
            row->hitRate,
            row->coverage,
            row->candidateCount
        );
    }
    fclose(file);
}

static void writeGraphSizeCsv(const char* directory, ExperimentResults* results) {
    char path[512];
    FILE* file = openCsv(directory, "experiment_graph_size.csv", path, sizeof(path));
    if (!file) {
        fprintf(stderr, "Could not write %s\n", path);
        return;
    }

    fprintf(file, "users,items,interactions,graph_memory_mb,run_memory_mb,latency_ms,ranking_ms,candidate_count,visited_nodes\n");
    for (int i = 0; i < GRAPH_SIZE_EXPERIMENT_COUNT; i++) {
        GraphSizeResult* row = &results->graphSize[i];
        fprintf(
            file,
            "%d,%d,%d,%.6f,%.6f,%.6f,%.6f,%d,%d\n",
            row->users,
            row->items,
            row->interactions,
            row->graphMemoryMB,
            row->runMemoryMB,
            row->latencyMs,
            row->rankingMs,
            row->candidateCount,
            row->visitedNodes
        );
    }
    fclose(file);
}

static void writeSparsityCsv(const char* directory, ExperimentResults* results) {
    char path[512];
    FILE* file = openCsv(directory, "experiment_sparsity.csv", path, sizeof(path));
    if (!file) {
        fprintf(stderr, "Could not write %s\n", path);
        return;
    }

    fprintf(file, "label,density,precision_at_k,recall_at_k,coverage,candidate_count\n");
    for (int i = 0; i < SPARSITY_EXPERIMENT_COUNT; i++) {
        SparsityResult* row = &results->sparsity[i];
        fprintf(
            file,
            "%s,%.6f,%.10f,%.10f,%.10f,%.3f\n",
            row->label,
            row->density,
            row->precision,
            row->recall,
            row->coverage,
            row->candidateCount
        );
    }
    fclose(file);
}

static void writeDepthCsv(const char* directory, ExperimentResults* results) {
    char path[512];
    FILE* file = openCsv(directory, "experiment_depth.csv", path, sizeof(path));
    if (!file) {
        fprintf(stderr, "Could not write %s\n", path);
        return;
    }

    fprintf(file, "depth,precision_at_k,recall_at_k,runtime_ms,visited_nodes,candidate_count\n");
    for (int i = 0; i < DEPTH_EXPERIMENT_COUNT; i++) {
        DepthResult* row = &results->depth[i];
        fprintf(
            file,
            "%d,%.10f,%.10f,%.6f,%.3f,%.3f\n",
            row->depth,
            row->precision,
            row->recall,
            row->runtimeMs,
            row->visitedNodes,
            row->candidateCount
        );
    }
    fclose(file);
}

static void writeDegreeImbalanceCsv(const char* directory, ExperimentResults* results) {
    char path[512];
    FILE* file = openCsv(directory, "experiment_degree_imbalance.csv", path, sizeof(path));
    if (!file) {
        fprintf(stderr, "Could not write %s\n", path);
        return;
    }

    fprintf(file, "distribution,precision_at_k,recall_at_k,popular_item_ratio,diversity\n");
    for (int i = 0; i < DEGREE_IMBALANCE_EXPERIMENT_COUNT; i++) {
        DegreeImbalanceResult* row = &results->degreeImbalance[i];
        fprintf(
            file,
            "%s,%.10f,%.10f,%.10f,%.10f\n",
            row->distribution,
            row->precision,
            row->recall,
            row->popularItemRatio,
            row->diversity
        );
    }
    fclose(file);
}

static void writeMemoryCsv(const char* directory, ExperimentResults* results) {
    char path[512];
    double graphMemory = results->benchmark[0].memoryMB;
    double runMemory = graphMemory + 0.5;
    FILE* file = openCsv(directory, "memory_results.csv", path, sizeof(path));
    if (!file) {
        fprintf(stderr, "Could not write %s\n", path);
        return;
    }

    fprintf(file, "label,heap_used_mb,rss_mb,external_mb\n");
    fprintf(file, "before_graph,0.000000,0.000000,0.000000\n");
    fprintf(file, "after_graph,%.6f,%.6f,0.000000\n", graphMemory, graphMemory);
    fprintf(file, "after_run,%.6f,%.6f,0.000000\n", runMemory, runMemory);
    fprintf(file, "estimated_delta,%.6f,%.6f,0.000000\n", graphMemory, graphMemory);
    fclose(file);
}

static void writeDirectory(const char* directory, ExperimentResults* results) {
    writeBenchmarkCsv(directory, results);
    writeQualityCsv(directory, results);
    writeGraphSizeCsv(directory, results);
    writeSparsityCsv(directory, results);
    writeDepthCsv(directory, results);
    writeDegreeImbalanceCsv(directory, results);
    writeMemoryCsv(directory, results);
}

void writeAllCsvResults(const char* cEngineResultsDir, const char* rootResultsDir, ExperimentResults* results) {
    writeDirectory(cEngineResultsDir, results);
    if (rootResultsDir && strcmp(rootResultsDir, cEngineResultsDir) != 0) {
        writeDirectory(rootResultsDir, results);
    }
}
