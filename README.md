# Graph Recommendation Propagation Engine (GRP)

A comprehensive, full-stack experimental platform designed to generate, traverse, and evaluate bipartite interaction graphs for recommendation systems. This project bridges a robust Node.js/TypeScript backend simulating highly configurable graph topologies with a dynamic React dashboard to visualize propagation algorithms, performance benchmarks, and detailed experimental metrics.

---

## 📖 Table of Contents
1. [Core Capabilities](#core-capabilities)
2. [Graph Algorithms Deep Dive](#graph-algorithms-deep-dive)
3. [Experimental Framework](#experimental-framework)
4. [Project Structure](#project-structure)
5. [Tech Stack](#tech-stack)
6. [Quickstart Guide](#quickstart-guide)
7. [Modifying the Engine](#modifying-the-engine)

---

## 🔥 Core Capabilities

- **Synthetic Bipartite Data Generation:** An advanced network matrix generator allowing you to manipulate users, items, and edges. Supports forced "power-law" distributions alongside strictly uniform clustering to mimic true real-time dataset sparsity limits (like e-commerce shops or social platform relations).
- **Explainable AI (XAI) Paths:** Instead of "black-box" scores, every recommendation logs an explicit topological trace back to the user indicating exactly *why* a specific target result was generated and via which neighboring node. 
- **Automated Memory Profiling:** Native Node.js `v8` heap snapshots trigger before and after graph construction resolving deep insights into object retention and memory footprints scaling.
- **Dynamic React Dashboard:** Real-time extraction of JSON and CSV data rendered intuitively via React Context providing live metric comparison tables and responsiveness charts.

---

## 🧠 Graph Algorithms Deep Dive

The core engine implements four mathematically distinct propagation approaches natively over adjacency lists:

1. **Neighborhood Expansion**
   * **Mechanism:** Breadth-first traversal evaluating multi-hop node connections explicitly outwards up to $K$ depth. 
   * **Strengths:** Excellent determinism and coverage capability across small network proximities. High processing speed for shallow topologies.

2. **Random Walk with Restart (RWR)**
   * **Mechanism:** Simulates an iterative random walker surfing network connections. The walker has a set uniform probability to teleport straight back to the original source user ($1 - \alpha$), avoiding network drifting and focusing heavily on local communities.
   * **Strengths:** Ideal for maintaining local topological relevance while escaping isolated cold-start boundaries.

3. **Spreading Activation**
   * **Mechanism:** Diffuses initial localized "activation" outward using strict decay factors ($D < 1$). Activations that drop beneath a configurable `minActivation` threshold (e.g., $1e^{-6}$) are brutally pruned from traversal memory constraints to save processing latency.
   * **Strengths:** Computationally scalable across massively connected scale-free networks.

4. **Weighted Influence Diffusion**
   * **Mechanism:** A mathematically normalized form of spreading. Adjacent routes don't just spread, they are penalized or boosted strictly relative to sum of edge degrees powered to a weight exponent factor. 
   * **Strengths:** Prevents popular hub nodes ("super-spreader items") from severely dominating inference scores (degree penalty).

---

## 🔬 Experimental Framework

We provide fully automated suites comparing methodologies natively output continuously inside `/results/*.csv` datasets:
- **Graph Size Boundaries (`experiment_graph_size`):** Scaling matrix definitions iteratively up to 10,000s of users charting the exponential breakdown of latency vs ranking ms.
- **Sparsity Constraints (`experiment_sparsity`):** Progressively removes up to 99.9% of interactions validating which algorithms survive the "Cold Start Problem."
- **Depth Constraints (`experiment_depth`):** Charts topological hop constraints (depth 1 through 5) explicitly cross-referencing latency increases versus aggregate Precision/Recall advantages.
- **Degree Imbalance:** Introduces severely weighted items determining algorithmic resilience against extreme network centralization.

`PerformanceMetrics` captures exactly standard data science evaluations inclusive of *Precision@K*, *Recall@K*, *F1*, and *NDCG@K*.

---

## 📂 Project Structure

```text
📦 GRP (Graph Recommendation Engine)
 ┣ 📂 dashboard/               # Frontend React Application
 ┃ ┣ 📂 components/            # Reusable UI widgets (Charts, Metric Cards, Tables)
 ┃ ┣ 📂 pages/                 # Full analytical views (Experiments, Graph Analysis, Recs)
 ┃ ┣ 📜 App.tsx                # Client Routing logic
 ┃ ┣ 📜 EngineContext.tsx      # Native React Context mapping the backend JSON outputs
 ┃ ┗ ...
 ┣ 📂 src/                     # Backend Node.js / TypeScript Sandbox
 ┃ ┣ 📂 data/                  # Generates raw matrices & executes Train/Test Splitting
 ┃ ┣ 📂 evaluation/            # Profilers (Memory, precision maths)
 ┃ ┣ 📂 experiments/           # Individual scaling suites (Sparsity, Depth, Imbalance)
 ┃ ┣ 📂 graph/                 # Instantiates, formats, and manages Adjacency Node maps
 ┃ ┣ 📂 propagation/           # The algorithms (RWR, Neighborhood, Activation, etc)
 ┃ ┗ 📜 main.ts                # Main CLI Gateway triggering the core simulation routines
 ┣ 📂 results/                 # Automatically populated CSV payload directories
 ┣ 📜 tsconfig.json            # Strict TypeScript architectural settings
 ┣ 📜 vite.config.ts           # Frontend bundling limits and server configurations
 ┗ 📜 README.md
```

---

## 🛠 Tech Stack

- **Backend Logic:** TypeScript, Node.js (`v8` metrics), `tsx` standard execution script
- **Frontend Dashboard:** React 18, Vite (Port: 5174/5173 default)
- **Visuals:** `recharts` for scalable SVG/Canvas graphic data plotting
- **File Control:** Standard IO formatting exporting to `*.csv` and dynamically parsed payloads to `engine-output.json`.

---

## 🚀 How to Run and Validate the Project

**NOTE ON MANUAL IMPLEMENTATION:** This project operates entirely dependency-free for its core logic. The four propagation mechanisms, the graph generation topology, and the Top-K ranking calculations are fully implemented functionally and mathematically from scratch natively using TypeScript. We do **not** delegate recommendations to external machine learning frameworks or graph libraries.

### 1. Install Global Dependencies
```bash
npm install
```

### 2. Generate Engine Outputs (Backend)
Run the core engine. This command explicitly simulates graph creation, runs the four distinct propagation simulations, evaluates experimental benchmarks, and packages the data.
```bash
npm run run:engine
```

### 3. Run Experiments Exclusively
If you want to bypass the dashboard JSON generator and only compile the backend experiments and evaluation runners explicitly into CSV datasets:
```bash
npm run run:experiments
```

### 4. Launch Analytical Dashboard (Frontend)
Boot up the React local frontend environment to parse the generated payloads visually:
```bash
npm run dev
```
Navigate to your active Local port (`http://localhost:5173/` or `http://localhost:5174/`) to explore the functional UI.

### 5. Where Generated Results Are Stored
All explicit experimental outputs mapping node traversals are output strictly into the `/results` directory:
- **`benchmark_results.csv`**: A macro-aggregation displaying overall comparative metrics evaluated against all baseline topologies.
- **`experiment_depth.csv`**: Outputs the latency and ranking metrics mapped against expanding propagation hop definitions ($K=1$ through $K=5$).
- **`experiment_graph_size.csv`**: Documents structural thresholds plotting the exponent curve of algorithm survival across 100 up to 10,000 active nodes.
- **`experiment_sparsity.csv`**: Validates recommendation coverage survivability when density matrices drop iteratively toward 99.9% sparsity.
- **`experiment_degree_imbalance.csv`**: Traces specific logic penalties occurring across algorithms mathematically when testing normal datasets versus power-law (super-spreader) hubs.
- **`memory_results.csv`**: A native `v8` heap delta capturing the hard Memory RAM signatures needed during explicit graph constructions versus ranking calculations.
- **`quality_results.csv`**: Stores explicit mathematical `PerformanceMetrics` logic tracing *Precision*, *Recall*, *NDCG*, and *F1* scores isolated purely on topological evaluation hits.

### 6. Where `engine-output.json` Is Stored
The dynamic, pre-compiled frontend JSON object is securely structured and output strictly to: `dashboard/public/engine-output.json`

### 7. How the Dashboard Consumes `engine-output.json`
Instead of statically importing mock files, `dashboard/EngineContext.tsx` leverages a React HTTP `fetch('/engine-output.json')` asynchronously upon loading the layout. The context parses the monolithic object and distributes the `graphSizeExperiment`, `benchmarkResults`, and real-time mapping arrays downwards to the components effectively wrapping the frontend around live pipeline generations.

### 8. Verifying Generated Feedback (Absence of Mock Data)
The initial static scaffolding files (`dashboard/data/sampleData.ts`) have been permanently destroyed. The frontend UI will display a `Loading Engine Results...` boundary until the browser retrieves `/engine-output.json`. Furthermore, a dynamic graphical badge globally populates inside the interface stating **"Generated Benchmark Results"** mapping your live outputs successfully!

---

## ⚙️ Modifying the Engine
To test new boundaries without altering structural codes, inside `src/main.ts` locate these variables inside the gateway scope:

```ts
const generatorConfig = {
  users: 1000, 
  items: 500,
  interactions: 10000,
  degreeDistribution: "power-law", // Change to 'uniform'
  weightRange: [0.3, 1.2],
  seed: 42
};

const propagationConfig = {
  depth: 3,                  // Expand graph evaluation horizon
  decay: 0.7,
  restartProbability: 0.15,  // Directly influences RWR probabilities
  minActivation: 1e-6,       // Controls spread limits
};
```
Change these items natively and trigger `npm run run:engine` anew!