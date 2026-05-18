#ifndef QUEUE_H
#define QUEUE_H

typedef struct QueueNode {
    int value;
    struct QueueNode* next;
} QueueNode;

typedef struct Queue {
    QueueNode* front;
    QueueNode* rear;
    int size;
} Queue;

Queue* createQueue(void);
void enqueue(Queue* queue, int value);
int dequeue(Queue* queue);
int isQueueEmpty(Queue* queue);
void freeQueue(Queue* queue);

#endif
