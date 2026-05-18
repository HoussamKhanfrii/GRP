#include "queue.h"

#include <stdio.h>
#include <stdlib.h>

Queue* createQueue(void) {
    Queue* queue = (Queue*)malloc(sizeof(Queue));
    if (!queue) {
        fprintf(stderr, "Failed to allocate queue.\n");
        exit(EXIT_FAILURE);
    }
    queue->front = NULL;
    queue->rear = NULL;
    queue->size = 0;
    return queue;
}

void enqueue(Queue* queue, int value) {
    if (!queue) {
        return;
    }
    QueueNode* node = (QueueNode*)malloc(sizeof(QueueNode));
    if (!node) {
        fprintf(stderr, "Failed to allocate queue node.\n");
        exit(EXIT_FAILURE);
    }
    node->value = value;
    node->next = NULL;

    if (queue->rear) {
        queue->rear->next = node;
    } else {
        queue->front = node;
    }
    queue->rear = node;
    queue->size++;
}

int dequeue(Queue* queue) {
    if (!queue || !queue->front) {
        return -1;
    }
    QueueNode* node = queue->front;
    int value = node->value;
    queue->front = node->next;
    if (!queue->front) {
        queue->rear = NULL;
    }
    free(node);
    queue->size--;
    return value;
}

int isQueueEmpty(Queue* queue) {
    return !queue || queue->front == NULL;
}

void freeQueue(Queue* queue) {
    if (!queue) {
        return;
    }
    while (!isQueueEmpty(queue)) {
        (void)dequeue(queue);
    }
    free(queue);
}
