import os

# Graph
NUM_USERS = 500
NUM_ITEMS = 1000
DENSITY = 0.05
RECENCY_LAMBDA = 0.01

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data_out")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
PLOT_DIR = os.path.join(BASE_DIR, "plots")

# Seed
SEED = 42
