#ifndef JSON_EXPORTER_H
#define JSON_EXPORTER_H

#include "experiments.h"

char* detectDashboardOutputPath(void);
int exportDashboardJson(
    const char* outputPath,
    Graph* graph,
    ExperimentResults* experiments,
    RecommendationSet* recommendationSets,
    int recommendationSetCount,
    int dashboardUserCount,
    PropagationMethod* methods,
    int methodCount
);

#endif
