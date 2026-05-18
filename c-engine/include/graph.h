#ifndef GRAPH_H
#define GRAPH_H

typedef struct EdgeNode {
    int neighborId;
    double weight;
    struct EdgeNode* next;
} EdgeNode;

typedef struct PopularItem {
    int itemId;
    int degree;
    double weightSum;
} PopularItem;

typedef struct Graph {
    int userCount;
    int itemCount;
    int totalNodes;
    int edgeCount;
    EdgeNode** adjacencyList;
} Graph;

Graph* createGraph(int userCount, int itemCount);
void addInteraction(Graph* graph, int userId, int itemId, double weight);
EdgeNode* getNeighbors(Graph* graph, int nodeId);
int getDegree(Graph* graph, int nodeId);
void printGraphSummary(Graph* graph);
double computeDensity(Graph* graph);
double computeSparsity(Graph* graph);
double computeAverageDegree(Graph* graph);
int* computeDegreeDistribution(Graph* graph, int* maxDegreeOut);
void computePopularItems(Graph* graph, PopularItem* topItems, int topN);
int graphHasInteraction(Graph* graph, int userId, int itemId);
double graphNodeWeightSum(Graph* graph, int nodeId);
double estimateGraphMemoryMB(Graph* graph);
void freeGraph(Graph* graph);

int userNodeId(int userId);
int itemNodeId(Graph* graph, int itemId);
int nodeToUserId(int nodeId);
int nodeToItemId(Graph* graph, int nodeId);
int isUserNode(Graph* graph, int nodeId);
int isItemNode(Graph* graph, int nodeId);

#endif
