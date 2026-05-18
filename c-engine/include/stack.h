#ifndef STACK_H
#define STACK_H

typedef struct StackNode {
    int value;
    struct StackNode* next;
} StackNode;

typedef struct Stack {
    StackNode* top;
    int size;
} Stack;

Stack* createStack(void);
void push(Stack* stack, int value);
int pop(Stack* stack);
int isStackEmpty(Stack* stack);
void freeStack(Stack* stack);

#endif
