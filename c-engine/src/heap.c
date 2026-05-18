#include "heap.h"

#include <stdio.h>
#include <stdlib.h>

static void swapNodes(HeapNode* a, HeapNode* b) {
    HeapNode temp = *a;
    *a = *b;
    *b = temp;
}

MinHeap* createHeap(int capacity) {
    MinHeap* heap = (MinHeap*)malloc(sizeof(MinHeap));
    if (!heap) {
        fprintf(stderr, "Failed to allocate heap.\n");
        exit(EXIT_FAILURE);
    }
    heap->capacity = capacity > 0 ? capacity : 1;
    heap->size = 0;
    heap->data = (HeapNode*)malloc((size_t)heap->capacity * sizeof(HeapNode));
    if (!heap->data) {
        fprintf(stderr, "Failed to allocate heap data.\n");
        free(heap);
        exit(EXIT_FAILURE);
    }
    return heap;
}

/*
 * Min-heap insertion.
 * Time complexity: O(log K), where K is heap capacity.
 */
void heapPush(MinHeap* heap, HeapNode node) {
    if (!heap) {
        return;
    }

    if (heap->size >= heap->capacity) {
        if (node.score <= heap->data[0].score) {
            return;
        }
        heap->data[0] = node;
        heapifyDown(heap, 0);
        return;
    }

    heap->data[heap->size] = node;
    heapifyUp(heap, heap->size);
    heap->size++;
}

/*
 * Removes the minimum score currently stored.
 * Time complexity: O(log K).
 */
HeapNode heapPop(MinHeap* heap) {
    HeapNode empty = {0, 0.0};
    if (!heap || heap->size == 0) {
        return empty;
    }

    HeapNode result = heap->data[0];
    heap->size--;
    if (heap->size > 0) {
        heap->data[0] = heap->data[heap->size];
        heapifyDown(heap, 0);
    }
    return result;
}

void heapifyUp(MinHeap* heap, int index) {
    while (index > 0) {
        int parent = (index - 1) / 2;
        if (heap->data[parent].score <= heap->data[index].score) {
            break;
        }
        swapNodes(&heap->data[parent], &heap->data[index]);
        index = parent;
    }
}

void heapifyDown(MinHeap* heap, int index) {
    while (1) {
        int smallest = index;
        int left = index * 2 + 1;
        int right = index * 2 + 2;

        if (left < heap->size && heap->data[left].score < heap->data[smallest].score) {
            smallest = left;
        }
        if (right < heap->size && heap->data[right].score < heap->data[smallest].score) {
            smallest = right;
        }
        if (smallest == index) {
            break;
        }
        swapNodes(&heap->data[index], &heap->data[smallest]);
        index = smallest;
    }
}

void freeHeap(MinHeap* heap) {
    if (!heap) {
        return;
    }
    free(heap->data);
    free(heap);
}
