#include "recommendation.h"

#include "heap.h"
#include "stack.h"
#include "utils.h"

#include <stdio.h>
#include <stdlib.h>

const char* methodKey(PropagationMethod method) {
    switch (method) {
        case METHOD_NEIGHBORHOOD:
            return "neighborhood";
        case METHOD_RANDOM_WALK_RESTART:
            return "randomWalkRestart";
        case METHOD_SPREADING_ACTIVATION:
            return "spreadingActivation";
        case METHOD_WEIGHTED_INFLUENCE:
            return "weightedInfluence";
        default:
            return "unknown";
    }
}

void nodeLabel(Graph* graph, int nodeId, char* buffer, int bufferSize) {
    if (isUserNode(graph, nodeId)) {
        snprintf(buffer, (size_t)bufferSize, "U%d", nodeToUserId(nodeId));
    } else if (isItemNode(graph, nodeId)) {
        snprintf(buffer, (size_t)bufferSize, "I%d", nodeToItemId(graph, nodeId));
    } else {
        snprintf(buffer, (size_t)bufferSize, "N%d", nodeId);
    }
}

static PropagationResult* runMethod(Graph* graph, int targetUserId, PropagationMethod method, PropagationConfig config) {
    switch (method) {
        case METHOD_NEIGHBORHOOD:
            return runNeighborhoodExpansion(graph, targetUserId, config.maxDepth, config.decayFactor);
        case METHOD_RANDOM_WALK_RESTART:
            return runRandomWalkWithRestart(
                graph,
                targetUserId,
                config.restartProbability,
                config.maxIterations,
                config.convergenceThreshold
            );
        case METHOD_SPREADING_ACTIVATION:
            return runSpreadingActivation(
                graph,
                targetUserId,
                config.maxDepth,
                config.decayFactor,
                config.minActivation
            );
        case METHOD_WEIGHTED_INFLUENCE:
            return runWeightedInfluenceDiffusion(
                graph,
                targetUserId,
                config.maxDepth,
                config.decayFactor,
                config.weightExponent,
                config.minActivation
            );
        default:
            return runNeighborhoodExpansion(graph, targetUserId, config.maxDepth, config.decayFactor);
    }
}

static void buildExplanationPath(
    Graph* graph,
    int targetUserId,
    int itemId,
    int* predecessor,
    RecommendationItem* item
) {
    int startNode = userNodeId(targetUserId);
    int current = itemNodeId(graph, itemId);
    Stack* stack = createStack();
    int* seen = (int*)calloc((size_t)graph->totalNodes, sizeof(int));
    int foundStart = 0;
    int steps = 0;

    if (!seen) {
        fprintf(stderr, "Failed to allocate path reconstruction scratch space.\n");
        freeStack(stack);
        exit(EXIT_FAILURE);
    }

    while (current >= 0 && current < graph->totalNodes && steps < MAX_EXPLANATION_PATH && !seen[current]) {
        push(stack, current);
        if (current == startNode) {
            foundStart = 1;
            break;
        }
        seen[current] = 1;
        current = predecessor[current];
        steps++;
    }

    item->pathLength = 0;
    if (foundStart) {
        while (!isStackEmpty(stack) && item->pathLength < MAX_EXPLANATION_PATH) {
            item->pathNodes[item->pathLength++] = pop(stack);
        }
    } else {
        item->pathNodes[item->pathLength++] = startNode;
        item->pathNodes[item->pathLength++] = itemNodeId(graph, itemId);
    }

    free(seen);
    freeStack(stack);
}

/*
 * Full recommendation pipeline:
 * 1. run propagation, 2. keep item nodes, 3. filter existing interactions,
 * 4. rank candidates with a min-heap, 5. return Top-K.
 * Time complexity after propagation: O(I log K), where I is item count.
 */
RecommendationSet generateRecommendations(
    Graph* graph,
    int targetUserId,
    PropagationMethod method,
    PropagationConfig config,
    int topK
) {
    RecommendationSet set;
    PropagationResult* propagation;
    MinHeap* heap;
    HeapNode* ranked;
    double rankingStart;

    set.userId = targetUserId;
    set.method = method;
    set.items = NULL;
    set.count = 0;
    set.candidateCount = 0;
    set.visitedNodes = 0;
    set.propagatedEdges = 0;
    set.runtimeMs = 0.0;
    set.rankingMs = 0.0;

    if (topK <= 0) {
        return set;
    }

    propagation = runMethod(graph, targetUserId, method, config);
    heap = createHeap(topK);
    rankingStart = nowMs();

    for (int itemId = 1; itemId <= graph->itemCount; itemId++) {
        double score = propagation->itemScores[itemId - 1];
        if (score <= 1e-12) {
            continue;
        }
        if (graphHasInteraction(graph, targetUserId, itemId)) {
            continue;
        }

        set.candidateCount++;
        {
            HeapNode node;
            node.itemId = itemId;
            node.score = score;
            heapPush(heap, node);
        }
    }

    set.rankingMs = nowMs() - rankingStart;
    set.count = heap->size;
    set.items = (RecommendationItem*)malloc((size_t)(set.count > 0 ? set.count : 1) * sizeof(RecommendationItem));
    ranked = (HeapNode*)malloc((size_t)(set.count > 0 ? set.count : 1) * sizeof(HeapNode));
    if (!set.items || !ranked) {
        fprintf(stderr, "Failed to allocate recommendation output.\n");
        free(set.items);
        free(ranked);
        freeHeap(heap);
        freePropagationResult(propagation);
        exit(EXIT_FAILURE);
    }

    for (int i = set.count - 1; i >= 0; i--) {
        ranked[i] = heapPop(heap);
    }

    for (int i = 0; i < set.count; i++) {
        set.items[i].itemId = ranked[i].itemId;
        set.items[i].score = ranked[i].score;
        set.items[i].rank = i + 1;
        buildExplanationPath(graph, targetUserId, ranked[i].itemId, propagation->predecessor, &set.items[i]);
    }

    set.visitedNodes = propagation->visitedNodes;
    set.propagatedEdges = propagation->propagatedEdges;
    set.runtimeMs = propagation->runtimeMs + set.rankingMs;

    free(ranked);
    freeHeap(heap);
    freePropagationResult(propagation);
    return set;
}

void freeRecommendationSet(RecommendationSet* set) {
    if (!set) {
        return;
    }
    free(set->items);
    set->items = NULL;
    set->count = 0;
}
