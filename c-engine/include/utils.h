#ifndef UTILS_H
#define UTILS_H

#include <stdio.h>

typedef enum DistributionType {
    DISTRIBUTION_UNIFORM = 0,
    DISTRIBUTION_POWER_LAW = 1
} DistributionType;

typedef struct Interaction {
    int userId;
    int itemId;
    double weight;
} Interaction;

typedef struct Dataset {
    int userCount;
    int itemCount;
    int totalInteractions;
    int trainCount;
    int testCount;
    Interaction* train;
    Interaction* test;
} Dataset;

double nowMs(void);
double randomDouble(double minValue, double maxValue);
int randomInt(int minValue, int maxValue);
int ensureDirectory(const char* path);
int fileExists(const char* path);
int directoryExists(const char* path);
int copyFileContents(const char* sourcePath, const char* destinationPath);
void formatIsoTimestamp(char* buffer, int bufferSize);
Dataset generateSyntheticDataset(
    int userCount,
    int itemCount,
    int interactionCount,
    DistributionType distribution,
    double minWeight,
    double maxWeight,
    unsigned int seed,
    double testRatio
);
Dataset generateSyntheticDatasetByDensity(
    int userCount,
    int itemCount,
    double density,
    DistributionType distribution,
    double minWeight,
    double maxWeight,
    unsigned int seed,
    double testRatio
);
void freeDataset(Dataset* dataset);

#endif
