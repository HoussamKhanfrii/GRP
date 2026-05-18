#include "utils.h"

#include <errno.h>
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <time.h>

#ifdef _WIN32
#include <direct.h>
#define MKDIR(path) _mkdir(path)
#else
#include <unistd.h>
#define MKDIR(path) mkdir(path, 0755)
#endif

double nowMs(void) {
    return ((double)clock() * 1000.0) / (double)CLOCKS_PER_SEC;
}

double randomDouble(double minValue, double maxValue) {
    double unit = (double)rand() / (double)RAND_MAX;
    return minValue + unit * (maxValue - minValue);
}

int randomInt(int minValue, int maxValue) {
    if (maxValue <= minValue) {
        return minValue;
    }
    return minValue + (rand() % (maxValue - minValue + 1));
}

int fileExists(const char* path) {
    struct stat info;
    return path && stat(path, &info) == 0 && (info.st_mode & S_IFREG);
}

int directoryExists(const char* path) {
    struct stat info;
    return path && stat(path, &info) == 0 && (info.st_mode & S_IFDIR);
}

int ensureDirectory(const char* path) {
    char buffer[512];
    size_t length;

    if (!path || !*path) {
        return 0;
    }
    if (directoryExists(path)) {
        return 1;
    }

    length = strlen(path);
    if (length >= sizeof(buffer)) {
        return 0;
    }
    strcpy(buffer, path);

    for (size_t i = 1; i < length; i++) {
        if (buffer[i] == '/' || buffer[i] == '\\') {
            char saved = buffer[i];
            buffer[i] = '\0';
            if (strlen(buffer) > 0 && !directoryExists(buffer)) {
                if (MKDIR(buffer) != 0 && errno != EEXIST) {
                    buffer[i] = saved;
                    return 0;
                }
            }
            buffer[i] = saved;
        }
    }

    if (!directoryExists(buffer)) {
        if (MKDIR(buffer) != 0 && errno != EEXIST) {
            return 0;
        }
    }
    return 1;
}

int copyFileContents(const char* sourcePath, const char* destinationPath) {
    FILE* source = fopen(sourcePath, "rb");
    FILE* destination;
    char buffer[8192];
    size_t bytesRead;

    if (!source) {
        return 0;
    }

    destination = fopen(destinationPath, "wb");
    if (!destination) {
        fclose(source);
        return 0;
    }

    while ((bytesRead = fread(buffer, 1, sizeof(buffer), source)) > 0) {
        if (fwrite(buffer, 1, bytesRead, destination) != bytesRead) {
            fclose(source);
            fclose(destination);
            return 0;
        }
    }

    fclose(source);
    fclose(destination);
    return 1;
}

void formatIsoTimestamp(char* buffer, int bufferSize) {
    time_t current = time(NULL);
    struct tm* utcTime = gmtime(&current);
    if (!buffer || bufferSize <= 0) {
        return;
    }
    if (!utcTime) {
        snprintf(buffer, (size_t)bufferSize, "1970-01-01T00:00:00Z");
        return;
    }
    strftime(buffer, (size_t)bufferSize, "%Y-%m-%dT%H:%M:%SZ", utcTime);
}

static int samplePowerLawItem(int itemCount) {
    int topCount = (int)ceil((double)itemCount * 0.2);
    if (topCount < 1) {
        topCount = 1;
    }

    if (randomDouble(0.0, 1.0) < 0.8) {
        double skewed = pow(randomDouble(0.0, 1.0), 2.4);
        int item = 1 + (int)(skewed * (double)topCount);
        return item > topCount ? topCount : item;
    }

    return randomInt(topCount, itemCount);
}

static void shuffleInteractions(Interaction* interactions, int count) {
    for (int i = count - 1; i > 0; i--) {
        int j = randomInt(0, i);
        Interaction temp = interactions[i];
        interactions[i] = interactions[j];
        interactions[j] = temp;
    }
}

/*
 * Synthetic bipartite generator with uniqueness tracking.
 * Time complexity: expected O(M), where M is the requested interaction count.
 * Space complexity: O(U * I) for duplicate detection plus O(M) interactions.
 */
Dataset generateSyntheticDataset(
    int userCount,
    int itemCount,
    int interactionCount,
    DistributionType distribution,
    double minWeight,
    double maxWeight,
    unsigned int seed,
    double testRatio
) {
    Dataset dataset;
    long long possibleEdges = (long long)userCount * (long long)itemCount;
    unsigned char* used;
    Interaction* all;
    int generated = 0;
    int testCount;

    dataset.userCount = userCount;
    dataset.itemCount = itemCount;
    dataset.totalInteractions = 0;
    dataset.trainCount = 0;
    dataset.testCount = 0;
    dataset.train = NULL;
    dataset.test = NULL;

    if (interactionCount < 0) {
        interactionCount = 0;
    }
    if ((long long)interactionCount > possibleEdges) {
        interactionCount = (int)possibleEdges;
    }

    srand(seed);
    used = (unsigned char*)calloc((size_t)possibleEdges, sizeof(unsigned char));
    all = (Interaction*)malloc((size_t)interactionCount * sizeof(Interaction));
    if ((interactionCount > 0 && !all) || !used) {
        fprintf(stderr, "Failed to allocate synthetic dataset.\n");
        free(used);
        free(all);
        exit(EXIT_FAILURE);
    }

    while (generated < interactionCount) {
        int userId = randomInt(1, userCount);
        int itemId = distribution == DISTRIBUTION_POWER_LAW ? samplePowerLawItem(itemCount) : randomInt(1, itemCount);
        long long index = ((long long)userId - 1) * (long long)itemCount + ((long long)itemId - 1);
        int attempts = 0;

        while (used[index] && attempts < 32) {
            userId = randomInt(1, userCount);
            itemId = distribution == DISTRIBUTION_POWER_LAW ? samplePowerLawItem(itemCount) : randomInt(1, itemCount);
            index = ((long long)userId - 1) * (long long)itemCount + ((long long)itemId - 1);
            attempts++;
        }

        if (used[index]) {
            int found = 0;
            for (long long scan = 0; scan < possibleEdges; scan++) {
                if (!used[scan]) {
                    userId = (int)(scan / itemCount) + 1;
                    itemId = (int)(scan % itemCount) + 1;
                    index = scan;
                    found = 1;
                    break;
                }
            }
            if (!found) {
                break;
            }
        }

        used[index] = 1;
        all[generated].userId = userId;
        all[generated].itemId = itemId;
        all[generated].weight = randomDouble(minWeight, maxWeight);
        generated++;
    }

    shuffleInteractions(all, generated);

    if (testRatio < 0.0) {
        testRatio = 0.0;
    }
    if (testRatio > 0.8) {
        testRatio = 0.8;
    }

    testCount = (int)((double)generated * testRatio);
    if (testCount < 1 && generated > 1) {
        testCount = 1;
    }
    if (testCount >= generated && generated > 0) {
        testCount = generated - 1;
    }

    dataset.totalInteractions = generated;
    dataset.testCount = testCount;
    dataset.trainCount = generated - testCount;
    dataset.train = (Interaction*)malloc((size_t)dataset.trainCount * sizeof(Interaction));
    dataset.test = (Interaction*)malloc((size_t)dataset.testCount * sizeof(Interaction));

    if ((dataset.trainCount > 0 && !dataset.train) || (dataset.testCount > 0 && !dataset.test)) {
        fprintf(stderr, "Failed to allocate train/test split.\n");
        free(used);
        free(all);
        free(dataset.train);
        free(dataset.test);
        exit(EXIT_FAILURE);
    }

    for (int i = 0; i < dataset.testCount; i++) {
        dataset.test[i] = all[i];
    }
    for (int i = 0; i < dataset.trainCount; i++) {
        dataset.train[i] = all[dataset.testCount + i];
    }

    free(used);
    free(all);
    return dataset;
}

Dataset generateSyntheticDatasetByDensity(
    int userCount,
    int itemCount,
    double density,
    DistributionType distribution,
    double minWeight,
    double maxWeight,
    unsigned int seed,
    double testRatio
) {
    long long possibleEdges = (long long)userCount * (long long)itemCount;
    int interactionCount;

    if (density < 0.0) {
        density = 0.0;
    }
    if (density > 1.0) {
        density = 1.0;
    }

    interactionCount = (int)((double)possibleEdges * density);
    if (interactionCount < 1 && density > 0.0) {
        interactionCount = 1;
    }

    return generateSyntheticDataset(
        userCount,
        itemCount,
        interactionCount,
        distribution,
        minWeight,
        maxWeight,
        seed,
        testRatio
    );
}

void freeDataset(Dataset* dataset) {
    if (!dataset) {
        return;
    }
    free(dataset->train);
    free(dataset->test);
    dataset->train = NULL;
    dataset->test = NULL;
    dataset->trainCount = 0;
    dataset->testCount = 0;
    dataset->totalInteractions = 0;
}
