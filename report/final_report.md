# Graph-Based Recommendation Propagation Engine

## Introduction
Graph-based recommendation models capture multi-hop influence and structural context beyond direct co-occurrence. This report presents a propagation-driven framework that implements multiple algorithms and evaluates them under controlled experiments.

## Problem Statement
Traditional collaborative filtering can struggle with sparsity and limited interpretability. We aim to design a graph-centric pipeline that supports explainable multi-hop propagation, systematic benchmarking, and scalability analysis.

## Objectives
- Build a modular graph recommendation engine
- Implement multiple propagation strategies
- Evaluate quality, runtime, and memory behavior
- Provide a visualization dashboard for analysis

## Graph-Based Recommendation Background
Propagation methods compute relevance by flowing signal through connections. In a user item graph, this enables recommendations that reflect not only direct interactions but also multi-step relationships.

## Proposed Architecture
The system is composed of data generation and loading, graph storage and updates, propagation algorithms, recommendation ranking, evaluation metrics, and experiments. Outputs are recorded as CSV and visualized in a React dashboard.

## Dataset Generation
Synthetic interactions are generated with configurable users, items, density, sparsity, degree distributions, and weighted interactions. A train test splitter hides interactions for evaluation.

## Graph Construction
Interactions are mapped to a bipartite graph with adjacency list storage. The graph supports fast neighbor traversal and dynamic updates without full rebuilds.

## Propagation Algorithms
- Neighborhood Expansion: BFS up to a depth with hop decay
- Random Walk with Restart: iterative probability diffusion with restart
- Spreading Activation: activation flow with decay and threshold
- Weighted Influence Diffusion: weight-aware normalization and spread

## Recommendation Ranking
Candidate items are filtered to remove seen interactions and low scores, then ranked via sorting or a min-heap for large candidate sets. Optional path tracing provides explanation chains.

## Evaluation Metrics
Quality is assessed with Precision@K, Recall@K, F1@K, NDCG@K, HitRate@K, and Coverage. Performance metrics capture runtime, candidate counts, and visited nodes.

## Experimental Setup
Experiments vary graph size, sparsity, degree imbalance, and propagation depth. Each configuration generates a fresh graph, computes recommendations, and records metrics.

## Results and Discussion
Propagation depth improves recall up to a point, after which noise and runtime grow. Random walk and diffusion methods show stronger coverage on sparse graphs, while neighborhood expansion remains fast and interpretable.

## Complexity Analysis
- Graph construction: O(E)
- Propagation: O(V_d + E_d) within depth d for BFS-based methods
- Random walk: O(I * E)
- Ranking: O(C log C) or O(C log K)

## Limitations
Synthetic data may not fully represent real-world interaction dynamics. Additional experiments with temporal drift and cold-start regimes are possible extensions.

## Conclusion
The framework demonstrates that propagation-based inference can deliver strong, interpretable recommendations with controllable depth and memory tradeoffs.

## Future Work
- Add temporal decay and session-based graphs
- Integrate implicit feedback and confidence weighting
- Support incremental graph compaction and caching
- Extend the dashboard with interactive filters
