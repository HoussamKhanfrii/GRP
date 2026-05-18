CC = gcc
CFLAGS ?= -std=c99 -Wall -Wextra -O2 -Iinclude
LDFLAGS ?= -lm
TARGET ?= graph_engine
SOURCES := $(wildcard src/*.c)

ifeq ($(OS),Windows_NT)
EXE := $(TARGET).exe
RUN_CMD := .\$(EXE)
CLEAN_CMD := if exist "$(EXE)" del /Q "$(EXE)" & if exist "$(TARGET)" del /Q "$(TARGET)"
else
EXE := $(TARGET)
RUN_CMD := ./$(EXE)
CLEAN_CMD := rm -f "$(TARGET)" "$(TARGET).exe"
endif

.PHONY: all run clean

all: $(EXE)

$(EXE): $(SOURCES)
	$(CC) $(CFLAGS) $(SOURCES) -o $(EXE) $(LDFLAGS)

run: $(EXE)
	$(RUN_CMD)

clean:
	$(CLEAN_CMD)
