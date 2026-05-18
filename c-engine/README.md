# C Graph-Based Recommendation Propagation Engine

This folder contains the academic algorithmic core of the project. The React dashboard remains a visualization layer only; this C program generates the same CSV files and `engine-output.json` shape consumed by the dashboard through:

```ts
fetch("/engine-output.json")
```

The Vite config uses `dashboard` as the frontend root, so the engine detects and writes:

```text
../dashboard/public/engine-output.json
```

That file is served by Vite as `/engine-output.json`.

## Course Concepts Applied

- `struct`: graph nodes, interactions, datasets, benchmark rows, recommendation rows, heap nodes.
- Arrays: scores, visited flags, candidate coverage, train/test splits, experiment result rows.
- Linked lists: each graph adjacency list is a linked list of `EdgeNode` records.
- Adjacency lists: the bipartite user-item graph uses `EdgeNode** adjacencyList`.
- Queue: `queue.c` implements BFS for Neighborhood Expansion.
- Stack: `stack.c` reconstructs explanation paths from predecessor links.
- Min-heap / priority queue: `heap.c` keeps Top-K recommendation candidates in `O(log K)` updates.
- Pointers and dynamic memory: all core structures are allocated with `malloc`/`calloc` and released with `free`.
- File writing: `csv_writer.c` writes CSVs; `json_exporter.c` writes dashboard JSON.
- Big-O analysis: core graph, traversal, ranking, and metric functions include complexity comments.
- Empirical runtime: propagation and experiment runs use `clock()`-based millisecond timing.

## Architecture

```text
c-engine/
├── include/
│   ├── graph.h
│   ├── queue.h
│   ├── stack.h
│   ├── heap.h
│   ├── propagation.h
│   ├── recommendation.h
│   ├── metrics.h
│   ├── experiments.h
│   ├── csv_writer.h
│   ├── json_exporter.h
│   └── utils.h
├── src/
│   ├── graph.c
│   ├── queue.c
│   ├── stack.c
│   ├── heap.c
│   ├── propagation.c
│   ├── recommendation.c
│   ├── metrics.c
│   ├── experiments.c
│   ├── csv_writer.c
│   ├── json_exporter.c
│   ├── utils.c
│   └── main.c
├── results/
├── Makefile
└── README.md
```

## Compile

With `make`:

```bash
make
```

Windows-friendly MinGW/MSYS2 command if `make` is unavailable:

```bash
gcc -Iinclude src/*.c -o graph_engine.exe
```

If your GCC environment requires an explicit math library link, use:

```bash
gcc -std=c99 -Wall -Wextra -O2 -Iinclude src/*.c -o graph_engine.exe -lm
```

## Run

With `make`:

```bash
make run
```

On Windows after direct compilation:

```bash
graph_engine.exe
```

Clean build outputs:

```bash
make clean
```

## Outputs

The engine writes CSV results to:

```text
c-engine/results/
```

It also mirrors equivalent files to the root project:

```text
../results/
```

Generated CSVs:

```text
benchmark_results.csv
quality_results.csv
experiment_depth.csv
experiment_graph_size.csv
experiment_sparsity.csv
experiment_degree_imbalance.csv
memory_results.csv
```

Dashboard JSON:

```text
../dashboard/public/engine-output.json
```

## Synthetic Data and Split

The generator creates a bipartite graph with configurable users, items, interactions, distribution, weight range, and random seed. It supports uniform and power-law-like item sampling. The power-law-like option intentionally concentrates most edges on a smaller head of popular items.

The train/test split is a deterministic random holdout using the configured seed. Train interactions build the graph. Hidden test interactions are used for Precision@K, Recall@K, F1@K, NDCG@K, and coverage. Users with no hidden test interactions are skipped during metric averaging.

No recommendation library is used. All propagation, ranking, metrics, CSV export, and JSON export are implemented directly in C.
