#include "graph.h"

#include <math.h>
#include <stdio.h>
#include <stdlib.h>

static EdgeNode* createEdgeNode(int neighborId, double weight) {
    EdgeNode* node = (EdgeNode*)malloc(sizeof(EdgeNode));
    if (!node) {
        fprintf(stderr, "Failed to allocate edge node.\n");
        exit(EXIT_FAILURE);
    }
    node->neighborId = neighborId;
    node->weight = weight;
    node->next = NULL;
    return node;
}

Graph* createGraph(int userCount, int itemCount) {
    Graph* graph = (Graph*)malloc(sizeof(Graph));
    if (!graph) {
        fprintf(stderr, "Failed to allocate graph.\n");
        exit(EXIT_FAILURE);
    }

    graph->userCount = userCount;
    graph->itemCount = itemCount;
    graph->totalNodes = userCount + itemCount;
    graph->edgeCount = 0;
    graph->adjacencyList = (EdgeNode**)calloc((size_t)graph->totalNodes, sizeof(EdgeNode*));
    if (!graph->adjacencyList) {
        fprintf(stderr, "Failed to allocate adjacency list.\n");
        free(graph);
        exit(EXIT_FAILURE);
    }

    return graph;
}

/*
 * Adds one user-item interaction as an undirected bipartite edge.
 * Time complexity: O(1) because each linked-list insertion is at the head.
 * Graph construction for |E| interactions is O(|E|).
 */
void addInteraction(Graph* graph, int userId, int itemId, double weight) {
    if (!graph || userId < 1 || userId > graph->userCount || itemId < 1 || itemId > graph->itemCount) {
        return;
    }

    int userNode = userNodeId(userId);
    int itemNode = itemNodeId(graph, itemId);

    EdgeNode* userEdge = createEdgeNode(itemNode, weight);
    userEdge->next = graph->adjacencyList[userNode];
    graph->adjacencyList[userNode] = userEdge;

    EdgeNode* itemEdge = createEdgeNode(userNode, weight);
    itemEdge->next = graph->adjacencyList[itemNode];
    graph->adjacencyList[itemNode] = itemEdge;

    graph->edgeCount++;
}

EdgeNode* getNeighbors(Graph* graph, int nodeId) {
    if (!graph || nodeId < 0 || nodeId >= graph->totalNodes) {
        return NULL;
    }
    return graph->adjacencyList[nodeId];
}

/*
 * Linked-list degree scan.
 * Time complexity: O(deg(v)).
 */
int getDegree(Graph* graph, int nodeId) {
    int degree = 0;
    EdgeNode* edge = getNeighbors(graph, nodeId);
    while (edge) {
        degree++;
        edge = edge->next;
    }
    return degree;
}

void printGraphSummary(Graph* graph) {
    if (!graph) {
        return;
    }
    printf("Graph summary:\n");
    printf("  Users: %d\n", graph->userCount);
    printf("  Items: %d\n", graph->itemCount);
    printf("  Interactions: %d\n", graph->edgeCount);
    printf("  Density: %.6f\n", computeDensity(graph));
    printf("  Sparsity: %.6f\n", computeSparsity(graph));
    printf("  Average degree: %.3f\n", computeAverageDegree(graph));
}

double computeDensity(Graph* graph) {
    if (!graph || graph->userCount <= 0 || graph->itemCount <= 0) {
        return 0.0;
    }
    return (double)graph->edgeCount / ((double)graph->userCount * (double)graph->itemCount);
}

double computeSparsity(Graph* graph) {
    double density = computeDensity(graph);
    return density >= 1.0 ? 0.0 : 1.0 - density;
}

double computeAverageDegree(Graph* graph) {
    if (!graph || graph->totalNodes == 0) {
        return 0.0;
    }
    return (double)(2 * graph->edgeCount) / (double)graph->totalNodes;
}

/*
 * Builds a histogram mapping degree -> node count.
 * Time complexity: O(|V| + |E|), because each adjacency list is scanned once.
 */
int* computeDegreeDistribution(Graph* graph, int* maxDegreeOut) {
    if (!graph) {
        *maxDegreeOut = 0;
        return NULL;
    }

    int maxDegree = 0;
    int* degrees = (int*)calloc((size_t)graph->totalNodes, sizeof(int));
    if (!degrees) {
        fprintf(stderr, "Failed to allocate degree scratch array.\n");
        exit(EXIT_FAILURE);
    }

    for (int node = 0; node < graph->totalNodes; node++) {
        degrees[node] = getDegree(graph, node);
        if (degrees[node] > maxDegree) {
            maxDegree = degrees[node];
        }
    }

    int* distribution = (int*)calloc((size_t)maxDegree + 1, sizeof(int));
    if (!distribution) {
        fprintf(stderr, "Failed to allocate degree distribution.\n");
        free(degrees);
        exit(EXIT_FAILURE);
    }

    for (int node = 0; node < graph->totalNodes; node++) {
        distribution[degrees[node]]++;
    }

    free(degrees);
    *maxDegreeOut = maxDegree;
    return distribution;
}

/*
 * Selects the top-N item nodes by degree using a small insertion list.
 * Time complexity: O(|I| * N + |E_item|), where N is the requested top count.
 */
void computePopularItems(Graph* graph, PopularItem* topItems, int topN) {
    if (!graph || !topItems || topN <= 0) {
        return;
    }

    for (int i = 0; i < topN; i++) {
        topItems[i].itemId = 0;
        topItems[i].degree = 0;
        topItems[i].weightSum = 0.0;
    }

    for (int itemId = 1; itemId <= graph->itemCount; itemId++) {
        int nodeId = itemNodeId(graph, itemId);
        int degree = 0;
        double weightSum = 0.0;
        EdgeNode* edge = graph->adjacencyList[nodeId];
        while (edge) {
            degree++;
            weightSum += edge->weight;
            edge = edge->next;
        }

        for (int pos = 0; pos < topN; pos++) {
            if (degree > topItems[pos].degree) {
                for (int shift = topN - 1; shift > pos; shift--) {
                    topItems[shift] = topItems[shift - 1];
                }
                topItems[pos].itemId = itemId;
                topItems[pos].degree = degree;
                topItems[pos].weightSum = weightSum;
                break;
            }
        }
    }
}

int graphHasInteraction(Graph* graph, int userId, int itemId) {
    if (!graph || userId < 1 || itemId < 1) {
        return 0;
    }
    int userNode = userNodeId(userId);
    int itemNode = itemNodeId(graph, itemId);
    EdgeNode* edge = graph->adjacencyList[userNode];
    while (edge) {
        if (edge->neighborId == itemNode) {
            return 1;
        }
        edge = edge->next;
    }
    return 0;
}

double graphNodeWeightSum(Graph* graph, int nodeId) {
    double sum = 0.0;
    EdgeNode* edge = getNeighbors(graph, nodeId);
    while (edge) {
        sum += edge->weight;
        edge = edge->next;
    }
    return sum;
}

/*
 * Estimates adjacency-list memory owned by the graph.
 * Space complexity of the graph is O(|V| + |E|): one pointer per node and two
 * EdgeNode records per undirected user-item interaction.
 */
double estimateGraphMemoryMB(Graph* graph) {
    if (!graph) {
        return 0.0;
    }
    double bytes = (double)sizeof(Graph);
    bytes += (double)graph->totalNodes * (double)sizeof(EdgeNode*);
    bytes += (double)(2 * graph->edgeCount) * (double)sizeof(EdgeNode);
    return bytes / (1024.0 * 1024.0);
}

void freeGraph(Graph* graph) {
    if (!graph) {
        return;
    }

    for (int node = 0; node < graph->totalNodes; node++) {
        EdgeNode* edge = graph->adjacencyList[node];
        while (edge) {
            EdgeNode* next = edge->next;
            free(edge);
            edge = next;
        }
    }

    free(graph->adjacencyList);
    free(graph);
}

int userNodeId(int userId) {
    return userId - 1;
}

int itemNodeId(Graph* graph, int itemId) {
    return graph->userCount + itemId - 1;
}

int nodeToUserId(int nodeId) {
    return nodeId + 1;
}

int nodeToItemId(Graph* graph, int nodeId) {
    return nodeId - graph->userCount + 1;
}

int isUserNode(Graph* graph, int nodeId) {
    return graph && nodeId >= 0 && nodeId < graph->userCount;
}

int isItemNode(Graph* graph, int nodeId) {
    return graph && nodeId >= graph->userCount && nodeId < graph->totalNodes;
}
