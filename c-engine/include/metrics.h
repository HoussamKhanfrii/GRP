#ifndef METRICS_H
#define METRICS_H

#include "recommendation.h"
#include "utils.h"

typedef struct MetricsResult {
    double precision;
    double recall;
    double f1;
    double ndcg;
    double coverage;
} MetricsResult;

int datasetUserHasTestItem(Dataset* dataset, int userId, int itemId);
int datasetUserTestCount(Dataset* dataset, int userId);
MetricsResult evaluateRecommendationSets(
    RecommendationSet* sets,
    int setCount,
    Dataset* dataset,
    int itemCount,
    int topK
);
double computePopularItemRatio(Graph* graph, RecommendationSet* sets, int setCount);
double computeRecommendationDiversity(RecommendationSet* sets, int setCount, int itemCount);

#endif
