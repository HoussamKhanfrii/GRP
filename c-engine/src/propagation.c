#include "propagation.h"

#include "queue.h"
#include "utils.h"

#include <math.h>
#include <stdio.h>
#include <stdlib.h>

static void initializePredecessors(PropagationResult* result, int totalNodes) {
    for (int i = 0; i < totalNodes; i++) {
        result->predecessor[i] = -1;
        result->visited[i] = 0;
    }
}

static void finalizeCandidateCount(Graph* graph, PropagationResult* result) {
    result->candidateCount = 0;
    for (int itemId = 1; itemId <= graph->itemCount; itemId++) {
        if (result->itemScores[itemId - 1] > 1e-12) {
            result->candidateCount++;
        }
    }
}

PropagationResult* createPropagationResult(Graph* graph) {
    PropagationResult* result = (PropagationResult*)malloc(sizeof(PropagationResult));
    if (!result) {
        fprintf(stderr, "Failed to allocate propagation result.\n");
        exit(EXIT_FAILURE);
    }

    result->itemScores = (double*)calloc((size_t)graph->itemCount, sizeof(double));
    result->predecessor = (int*)malloc((size_t)graph->totalNodes * sizeof(int));
    result->visited = (int*)calloc((size_t)graph->totalNodes, sizeof(int));
    if (!result->itemScores || !result->predecessor || !result->visited) {
        fprintf(stderr, "Failed to allocate propagation arrays.\n");
        free(result->itemScores);
        free(result->predecessor);
        free(result->visited);
        free(result);
        exit(EXIT_FAILURE);
    }

    initializePredecessors(result, graph->totalNodes);
    result->visitedNodes = 0;
    result->candidateCount = 0;
    result->propagatedEdges = 0;
    result->runtimeMs = 0.0;
    return result;
}

void freePropagationResult(PropagationResult* result) {
    if (!result) {
        return;
    }
    free(result->itemScores);
    free(result->predecessor);
    free(result->visited);
    free(result);
}

/*
 * Neighborhood Expansion: BFS over adjacency lists using the manual queue.
 * Time complexity: O(|V_d| + |E_d|), where d is maxDepth and only the reached
 * subgraph is traversed.
 */
PropagationResult* runNeighborhoodExpansion(Graph* graph, int targetUserId, int maxDepth, double decayFactor) {
    double startMs = nowMs();
    PropagationResult* result = createPropagationResult(graph);
    Queue* queue = createQueue();
    int* depth = (int*)malloc((size_t)graph->totalNodes * sizeof(int));
    double* strength = (double*)calloc((size_t)graph->totalNodes, sizeof(double));
    int startNode = userNodeId(targetUserId);

    if (!depth || !strength) {
        fprintf(stderr, "Failed to allocate BFS scratch arrays.\n");
        free(depth);
        free(strength);
        freeQueue(queue);
        freePropagationResult(result);
        exit(EXIT_FAILURE);
    }

    for (int i = 0; i < graph->totalNodes; i++) {
        depth[i] = -1;
    }

    depth[startNode] = 0;
    strength[startNode] = 1.0;
    result->visited[startNode] = 1;
    enqueue(queue, startNode);

    while (!isQueueEmpty(queue)) {
        int node = dequeue(queue);
        result->visitedNodes++;

        if (depth[node] >= maxDepth) {
            continue;
        }

        EdgeNode* edge = getNeighbors(graph, node);
        while (edge) {
            int next = edge->neighborId;
            int nextDepth = depth[node] + 1;
            double propagated = strength[node] * decayFactor * edge->weight;
            result->propagatedEdges++;

            if (isItemNode(graph, next)) {
                int itemId = nodeToItemId(graph, next);
                result->itemScores[itemId - 1] += propagated;
            }

            if (nextDepth <= maxDepth) {
                if (depth[next] == -1) {
                    depth[next] = nextDepth;
                    strength[next] = propagated;
                    result->predecessor[next] = node;
                    result->visited[next] = 1;
                    enqueue(queue, next);
                } else if (propagated > strength[next]) {
                    strength[next] = propagated;
                    result->predecessor[next] = node;
                }
            }

            edge = edge->next;
        }
    }

    finalizeCandidateCount(graph, result);
    result->runtimeMs = nowMs() - startMs;

    free(depth);
    free(strength);
    freeQueue(queue);
    return result;
}

/*
 * Random Walk with Restart: iterative probability propagation.
 * Time complexity: O(iterations * (|V| + |E|)); each iteration scans every
 * adjacency list once.
 */
PropagationResult* runRandomWalkWithRestart(
    Graph* graph,
    int targetUserId,
    double restartProbability,
    int maxIterations,
    double convergenceThreshold
) {
    double startMs = nowMs();
    PropagationResult* result = createPropagationResult(graph);
    int startNode = userNodeId(targetUserId);
    double* current = (double*)calloc((size_t)graph->totalNodes, sizeof(double));
    double* next = (double*)calloc((size_t)graph->totalNodes, sizeof(double));
    double* weightSums = (double*)calloc((size_t)graph->totalNodes, sizeof(double));
    double* bestContribution = (double*)calloc((size_t)graph->totalNodes, sizeof(double));

    if (!current || !next || !weightSums || !bestContribution) {
        fprintf(stderr, "Failed to allocate RWR arrays.\n");
        free(current);
        free(next);
        free(weightSums);
        free(bestContribution);
        freePropagationResult(result);
        exit(EXIT_FAILURE);
    }

    for (int node = 0; node < graph->totalNodes; node++) {
        weightSums[node] = graphNodeWeightSum(graph, node);
    }

    current[startNode] = 1.0;

    for (int iteration = 0; iteration < maxIterations; iteration++) {
        double diff = 0.0;
        for (int node = 0; node < graph->totalNodes; node++) {
            next[node] = 0.0;
        }

        next[startNode] += restartProbability;

        for (int node = 0; node < graph->totalNodes; node++) {
            if (current[node] <= 0.0) {
                continue;
            }

            if (weightSums[node] <= 0.0) {
                next[startNode] += (1.0 - restartProbability) * current[node];
                continue;
            }

            EdgeNode* edge = getNeighbors(graph, node);
            while (edge) {
                double contribution = (1.0 - restartProbability) * current[node] * (edge->weight / weightSums[node]);
                next[edge->neighborId] += contribution;
                result->propagatedEdges++;
                if (edge->neighborId != startNode && contribution > bestContribution[edge->neighborId]) {
                    bestContribution[edge->neighborId] = contribution;
                    result->predecessor[edge->neighborId] = node;
                }
                edge = edge->next;
            }
        }

        for (int node = 0; node < graph->totalNodes; node++) {
            diff += fabs(next[node] - current[node]);
            current[node] = next[node];
        }

        if (diff < convergenceThreshold) {
            break;
        }
    }

    for (int node = 0; node < graph->totalNodes; node++) {
        if (current[node] > convergenceThreshold) {
            result->visited[node] = 1;
            result->visitedNodes++;
        }
    }

    for (int itemId = 1; itemId <= graph->itemCount; itemId++) {
        int itemNode = itemNodeId(graph, itemId);
        result->itemScores[itemId - 1] = current[itemNode];
    }

    finalizeCandidateCount(graph, result);
    result->runtimeMs = nowMs() - startMs;

    free(current);
    free(next);
    free(weightSums);
    free(bestContribution);
    return result;
}

/*
 * Spreading Activation: level-by-level activation diffusion.
 * Time complexity: O(depth * |E_reached|). Low activations are pruned.
 */
PropagationResult* runSpreadingActivation(
    Graph* graph,
    int targetUserId,
    int maxDepth,
    double decayFactor,
    double minActivation
) {
    double startMs = nowMs();
    PropagationResult* result = createPropagationResult(graph);
    int startNode = userNodeId(targetUserId);
    double* current = (double*)calloc((size_t)graph->totalNodes, sizeof(double));
    double* next = (double*)calloc((size_t)graph->totalNodes, sizeof(double));
    double* bestContribution = (double*)calloc((size_t)graph->totalNodes, sizeof(double));

    if (!current || !next || !bestContribution) {
        fprintf(stderr, "Failed to allocate spreading activation arrays.\n");
        free(current);
        free(next);
        free(bestContribution);
        freePropagationResult(result);
        exit(EXIT_FAILURE);
    }

    current[startNode] = 1.0;
    result->visited[startNode] = 1;
    result->visitedNodes = 1;

    for (int depth = 0; depth < maxDepth; depth++) {
        for (int node = 0; node < graph->totalNodes; node++) {
            next[node] = 0.0;
        }

        for (int node = 0; node < graph->totalNodes; node++) {
            if (current[node] < minActivation) {
                continue;
            }

            EdgeNode* edge = getNeighbors(graph, node);
            while (edge) {
                double transfer = current[node] * decayFactor * edge->weight;
                result->propagatedEdges++;

                if (transfer >= minActivation) {
                    next[edge->neighborId] += transfer;
                    if (!result->visited[edge->neighborId]) {
                        result->visited[edge->neighborId] = 1;
                        result->visitedNodes++;
                    }
                    if (edge->neighborId != startNode && transfer > bestContribution[edge->neighborId]) {
                        bestContribution[edge->neighborId] = transfer;
                        result->predecessor[edge->neighborId] = node;
                    }
                    if (isItemNode(graph, edge->neighborId)) {
                        int itemId = nodeToItemId(graph, edge->neighborId);
                        result->itemScores[itemId - 1] += transfer;
                    }
                }
                edge = edge->next;
            }
        }

        {
            double* swap = current;
            current = next;
            next = swap;
        }
    }

    finalizeCandidateCount(graph, result);
    result->runtimeMs = nowMs() - startMs;

    free(current);
    free(next);
    free(bestContribution);
    return result;
}

/*
 * Weighted Influence Diffusion: activation transfer normalized by weighted
 * outgoing edge strength.
 * Time complexity: O(depth * |E_reached| * avg degree scan for normalization).
 */
PropagationResult* runWeightedInfluenceDiffusion(
    Graph* graph,
    int targetUserId,
    int maxDepth,
    double decayFactor,
    double weightExponent,
    double minActivation
) {
    double startMs = nowMs();
    PropagationResult* result = createPropagationResult(graph);
    int startNode = userNodeId(targetUserId);
    double* current = (double*)calloc((size_t)graph->totalNodes, sizeof(double));
    double* next = (double*)calloc((size_t)graph->totalNodes, sizeof(double));
    double* normalizedSums = (double*)calloc((size_t)graph->totalNodes, sizeof(double));
    double* bestContribution = (double*)calloc((size_t)graph->totalNodes, sizeof(double));

    if (!current || !next || !normalizedSums || !bestContribution) {
        fprintf(stderr, "Failed to allocate weighted diffusion arrays.\n");
        free(current);
        free(next);
        free(normalizedSums);
        free(bestContribution);
        freePropagationResult(result);
        exit(EXIT_FAILURE);
    }

    for (int node = 0; node < graph->totalNodes; node++) {
        EdgeNode* edge = getNeighbors(graph, node);
        while (edge) {
            normalizedSums[node] += pow(edge->weight, weightExponent);
            edge = edge->next;
        }
    }

    current[startNode] = 1.0;
    result->visited[startNode] = 1;
    result->visitedNodes = 1;

    for (int depth = 0; depth < maxDepth; depth++) {
        for (int node = 0; node < graph->totalNodes; node++) {
            next[node] = 0.0;
        }

        for (int node = 0; node < graph->totalNodes; node++) {
            if (current[node] < minActivation || normalizedSums[node] <= 0.0) {
                continue;
            }

            EdgeNode* edge = getNeighbors(graph, node);
            while (edge) {
                double normalized = pow(edge->weight, weightExponent) / normalizedSums[node];
                double transfer = current[node] * decayFactor * normalized;
                result->propagatedEdges++;

                if (transfer >= minActivation) {
                    next[edge->neighborId] += transfer;
                    if (!result->visited[edge->neighborId]) {
                        result->visited[edge->neighborId] = 1;
                        result->visitedNodes++;
                    }
                    if (edge->neighborId != startNode && transfer > bestContribution[edge->neighborId]) {
                        bestContribution[edge->neighborId] = transfer;
                        result->predecessor[edge->neighborId] = node;
                    }
                    if (isItemNode(graph, edge->neighborId)) {
                        int itemId = nodeToItemId(graph, edge->neighborId);
                        result->itemScores[itemId - 1] += transfer;
                    }
                }
                edge = edge->next;
            }
        }

        {
            double* swap = current;
            current = next;
            next = swap;
        }
    }

    finalizeCandidateCount(graph, result);
    result->runtimeMs = nowMs() - startMs;

    free(current);
    free(next);
    free(normalizedSums);
    free(bestContribution);
    return result;
}
