#include "metrics.h"

#include <math.h>
#include <stdlib.h>

int datasetUserHasTestItem(Dataset* dataset, int userId, int itemId) {
    if (!dataset) {
        return 0;
    }
    for (int i = 0; i < dataset->testCount; i++) {
        if (dataset->test[i].userId == userId && dataset->test[i].itemId == itemId) {
            return 1;
        }
    }
    return 0;
}

int datasetUserTestCount(Dataset* dataset, int userId) {
    int count = 0;
    if (!dataset) {
        return 0;
    }
    for (int i = 0; i < dataset->testCount; i++) {
        if (dataset->test[i].userId == userId) {
            count++;
        }
    }
    return count;
}

/*
 * Computes Precision@K, Recall@K, F1@K, NDCG@K, and item coverage.
 * Time complexity: O(S * K * T), where S is recommendation set count and T
 * is test interaction count. T is small in the sampled academic runs.
 */
MetricsResult evaluateRecommendationSets(
    RecommendationSet* sets,
    int setCount,
    Dataset* dataset,
    int itemCount,
    int topK
) {
    MetricsResult result;
    int evaluated = 0;
    int* covered = (int*)calloc((size_t)itemCount + 1, sizeof(int));
    int coveredCount = 0;

    result.precision = 0.0;
    result.recall = 0.0;
    result.f1 = 0.0;
    result.ndcg = 0.0;
    result.coverage = 0.0;

    if (!sets || setCount <= 0 || !dataset || topK <= 0 || !covered) {
        free(covered);
        return result;
    }

    for (int i = 0; i < setCount; i++) {
        int relevantCount = datasetUserTestCount(dataset, sets[i].userId);
        int hits = 0;
        double dcg = 0.0;
        double idcg = 0.0;
        int limit = sets[i].count < topK ? sets[i].count : topK;

        for (int rank = 0; rank < limit; rank++) {
            int itemId = sets[i].items[rank].itemId;
            if (!covered[itemId]) {
                covered[itemId] = 1;
                coveredCount++;
            }
            if (datasetUserHasTestItem(dataset, sets[i].userId, itemId)) {
                hits++;
                dcg += 1.0 / (log((double)rank + 2.0) / log(2.0));
            }
        }

        if (relevantCount <= 0) {
            continue;
        }

        for (int rank = 0; rank < relevantCount && rank < topK; rank++) {
            idcg += 1.0 / (log((double)rank + 2.0) / log(2.0));
        }

        result.precision += (double)hits / (double)topK;
        result.recall += (double)hits / (double)relevantCount;
        result.ndcg += idcg > 0.0 ? dcg / idcg : 0.0;
        evaluated++;
    }

    if (evaluated > 0) {
        result.precision /= (double)evaluated;
        result.recall /= (double)evaluated;
        result.ndcg /= (double)evaluated;
        if (result.precision + result.recall > 0.0) {
            result.f1 = 2.0 * result.precision * result.recall / (result.precision + result.recall);
        }
    }

    result.coverage = itemCount > 0 ? (double)coveredCount / (double)itemCount : 0.0;
    free(covered);
    return result;
}

double computePopularItemRatio(Graph* graph, RecommendationSet* sets, int setCount) {
    int topCount;
    PopularItem* topItems;
    int* isPopular;
    int popularRecommendations = 0;
    int totalRecommendations = 0;

    if (!graph || !sets || setCount <= 0) {
        return 0.0;
    }

    topCount = (int)ceil((double)graph->itemCount * 0.1);
    if (topCount < 1) {
        topCount = 1;
    }

    topItems = (PopularItem*)calloc((size_t)topCount, sizeof(PopularItem));
    isPopular = (int*)calloc((size_t)graph->itemCount + 1, sizeof(int));
    if (!topItems || !isPopular) {
        free(topItems);
        free(isPopular);
        return 0.0;
    }

    computePopularItems(graph, topItems, topCount);
    for (int i = 0; i < topCount; i++) {
        if (topItems[i].itemId > 0) {
            isPopular[topItems[i].itemId] = 1;
        }
    }

    for (int i = 0; i < setCount; i++) {
        for (int j = 0; j < sets[i].count; j++) {
            totalRecommendations++;
            if (isPopular[sets[i].items[j].itemId]) {
                popularRecommendations++;
            }
        }
    }

    free(topItems);
    free(isPopular);
    return totalRecommendations > 0 ? (double)popularRecommendations / (double)totalRecommendations : 0.0;
}

double computeRecommendationDiversity(RecommendationSet* sets, int setCount, int itemCount) {
    int* seen;
    int unique = 0;
    int total = 0;

    if (!sets || setCount <= 0 || itemCount <= 0) {
        return 0.0;
    }

    seen = (int*)calloc((size_t)itemCount + 1, sizeof(int));
    if (!seen) {
        return 0.0;
    }

    for (int i = 0; i < setCount; i++) {
        for (int j = 0; j < sets[i].count; j++) {
            int itemId = sets[i].items[j].itemId;
            total++;
            if (!seen[itemId]) {
                seen[itemId] = 1;
                unique++;
            }
        }
    }

    free(seen);
    return total > 0 ? (double)unique / (double)total : 0.0;
}
