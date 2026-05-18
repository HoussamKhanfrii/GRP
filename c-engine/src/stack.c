#include "stack.h"

#include <stdio.h>
#include <stdlib.h>

Stack* createStack(void) {
    Stack* stack = (Stack*)malloc(sizeof(Stack));
    if (!stack) {
        fprintf(stderr, "Failed to allocate stack.\n");
        exit(EXIT_FAILURE);
    }
    stack->top = NULL;
    stack->size = 0;
    return stack;
}

void push(Stack* stack, int value) {
    if (!stack) {
        return;
    }
    StackNode* node = (StackNode*)malloc(sizeof(StackNode));
    if (!node) {
        fprintf(stderr, "Failed to allocate stack node.\n");
        exit(EXIT_FAILURE);
    }
    node->value = value;
    node->next = stack->top;
    stack->top = node;
    stack->size++;
}

int pop(Stack* stack) {
    if (!stack || !stack->top) {
        return -1;
    }
    StackNode* node = stack->top;
    int value = node->value;
    stack->top = node->next;
    free(node);
    stack->size--;
    return value;
}

int isStackEmpty(Stack* stack) {
    return !stack || stack->top == NULL;
}

void freeStack(Stack* stack) {
    if (!stack) {
        return;
    }
    while (!isStackEmpty(stack)) {
        (void)pop(stack);
    }
    free(stack);
}
