#ifndef HEAP_H
#define HEAP_H

typedef struct HeapNode {
    int itemId;
    double score;
} HeapNode;

typedef struct MinHeap {
    HeapNode* data;
    int size;
    int capacity;
} MinHeap;

MinHeap* createHeap(int capacity);
void heapPush(MinHeap* heap, HeapNode node);
HeapNode heapPop(MinHeap* heap);
void heapifyUp(MinHeap* heap, int index);
void heapifyDown(MinHeap* heap, int index);
void freeHeap(MinHeap* heap);

#endif
