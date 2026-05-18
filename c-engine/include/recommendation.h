#ifndef RECOMMENDATION_H
#define RECOMMENDATION_H

#include "graph.h"
#include "propagation.h"

#define MAX_EXPLANATION_PATH 32

typedef enum PropagationMethod {
    METHOD_NEIGHBORHOOD = 0,
    METHOD_RANDOM_WALK_RESTART = 1,
    METHOD_SPREADING_ACTIVATION = 2,
    METHOD_WEIGHTED_INFLUENCE = 3
} PropagationMethod;

typedef struct RecommendationItem {
    int itemId;
    double score;
    int rank;
    int pathNodes[MAX_EXPLANATION_PATH];
    int pathLength;
} RecommendationItem;

typedef struct RecommendationSet {
    int userId;
    PropagationMethod method;
    RecommendationItem* items;
    int count;
    int candidateCount;
    int visitedNodes;
    int propagatedEdges;
    double runtimeMs;
    double rankingMs;
} RecommendationSet;

const char* methodKey(PropagationMethod method);
RecommendationSet generateRecommendations(
    Graph* graph,
    int targetUserId,
    PropagationMethod method,
    PropagationConfig config,
    int topK
);
void freeRecommendationSet(RecommendationSet* set);
void nodeLabel(Graph* graph, int nodeId, char* buffer, int bufferSize);

#endif
